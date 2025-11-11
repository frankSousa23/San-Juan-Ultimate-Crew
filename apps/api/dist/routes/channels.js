import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
const router = Router();
// GET /api/channels?eventId=
router.get('/', asyncHandler(async (req, res) => {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    if (req.query.eventId && (!Number.isInteger(eventId) || eventId <= 0)) {
        return res.status(400).json({ error: 'Invalid eventId' });
    }
    const channels = await prisma.channel.findMany({
        where: eventId ? { eventId } : undefined,
        include: {
            _count: { select: { messages: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { id: 'desc' },
    });
    res.json(channels);
}));
// GET /api/channels/:id
router.get('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ error: 'Invalid id' });
    const ch = await prisma.channel.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!ch)
        return res.status(404).json({ error: 'Channel not found' });
    res.json(ch);
}));
// POST /api/channels
const createChannelSchema = z.object({
    name: z.string().min(1),
    eventId: z.coerce.number().int().positive().optional(),
});
router.post('/', asyncHandler(async (req, res) => {
    try {
        const payload = createChannelSchema.parse(req.body);
        const created = await prisma.channel.create({ data: payload });
        res.status(201).json(created);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return res.status(409).json({ error: 'Channel for event already exists' });
        }
        if (error && typeof error === 'object' && 'issues' in error) {
            return res.status(400).json({ error: 'Invalid payload', issues: error.issues });
        }
        throw error;
    }
}));
export default router;
