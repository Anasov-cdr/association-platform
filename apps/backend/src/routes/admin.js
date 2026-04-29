import express from 'express'
import multer from 'multer'
import xlsx from 'xlsx'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { listAuditLogs } from '../services/auditService.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

const countBy = (items, key) =>
  items.reduce((acc, item) => {
    const value = item[key] || 'unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})

const topBy = (items, key, limit = 5) => {
  const grouped = countBy(items, key)
  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

const safeMockExport = () => {
  const data = clone(mockDb)
  data.users = (data.users || []).map(({ passwordHash, password, ...user }) => user)
  data.exportedAt = new Date().toISOString()
  data.exportVersion = 1
  return data
}

router.get(
  '/analytics',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    try {
      const [
        alumniTotal,
        pendingProfiles,
        jobsTotal,
        publishedJobs,
        newsTotal,
        eventsTotal,
        documentsTotal,
        companiesTotal
      ] = await Promise.all([
        prisma.alumniProfile.count(),
        prisma.alumniProfile.count({ where: { status: 'PENDING' } }),
        prisma.job.count(),
        prisma.job.count({ where: { status: 'PUBLISHED' } }),
        prisma.newsPost.count(),
        prisma.event.count(),
        prisma.document.count(),
        prisma.company.count()
      ])

      res.json({
        totals: { alumni: alumniTotal, pendingProfiles, jobs: jobsTotal, publishedJobs, news: newsTotal, events: eventsTotal, documents: documentsTotal, companies: companiesTotal },
        statuses: {},
        topSpecialties: [],
        topCities: [],
        donations: { campaigns: 0, raised: 0, pending: 0, completed: 0 },
        activity: []
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error

      const donations = mockDb.campaigns.flatMap((campaign) => campaign.donations || [])
      const applications = mockDb.jobs.flatMap((job) => job.applications || [])
      const activity = [
        ...mockDb.news.map((item) => ({ type: 'news', title: item.title?.ru || item.slug, createdAt: item.publishedAt })),
        ...mockDb.events.map((item) => ({ type: 'event', title: item.title?.ru || item.id, createdAt: item.startsAt })),
        ...mockDb.jobs.map((item) => ({ type: 'job', title: item.title, createdAt: item.createdAt })),
        ...mockDb.chatMessages.map((item) => ({ type: 'chat', title: item.text, createdAt: item.createdAt }))
      ]
        .filter((item) => item.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8)

      res.json({
        totals: {
          alumni: mockDb.alumni.length,
          pendingProfiles: mockDb.alumni.filter((item) => item.status === 'PENDING').length,
          jobs: mockDb.jobs.length,
          publishedJobs: mockDb.jobs.filter((item) => item.status === 'PUBLISHED').length,
          applications: applications.length,
          news: mockDb.news.length,
          events: mockDb.events.length,
          documents: mockDb.documents.length,
          companies: mockDb.companies.length,
          mentors: mockDb.alumni.filter((item) => item.isMentor).length,
          chatReports: mockDb.chatReports.length
        },
        statuses: {
          profiles: countBy(mockDb.alumni, 'status'),
          jobs: countBy(mockDb.jobs, 'status'),
          applications: countBy(applications, 'status'),
          mentorships: countBy(mockDb.mentorships, 'status'),
          chatReports: countBy(mockDb.chatReports, 'status')
        },
        topSpecialties: topBy(mockDb.alumni, 'specialty'),
        topCities: topBy(mockDb.alumni, 'city'),
        donations: {
          campaigns: mockDb.campaigns.length,
          raised: mockDb.campaigns.reduce((sum, item) => sum + Number(item.raisedAmount || 0), 0),
          pending: donations.filter((item) => item.status === 'pending').length,
          completed: donations.filter((item) => item.status === 'completed').length
        },
        activity
      })
    }
  })
)

router.get(
  '/audit',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    res.json(listAuditLogs({ limit: req.query.limit }))
  })
)

// Export platform content as JSON without password hashes.
router.get(
  '/export/content',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    let payload
    try {
      const [
        alumni,
        news,
        events,
        documents,
        campaigns,
        companies,
        jobs
      ] = await Promise.all([
        prisma.alumniProfile.findMany({ include: { user: { select: { email: true, role: true, createdAt: true } } } }),
        prisma.newsPost.findMany({ include: { comments: true } }),
        prisma.event.findMany({ include: { registrations: true } }),
        prisma.document.findMany(),
        prisma.donationCampaign.findMany({ include: { donations: true } }),
        prisma.company.findMany(),
        prisma.job.findMany({ include: { company: true, applications: true } })
      ])

      payload = {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        college: clone(mockDb.college || {}),
        alumni,
        news,
        events,
        documents,
        campaigns,
        companies,
        jobs
      }
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      payload = safeMockExport()
    }

    res.setHeader('Content-Disposition', `attachment; filename="bfet-alumni-content-${new Date().toISOString().slice(0, 10)}.json"`)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.send(JSON.stringify(payload, null, 2))
  })
)

// Export Alumni to Excel
router.get(
  '/export/alumni',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    let users
    try {
      users = await prisma.user.findMany({
        where: { role: 'ALUMNI' },
        include: { profile: true }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      users = mockDb.alumni.map((profile) => ({ email: profile.user.email, profile }))
    }

    const data = users.map((u) => ({
      Email: u.email,
      ФИО: u.profile?.fullName || '',
      Год_выпуска: u.profile?.graduationYear || '',
      Специальность: u.profile?.specialty || '',
      Телефон: u.profile?.phone || ''
    }))

    const wb = xlsx.utils.book_new()
    const ws = xlsx.utils.json_to_sheet(data)
    xlsx.utils.book_append_sheet(wb, ws, 'Alumni')
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    res.setHeader('Content-Disposition', 'attachment; filename="alumni.xlsx"')
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(buffer)
  })
)

// Import Alumni from Excel
router.post(
  '/import/alumni',
  authMiddleware,
  requireRole('ADMIN'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })

    const wb = xlsx.read(req.file.buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = xlsx.utils.sheet_to_json(ws)

    let imported = 0
    let errors = []

    for (const row of data) {
      try {
        const email = row['Email'] || row['email']
        const fullName = row['ФИО'] || row['fullName'] || row['name']
        const graduationYear = parseInt(row['Год_выпуска'] || row['year']) || new Date().getFullYear()
        const specialty = row['Специальность'] || row['specialty'] || 'Не указана'
        const phone = row['Телефон'] || row['phone'] || ''
        const password = row['Пароль'] || row['password']

        if (!email || !fullName || !password || String(password).length < 8) {
          errors.push(`Пропущена строка: ${email || 'без email'} - нужны Email, ФИО и пароль минимум 8 символов`)
          continue
        }

        const passwordHash = await bcrypt.hash(String(password), 10)

        try {
          const existing = await prisma.user.findUnique({ where: { email } })
          if (existing) continue
          
          await prisma.user.create({
            data: {
              email,
              passwordHash,
              role: 'ALUMNI',
              profile: {
                create: {
                  fullName,
                  graduationYear,
                  specialty,
                  phone,
                  status: 'APPROVED'
                }
              }
            }
          })
        } catch (err) {
          if (!isPrismaUnavailable(err)) throw err
          if (mockDb.alumni.some((profile) => profile.user.email === email)) continue
          mockDb.alumni.push({
            id: `profile-${Date.now()}-${imported}`,
            userId: `user-${Date.now()}-${imported}`,
            fullName,
            graduationYear,
            specialty,
            phone,
            status: 'APPROVED',
            user: { id: `user-${Date.now()}-${imported}`, email }
          })
          mockDb.users = mockDb.users || []
          mockDb.users.push({
            id: mockDb.alumni[mockDb.alumni.length - 1].userId,
            email,
            passwordHash,
            role: 'ALUMNI',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            profile: {
              id: mockDb.alumni[mockDb.alumni.length - 1].id,
              fullName,
              status: 'APPROVED'
            }
          })
          saveMockDb()
        }
        imported++
      } catch (err) {
        errors.push(err.message)
      }
    }

    res.json({ message: `Успешно импортировано: ${imported}`, errors })
  })
)

export default router

