import { mockDb, saveMockDb } from '../mockData.js'

const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'currentPassword', 'newPassword', 'refreshToken', 'accessToken', 'token'])
const MAX_LOGS = 500

const redact = (value) => {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(redact).slice(0, 20)

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 50)
      .map(([key, entry]) => [key, SENSITIVE_KEYS.has(key) ? '[hidden]' : redact(entry)])
  )
}

export const writeAuditLog = ({ user, method, url, statusCode, body }) => {
  if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) return
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return
  if (statusCode >= 400) return

  mockDb.auditLogs = mockDb.auditLogs || []
  mockDb.auditLogs.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    actorId: user.userId,
    actorEmail: user.email,
    actorRole: user.role,
    method,
    path: url,
    statusCode,
    body: redact(body),
    createdAt: new Date().toISOString()
  })
  mockDb.auditLogs = mockDb.auditLogs.slice(0, MAX_LOGS)
  saveMockDb()
}

export const listAuditLogs = ({ limit = 100 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), MAX_LOGS)
  return (mockDb.auditLogs || []).slice(0, safeLimit)
}
