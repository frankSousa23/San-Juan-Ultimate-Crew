import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { requirePermission } from './auth.js'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, created, updated, deleted, paginated, validationError, notFound } from '../lib/response.js'
import { isGuestRequest, GUEST_PLAYS } from '../lib/guestDemoData.js'

const router = Router()

type PlayCategory = 'OFFENSE' | 'DEFENSE' | 'DRILL'

const createSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['OFFENSE','DEFENSE','DRILL']),
  description: z.string().optional().nullable(),
  diagramUrl: z.string().url().optional().nullable(),
  content: z.string().optional().nullable(),
})

const updateSchema = createSchema.partial()

const querySchema = z.object({
  q: z.string().optional(),
  category: z.enum(['OFFENSE','DEFENSE','DRILL']).optional(),
})

const listQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(['OFFENSE','DEFENSE','DRILL']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

const playIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

/**
 * @swagger
 * /api/plays:
 *   get:
 *     summary: Get all plays
 *     tags: [Plays]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (searches in name)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [OFFENSE, DEFENSE, DRILL]
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of plays
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Play'
 *       400:
 *         description: Invalid query parameters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    return validationError(res, 'Invalid query parameters', parsed.error.issues)
  }
  
  const { category, q } = parsed.data

  if (isGuestRequest(req)) {
    let filtered = GUEST_PLAYS
    if (category) filtered = filtered.filter(p => p.category === category)
    if (q) filtered = filtered.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
    return success(res, filtered)
  }

  const where: Prisma.PlayWhereInput = {}
  
  if (category) {
    where.category = category
  }
  if (q) {
    where.name = { contains: q.trim(), mode: 'insensitive' }
  }
  
  const items = await prisma.play.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
  return success(res, items)
}))

/**
 * @swagger
 * /api/plays/paged:
 *   get:
 *     summary: Get paginated plays with filters
 *     tags: [Plays]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (searches in name)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [OFFENSE, DEFENSE, DRILL]
 *         description: Filter by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: Paginated list of plays
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Play'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       400:
 *         description: Invalid query parameters
 */
router.get('/paged', asyncHandler(async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return validationError(res, 'Invalid query parameters', parsed.error.issues)
  }
  
  const { q, category, limit, offset } = parsed.data

  if (isGuestRequest(req)) {
    let filtered = GUEST_PLAYS
    if (category) filtered = filtered.filter(p => p.category === category)
    if (q) filtered = filtered.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
    const items = filtered.slice(offset, offset + limit)
    return paginated(res, items, filtered.length, limit, offset)
  }

  const where: Prisma.PlayWhereInput = {}
  
  if (category) where.category = category
  if (q) where.name = { contains: q, mode: 'insensitive' }
  
  const [total, items] = await Promise.all([
    prisma.play.count({ where }),
    prisma.play.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset })
  ])
  
  return paginated(res, items, total, limit, offset)
}))

/**
 * @swagger
 * /api/plays:
 *   post:
 *     summary: Create a new play
 *     tags: [Plays]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [OFFENSE, DEFENSE, DRILL]
 *               description:
 *                 type: string
 *                 nullable: true
 *               diagramUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               content:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Play created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Play'
 *       400:
 *         description: Invalid input
 */
router.post('/', requirePermission('plays:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid input', parsed.error.issues)
  }
  
  const play = await prisma.play.create({ data: parsed.data })
  return created(res, play)
}))

/**
 * @swagger
 * /api/plays/{id}:
 *   put:
 *     summary: Update a play
 *     tags: [Plays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Play ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [OFFENSE, DEFENSE, DRILL]
 *               description:
 *                 type: string
 *                 nullable: true
 *               diagramUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               content:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Play updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Play'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Play not found
 */
router.put('/:id', requirePermission('plays:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = playIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.issues)
  }
  const { id } = parsedId.data
  
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid input', parsed.error.issues)
  }
  
  try {
    const play = await prisma.play.update({ where: { id }, data: parsed.data })
    return updated(res, play)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Play')
    }
    throw error
  }
}))

/**
 * @swagger
 * /api/plays/{id}:
 *   delete:
 *     summary: Delete a play
 *     tags: [Plays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Play ID
 *     responses:
 *       204:
 *         description: Play deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Play not found
 */
router.delete('/:id', requirePermission('plays:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = playIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.issues)
  }
  const { id } = parsedId.data
  
  try {
    await prisma.play.delete({ where: { id } })
    return deleted(res)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Play not found' })
    }
    throw error
  }
}))

export default router
