import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requirePermission } from './auth.js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { success, created, updated, deleted, paginated, validationError, notFound } from '../lib/response.js';
const router = Router();
const createSchema = z.object({
    name: z.string().min(1),
    strengths: z.string().optional().nullable(),
    weaknesses: z.string().optional().nullable(),
    lastPlayedAt: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
});
const updateSchema = createSchema.partial();
/**
 * @swagger
 * /api/rivals:
 *   get:
 *     summary: Get all rivals
 *     tags: [Rivals]
 *     responses:
 *       200:
 *         description: List of rivals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rival'
 */
router.get('/', asyncHandler(async (_req, res) => {
    const items = await prisma.rival.findMany({ orderBy: { createdAt: 'desc' } });
    return success(res, items);
}));
const listQuerySchema = z.object({
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
const rivalIdSchema = z.object({
    id: z.coerce.number().int().positive()
});
/**
 * @swagger
 * /api/rivals/paged:
 *   get:
 *     summary: Get paginated rivals with search
 *     tags: [Rivals]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (searches in name)
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
 *         description: Paginated list of rivals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rival'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       400:
 *         description: Invalid query parameters
 */
router.get('/paged', asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return validationError(res, 'Invalid query parameters', parsed.error.errors);
    }
    const { q, limit, offset } = parsed.data;
    const where = q ? { name: { contains: q, mode: 'insensitive' } } : {};
    const [total, items] = await Promise.all([
        prisma.rival.count({ where }),
        prisma.rival.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset })
    ]);
    return paginated(res, items, total, limit, offset);
}));
/**
 * @swagger
 * /api/rivals:
 *   post:
 *     summary: Create a new rival
 *     tags: [Rivals]
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
 *               strengths:
 *                 type: string
 *                 nullable: true
 *               weaknesses:
 *                 type: string
 *                 nullable: true
 *               lastPlayedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Rival created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rival'
 *       400:
 *         description: Invalid input
 */
router.post('/', requirePermission('rivals:manage'), asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        return validationError(res, 'Invalid input', parsed.error.errors);
    }
    const data = parsed.data;
    const rival = await prisma.rival.create({ data: { ...data, lastPlayedAt: data.lastPlayedAt ?? undefined } });
    return created(res, rival);
}));
/**
 * @swagger
 * /api/rivals/{id}:
 *   put:
 *     summary: Update a rival
 *     tags: [Rivals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rival ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               strengths:
 *                 type: string
 *                 nullable: true
 *               weaknesses:
 *                 type: string
 *                 nullable: true
 *               lastPlayedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Rival updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rival'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Rival not found
 */
router.put('/:id', requirePermission('rivals:manage'), asyncHandler(async (req, res) => {
    const parsedId = rivalIdSchema.safeParse(req.params);
    if (!parsedId.success) {
        return validationError(res, 'Invalid id', parsedId.error.errors);
    }
    const { id } = parsedId.data;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
        return validationError(res, 'Invalid input', parsed.error.errors);
    }
    const data = parsed.data;
    try {
        const rival = await prisma.rival.update({ where: { id }, data: { ...data, lastPlayedAt: data.lastPlayedAt ?? undefined } });
        return updated(res, rival);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return notFound(res, 'Rival');
        }
        throw error;
    }
}));
/**
 * @swagger
 * /api/rivals/{id}:
 *   delete:
 *     summary: Delete a rival
 *     tags: [Rivals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rival ID
 *     responses:
 *       204:
 *         description: Rival deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Rival not found
 */
router.delete('/:id', requirePermission('rivals:manage'), asyncHandler(async (req, res) => {
    const parsedId = rivalIdSchema.safeParse(req.params);
    if (!parsedId.success) {
        return validationError(res, 'Invalid id', parsedId.error.errors);
    }
    const { id } = parsedId.data;
    try {
        await prisma.rival.delete({ where: { id } });
        return deleted(res);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return notFound(res, 'Rival');
        }
        throw error;
    }
}));
// Rival Players endpoints
const createRivalPlayerSchema = z.object({
    name: z.string().min(1),
    number: z.number().int().positive(),
    position: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});
const updateRivalPlayerSchema = createRivalPlayerSchema.partial();
/**
 * @swagger
 * /api/rivals/{rivalId}/players:
 *   get:
 *     summary: Get all players for a rival
 *     tags: [Rivals]
 */
router.get('/:id/players', asyncHandler(async (req, res) => {
    const parsedId = rivalIdSchema.safeParse(req.params);
    if (!parsedId.success) {
        return validationError(res, 'Invalid id', parsedId.error.errors);
    }
    const { id } = parsedId.data;
    const players = await prisma.rivalPlayer.findMany({
        where: { rivalId: id },
        orderBy: { number: 'asc' }
    });
    return success(res, players);
}));
/**
 * @swagger
 * /api/rivals/{rivalId}/players:
 *   post:
 *     summary: Create a new player for a rival
 *     tags: [Rivals]
 */
router.post('/:id/players', requirePermission('rivals:manage'), asyncHandler(async (req, res) => {
    const parsedId = rivalIdSchema.safeParse(req.params);
    if (!parsedId.success) {
        return validationError(res, 'Invalid id', parsedId.error.errors);
    }
    const { id } = parsedId.data;
    const parsed = createRivalPlayerSchema.safeParse(req.body);
    if (!parsed.success) {
        return validationError(res, 'Invalid input', parsed.error.errors);
    }
    // Verificar que el rival existe
    const rival = await prisma.rival.findUnique({ where: { id } });
    if (!rival) {
        return notFound(res, 'Rival');
    }
    const player = await prisma.rivalPlayer.create({
        data: {
            rivalId: id,
            ...parsed.data
        }
    });
    return created(res, player);
}));
/**
 * @swagger
 * /api/rivals/{rivalId}/players/{playerId}:
 *   put:
 *     summary: Update a rival player
 *     tags: [Rivals]
 */
router.put('/:id/players/:playerId', requirePermission('rivals:manage'), asyncHandler(async (req, res) => {
    const parsedId = rivalIdSchema.safeParse(req.params);
    if (!parsedId.success) {
        return validationError(res, 'Invalid id', parsedId.error.errors);
    }
    const { id } = parsedId.data;
    const playerId = Number(req.params.playerId);
    if (!playerId || playerId <= 0) {
        return validationError(res, 'Invalid player id');
    }
    const parsed = updateRivalPlayerSchema.safeParse(req.body);
    if (!parsed.success) {
        return validationError(res, 'Invalid input', parsed.error.errors);
    }
    try {
        const player = await prisma.rivalPlayer.update({
            where: { id: playerId, rivalId: id },
            data: parsed.data
        });
        return updated(res, player);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return notFound(res, 'Rival player');
        }
        throw error;
    }
}));
/**
 * @swagger
 * /api/rivals/{rivalId}/players/{playerId}:
 *   delete:
 *     summary: Delete a rival player
 *     tags: [Rivals]
 */
router.delete('/:id/players/:playerId', requirePermission('rivals:manage'), asyncHandler(async (req, res) => {
    const parsedId = rivalIdSchema.safeParse(req.params);
    if (!parsedId.success) {
        return validationError(res, 'Invalid id', parsedId.error.errors);
    }
    const { id } = parsedId.data;
    const playerId = Number(req.params.playerId);
    if (!playerId || playerId <= 0) {
        return validationError(res, 'Invalid player id');
    }
    try {
        await prisma.rivalPlayer.delete({
            where: { id: playerId, rivalId: id }
        });
        return deleted(res);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return notFound(res, 'Rival player');
        }
        throw error;
    }
}));
/**
 * @swagger
 * /api/rivals/{rivalId}/stats:
 *   get:
 *     summary: Get statistics for a rival (from annotations)
 *     tags: [Rivals]
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
    const parsedId = rivalIdSchema.safeParse(req.params);
    if (!parsedId.success) {
        return validationError(res, 'Invalid id', parsedId.error.errors);
    }
    const { id } = parsedId.data;
    const rival = await prisma.rival.findUnique({ where: { id } });
    if (!rival) {
        return notFound(res, 'Rival');
    }
    // Obtener todas las anotaciones relacionadas con este rival
    const annotations = await prisma.eventAnnotation.findMany({
        where: { rivalId: id },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    startsAt: true,
                }
            },
            rivalPlayer: {
                select: {
                    id: true,
                    name: true,
                    number: true,
                }
            }
        }
    });
    // Estadísticas por jugador del rival
    const playerStats = annotations
        .filter(ann => ann.rivalPlayerId !== null)
        .reduce((acc, ann) => {
        const playerId = ann.rivalPlayerId;
        if (!acc[playerId]) {
            acc[playerId] = {
                player: ann.rivalPlayer,
                goals: 0,
                assists: 0,
                interceptions: 0,
                total: 0,
            };
        }
        acc[playerId].total++;
        if (ann.type === 'GOAL')
            acc[playerId].goals++;
        if (ann.type === 'ASSIST')
            acc[playerId].assists++;
        if (ann.type === 'DEFENSE')
            acc[playerId].interceptions++;
        return acc;
    }, {});
    // Estadísticas por tipo
    const statsByType = annotations.reduce((acc, ann) => {
        acc[ann.type] = (acc[ann.type] || 0) + 1;
        return acc;
    }, {});
    // Eventos donde se enfrentó este rival
    const events = Array.from(new Set(annotations.map(a => a.eventId)));
    return success(res, {
        rival: {
            id: rival.id,
            name: rival.name,
        },
        totalAnnotations: annotations.length,
        eventsCount: events.length,
        statsByType,
        playerStats: Object.values(playerStats),
        recentEvents: annotations
            .slice(0, 10)
            .map(a => ({
            event: a.event,
            type: a.type,
            timestamp: a.timestamp,
        }))
    });
}));
export default router;
