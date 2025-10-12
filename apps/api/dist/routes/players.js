import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole } from './auth.js';
import { requireSelfOrAdminForPlayer } from './auth.js';
import { z } from 'zod';
const router = Router();
router.get('/', async (_req, res) => {
    try {
        const players = await prisma.player.findMany({ orderBy: { number: 'asc' } });
        if (players.length === 0)
            return res.json(samplePlayers);
        res.json(players);
    }
    catch (err) {
        res.status(200).json(samplePlayers);
    }
});
// Schemas
const createPlayerSchema = z.object({
    name: z.string().min(1),
    number: z.coerce.number().int().positive(),
    position: z.enum(['HANDLER', 'CUTTER', 'HYBRID']),
    status: z.enum(['ACTIVE', 'INJURED', 'INACTIVE']).optional().default('ACTIVE'),
    heightCm: z.coerce.number().int().positive().optional(),
    experience: z.string().optional(),
});
const updatePlayerSchema = createPlayerSchema.partial();
// Create
// Only admin can create players
router.post('/', requireRole(['admin']), async (req, res) => {
    try {
        const data = createPlayerSchema.parse(req.body);
        const created = await prisma.player.create({ data });
        res.status(201).json(created);
    }
    catch (e) {
        if (e?.code === 'P2002')
            return res.status(409).json({ error: 'Player number must be unique' });
        if (e?.issues)
            return res.status(400).json({ error: 'Invalid payload', issues: e.issues });
        res.status(500).json({ error: 'Failed to create player' });
    }
});
// Update
// Admin or the player themself can update
router.put('/:id', requireSelfOrAdminForPlayer(), async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
        return res.status(400).json({ error: 'Invalid id' });
    try {
        const data = updatePlayerSchema.parse(req.body);
        const updated = await prisma.player.update({ where: { id }, data });
        res.json(updated);
    }
    catch (e) {
        if (e?.code === 'P2025')
            return res.status(404).json({ error: 'Player not found' });
        if (e?.code === 'P2002')
            return res.status(409).json({ error: 'Player number must be unique' });
        if (e?.issues)
            return res.status(400).json({ error: 'Invalid payload', issues: e.issues });
        res.status(500).json({ error: 'Failed to update player' });
    }
});
// Delete
// Only admin can delete players
router.delete('/:id', requireRole(['admin']), async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
        return res.status(400).json({ error: 'Invalid id' });
    try {
        await prisma.player.delete({ where: { id } });
        res.status(204).send();
    }
    catch (e) {
        if (e?.code === 'P2025')
            return res.status(404).json({ error: 'Player not found' });
        res.status(500).json({ error: 'Failed to delete player' });
    }
});
const samplePlayers = [
    { id: 1, name: 'Juan Martínez', number: 7, position: 'HANDLER', status: 'ACTIVE' },
    { id: 2, name: 'María González', number: 12, position: 'CUTTER', status: 'ACTIVE' },
    { id: 3, name: 'Carlos Rivera', number: 23, position: 'HYBRID', status: 'ACTIVE' }
];
export default router;
