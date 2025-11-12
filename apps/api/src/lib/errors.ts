/**
 * Error codes estandarizados para la API
 * Organizados por dominio funcional
 */
export enum ErrorCode {
  // Errores generales (1000-1999)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
  
  // Errores de autenticación (2000-2099)
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  MISSING_TOKEN = 'MISSING_TOKEN',
  
  // Errores de validación (3000-3099)
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_ID = 'INVALID_ID',
  
  // Errores de recursos (4000-4099)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  
  // Errores de base de datos (5000-5099)
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNIQUE_CONSTRAINT_VIOLATION = 'UNIQUE_CONSTRAINT_VIOLATION',
  FOREIGN_KEY_CONSTRAINT_VIOLATION = 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
}

/**
 * Mapeo de códigos de error a mensajes user-friendly
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Errores generales
  [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred',
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCode.FORBIDDEN]: 'Access forbidden',
  [ErrorCode.CONFLICT]: 'Resource conflict',
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  
  // Errores de autenticación
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials',
  [ErrorCode.TOKEN_EXPIRED]: 'Token expired',
  [ErrorCode.TOKEN_INVALID]: 'Invalid token',
  [ErrorCode.MISSING_TOKEN]: 'Authentication token required',
  
  // Errores de validación
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.INVALID_FORMAT]: 'Invalid format',
  [ErrorCode.INVALID_ID]: 'Invalid ID provided',
  
  // Errores de recursos
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.RESOURCE_DELETED]: 'Resource has been deleted',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds maximum allowed',
  [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type',
  
  // Errores de base de datos
  [ErrorCode.DATABASE_ERROR]: 'Database error occurred',
  [ErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 'Unique constraint violation',
  [ErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION]: 'Foreign key constraint violation',
  [ErrorCode.RECORD_NOT_FOUND]: 'Record not found',
}

/**
 * Clase base para errores de la aplicación
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: unknown

  constructor(
    code: ErrorCode,
    statusCode: number = 500,
    message?: string,
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message || ErrorMessages[code])
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.details = details
    
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
  }
}

/**
 * Errores específicos por dominio
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    super(
      ErrorCode.RESOURCE_NOT_FOUND,
      404,
      `${resource}${id ? ` with ID ${id}` : ''} not found`,
      { resource, id }
    )
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(
      ErrorCode.VALIDATION_ERROR,
      400,
      message,
      details
    )
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ErrorMessages[ErrorCode.UNAUTHORIZED]) {
    super(
      ErrorCode.UNAUTHORIZED,
      401,
      message
    )
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ErrorMessages[ErrorCode.FORBIDDEN]) {
    super(
      ErrorCode.FORBIDDEN,
      403,
      message
    )
  }
}

export class ConflictError extends AppError {
  constructor(resource: string, details?: unknown) {
    super(
      ErrorCode.CONFLICT,
      409,
      `${resource} already exists`,
      details
    )
  }
}

/**
 * Helper para crear respuestas de error consistentes
 */
export interface ErrorResponse {
  error: string
  code: ErrorCode
  message: string
  details?: unknown
  stack?: string
}

export function createErrorResponse(
  error: AppError | Error,
  includeStack: boolean = false
): ErrorResponse {
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
      message: ErrorMessages[error.code],
    }
    
    if (error.details) {
      response.details = error.details
    }
    
    if (includeStack && error.stack) {
      response.stack = error.stack
    }
    
    return response
  }

  const response: ErrorResponse = {
    error: error.message || 'Internal Server Error',
    code: ErrorCode.INTERNAL_ERROR,
    message: ErrorMessages[ErrorCode.INTERNAL_ERROR],
  }
  
  if (includeStack && error.stack) {
    response.stack = error.stack
  }
  
  return response
}

