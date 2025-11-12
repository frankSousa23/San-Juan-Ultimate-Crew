import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { success, created, updated, deleted, paginated, validationError } from '../lib/response.js';
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
router.post('/', asyncHandler(async (req, res) => {
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
router.put('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return validationError(res, 'Invalid id');
    }
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
            return res.status(404).json({ error: 'Rival not found' });
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
router.delete('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return validationError(res, 'Invalid id');
    }
    try {
        await prisma.rival.delete({ where: { id } });
        return deleted(res);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ error: 'Rival not found' });
        }
        throw error;
    }
}));
export default router;
