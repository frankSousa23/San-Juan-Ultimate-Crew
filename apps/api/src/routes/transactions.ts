import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'

const router = Router()

// Helpers
const parseQuery = (q: any) => {
  const from = q.from ? new Date(String(q.from)) : undefined
  const to = q.to ? new Date(String(q.to)) : undefined
  const type = q.type && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(String(q.type)) ? String(q.type) as any : undefined
  const accountId = q.accountId ? Number(q.accountId) : undefined
  const categoryId = q.categoryId ? Number(q.categoryId) : undefined
  const limit = q.limit ? Math.min(100, Math.max(1, Number(q.limit))) : 50
  const offset = q.offset ? Math.max(0, Number(q.offset)) : 0
  return { from, to, type, accountId, categoryId, limit, offset }
}

// GET /api/transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { from, to, type, accountId, categoryId, limit, offset } = parseQuery(req.query)
    const where: any = {}
    if (from || to) where.occurredAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
    if (type) where.type = type
    if (accountId) where.accountId = accountId
    if (categoryId) where.categoryId = categoryId
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({ where, orderBy: { occurredAt: 'desc' }, take: limit, skip: offset, include: { account: true, category: true } }),
      prisma.transaction.count({ where })
    ])
    res.json({ items, total, limit, offset })
  } catch (e) {
    res.status(500).json({ error: 'Failed to list transactions' })
  }
})

const createSchema = z.object({
  accountId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amountCents: z.coerce.number().int(),
  occurredAt: z.coerce.date(),
  description: z.string().optional(),
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = createSchema.parse(req.body)
    const created = await prisma.transaction.create({ data: payload })
    res.status(201).json(created)
  } catch (e: any) {
    if (e?.issues) return res.status(400).json({ error: 'Invalid payload', issues: e.issues })
    res.status(500).json({ error: 'Failed to create transaction' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const payload = createSchema.partial().parse(req.body)
    const updated = await prisma.transaction.update({ where: { id }, data: payload })
    res.json(updated)
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Transaction not found' })
    if (e?.issues) return res.status(400).json({ error: 'Invalid payload', issues: e.issues })
    res.status(500).json({ error: 'Failed to update transaction' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    await prisma.transaction.delete({ where: { id } })
    res.status(204).send()
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Transaction not found' })
    res.status(500).json({ error: 'Failed to delete transaction' })
  }
})

// GET /api/finance/summary
router.get('/summary/overall', async (req: Request, res: Response) => {
  try {
    const { from, to } = parseQuery(req.query)
    const where: any = {}
    if (from || to) where.occurredAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { amountCents: true }, where: { ...where, type: 'INCOME' } }),
      prisma.transaction.aggregate({ _sum: { amountCents: true }, where: { ...where, type: 'EXPENSE' } })
    ])
    const income = incomeAgg._sum.amountCents ?? 0
    const expense = expenseAgg._sum.amountCents ?? 0
    const balance = income - expense
    res.json({ income, expense, balance })
  } catch {
    res.status(500).json({ error: 'Failed to compute summary' })
  }
})

export default router
