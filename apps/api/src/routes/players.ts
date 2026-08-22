import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requirePermission } from './auth.js';
import { requireSelfOrAdminForPlayer } from './auth.js';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createAuditHelper } from '../lib/audit.js';
import { success, created, updated, deleted, notFound } from '../lib/response.js';
import { isGuestRequest, GUEST_PLAYERS, GUEST_MATCH_STATS } from '../lib/guestDemoData.js';

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
  if (isGuestRequest(req)) {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    if (page && !isNaN(page)) {
      const skip = (page - 1) * limit;
      const paginated = GUEST_PLAYERS.slice(skip, skip + limit);
      return success(res, { data: paginated, total: GUEST_PLAYERS.length, page, totalPages: Math.ceil(GUEST_PLAYERS.length / limit) });
    }
    return success(res, GUEST_PLAYERS);
  }

  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  const whereClause = !isAdmin && userTeamId ? { OR: [{ teamId: userTeamId }, { teamId: null }] } : {};

  if (page && !isNaN(page)) {
    const skip = (page - 1) * limit;
    const includeConfig = {
      team: { select: { id: true, name: true, color: true, logoUrl: true, categories: true } },
      user: {
        select: {
          id: true,
          email: true,
          roles: {
            include: {
              role: {
                include: {
                  roles: {
                    include: { permission: true }
                  }
                }
              }
            }
          }
        }
      }
    };
    const [players, total] = await Promise.all([
      prisma.player.findMany({ where: whereClause, orderBy: { number: 'asc' }, skip, take: limit, include: includeConfig }),
      prisma.player.count({ where: whereClause })
    ]);
    return success(res, { data: players, total, page, totalPages: Math.ceil(total / limit) });
  }

  const includeConfig = {
    team: { select: { id: true, name: true, color: true, logoUrl: true, categories: true } },
    user: {
      select: {
        id: true,
        email: true,
        roles: {
          include: {
            role: {
              include: {
                roles: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    }
  };
  const players = await prisma.player.findMany({ where: whereClause, orderBy: { number: 'asc' }, include: includeConfig });
  return success(res, players);
}));

const createPlayerSchema = z.object({
  name: z.string().min(1),
  number: z.coerce.number().int().positive(),
  position: z.enum(['HANDLER', 'CUTTER', 'HYBRID']),
  category: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INJURED', 'INACTIVE']).optional().default('ACTIVE'),
  heightCm: z.coerce.number().int().positive().optional(),
  experience: z.string().optional(),
  teamId: z.number().optional().nullable(),
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
  const data = { ...req.body };
  const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  if (!isAdmin && userTeamId) {
    data.teamId = userTeamId;
  }

  // Only check number uniqueness if assigned to a specific team (free agents can use any number)
  if (data.teamId && data.number) {
    const existing = await prisma.player.findFirst({
      where: {
        teamId: data.teamId,
        number: data.number
      }
    });
    if (existing) {
      return res.status(409).json({ error: `El dorsal #${data.number} ya está en uso en este equipo` });
    }
  }

  const player = await prisma.player.create({ data });
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
  const existingPlayer = await prisma.player.findUnique({ where: { id } });
  if (!existingPlayer) return notFound(res, 'Player');

  const targetTeamId = req.body.teamId !== undefined ? req.body.teamId : existingPlayer.teamId;
  const targetNumber = req.body.number !== undefined ? Number(req.body.number) : existingPlayer.number;

  // Only check number collision if assigned to a team (free agents are unrestricted)
  if (targetTeamId && targetNumber) {
    const clash = await prisma.player.findFirst({
      where: {
        id: { not: id },
        teamId: targetTeamId,
        number: targetNumber
      }
    });
    if (clash) {
      return res.status(409).json({ error: `El dorsal #${targetNumber} ya está en uso en este equipo` });
    }
  }

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

router.get('/:id', requirePermission('roster:view'), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isGuestRequest(req)) {
    const p = GUEST_PLAYERS.find(pl => pl.id === id);
    if (!p) return notFound(res, 'Player not found');
    return success(res, p);
  }
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) return notFound(res, 'Player not found');
  return success(res, player);
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
  if (isGuestRequest(req)) {
    const stat = GUEST_MATCH_STATS.find(s => s.playerId === id);
    if (stat) {
      const plusMinus = (stat.goals + stat.assists + stat.defenses) - (stat.turnovers + stat.drops);
      return success(res, {
        goals: stat.goals,
        assists: stat.assists,
        defenses: stat.defenses,
        turnovers: stat.turnovers,
        drops: stat.drops,
        pointsPlayed: stat.pointsPlayed,
        plusMinus,
      });
    }
    return success(res, { goals: 0, assists: 0, defenses: 0, turnovers: 0, drops: 0, pointsPlayed: 0, plusMinus: 0 });
  }

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

/**
 * @swagger
 * /api/players/{id}/merge-guest:
 *   post:
 *     summary: Fusionar las estadisticas de un invitado (RivalPlayer) con un jugador oficial
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: ID del jugador oficial
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rivalPlayerId
 *             properties:
 *               rivalPlayerId:
 *                 type: integer
 *                 description: ID del perfil temporal invitado (RivalPlayer)
 *     responses:
 *       200:
 *         description: Estadisticas fusionadas correctamente
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Se requiere permiso roster:manage
 */
const mergeGuestSchema = z.object({
  rivalPlayerId: z.coerce.number().int().positive()
});

router.post('/:id/merge-guest', requirePermission('roster:manage'), validateParams(playerIdSchema), validateBody(mergeGuestSchema), asyncHandler(async (req: Request, res: Response) => {
  const playerId = Number(req.params.id);
  const { rivalPlayerId } = req.body;
  
  // 1. Update Annotations
  await prisma.eventAnnotation.updateMany({
    where: { rivalPlayerId },
    data: { 
      rivalPlayerId: null, 
      playerId,
      isRefuerzo: true
    }
  });

  // 2. We can safely delete the RivalPlayer since it was just a temporary guest
  try {
    await prisma.rivalPlayer.delete({ where: { id: rivalPlayerId }});
  } catch (e) {
    // Ignore if not found or restricted
  }
  
  return success(res, { message: 'Jugador oficializado con éxito' });
}));
