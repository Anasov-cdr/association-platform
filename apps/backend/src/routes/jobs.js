import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { sendNewApplicationEmail } from '../services/emailService.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { createAdminNotification, createNotification } from '../services/notificationService.js'

const router = express.Router()

const jobSchema = z.object({
  title: z.string(),
  description: z.string(),
  requirements: z.string().optional(),
  duties: z.string().optional(),
  type: z.string(),
  format: z.string(),
  city: z.string().optional(),
  country: z.string().optional(),
  salary: z.string().optional(),
  deadline: z.string().datetime().optional(),
  contacts: z.string().optional(),
  companyId: z.string().optional()
})

const applicationStatusSchema = z.object({
  status: z.enum(['SENT', 'VIEWED', 'INVITED', 'REJECTED', 'ACCEPTED'])
})

// Get all published jobs
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { city, type, format } = req.query
    const where = { status: 'PUBLISHED' }

    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (type) where.type = type
    if (format) where.format = format

    let jobs
    try {
      jobs = await prisma.job.findMany({
        where,
        include: { author: { select: { profile: { select: { fullName: true } } } }, company: true },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      jobs = mockDb.jobs.filter((job) => job.status === 'PUBLISHED')
      if (city) jobs = jobs.filter((job) => job.city?.toLowerCase().includes(String(city).toLowerCase()))
      if (type) jobs = jobs.filter((job) => job.type === type)
      if (format) jobs = jobs.filter((job) => job.format === format)
      jobs = clone(jobs)
    }
    res.json(jobs)
  })
)

// Get user's own jobs
router.get(
  '/my',
  authMiddleware,
  asyncHandler(async (req, res) => {
    let jobs
    try {
      jobs = await prisma.job.findMany({
        where: { authorId: req.user.userId },
        include: {
          company: true,
          applications: { include: { user: { select: { email: true, profile: { select: { fullName: true } } } } } }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      jobs = clone(mockDb.jobs.filter((job) => job.authorId === req.user.userId || req.user.role === 'ADMIN'))
    }
    res.json(jobs)
  })
)

// Get applications related to current user.
router.get(
  '/applications/my',
  authMiddleware,
  asyncHandler(async (req, res) => {
    let applications
    try {
      applications = await prisma.jobApplication.findMany({
        where: req.user.role === 'ADMIN' ? {} : { userId: req.user.userId },
        include: {
          job: true,
          user: { select: { email: true, profile: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const allApplications = mockDb.jobs.flatMap((job) =>
        (job.applications || []).map((application) => ({
          ...application,
          job: { id: job.id, title: job.title, authorId: job.authorId, company: job.company },
          user: application.user || { email: application.userId, profile: { fullName: application.userId } }
        }))
      )
      applications = clone(req.user.role === 'ADMIN' ? allApplications : allApplications.filter((item) => item.userId === req.user.userId))
    }
    res.json(applications)
  })
)

// Employer/admin: update application status.
router.patch(
  '/applications/:id/status',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { status } = applicationStatusSchema.parse(req.body)
    let application
    try {
      const existing = await prisma.jobApplication.findUnique({
        where: { id: req.params.id },
        include: { job: true }
      })
      if (!existing) throw new AppError('Отклик не найден', 404)
      if (req.user.role !== 'ADMIN' && existing.job.authorId !== req.user.userId) {
        throw new AppError('Доступ запрещен', 403)
      }
      application = await prisma.jobApplication.update({
        where: { id: req.params.id },
        data: { status }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const job = mockDb.jobs.find((item) => (item.applications || []).some((app) => app.id === req.params.id))
      const existing = job?.applications?.find((app) => app.id === req.params.id)
      if (!job || !existing) throw new AppError('Отклик не найден', 404)
      if (req.user.role !== 'ADMIN' && job.authorId !== req.user.userId) throw new AppError('Доступ запрещен', 403)
      existing.status = status
      await createNotification({
        userId: existing.userId,
        type: 'JOB_APPLICATION_STATUS',
        title: 'Статус отклика обновлен',
        message: `Статус отклика на "${job.title}": ${status}.`,
        data: { jobId: job.id, applicationId: existing.id, status }
      })
      saveMockDb()
      application = existing
    }
    res.json(application)
  })
)

// Get single job
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    let job
    try {
      job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: {
          author: { select: { profile: { select: { fullName: true } } } },
          company: true,
          applications: { include: { user: { select: { profile: { select: { fullName: true } } } } } }
        }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      job = mockDb.jobs.find((item) => item.id === req.params.id)
    }
    if (!job) throw new AppError('Вакансия не найдена', 404)
    if (job.status !== 'PUBLISHED' && !['ADMIN', 'MODERATOR'].includes(req.user?.role) && job.authorId !== req.user?.userId) {
      throw new AppError('Вакансия не найдена', 404)
    }
    res.json(clone(job))
  })
)

// Create job posting
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = jobSchema.parse(req.body)

    let job
    try {
      job = await prisma.job.create({
        data: {
          ...data,
          authorId: req.user.userId,
          status: 'PENDING'
        },
        include: { author: { select: { profile: { select: { fullName: true } } } } }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      job = { id: `job-${Date.now()}`, ...data, authorId: req.user.userId, status: req.user.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING', applications: [], createdAt: new Date().toISOString() }
      mockDb.jobs.unshift(job)
      saveMockDb()
      if (req.user.role === 'ADMIN') {
        await createNotification({
          userId: req.user.userId,
          type: 'JOB_PUBLISHED',
          title: 'Вакансия опубликована',
          message: `Вакансия "${job.title}" опубликована.`,
          data: { jobId: job.id }
        })
      } else {
        await createAdminNotification({
          type: 'JOB_PENDING',
          title: 'Новая вакансия на модерации',
          message: `${req.user.email} создал вакансию "${job.title}".`,
          data: { jobId: job.id }
        })
      }
    }

    res.status(201).json(job)
  })
)

// Apply for job
router.post(
  '/:jobId/apply',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { cvUrl, message } = req.body

    let application
    try {
      const job = await prisma.job.findUnique({ 
        where: { id: req.params.jobId },
        include: { author: true }
      })
      if (!job) throw new AppError('Вакансия не найдена', 404)

      application = await prisma.jobApplication.create({
        data: {
          jobId: req.params.jobId,
          userId: req.user.userId,
          cvUrl,
          message
        },
        include: { user: { include: { profile: true } } }
      })

      await prisma.notification.create({
        data: {
          userId: job.authorId,
          type: 'NEW_JOB_APPLICATION',
          title: 'Новый отклик на вакансию',
          message: `Новый отклик на вашу вакансию "${job.title}".`
        }
      })

      if (job.author?.email) {
        const applicantName = application.user?.profile?.fullName || application.user.email
        await sendNewApplicationEmail(job.author.email, job.title, applicantName)
      }
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const job = mockDb.jobs.find((item) => item.id === req.params.jobId)
      if (!job) throw new AppError('Вакансия не найдена', 404)
      if (job.status !== 'PUBLISHED') throw new AppError('Вакансия не найдена', 404)
      application = { id: `application-${Date.now()}`, jobId: job.id, userId: req.user.userId, cvUrl, message, status: 'SENT', createdAt: new Date().toISOString(), user: { email: req.user.email, profile: { fullName: req.user.email } } }
      job.applications.push(application)
      await createNotification({
        userId: job.authorId,
        type: 'NEW_JOB_APPLICATION',
        title: 'Новый отклик на вакансию',
        message: `Новый отклик на вакансию "${job.title}".`,
        data: { jobId: job.id, applicationId: application.id }
      })
      saveMockDb()
    }

    res.status(201).json({ message: 'Ваша заявка отправлена', application })
  })
)

// Update job posting
router.put(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = jobSchema.partial().parse(req.body)
    let job
    try {
      const existing = await prisma.job.findUnique({ where: { id: req.params.id } })
      if (!existing) throw new AppError('Вакансия не найдена', 404)
      if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR' && existing.authorId !== req.user.userId) {
        throw new AppError('Доступ запрещен', 403)
      }
      job = await prisma.job.update({ where: { id: req.params.id }, data })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      job = mockDb.jobs.find((item) => item.id === req.params.id)
      if (!job) throw new AppError('Вакансия не найдена', 404)
      if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR' && job.authorId !== req.user.userId) {
        throw new AppError('Доступ запрещен', 403)
      }
      Object.assign(job, data)
      if (data.companyId) {
        const company = mockDb.companies.find((item) => item.id === data.companyId)
        if (company) job.company = { id: company.id, name: company.name }
      }
      saveMockDb()
    }
    res.json(job)
  })
)

// Admin: Approve job posting
router.post(
  '/:id/approve',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let job
    try {
      job = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: 'PUBLISHED' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      job = mockDb.jobs.find((item) => item.id === req.params.id)
      if (!job) throw new AppError('Вакансия не найдена', 404)
      job.status = 'PUBLISHED'
      saveMockDb()
      await createNotification({
        userId: job.authorId,
        type: 'JOB_APPROVED',
        title: 'Вакансия одобрена',
        message: `Вакансия "${job.title}" опубликована на платформе.`,
        data: { jobId: job.id }
      })
    }
    res.json(job)
  })
)

// Admin: Reject job posting
router.post(
  '/:id/reject',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let job
    try {
      job = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      job = mockDb.jobs.find((item) => item.id === req.params.id)
      if (!job) throw new AppError('Вакансия не найдена', 404)
      job.status = 'REJECTED'
      saveMockDb()
      await createNotification({
        userId: job.authorId,
        type: 'JOB_REJECTED',
        title: 'Вакансия отклонена',
        message: `Вакансия "${job.title}" отклонена модератором.`,
        data: { jobId: job.id }
      })
    }
    res.json(job)
  })
)

// Admin: Close job posting
router.post(
  '/:id/close',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let job
    try {
      job = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: 'CLOSED' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      job = mockDb.jobs.find((item) => item.id === req.params.id)
      if (!job) throw new AppError('Вакансия не найдена', 404)
      job.status = 'CLOSED'
      saveMockDb()
      await createNotification({
        userId: job.authorId,
        type: 'JOB_CLOSED',
        title: 'Вакансия закрыта',
        message: `Вакансия "${job.title}" закрыта.`,
        data: { jobId: job.id }
      })
    }
    res.json(job)
  })
)

// Admin: Delete job posting
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    try {
      await prisma.job.delete({ where: { id: req.params.id } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.jobs.findIndex((item) => item.id === req.params.id)
      if (index === -1) throw new AppError('Вакансия не найдена', 404)
      mockDb.jobs.splice(index, 1)
      saveMockDb()
    }
    res.json({ message: 'Вакансия удалена' })
  })
)

export default router

