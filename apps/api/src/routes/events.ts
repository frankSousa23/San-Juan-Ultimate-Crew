import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requirePermission } from './auth.js';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createAuditHelper } from '../lib/audit.js';
import { success, created, updated, deleted, notFound } from '../lib/response.js';
import { isGuestRequest, GUEST_EVENTS } from '../lib/guestDemoData.js';

const router = Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  if (isGuestRequest(req)) {
    if (page && !isNaN(page)) {
      const skip = (page - 1) * limit;
      const paginated = GUEST_EVENTS.slice(skip, skip + limit);
      return success(res, { data: paginated, total: GUEST_EVENTS.length, page, totalPages: Math.ceil(GUEST_EVENTS.length / limit) });
    }
    return success(res, GUEST_EVENTS);
  }

  const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin') || u?.roles?.includes('directiva');
  const userTeamId = u?.teamId;
  const playerId = u?.playerId;

  const whereClause: any = {};
  if (!isAdmin) {
    whereClause.OR = [
      { teamId: userTeamId || -1 },
      { awayTeamId: userTeamId || -1 },
      { teamId: null }
    ];
    if (playerId) {
      whereClause.OR.push({ participants: { some: { playerId } } });
    }
  }

  const includeConfig = {
    children: true,
    team: { select: { id: true, name: true, color: true, logoUrl: true } },
    awayTeam: { select: { id: true, name: true, color: true, logoUrl: true } },
    officialAnnotator: { select: { id: true, name: true, email: true } },
  };

  if (page && !isNaN(page)) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      prisma.event.findMany({ where: whereClause, orderBy: { startsAt: 'desc' }, skip, take: limit, include: includeConfig }),
      prisma.event.count({ where: whereClause })
    ]);
    return success(res, { data: events, total, page, totalPages: Math.ceil(total / limit) });
  }

  const events = await prisma.event.findMany({ where: whereClause, orderBy: { startsAt: 'desc' }, include: includeConfig });
  return success(res, events);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isGuestRequest(req)) {
    const ev = GUEST_EVENTS.find(e => e.id === id);
    if (!ev) return notFound(res, 'Event not found');
    return success(res, ev);
  }
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      children: true,
      team: { select: { id: true, name: true, color: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, color: true, logoUrl: true } },
      officialAnnotator: { select: { id: true, name: true, email: true } },
    }
  });
  if (!event) return notFound(res, 'Event not found');
  return success(res, event);
}));

const flexibleDateSchema = z.union([z.string(), z.date()]).refine(val => !isNaN(new Date(val).getTime()), {
  message: 'Formato de fecha u hora no válido'
}).transform(val => typeof val === 'string' ? new Date(val).toISOString() : val.toISOString());

const flexibleOptionalDateSchema = z.union([z.string(), z.date()]).optional().nullable().refine(val => !val || !isNaN(new Date(val).getTime()), {
  message: 'Formato de fecha u hora de fin no válido'
}).transform(val => val ? (typeof val === 'string' ? new Date(val).toISOString() : val.toISOString()) : null);

const createEventSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional().nullable(),
  type: z.enum(['TRAINING', 'TOURNAMENT', 'SOCIAL', 'WORKSHOP', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'AMISTOSO', 'MATCH']),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional().default('UPCOMING'),
  location: z.string().optional().nullable(),
  startsAt: flexibleDateSchema,
  endsAt: flexibleOptionalDateSchema,
  parentId: z.union([z.number(), z.string()]).optional().nullable().transform(v => v ? Number(v) : null),
  windSpeed: z.number().optional().nullable(),
  windDirection: z.string().optional().nullable(),
  teamId: z.union([z.number(), z.string()]).optional().nullable().transform(v => v ? Number(v) : null),
  awayTeamId: z.union([z.number(), z.string()]).optional().nullable().transform(v => v ? Number(v) : null),
  officialAnnotatorId: z.union([z.number(), z.string()]).optional().nullable().transform(v => v ? Number(v) : null),
  isAnnotatorLocked: z.boolean().optional(),
  matchCategory: z.enum(['GROUP_STAGE', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINALS', 'PLACEMENT']).optional().nullable(),
  rivalId: z.union([z.number(), z.string()]).optional().nullable().transform(v => v ? Number(v) : null),
  isInternalScrimmage: z.boolean().optional(),
});

const updateEventSchema = createEventSchema.partial();

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - startsAt
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', requirePermission('events:manage'), validateBody(createEventSchema), asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;

  if (isGuestRequest(req)) {
    const newGuestEvent: any = {
      id: Date.now(),
      title: payload.title,
      description: payload.description || '',
      type: payload.type,
      status: payload.status || 'UPCOMING',
      location: payload.location || 'Cancha Principal',
      startsAt: payload.startsAt,
      endsAt: payload.endsAt || null,
      teamId: payload.teamId || 1,
      team: { id: payload.teamId || 1, name: 'Warao Ultimate Club', color: '#f59e0b', logoUrl: null },
      awayTeamId: payload.awayTeamId || null,
      awayTeam: payload.awayTeamId ? { id: payload.awayTeamId, name: 'Equipo Rival', color: '#b91c1c', logoUrl: null } : null,
      rivalId: payload.rivalId || null,
      matchCategory: payload.matchCategory || null,
      isInternalScrimmage: Boolean(payload.isInternalScrimmage),
      officialAnnotatorId: payload.officialAnnotatorId || null,
      officialAnnotator: payload.officialAnnotatorId ? { id: payload.officialAnnotatorId, name: 'Franco Rivas (Mesa)', email: 'franco@sigedivo.com' } : null,
      isAnnotatorLocked: Boolean(payload.isAnnotatorLocked),
      parentId: payload.parentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [],
      participants: [],
      attendances: [],
      annotations: [],
    };
    GUEST_EVENTS.unshift(newGuestEvent);
    return created(res, newGuestEvent);
  }

  const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin') || u?.roles?.includes('directiva');
  const userTeamId = u?.teamId || (req as any).userTeamId;
  
  const assignedTeamId = payload.teamId !== undefined && payload.teamId !== null
    ? (payload.teamId ? Number(payload.teamId) : null)
    : (!isAdmin && userTeamId ? Number(userTeamId) : null);

  const event = await prisma.event.create({ 
    data: { 
      ...payload, 
      teamId: assignedTeamId,
      awayTeamId: payload.awayTeamId ? Number(payload.awayTeamId) : null,
      parentId: payload.parentId ? Number(payload.parentId) : null,
      rivalId: payload.rivalId ? Number(payload.rivalId) : null,
      officialAnnotatorId: payload.officialAnnotatorId ? Number(payload.officialAnnotatorId) : null,
      startsAt: new Date(payload.startsAt), 
      endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined 
    },
    include: {
      team: { select: { id: true, name: true, color: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, color: true, logoUrl: true } },
      officialAnnotator: { select: { id: true, name: true, email: true } },
      children: true,
    }
  });

  const audit = createAuditHelper(req);
  await audit.log('CREATE', 'Event', event.id, {
    type: event.type,
    title: event.title,
    teamId: event.teamId,
  });

  return created(res, event);
}));

const batchFixtureItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(['MATCH', 'AMISTOSO', 'TRAINING', 'TOURNAMENT', 'SOCIAL', 'WORKSHOP', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO']).optional().default('MATCH'),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional().default('UPCOMING'),
  location: z.string().optional().nullable(),
  startsAt: flexibleDateSchema,
  endsAt: flexibleOptionalDateSchema,
  teamId: z.union([z.number(), z.string()]).optional().nullable().transform(v => v ? Number(v) : null),
  awayTeamId: z.union([z.number(), z.string()]).optional().nullable().transform(v => v ? Number(v) : null),
  rivalId: z.union([z.number(), z.string()]).optional().nullable().transform(v => v ? Number(v) : null),
  matchCategory: z.enum(['GROUP_STAGE', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINALS', 'PLACEMENT']).optional().nullable(),
  officialAnnotatorId: z.union([z.number(), z.string()]).optional().nullable().transform(v => v ? Number(v) : null),
  isAnnotatorLocked: z.boolean().optional(),
  isInternalScrimmage: z.boolean().optional(),
});

const batchFixturesSchema = z.object({
  fixtures: z.array(batchFixtureItemSchema).min(1, 'At least one fixture is required')
});

/**
 * @swagger
 * /api/events/tournament/{id}/fixtures:
 *   post:
 *     summary: Batch create match fixtures for a tournament
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.post('/tournament/:id/fixtures', requirePermission('events:manage'), asyncHandler(async (req: Request, res: Response) => {
  const tournamentId = Number(req.params.id);

  if (isGuestRequest(req)) {
    const tournament = GUEST_EVENTS.find(e => e.id === tournamentId);
    if (!tournament) return notFound(res, 'Tournament not found');

    const parsed = batchFixturesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos de cruces inválidos', details: parsed.error.issues });
    }

    const { fixtures } = parsed.data;
    const createdMatches = fixtures.map((f, idx) => {
      const match = {
        id: Date.now() + idx + 1,
        title: f.title,
        description: f.description || `Partido correspondiente a ${tournament.title}`,
        type: 'MATCH',
        status: f.status || 'UPCOMING',
        location: f.location || tournament.location || 'Cancha Principal',
        startsAt: f.startsAt,
        endsAt: f.endsAt || new Date(new Date(f.startsAt).getTime() + 75 * 60 * 1000).toISOString(),
        parentId: tournamentId,
        teamId: f.teamId || 1,
        team: { id: f.teamId || 1, name: 'Warao Ultimate Club', color: '#f59e0b', logoUrl: null },
        awayTeamId: f.awayTeamId || null,
        awayTeam: f.awayTeamId ? { id: f.awayTeamId, name: 'Equipo Rival', color: '#b91c1c', logoUrl: null } : null,
        rivalId: f.rivalId || null,
        matchCategory: f.matchCategory || 'GROUP_STAGE',
        officialAnnotatorId: f.officialAnnotatorId || tournament.officialAnnotatorId || null,
        isAnnotatorLocked: f.isAnnotatorLocked !== undefined ? f.isAnnotatorLocked : Boolean(tournament.isAnnotatorLocked),
        isInternalScrimmage: Boolean(f.isInternalScrimmage),
        children: []
      };
      if (!tournament.children) tournament.children = [];
      tournament.children.push(match);
      GUEST_EVENTS.push(match);
      return match;
    });

    return created(res, {
      message: `${createdMatches.length} partidos y cruces programados con éxito para ${tournament.title}`,
      matches: createdMatches
    });
  }

  const tournament = await prisma.event.findUnique({ where: { id: tournamentId } });
  if (!tournament) return notFound(res, 'Tournament not found');

  const parsed = batchFixturesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos de cruces inválidos', details: parsed.error.issues });
  }

  const { fixtures } = parsed.data;

  const createdMatches = await prisma.$transaction(
    fixtures.map(f => prisma.event.create({
      data: {
        title: f.title,
        description: f.description || `Partido correspondiente a ${tournament.title}`,
        type: 'MATCH',
        status: f.status || 'UPCOMING',
        location: f.location || tournament.location || 'Cancha Principal',
        startsAt: new Date(f.startsAt),
        endsAt: f.endsAt ? new Date(f.endsAt) : new Date(new Date(f.startsAt).getTime() + 75 * 60 * 1000),
        parentId: tournamentId,
        teamId: f.teamId ? Number(f.teamId) : null,
        awayTeamId: f.awayTeamId ? Number(f.awayTeamId) : null,
        rivalId: f.rivalId ? Number(f.rivalId) : null,
        matchCategory: f.matchCategory || 'GROUP_STAGE',
        officialAnnotatorId: f.officialAnnotatorId || tournament.officialAnnotatorId || null,
        isAnnotatorLocked: f.isAnnotatorLocked !== undefined ? f.isAnnotatorLocked : Boolean(tournament.isAnnotatorLocked),
        isInternalScrimmage: Boolean(f.isInternalScrimmage),
      },
      include: {
        team: { select: { id: true, name: true, color: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, color: true, logoUrl: true } },
        officialAnnotator: { select: { id: true, name: true, email: true } },
      }
    }))
  );

  const audit = createAuditHelper(req);
  await audit.log('CREATE', 'Event', tournamentId, {
    action: 'BATCH_CREATE_FIXTURES',
    tournamentTitle: tournament.title,
    matchesCount: createdMatches.length,
  });

  return created(res, {
    message: `${createdMatches.length} partidos y cruces programados con éxito para ${tournament.title}`,
    matches: createdMatches
  });
}));

const eventIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

router.put('/:id', requirePermission('events:manage'), validateParams(eventIdSchema), validateBody(updateEventSchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const payload = req.body;

  if (isGuestRequest(req)) {
    const idx = GUEST_EVENTS.findIndex(e => e.id === id);
    if (idx === -1) return notFound(res, 'Event not found');
    GUEST_EVENTS[idx] = {
      ...GUEST_EVENTS[idx],
      ...payload,
      startsAt: payload.startsAt || GUEST_EVENTS[idx].startsAt,
      endsAt: payload.endsAt !== undefined ? payload.endsAt : GUEST_EVENTS[idx].endsAt,
      updatedAt: new Date()
    };
    return updated(res, GUEST_EVENTS[idx]);
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...payload,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
      endsAt: payload.endsAt !== undefined ? (payload.endsAt ? new Date(payload.endsAt) : null) : undefined,
      teamId: payload.teamId !== undefined ? (payload.teamId ? Number(payload.teamId) : null) : undefined,
      awayTeamId: payload.awayTeamId !== undefined ? (payload.awayTeamId ? Number(payload.awayTeamId) : null) : undefined,
      rivalId: payload.rivalId !== undefined ? (payload.rivalId ? Number(payload.rivalId) : null) : undefined,
      officialAnnotatorId: payload.officialAnnotatorId !== undefined ? (payload.officialAnnotatorId ? Number(payload.officialAnnotatorId) : null) : undefined,
      parentId: payload.parentId !== undefined ? (payload.parentId ? Number(payload.parentId) : null) : undefined,
    },
    include: {
      team: { select: { id: true, name: true, color: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, color: true, logoUrl: true } },
      officialAnnotator: { select: { id: true, name: true, email: true } },
      children: true,
    }
  });

  const audit = createAuditHelper(req);
  await audit.log('UPDATE', 'Event', id, {
    changes: Object.keys(payload),
  });

  return updated(res, event);
}));

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 */
router.post('/:id/toggle-annotator-lock', requirePermission('events:manage'), validateParams(eventIdSchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return notFound(res, 'Event not found');

  const { officialAnnotatorId, isAnnotatorLocked } = req.body || {};
  const newLocked = isAnnotatorLocked !== undefined ? Boolean(isAnnotatorLocked) : !existing.isAnnotatorLocked;
  
  const event = await prisma.event.update({
    where: { id },
    data: {
      isAnnotatorLocked: newLocked,
      officialAnnotatorId: officialAnnotatorId !== undefined ? (officialAnnotatorId ? Number(officialAnnotatorId) : null) : existing.officialAnnotatorId,
    },
    include: {
      team: { select: { id: true, name: true, color: true } },
      awayTeam: { select: { id: true, name: true, color: true } },
      officialAnnotator: { select: { id: true, name: true, email: true } },
    }
  });

  const audit = createAuditHelper(req);
  await audit.log('UPDATE', 'Event', id, {
    action: 'TOGGLE_ANNOTATOR_LOCK',
    isAnnotatorLocked: event.isAnnotatorLocked,
    officialAnnotatorId: event.officialAnnotatorId,
  });

  return updated(res, event);
}));

/**
 * GET /api/events/:id/mesa-tecnica
 * Retrieve the event's designated Mesa Técnica staff, active shift, and audit overview
 */
router.get('/:id/mesa-tecnica', validateParams(eventIdSchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isGuestRequest(req)) {
    const event = GUEST_EVENTS.find(e => e.id === id);
    if (!event) return notFound(res, 'Event not found');
    return success(res, {
      eventId: id,
      eventTitle: event.title,
      eventStatus: event.status,
      eventType: event.type,
      isAnnotatorLocked: true,
      officialAnnotator: { id: 1, name: 'Franco Rivas (Mesa)', email: 'franco@sigedivo.com' },
      members: [
        { id: 1, playerId: 1, playerName: 'Franco Rivas', playerNumber: 1, role: 'DIRECTOR_MESA', roleLabel: 'Director de Mesa', isCurrentShift: true, isPlayer: true },
        { id: 2, playerId: 2, playerName: 'Valeria Mendoza', playerNumber: 2, role: 'PLANILLERO_ANOTADOR', roleLabel: 'Planillero Oficial', isCurrentShift: false, isPlayer: true },
        { id: 3, playerId: 10, playerName: 'Valentina Rojas', playerNumber: 10, role: 'VEEDOR_ESPIRITU', roleLabel: 'Veedor SOTG', isCurrentShift: false, isPlayer: true },
      ],
      annotatorsAudit: [
        { id: 1, name: 'Franco Rivas', email: 'franco@sigedivo.com', annotationsCount: 15 },
        { id: 2, name: 'Valeria Mendoza', email: 'valeria@sigedivo.com', annotationsCount: 8 },
      ]
    });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      officialAnnotator: { select: { id: true, name: true, email: true } },
      participants: {
        where: {
          OR: [
            { role: { startsWith: 'MESA' } },
            { role: { in: ['DIRECTOR_MESA', 'PLANILLERO_ANOTADOR', 'CRONOMETRISTA', 'VEEDOR_ESPIRITU', 'DELEGADO_CAMPO', 'STAFF_MESA'] } }
          ]
        },
        include: {
          player: { select: { id: true, name: true, number: true, position: true } }
        }
      }
    }
  });

  if (!event) return notFound(res, 'Event not found');

  // Find users who have created annotations in this event for the audit record
  const annotationsWithUsers = await prisma.eventAnnotation.findMany({
    where: { eventId: id, createdBy: { not: null } },
    select: {
      createdBy: true,
      createdByUser: { select: { id: true, name: true, email: true } }
    }
  });

  const annotatorsMap = new Map<number, { id: number; name: string; email: string; annotationsCount: number }>();
  for (const ann of annotationsWithUsers) {
    if (ann.createdByUser) {
      const existing = annotatorsMap.get(ann.createdByUser.id);
      if (existing) {
        existing.annotationsCount += 1;
      } else {
        annotatorsMap.set(ann.createdByUser.id, {
          id: ann.createdByUser.id,
          name: ann.createdByUser.name || ann.createdByUser.email,
          email: ann.createdByUser.email,
          annotationsCount: 1
        });
      }
    }
  }

  const roleLabelMap: Record<string, string> = {
    DIRECTOR_MESA: 'Director de Mesa',
    PLANILLERO_ANOTADOR: 'Planillero / Anotador',
    CRONOMETRISTA: 'Cronometrista de Campo',
    VEEDOR_ESPIRITU: 'Veedor de Espíritu (SOTG)',
    DELEGADO_CAMPO: 'Delegado de Campo',
    STAFF_MESA: 'Mesa Técnica',
  };

  const members = event.participants.map(p => ({
    id: p.playerId,
    playerId: p.playerId,
    playerName: p.player?.name || 'Miembro Mesa',
    playerNumber: p.player?.number || 0,
    role: p.role || 'STAFF_MESA',
    roleLabel: roleLabelMap[p.role || ''] || p.role || 'Mesa Técnica',
    isCurrentShift: Boolean(event.officialAnnotatorId && event.officialAnnotator?.name === p.player?.name),
    isPlayer: true,
  }));

  return success(res, {
    eventId: event.id,
    eventTitle: event.title,
    eventStatus: event.status,
    eventType: event.type,
    isAnnotatorLocked: event.isAnnotatorLocked,
    officialAnnotatorId: event.officialAnnotatorId,
    officialAnnotator: event.officialAnnotator,
    members,
    annotatorsAudit: Array.from(annotatorsMap.values())
  });
}));

/**
 * POST /api/events/:id/mesa-tecnica
 * Assign or update Mesa Técnica responsible members for this specific event
 */
const mesaMemberSchema = z.object({
  playerId: z.number().int().positive().optional().nullable(),
  userId: z.number().int().positive().optional().nullable(),
  name: z.string().optional(),
  role: z.enum(['DIRECTOR_MESA', 'PLANILLERO_ANOTADOR', 'CRONOMETRISTA', 'VEEDOR_ESPIRITU', 'DELEGADO_CAMPO', 'STAFF_MESA']).default('STAFF_MESA'),
  isCurrentShift: z.boolean().optional(),
});

const updateMesaSchema = z.object({
  isAnnotatorLocked: z.boolean().optional(),
  officialAnnotatorId: z.number().int().positive().optional().nullable(),
  members: z.array(mesaMemberSchema).optional(),
});

router.post('/:id/mesa-tecnica', requirePermission('events:manage'), validateParams(eventIdSchema), validateBody(updateMesaSchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return notFound(res, 'Event not found');

  const { isAnnotatorLocked, officialAnnotatorId, members } = req.body;

  // 1. Update event lock & primary official annotator
  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      isAnnotatorLocked: isAnnotatorLocked !== undefined ? Boolean(isAnnotatorLocked) : event.isAnnotatorLocked,
      officialAnnotatorId: officialAnnotatorId !== undefined ? (officialAnnotatorId ? Number(officialAnnotatorId) : null) : event.officialAnnotatorId,
    },
    include: {
      officialAnnotator: { select: { id: true, name: true, email: true } },
    }
  });

  // 2. If members provided, synchronize EventParticipant with mesa roles
  if (Array.isArray(members)) {
    // Delete existing mesa role participants to replace with new assignment
    await prisma.eventParticipant.deleteMany({
      where: {
        eventId: id,
        OR: [
          { role: { startsWith: 'MESA' } },
          { role: { in: ['DIRECTOR_MESA', 'PLANILLERO_ANOTADOR', 'CRONOMETRISTA', 'VEEDOR_ESPIRITU', 'DELEGADO_CAMPO', 'STAFF_MESA'] } }
        ]
      }
    });

    for (const member of members) {
      if (member.playerId) {
        await prisma.eventParticipant.upsert({
          where: { eventId_playerId: { eventId: id, playerId: member.playerId } },
          create: {
            eventId: id,
            playerId: member.playerId,
            role: member.role,
            status: 'confirmed'
          },
          update: {
            role: member.role,
            status: 'confirmed'
          }
        });
      }
    }
  }

  const audit = createAuditHelper(req);
  await audit.log('UPDATE', 'Event', id, {
    action: 'UPDATE_MESA_TECNICA',
    isAnnotatorLocked: updatedEvent.isAnnotatorLocked,
    officialAnnotatorId: updatedEvent.officialAnnotatorId,
    membersCount: members ? members.length : undefined
  });

  return success(res, {
    message: 'Mesa técnica asignada y configurada exitosamente para este evento.',
    event: updatedEvent
  });
}));

/**
 * POST /api/events/:id/mesa-tecnica/shift-change
 * Fast handover for players in mesa técnica who are going to enter the match to play
 */
const shiftChangeSchema = z.object({
  nextOfficialAnnotatorId: z.number().int().positive().optional().nullable(),
  reason: z.string().optional(),
});

router.post('/:id/mesa-tecnica/shift-change', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const u = (req as any).user;
  const isAdminOrDirectiva = u?.roles?.includes('admin') || u?.roles?.includes('directiva');
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      officialAnnotator: { select: { id: true, name: true, email: true } }
    }
  });

  if (!event) return notFound(res, 'Event not found');

  const { nextOfficialAnnotatorId, reason } = req.body;
  const isCurrentOfficial = event.officialAnnotatorId === Number(u?.sub);

  if (!isAdminOrDirectiva && !isCurrentOfficial) {
    return res.status(403).json({ error: 'Solo el anotador oficial activo o la directiva pueden realizar el relevo de mesa técnica.' });
  }

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      officialAnnotatorId: nextOfficialAnnotatorId ? Number(nextOfficialAnnotatorId) : null,
    },
    include: {
      officialAnnotator: { select: { id: true, name: true, email: true } },
    }
  });

  const audit = createAuditHelper(req);
  await audit.log('UPDATE', 'Event', id, {
    action: 'MESA_SHIFT_HANDOVER',
    previousAnnotatorId: event.officialAnnotatorId,
    newAnnotatorId: updatedEvent.officialAnnotatorId,
    reason: reason || 'Relevo por ingreso a jugar partido',
    performedByUserId: Number(u?.sub)
  });

  return success(res, {
    message: 'Relevo de Mesa Técnica registrado correctamente.',
    event: updatedEvent
  });
}));

router.delete('/:id', requirePermission('events:manage'), validateParams(eventIdSchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return notFound(res, 'Event not found');
  await prisma.event.delete({ where: { id } });
  const audit = createAuditHelper(req);
  await audit.log('DELETE', 'Event', id, {
    title: existing.title,
    type: existing.type,
  });
  return deleted(res);
}));

export default router;
