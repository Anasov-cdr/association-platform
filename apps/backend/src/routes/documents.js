import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { broadcastToApprovedAlumni } from '../services/notificationService.js'

const router = express.Router()

const documentSchema = z.object({
  title: z.record(z.string()),
  description: z.record(z.string()).optional(),
  category: z.string(),
  fileUrl: z.string().optional().default('#'),
  fileType: z.string().optional().default('PDF'),
  publicationStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED').optional()
})

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let documents
    try {
      documents = await prisma.document.findMany({ where: { publicationStatus: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      documents = clone(mockDb.documents.filter((item) => (item.publicationStatus || 'PUBLISHED') === 'PUBLISHED'))
    }
    res.json(documents)
  })
)

router.get(
  '/admin/all',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let documents
    try {
      documents = await prisma.document.findMany({ orderBy: { publishedAt: 'desc' } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      documents = clone(mockDb.documents)
    }
    res.json(documents)
  })
)

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    let document
    try {
      document = await prisma.document.findUnique({ where: { id: req.params.id } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      document = mockDb.documents.find((item) => item.id === req.params.id)
    }
    if (!document) throw new AppError('Документ не найден', 404)
    if ((document.publicationStatus || 'PUBLISHED') !== 'PUBLISHED' && !['ADMIN', 'MODERATOR'].includes(req.user?.role)) {
      throw new AppError('Документ не найден', 404)
    }
    res.json(clone(document))
  })
)

router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = documentSchema.parse(req.body)
    let document
    try {
      document = await prisma.document.create({ data })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      document = { id: `doc-${Date.now()}`, publicationStatus: 'PUBLISHED', ...data, publishedAt: new Date().toISOString() }
      mockDb.documents.unshift(document)
      saveMockDb()
      if ((document.publicationStatus || 'PUBLISHED') === 'PUBLISHED') {
        await broadcastToApprovedAlumni({
          type: 'DOCUMENT_PUBLISHED',
          title: 'Новый документ',
          message: data.title.ru || 'Опубликован новый документ Ассоциации.',
          data: { documentId: document.id }
        })
      }
    }
    res.status(201).json(document)
  })
)

router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = documentSchema.partial().parse(req.body)
    let document
    try {
      document = await prisma.document.update({ where: { id: req.params.id }, data })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.documents.findIndex((item) => item.id === req.params.id)
      if (index === -1) throw new AppError('Документ не найден', 404)
      mockDb.documents[index] = { ...mockDb.documents[index], ...data }
      document = mockDb.documents[index]
      saveMockDb()
    }
    res.json(document)
  })
)

router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    try {
      await prisma.document.delete({ where: { id: req.params.id } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.documents.findIndex((item) => item.id === req.params.id)
      if (index === -1) throw new AppError('Документ не найден', 404)
      mockDb.documents.splice(index, 1)
      saveMockDb()
    }
    res.json({ message: 'Документ удален' })
  })
)

export default router

