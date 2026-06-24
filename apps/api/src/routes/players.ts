import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole, requirePermission } from './auth.js';
import { requireSelfOrAdminForPlayer } from './auth.js';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createAuditHelper } from '../lib/audit.js';
import { success, created, updated, deleted, notFound } from '../lib/response.js';

const router = Router();

/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: Get all players
 *     tags: [Players]
 *     responses:
 *       200:
 *         description: List of players
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Player'
 */
router.get('/', requirePermission('roster:view'), asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  if (page && !isNaN(page)) {
    const skip = (page - 1) * limit;
    const [players, total] = await Promise.all([
      prisma.player.findMany({ orderBy: { number: 'asc' }, skip, take: limit }),
      prisma.player.count()
    ]);
    return success(res, { data: players, total, page, totalPages: Math.ceil(total / limit) });
  }

  const players = await prisma.player.findMany({ orderBy: { number: 'asc' } });
  return success(res, players);
}));

const createPlayerSchema = z.object({
  name: z.string().min(1),
  number: z.coerce.number().int().positive(),
  position: z.enum(['HANDLER', 'CUTTER', 'HYBRID']),
  status: z.enum(['ACTIVE', 'INJURED', 'INACTIVE']).optional().default('ACTIVE'),
  heightCm: z.coerce.number().int().positive().optional(),
  experience: z.string().optional(),
});

const updatePlayerSchema = createPlayerSchema.partial();

/**
 * @swagger
 * /api/players:
 *   post:
 *     summary: Create a new player
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - number
 *               - position
 *             properties:
 *               name:
 *                 type: string
 *               number:
 *                 type: integer
 *                 minimum: 1
 *               position:
 *                 type: string
 *                 enum: [HANDLER, CUTTER, HYBRID]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INJURED, INACTIVE]
 *                 default: ACTIVE
 *               heightCm:
 *                 type: integer
 *               experience:
 *                 type: string
 *     responses:
 *       201:
 *         description: Player created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post('/', requirePermission('roster:manage'), validateBody(createPlayerSchema), asyncHandler(async (req: Request, res: Response) => {
  const player = await prisma.player.create({ data: req.body });
  const audit = createAuditHelper(req);
  await audit.log('CREATE', 'Player', player.id, {
    name: player.name,
    number: player.number,
    position: player.position,
  });
  return created(res, player);
}));

const playerIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

/**
 * @swagger
 * /api/players/{id}:
 *   put:
 *     summary: Update a player
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               number:
 *                 type: integer
 *               position:
 *                 type: string
 *                 enum: [HANDLER, CUTTER, HYBRID]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INJURED, INACTIVE]
 *               heightCm:
 *                 type: integer
 *               experience:
 *                 type: string
 *     responses:
 *       200:
 *         description: Player updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Player not found
 */
router.put('/:id', requireSelfOrAdminForPlayer(), validateParams(playerIdSchema), validateBody(updatePlayerSchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const player = await prisma.player.update({ where: { id }, data: req.body });
  const audit = createAuditHelper(req);
  await audit.log('UPDATE', 'Player', id, {
    changes: Object.keys(req.body),
  });
  return updated(res, player);
}));

/**
 * @swagger
 * /api/players/{id}:
 *   delete:
 *     summary: Delete a player
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Player deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Player not found
 */
router.delete('/:id', requirePermission('roster:manage'), validateParams(playerIdSchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.player.findUnique({ where: { id } });
  if (!existing) return notFound(res, 'Player not found');
  await prisma.player.delete({ where: { id } });
  const audit = createAuditHelper(req);
  await audit.log('DELETE', 'Player', id, {
    name: existing.name,
    number: existing.number,
  });
  return deleted(res);
}));

/**
 * @swagger
 * /api/players/{id}/stats:
 *   get:
 *     summary: Get player stats
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Player match statistics including efficiency (+/-)
 *       404:
 *         description: Player not found
 */
router.get('/:id/stats', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const stats = await prisma.playerMatchStats.aggregate({
    where: { playerId: id },
    _sum: {
      goals: true,
      assists: true,
      defenses: true,
      turnovers: true,
      drops: true,
      pointsPlayed: true,
    }
  });
  
  const sum = stats._sum;
  const plusMinus = ((sum.goals || 0) + (sum.assists || 0) + (sum.defenses || 0)) - ((sum.turnovers || 0) + (sum.drops || 0));

  return success(res, { ...sum, plusMinus });
}));

export default router;
