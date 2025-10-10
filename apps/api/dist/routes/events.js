import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
const router = Router();
router.get('/', async (_req, res) => {
    try {
        const events = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } });
        res.json(events);
    }
    catch (err) {
        res.status(200).json(sampleEvents);
    }
});
const createEventSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['TRAINING', 'TOURNAMENT', 'SOCIAL', 'WORKSHOP']),
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional().default('UPCOMING'),
    location: z.string().optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
});
const updateEventSchema = createEventSchema.partial();
router.post('/', async (req, res) => {
    try {
        const payload = createEventSchema.parse(req.body);
        const created = await prisma.event.create({ data: { ...payload, startsAt: new Date(payload.startsAt), endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined } });
        res.status(201).json(created);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ error: 'Invalid payload', issues: e.issues });
        res.status(500).json({ error: 'Failed to create event' });
    }
});
router.put('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
        return res.status(400).json({ error: 'Invalid id' });
    try {
        const payload = updateEventSchema.parse(req.body);
        const updated = await prisma.event.update({
            where: { id },
            data: {
                ...payload,
                startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
                endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined,
            },
        });
        res.json(updated);
    }
    catch (e) {
        if (e?.code === 'P2025')
            return res.status(404).json({ error: 'Event not found' });
        if (e?.issues)
            return res.status(400).json({ error: 'Invalid payload', issues: e.issues });
        res.status(500).json({ error: 'Failed to update event' });
    }
});
router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
        return res.status(400).json({ error: 'Invalid id' });
    try {
        await prisma.event.delete({ where: { id } });
        res.status(204).send();
    }
    catch (e) {
        if (e?.code === 'P2025')
            return res.status(404).json({ error: 'Event not found' });
        res.status(500).json({ error: 'Failed to delete event' });
    }
});
const sampleEvents = [
    { id: 1, title: 'Entrenamiento', type: 'TRAINING', status: 'UPCOMING', startsAt: new Date().toISOString() },
    { id: 2, title: 'Torneo Regional', type: 'TOURNAMENT', status: 'UPCOMING', startsAt: new Date().toISOString() }
];
export default router;
