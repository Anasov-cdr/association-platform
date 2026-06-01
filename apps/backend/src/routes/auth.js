import crypto from 'node:crypto'
import express from 'express'
import { z } from 'zod'
import { login, register, refreshAccessToken, changePassword, resetUserPassword } from '../services/authService.js'
import { authMiddleware } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/security.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { prisma } from '../lib/prisma.js'
import { sendPasswordResetEmail } from '../services/emailService.js'

const router = express.Router()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Неверный email'),
  password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
  firstName: z.string().optional(),
  lastName: z.string().optional()
})

const loginSchema = z.object({
  email: z.string().email('Неверный email'),
  password: z.string().min(1, 'Пароль обязателен')
})

const refreshSchema = z.object({
  refreshToken: z.string()
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Новый пароль должен быть минимум 8 символов')
})

const loginLimiter    = createRateLimiter({ windowMs: 15 * 60_000, max: 10, keyPrefix: 'login' })
const registerLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 5,  keyPrefix: 'register' })
const forgotLimiter   = createRateLimiter({ windowMs: 60 * 60_000, max: 5,  keyPrefix: 'forgot' })
const refreshLimiter  = createRateLimiter({ windowMs: 15 * 60_000, max: 30, keyPrefix: 'refresh' })

// Routes
router.post(
  '/register',
  registerLimiter,
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body)
    const result = await register(data.email, data.password, data.firstName, data.lastName)
    res.status(201).json(result)
  })
)

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body)
    const result = await login(data.email, data.password)
    res.json(result)
  })
)

router.post(
  '/refresh',
  refreshLimiter,
  asyncHandler(async (req, res) => {
    const data = refreshSchema.parse(req.body)
    const result = await refreshAccessToken(data.refreshToken)
    res.json(result)
  })
)

router.post(
  '/change-password',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = passwordSchema.parse(req.body)
    await changePassword(req.user.userId, data.currentPassword, data.newPassword)
    res.json({ message: 'Пароль обновлен' })
  })
)

router.post(
  '/forgot-password',
  forgotLimiter,
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = Date.now() + 3_600_000

    let found = false
    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        found = true
        mockDb.passwordResetTokens[token] = { userId: user.id, expiry }
        saveMockDb()
      }
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const user = mockDb.users.find((u) => u.email === email)
      if (user) {
        found = true
        mockDb.passwordResetTokens = mockDb.passwordResetTokens || {}
        mockDb.passwordResetTokens[token] = { userId: user.id, expiry }
        saveMockDb()
      }
    }

    if (found) {
      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
      const resetUrl = `${clientOrigin}/ru/reset-password?token=${token}`
      await sendPasswordResetEmail(email, resetUrl).catch(() => {})
    }

    // Always respond 200 to avoid user enumeration
    res.json({ message: 'Если такой email зарегистрирован, мы отправим инструкцию по сбросу пароля.' })
  })
)

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, newPassword } = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8, 'Пароль должен быть минимум 8 символов')
    }).parse(req.body)

    const tokens = mockDb.passwordResetTokens || {}
    const record = tokens[token]

    if (!record || record.expiry < Date.now()) {
      throw new AppError('Ссылка для сброса пароля недействительна или устарела', 400)
    }

    await resetUserPassword(record.userId, newPassword)

    delete mockDb.passwordResetTokens[token]
    saveMockDb()

    res.json({ message: 'Пароль успешно изменён. Войдите с новым паролем.' })
  })
)

export default router
