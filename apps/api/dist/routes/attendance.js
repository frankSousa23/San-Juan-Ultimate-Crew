import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
const router = Router();
// GET /api/attendance?eventId=1
router.get('/', async (req, res) => {
    const eventId = Number(req.query.eventId);
    if (!eventId || Number.isNaN(eventId))
        return res.status(400).json({ error: 'eventId requerido' });
    try {
        const records = await prisma.attendance.findMany({
            where: { eventId },
            include: { player: true },
            orderBy: { playerId: 'asc' }
        });
        res.json(records);
    }
    catch (e) {
        res.status(500).json({ error: e?.message || 'failed to list attendance' });
    }
});
// PUT /api/attendance  { eventId, playerId, status, note? }
const upsertSchema = z.object({
    eventId: z.coerce.number().int().positive(),
    playerId: z.coerce.number().int().positive(),
    status: z.enum(['present', 'absent', 'late']),
    note: z.string().optional().nullable(),
});
router.put('/', async (req, res) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { eventId, playerId, status, note } = parsed.data;
    try {
        const record = await prisma.attendance.upsert({
            where: { playerId_eventId: { playerId, eventId } },
            create: { eventId, playerId, status, note: note ?? undefined },
            update: { status, note: note ?? undefined },
            include: { player: true },
        });
        res.json(record);
    }
    catch (e) {
        res.status(500).json({ error: e?.message || 'failed to upsert attendance' });
    }
});
// DELETE /api/attendance?eventId=&playerId=
router.delete('/', async (req, res) => {
    const eventId = Number(req.query.eventId);
    const playerId = Number(req.query.playerId);
    if (!eventId || !playerId || Number.isNaN(eventId) || Number.isNaN(playerId)) {
        return res.status(400).json({ error: 'eventId y playerId requeridos' });
    }
    try {
        await prisma.attendance.delete({ where: { playerId_eventId: { eventId, playerId } } });
        res.status(204).end();
    }
    catch (e) {
        res.status(500).json({ error: e?.message || 'failed to delete attendance' });
    }
});
export default router;
