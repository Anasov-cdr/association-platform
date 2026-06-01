import express from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { resetUserPassword } from '../services/authService.js'

const router = express.Router()

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'MODERATOR', 'ALUMNI'])
})

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED'])
})

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MODERATOR', 'ALUMNI']).default('ALUMNI'),
  status: z.enum(['ACTIVE', 'BLOCKED']).default('ACTIVE'),
  fullName: z.string().optional()
})

const passwordSchema = z.object({
  password: z.string().min(8)
})

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status || 'ACTIVE',
  createdAt: user.createdAt,
  profile: user.profile
})

router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    let users
    try {
      users = await prisma.user.findMany({
        include: { profile: true },
        orderBy: { createdAt: 'desc' }
      })
      users = users.map((user) => ({ ...user, status: user.profile?.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE' }))
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      users = clone((mockDb.users || []).map((user) => {
        const profile = mockDb.alumni.find((item) => item.userId === user.id) || user.profile
        return toPublicUser({ ...user, profile })
      }))
    }
    res.json(users)
  })
)

router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body)
    let user
    try {
      const existing = await prisma.user.findUnique({ where: { email: data.email } })
      if (existing) throw new AppError('Пользователь с таким email уже существует', 409)
      const passwordHash = await bcrypt.hash(data.password, 10)
      user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role,
          profile: data.role === 'ALUMNI' ? {
            create: {
              fullName: data.fullName || data.email,
              graduationYear: new Date().getFullYear(),
              specialty: 'Не указано',
              status: data.status === 'BLOCKED' ? 'BLOCKED' : 'DRAFT'
            }
          } : undefined
        },
        include: { profile: true }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      if (mockDb.users.some((item) => item.email === data.email)) throw new AppError('Пользователь с таким email уже существует', 409)
      user = {
        id: `user-${Date.now()}`,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 10),
        role: data.role,
        status: data.status,
        createdAt: new Date().toISOString(),
        profile: data.fullName ? { id: `profile-${Date.now()}`, fullName: data.fullName, status: data.status === 'BLOCKED' ? 'BLOCKED' : 'DRAFT' } : null
      }
      mockDb.users.push(user)
      if (data.role === 'ALUMNI' && data.fullName) {
        mockDb.alumni.push({
          id: user.profile.id,
          userId: user.id,
          fullName: data.fullName,
          graduationYear: new Date().getFullYear(),
          specialty: 'Не указано',
          status: user.profile.status,
          showEmail: false,
          showPhone: false,
          isMentor: false,
          canHelpStudents: false,
          createdAt: user.createdAt,
          user: { id: user.id, email: user.email }
        })
      }
      saveMockDb()
    }
    res.status(201).json(toPublicUser(user))
  })
)

router.patch(
  '/:id/password',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { password } = passwordSchema.parse(req.body)
    await resetUserPassword(req.params.id, password)
    res.json({ message: 'Пароль пользователя обновлен' })
  })
)

router.patch(
  '/:id/role',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { role } = roleSchema.parse(req.body)
    if (req.params.id === req.user.userId && role !== 'ADMIN') throw new AppError('Нельзя снять роль ADMIN у текущего пользователя', 400)
    let user
    try {
      user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role },
        include: { profile: true }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      user = mockDb.users.find((item) => item.id === req.params.id)
      if (!user) throw new AppError('Пользователь не найден', 404)
      user.role = role
      saveMockDb()
    }
    res.json(toPublicUser(user))
  })
)

router.patch(
  '/:id/status',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body)
    if (req.params.id === req.user.userId && status === 'BLOCKED') throw new AppError('Нельзя заблокировать текущего пользователя', 400)
    let user
    try {
      user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { profile: true } })
      if (!user) throw new AppError('Пользователь не найден', 404)
      if (user.profile) {
        await prisma.alumniProfile.update({
          where: { userId: user.id },
          data: { status: status === 'BLOCKED' ? 'BLOCKED' : user.profile.status === 'BLOCKED' ? 'DRAFT' : user.profile.status }
        })
      }
      user = { ...user, status }
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      user = mockDb.users.find((item) => item.id === req.params.id)
      if (!user) throw new AppError('Пользователь не найден', 404)
      user.status = status
      const profile = mockDb.alumni.find((item) => item.userId === user.id)
      if (profile) profile.status = status === 'BLOCKED' ? 'BLOCKED' : profile.status === 'BLOCKED' ? 'DRAFT' : profile.status
      saveMockDb()
    }
    res.json(toPublicUser(user))
  })
)

router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.userId) throw new AppError('Нельзя удалить текущего пользователя', 400)
    try {
      await prisma.user.delete({ where: { id: req.params.id } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const idx = mockDb.users.findIndex((u) => u.id === req.params.id)
      if (idx === -1) throw new AppError('Пользователь не найден', 404)
      mockDb.users.splice(idx, 1)
      const alumniIdx = mockDb.alumni.findIndex((a) => a.userId === req.params.id)
      if (alumniIdx !== -1) mockDb.alumni.splice(alumniIdx, 1)
      saveMockDb()
    }
    res.json({ message: 'Пользователь удалён' })
  })
)

export default router
