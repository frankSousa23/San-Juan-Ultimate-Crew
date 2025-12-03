import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { requireRole, requirePermission } from './auth.js'
import { createAuditHelper } from '../lib/audit.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, created, deleted, validationError, notFound } from '../lib/response.js'

const router = Router()

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: List of accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } })
  return success(res, accounts)
}))

const createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['CASH', 'BANK', 'MOBILE'])
})

const accountIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Account name
 *               type:
 *                 type: string
 *                 enum: [CASH, BANK, MOBILE]
 *                 description: Account type
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post('/', requirePermission('finance:manage'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = createAccountSchema.parse(req.body)
    const account = await prisma.account.create({ data: payload })
    const audit = createAuditHelper(req)
    await audit.log('CREATE', 'Account', account.id, {
      name: account.name,
      type: account.type,
    })
    return created(res, account)
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationError(res, 'Invalid payload', (error as z.ZodError).issues)
    }
    throw error
  }
}))

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Account ID
 *     responses:
 *       204:
 *         description: Account deleted successfully
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Account not found
 */
router.delete('/:id', requirePermission('finance:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = accountIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.errors)
  }
  const { id } = parsedId.data
  
  try {
    const existing = await prisma.account.findUnique({ where: { id } })
    if (!existing) {
      return notFound(res, 'Account not found')
    }
    
    await prisma.account.delete({ where: { id } })
    const audit = createAuditHelper(req)
    await audit.log('DELETE', 'Account', id, {
      name: existing.name,
      type: existing.type,
    })
    return deleted(res)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Account not found')
    }
    throw error
  }
}))

export default router
