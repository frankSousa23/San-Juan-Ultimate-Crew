import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const router = Router()

// GET /api/channels?eventId=
router.get('/', async (req: Request, res: Response) => {
  const eventId = req.query.eventId ? Number(req.query.eventId) : undefined
  if (req.query.eventId && !Number.isInteger(eventId!)) return res.status(400).json({ error: 'Invalid eventId' })
  try {
    const channels = await prisma.channel.findMany({
      where: eventId ? { eventId } : undefined,
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { id: 'desc' },
    })
    res.json(channels)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list channels' })
  }
})

// GET /api/channels/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const ch = await prisma.channel.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
    if (!ch) return res.status(404).json({ error: 'Channel not found' })
    res.json(ch)
  } catch (e) {
    res.status(500).json({ error: 'Failed to load channel' })
  }
})

// POST /api/channels
const createChannelSchema = z.object({
  name: z.string().min(1),
  eventId: z.coerce.number().int().positive().optional(),
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = createChannelSchema.parse(req.body)
    const created = await prisma.channel.create({ data: payload })
    res.status(201).json(created)
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Channel for event already exists' })
    if (e?.issues) return res.status(400).json({ error: 'Invalid payload', issues: e.issues })
    res.status(500).json({ error: 'Failed to create channel' })
  }
})

export default router
