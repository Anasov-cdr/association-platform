import express from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { createNotification } from '../services/notificationService.js'

const router = express.Router()

const enrichMentorship = (item) => ({
  ...item,
  mentor: mockDb.alumni.find((profile) => profile.userId === item.mentorId),
  student: mockDb.alumni.find((profile) => profile.userId === item.studentId)
})

// Get mentorship requests related to current user.
router.get(
  '/my',
  authMiddleware,
  asyncHandler(async (req, res) => {
    let mentorships
    try {
      mentorships = await prisma.mentorship.findMany({
        where: req.user.role === 'ADMIN' ? {} : {
          OR: [{ mentorId: req.user.userId }, { studentId: req.user.userId }]
        },
        include: {
          mentor: { select: { email: true, profile: true } },
          student: { select: { email: true, profile: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      mentorships = mockDb.mentorships.map(enrichMentorship)
      if (req.user.role !== 'ADMIN') {
        mentorships = mentorships.filter((item) => item.mentorId === req.user.userId || item.studentId === req.user.userId)
      }
    }
    res.json(mentorships)
  })
)

// Mentor/admin: update mentorship status.
router.patch(
  '/:id/status',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const status = req.body.status
    if (!['pending', 'active', 'rejected', 'completed'].includes(status)) {
      throw new AppError('Неверный статус менторства', 400)
    }

    let mentorship
    try {
      const existing = await prisma.mentorship.findUnique({ where: { id: req.params.id } })
      if (!existing) throw new AppError('Запрос менторства не найден', 404)
      if (req.user.role !== 'ADMIN' && existing.mentorId !== req.user.userId) throw new AppError('Доступ запрещен', 403)
      mentorship = await prisma.mentorship.update({
        where: { id: req.params.id },
        data: { status, endedAt: status === 'completed' ? new Date() : undefined }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      mentorship = mockDb.mentorships.find((item) => item.id === req.params.id)
      if (!mentorship) throw new AppError('Запрос менторства не найден', 404)
      if (req.user.role !== 'ADMIN' && mentorship.mentorId !== req.user.userId) throw new AppError('Доступ запрещен', 403)
      mentorship.status = status
      if (status === 'completed') mentorship.endedAt = new Date().toISOString()
      await createNotification({
        userId: mentorship.studentId,
        type: 'MENTORSHIP_STATUS',
        title: 'Статус менторства обновлен',
        message: `Ваш запрос менторства: ${status}.`,
        data: { mentorshipId: mentorship.id, status }
      })
      saveMockDb()
    }
    res.json({ message: 'Статус менторства обновлен', mentorship })
  })
)

// Request mentorship
router.post(
  '/:mentorId/request',
  authMiddleware,
  asyncHandler(async (req, res) => {
    let mentorship
    try {
      const mentor = await prisma.user.findUnique({
        where: { id: req.params.mentorId },
        include: { profile: true }
      })

      if (!mentor || !mentor.profile?.isMentor) {
        throw new AppError('Ментор не найден или пользователь не является ментором', 404)
      }

      if (mentor.id === req.user.userId) {
        throw new AppError('Вы не можете быть ментором самому себе', 400)
      }

      const existing = await prisma.mentorship.findFirst({
        where: {
          mentorId: mentor.id,
          studentId: req.user.userId,
          status: { in: ['pending', 'active'] }
        }
      })

      if (existing) {
        throw new AppError('Запрос уже отправлен или вы уже работаете с этим ментором', 400)
      }

      mentorship = await prisma.mentorship.create({
        data: {
          mentorId: mentor.id,
          studentId: req.user.userId,
          status: 'pending',
          goals: req.body.goals || ''
        }
      })

      await prisma.notification.create({
        data: {
          userId: mentor.id,
          type: 'MENTORSHIP_REQUEST',
          title: 'Новый запрос на менторство',
          message: 'У вас новый запрос на менторство от студента.',
          data: { mentorshipId: mentorship.id }
        }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const mentorProfile = mockDb.alumni.find((profile) => profile.userId === req.params.mentorId && profile.isMentor)
      if (!mentorProfile) throw new AppError('Ментор не найден или пользователь не является ментором', 404)
      if (mentorProfile.userId === req.user.userId) throw new AppError('Вы не можете быть ментором самому себе', 400)
      const existing = mockDb.mentorships.find((item) => item.mentorId === mentorProfile.userId && item.studentId === req.user.userId && ['pending', 'active'].includes(item.status))
      if (existing) throw new AppError('Запрос уже отправлен или вы уже работаете с этим ментором', 400)
      mentorship = { id: `mentorship-${Date.now()}`, mentorId: mentorProfile.userId, studentId: req.user.userId, status: 'pending', goals: req.body.goals || '', createdAt: new Date().toISOString() }
      mockDb.mentorships.push(mentorship)
      await createNotification({
        userId: mentorProfile.userId,
        type: 'MENTORSHIP_REQUEST',
        title: 'Новый запрос на менторство',
        message: 'У вас новый запрос на менторство от студента.',
        data: { mentorshipId: mentorship.id }
      })
      saveMockDb()
    }

    res.status(201).json({ message: 'Запрос отправлен', mentorship })
  })
)

export default router

