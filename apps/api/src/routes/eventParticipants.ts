import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { requireRole, requirePermission } from './auth.js'
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
  if (!parsed.success) return validationError(res, 'Invalid query parameters', parsed.error.issues)
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
  lineType: z.string().optional().nullable(), // O-Line, D-Line, Flex
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
router.put('/', requirePermission('roster:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) return validationError(res, 'Invalid input', parsed.error.issues)
  const { eventId, playerId, role, status, lineType } = parsed.data
  const participant = await prisma.eventParticipant.upsert({
    where: { eventId_playerId: { eventId, playerId } },
    create: { eventId, playerId, role: role ?? undefined, status: status ?? undefined, lineType: lineType ?? undefined },
    update: { role: role ?? undefined, status: status ?? undefined, lineType: lineType ?? undefined },
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
