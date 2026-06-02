import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import { errorHandler } from './middleware/errorHandler.js'
import { securityHeaders, createRateLimiter, validateSecurityConfig } from './middleware/security.js'
import { prisma } from './lib/prisma.js'
import authRoutes from './routes/auth.js'
import alumniRoutes from './routes/alumni.js'
import newsRoutes from './routes/news.js'
import eventsRoutes from './routes/events.js'
import jobsRoutes from './routes/jobs.js'
import donationsRoutes from './routes/donations.js'
import documentsRoutes from './routes/documents.js'
import notificationsRoutes from './routes/notifications.js'
import mentorshipRoutes from './routes/mentorship.js'
import adminRoutes from './routes/admin.js'
import companiesRoutes from './routes/companies.js'
import uploadsRoutes from './routes/uploads.js'
import chatRoutes from './routes/chat.js'
import siteRoutes from './routes/site.js'
import usersRoutes from './routes/users.js'
import { mockDb, saveMockDb } from './mockData.js'
import { initSocketPush, registerUserSocket, unregisterUserSocket, verifySocketToken } from './lib/socketPush.js'
import backupRoutes from './routes/backup.js'
import { initBackupScheduler } from './services/backupService.js'

const app = express()
const server = createServer(app)
const port = process.env.PORT || 4000
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
validateSecurityConfig()

const globalLimiter = createRateLimiter({ windowMs: 60_000, max: 200, keyPrefix: 'global' })

// Middleware
app.use(securityHeaders)
app.use(cors({ origin: clientOrigin.split(',').map((item) => item.trim()) }))
app.use(express.json({ limit: '1mb' }))
app.use('/api', globalLimiter)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// Socket.io
const io = new Server(server, {
  cors: { origin: clientOrigin },
  transports: ['websocket', 'polling']
})

initSocketPush(io)

io.on('connection', (socket) => {
  console.log(`[Socket.io] User connected: ${socket.id}`)

  socket.on('auth:register', ({ token } = {}) => {
    const payload = verifySocketToken(token)
    if (!payload) return
    socket.userId = payload.userId
    registerUserSocket(payload.userId, socket.id)
  })

  socket.on('chat:join', ({ roomId = 'general' } = {}) => {
    socket.join(roomId)
    const history = (mockDb.chatMessages || [])
      .filter((message) => message.roomId === roomId && !message.deleted)
      .slice(-100)
    socket.emit('chat:history', history)
  })

  socket.on('chat:message', (message) => {
    if (!socket.userId) return
    if (!message?.text?.trim() || message.text.length > 5000) return
    const roomId = message.roomId || 'general'
    const authorUser = (mockDb.users || []).find((u) => u.id === socket.userId)
    if (!authorUser) return
    const newMessage = {
      id: Date.now().toString(),
      roomId,
      author: authorUser.profile?.fullName || authorUser.email || 'Пользователь',
      authorId: socket.userId,
      authorEmail: authorUser.email || null,
      text: message.text.trim(),
      deleted: false,
      createdAt: new Date().toISOString()
    }
    mockDb.chatMessages.push(newMessage)
    saveMockDb()
    io.to(roomId).emit('chat:message', newMessage)
  })

  socket.on('dm:join', ({ chatId } = {}) => {
    if (!chatId) return
    socket.join(`dm:${chatId}`)
    if (!mockDb.directMessages) mockDb.directMessages = []
    const history = mockDb.directMessages.filter((m) => m.chatId === chatId).slice(-100)
    socket.emit('dm:history', history)
  })

  socket.on('dm:message', ({ chatId, text } = {}) => {
    if (!socket.userId) return
    if (!chatId || !text?.trim() || text.length > 5000) return
    if (!mockDb.directChats) mockDb.directChats = []
    if (!mockDb.directMessages) mockDb.directMessages = []

    const chat = mockDb.directChats.find((c) => c.id === chatId)
    if (!chat) return
    if (!chat.participants.includes(socket.userId)) return

    const sender = (mockDb.users || []).find((u) => u.id === socket.userId)
    const newMessage = {
      id: `dm-msg-${Date.now()}`,
      chatId,
      senderId: socket.userId,
      senderName: sender?.profile?.fullName || sender?.email || 'Пользователь',
      text: text.trim(),
      read: false,
      createdAt: new Date().toISOString()
    }
    mockDb.directMessages.push(newMessage)
    saveMockDb()
    io.to(`dm:${chatId}`).emit('dm:message', newMessage)
  })

  socket.on('disconnect', () => {
    if (socket.userId) unregisterUserSocket(socket.userId, socket.id)
    console.log(`[Socket.io] User disconnected: ${socket.id}`)
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/alumni', alumniRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/donations', donationsRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/mentorship', mentorshipRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/companies', companiesRoutes)
app.use('/api/uploads', uploadsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/site', siteRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/admin/backup', backupRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' })
})

// Error handler (must be last)
app.use(errorHandler)

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n[${signal}] Shutting down gracefully...`)
    server.close(() => {
      console.log('Server closed')
    })
    await prisma.$disconnect()
    process.exit(0)
  })
})

// Start server
initBackupScheduler()
server.listen(port, () => {
  console.log(`
╔═══════════════════════════════════════╗
║        BFET Association API          ║
║  Listening on http://localhost:${port} ║
╚═══════════════════════════════════════╝
  `)
})

export { app, io }
