import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { requireRole } from './auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import type { Prisma } from '@prisma/client'
import { success, updated, deleted, validationError, notFound } from '../lib/response.js'

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
  if (!parsed.success) return validationError(res, 'Invalid query parameters', parsed.error.errors)
  const { eventId } = parsed.data
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
 *     responses:
 *       200:
 *         description: Event participant created or updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventParticipant'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.put('/', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) return validationError(res, 'Invalid input', parsed.error.errors)
  const { eventId, playerId, role, status } = parsed.data
  const participant = await prisma.eventParticipant.upsert({
    where: { eventId_playerId: { eventId, playerId } },
    create: { eventId, playerId, role: role ?? undefined, status: status ?? undefined },
    update: { role: role ?? undefined, status: status ?? undefined },
  })
  return updated(res, participant)
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
router.delete('/', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const eventId = Number(req.query.eventId)
  const playerId = Number(req.query.playerId)
  if (!Number.isFinite(eventId) || !Number.isFinite(playerId)) {
    return validationError(res, 'eventId y playerId requeridos')
  }
  try {
    await prisma.eventParticipant.delete({ where: { eventId_playerId: { eventId, playerId } } })
    return deleted(res)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Event participant not found')
    }
    throw error
  }
}))

export default router
