import express from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'

const router = express.Router()

// Get user notifications
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    let notifications
    try {
      notifications = await prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      notifications = clone(mockDb.notifications.filter((item) => item.userId === req.user.userId || req.user.role === 'ADMIN'))
    }
    res.json(notifications)
  })
)

router.get(
  '/unread-count',
  authMiddleware,
  asyncHandler(async (req, res) => {
    let count
    try {
      count = await prisma.notification.count({
        where: { userId: req.user.userId, read: false }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      count = mockDb.notifications.filter((item) => {
        const visibleToUser = item.userId === req.user.userId || req.user.role === 'ADMIN'
        return visibleToUser && !item.read
      }).length
    }
    res.json({ count })
  })
)

router.patch(
  '/read-all',
  authMiddleware,
  asyncHandler(async (req, res) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user.userId, read: false },
        data: { read: true }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      mockDb.notifications
        .filter((item) => item.userId === req.user.userId || req.user.role === 'ADMIN')
        .forEach((item) => {
          item.read = true
        })
      saveMockDb()
    }
    res.json({ success: true })
  })
)

// Mark notification as read
router.patch(
  '/:id/read',
  authMiddleware,
  asyncHandler(async (req, res) => {
    try {
      await prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.user.userId },
        data: { read: true }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const notification = mockDb.notifications.find((item) => item.id === req.params.id && item.userId === req.user.userId)
      if (notification) notification.read = true
      saveMockDb()
    }
    res.json({ success: true })
  })
)

router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    try {
      await prisma.notification.deleteMany({
        where: { id: req.params.id, userId: req.user.userId }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.notifications.findIndex((item) => {
        const ownsNotification = item.userId === req.user.userId || req.user.role === 'ADMIN'
        return item.id === req.params.id && ownsNotification
      })
      if (index !== -1) {
        mockDb.notifications.splice(index, 1)
        saveMockDb()
      }
    }
    res.json({ success: true })
  })
)

export default router

