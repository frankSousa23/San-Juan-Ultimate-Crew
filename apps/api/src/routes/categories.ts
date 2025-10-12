import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { requireRole } from './auth.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    res.json(categories)
  } catch {
    res.status(500).json({ error: 'Failed to list categories' })
  }
})

const createCategorySchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'])
})

router.post('/', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const payload = createCategorySchema.parse(req.body)
    const created = await prisma.category.create({ data: payload })
    res.status(201).json(created)
  } catch (e: any) {
    if (e?.issues) return res.status(400).json({ error: 'Invalid payload', issues: e.issues })
    res.status(500).json({ error: 'Failed to create category' })
  }
})

router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    await prisma.category.delete({ where: { id } })
    res.status(204).send()
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Category not found' })
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

export default router
