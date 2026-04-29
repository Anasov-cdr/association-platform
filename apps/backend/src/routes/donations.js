import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { createAdminNotification, createNotification } from '../services/notificationService.js'

const router = express.Router()

const campaignSchema = z.object({
  title: z.record(z.string()),
  description: z.record(z.string()).optional(),
  goalAmount: z.number().positive(),
  publicationStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED').optional()
})

const donationSchema = z.object({
  amount: z.number().positive(),
  donorName: z.string().optional(),
  anonymous: z.boolean().optional()
})

const donationStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'rejected'])
})

// Get all campaigns
router.get(
  '/campaigns',
  asyncHandler(async (req, res) => {
    let campaigns
    try {
      campaigns = await prisma.donationCampaign.findMany({
        where: { publicationStatus: 'PUBLISHED' },
        include: { donations: { select: { amount: true, donorName: true } } },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      campaigns = clone(mockDb.campaigns.filter((item) => (item.publicationStatus || 'PUBLISHED') === 'PUBLISHED'))
    }
    res.json(campaigns)
  })
)

router.get(
  '/admin/campaigns',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let campaigns
    try {
      campaigns = await prisma.donationCampaign.findMany({
        include: { donations: { select: { amount: true, donorName: true } } },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      campaigns = clone(mockDb.campaigns)
    }
    res.json(campaigns)
  })
)

// Admin: list all donations across campaigns.
router.get(
  '/admin/donations',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let donations
    try {
      donations = await prisma.donation.findMany({
        include: { campaign: true, user: { select: { email: true, profile: true } } },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      donations = mockDb.campaigns.flatMap((campaign) =>
        (campaign.donations || []).map((donation) => ({
          ...donation,
          campaign: { id: campaign.id, title: campaign.title },
          campaignTitle: campaign.title
        }))
      )
    }
    res.json(clone(donations))
  })
)

// Admin: update donation status.
router.patch(
  '/admin/donations/:id/status',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const { status } = donationStatusSchema.parse(req.body)
    let donation
    try {
      donation = await prisma.donation.update({
        where: { id: req.params.id },
        data: { status }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const campaign = mockDb.campaigns.find((item) => (item.donations || []).some((donation) => donation.id === req.params.id))
      donation = campaign?.donations?.find((item) => item.id === req.params.id)
      if (!campaign || !donation) throw new AppError('Пожертвование не найдено', 404)
      const wasCompleted = donation.status === 'completed'
      donation.status = status
      const isCompleted = status === 'completed'
      if (!wasCompleted && isCompleted) campaign.raisedAmount += Number(donation.amount)
      if (wasCompleted && !isCompleted) campaign.raisedAmount -= Number(donation.amount)
      saveMockDb()
      if (donation.userId) {
        await createNotification({
          userId: donation.userId,
          type: 'DONATION_STATUS',
          title: 'Статус пожертвования изменен',
          message: `Статус пожертвования: ${status}.`,
          data: { donationId: donation.id, campaignId: campaign.id, status }
        })
      }
    }
    res.json(donation)
  })
)

// Get single campaign
router.get(
  '/campaigns/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    let campaign
    try {
      campaign = await prisma.donationCampaign.findUnique({
        where: { id: req.params.id },
        include: { donations: { select: { amount: true, donorName: true, anonymous: true } } }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      campaign = mockDb.campaigns.find((item) => item.id === req.params.id)
    }
    if (!campaign) throw new AppError('Кампания не найдена', 404)
    if ((campaign.publicationStatus || 'PUBLISHED') !== 'PUBLISHED' && !['ADMIN', 'MODERATOR'].includes(req.user?.role)) {
      throw new AppError('Кампания не найдена', 404)
    }
    res.json(clone(campaign))
  })
)

// Admin: Create campaign
router.post(
  '/campaigns',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = campaignSchema.parse(req.body)
    let campaign
    try {
      campaign = await prisma.donationCampaign.create({
        data: {
          ...data,
          goalAmount: data.goalAmount.toString()
        }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      campaign = { id: `campaign-${Date.now()}`, publicationStatus: 'PUBLISHED', ...data, raisedAmount: 0, donations: [], createdAt: new Date().toISOString() }
      mockDb.campaigns.unshift(campaign)
      saveMockDb()
    }
    res.status(201).json(campaign)
  })
)

// Make donation
router.post(
  '/donate',
  asyncHandler(async (req, res) => {
    const { campaignId, ...donationData } = donationSchema.and(z.object({ campaignId: z.string() })).parse(req.body)

    let donation
    try {
      const campaign = await prisma.donationCampaign.findUnique({ where: { id: campaignId } })
      if (!campaign) throw new AppError('Кампания не найдена', 404)

      donation = await prisma.donation.create({
        data: {
          userId: req.user?.userId,
          campaignId,
          ...donationData,
          amount: donationData.amount.toString(),
          status: 'completed'
        }
      })

      const totalRaised = await prisma.donation.aggregate({
        where: { campaignId },
        _sum: { amount: true }
      })

      await prisma.donationCampaign.update({
        where: { id: campaignId },
        data: { raisedAmount: totalRaised._sum.amount || 0 }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const campaign = mockDb.campaigns.find((item) => item.id === campaignId)
      if (!campaign) throw new AppError('Кампания не найдена', 404)
      if ((campaign.publicationStatus || 'PUBLISHED') !== 'PUBLISHED') throw new AppError('Кампания не найдена', 404)
      donation = { id: `donation-${Date.now()}`, campaignId, ...donationData, status: 'pending', createdAt: new Date().toISOString() }
      campaign.donations.push(donation)
      saveMockDb()
      await createAdminNotification({
        type: 'DONATION_PENDING',
        title: 'Новое пожертвование',
        message: `${donation.donorName || 'Анонимный донор'} отправил пожертвование ${donation.amount}.`,
        data: { donationId: donation.id, campaignId }
      })
    }

    res.status(201).json({ message: 'Спасибо за вашу помощь!', donation })
  })
)

// Admin: Update campaign
router.put(
  '/campaigns/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = campaignSchema.partial().parse(req.body)
    let campaign
    try {
      campaign = await prisma.donationCampaign.update({
        where: { id: req.params.id },
        data: {
          ...data,
          goalAmount: data.goalAmount ? data.goalAmount.toString() : undefined
        }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.campaigns.findIndex((item) => item.id === req.params.id)
      if (index === -1) throw new AppError('Кампания не найдена', 404)
      mockDb.campaigns[index] = { ...mockDb.campaigns[index], ...data }
      campaign = mockDb.campaigns[index]
      saveMockDb()
    }
    res.json(campaign)
  })
)

// Admin: Delete campaign
router.delete(
  '/campaigns/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    try {
      await prisma.donationCampaign.delete({ where: { id: req.params.id } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const index = mockDb.campaigns.findIndex((item) => item.id === req.params.id)
      if (index === -1) throw new AppError('Кампания не найдена', 404)
      mockDb.campaigns.splice(index, 1)
      saveMockDb()
    }
    res.json({ message: 'Кампания удалена' })
  })
)

export default router

