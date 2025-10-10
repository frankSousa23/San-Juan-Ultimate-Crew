import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const router = Router()

const createSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['OFFENSE','DEFENSE','DRILL']),
  description: z.string().optional().nullable(),
  diagramUrl: z.string().url().optional().nullable(),
  content: z.string().optional().nullable(),
})

const updateSchema = createSchema.partial()

const listQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(['OFFENSE','DEFENSE','DRILL']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

router.get('/', async (req: Request, res: Response) => {
  const category = req.query.category as string | undefined
  const q = (req.query.q as string | undefined)?.toLowerCase()
  const items = await prisma.play.findMany({
    where: {
      AND: [
        category ? { category: category as any } : {},
        q ? { name: { contains: q, mode: 'insensitive' } } : {},
      ]
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json(items)
})

router.get('/paged', async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { q, category, limit, offset } = parsed.data
  const where: any = {
    AND: [
      category ? { category } : {},
      q ? { name: { contains: q, mode: 'insensitive' } } : {},
    ]
  }
  const [total, items] = await Promise.all([
    prisma.play.count({ where }),
    prisma.play.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset })
  ])
  res.json({ items, total, limit, offset })
})

router.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const created = await prisma.play.create({ data: parsed.data })
  res.status(201).json(created)
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'id requerido' })
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const updated = await prisma.play.update({ where: { id }, data: parsed.data })
  res.json(updated)
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'id requerido' })
  await prisma.play.delete({ where: { id } })
  res.status(204).end()
})

export default router
