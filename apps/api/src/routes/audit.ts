import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireRole } from './auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { paginated, validationError } from '../lib/response.js'

const router = Router()

const listQuerySchema = z.object({
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'PERMISSION_CHANGE', 'FILE_UPLOAD', 'FILE_DELETE']).optional(),
  entityType: z.string().optional(),
  entityId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ROLE_CHANGE, PERMISSION_CHANGE, FILE_UPLOAD, FILE_DELETE]
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 200
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: List of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       action:
 *                         type: string
 *                       entityType:
 *                         type: string
 *                       entityId:
 *                         type: integer
 *                         nullable: true
 *                       userId:
 *                         type: integer
 *                         nullable: true
 *                       ipAddress:
 *                         type: string
 *                         nullable: true
 *                       userAgent:
 *                         type: string
 *                         nullable: true
 *                       details:
 *                         type: object
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         nullable: true
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) return validationError(res, 'Invalid query parameters', parsed.error.errors)
  
  const { action, entityType, entityId, userId, from, to, limit, offset } = parsed.data
  const where: Prisma.AuditLogWhereInput = {}
  
  if (action) where.action = action
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  if (userId) where.userId = userId
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    }
  }
  
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ])
  
  return paginated(
    res,
    items.map((item) => ({
      ...item,
      details: item.details ? JSON.parse(item.details) : null,
    })),
    total,
    limit,
    offset
  )
}))

export default router

