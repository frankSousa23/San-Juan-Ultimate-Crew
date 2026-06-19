import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'
import { ValidationError } from '../types/index.js'

// Middleware genérico para validación con Zod
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          } as ValidationError))
        })
      }
      next(error)
    }
  }
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Query validation failed',
          issues: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          } as ValidationError))
        })
      }
      next(error)
    }
  }
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parameter validation failed',
          issues: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          } as ValidationError))
        })
      }
      next(error)
    }
  }
}
