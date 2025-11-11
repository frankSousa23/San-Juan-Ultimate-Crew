import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

// GET /api/attendance?eventId=1
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const eventId = Number(req.query.eventId)
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({ error: 'eventId requerido' })
  }
  const records = await prisma.attendance.findMany({
    where: { eventId },
    include: { player: true },
    orderBy: { playerId: 'asc' }
  })
  res.json(records)
}))

// PUT /api/attendance  { eventId, playerId, status, note? }
const upsertSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  playerId: z.coerce.number().int().positive(),
  status: z.enum(['present','absent','late']),
  note: z.string().optional().nullable(),
})

router.put('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { eventId, playerId, status, note } = parsed.data
  const record = await prisma.attendance.upsert({
    where: { playerId_eventId: { playerId, eventId } },
    create: { eventId, playerId, status, note: note ?? undefined },
    update: { status, note: note ?? undefined },
    include: { player: true },
  })
  res.json(record)
}))

// DELETE /api/attendance?eventId=&playerId=
router.delete('/', asyncHandler(async (req: Request, res: Response) => {
  const eventId = Number(req.query.eventId)
  const playerId = Number(req.query.playerId)
  if (!Number.isInteger(eventId) || eventId <= 0 || !Number.isInteger(playerId) || playerId <= 0) {
    return res.status(400).json({ error: 'eventId y playerId requeridos' })
  }
  try {
    await prisma.attendance.delete({ where: { playerId_eventId: { eventId, playerId } } })
    res.status(204).end()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Attendance record not found' })
    }
    throw error
  }
}))

export default router
