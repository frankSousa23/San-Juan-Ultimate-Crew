import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from './auth.js'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { createAuditHelper } from '../lib/audit.js'
import { success, updated, created, validationError, notFound, conflict, serverError, unauthorized } from '../lib/response.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

interface UserWithRoles {
  id: number
  email: string
  name: string | null
  playerId: number | null
  roles: Array<{ role: { name: string } }>
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users with their roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                     nullable: true
 *                   playerId:
 *                     type: integer
 *                     nullable: true
 *                   roles:
 *                     type: array
 *                     items:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/', requireRole(['admin']), asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({ 
    include: { roles: { include: { role: true } } } 
  })
  const list = users.map((u: UserWithRoles) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    playerId: u.playerId ?? null,
    roles: (u.roles || []).map(ur => ur.role?.name).filter((name): name is string => Boolean(name)),
  }))
  return success(res, list)
}))

const userIdFromTokenSchema = z.object({
  sub: z.string().transform(val => {
    const num = Number(val)
    if (!Number.isInteger(num) || num <= 0) {
      throw new z.ZodError([{
        code: 'custom',
        path: ['sub'],
        message: 'Invalid user ID'
      }])
    }
    return num
  })
})

/**
 * @swagger
 * /api/users/me/role-requests:
 *   get:
 *     summary: Get current user's role requests
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of role requests for current user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoleRequest'
 *       401:
 *         description: Unauthorized
 */
router.get('/me/role-requests', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) return unauthorized(res, 'Unauthorized')
  
  const parsed = userIdFromTokenSchema.safeParse({ sub: u.sub })
  if (!parsed.success) {
    return unauthorized(res, 'Invalid user token')
  }
  
  const items = await prisma.roleRequest.findMany({ 
    where: { userId: parsed.data.sub }, 
    orderBy: { createdAt: 'desc' } 
  })
  return success(res, items)
}))

const setRolesSchema = z.object({ roles: z.array(z.enum(['guest','player'])).default([]) })
const userIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

/**
 * @swagger
 * /api/users/{id}/roles:
 *   put:
 *     summary: Update user roles (admin only)
 *     tags: [Users]
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
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [guest, player]
 *                 default: []
 *     responses:
 *       200:
 *         description: User roles updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                   nullable: true
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 */
router.put('/:id/roles', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = userIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.errors)
  }
  const { id: userId } = parsedId.data
  const parsed = setRolesSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid roles', parsed.error.errors)
  }
  const { roles } = parsed.data
  
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { roles: true } 
  })
  if (!user) return notFound(res, 'User')
  
  const roleRecords = await prisma.role.findMany({ 
    where: { name: { in: ['guest','player'] } } 
  })
  const roleMap = new Map(roleRecords.map(r => [r.name, r.id]))
  const existingRoleIds = user.roles.map(ur => ur.roleId).filter(id => {
    const role = roleRecords.find(r => r.id === id)
    return role && ['guest','player'].includes(role.name)
  })
  const targetRoleIds = roles.map(name => roleMap.get(name)).filter((id): id is number => id !== undefined)
  const toRemove = existingRoleIds.filter(id => !targetRoleIds.includes(id))
  const toAdd = targetRoleIds.filter(id => !existingRoleIds.includes(id))
  if (toRemove.length > 0) {
    await prisma.userRole.deleteMany({ 
      where: { userId, roleId: { in: toRemove } } 
    })
  }
  if (toAdd.length > 0) {
    await prisma.userRole.createMany({ 
      data: toAdd.map(roleId => ({ userId, roleId })) 
    })
  }
  const updatedUser = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { roles: { include: { role: true } } } 
  })
  if (!updatedUser) return notFound(res, 'User')
  const roleNames = updatedUser.roles.map(ur => ur.role?.name).filter((name): name is string => Boolean(name))
  const audit = createAuditHelper(req)
  await audit.log('ROLE_CHANGE', 'User', userId, { 
    addedRoles: roles.filter((_, idx) => toAdd.includes(targetRoleIds[idx])),
    removedRoles: existingRoleIds.map(id => {
      const role = roleRecords.find(r => r.id === id)
      return role?.name
    }).filter((name): name is string => Boolean(name))
  })
  return updated(res, { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, roles: roleNames })
}))

const linkPlayerSchema = z.object({ playerId: z.coerce.number().int().positive() })

/**
 * @swagger
 * /api/users/{id}/link-player:
 *   put:
 *     summary: Link a user to a player (admin only)
 *     tags: [Users]
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
 *             required:
 *               - playerId
 *             properties:
 *               playerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User linked to player
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                   nullable: true
 *                 playerId:
 *                   type: integer
 *                   nullable: true
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User or player not found
 *       409:
 *         description: Player already linked to another user
 */
router.put('/:id/link-player', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = userIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.errors)
  }
  const { id: userId } = parsedId.data
  const parsed = linkPlayerSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid playerId', parsed.error.errors)
  }
  const { playerId } = parsed.data
  
  const player = await prisma.player.findUnique({ where: { id: playerId } })
  if (!player) return notFound(res, 'Player')
  const existing = await prisma.user.findFirst({ where: { playerId } })
  if (existing && existing.id !== userId) {
    return conflict(res, 'Player already linked to another user')
  }
  const user = await prisma.user.update({ 
    where: { id: userId }, 
    data: { playerId } 
  })
  return updated(res, { id: user.id, email: user.email, name: user.name, playerId: user.playerId })
}))

const roleRequestsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'DENIED']).optional(),
})

/**
 * @swagger
 * /api/users/role-requests:
 *   get:
 *     summary: Get all role requests (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, DENIED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of role requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoleRequest'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/role-requests', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsed = roleRequestsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return validationError(res, 'Invalid query parameters', parsed.error.errors)
  }
  
  const { status } = parsed.data
  const where: Prisma.RoleRequestWhereInput = status 
    ? { status }
    : {}
  const items = await prisma.roleRequest.findMany({
    where,
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return success(res, items)
}))

const createRoleRequestSchema = z.object({
  role: z.enum(['player']),
  playerId: z.coerce.number().int().positive().optional(),
  note: z.string().max(500).optional(),
})

/**
 * @swagger
 * /api/users/role-requests:
 *   post:
 *     summary: Create a new role request
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [player]
 *               playerId:
 *                 type: integer
 *                 description: Optional player ID to link
 *               note:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Role request created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleRequest'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Player not found
 *       409:
 *         description: Player already linked to another user
 */
router.post('/role-requests', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) return unauthorized(res, 'Unauthorized')
  
  const userParsed = userIdFromTokenSchema.safeParse({ sub: u.sub })
  if (!userParsed.success) {
    return unauthorized(res, 'Invalid user token')
  }
  const userId = userParsed.data.sub
  
  const parsed = createRoleRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid payload', parsed.error.errors)
  }
  const { role, playerId, note } = parsed.data
  
  if (playerId) {
    const player = await prisma.player.findUnique({ where: { id: playerId } })
    if (!player) return notFound(res, 'Player')
    const existing = await prisma.user.findFirst({ where: { playerId } })
    if (existing) {
      return conflict(res, 'Player already linked to another user')
    }
  }
  const roleRequest = await prisma.roleRequest.create({
    data: { userId, role, playerId: playerId ?? null, note: note ?? null }
  })
  return created(res, roleRequest)
}))

const updateRoleRequestSchema = z.object({
  playerId: z.coerce.number().int().positive().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
})

const roleRequestIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

/**
 * @swagger
 * /api/users/role-requests/{id}:
 *   put:
 *     summary: Update a role request (admin only, PENDING only)
 *     tags: [Users]
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
 *               playerId:
 *                 type: integer
 *                 nullable: true
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Role request updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleRequest'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Role request or player not found
 *       409:
 *         description: Request already decided or player already linked
 */
router.put('/role-requests/:id', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = roleRequestIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.errors)
  }
  const { id } = parsedId.data
  const parsed = updateRoleRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid payload', parsed.error.errors)
  }
  const { playerId, note } = parsed.data
  
  const existing = await prisma.roleRequest.findUnique({ where: { id } })
  if (!existing) return notFound(res, 'Role request')
  if (existing.status !== 'PENDING') {
    return conflict(res, 'Request already decided')
  }
  if (playerId !== null && playerId !== undefined) {
    const player = await prisma.player.findUnique({ where: { id: playerId } })
    if (!player) return notFound(res, 'Player')
    const linkedUser = await prisma.user.findFirst({ where: { playerId } })
    if (linkedUser && linkedUser.id !== existing.userId) {
      return conflict(res, 'Player already linked to another user')
    }
  }
  const roleRequest = await prisma.roleRequest.update({
    where: { id },
    data: { 
      playerId: playerId === null ? null : playerId, 
      note: note === null ? null : note 
    }
  })
  return updated(res, roleRequest)
}))

/**
 * @swagger
 * /api/users/role-requests/{id}/approve:
 *   post:
 *     summary: Approve a role request (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role request approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleRequest'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Role request not found
 *       409:
 *         description: Request already decided or player already linked
 */
router.post('/role-requests/:id/approve', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = roleRequestIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.errors)
  }
  const { id } = parsedId.data
  const admin = (req as Request & { user?: { sub: string } }).user
  if (!admin?.sub) return unauthorized(res, 'Unauthorized')
  try {
    const request = await prisma.roleRequest.findUnique({ where: { id } })
    if (!request) return notFound(res, 'Role request')
    if (request.status !== 'PENDING') {
      return conflict(res, 'Request already decided')
    }
    if (request.playerId) {
      const linkedUser = await prisma.user.findFirst({ where: { playerId: request.playerId } })
      if (linkedUser && linkedUser.id !== request.userId) {
        return conflict(res, 'Player already linked to another user')
      }
    }
    const role = await prisma.role.findUnique({ where: { name: request.role } })
    if (!role) return serverError(res, 'Role not found')
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: request.userId, roleId: role.id } },
      create: { userId: request.userId, roleId: role.id },
      update: {},
    })
    if (request.playerId) {
      await prisma.user.update({
        where: { id: request.userId },
        data: { playerId: request.playerId }
      })
    }
    const roleRequest = await prisma.roleRequest.update({
      where: { id },
      data: { 
        status: 'APPROVED', 
        decidedById: Number(admin.sub), 
        decidedAt: new Date() 
      }
    })
    const audit = createAuditHelper(req)
    await audit.log('ROLE_CHANGE', 'RoleRequest', id, { 
      action: 'APPROVED',
      role: request.role,
      userId: request.userId
    })
    return updated(res, roleRequest)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') return notFound(res, 'Role request')
      if (error.code === 'P2002') return conflict(res, 'Conflict')
    }
    throw error
  }
}))

/**
 * @swagger
 * /api/users/role-requests/{id}/deny:
 *   post:
 *     summary: Deny a role request (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role request denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleRequest'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Role request not found
 *       409:
 *         description: Request already decided
 */
router.post('/role-requests/:id/deny', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = roleRequestIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.errors)
  }
  const { id } = parsedId.data
  const admin = (req as Request & { user?: { sub: string } }).user
  if (!admin?.sub) return unauthorized(res, 'Unauthorized')
  try {
    const request = await prisma.roleRequest.findUnique({ where: { id } })
    if (!request) return notFound(res, 'Role request')
    if (request.status !== 'PENDING') {
      return conflict(res, 'Request already decided')
    }
    const roleRequest = await prisma.roleRequest.update({
      where: { id },
      data: { 
        status: 'DENIED', 
        decidedById: Number(admin.sub), 
        decidedAt: new Date() 
      }
    })
    return updated(res, roleRequest)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Role request')
    }
    throw error
  }
}))

export default router
