import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { requirePermission } from './auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import type { Prisma } from '@prisma/client'
import { success, updated, deleted, validationError, notFound } from '../lib/response.js'
import { isGuestRequest, GUEST_EVENT_PARTICIPANTS } from '../lib/guestDemoData.js'

const router = Router()

const listQuerySchema = z.object({
  eventId: z.coerce.number().int().optional(),
})

/**
 * @swagger
 * /api/event-participants:
 *   get:
 *     summary: Get event participants
 *     tags: [EventParticipants]
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: integer
 *         description: Filter by event ID
 *     responses:
 *       200:
 *         description: List of event participants with player and event information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EventParticipant'
 *       400:
 *         description: Invalid query parameters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) return validationError(res, 'Invalid query parameters', parsed.error.issues)
  const { eventId } = parsed.data

  if (isGuestRequest(req)) {
    const items = eventId ? GUEST_EVENT_PARTICIPANTS.filter(p => p.eventId === eventId) : GUEST_EVENT_PARTICIPANTS
    return success(res, items)
  }

  const where: Prisma.EventParticipantWhereInput = {}
  if (eventId) where.eventId = eventId
  const items = await prisma.eventParticipant.findMany({
    where,
    include: { player: true, event: true },
    orderBy: [{ eventId: 'desc' }, { playerId: 'asc' }]
  })
  return success(res, items)
}))

const upsertSchema = z.object({
  eventId: z.coerce.number().int(),
  playerId: z.coerce.number().int(),
  role: z.string().optional().nullable(),
  status: z.string().optional().nullable(), // confirmed, tentative, declined
  lineType: z.string().optional().nullable(), // O-Line, D-Line, Flex
  teamSide: z.string().optional().nullable(), // HOME, AWAY, LIGHT, DARK
  isRefuerzo: z.boolean().optional(),
})

const batchUpsertSchema = z.object({
  eventId: z.coerce.number().int(),
  playerIds: z.array(z.coerce.number().int()),
  role: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  teamSide: z.string().optional().nullable(),
  isRefuerzo: z.boolean().optional(),
})

const deleteQuerySchema = z.object({
  eventId: z.coerce.number().int().positive(),
  playerId: z.coerce.number().int().positive(),
})

/**
 * @swagger
 * /api/event-participants:
 *   put:
 *     summary: Create or update event participant
 *     tags: [EventParticipants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - playerId
 *             properties:
 *               eventId:
 *                 type: integer
 *               playerId:
 *                 type: integer
 *               role:
 *                 type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 nullable: true
 *                 description: Participant status (confirmed, tentative, declined)
 *               lineType:
 *                 type: string
 *                 nullable: true
 *                 description: Line type (O-Line, D-Line, Flex)
 *     responses:
 *       200:
 *         description: Event participant created or updated
 *       400:
 *         description: Invalid input or missing dorsal number
 *       409:
 *         description: Dorsal collision in the same team/side for this event
 */
router.put('/', requirePermission('roster:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) return validationError(res, 'Invalid input', parsed.error.issues)
  const { eventId, playerId, role, status, lineType, teamSide, isRefuerzo } = parsed.data

  // Fetch the player
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { team: true }
  })
  if (!player) return notFound(res, 'Jugador no encontrado')

  // Rule: El número dorsal es estrictamente obligatorio para cargar en el roster del evento
  if (player.number === null || player.number === undefined || isNaN(player.number) || player.number < 0) {
    return res.status(400).json({
      error: `El jugador "${player.name}" no tiene un número dorsal válido asignado. El dorsal es obligatorio para convocar al roster de un evento.`
    })
  }

  // Check event exists
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) return notFound(res, 'Evento no encontrado')

  // Determine the target side and team
  const targetSide = teamSide || 'HOME'
  const targetTeamId = player.teamId

  // Fetch other participants in this event to verify dorsal uniqueness within the same team/side
  const existingParticipants = await prisma.eventParticipant.findMany({
    where: {
      eventId,
      playerId: { not: playerId }
    },
    include: {
      player: {
        include: { team: true }
      }
    }
  })

  const duplicate = existingParticipants.find((ep) => {
    if (!ep.player) return false
    if (ep.player.number !== player.number) return false

    // Si ambos pertenecen al mismo equipo
    if (targetTeamId && ep.player.teamId && targetTeamId === ep.player.teamId) {
      return true
    }

    // O si están jugando en el mismo lado (ej. HOME vs HOME o AWAY vs AWAY)
    const epSide = ep.teamSide || 'HOME'
    if (epSide === targetSide) {
      return true
    }

    return false
  })

  if (duplicate && duplicate.player) {
    const teamOrSideName = duplicate.player.team?.name || (targetSide === 'AWAY' ? 'Equipo Visitante' : 'Equipo Local')
    return res.status(409).json({
      error: `Conflicto de dorsal en el evento: El número #${player.number} ya está registrado para "${duplicate.player.name}" en ${teamOrSideName}. El responsable no puede cargar dos jugadores con el mismo número dentro de su equipo.`
    })
  }

  const participant = await prisma.eventParticipant.upsert({
    where: { eventId_playerId: { eventId, playerId } },
    create: { 
      eventId, 
      playerId, 
      role: role ?? undefined, 
      status: status ?? undefined, 
      lineType: lineType ?? undefined,
      teamSide: teamSide ?? undefined,
      isRefuerzo: isRefuerzo ?? false,
    },
    update: { 
      role: role ?? undefined, 
      status: status ?? undefined, 
      lineType: lineType ?? undefined,
      teamSide: teamSide ?? undefined,
      isRefuerzo: isRefuerzo ?? undefined,
    },
  })
  return updated(res, participant)
}))

/**
 * @swagger
 * /api/event-participants/batch:
 *   post:
 *     summary: Batch add or update event participants with dorsal validation
 *     tags: [EventParticipants]
 */
router.post('/batch', requirePermission('roster:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = batchUpsertSchema.safeParse(req.body)
  if (!parsed.success) return validationError(res, 'Datos de lote inválidos', parsed.error.issues)
  const { eventId, playerIds, role, status, teamSide, isRefuerzo } = parsed.data

  const [event, requestedPlayers, existingParticipants] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.player.findMany({ where: { id: { in: playerIds } }, include: { team: true } }),
    prisma.eventParticipant.findMany({ where: { eventId }, include: { player: { include: { team: true } } } })
  ])

  if (!event) return notFound(res, 'Evento no encontrado')

  const targetSide = teamSide || 'HOME'
  const added: any[] = []
  const skippedErrors: string[] = []

  // Track existing registered dorsals by team or side: key -> playerName
  const registeredDorsals = new Map<string, string>()

  existingParticipants.forEach(ep => {
    if (ep.player && ep.player.number !== undefined && ep.player.number !== null) {
      const side = ep.teamSide || 'HOME'
      const key = ep.player.teamId ? `team_${ep.player.teamId}_${ep.player.number}` : `side_${side}_${ep.player.number}`
      registeredDorsals.set(key, ep.player.name)
    }
  })

  for (const pl of requestedPlayers) {
    if (pl.number === null || pl.number === undefined || isNaN(pl.number) || pl.number < 0) {
      skippedErrors.push(`"${pl.name}" omitido: no tiene número dorsal asignado.`)
      continue
    }

    const teamKey = pl.teamId ? `team_${pl.teamId}_${pl.number}` : `side_${targetSide}_${pl.number}`
    if (registeredDorsals.has(teamKey)) {
      const occupant = registeredDorsals.get(teamKey)
      skippedErrors.push(`"${pl.name}" (dorsal #${pl.number}) omitido: dorsal ya ocupado por "${occupant}" en el mismo equipo.`)
      continue
    }

    const part = await prisma.eventParticipant.upsert({
      where: { eventId_playerId: { eventId, playerId: pl.id } },
      create: {
        eventId,
        playerId: pl.id,
        role: role ?? undefined,
        status: status ?? undefined,
        teamSide: teamSide ?? undefined,
        isRefuerzo: isRefuerzo ?? false,
      },
      update: {
        role: role ?? undefined,
        status: status ?? undefined,
        teamSide: teamSide ?? undefined,
        isRefuerzo: isRefuerzo ?? undefined,
      }
    })

    registeredDorsals.set(teamKey, pl.name)
    added.push(part)
  }

  return success(res, {
    addedCount: added.length,
    skippedCount: skippedErrors.length,
    errors: skippedErrors,
    participants: added,
  })
}))

/**
 * @swagger
 * /api/event-participants:
 *   delete:
 *     summary: Delete an event participant
 *     tags: [EventParticipants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *       - in: query
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *     responses:
 *       204:
 *         description: Event participant deleted successfully
 *       400:
 *         description: Invalid eventId or playerId
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Event participant not found
 */
router.delete('/', requirePermission('roster:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = deleteQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return validationError(res, 'eventId y playerId requeridos (números enteros positivos)', parsed.error.issues)
  }
  const { eventId, playerId } = parsed.data
  try {
    await prisma.eventParticipant.delete({ where: { eventId_playerId: { eventId, playerId } } })
    return deleted(res)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Event participant')
    }
    throw error
  }
}))

export default router
