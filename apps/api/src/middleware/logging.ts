import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'

interface LogEntry {
  timestamp: string
  method: string
  url: string
  statusCode: number
  responseTime: number
  userAgent: string
  ip: string
  userId?: number
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: duration,
      userAgent: req.get('User-Agent') || '',
      ip: req.ip || req.connection.remoteAddress || '',
      userId: (req as any).user?.sub
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${logEntry.method} ${logEntry.url} - ${logEntry.statusCode} (${duration}ms)`)
    }
    
    // Log to file in production
    if (process.env.NODE_ENV === 'production') {
      const logDir = path.join(process.cwd(), 'logs')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      
      const logFile = path.join(logDir, `access-${new Date().toISOString().split('T')[0]}.log`)
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
    }
  })
  
  next()
}

export function errorLogger(error: Error, req: Request, res: Response, next: NextFunction) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress || '',
    userId: (req as any).user?.sub
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', logEntry)
  }
  
  // Log to file in production
  if (process.env.NODE_ENV === 'production') {
    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`)
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
  }
  
  next(error)
}
