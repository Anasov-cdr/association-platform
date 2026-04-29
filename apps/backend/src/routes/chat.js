import express from 'express'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { clone, mockDb, saveMockDb } from '../mockData.js'

const router = express.Router()

const roomSchema = z.object({
  name: z.string().min(2),
  type: z.string().default('custom')
})

const reportSchema = z.object({
  reason: z.string().min(3)
})

router.get('/rooms', asyncHandler(async (req, res) => {
  res.json(clone(mockDb.chatRooms || []))
}))

router.post('/rooms', authMiddleware, requireRole('ADMIN', 'MODERATOR'), asyncHandler(async (req, res) => {
  const data = roomSchema.parse(req.body)
  const room = { id: `room-${Date.now()}`, ...data, createdAt: new Date().toISOString() }
  mockDb.chatRooms.push(room)
  saveMockDb()
  res.status(201).json(room)
}))

router.get('/rooms/:roomId/messages', asyncHandler(async (req, res) => {
  const messages = (mockDb.chatMessages || [])
    .filter((message) => message.roomId === req.params.roomId && !message.deleted)
    .slice(-100)
  res.json(clone(messages))
}))

router.post('/messages/:messageId/report', authMiddleware, asyncHandler(async (req, res) => {
  const data = reportSchema.parse(req.body)
  const message = (mockDb.chatMessages || []).find((item) => item.id === req.params.messageId)
  if (!message) throw new AppError('Сообщение не найдено', 404)
  const report = {
    id: `report-${Date.now()}`,
    messageId: message.id,
    roomId: message.roomId,
    reporterId: req.user.userId,
    reporterEmail: req.user.email,
    reason: data.reason,
    status: 'open',
    createdAt: new Date().toISOString()
  }
  mockDb.chatReports.unshift(report)
  saveMockDb()
  res.status(201).json({ message: 'Жалоба отправлена', report })
}))

router.get('/reports', authMiddleware, requireRole('ADMIN', 'MODERATOR'), asyncHandler(async (req, res) => {
  const reports = (mockDb.chatReports || []).map((report) => ({
    ...report,
    message: (mockDb.chatMessages || []).find((message) => message.id === report.messageId)
  }))
  res.json(clone(reports))
}))

router.patch('/reports/:reportId/status', authMiddleware, requireRole('ADMIN', 'MODERATOR'), asyncHandler(async (req, res) => {
  const status = req.body.status
  if (!['open', 'resolved', 'rejected'].includes(status)) throw new AppError('Неверный статус жалобы', 400)
  const report = (mockDb.chatReports || []).find((item) => item.id === req.params.reportId)
  if (!report) throw new AppError('Жалоба не найдена', 404)
  report.status = status
  saveMockDb()
  res.json(report)
}))

router.delete('/messages/:messageId', authMiddleware, requireRole('ADMIN', 'MODERATOR'), asyncHandler(async (req, res) => {
  const message = (mockDb.chatMessages || []).find((item) => item.id === req.params.messageId)
  if (!message) throw new AppError('Сообщение не найдено', 404)
  message.deleted = true
  message.deletedAt = new Date().toISOString()
  message.deletedBy = req.user.userId
  saveMockDb()
  res.json({ message: 'Сообщение удалено' })
}))

export default router
