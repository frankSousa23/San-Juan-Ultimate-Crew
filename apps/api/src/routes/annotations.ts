import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, created, badRequest, notFound, unauthorized } from '../lib/response.js'
import { requireAuth, requirePermission } from './auth.js'
import { validateBody, validateParams } from '../middleware/validation.js'
import { createAuditHelper } from '../lib/audit.js'

const router = Router()

// Schemas de validación
const createAnnotationSchema = z.object({
  eventId: z.number().int().positive(),
  playerId: z.number().int().positive(),
  type: z.enum(['GOAL', 'ASSIST', 'DEFENSE', 'TURNOVER', 'DROP', 'FOUL', 'TIMEOUT', 'SUBSTITUTION', 'INJURY', 'GENERAL', 'STRATEGY', 'PERFORMANCE']),
  note: z.string().optional(),
  timestamp: z.string().datetime().optional(), // Si no se proporciona, usa ahora
  category: z.string().optional(), // Para FULL_DAY: "OPEN" o "MIXTO"
})

const updateAnnotationSchema = createAnnotationSchema.partial().extend({
  eventId: z.number().int().positive().optional(),
  playerId: z.number().int().positive().optional(),
  type: z.enum(['GOAL', 'ASSIST', 'DEFENSE', 'TURNOVER', 'DROP', 'FOUL', 'TIMEOUT', 'SUBSTITUTION', 'INJURY', 'GENERAL', 'STRATEGY', 'PERFORMANCE']).optional(),
})

const annotationIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

/**
 * @swagger
 * /api/annotations:
 *   get:
 *     summary: Get all annotations, optionally filtered by event or player
 *     tags: [Annotations]
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: integer
 *         description: Filter by event ID
 *       - in: query
 *         name: playerId
 *         schema:
 *           type: integer
 *         description: Filter by player ID
 *     responses:
 *       200:
 *         description: List of annotations
 */
router.get('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.query.eventId ? Number(req.query.eventId) : undefined
  const playerId = req.query.playerId ? Number(req.query.playerId) : undefined

  const where: any = {}
  if (eventId) where.eventId = eventId
  if (playerId) where.playerId = playerId

  const annotations = await prisma.eventAnnotation.findMany({
    where,
    include: {
      event: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        }
      },
      player: {
        select: {
          id: true,
          name: true,
          number: true,
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  })

  return success(res, annotations)
}))

/**
 * @swagger
 * /api/annotations/{id}:
 *   get:
 *     summary: Get a specific annotation
 *     tags: [Annotations]
 */
router.get('/:id', requireAuth, validateParams(annotationIdSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  
  const annotation = await prisma.eventAnnotation.findUnique({
    where: { id: Number(id) },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        }
      },
      player: {
        select: {
          id: true,
          name: true,
          number: true,
        }
      }
    }
  })

  if (!annotation) {
    return notFound(res, 'Annotation not found')
  }

  return success(res, annotation)
}))

/**
 * @swagger
 * /api/annotations:
 *   post:
 *     summary: Create a new annotation
 *     tags: [Annotations]
 */
router.post('/', requireAuth, requirePermission('events:manage'), validateBody(createAnnotationSchema), asyncHandler(async (req: Request, res: Response) => {
  const u = (req as any).user as any
  const userId = u?.sub ? Number(u.sub) : null

  const payload = req.body
  const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date()

  // Verificar que el evento existe
  const event = await prisma.event.findUnique({
    where: { id: payload.eventId }
  })

  if (!event) {
    return notFound(res, 'Event not found')
  }

  // Verificar que el jugador existe
  const player = await prisma.player.findUnique({
    where: { id: payload.playerId }
  })

  if (!player) {
    return notFound(res, 'Player not found')
  }

  const annotation = await prisma.eventAnnotation.create({
    data: {
      eventId: payload.eventId,
      playerId: payload.playerId,
      type: payload.type,
      note: payload.note,
      timestamp,
      category: payload.category,
      createdBy: userId,
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        }
      },
      player: {
        select: {
          id: true,
          name: true,
          number: true,
        }
      }
    }
  })

  const audit = createAuditHelper(req)
  await audit.log('CREATE', 'EventAnnotation', annotation.id, {
    eventId: annotation.eventId,
    playerId: annotation.playerId,
    type: annotation.type,
  })

  return created(res, annotation)
}))

/**
 * @swagger
 * /api/annotations/{id}:
 *   put:
 *     summary: Update an annotation
 *     tags: [Annotations]
 */
router.put('/:id', requireAuth, requirePermission('events:manage'), validateParams(annotationIdSchema), validateBody(updateAnnotationSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const payload = req.body

  const existing = await prisma.eventAnnotation.findUnique({
    where: { id: Number(id) }
  })

  if (!existing) {
    return notFound(res, 'Annotation not found')
  }

  const updateData: any = {}
  if (payload.note !== undefined) updateData.note = payload.note
  if (payload.type !== undefined) updateData.type = payload.type
  if (payload.timestamp !== undefined) updateData.timestamp = new Date(payload.timestamp)
  if (payload.category !== undefined) updateData.category = payload.category

  // Si se actualiza eventId o playerId, verificar que existen
  if (payload.eventId !== undefined) {
    const event = await prisma.event.findUnique({ where: { id: payload.eventId } })
    if (!event) {
      return notFound(res, 'Event not found')
    }
    updateData.eventId = payload.eventId
  }

  if (payload.playerId !== undefined) {
    const player = await prisma.player.findUnique({ where: { id: payload.playerId } })
    if (!player) {
      return notFound(res, 'Player not found')
    }
    updateData.playerId = payload.playerId
  }

  const annotation = await prisma.eventAnnotation.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      event: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        }
      },
      player: {
        select: {
          id: true,
          name: true,
          number: true,
        }
      }
    }
  })

  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'EventAnnotation', annotation.id, {
    eventId: annotation.eventId,
    playerId: annotation.playerId,
    type: annotation.type,
  })

  return success(res, annotation)
}))

/**
 * @swagger
 * /api/annotations/{id}:
 *   delete:
 *     summary: Delete an annotation
 *     tags: [Annotations]
 */
router.delete('/:id', requireAuth, requirePermission('events:manage'), validateParams(annotationIdSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }

  const existing = await prisma.eventAnnotation.findUnique({
    where: { id: Number(id) }
  })

  if (!existing) {
    return notFound(res, 'Annotation not found')
  }

  await prisma.eventAnnotation.delete({
    where: { id: Number(id) }
  })

  const audit = createAuditHelper(req)
  await audit.log('DELETE', 'EventAnnotation', Number(id), {
    eventId: existing.eventId,
    playerId: existing.playerId,
  })

  return success(res, { message: 'Annotation deleted successfully' })
}))

/**
 * @swagger
 * /api/annotations/event/{eventId}/stats:
 *   get:
 *     summary: Get annotation statistics for an event
 *     tags: [Annotations]
 */
router.get('/event/:eventId/stats', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const eventId = Number(req.params.eventId)

  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    return notFound(res, 'Event not found')
  }

  const annotations = await prisma.eventAnnotation.findMany({
    where: { eventId },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          number: true,
        }
      }
    }
  })

  // Estadísticas por tipo
  const statsByType = annotations.reduce((acc, ann) => {
    acc[ann.type] = (acc[ann.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Estadísticas por jugador
  const statsByPlayer = annotations.reduce((acc, ann) => {
    const playerId = ann.playerId
    if (!acc[playerId]) {
      acc[playerId] = {
        player: ann.player,
        total: 0,
        byType: {} as Record<string, number>
      }
    }
    acc[playerId].total++
    acc[playerId].byType[ann.type] = (acc[playerId].byType[ann.type] || 0) + 1
    return acc
  }, {} as Record<number, { player: any; total: number; byType: Record<string, number> }>)

  // Estadísticas por categoría (si aplica)
  const statsByCategory = annotations.reduce((acc, ann) => {
    const category = ann.category || 'N/A'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return success(res, {
    event: {
      id: event.id,
      title: event.title,
      type: event.type,
    },
    total: annotations.length,
    byType: statsByType,
    byPlayer: Object.values(statsByPlayer),
    byCategory: statsByCategory,
  })
}))

export default router

