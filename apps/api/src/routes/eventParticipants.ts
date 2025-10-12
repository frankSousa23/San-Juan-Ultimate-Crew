import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { requireRole } from './auth.js'

const router = Router()

const listQuerySchema = z.object({
  eventId: z.coerce.number().int().optional(),
})

// GET /api/event-participants?eventId=
router.get('/', async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { eventId } = parsed.data
  const where: any = {}
  if (eventId) where.eventId = eventId
  const items = await prisma.eventParticipant.findMany({
    where,
    include: { player: true, event: true },
    orderBy: [{ eventId: 'desc' }, { playerId: 'asc' }]
  })
  res.json(items)
})

const upsertSchema = z.object({
  eventId: z.coerce.number().int(),
  playerId: z.coerce.number().int(),
  role: z.string().optional().nullable(),
  status: z.string().optional().nullable(), // confirmed, tentative, declined
})

// PUT /api/event-participants  { eventId, playerId, role?, status? }
router.put('/', requireRole(['admin']), async (req: Request, res: Response) => {
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { eventId, playerId, role, status } = parsed.data
  const updated = await prisma.eventParticipant.upsert({
    where: { eventId_playerId: { eventId, playerId } },
    create: { eventId, playerId, role: role ?? undefined, status: status ?? undefined },
    update: { role: role ?? undefined, status: status ?? undefined },
  })
  res.json(updated)
})

// DELETE /api/event-participants?eventId=&playerId=
router.delete('/', requireRole(['admin']), async (req: Request, res: Response) => {
  const eventId = Number(req.query.eventId)
  const playerId = Number(req.query.playerId)
  if (!Number.isFinite(eventId) || !Number.isFinite(playerId)) {
    return res.status(400).json({ error: 'eventId y playerId requeridos' })
  }
  await prisma.eventParticipant.delete({ where: { eventId_playerId: { eventId, playerId } } })
  res.status(204).end()
})

export default router
