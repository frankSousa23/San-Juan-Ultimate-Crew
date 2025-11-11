import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

// GET /api/messages?channelId=&limit=30&before=ts&since=ts
const listMessagesQuerySchema = z.object({
  channelId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  before: z.coerce.date().optional(),
  since: z.coerce.date().optional(),
})

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = listMessagesQuerySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { channelId, limit, before, since } = parsed.data
  const where: Prisma.MessageWhereInput = { channelId }
  if (before) where.createdAt = { lt: before }
  if (since) where.createdAt = { gt: since }
  const data = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json(data)
}))

const createMessageSchema = z.object({
  channelId: z.coerce.number().int().positive(),
  authorId: z.coerce.number().int().positive().optional(),
  content: z.string().min(1),
})

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = createMessageSchema.parse(req.body)
    const created = await prisma.message.create({ data: payload })
    res.status(201).json(created)
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return res.status(400).json({ error: 'Invalid payload', issues: (error as z.ZodError).issues })
    }
    throw error
  }
}))

export default router
