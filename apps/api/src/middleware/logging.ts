import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger.js'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    
    logger[logLevel]('HTTP request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: duration,
      userAgent: req.get('User-Agent') || '',
      ip: req.ip || req.connection.remoteAddress || '',
      userId: (req as unknown).user?.sub,
    })
  })
  
  next()
}

export function errorLogger(error: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Request error in middleware', error, {
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress || '',
    userId: (req as unknown).user?.sub,
  })
  
  next(error)
}
