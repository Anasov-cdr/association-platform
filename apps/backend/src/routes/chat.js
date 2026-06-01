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

router.delete('/rooms/:roomId', authMiddleware, requireRole('ADMIN', 'MODERATOR'), asyncHandler(async (req, res) => {
  const idx = (mockDb.chatRooms || []).findIndex((r) => r.id === req.params.roomId)
  if (idx === -1) throw new AppError('Комната не найдена', 404)
  mockDb.chatRooms.splice(idx, 1)
  saveMockDb()
  res.json({ message: 'Комната удалена' })
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

// ── Direct Messages ────────────────────────────────────────────────────────

router.get('/direct', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.userId
  if (!mockDb.directChats) mockDb.directChats = []
  if (!mockDb.directMessages) mockDb.directMessages = []

  const chats = mockDb.directChats.filter((c) => c.participants.includes(userId))
  const result = chats.map((chat) => {
    const otherId = chat.participants.find((p) => p !== userId)
    const otherUser = (mockDb.users || []).find((u) => u.id === otherId)
    const msgs = mockDb.directMessages.filter((m) => m.chatId === chat.id)
    const lastMessage = msgs[msgs.length - 1] || null
    const unreadCount = msgs.filter((m) => m.senderId !== userId && !m.read).length
    return {
      ...clone(chat),
      other: {
        id: otherId,
        name: otherUser?.profile?.fullName || otherUser?.email || 'Пользователь',
        photoUrl: otherUser?.profile?.photoUrl || null
      },
      lastMessage: lastMessage ? clone(lastMessage) : null,
      unreadCount
    }
  })

  res.json(result)
}))

router.post('/direct/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const meId = req.user.userId
  const otherId = req.params.userId
  if (meId === otherId) throw new AppError('Нельзя начать диалог с самим собой', 400)

  if (!mockDb.directChats) mockDb.directChats = []
  const existing = mockDb.directChats.find(
    (c) => c.participants.includes(meId) && c.participants.includes(otherId)
  )
  if (existing) return res.json(clone(existing))

  const chat = { id: `dm-${Date.now()}`, participants: [meId, otherId], createdAt: new Date().toISOString() }
  mockDb.directChats.push(chat)
  saveMockDb()
  res.status(201).json(clone(chat))
}))

router.get('/direct/:chatId/messages', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.userId
  if (!mockDb.directChats) mockDb.directChats = []
  if (!mockDb.directMessages) mockDb.directMessages = []

  const chat = mockDb.directChats.find((c) => c.id === req.params.chatId)
  if (!chat) throw new AppError('Диалог не найден', 404)
  if (!chat.participants.includes(userId)) throw new AppError('Доступ запрещён', 403)

  const messages = mockDb.directMessages.filter((m) => m.chatId === req.params.chatId).slice(-100)
  messages.forEach((m) => { if (m.senderId !== userId) m.read = true })
  saveMockDb()

  res.json(clone(messages))
}))

export default router
