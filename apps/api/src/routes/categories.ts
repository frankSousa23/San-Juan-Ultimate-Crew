import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

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

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = createCategorySchema.parse(req.body)
    const created = await prisma.category.create({ data: payload })
    res.status(201).json(created)
  } catch (e: any) {
    if (e?.issues) return res.status(400).json({ error: 'Invalid payload', issues: e.issues })
    res.status(500).json({ error: 'Failed to create category' })
  }
})

export default router
