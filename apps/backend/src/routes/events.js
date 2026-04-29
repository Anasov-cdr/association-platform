import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { broadcastToApprovedAlumni, createAdminNotification, createNotification } from '../services/notificationService.js'

const router = express.Router()

const eventSchema = z.object({
  title: z.record(z.string()),
  description: z.record(z.string()),
  startsAt: z.string().datetime(),
  location: z.string(),
  status: z.enum(['upcoming', 'ongoing', 'past', 'cancelled']).optional(),
  publicationStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED').optional()
})

// Get all events
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let events
    try {
      events = await prisma.event.findMany({
        where: { publicationStatus: 'PUBLISHED' },
        include: { registrations: { select: { userId: true } } },
        orderBy: { startsAt: 'asc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      events = clone(mockDb.events.filter((item) => (item.publicationStatus || 'PUBLISHED') === 'PUBLISHED'))
    }
    res.json(events)
  })
)

router.get(
  '/admin/all',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let events
    try {
      events = await prisma.event.findMany({
        include: { registrations: { select: { userId: true } } },
        orderBy: { startsAt: 'asc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      events = clone(mockDb.events)
    }
    res.json(events)
  })
)

// Get single event
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    let event
    try {
      event = await prisma.event.findUnique({
        where: { id: req.params.id },
        include: { registrations: { select: { userId: true, user: { select: { profile: true } } } } }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      event = mockDb.events.find((item) => item.id === req.params.id)
    }
    if (!event) throw new AppError('Событие не найдено', 404)
    if ((event.publicationStatus || 'PUBLISHED') !== 'PUBLISHED' && !['ADMIN', 'MODERATOR'].includes(req.user?.role)) {
      throw new AppError('Событие не найдено', 404)
    }
    res.json(clone(event))
  })
)

// Admin: Create event
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = eventSchema.parse(req.body)
    let event
    try {
      event = await prisma.event.create({ data })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      event = { id: `event-${Date.now()}`, publicationStatus: 'PUBLISHED', ...data, registrations: [], createdAt: new Date().toISOString() }
      mockDb.events.unshift(event)
      saveMockDb()
      if ((event.publicationStatus || 'PUBLISHED') === 'PUBLISHED') {
        await broadcastToApprovedAlumni({
          type: 'EVENT_CREATED',
          title: 'Новое мероприятие',
          message: data.title.ru || 'Добавлено новое мероприятие Ассоциации.',
          data: { eventId: event.id }
        })
      }
    }
    res.status(201).json(event)
  })
)

// Register for event
router.post(
  '/:eventId/register',
  authMiddleware,
  asyncHandler(async (req, res) => {
    let registration
    try {
      const event = await prisma.event.findUnique({ where: { id: req.params.eventId } })
      if (!event) throw new AppError('Событие не найдено', 404)

      registration = await prisma.eventRegistration.create({
        data: {
          eventId: req.params.eventId,
          userId: req.user.userId
        }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const event = mockDb.events.find((item) => item.id === req.params.eventId)
      if (!event) throw new AppError('Событие не найдено', 404)
      if ((event.publicationStatus || 'PUBLISHED') !== 'PUBLISHED') throw new AppError('Событие не найдено', 404)
      registration = { id: `registration-${Date.now()}`, eventId: event.id, userId: req.user.userId, status: 'registered', createdAt: new Date().toISOString() }
      event.registrations = [...(event.registrations || []).filter((item) => item.userId !== req.user.userId), registration]
      saveMockDb()
      await createNotification({
        userId: req.user.userId,
        type: 'EVENT_REGISTRATION',
        title: 'Регистрация на мероприятие',
        message: `Вы зарегистрированы: ${event.title?.ru || event.title}.`,
        data: { eventId: event.id, registrationId: registration.id }
      })
      await createAdminNotification({
        type: 'EVENT_REGISTRATION',
        title: 'Новая регистрация на мероприятие',
        message: `${req.user.email} зарегистрировался на "${event.title?.ru || event.title}".`,
        data: { eventId: event.id, registrationId: registration.id }
      })
    }

    res.status(201).json({ message: 'Вы зарегистрированы на событие', registration })
  })
)

// Unregister from event
router.delete(
  '/:eventId/register',
  authMiddleware,
  asyncHandler(async (req, res) => {
    try {
      await prisma.eventRegistration.deleteMany({
        where: { eventId: req.params.eventId, userId: req.user.userId }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const event = mockDb.events.find((item) => item.id === req.params.eventId)
      if (!event) throw new AppError('Событие не найдено', 404)
      event.registrations = (event.registrations || []).filter((item) => item.userId !== req.user.userId)
      saveMockDb()
      await createNotification({
        userId: req.user.userId,
        type: 'EVENT_REGISTRATION',
        title: 'Регистрация отменена',
        message: `Вы отменили регистрацию: ${event.title?.ru || event.title}.`,
        data: { eventId: event.id }
      })
    }
    res.json({ message: 'Вы отменили регистрацию' })
  })
)

// Admin: Update event
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = eventSchema.partial().parse(req.body)
    let event
    try {
      event = await prisma.event.update({
        where: { id: req.params.id },
        data
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.events.findIndex((item) => item.id === req.params.id)
      if (index === -1) throw new AppError('Событие не найдено', 404)
      mockDb.events[index] = { ...mockDb.events[index], ...data }
      event = mockDb.events[index]
      saveMockDb()
    }
    res.json(event)
  })
)

// Admin: Delete event
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    try {
      await prisma.event.delete({ where: { id: req.params.id } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.events.findIndex((item) => item.id === req.params.id)
      if (index === -1) throw new AppError('Событие не найдено', 404)
      mockDb.events.splice(index, 1)
      saveMockDb()
    }
    res.json({ message: 'Событие удалено' })
  })
)

export default router

