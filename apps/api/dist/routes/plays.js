import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
const router = Router();
const createSchema = z.object({
    name: z.string().min(1),
    category: z.enum(['OFFENSE', 'DEFENSE', 'DRILL']),
    description: z.string().optional().nullable(),
    diagramUrl: z.string().url().optional().nullable(),
    content: z.string().optional().nullable(),
});
const updateSchema = createSchema.partial();
const listQuerySchema = z.object({
    q: z.string().optional(),
    category: z.enum(['OFFENSE', 'DEFENSE', 'DRILL']).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
router.get('/', asyncHandler(async (req, res) => {
    const category = req.query.category;
    const q = req.query.q?.trim();
    const where = {};
    if (category && ['OFFENSE', 'DEFENSE', 'DRILL'].includes(category)) {
        where.category = category;
    }
    if (q) {
        where.name = { contains: q, mode: 'insensitive' };
    }
    const items = await prisma.play.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });
    res.json(items);
}));
router.get('/paged', asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { q, category, limit, offset } = parsed.data;
    const where = {};
    if (category)
        where.category = category;
    if (q)
        where.name = { contains: q, mode: 'insensitive' };
    const [total, items] = await Promise.all([
        prisma.play.count({ where }),
        prisma.play.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset })
    ]);
    res.json({ items, total, limit, offset });
}));
router.post('/', asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const created = await prisma.play.create({ data: parsed.data });
    res.status(201).json(created);
}));
router.put('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ error: 'id requerido' });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    try {
        const updated = await prisma.play.update({ where: { id }, data: parsed.data });
        res.json(updated);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ error: 'Play not found' });
        }
        throw error;
    }
}));
router.delete('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ error: 'id requerido' });
    try {
        await prisma.play.delete({ where: { id } });
        res.status(204).end();
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ error: 'Play not found' });
        }
        throw error;
    }
}));
export default router;
