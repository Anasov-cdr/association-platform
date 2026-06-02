import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import { clone, isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { createAdminNotification, createNotification } from './notificationService.js'
import { sendRegistrationApprovedEmail, sendRegistrationRejectedEmail } from './emailService.js'
import bcrypt from 'bcryptjs'

const STAFF_ROLES = new Set(['ADMIN', 'MODERATOR'])
const SERVICE_ADMIN_EMAILS = new Set(['admin@alumni.local'])

const getMockProfileUser = (profile) =>
  mockDb.users.find((item) => item.id === profile.userId || item.email === profile.user?.email)

const isStaffProfile = (profile) => {
  const user = profile.user || getMockProfileUser(profile) || {}
  const role = user.role || profile.user?.role || 'ALUMNI'
  const email = (user.email || profile.user?.email || profile.email || '').trim().toLowerCase()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const fullName = (profile.fullName || '').toLowerCase()
  const specialty = (profile.specialty || '').toLowerCase()

  return (
    STAFF_ROLES.has(role) ||
    (adminEmail && email === adminEmail) ||
    SERVICE_ADMIN_EMAILS.has(email) ||
    (fullName.includes('администратор') && specialty.includes('администр'))
  )
}

const filterMockProfiles = (filters = {}) => {
  let profiles = mockDb.alumni.filter((profile) => {
    return profile.status === (filters.status || 'APPROVED') && !isStaffProfile(profile)
  })

  if (filters.graduationYear) {
    profiles = profiles.filter((profile) => profile.graduationYear === parseInt(filters.graduationYear))
  }
  if (filters.specialty) {
    profiles = profiles.filter((profile) => profile.specialty?.toLowerCase().includes(String(filters.specialty).toLowerCase()))
  }
  if (filters.city) {
    profiles = profiles.filter((profile) => profile.city?.toLowerCase().includes(String(filters.city).toLowerCase()))
  }
  if (filters.isMentor !== undefined || filters.mentor !== undefined) {
    const value = String(filters.isMentor ?? filters.mentor) === 'true'
    profiles = profiles.filter((profile) => profile.isMentor === value)
  }
  if (filters.featured === 'true' || filters.featured === true) {
    profiles = profiles.filter((profile) => profile.isFeatured === true)
  }
  if (filters.employer === 'true' || filters.employer === true) {
    profiles = profiles.filter((profile) => profile.canHelpStudents === true)
  }

  return clone(profiles)
}

export const getAlumniProfiles = async (filters = {}) => {
  const where = { status: filters.status || 'APPROVED' }

  if (filters.graduationYear) {
    where.graduationYear = parseInt(filters.graduationYear)
  }

  if (filters.specialty) {
    where.specialty = { contains: filters.specialty, mode: 'insensitive' }
  }

  if (filters.city) {
    where.city = { contains: filters.city, mode: 'insensitive' }
  }

  if (filters.isMentor !== undefined || filters.mentor !== undefined) {
    where.isMentor = String(filters.isMentor ?? filters.mentor) === 'true'
  }
  if (filters.featured === 'true' || filters.featured === true) {
    where.isFeatured = true
  }
  if (filters.employer === 'true' || filters.employer === true) {
    where.canHelpStudents = true
  }

  try {
    const profiles = await prisma.alumniProfile.findMany({
      where,
      include: { user: { select: { email: true, id: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return profiles.filter((profile) => !isStaffProfile(profile))
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    return filterMockProfiles(filters)
  }
}

export const getAlumniProfile = async (profileId) => {
  let profile

  try {
    profile = await prisma.alumniProfile.findUnique({
      where: { id: profileId },
      include: { user: { select: { email: true, id: true, role: true } } }
    })
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    profile = mockDb.alumni.find((item) => item.id === profileId)
  }

  if (!profile || isStaffProfile(profile)) {
    throw new AppError('Профиль не найден', 404)
  }

  return profile
}

export const updateAlumniProfile = async (userId, data) => {
  let profile

  try {
    profile = await prisma.alumniProfile.findUnique({
      where: { userId }
    })

    if (!profile) {
      throw new AppError('Профиль не найден', 404)
    }

    const updated = await prisma.alumniProfile.update({
      where: { userId },
      data: {
        fullName: data.fullName || profile.fullName,
        photoUrl: data.photoUrl,
        graduationYear: data.graduationYear || profile.graduationYear,
        specialty: data.specialty || profile.specialty,
        groupName: data.groupName,
        city: data.city,
        country: data.country,
        company: data.company,
        position: data.position,
        bio: data.bio,
        achievements: data.achievements,
        skills: data.skills || profile.skills,
        socialLinks: data.socialLinks,
        phone: data.phone,
        showEmail: data.showEmail !== undefined ? data.showEmail : profile.showEmail,
        showPhone: data.showPhone !== undefined ? data.showPhone : profile.showPhone,
        isMentor: data.isMentor !== undefined ? data.isMentor : profile.isMentor,
        canHelpStudents: data.canHelpStudents !== undefined ? data.canHelpStudents : profile.canHelpStudents,
        isSponsor: data.isSponsor !== undefined ? data.isSponsor : profile.isSponsor,
        mentorArea: data.mentorArea,
        mentorFormat: data.mentorFormat,
        mentorAvailability: data.mentorAvailability
      }
    })

    return updated
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    const index = mockDb.alumni.findIndex((item) => item.userId === userId)
    if (index === -1) throw new AppError('Профиль не найден', 404)
    mockDb.alumni[index] = { ...mockDb.alumni[index], ...data }
    saveMockDb()
    return clone(mockDb.alumni[index])
  }
}

export const updateAlumniProfileById = async (profileId, data) => {
  try {
    return await prisma.alumniProfile.update({
      where: { id: profileId },
      data: {
        fullName: data.fullName,
        photoUrl: data.photoUrl,
        graduationYear: data.graduationYear,
        specialty: data.specialty,
        groupName: data.groupName,
        city: data.city,
        country: data.country,
        company: data.company,
        position: data.position,
        bio: data.bio,
        skills: data.skills,
        socialLinks: data.socialLinks,
        phone: data.phone,
        showEmail: data.showEmail,
        showPhone: data.showPhone,
        isMentor: data.isMentor,
        canHelpStudents: data.canHelpStudents,
        isSponsor: data.isSponsor,
        isFeatured: data.isFeatured,
        featuredTitle: data.featuredTitle
      }
    })
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    const profile = mockDb.alumni.find((item) => item.id === profileId || item.userId === profileId)
    if (!profile) throw new AppError('Профиль не найден', 404)
    Object.assign(profile, data)
    saveMockDb()
    return clone(profile)
  }
}

export const getOwnAlumniProfile = async (userId) => {
  try {
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, id: true } } }
    })

    if (!profile) throw new AppError('Профиль не найден', 404)
    return profile
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    const profile = mockDb.alumni.find((item) => item.userId === userId)
    if (!profile) throw new AppError('Профиль не найден', 404)
    return clone(profile)
  }
}

export const approveAlumniProfile = async (profileId) => {
  try {
    const profile = await prisma.alumniProfile.update({
      where: { id: profileId },
      data: { status: 'APPROVED' }
    })

    return profile
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    const profile = mockDb.alumni.find((item) => item.id === profileId || item.userId === profileId)
    if (!profile) throw new AppError('Профиль не найден', 404)
    profile.status = 'APPROVED'
    saveMockDb()
    await createNotification({
      userId: profile.userId,
      type: 'PROFILE_APPROVED',
      title: 'Профиль одобрен',
      message: 'Ваш профиль выпускника опубликован в каталоге.',
      data: { profileId: profile.id }
    })
    const userEmail = profile.user?.email || profile.email
    if (userEmail) sendRegistrationApprovedEmail(userEmail, profile.fullName).catch(() => {})
    return clone(profile)
  }
}

export const rejectAlumniProfile = async (profileId) => {
  try {
    const profile = await prisma.alumniProfile.update({
      where: { id: profileId },
      data: { status: 'REJECTED' }
    })

    return profile
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    const profile = mockDb.alumni.find((item) => item.id === profileId || item.userId === profileId)
    if (!profile) throw new AppError('Профиль не найден', 404)
    profile.status = 'REJECTED'
    saveMockDb()
    await createNotification({
      userId: profile.userId,
      type: 'PROFILE_REJECTED',
      title: 'Профиль отклонен',
      message: 'Администратор отклонил профиль. Проверьте данные и отправьте повторно.',
      data: { profileId: profile.id }
    })
    const userEmail = profile.user?.email || profile.email
    if (userEmail) sendRegistrationRejectedEmail(userEmail, profile.fullName).catch(() => {})
    return clone(profile)
  }
}

export const getPendingProfiles = async () => {
  try {
    const profiles = await prisma.alumniProfile.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { email: true, id: true } } },
      orderBy: { createdAt: 'asc' }
    })

    return profiles
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    return clone(mockDb.alumni.filter((profile) => profile.status === 'PENDING'))
  }
}

export const getAllProfilesForAdmin = async () => {
  try {
    return await prisma.alumniProfile.findMany({
      include: { user: { select: { email: true, id: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    }).then((profiles) => profiles.filter((profile) => !isStaffProfile(profile)))
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    return clone(mockDb.alumni.filter((profile) => !isStaffProfile(profile)))
  }
}

export const setAlumniProfileStatus = async (profileId, status) => {
  try {
    return await prisma.alumniProfile.update({
      where: { id: profileId },
      data: { status }
    })
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    const profile = mockDb.alumni.find((item) => item.id === profileId || item.userId === profileId)
    if (!profile) throw new AppError('Профиль не найден', 404)
    profile.status = status
    saveMockDb()
    await createNotification({
      userId: profile.userId,
      type: 'PROFILE_STATUS',
      title: 'Статус профиля изменен',
      message: `Новый статус профиля: ${status}.`,
      data: { profileId: profile.id, status }
    })
    return clone(profile)
  }
}

export const createAlumniApplication = async (data) => {
  const email = data.email || `alumni-${Date.now()}@pending.local`
  const passwordHash = await bcrypt.hash(data.password, 10)
  const profileData = {
    fullName: data.fullName,
    graduationYear: data.graduationYear || new Date().getFullYear(),
    specialty: data.specialty || 'Не указано',
    groupName: data.groupName || data.group || '',
    city: data.city || '',
    country: data.country || '',
    company: data.company || '',
    position: data.position || '',
    bio: data.bio || '',
    phone: data.phone || '',
    showEmail: Boolean(data.showEmail),
    showPhone: Boolean(data.showPhone),
    isMentor: Boolean(data.isMentor),
    canHelpStudents: Boolean(data.canHelpStudents),
    status: 'PENDING'
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new AppError('Пользователь с таким email уже существует', 409)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ALUMNI',
        profile: { create: profileData }
      },
      include: { profile: true }
    })

    return user.profile
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    if (mockDb.users.some((u) => u.email === email)) {
      throw new AppError('Пользователь с таким email уже существует', 409)
    }
    const profile = {
      id: `profile-${Date.now()}`,
      userId: `user-${Date.now()}`,
      ...profileData,
      user: { id: `user-${Date.now()}`, email },
      createdAt: new Date().toISOString()
    }
    profile.user.id = profile.userId
    mockDb.alumni.push(profile)
    mockDb.users.push({
      id: profile.userId,
      email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: 'ALUMNI',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        status: profile.status
      }
    })
    await createAdminNotification({
      type: 'ALUMNI_PENDING',
      title: 'Новая анкета выпускника',
      message: `${profile.fullName} отправил профиль на проверку.`,
      data: { profileId: profile.id }
    })
    saveMockDb()
    return clone(profile)
  }
}
