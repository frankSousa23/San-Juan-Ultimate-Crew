import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { Request, Response, NextFunction } from 'express'

// Rate limiting - General API requests
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    if (req.path === '/health' || req.path === '/') return true
    // Skip rate limiting in development for localhost
    if (process.env.NODE_ENV !== 'production') {
      const ip = req.ip || req.socket.remoteAddress || ''
      if (ip === '::1' || ip === '127.0.0.1' || ip.includes('localhost') || ip.includes('::ffff:127.0.0.1')) {
        return true
      }
    }
    return false
  },
})

// Rate limiting - Authentication endpoints (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased for testing - was 5
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  skip: (req: Request) => {
    // Skip rate limiting in development/testing for localhost to allow automated tests
    const nodeEnv = process.env.NODE_ENV || 'development'
    if (nodeEnv !== 'production') {
      const ip = req.ip || req.socket.remoteAddress || ''
      if (ip === '::1' || ip === '127.0.0.1' || ip.includes('localhost') || ip.includes('::ffff:127.0.0.1')) {
        return true
      }
    }
    return false
  },
})

// Rate limiting - Password reset requests (very strict to prevent abuse)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset requests per hour per IP
  message: {
    error: 'Too many password reset requests. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
})

// Rate limiting - File uploads (very strict)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 uploads per minute
  message: {
    error: 'Too many uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiting - Write operations (POST, PUT, DELETE)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 write operations per windowMs
  message: {
    error: 'Too many write operations, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Only apply to write methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return true
    // Skip rate limiting in development for localhost
    if (process.env.NODE_ENV !== 'production') {
      const ip = req.ip || req.socket.remoteAddress || ''
      if (ip === '::1' || ip === '127.0.0.1' || ip.includes('localhost') || ip.includes('::ffff:127.0.0.1')) {
        return true
      }
    }
    return false
  },
})

// Rate limiting - Read operations (GET)
export const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 read requests per minute
  message: {
    error: 'Too many read requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Only apply to read methods
    if (req.method !== 'GET') return true
    // Skip rate limiting in development for localhost
    if (process.env.NODE_ENV !== 'production') {
      const ip = req.ip || req.socket.remoteAddress || ''
      if (ip === '::1' || ip === '127.0.0.1' || ip.includes('localhost') || ip.includes('::ffff:127.0.0.1')) {
        return true
      }
    }
    return false
  },
})

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
})

// Request sanitization
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  // Remove potentially dangerous characters from query params
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).replace(/[<>]/g, '')
      }
    }
  }
  
  next()
}

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    callback(null, true)
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
}
