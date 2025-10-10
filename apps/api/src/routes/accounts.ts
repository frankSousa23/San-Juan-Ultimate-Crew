import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } })
    res.json(accounts)
  } catch {
    res.status(500).json({ error: 'Failed to list accounts' })
  }
})

const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['CASH', 'BANK', 'MOBILE'])
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = createAccountSchema.parse(req.body)
    const created = await prisma.account.create({ data: payload })
    res.status(201).json(created)
  } catch (e: any) {
    if (e?.issues) return res.status(400).json({ error: 'Invalid payload', issues: e.issues })
    res.status(500).json({ error: 'Failed to create account' })
  }
})

export default router
