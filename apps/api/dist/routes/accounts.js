import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
const router = Router();
router.get('/', async (_req, res) => {
    try {
        const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } });
        res.json(accounts);
    }
    catch {
        res.status(500).json({ error: 'Failed to list accounts' });
    }
});
const createAccountSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['CASH', 'BANK', 'MOBILE'])
});
router.post('/', async (req, res) => {
    try {
        const payload = createAccountSchema.parse(req.body);
        const created = await prisma.account.create({ data: payload });
        res.status(201).json(created);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ error: 'Invalid payload', issues: e.issues });
        res.status(500).json({ error: 'Failed to create account' });
    }
});
router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
        return res.status(400).json({ error: 'Invalid id' });
    try {
        await prisma.account.delete({ where: { id } });
        res.status(204).send();
    }
    catch (e) {
        if (e?.code === 'P2025')
            return res.status(404).json({ error: 'Account not found' });
        res.status(500).json({ error: 'Failed to delete account' });
    }
});
export default router;
