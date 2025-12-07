import { Response } from 'express'
import { PaginatedResponse } from '../types/index.js'

export function success<T>(res: Response, data: T, statusCode: number = 200): Response {
  return res.status(statusCode).json(data)
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json(data)
}

export function updated<T>(res: Response, data: T): Response {
  return res.status(200).json(data)
}

export function deleted(res: Response): Response {
  return res.status(204).send()
}

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

export function badRequest(res: Response, message: string = 'Bad request'): Response {
  return res.status(400).json({
    error: message,
  })
}

export function notFound(res: Response, resource: string = 'Resource'): Response {
  return res.status(404).json({
    error: `${resource} not found`,
  })
}

export function conflict(res: Response, message: string = 'Resource already exists'): Response {
  return res.status(409).json({
    error: message,
  })
}

export function unauthorized(res: Response, message: string = 'Unauthorized'): Response {
  return res.status(401).json({
    error: message,
  })
}

export function forbidden(res: Response, message: string = 'Forbidden'): Response {
  return res.status(403).json({
    error: message,
  })
}

export function serverError(res: Response, message: string = 'Internal server error'): Response {
  return res.status(500).json({
    error: message,
  })
}

