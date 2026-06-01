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
    const { query } = req.query
    let news
    try {
      const where = { status: 'PUBLISHED' }
      if (query) where.title = { path: ['ru'], string_contains: query }
      news = await prisma.newsPost.findMany({
        where,
        include: { comments: { include: { author: { select: { email: true } } } } },
        orderBy: { publishedAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      news = clone(mockDb.news.filter((item) => (item.status || 'PUBLISHED') === 'PUBLISHED'))
      if (query) {
        const q = query.toLowerCase()
        news = news.filter((item) => {
          const title = item.title
          if (typeof title === 'string') return title.toLowerCase().includes(q)
          if (typeof title === 'object') return Object.values(title).some((v) => String(v).toLowerCase().includes(q))
          return false
        })
      }
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

// Add comment to news post
router.post(
  '/:id/comments',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const text = String(req.body.text || '').trim()
    if (!text) throw new AppError('Текст комментария не может быть пустым', 400)

    let comment
    try {
      comment = await prisma.newsComment.create({
        data: { postId: req.params.id, authorId: req.user.userId, text },
        include: { author: { select: { email: true, id: true } } }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const post = mockDb.news.find((item) => item.id === req.params.id || item.slug === req.params.id)
      if (!post) throw new AppError('Новость не найдена', 404)
      if (!post.comments) post.comments = []
      comment = {
        id: `comment-${Date.now()}`,
        postId: post.id,
        authorId: req.user.userId,
        text,
        createdAt: new Date().toISOString(),
        author: { email: req.user.email, id: req.user.userId }
      }
      post.comments.push(comment)
      saveMockDb()
    }
    res.status(201).json(clone(comment))
  })
)

// Delete comment (author or admin)
router.delete(
  '/:id/comments/:commentId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const comment = await prisma.newsComment.findUnique({ where: { id: req.params.commentId } })
      if (!comment) throw new AppError('Комментарий не найден', 404)
      if (comment.authorId !== req.user.userId && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
        throw new AppError('Нет прав для удаления', 403)
      }
      await prisma.newsComment.delete({ where: { id: req.params.commentId } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const post = mockDb.news.find((item) => item.id === req.params.id || item.slug === req.params.id)
      if (!post) throw new AppError('Новость не найдена', 404)
      const idx = (post.comments || []).findIndex((c) => c.id === req.params.commentId)
      if (idx === -1) throw new AppError('Комментарий не найден', 404)
      const comment = post.comments[idx]
      if (comment.authorId !== req.user.userId && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
        throw new AppError('Нет прав для удаления', 403)
      }
      post.comments.splice(idx, 1)
      saveMockDb()
    }
    res.json({ message: 'Комментарий удалён' })
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

