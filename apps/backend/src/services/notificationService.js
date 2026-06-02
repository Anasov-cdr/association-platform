import { prisma } from '../lib/prisma.js'
import { isPrismaUnavailable, mockDb, saveMockDb } from '../mockData.js'
import { pushToUser } from '../lib/socketPush.js'

const ADMIN_USER_ID = 'dev-admin'

const makeNotification = ({ userId, type = 'SYSTEM', title, message, data = {} }) => ({
  id: `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  userId,
  type,
  title,
  message,
  data,
  read: false,
  createdAt: new Date().toISOString()
})

export const createNotification = async (payload) => {
  if (!payload?.userId || !payload?.title || !payload?.message) return null

  let notif
  try {
    notif = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type || 'SYSTEM',
        title: payload.title,
        message: payload.message,
        data: payload.data || {}
      }
    })
  } catch (error) {
    if (!isPrismaUnavailable(error)) throw error
    notif = makeNotification(payload)
    mockDb.notifications.unshift(notif)
    saveMockDb()
  }

  pushToUser(payload.userId, 'notification:new', notif)
  return notif
}

export const createAdminNotification = (payload) =>
  createNotification({ ...payload, userId: ADMIN_USER_ID })

export const broadcastToApprovedAlumni = async (payload) => {
  const recipients = mockDb.alumni
    .filter((profile) => profile.status === 'APPROVED' && profile.userId)
    .map((profile) => profile.userId)

  const uniqueRecipients = [...new Set(recipients)]
  for (const userId of uniqueRecipients) {
    mockDb.notifications.unshift(makeNotification({ ...payload, userId }))
  }
  if (uniqueRecipients.length > 0) saveMockDb()
  return uniqueRecipients.length
}

export const notificationAudience = {
  admin: ADMIN_USER_ID
}
