import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

const createSchema = z.object({
  playerId: z.coerce.number().int().positive(),
  type: z.string().min(1),
  severity: z.enum(['MILD','MODERATE','SEVERE']),
  status: z.enum(['ACTIVE','RECOVERING','RESOLVED']).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  description: z.string().optional().nullable(),
})

const updateSchema = createSchema.partial()

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const items = await prisma.injury.findMany({ include: { player: true }, orderBy: { startDate: 'desc' } })
  res.json(items)
}))

const listQuerySchema = z.object({
  playerId: z.coerce.number().int().positive().optional(),
  severity: z.enum(['MILD','MODERATE','SEVERE']).optional(),
  status: z.enum(['ACTIVE','RECOVERING','RESOLVED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

router.get('/paged', asyncHandler(async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { playerId, severity, status, limit, offset } = parsed.data
  const where: Prisma.InjuryWhereInput = {}
  if (playerId) where.playerId = playerId
  if (severity) where.severity = severity
  if (status) where.status = status
  const [total, items] = await Promise.all([
    prisma.injury.count({ where }),
    prisma.injury.findMany({ where, include: { player: true }, orderBy: { startDate: 'desc' }, take: limit, skip: offset })
  ])
  res.json({ items, total, limit, offset })
}))

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  const created = await prisma.injury.create({ data: { ...data, endDate: data.endDate ?? undefined }, include: { player: true } })
  res.status(201).json(created)
}))

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'id requerido' })
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const data = parsed.data
  try {
    const updated = await prisma.injury.update({ where: { id }, data: { ...data, endDate: data.endDate ?? undefined }, include: { player: true } })
    res.json(updated)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Injury not found' })
    }
    throw error
  }
}))

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'id requerido' })
  try {
    await prisma.injury.delete({ where: { id } })
    res.status(204).end()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Injury not found' })
    }
    throw error
  }
}))

export default router
