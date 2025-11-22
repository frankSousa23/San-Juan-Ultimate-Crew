import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole } from './auth.js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { success, created, validationError } from '../lib/response.js';
const router = Router();
/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get messages from a channel
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: channelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Channel ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 30
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages before this timestamp
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages since this timestamp
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid query parameters
 */
const listMessagesQuerySchema = z.object({
    channelId: z.coerce.number().int().positive(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    before: z.coerce.date().optional(),
    since: z.coerce.date().optional(),
});
router.get('/', asyncHandler(async (req, res) => {
    const parsed = listMessagesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return validationError(res, 'Invalid query parameters', parsed.error.errors);
    }
    const { channelId, limit, before, since } = parsed.data;
    const where = { channelId };
    if (before)
        where.createdAt = { lt: before };
    if (since)
        where.createdAt = { gt: since };
    const messages = await prisma.message.findMany({
        where,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    number: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
    return success(res, messages);
}));
const createMessageSchema = z.object({
    channelId: z.coerce.number().int().positive(),
    authorId: z.coerce.number().int().positive().optional(),
    content: z.string().min(1),
});
/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Create a new message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelId
 *               - content
 *             properties:
 *               channelId:
 *                 type: integer
 *               authorId:
 *                 type: integer
 *                 description: Optional author ID
 *               content:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       201:
 *         description: Message created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid input
 */
router.post('/', requireRole(['admin', 'player']), asyncHandler(async (req, res) => {
    try {
        const payload = createMessageSchema.parse(req.body);
        const message = await prisma.message.create({ data: payload });
        return created(res, message);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'issues' in error) {
            return validationError(res, 'Invalid payload', error.issues);
        }
        throw error;
    }
}));
export default router;
