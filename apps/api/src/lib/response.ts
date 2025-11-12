import { Response } from 'express'
import { PaginatedResponse } from '../types/index.js'

/**
 * Helpers para crear respuestas consistentes de la API
 */

/**
 * Respuesta exitosa simple
 */
export function success<T>(res: Response, data: T, statusCode: number = 200): Response {
  return res.status(statusCode).json(data)
}

/**
 * Respuesta de creación exitosa (201)
 */
export function created<T>(res: Response, data: T): Response {
  return res.status(201).json(data)
}

/**
 * Respuesta de actualización exitosa (200)
 */
export function updated<T>(res: Response, data: T): Response {
  return res.status(200).json(data)
}

/**
 * Respuesta de eliminación exitosa (204)
 */
export function deleted(res: Response): Response {
  return res.status(204).send()
}

/**
 * Respuesta paginada
 */
export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  limit: number,
  offset: number
): Response {
  const response: PaginatedResponse<T> = {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total,
  }
  return res.status(200).json(response)
}

/**
 * Respuesta de error de validación
 */
export function validationError(
  res: Response,
  message: string = 'Validation failed',
  issues?: unknown
): Response {
  const response: { error: string; issues?: unknown } = {
    error: message,
  }
  if (issues) {
    response.issues = issues
  }
  return res.status(400).json(response)
}

/**
 * Respuesta de error no encontrado (404)
 */
export function notFound(res: Response, resource: string = 'Resource'): Response {
  return res.status(404).json({
    error: `${resource} not found`,
  })
}

/**
 * Respuesta de error de conflicto (409)
 */
export function conflict(res: Response, message: string = 'Resource already exists'): Response {
  return res.status(409).json({
    error: message,
  })
}

/**
 * Respuesta de error no autorizado (401)
 */
export function unauthorized(res: Response, message: string = 'Unauthorized'): Response {
  return res.status(401).json({
    error: message,
  })
}

/**
 * Respuesta de error prohibido (403)
 */
export function forbidden(res: Response, message: string = 'Forbidden'): Response {
  return res.status(403).json({
    error: message,
  })
}

/**
 * Respuesta de error de servidor (500)
 */
export function serverError(res: Response, message: string = 'Internal server error'): Response {
  return res.status(500).json({
    error: message,
  })
}

