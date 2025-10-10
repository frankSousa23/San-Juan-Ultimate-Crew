import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
const router = Router();
// GET /api/messages?channelId=&limit=30&before=ts&since=ts
router.get('/', async (req, res) => {
    const channelId = Number(req.query.channelId);
    const limit = req.query.limit ? Number(req.query.limit) : 30;
    const before = req.query.before ? new Date(String(req.query.before)) : undefined;
    const since = req.query.since ? new Date(String(req.query.since)) : undefined;
    if (!Number.isInteger(channelId))
        return res.status(400).json({ error: 'Invalid channelId' });
    if (Number.isNaN(limit) || limit < 1 || limit > 100)
        return res.status(400).json({ error: 'Invalid limit' });
    try {
        const where = { channelId };
        if (before)
            where.createdAt = { lt: before };
        if (since)
            where.createdAt = { gt: since };
        const data = await prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to list messages' });
    }
});
const createMessageSchema = z.object({
    channelId: z.coerce.number().int().positive(),
    authorId: z.coerce.number().int().positive().optional(),
    content: z.string().min(1),
});
router.post('/', async (req, res) => {
    try {
        const payload = createMessageSchema.parse(req.body);
        const created = await prisma.message.create({ data: payload });
        res.status(201).json(created);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ error: 'Invalid payload', issues: e.issues });
        res.status(500).json({ error: 'Failed to create message' });
    }
});
export default router;
