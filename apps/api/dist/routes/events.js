import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
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
router.post('/', validateBody(createEventSchema), asyncHandler(async (req, res) => {
    const payload = req.body;
    const created = await prisma.event.create({
        data: {
            ...payload,
            startsAt: new Date(payload.startsAt),
            endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined
        }
    });
    res.status(201).json(created);
}));
const eventIdSchema = z.object({
    id: z.coerce.number().int().positive()
});
router.put('/:id', validateParams(eventIdSchema), validateBody(updateEventSchema), asyncHandler(async (req, res) => {
    const payload = req.body;
    const updated = await prisma.event.update({
        where: { id: Number(req.params.id) },
        data: {
            ...payload,
            startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
            endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined,
        },
    });
    res.json(updated);
}));
router.delete('/:id', validateParams(eventIdSchema), asyncHandler(async (req, res) => {
    await prisma.event.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
}));
const sampleEvents = [
    { id: 1, title: 'Entrenamiento', type: 'TRAINING', status: 'UPCOMING', startsAt: new Date().toISOString() },
    { id: 2, title: 'Torneo Regional', type: 'TOURNAMENT', status: 'UPCOMING', startsAt: new Date().toISOString() }
];
export default router;
