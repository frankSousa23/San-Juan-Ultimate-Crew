import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { requirePermission } from './auth.js'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, created, updated, deleted, paginated, validationError, notFound } from '../lib/response.js'
import { isGuestRequest, GUEST_INJURIES } from '../lib/guestDemoData.js'

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

/**
 * @swagger
 * /api/injuries:
 *   get:
 *     summary: Get all injuries
 *     tags: [Injuries]
 *     responses:
 *       200:
 *         description: List of injuries with player information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Injury'
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  if (isGuestRequest(req)) {
    return success(res, GUEST_INJURIES)
  }
  const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  const whereClause = !isAdmin && userTeamId ? { player: { OR: [{ teamId: userTeamId }, { teamId: null }] } } : {};
  const items = await prisma.injury.findMany({ where: whereClause, include: { player: true }, orderBy: { startDate: 'desc' } })
  return success(res, items)
}))

const listQuerySchema = z.object({
  playerId: z.coerce.number().int().positive({ message: 'playerId debe ser un número entero positivo' }).optional(),
  severity: z.enum(['MILD','MODERATE','SEVERE']).optional(),
  status: z.enum(['ACTIVE','RECOVERING','RESOLVED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

const injuryIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

/**
 * @swagger
 * /api/injuries/paged:
 *   get:
 *     summary: Get paginated injuries with filters
 *     tags: [Injuries]
 *     parameters:
 *       - in: query
 *         name: playerId
 *         schema:
 *           type: integer
 *         description: Filter by player ID
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [MILD, MODERATE, SEVERE]
 *         description: Filter by severity
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RECOVERING, RESOLVED]
 *         description: Filter by status
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
 *         description: Paginated list of injuries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Injury'
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
  
  const { playerId, severity, status, limit, offset } = parsed.data

  if (isGuestRequest(req)) {
    let filtered = GUEST_INJURIES
    if (playerId) filtered = filtered.filter(i => i.playerId === playerId)
    if (severity) filtered = filtered.filter(i => i.severity === severity)
    if (status) filtered = filtered.filter(i => i.status === status)
    const items = filtered.slice(offset, offset + limit)
    return paginated(res, items, filtered.length, limit, offset)
  }

  const where: Prisma.InjuryWhereInput = {}
  const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  if (!isAdmin && userTeamId) {
    where.player = {
      OR: [{ teamId: userTeamId }, { teamId: null }]
    };
  }
  if (playerId) where.playerId = playerId
  if (severity) where.severity = severity
  if (status) where.status = status
  
  const [total, items] = await Promise.all([
    prisma.injury.count({ where }),
    prisma.injury.findMany({ where, include: { player: true }, orderBy: { startDate: 'desc' }, take: limit, skip: offset })
  ])
  
  return paginated(res, items, total, limit, offset)
}))

/**
 * @swagger
 * /api/injuries:
 *   post:
 *     summary: Create a new injury
 *     tags: [Injuries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playerId
 *               - type
 *               - severity
 *               - startDate
 *             properties:
 *               playerId:
 *                 type: integer
 *               type:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [MILD, MODERATE, SEVERE]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, RECOVERING, RESOLVED]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Injury created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Injury'
 *       400:
 *         description: Invalid input
 */
router.post('/', requirePermission('injuries:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid input', parsed.error.issues)
  }
  
  const data = parsed.data
  const injury = await prisma.injury.create({ data: { ...data, endDate: data.endDate ?? undefined }, include: { player: true } })
  return created(res, injury)
}))

/**
 * @swagger
 * /api/injuries/{id}:
 *   put:
 *     summary: Update an injury
 *     tags: [Injuries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Injury ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: integer
 *               type:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [MILD, MODERATE, SEVERE]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, RECOVERING, RESOLVED]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Injury updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Injury'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Injury not found
 */
router.put('/:id', requirePermission('injuries:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = injuryIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.issues)
  }
  const { id } = parsedId.data
  
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid input', parsed.error.issues)
  }
  
  const data = parsed.data
  try {
    const injury = await prisma.injury.update({ where: { id }, data: { ...data, endDate: data.endDate ?? undefined }, include: { player: true } })
    return updated(res, injury)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Injury')
    }
    throw error
  }
}))

/**
 * @swagger
 * /api/injuries/{id}:
 *   delete:
 *     summary: Delete an injury
 *     tags: [Injuries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Injury ID
 *     responses:
 *       204:
 *         description: Injury deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Injury not found
 */
router.delete('/:id', requirePermission('injuries:manage'), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = injuryIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.issues)
  }
  const { id } = parsedId.data
  
  try {
    await prisma.injury.delete({ where: { id } })
    return deleted(res)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Injury')
    }
    throw error
  }
}))

export default router
