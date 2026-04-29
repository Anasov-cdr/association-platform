import express from 'express'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { clone, mockDb, saveMockDb } from '../mockData.js'

const router = express.Router()

const siteSchema = z.object({
  name: z.string().optional(),
  parentOrganization: z.string().optional(),
  website: z.string().optional(),
  foundedYear: z.number().optional(),
  staffCount: z.string().optional(),
  studentCount: z.string().optional(),
  address: z.string().optional(),
  phones: z.array(z.string()).optional(),
  email: z.string().optional(),
  workingHours: z.string().optional(),
  mission: z.string().optional(),
  specialties: z.array(z.string()).optional()
})

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(clone(mockDb.college || {}))
  })
)

router.put(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = siteSchema.parse(req.body)
    mockDb.college = { ...(mockDb.college || {}), ...data }
    saveMockDb()
    res.json(clone(mockDb.college))
  })
)

export default router
