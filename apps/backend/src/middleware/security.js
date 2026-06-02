const buckets = new Map()

export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '0')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
}

export const createRateLimiter = ({ windowMs = 60_000, max = 20, keyPrefix = 'global' } = {}) => {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown'
    const key = `${keyPrefix}:${ip}:${req.body?.email || ''}`
    const now = Date.now()
    const current = buckets.get(key) || { count: 0, resetAt: now + windowMs }

    if (current.resetAt <= now) {
      current.count = 0
      current.resetAt = now + windowMs
    }

    current.count += 1
    buckets.set(key, current)

    if (current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({ error: `Слишком много запросов. Повторите через ${retryAfter} сек.` })
    }

    next()
  }
}

export const validateSecurityConfig = () => {
  const requiredSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']
  const weak = requiredSecrets.filter((key) => {
    const value = process.env[key] || ''
    return value.length < 32 || /change-me|replace_with|placeholder/i.test(value)
  })
  if (weak.length === 0) return

  const message = `[security] Weak or missing secrets: ${weak.join(', ')}`
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${message}. Refusing to start in production.`)
  }
  console.warn(`${message}. Allowed only in development.`)
}
