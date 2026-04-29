import jwt from 'jsonwebtoken'
import { mockDb } from '../mockData.js'
import { writeAuditLog } from '../services/auditService.js'

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Токен не найден' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    const user = mockDb.users?.find((entry) => entry.id === decoded.userId)
    if (user?.status === 'BLOCKED') {
      return res.status(403).json({ error: 'Пользователь заблокирован' })
    }
    req.user = decoded
    res.on('finish', () => {
      writeAuditLog({
        user: req.user,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        body: req.body
      })
    })
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Неверный или просроченный токен' })
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Не аутентифицирован' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Доступ запрещен' })
    }

    next()
  }
}

export const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
      const user = mockDb.users?.find((entry) => entry.id === decoded.userId)
      if (user?.status !== 'BLOCKED') req.user = decoded
    } catch (error) {
      // Token invalid, but continue without user
    }
  }

  next()
}
