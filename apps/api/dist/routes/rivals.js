import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
const router = Router();
const createSchema = z.object({
    name: z.string().min(1),
    strengths: z.string().optional().nullable(),
    weaknesses: z.string().optional().nullable(),
    lastPlayedAt: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
});
const updateSchema = createSchema.partial();
router.get('/', async (_req, res) => {
    const items = await prisma.rival.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(items);
});
const listQuerySchema = z.object({
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});
router.get('/paged', async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { q, limit, offset } = parsed.data;
    const where = q ? { name: { contains: q, mode: 'insensitive' } } : {};
    const [total, items] = await Promise.all([
        prisma.rival.count({ where }),
        prisma.rival.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset })
    ]);
    res.json({ items, total, limit, offset });
});
router.post('/', async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const data = parsed.data;
    const created = await prisma.rival.create({ data: { ...data, lastPlayedAt: data.lastPlayedAt ?? undefined } });
    res.status(201).json(created);
});
router.put('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!id)
        return res.status(400).json({ error: 'id requerido' });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const data = parsed.data;
    const updated = await prisma.rival.update({ where: { id }, data: { ...data, lastPlayedAt: data.lastPlayedAt ?? undefined } });
    res.json(updated);
});
router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!id)
        return res.status(400).json({ error: 'id requerido' });
    await prisma.rival.delete({ where: { id } });
    res.status(204).end();
});
export default router;
