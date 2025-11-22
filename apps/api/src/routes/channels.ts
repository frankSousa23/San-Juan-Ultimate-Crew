import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireRole } from './auth.js'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, created, notFound, validationError, conflict } from '../lib/response.js'

const router = Router()

const getQuerySchema = z.object({
  eventId: z.coerce.number().int().positive().optional(),
})

const channelIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: Get all channels or filter by event
 *     tags: [Channels]
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: integer
 *         description: Filter by event ID
 *     responses:
 *       200:
 *         description: List of channels with message count and last message
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Invalid eventId
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = getQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return validationError(res, 'Invalid query parameters', parsed.error.errors)
  }
  
  const { eventId } = parsed.data
  const channels = await prisma.channel.findMany({
    where: eventId ? { eventId } : undefined,
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { id: 'desc' },
  })
  return success(res, channels)
}))

/**
 * @swagger
 * /api/channels/{id}:
 *   get:
 *     summary: Get a channel by ID
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Channel ID
 *     responses:
 *       200:
 *         description: Channel details with last message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Channel not found
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const parsedId = channelIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.errors)
  }
  const { id } = parsedId.data
  
  const ch = await prisma.channel.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  
  if (!ch) {
    return notFound(res, 'Channel')
  }
  
  return success(res, ch)
}))

const createChannelSchema = z.object({
  name: z.string().min(1),
  eventId: z.coerce.number().int().positive().optional(),
})

/**
 * @swagger
 * /api/channels:
 *   post:
 *     summary: Create a new channel
 *     tags: [Channels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               eventId:
 *                 type: integer
 *                 description: Optional event ID to associate the channel
 *     responses:
 *       201:
 *         description: Channel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Channel for event already exists
 */
router.post('/', requireRole(['admin', 'player']), asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = createChannelSchema.parse(req.body)
    const channel = await prisma.channel.create({ data: payload })
    return created(res, channel)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return conflict(res, 'Channel for event already exists')
    }
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationError(res, 'Invalid payload', (error as z.ZodError).issues)
    }
    throw error
  }
}))

export default router
