/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, created, badRequest, notFound } from '../lib/response.js'
import { requireAuth } from './auth.js'
import { requireAnnotationAccess } from '../middleware/annotationAccess.js'
import { validateBody, validateParams } from '../middleware/validation.js'
import { createAuditHelper } from '../lib/audit.js'
import { isGuestRequest, GUEST_EVENT_ANNOTATIONS, GUEST_EVENTS } from '../lib/guestDemoData.js'

const router = Router()

// Schemas de validación
const createAnnotationSchema = z.object({
  eventId: z.number().int().positive(),
  playerId: z.number().int().positive().optional().nullable(), // Nullable para jugadores oponentes
  relatedPlayerId: z.number().int().positive().optional().nullable(),
  type: z.enum(['GOAL', 'ASSIST', 'DEFENSE', 'TURNOVER']),
  note: z.string().optional(),
  lineType: z.string().optional(),
  timestamp: z.string().datetime().optional(), // Si no se proporciona, usa ahora
  category: z.string().optional(), // Para FULL_DAY: "OPEN" o "MIXTO"
  isRefuerzo: z.boolean().optional(),
  // Campos para versus / rivales
  rivalId: z.number().int().positive().optional(),
  rivalPlayerId: z.number().int().positive().optional(),
  opponentTeamName: z.string().optional(),
  opponentPlayerName: z.string().optional(),
  opponentPlayerNumber: z.number().int().positive().optional(),
  teamSide: z.enum(['HOME', 'AWAY']).optional(),
  scoreHome: z.number().int().min(0).optional(),
  scoreAway: z.number().int().min(0).optional(),
})

const updateAnnotationSchema = createAnnotationSchema.partial().extend({
  eventId: z.number().int().positive().optional(),
  playerId: z.number().int().positive().optional().nullable(),
  relatedPlayerId: z.number().int().positive().optional().nullable(),
  type: z.enum(['GOAL', 'ASSIST', 'DEFENSE', 'TURNOVER']).optional(),
  isRefuerzo: z.boolean().optional(),
})

const annotationIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

const defaultAnnotationInclude = {
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
      teamId: true,
    }
  },
  createdByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    }
  }
}

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
  const rivalId = req.query.rivalId ? Number(req.query.rivalId) : undefined

  if (isGuestRequest(req)) {
    let items = GUEST_EVENT_ANNOTATIONS
    if (eventId) items = items.filter(a => a.eventId === eventId)
    if (playerId) items = items.filter(a => a.playerId === playerId)
    return success(res, items)
  }

  const where: any = {}
  if (eventId) where.eventId = eventId
  if (playerId) where.playerId = playerId
  if (rivalId) where.rivalId = rivalId

  const annotations = await prisma.eventAnnotation.findMany({
    where,
    include: defaultAnnotationInclude,
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
    include: defaultAnnotationInclude
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
router.post('/', requireAuth, requireAnnotationAccess, validateBody(createAnnotationSchema), asyncHandler(async (req: Request, res: Response) => {
  const u = (req as any).user as any
  const userId = u?.sub ? Number(u.sub) : null

  const payload = req.body as z.infer<typeof createAnnotationSchema>
  const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date()

  // Verificar que el evento existe
  const event = await prisma.event.findUnique({
    where: { id: payload.eventId }
  })

  if (!event) {
    return notFound(res, 'Event not found')
  }

  // Verificar que el jugador existe (solo si se proporciona playerId)
  if (payload.playerId) {
    const player = await prisma.player.findUnique({
      where: { id: payload.playerId }
    })

    if (!player) {
      return notFound(res, 'Player not found')
    }
  }

  // Si no hay playerId pero hay opponentPlayerName, es un jugador oponente (válido)
  if (!payload.playerId && !payload.opponentPlayerName) {
    return badRequest(res, 'Either playerId or opponentPlayerName must be provided')
  }

  // Integración automática con Rivales / RivalPlayer:
  let rivalId: number | null = payload.rivalId ?? null
  let rivalPlayerId: number | null = payload.rivalPlayerId ?? null

  if (!payload.playerId && payload.opponentTeamName && payload.opponentPlayerNumber && payload.opponentPlayerName) {
    let rival = await prisma.rival.findFirst({
      where: { name: payload.opponentTeamName },
    })

    if (!rival) {
      rival = await prisma.rival.create({
        data: {
          name: payload.opponentTeamName,
          notes: 'Creado automáticamente desde anotaciones de evento',
        },
      })
    }

    rivalId = rival.id

    let rivalPlayer = await prisma.rivalPlayer.findFirst({
      where: {
        rivalId: rival.id,
        number: payload.opponentPlayerNumber,
      },
    })

    if (!rivalPlayer) {
      rivalPlayer = await prisma.rivalPlayer.create({
        data: {
          rivalId: rival.id,
          number: payload.opponentPlayerNumber,
          name: payload.opponentPlayerName,
        },
      })
    } else if (payload.opponentPlayerName && payload.opponentPlayerName !== rivalPlayer.name) {
      rivalPlayer = await prisma.rivalPlayer.update({
        where: { id: rivalPlayer.id },
        data: { name: payload.opponentPlayerName },
      })
    }

    rivalPlayerId = rivalPlayer.id
  }

  const annotation = await prisma.eventAnnotation.create({
    data: {
      eventId: payload.eventId,
      playerId: payload.playerId ?? null,
      relatedPlayerId: payload.relatedPlayerId ?? null,
      type: payload.type,
      note: payload.note,
      lineType: payload.lineType ?? null,
      timestamp,
      category: payload.category,
      isRefuerzo: payload.isRefuerzo ?? false,
      createdBy: userId,
      rivalId,
      rivalPlayerId,
      opponentTeamName: payload.opponentTeamName ?? null,
      opponentPlayerName: payload.opponentPlayerName ?? null,
      opponentPlayerNumber: payload.opponentPlayerNumber ?? null,
      teamSide: payload.teamSide ?? null,
      scoreHome: payload.scoreHome ?? null,
      scoreAway: payload.scoreAway ?? null,
    },
    include: defaultAnnotationInclude
  })

  // === Autocalcular Estadísticas con Soporte de Refuerzos y Equipo ===
  const updateStats = async (pId: number, field: string, increment: number = 1) => {
    const stats = await prisma.playerMatchStats.findUnique({
      where: { playerId_eventId: { playerId: pId, eventId: payload.eventId } }
    })
    if (stats) {
      await prisma.playerMatchStats.update({
        where: { id: stats.id },
        data: { 
          [field]: { increment },
          isRefuerzo: payload.isRefuerzo !== undefined ? payload.isRefuerzo : stats.isRefuerzo,
          teamSide: payload.teamSide || stats.teamSide
        }
      })
    } else {
      await prisma.playerMatchStats.create({
        data: { 
          playerId: pId, 
          eventId: payload.eventId, 
          [field]: increment,
          isRefuerzo: payload.isRefuerzo ?? false,
          teamSide: payload.teamSide ?? null
        }
      })
    }
  }

  if (payload.playerId) {
    if (payload.type === 'GOAL') await updateStats(payload.playerId, 'goals')
    else if (payload.type === 'ASSIST') await updateStats(payload.playerId, 'assists')
    else if (payload.type === 'DEFENSE') await updateStats(payload.playerId, 'defenses')
    else if (payload.type === 'TURNOVER') await updateStats(payload.playerId, 'turnovers')
  }
  
  if (payload.relatedPlayerId && payload.type === 'GOAL') {
    await updateStats(payload.relatedPlayerId, 'assists')
  }
  // ===============================

  const audit = createAuditHelper(req)
  await audit.log('CREATE', 'EventAnnotation', annotation.id, {
    eventId: annotation.eventId,
    playerId: annotation.playerId,
    type: annotation.type,
    isRefuerzo: annotation.isRefuerzo,
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
router.put('/:id', requireAuth, requireAnnotationAccess, validateParams(annotationIdSchema), validateBody(updateAnnotationSchema), asyncHandler(async (req: Request, res: Response) => {
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
    if (payload.playerId !== null) {
      const player = await prisma.player.findUnique({ where: { id: payload.playerId } })
      if (!player) {
        return notFound(res, 'Player not found')
      }
    }
    updateData.playerId = payload.playerId
  }
  
  // Actualizar campos de versus si se proporcionan
  if (payload.opponentTeamName !== undefined) updateData.opponentTeamName = payload.opponentTeamName
  if (payload.opponentPlayerName !== undefined) updateData.opponentPlayerName = payload.opponentPlayerName
  if (payload.opponentPlayerNumber !== undefined) updateData.opponentPlayerNumber = payload.opponentPlayerNumber
  if (payload.teamSide !== undefined) updateData.teamSide = payload.teamSide
  if (payload.scoreHome !== undefined) updateData.scoreHome = payload.scoreHome
  if (payload.scoreAway !== undefined) updateData.scoreAway = payload.scoreAway

  const annotation = await prisma.eventAnnotation.update({
    where: { id: Number(id) },
    data: updateData,
    include: defaultAnnotationInclude
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
router.delete('/:id', requireAuth, requireAnnotationAccess, validateParams(annotationIdSchema), asyncHandler(async (req: Request, res: Response) => {
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

  // === Revertir Estadísticas ===
  const updateStats = async (pId: number, field: string, increment: number = -1) => {
    const stats = await prisma.playerMatchStats.findUnique({
      where: { playerId_eventId: { playerId: pId, eventId: existing.eventId } }
    })
    if (stats) {
      await prisma.playerMatchStats.update({
        where: { id: stats.id },
        data: { [field]: { increment } }
      })
    }
  }

  if (existing.playerId) {
    if (existing.type === 'GOAL') await updateStats(existing.playerId, 'goals')
    else if (existing.type === 'ASSIST') await updateStats(existing.playerId, 'assists')
    else if (existing.type === 'DEFENSE') await updateStats(existing.playerId, 'defenses')
    else if (existing.type === 'TURNOVER') await updateStats(existing.playerId, 'turnovers')
  }
  
  if (existing.relatedPlayerId && existing.type === 'GOAL') {
    await updateStats(existing.relatedPlayerId, 'assists')
  }
  // ===============================

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

  if (isGuestRequest(req)) {
    const event = GUEST_EVENTS.find(e => e.id === eventId) || { id: eventId, title: 'Evento SIGEDIVO', type: 'TOURNAMENT' }
    const annotations = GUEST_EVENT_ANNOTATIONS.filter(a => a.eventId === eventId)
    const statsByType = annotations.reduce((acc, ann) => {
      acc[ann.type] = (acc[ann.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statsByPlayer = annotations
      .filter(ann => ann.playerId !== null)
      .reduce((acc, ann) => {
        const playerId = ann.playerId!
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

    return success(res, {
      event: {
        id: event.id,
        title: event.title,
        type: event.type,
      },
      total: annotations.length,
      byType: statsByType,
      byPlayer: Object.values(statsByPlayer),
      byCategory: {},
    })
  }

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

  // Estadísticas por jugador (solo jugadores de nuestro equipo, no oponentes)
  const statsByPlayer = annotations
    .filter(ann => ann.playerId !== null)
    .reduce((acc, ann) => {
      const playerId = ann.playerId!
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

