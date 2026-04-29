import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import { mockDb, saveMockDb } from '../mockData.js'

const generateTokens = (userId, email, role) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '7d' }
  )

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  )

  return { accessToken, refreshToken }
}

const toAuthResponse = (user) => {
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role)

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile
    }
  }
}

const isPrismaConnectionError = (error) =>
  error?.name?.startsWith('Prisma') ||
  error?.code?.startsWith?.('P') ||
  error?.message?.includes?.('Can\'t reach database server')

const verifyFallbackPassword = async (user, password) => {
  if (user.passwordHash) return bcrypt.compare(password, user.passwordHash)
  return user.password === password
}

const setFallbackPassword = async (user, password) => {
  user.passwordHash = await bcrypt.hash(password, 10)
  delete user.password
  saveMockDb()
}

export const register = async (email, password, firstName = '', lastName = '') => {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new AppError('Пользователь с таким email уже существует', 409)
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ALUMNI',
        profile: {
          create: {
            fullName: `${firstName} ${lastName}`.trim() || email,
            graduationYear: new Date().getFullYear(),
            specialty: 'Не указано',
            status: 'DRAFT'
          }
        }
      },
      include: { profile: true }
    })

    return toAuthResponse(user)
  } catch (error) {
    if (!isPrismaConnectionError(error)) throw error
    const existingDevUser = mockDb.users.some((user) => user.email === email)
    if (existingDevUser) throw new AppError('Пользователь с таким email уже существует', 409)

    const user = {
      id: `dev-${Date.now()}`,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'ALUMNI',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      profile: {
        id: `dev-profile-${Date.now()}`,
        fullName: `${firstName} ${lastName}`.trim() || email,
        status: 'DRAFT'
      }
    }
    mockDb.users.push(user)
    saveMockDb()
    return toAuthResponse(user)
  }
}

export const login = async (email, password) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    })

    if (!user) {
      throw new AppError('Пользователь не найден', 401)
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new AppError('Неверный пароль', 401)
    }

    return toAuthResponse(user)
  } catch (error) {
    if (!isPrismaConnectionError(error)) throw error
    const user = mockDb.users.find((entry) => entry.email === email)

    if (user) {
      if (user.status === 'BLOCKED') throw new AppError('Пользователь заблокирован', 403)
      const isPasswordValid = await verifyFallbackPassword(user, password)
      if (!isPasswordValid) {
        throw new AppError('Неверный пароль', 401)
      }
      if (user.password) await setFallbackPassword(user, password)

      return toAuthResponse(user)
    }

    const alumniProfile = mockDb.alumni.find((profile) => profile.user?.email === email)
    if (!alumniProfile) {
      throw new AppError('Пользователь не найден', 401)
    }
    const userRecord = mockDb.users.find((entry) => entry.id === alumniProfile.userId || entry.email === alumniProfile.user.email)
    if (!userRecord) throw new AppError('Пользователь не найден', 401)
    if (userRecord && !(await verifyFallbackPassword(userRecord, password))) {
      throw new AppError('Неверный пароль', 401)
    }
    if (userRecord?.status === 'BLOCKED' || alumniProfile.status === 'BLOCKED') throw new AppError('Пользователь заблокирован', 403)

    return toAuthResponse({
      id: alumniProfile.userId,
      email: alumniProfile.user.email,
      role: userRecord?.role || 'ALUMNI',
      profile: alumniProfile
    })
  }
}

export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('Пользователь не найден', 404)
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isPasswordValid) throw new AppError('Текущий пароль неверный', 400)
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    return { success: true }
  } catch (error) {
    if (!isPrismaConnectionError(error)) throw error
    const user = mockDb.users.find((entry) => entry.id === userId)
    if (!user) throw new AppError('Пользователь не найден', 404)
    const isPasswordValid = await verifyFallbackPassword(user, currentPassword)
    if (!isPasswordValid) throw new AppError('Текущий пароль неверный', 400)
    await setFallbackPassword(user, newPassword)
    return { success: true }
  }
}

export const resetUserPassword = async (userId, newPassword) => {
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    return { success: true }
  } catch (error) {
    if (!isPrismaConnectionError(error)) throw error
    const user = mockDb.users.find((entry) => entry.id === userId)
    if (!user) throw new AppError('Пользователь не найден', 404)
    await setFallbackPassword(user, newPassword)
    return { success: true }
  }
}

export const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    let user

    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { profile: true }
      })
    } catch (error) {
      if (!isPrismaConnectionError(error)) throw error
      user = mockDb.users.find((entry) => entry.id === decoded.userId)
    }

    if (!user) {
      throw new AppError('Пользователь не найден', 401)
    }

    const { accessToken: newAccessToken } = generateTokens(user.id, user.email, user.role)

    return {
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    }
  } catch (error) {
    throw new AppError('Неверный refresh token', 401)
  }
}
