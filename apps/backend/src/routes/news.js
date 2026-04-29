import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { broadcastToApprovedAlumni } from '../services/notificationService.js'

const router = express.Router()

const newsSchema = z.object({
  title: z.record(z.string()),
  body: z.record(z.string()),
  imageUrl: z.string().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED').optional()
})

// Get all published news
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let news
    try {
      news = await prisma.newsPost.findMany({
        where: { status: 'PUBLISHED' },
        include: { comments: { include: { author: { select: { email: true } } } } },
        orderBy: { publishedAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      news = clone(mockDb.news.filter((item) => (item.status || 'PUBLISHED') === 'PUBLISHED'))
    }
    res.json(news)
  })
)

// Admin: get all news, including drafts and archived posts.
router.get(
  '/admin/all',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let news
    try {
      news = await prisma.newsPost.findMany({
        include: { comments: { include: { author: { select: { email: true } } } } },
        orderBy: { publishedAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      news = clone(mockDb.news)
    }
    res.json(news)
  })
)

// Get single news post
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    let post
    try {
      post = await prisma.newsPost.findUnique({
        where: { id: req.params.id },
        include: { comments: { include: { author: { select: { email: true, id: true } } } } }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      post = mockDb.news.find((item) => item.id === req.params.id || item.slug === req.params.id)
    }
    if (!post) throw new AppError('Новость не найдена', 404)
    if ((post.status || 'PUBLISHED') !== 'PUBLISHED' && !['ADMIN', 'MODERATOR'].includes(req.user?.role)) {
      throw new AppError('Новость не найдена', 404)
    }
    res.json(clone(post))
  })
)

// Admin: Create news post
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = newsSchema.parse(req.body)
    const slug = data.title.ru?.toLowerCase().replace(/\s+/g, '-') || `news-${Date.now()}`

    let post
    try {
      post = await prisma.newsPost.create({
        data: {
          ...data,
          slug: `${slug}-${Date.now()}`,
          authorName: req.user.email
        }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      post = { id: `news-${Date.now()}`, slug: `${slug}-${Date.now()}`, status: 'PUBLISHED', ...data, authorName: req.user.email, publishedAt: new Date().toISOString(), comments: [] }
      mockDb.news.unshift(post)
      saveMockDb()
      if ((post.status || 'PUBLISHED') === 'PUBLISHED') {
        await broadcastToApprovedAlumni({
          type: 'NEWS_PUBLISHED',
          title: 'Новая новость',
          message: data.title.ru || 'На платформе опубликована новая новость.',
          data: { newsId: post.id }
        })
      }
    }
    res.status(201).json(post)
  })
)

// Admin: Update news post
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = newsSchema.partial().parse(req.body)
    let post
    try {
      post = await prisma.newsPost.update({
        where: { id: req.params.id },
        data
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.news.findIndex((item) => item.id === req.params.id)
      if (index === -1) throw new AppError('Новость не найдена', 404)
      mockDb.news[index] = { ...mockDb.news[index], ...data }
      post = mockDb.news[index]
      saveMockDb()
    }
    res.json(post)
  })
)

// Admin: Delete news post
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    try {
      await prisma.newsPost.delete({ where: { id: req.params.id } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.news.findIndex((item) => item.id === req.params.id)
      if (index === -1) throw new AppError('Новость не найдена', 404)
      mockDb.news.splice(index, 1)
      saveMockDb()
    }
    res.json({ message: 'Новость удалена' })
  })
)

export default router

