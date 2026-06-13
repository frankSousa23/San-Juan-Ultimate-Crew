import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole, requirePermission } from './auth.js';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createAuditHelper } from '../lib/audit.js';
import { success, created, updated, deleted, notFound } from '../lib/response.js';

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

  if (page && !isNaN(page)) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      prisma.event.findMany({ orderBy: { startsAt: 'asc' }, skip, take: limit }),
      prisma.event.count()
    ]);
    return success(res, { data: events, total, page, totalPages: Math.ceil(total / limit) });
  }

  const events = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } });
  return success(res, events);
}));

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['TRAINING', 'TOURNAMENT', 'SOCIAL', 'WORKSHOP', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'AMISTOSO']),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional().default('UPCOMING'),
  location: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  parentId: z.number().optional().nullable(),
  windSpeed: z.number().optional().nullable(),
  windDirection: z.string().optional().nullable(),
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TRAINING, TOURNAMENT, SOCIAL, WORKSHOP, FULL_DAY_OPEN, FULL_DAY_MIXTO, AMISTOSO]
 *               status:
 *                 type: string
 *                 enum: [UPCOMING, ONGOING, COMPLETED, CANCELLED]
 *                 default: UPCOMING
 *               location:
 *                 type: string
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               endsAt:
 *                 type: string
 *                 format: date-time
 *               parentId:
 *                 type: integer
 *               windSpeed:
 *                 type: number
 *               windDirection:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input
 */
router.post('/', requirePermission('events:manage'), validateBody(createEventSchema), asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;
  const event = await prisma.event.create({ 
    data: { 
      ...payload, 
      startsAt: new Date(payload.startsAt), 
      endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined 
    } 
  });
  const audit = createAuditHelper(req);
  await audit.log('CREATE', 'Event', event.id, {
    type: event.type,
    title: event.title,
  });
  return created(res, event);
}));

const eventIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TRAINING, TOURNAMENT, SOCIAL, WORKSHOP, FULL_DAY_OPEN, FULL_DAY_MIXTO, AMISTOSO]
 *               status:
 *                 type: string
 *                 enum: [UPCOMING, ONGOING, COMPLETED, CANCELLED]
 *               location:
 *                 type: string
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               endsAt:
 *                 type: string
 *                 format: date-time
 *               parentId:
 *                 type: integer
 *               windSpeed:
 *                 type: number
 *               windDirection:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Event not found
 */
router.put('/:id', requirePermission('events:manage'), validateParams(eventIdSchema), validateBody(updateEventSchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const payload = req.body;
  const event = await prisma.event.update({
    where: { id },
    data: {
      ...payload,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
      endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined,
    },
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
