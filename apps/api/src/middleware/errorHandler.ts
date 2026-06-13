import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { 
  AppError, 
  ErrorCode, 
  createErrorResponse,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ValidationError as AppValidationError
} from '../lib/errors.js'
import { logger } from '../lib/logger.js'

export interface LegacyAppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export function errorHandler(
  error: LegacyAppError | AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let appError: AppError

  // Manejar errores de Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        appError = new ConflictError('Resource', {
          target: error.meta?.target,
          code: error.code,
        })
        break
      case 'P2025':
        appError = new NotFoundError('Record', error.meta?.model as string)
        break
      case 'P2003':
        appError = new AppValidationError('Foreign key constraint violation', {
          code: error.code,
          field: error.meta?.field_name,
        })
        break
      default:
        appError = new AppError(
          ErrorCode.DATABASE_ERROR,
          400,
          'Database error',
          { code: error.code, meta: error.meta }
        )
    }
  }
  // Manejar errores de Zod
  else if (error instanceof z.ZodError) {
    appError = new AppValidationError('Validation failed', {
      issues: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    })
  }
  // Manejar errores de JWT
  else if (error.name === 'JsonWebTokenError') {
    appError = new UnauthorizedError('Invalid token')
  }
  else if (error.name === 'TokenExpiredError') {
    appError = new AppError(ErrorCode.TOKEN_EXPIRED, 401, 'Token expired')
  }
  // Si ya es un AppError, usarlo directamente
  else if (error instanceof AppError) {
    appError = error
  }
  // Errores legacy con statusCode
  else if ('statusCode' in error && typeof error.statusCode === 'number') {
    appError = new AppError(
      ErrorCode.INTERNAL_ERROR,
      error.statusCode,
      error.message || 'Internal Server Error'
    )
  }
  // Error genérico
  else {
    appError = new AppError(
      ErrorCode.INTERNAL_ERROR,
      500,
      error.message || 'Internal Server Error'
    )
  }

  // Log del error
  logger.error('Request error handled', appError, {
    statusCode: appError.statusCode,
    code: appError.code,
    url: req.url,
    method: req.method,
    path: req.path,
    isOperational: appError.isOperational,
  })

  // Crear respuesta de error
  const includeStack = process.env.NODE_ENV === 'development'
  const errorResponse = createErrorResponse(appError, includeStack)

  res.status(appError.statusCode).json(errorResponse)
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
