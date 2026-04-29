import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import { errorHandler } from './middleware/errorHandler.js'
import { securityHeaders, validateSecurityConfig } from './middleware/security.js'
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

const app = express()
const server = createServer(app)
const port = process.env.PORT || 4000
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
validateSecurityConfig()

// Middleware
app.use(securityHeaders)
app.use(cors({ origin: clientOrigin.split(',').map((item) => item.trim()) }))
app.use(express.json())
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// Socket.io
const io = new Server(server, {
  cors: { origin: clientOrigin },
  transports: ['websocket', 'polling']
})

io.on('connection', (socket) => {
  console.log(`[Socket.io] User connected: ${socket.id}`)

  socket.on('chat:join', ({ roomId = 'general' } = {}) => {
    socket.join(roomId)
    const history = (mockDb.chatMessages || [])
      .filter((message) => message.roomId === roomId && !message.deleted)
      .slice(-100)
    socket.emit('chat:history', history)
  })

  socket.on('chat:message', (message) => {
    const roomId = message.roomId || 'general'
    const newMessage = {
      id: Date.now().toString(),
      roomId,
      author: message.author || 'Гость',
      authorId: message.authorId || null,
      text: message.text,
      deleted: false,
      createdAt: new Date().toISOString()
    }
    mockDb.chatMessages.push(newMessage)
    saveMockDb()
    io.to(roomId).emit('chat:message', newMessage)
  })

  socket.on('disconnect', () => {
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
server.listen(port, () => {
  console.log(`
╔═══════════════════════════════════════╗
║        BFET Alumni Platform API      ║
║  Listening on http://localhost:${port} ║
╚═══════════════════════════════════════╝
  `)
})

export { app, io }
