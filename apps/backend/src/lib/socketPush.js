import jwt from 'jsonwebtoken'

let _io = null
// userId → Set<socketId>
const _userSockets = new Map()

export const initSocketPush = (io) => {
  _io = io
}

export const registerUserSocket = (userId, socketId) => {
  if (!_userSockets.has(userId)) _userSockets.set(userId, new Set())
  _userSockets.get(userId).add(socketId)
}

export const unregisterUserSocket = (userId, socketId) => {
  const set = _userSockets.get(userId)
  if (!set) return
  set.delete(socketId)
  if (set.size === 0) _userSockets.delete(userId)
}

export const pushToUser = (userId, event, data) => {
  if (!_io || !userId) return
  const sockets = _userSockets.get(userId)
  if (sockets) sockets.forEach((sid) => _io.to(sid).emit(event, data))
}

export const verifySocketToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET)
  } catch {
    return null
  }
}
