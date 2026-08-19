import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { requirePermission } from './auth.js'
import type { Prisma } from '@prisma/client'
import { createAuditHelper } from '../lib/audit.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { paginated, created, updated, deleted, success, validationError, notFound } from '../lib/response.js'

const router = Router()

type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

const transactionQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  accountId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get transactions with filters
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER]
 *         description: Transaction type filter
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: Account ID filter
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Category ID filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = transactionQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return validationError(res, 'Invalid query parameters', parsed.error.issues)
  }
  
  const { from, to, type, accountId, categoryId, limit, offset } = parsed.data
  const where: Prisma.TransactionWhereInput = {}
  
  if (from || to) {
    where.occurredAt = { 
      ...(from ? { gte: from } : {}), 
      ...(to ? { lte: to } : {}) 
    }
  }
  if (type) where.type = type
  if (accountId) where.accountId = accountId
  if (categoryId) where.categoryId = categoryId
  
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: { occurredAt: 'desc' }, take: limit, skip: offset, include: { account: true, category: true } }),
    prisma.transaction.count({ where })
  ])
  
  return paginated(res, items, total, limit, offset)
}))

const createSchema = z.object({
  accountId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amountCents: z.coerce.number().int(),
  occurredAt: z.coerce.date(),
  description: z.string().optional(),
})

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - type
 *               - amountCents
 *               - occurredAt
 *             properties:
 *               accountId:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE, TRANSFER]
 *               amountCents:
 *                 type: integer
 *                 description: Amount in cents
 *               occurredAt:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post('/', requirePermission('finance:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid payload', parsed.error.issues)
  }
  
  const transaction = await prisma.transaction.create({ data: parsed.data })
  const audit = createAuditHelper(req)
  await audit.log('CREATE', 'Transaction', transaction.id, {
    type: transaction.type,
    amountCents: transaction.amountCents,
    accountId: transaction.accountId,
  })
  return created(res, transaction)
}))

const transactionIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

router.put('/:id', requirePermission('finance:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = transactionIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.issues)
  }
  const { id } = parsedId.data
  
  const existing = await prisma.transaction.findUnique({ where: { id } })
  if (!existing) {
    return notFound(res, 'Transaction')
  }
  
  const parsed = createSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid payload', parsed.error.issues)
  }
  
  const transaction = await prisma.transaction.update({ where: { id }, data: parsed.data })
  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'Transaction', id, {
    changes: Object.keys(parsed.data),
    oldAmount: existing.amountCents,
    newAmount: transaction.amountCents,
  })
  return updated(res, transaction)
}))

router.delete('/:id', requirePermission('finance:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = transactionIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.issues)
  }
  const { id } = parsedId.data
  
  try {
    const existing = await prisma.transaction.findUnique({ where: { id } })
    if (!existing) {
      return notFound(res, 'Transaction')
    }
    
    await prisma.transaction.delete({ where: { id } })
    const audit = createAuditHelper(req)
    await audit.log('DELETE', 'Transaction', id, {
      type: existing.type,
      amountCents: existing.amountCents,
      accountId: existing.accountId,
    })
    return deleted(res)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Transaction')
    }
    throw error
  }
}))

/**
 * @swagger
 * /api/transactions/summary/overall:
 *   get:
 *     summary: Get financial summary
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 income:
 *                   type: integer
 *                   description: Total income in cents
 *                 expense:
 *                   type: integer
 *                   description: Total expenses in cents
 *                 balance:
 *                   type: integer
 *                   description: Balance (income - expense) in cents
 */
const summaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

router.get('/summary/overall', asyncHandler(async (req: Request, res: Response) => {
  const parsed = summaryQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return validationError(res, 'Invalid query parameters', parsed.error.issues)
  }
  
  const { from, to } = parsed.data
  const where: Prisma.TransactionWhereInput = {}
  
  if (from || to) {
    where.occurredAt = { 
      ...(from ? { gte: from } : {}), 
      ...(to ? { lte: to } : {}) 
    }
  }
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { amountCents: true }, where: { ...where, type: 'INCOME' } }),
    prisma.transaction.aggregate({ _sum: { amountCents: true }, where: { ...where, type: 'EXPENSE' } })
  ])
  const income = incomeAgg._sum.amountCents ?? 0
  const expense = expenseAgg._sum.amountCents ?? 0
  const balance = income - expense
  return success(res, { income, expense, balance })
}))

export default router
