import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { requireRole } from './auth.js'
import { createAuditHelper } from '../lib/audit.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, created, deleted, validationError, notFound } from '../lib/response.js'

const router = Router()

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return success(res, categories)
}))

const createCategorySchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'])
})

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
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
 *               - kind
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               kind:
 *                 type: string
 *                 enum: [INCOME, EXPENSE, TRANSFER]
 *                 description: Category kind
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post('/', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = createCategorySchema.parse(req.body)
    const category = await prisma.category.create({ data: payload })
    const audit = createAuditHelper(req)
    await audit.log('CREATE', 'Category', category.id, {
      name: category.name,
      kind: category.kind,
    })
    return created(res, category)
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationError(res, 'Invalid payload', (error as z.ZodError).issues)
    }
    throw error
  }
}))

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Category not found
 */
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return validationError(res, 'Invalid id')
  }
  
  try {
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return notFound(res, 'Category')
    }
    
    await prisma.category.delete({ where: { id } })
    const audit = createAuditHelper(req)
    await audit.log('DELETE', 'Category', id, {
      name: existing.name,
      kind: existing.kind,
    })
    return deleted(res)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Category')
    }
    throw error
  }
}))

export default router
