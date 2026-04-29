import express from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'

const router = express.Router()

const pickCompanyData = (body) => {
  const { name, logoUrl, description, website, city, country } = body
  return { name, logoUrl, description, website, city, country }
}

// Get all companies
router.get('/', asyncHandler(async (req, res) => {
  let companies
  try {
    companies = await prisma.company.findMany({
      include: { _count: { select: { jobs: true } } }
    })
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    companies = clone(mockDb.companies)
  }
  res.json(companies)
}))

// Get single company
router.get('/:id', asyncHandler(async (req, res) => {
  let company
  try {
    company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: { jobs: { where: { status: 'PUBLISHED' } } }
    })
    if (!company) throw new AppError('Компания не найдена', 404)
    const alumni = await prisma.alumniProfile.findMany({
      where: { company: { contains: company.name, mode: 'insensitive' }, status: 'APPROVED' },
      select: { id: true, fullName: true, position: true, specialty: true, photoUrl: true }
    })
    company = { ...company, alumni }
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    company = mockDb.companies.find((item) => item.id === req.params.id)
    if (company) {
      const alumni = mockDb.alumni.filter((p) =>
        p.status === 'APPROVED' && p.company?.toLowerCase().includes(company.name?.toLowerCase())
      ).map((p) => ({ id: p.id, fullName: p.fullName, position: p.position, specialty: p.specialty, photoUrl: p.photoUrl }))
      company = { ...company, jobs: mockDb.jobs.filter((job) => job.companyId === company.id && job.status === 'PUBLISHED'), alumni }
    }
  }
  if (!company) throw new AppError('Компания не найдена', 404)
  res.json(clone(company))
}))

// Create company
router.post('/', authMiddleware, requireRole('ADMIN', 'MODERATOR'), asyncHandler(async (req, res) => {
  const { name, logoUrl, description, website, city, country } = pickCompanyData(req.body)
  let company
  try {
    company = await prisma.company.create({
      data: { name, logoUrl, description, website, city, country }
    })
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    company = { id: `company-${Date.now()}`, name, logoUrl, description, website, city, country, _count: { jobs: 0 } }
    mockDb.companies.unshift(company)
    saveMockDb()
  }
  res.status(201).json(company)
}))

router.put('/:id', authMiddleware, requireRole('ADMIN', 'MODERATOR'), asyncHandler(async (req, res) => {
  const data = pickCompanyData(req.body)
  let company
  try {
    company = await prisma.company.update({
      where: { id: req.params.id },
      data
    })
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    const index = mockDb.companies.findIndex((item) => item.id === req.params.id)
    if (index === -1) throw new AppError('Компания не найдена', 404)
    mockDb.companies[index] = { ...mockDb.companies[index], ...data }
    company = mockDb.companies[index]
    saveMockDb()
  }
  res.json(company)
}))

router.delete('/:id', authMiddleware, requireRole('ADMIN', 'MODERATOR'), asyncHandler(async (req, res) => {
  try {
    await prisma.company.delete({ where: { id: req.params.id } })
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    const index = mockDb.companies.findIndex((item) => item.id === req.params.id)
    if (index === -1) throw new AppError('Компания не найдена', 404)
    mockDb.companies.splice(index, 1)
    saveMockDb()
  }
  res.json({ message: 'Компания удалена' })
}))

export default router

