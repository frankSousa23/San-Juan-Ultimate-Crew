import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger.js'

const SENSITIVE_QUERY_REGEX = /([?&](?:token|password|secret|key|apiKey)=)[^&]*/gi

export function sanitizeUrl(url: string): string {
  if (!url) return ''
  return url.replace(SENSITIVE_QUERY_REGEX, '$1[REDACTED]')
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    
    logger[logLevel]('HTTP request', {
      method: req.method,
      url: sanitizeUrl(req.url),
      statusCode: res.statusCode,
      responseTime: duration,
      userAgent: req.get('User-Agent') || '',
      ip: req.ip || req.connection.remoteAddress || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (req as any).user?.sub,
    })
  })
  
  next()
}

export function errorLogger(error: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Request error in middleware', error, {
    url: sanitizeUrl(req.url),
    method: req.method,
    ip: req.ip || req.connection.remoteAddress || '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userId: (req as any).user?.sub,
  })
  
  next(error)
}

