import express from 'express'
import { z } from 'zod'
import {
  getAlumniProfiles,
  getAlumniProfile,
  updateAlumniProfile,
  approveAlumniProfile,
  rejectAlumniProfile,
  getPendingProfiles,
  createAlumniApplication,
  getAllProfilesForAdmin,
  updateAlumniProfileById,
  setAlumniProfileStatus,
  getOwnAlumniProfile
} from '../services/alumniService.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

const optionalString = z.preprocess(
  (value) => value === null ? '' : value,
  z.string().optional()
)

const optionalStringArray = z.preprocess(
  (value) => value === null ? [] : value,
  z.array(z.string()).optional()
)

const optionalStringRecord = z.preprocess(
  (value) => value === null ? {} : value,
  z.record(z.string()).optional()
)

// Validation schema
const alumniUpdateSchema = z.object({
  fullName: optionalString,
  photoUrl: optionalString,
  graduationYear: z.number().int().optional(),
  specialty: optionalString,
  groupName: optionalString,
  city: optionalString,
  country: optionalString,
  company: optionalString,
  position: optionalString,
  bio: optionalString,
  achievements: optionalString,
  skills: optionalStringArray,
  socialLinks: optionalStringRecord,
  phone: optionalString,
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  isMentor: z.boolean().optional(),
  canHelpStudents: z.boolean().optional(),
  mentorArea: optionalString,
  mentorFormat: optionalString,
  mentorAvailability: optionalString,
  isSponsor: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  featuredTitle: optionalString
})

const alumniRegisterSchema = z.object({
  fullName: z.string().min(2),
  graduationYear: z.number().int().optional(),
  specialty: z.string().optional(),
  group: z.string().optional(),
  groupName: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  bio: z.string().optional(),
  isMentor: z.boolean().optional(),
  canHelpStudents: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  password: z.string().min(8)
})

const statusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'])
})

// Get featured alumni for homepage showcase
router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const profiles = await getAlumniProfiles({ featured: 'true', status: 'APPROVED' })
    res.json(profiles)
  })
)

// Get all approved alumni
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const profiles = await getAlumniProfiles(req.query)
    res.json(profiles)
  })
)

// Public alumni registration application
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = alumniRegisterSchema.parse(req.body)
    const profile = await createAlumniApplication(data)
    res.status(201).json({ message: 'Анкета отправлена на проверку', profile })
  })
)

// Admin: Get all alumni profiles
router.get(
  '/admin/all',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const profiles = await getAllProfilesForAdmin()
    res.json(profiles)
  })
)

// Admin: update alumni profile fields
router.put(
  '/admin/:id',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = alumniUpdateSchema.parse(req.body)
    const profile = await updateAlumniProfileById(req.params.id, data)
    res.json({ message: 'Профиль выпускника обновлен', profile })
  })
)

// Admin: Set arbitrary profile status
router.patch(
  '/admin/:id/status',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const data = statusSchema.parse(req.body)
    const profile = await setAlumniProfileStatus(req.params.id, data.status)
    res.json({ message: 'Статус профиля обновлен', profile })
  })
)

// Get own alumni profile
router.get(
  '/profile/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const profile = await getOwnAlumniProfile(req.user.userId)
    res.json(profile)
  })
)

// Get single alumni profile
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const profile = await getAlumniProfile(req.params.id)
    res.json(profile)
  })
)

// Update own profile
router.put(
  '/profile/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = alumniUpdateSchema.parse(req.body)
    const profile = await updateAlumniProfile(req.user.userId, data)
    res.json(profile)
  })
)

// Admin: Get pending profiles
router.get(
  '/admin/pending',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const profiles = await getPendingProfiles()
    res.json(profiles)
  })
)

// Admin: Approve profile
router.post(
  '/admin/:id/approve',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const profile = await approveAlumniProfile(req.params.id)
    res.json({ message: 'Профиль одобрен', profile })
  })
)

// Admin: Reject profile
router.post(
  '/admin/:id/reject',
  authMiddleware,
  requireRole('ADMIN', 'MODERATOR'),
  asyncHandler(async (req, res) => {
    const profile = await rejectAlumniProfile(req.params.id)
    res.json({ message: 'Профиль отклонен', profile })
  })
)

export default router
