import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requirePermission } from './auth.js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { success, updated, deleted, validationError, notFound } from '../lib/response.js';
const router = Router();
const getQuerySchema = z.object({
    eventId: z.coerce.number().int().positive(),
});
/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get attendance records for an event
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of attendance records with player information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Invalid eventId
 */
router.get('/', asyncHandler(async (req, res) => {
    const parsed = getQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return validationError(res, 'Invalid query parameters', parsed.error.errors);
    }
    const { eventId } = parsed.data;
    const records = await prisma.attendance.findMany({
        where: { eventId },
        include: { player: true },
        orderBy: { playerId: 'asc' }
    });
    return success(res, records);
}));
const upsertSchema = z.object({
    eventId: z.coerce.number().int().positive(),
    playerId: z.coerce.number().int().positive(),
    status: z.enum(['present', 'absent', 'late']),
    note: z.string().optional().nullable(),
});
/**
 * @swagger
 * /api/attendance:
 *   put:
 *     summary: Create or update attendance record
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - playerId
 *               - status
 *             properties:
 *               eventId:
 *                 type: integer
 *               playerId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [present, absent, late]
 *               note:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Attendance record created or updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Invalid input
 */
router.put('/', requirePermission('events:manage'), asyncHandler(async (req, res) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success)
        return validationError(res, 'Invalid input', parsed.error.errors);
    const { eventId, playerId, status, note } = parsed.data;
    const record = await prisma.attendance.upsert({
        where: { playerId_eventId: { playerId, eventId } },
        create: { eventId, playerId, status, note: note ?? undefined },
        update: { status, note: note ?? undefined },
        include: { player: true },
    });
    return updated(res, record);
}));
/**
 * @swagger
 * /api/attendance:
 *   delete:
 *     summary: Delete an attendance record
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *       - in: query
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *     responses:
 *       204:
 *         description: Attendance record deleted successfully
 *       400:
 *         description: Invalid eventId or playerId
 *       404:
 *         description: Attendance record not found
 */
const deleteQuerySchema = z.object({
    eventId: z.coerce.number().int().positive(),
    playerId: z.coerce.number().int().positive(),
});
router.delete('/', requirePermission('events:manage'), asyncHandler(async (req, res) => {
    const parsed = deleteQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return validationError(res, 'Invalid query parameters', parsed.error.errors);
    }
    const { eventId, playerId } = parsed.data;
    try {
        await prisma.attendance.delete({ where: { playerId_eventId: { eventId, playerId } } });
        return deleted(res);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return notFound(res, 'Attendance record not found');
        }
        throw error;
    }
}));
export default router;
