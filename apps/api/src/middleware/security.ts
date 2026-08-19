import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { Request, Response, NextFunction } from 'express'

// Rate limiting - General API requests
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true, // Disable rate limiting in development/preview
})

// Rate limiting - Authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true, // Disable rate limiting in development/preview
})

// Rate limiting - Password reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: {
    error: 'Too many password reset requests. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true,
})

// Rate limiting - File uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: {
    error: 'Too many uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true,
})

// Rate limiting - Write operations (POST, PUT, DELETE)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: {
    error: 'Too many write operations, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true,
})

// Rate limiting - Read operations (GET)
export const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10000,
  message: {
    error: 'Too many read requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true,
})

// Security headers - configured specifically for iframe preview and cross-origin compatibility
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none')
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
}

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
