import express from 'express'
import multer from 'multer'
import xlsx from 'xlsx'
import ExcelJS from 'exceljs'
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

// Export Alumni to Excel (styled with ExcelJS)
router.get(
  '/export/alumni',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    let users
    try {
      users = await prisma.user.findMany({ where: { role: 'ALUMNI' }, include: { profile: true } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      users = mockDb.alumni.map((profile) => ({ email: profile.email || '', profile }))
    }

    const wb = new ExcelJS.Workbook()
    wb.creator = 'BFET Association Platform'
    wb.created = new Date()

    const ws = wb.addWorksheet('Выпускники', { views: [{ state: 'frozen', ySplit: 3 }] })

    // ── Столбцы (ширина) ──────────────────────────────────────────────
    ws.columns = [
      { key: 'no',           width: 5  },
      { key: 'fullName',     width: 28 },
      { key: 'email',        width: 30 },
      { key: 'graduationYear', width: 10 },
      { key: 'specialty',    width: 30 },
      { key: 'city',         width: 14 },
      { key: 'country',      width: 14 },
      { key: 'company',      width: 22 },
      { key: 'position',     width: 22 },
      { key: 'phone',        width: 16 },
      { key: 'status',       width: 14 },
      { key: 'isMentor',     width: 10 },
    ]

    const COLS = ws.columns.length  // 12

    // ── Строка 1: Заголовок отчёта ────────────────────────────────────
    ws.mergeCells(1, 1, 1, COLS)
    const titleCell = ws.getCell('A1')
    titleCell.value = `Бишкекский финансово-экономический техникум — База выпускников`
    titleCell.font   = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0879A8' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 28

    // ── Строка 2: Дата экспорта ───────────────────────────────────────
    ws.mergeCells(2, 1, 2, COLS)
    const dateCell = ws.getCell('A2')
    dateCell.value = `Дата экспорта: ${new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}  |  Всего выпускников: ${users.length}`
    dateCell.font  = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFFFFFFF' } }
    dateCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1298BB' } }
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(2).height = 18

    // ── Строка 3: Заголовки столбцов ─────────────────────────────────
    const HEADERS = ['№', 'ФИО', 'Email', 'Год выпуска', 'Специальность', 'Город', 'Страна', 'Компания', 'Должность', 'Телефон', 'Статус', 'Ментор']
    const headerRow = ws.getRow(3)
    headerRow.height = 22
    HEADERS.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h
      cell.font  = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F82' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF3BC4C7' } } }
    })

    // ── Данные ────────────────────────────────────────────────────────
    const STATUS_RU = { APPROVED: 'Одобрен', PENDING: 'На проверке', REJECTED: 'Отклонён', BLOCKED: 'Заблокирован' }
    users.forEach((u, idx) => {
      const p = u.profile || {}
      const isEven = idx % 2 === 0
      const rowData = [
        idx + 1,
        p.fullName || '',
        u.email || '',
        p.graduationYear || '',
        p.specialty || '',
        p.city || '',
        p.country || '',
        p.company || '',
        p.position || '',
        p.phone || '',
        STATUS_RU[p.status] || p.status || '',
        p.isMentor ? 'Да' : 'Нет',
      ]
      const row = ws.addRow(rowData)
      row.height = 18
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Calibri', size: 10 }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF0FAFC' : 'FFFFFFFF' } }
        cell.alignment = { vertical: 'middle', wrapText: false }
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFDDEEEE' } },
          right: colNum === COLS ? undefined : { style: 'hair', color: { argb: 'FFDDEEEE' } }
        }
        if (colNum === 1) cell.alignment = { horizontal: 'center', vertical: 'middle' }
        if (colNum === 11) {
          const st = (p.status || '').toUpperCase()
          cell.font = { name: 'Calibri', size: 10, bold: true,
            color: { argb: st === 'APPROVED' ? 'FF16A34A' : st === 'PENDING' ? 'FFB45309' : st === 'REJECTED' || st === 'BLOCKED' ? 'FFDC2626' : 'FF374151' }
          }
        }
        if (colNum === 12) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          if (p.isMentor) cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0879A8' } }
        }
      })
    })

    const filename = `alumni-bfet-${new Date().toISOString().slice(0, 10)}.xlsx`
    const buffer = await wb.xlsx.writeBuffer()
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(buffer)
  })
)

// Export Alumni to CSV
router.get(
  '/export/alumni/csv',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let users
    try {
      users = await prisma.user.findMany({ where: { role: 'ALUMNI' }, include: { profile: true } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      users = mockDb.alumni.map((profile) => ({ email: profile.email || '', profile }))
    }

    const STATUS_RU = { APPROVED: 'Одобрен', PENDING: 'На проверке', REJECTED: 'Отклонён', BLOCKED: 'Заблокирован' }
    const rows = users.map((u, i) => ({
      '№': i + 1,
      'Email': u.email || '',
      'ФИО': u.profile?.fullName || '',
      'Год выпуска': u.profile?.graduationYear || '',
      'Специальность': u.profile?.specialty || '',
      'Группа': u.profile?.groupName || '',
      'Город': u.profile?.city || '',
      'Страна': u.profile?.country || '',
      'Компания': u.profile?.company || '',
      'Должность': u.profile?.position || '',
      'Телефон': u.profile?.phone || '',
      'Статус': STATUS_RU[u.profile?.status] || u.profile?.status || '',
      'Ментор': u.profile?.isMentor ? 'Да' : 'Нет',
    }))

    const dateStr = new Date().toLocaleDateString('ru-RU')
    const headers = Object.keys(rows[0] || {})
    const csv = [
      `"БФЭТ — База выпускников | Дата: ${dateStr} | Всего: ${rows.length}"`,
      '',
      headers.map((h) => `"${h}"`).join(';'),
      ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n')

    const filename = `alumni-bfet-${new Date().toISOString().slice(0, 10)}.csv`
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.send('﻿' + csv)
  })
)

// Export Jobs to CSV
router.get(
  '/export/jobs/csv',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let jobs
    try {
      jobs = await prisma.job.findMany({ include: { company: true } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      jobs = clone(mockDb.jobs || [])
    }

    const rows = jobs.map((j) => ({
      title: j.title || '',
      company: j.company?.name || j.companyId || '',
      city: j.city || '',
      type: j.type || '',
      format: j.format || '',
      salary: j.salary || '',
      status: j.status || '',
      deadline: j.deadline ? new Date(j.deadline).toLocaleDateString('ru-RU') : '',
      createdAt: j.createdAt ? new Date(j.createdAt).toLocaleDateString('ru-RU') : ''
    }))

    const headers = ['Вакансия', 'Компания', 'Город', 'Тип', 'Формат', 'Зарплата', 'Статус', 'Дедлайн', 'Создана']
    const csv = [
      `"БФЭТ — Вакансии | Дата: ${new Date().toLocaleDateString('ru-RU')} | Всего: ${rows.length}"`,
      '',
      headers.map((h) => `"${h}"`).join(';'),
      ...rows.map((row) => Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n')

    res.setHeader('Content-Disposition', `attachment; filename="jobs-bfet-${new Date().toISOString().slice(0, 10)}.csv"`)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.send('﻿' + csv)
  })
)

// Export Donations to CSV
router.get(
  '/export/donations/csv',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let donations
    try {
      donations = await prisma.donation.findMany({ include: { campaign: true } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      const campaigns = clone(mockDb.campaigns || [])
      donations = campaigns.flatMap((c) =>
        (c.donations || []).map((d) => ({ ...d, campaign: c }))
      )
    }

    const rows = donations.map((d) => ({
      campaign: d.campaign?.title?.ru || d.campaign?.title || '',
      donorName: d.isAnonymous ? 'Анонимно' : (d.donorName || ''),
      amount: d.amount || 0,
      currency: 'KGS',
      status: d.status || '',
      date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('ru-RU') : ''
    }))

    const headers = ['Кампания', 'Донор', 'Сумма', 'Валюта', 'Статус', 'Дата']
    const csv = [
      `"БФЭТ — Взносы | Дата: ${new Date().toLocaleDateString('ru-RU')} | Всего записей: ${rows.length}"`,
      '',
      headers.map((h) => `"${h}"`).join(';'),
      ...rows.map((row) => Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n')

    res.setHeader('Content-Disposition', `attachment; filename="donations-bfet-${new Date().toISOString().slice(0, 10)}.csv"`)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.send('﻿' + csv)
  })
)

// Export Events to CSV
router.get(
  '/export/events/csv',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let events
    try {
      events = await prisma.event.findMany({ include: { registrations: true } })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      events = clone(mockDb.events || [])
    }

    const rows = events.map((ev) => ({
      title: ev.title?.ru || ev.title || '',
      startsAt: ev.startsAt ? new Date(ev.startsAt).toLocaleDateString('ru-RU') : '',
      location: ev.location || '',
      format: ev.format || '',
      status: ev.status || '',
      registrations: (ev.registrations || []).length
    }))

    const headers = ['Название', 'Дата', 'Место', 'Формат', 'Статус', 'Участников']
    const csv = [
      `"БФЭТ — Мероприятия | Дата: ${new Date().toLocaleDateString('ru-RU')} | Всего: ${rows.length}"`,
      '',
      headers.map((h) => `"${h}"`).join(';'),
      ...rows.map((row) => Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n')

    res.setHeader('Content-Disposition', `attachment; filename="events-bfet-${new Date().toISOString().slice(0, 10)}.csv"`)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.send('﻿' + csv)
  })
)

// Export Mentorship requests to CSV
router.get(
  '/export/mentorship/csv',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    let requests
    try {
      requests = await prisma.mentorship.findMany({
        include: {
          mentor: { include: { profile: true } },
          student: { include: { profile: true } }
        }
      })
    } catch (error) {
      if (!isPrismaUnavailable(error)) throw error
      requests = clone(mockDb.mentorships || [])
    }

    const rows = requests.map((r) => ({
      mentor:  r.mentor?.profile?.fullName  || r.mentorId  || '',
      student: r.student?.profile?.fullName || r.studentId || '',
      goals:   r.goals  || '',
      status:  r.status || '',
      date:    r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU') : ''
    }))

    const headers = ['Ментор', 'Студент', 'Цели', 'Статус', 'Дата']
    const csv = [
      `"БФЭТ — Менторство | Дата: ${new Date().toLocaleDateString('ru-RU')} | Всего: ${rows.length}"`,
      '',
      headers.map((h) => `"${h}"`).join(';'),
      ...rows.map((row) => Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n')

    res.setHeader('Content-Disposition', `attachment; filename="mentorship-bfet-${new Date().toISOString().slice(0, 10)}.csv"`)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.send('﻿' + csv)
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
