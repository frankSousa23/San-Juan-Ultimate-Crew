import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole } from './auth.js';
import { requireSelfOrAdminForPlayer } from './auth.js';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const players = await prisma.player.findMany({ orderBy: { number: 'asc' } });
    if (players.length === 0) return res.json(samplePlayers);
    res.json(players);
  } catch (err) {
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
router.post('/', requireRole(['admin']), validateBody(createPlayerSchema), asyncHandler(async (req: Request, res: Response) => {
  const created = await prisma.player.create({ data: req.body });
  res.status(201).json(created);
}));

// Update
// Admin or the player themself can update
const playerIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

router.put('/:id', requireSelfOrAdminForPlayer(), validateParams(playerIdSchema), validateBody(updatePlayerSchema), asyncHandler(async (req: Request, res: Response) => {
  const updated = await prisma.player.update({ where: { id: Number(req.params.id) }, data: req.body });
  res.json(updated);
}));

// Delete
// Only admin can delete players
router.delete('/:id', requireRole(['admin']), validateParams(playerIdSchema), asyncHandler(async (req: Request, res: Response) => {
  await prisma.player.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}));

const samplePlayers = [
  { id: 1, name: 'Juan Martínez', number: 7, position: 'HANDLER', status: 'ACTIVE' },
  { id: 2, name: 'María González', number: 12, position: 'CUTTER', status: 'ACTIVE' },
  { id: 3, name: 'Carlos Rivera', number: 23, position: 'HYBRID', status: 'ACTIVE' }
];

export default router;
