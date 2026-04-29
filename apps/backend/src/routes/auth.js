import express from 'express'
import { z } from 'zod'
import { login, register, refreshAccessToken, changePassword } from '../services/authService.js'
import { authMiddleware } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/security.js'
import { asyncHandler } from '../middleware/errorHandler.js'

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

const loginLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 10, keyPrefix: 'login' })

// Routes
router.post(
  '/register',
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

export default router
