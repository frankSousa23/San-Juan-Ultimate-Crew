import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from './auth.js'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { createAuditHelper } from '../lib/audit.js'
import { success, updated, created, deleted, validationError, notFound, conflict, serverError, unauthorized, forbidden } from '../lib/response.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import bcrypt from 'bcryptjs'
import { env } from '../lib/env.js'

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
router.get('/', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined
  const where: Prisma.UserWhereInput = {}
  if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    where.status = status as any
  }
  
  const users = await prisma.user.findMany({ 
    where,
    include: { roles: { include: { role: true } } },
    orderBy: { createdAt: 'desc' }
  })
  const list = users.map((u: UserWithRoles & { status: string; createdAt: Date }) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    status: u.status,
    playerId: u.playerId ?? null,
    roles: (u.roles || []).map((ur: any) => ur.role?.name).filter((name): name is string => Boolean(name)),
    createdAt: u.createdAt,
  }))
  return success(res, list)
}))

const userIdFromTokenSchema = z.object({
  sub: z.union([z.string(), z.number()]).transform(val => {
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
  if (!u?.sub) {
    // If AUTH_REQUIRED is false, return empty array instead of error
    if (!env.AUTH_REQUIRED) {
      return success(res, [])
    }
    return unauthorized(res, 'Unauthorized')
  }
  
  const parsed = userIdFromTokenSchema.safeParse({ sub: u.sub })
  if (!parsed.success) {
    // If AUTH_REQUIRED is false, return empty array instead of error
    if (!env.AUTH_REQUIRED) {
      return success(res, [])
    }
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
  playerData: z.object({
    number: z.coerce.number().int().positive(),
    position: z.enum(['HANDLER', 'CUTTER', 'HYBRID']),
    status: z.enum(['ACTIVE', 'INJURED', 'INACTIVE']).optional().default('ACTIVE'),
    heightCm: z.coerce.number().int().positive().optional(),
    experience: z.string().optional(),
  }).optional(),
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
  const { role, playerId, note, playerData } = parsed.data
  
  // Validate playerData if provided
  if (playerData) {
    // Check if player number already exists
    const existingPlayer = await prisma.player.findUnique({ where: { number: playerData.number } })
    if (existingPlayer) {
      return conflict(res, `Player number ${playerData.number} is already taken`)
    }
  }
  
  if (playerId) {
    const player = await prisma.player.findUnique({ where: { id: playerId } })
    if (!player) return notFound(res, 'Player')
    const existing = await prisma.user.findFirst({ where: { playerId } })
    if (existing) {
      return conflict(res, 'Player already linked to another user')
    }
  }
  
  // If playerData is provided, create the player first
  let finalPlayerId = playerId ?? null
  if (playerData) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return notFound(res, 'User')
    
    const newPlayer = await prisma.player.create({
      data: {
        name: user.name || user.email,
        number: playerData.number,
        position: playerData.position,
        status: playerData.status || 'ACTIVE',
        heightCm: playerData.heightCm || null,
        experience: playerData.experience || null,
      }
    })
    finalPlayerId = newPlayer.id
  }
  
  const roleRequest = await prisma.roleRequest.create({
    data: { userId, role, playerId: finalPlayerId, note: note ?? null }
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
const approveRoleRequestSchema = z.object({
  playerData: z.object({
    number: z.coerce.number().int().positive(),
    position: z.enum(['HANDLER', 'CUTTER', 'HYBRID']),
    status: z.enum(['ACTIVE', 'INJURED', 'INACTIVE']).optional().default('ACTIVE'),
    heightCm: z.coerce.number().int().positive().optional(),
    experience: z.string().optional(),
  }).optional(),
})

router.post('/role-requests/:id/approve', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = roleRequestIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid id', parsedId.error.errors)
  }
  const { id } = parsedId.data
  
  const parsedBody = approveRoleRequestSchema.safeParse(req.body)
  if (!parsedBody.success) {
    return validationError(res, 'Invalid payload', parsedBody.error.errors)
  }
  const { playerData } = parsedBody.data
  
  const admin = (req as Request & { user?: { sub: string } }).user
  if (!admin?.sub) return unauthorized(res, 'Unauthorized')
  try {
    const request = await prisma.roleRequest.findUnique({ where: { id } })
    if (!request) return notFound(res, 'Role request')
    if (request.status !== 'PENDING') {
      return conflict(res, 'Request already decided')
    }
    
    let finalPlayerId = request.playerId
    
    // If playerData is provided, create the player
    if (playerData) {
      // Check if player number already exists
      const existingPlayer = await prisma.player.findUnique({ where: { number: playerData.number } })
      if (existingPlayer) {
        return conflict(res, `Player number ${playerData.number} is already taken`)
      }
      
      const user = await prisma.user.findUnique({ where: { id: request.userId } })
      if (!user) return notFound(res, 'User')
      
      const newPlayer = await prisma.player.create({
        data: {
          name: user.name || user.email,
          number: playerData.number,
          position: playerData.position,
          status: playerData.status || 'ACTIVE',
          heightCm: playerData.heightCm || null,
          experience: playerData.experience || null,
        }
      })
      finalPlayerId = newPlayer.id
    }
    
    if (finalPlayerId) {
      const linkedUser = await prisma.user.findFirst({ where: { playerId: finalPlayerId } })
      if (linkedUser && linkedUser.id !== request.userId) {
        return conflict(res, 'Player already linked to another user')
      }
    }
    
    const role = await prisma.role.findUnique({ where: { name: request.role } })
    if (!role) return serverError(res, 'Role not found')
    
    await prisma.$transaction(async (tx) => {
      await tx.userRole.upsert({
        where: { userId_roleId: { userId: request.userId, roleId: role.id } },
        create: { userId: request.userId, roleId: role.id },
        update: {},
      })
      
      if (finalPlayerId) {
        await tx.user.update({
          where: { id: request.userId },
          data: { playerId: finalPlayerId }
        })
      }
      
      // Update role request with new playerId if created
      if (playerData && finalPlayerId !== request.playerId) {
        await tx.roleRequest.update({
          where: { id },
          data: { playerId: finalPlayerId }
        })
      }
    })
    
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
      userId: request.userId,
      playerCreated: !!playerData,
      playerId: finalPlayerId
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

const approveUserSchema = z.object({
  role: z.enum(['guest', 'player', 'admin', 'captain', 'coach', 'treasurer']).optional(),
  playerId: z.coerce.number().int().positive().optional(),
  playerData: z.object({
    number: z.coerce.number().int().positive(),
    position: z.enum(['HANDLER', 'CUTTER', 'HYBRID']),
    status: z.enum(['ACTIVE', 'INJURED', 'INACTIVE']).optional().default('ACTIVE'),
    heightCm: z.coerce.number().int().positive().optional(),
    experience: z.string().optional(),
  }).optional(),
})

/**
 * @swagger
 * /api/users/{id}/approve:
 *   post:
 *     summary: Approve a pending user (admin only)
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [guest, player, admin, captain, coach, treasurer]
 *                 description: Rol principal a asignar al usuario (además de 'player' base)
 *               playerId:
 *                 type: integer
 *                 description: Optional player ID to link to the user
 *     responses:
 *       200:
 *         description: User approved successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 *       409:
 *         description: User already approved/rejected or player already linked
 */
router.post('/:id/approve', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = userIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid user ID', parsedId.error.errors)
  }
  const { id } = parsedId.data
  
  const parsed = approveUserSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid payload', parsed.error.errors)
  }
  const { role = 'guest', playerId, playerData } = parsed.data
  
  const admin = (req as Request & { user?: { sub: string } }).user
  // Cuando AUTH_REQUIRED está desactivado (modo abierto/demo), no forzamos tener admin en req.user
  if (env.AUTH_REQUIRED && !admin?.sub) return unauthorized(res, 'Unauthorized')
  
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return notFound(res, 'User')
  
  if (user.status === 'APPROVED') {
    return conflict(res, 'User is already approved')
  }
  
  if (user.status === 'REJECTED') {
    return conflict(res, 'User is already rejected')
  }
  
  // Validate playerData if provided
  if (playerData) {
    // Check if player number already exists
    const existingPlayer = await prisma.player.findUnique({ where: { number: playerData.number } })
    if (existingPlayer) {
      return conflict(res, `Player number ${playerData.number} is already taken`)
    }
  }
  
  // Check if playerId is already linked to another user (only if not creating new player)
  if (playerId && !playerData) {
    const player = await prisma.player.findUnique({ where: { id: playerId } })
    if (!player) {
      return notFound(res, 'Player')
    }
    
    const existingUser = await prisma.user.findFirst({ 
      where: { 
        playerId,
        id: { not: id }
      } 
    })
    if (existingUser) {
      return conflict(res, 'Player is already linked to another user')
    }
  }
  
  // Get roles: base player role + requested role (if different)
  const playerRole = await prisma.role.findUnique({ where: { name: 'player' } })
  if (!playerRole) {
    return serverError(res, 'Player role not found')
  }
  const primaryRole = await prisma.role.findUnique({ where: { name: role } })
  if (!primaryRole) {
    return serverError(res, 'Role not found')
  }
  
  // Update user status and assign roles:
  // - Siempre tendrá rol 'player' como base.
  // - Si el rol solicitado es distinto de 'player', se añade además.
  let finalPlayerId = playerId ?? null
  
  await prisma.$transaction(async (tx) => {
    // Remove any existing roles first (clean slate for new approval)
    await tx.userRole.deleteMany({
      where: { userId: id }
    })
    
    // If playerData is provided, create the player
    if (playerData) {
      const newPlayer = await tx.player.create({
        data: {
          name: user.name || user.email,
          number: playerData.number,
          position: playerData.position,
          status: playerData.status || 'ACTIVE',
          heightCm: playerData.heightCm || null,
          experience: playerData.experience || null,
        }
      })
      finalPlayerId = newPlayer.id
    }
    
    await tx.user.update({
      where: { id },
      data: {
        status: 'APPROVED',
        playerId: finalPlayerId,
      }
    })
    
    // Base: rol de jugador
    await tx.userRole.create({
      data: { userId: id, roleId: playerRole.id }
    })
    
    // Rol adicional solicitado (admin, captain, coach, etc.)
    if (primaryRole.id !== playerRole.id) {
      await tx.userRole.create({
        data: { userId: id, roleId: primaryRole.id }
      })
    }
  })
  
  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'User', id, { 
    action: 'APPROVED',
    role,
    playerId: finalPlayerId,
    playerCreated: !!playerData,
    approvedBy: admin?.sub ? Number(admin.sub) : null
  })
  
  const updatedUser = await prisma.user.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } }
  })
  
  return updated(res, {
    id: updatedUser!.id,
    email: updatedUser!.email,
    name: updatedUser!.name,
    status: updatedUser!.status,
    roles: (updatedUser!.roles || []).map((ur: any) => ur.role?.name).filter(Boolean),
    playerId: updatedUser!.playerId,
  })
}))

/**
 * @swagger
 * /api/users/{id}/reject:
 *   post:
 *     summary: Reject a pending user (admin only)
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
 *         description: User rejected successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 *       409:
 *         description: User already approved/rejected
 */
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = userIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid user ID', parsedId.error.errors)
  }
  const { id } = parsedId.data
  
  const admin = (req as Request & { user?: { sub: string } }).user
  if (env.AUTH_REQUIRED && !admin?.sub) return unauthorized(res, 'Unauthorized')
  
  // Prevent deleting yourself
  if (admin?.sub && Number(admin.sub) === id) {
    return validationError(res, 'You cannot delete your own account')
  }
  
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return notFound(res, 'User')
  
  // Delete user and related data in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete role requests
    await tx.roleRequest.deleteMany({ where: { userId: id } })
    
    // Delete user roles
    await tx.userRole.deleteMany({ where: { userId: id } })
    
    // If user has a player linked, we keep the player but unlink it
    // (player data might be needed for historical records)
    if (user.playerId) {
      await tx.user.update({
        where: { id },
        data: { playerId: null }
      })
    }
    
    // Delete the user
    await tx.user.delete({ where: { id } })
  })
  
  const audit = createAuditHelper(req)
  await audit.log('DELETE', 'User', id, { 
    action: 'DELETED',
    email: user.email,
    deletedBy: admin?.sub ? Number(admin.sub) : null
  })
  
  return deleted(res)
}))

router.post('/:id/reject', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const parsedId = userIdSchema.safeParse(req.params)
  if (!parsedId.success) {
    return validationError(res, 'Invalid user ID', parsedId.error.errors)
  }
  const { id } = parsedId.data
  
  const admin = (req as Request & { user?: { sub: string } }).user
  if (env.AUTH_REQUIRED && !admin?.sub) return unauthorized(res, 'Unauthorized')
  
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return notFound(res, 'User')
  
  if (user.status === 'APPROVED') {
    return conflict(res, 'User is already approved')
  }
  
  if (user.status === 'REJECTED') {
    return conflict(res, 'User is already rejected')
  }
  
  await prisma.user.update({
    where: { id },
    data: { status: 'REJECTED' }
  })
  
  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'User', id, { 
    action: 'REJECTED',
    email: user.email,
    rejectedBy: admin?.sub ? Number(admin.sub) : null,
    previousStatus: user.status
  })
  
  const updatedUser = await prisma.user.findUnique({ where: { id } })
  
  return updated(res, {
    id: updatedUser!.id,
    email: updatedUser!.email,
    name: updatedUser!.name,
    status: updatedUser!.status,
  })
}))

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
})

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/me', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) {
    if (!env.AUTH_REQUIRED) {
      return validationError(res, 'Cannot update profile when authentication is disabled')
    }
    return unauthorized(res, 'Unauthorized')
  }
  
  const userParsed = userIdFromTokenSchema.safeParse({ sub: u.sub })
  if (!userParsed.success) {
    if (!env.AUTH_REQUIRED) {
      return validationError(res, 'Cannot update profile when authentication is disabled')
    }
    return unauthorized(res, 'Invalid user token')
  }
  const userId = userParsed.data.sub
  
  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid payload', parsed.error.errors)
  }
  const { name } = parsed.data
  
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return notFound(res, 'User')
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name: name ?? user.name }
  })
  
  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'User', userId, { 
    action: 'PROFILE_UPDATE',
    field: 'name',
    email: updatedUser.email
  })
  
  return updated(res, {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    roles: (await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    }))?.roles.map((ur: any) => ur.role?.name).filter(Boolean) || [],
    playerId: updatedUser.playerId
  })
}))

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
})

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Change current user's password
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
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 128
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized or invalid current password
 */
router.put('/me/password', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) {
    if (!env.AUTH_REQUIRED) {
      return validationError(res, 'Cannot change password when authentication is disabled')
    }
    return unauthorized(res, 'Unauthorized')
  }
  
  const userParsed = userIdFromTokenSchema.safeParse({ sub: u.sub })
  if (!userParsed.success) {
    if (!env.AUTH_REQUIRED) {
      return validationError(res, 'Cannot change password when authentication is disabled')
    }
    return unauthorized(res, 'Invalid user token')
  }
  const userId = userParsed.data.sub
  
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid payload', parsed.error.errors)
  }
  const { currentPassword, newPassword } = parsed.data
  
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return notFound(res, 'User')
  
  const match = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!match) {
    return unauthorized(res, 'Current password is incorrect')
  }
  
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  })
  
  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'User', userId, { 
    action: 'PASSWORD_CHANGE',
    email: user.email
  })
  
  return success(res, { message: 'Password changed successfully' })
}))

/**
 * @swagger
 * /api/users/me/activity:
 *   get:
 *     summary: Get current user's activity log (audit logs)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of logs to return
 *     responses:
 *       200:
 *         description: List of audit logs for current user
 *       401:
 *         description: Unauthorized
 */
router.get('/me/activity', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) {
    // If AUTH_REQUIRED is false, return empty array instead of error
    if (!env.AUTH_REQUIRED) {
      return success(res, [])
    }
    return unauthorized(res, 'Unauthorized')
  }
  
  const userParsed = userIdFromTokenSchema.safeParse({ sub: u.sub })
  if (!userParsed.success) {
    // If AUTH_REQUIRED is false, return empty array instead of error
    if (!env.AUTH_REQUIRED) {
      return success(res, [])
    }
    return unauthorized(res, 'Invalid user token')
  }
  const userId = userParsed.data.sub
  
  const limit = Math.min(Number(req.query.limit) || 50, 100)
  
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: 'User', entityId: userId },
        { userId }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
  
  return success(res, logs)
}))

const togglePlayerRoleSchema = z.object({
  active: z.boolean()
})

/**
 * @swagger
 * /api/users/me/player-role:
 *   put:
 *     summary: Toggle player role for current user (activate/deactivate)
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
 *               - active
 *             properties:
 *               active:
 *                 type: boolean
 *                 description: true to activate player role, false to deactivate
 *     responses:
 *       200:
 *         description: Player role toggled successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Player role not found
 */
router.put('/me/player-role', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) {
    if (!env.AUTH_REQUIRED) {
      return validationError(res, 'Cannot toggle player role when authentication is disabled')
    }
    return unauthorized(res, 'Unauthorized')
  }
  
  const userParsed = userIdFromTokenSchema.safeParse({ sub: u.sub })
  if (!userParsed.success) {
    if (!env.AUTH_REQUIRED) {
      return validationError(res, 'Cannot toggle player role when authentication is disabled')
    }
    return unauthorized(res, 'Invalid user token')
  }
  const userId = userParsed.data.sub
  
  const parsed = togglePlayerRoleSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid payload', parsed.error.errors)
  }
  const { active } = parsed.data
  
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { roles: { include: { role: true } } }
  })
  if (!user) return notFound(res, 'User')
  
  // Check if user is guest - guests cannot activate player role themselves
  const userRoles = user.roles.map(ur => ur.role?.name).filter(Boolean) as string[]
  const isGuest = userRoles.includes('guest') && !userRoles.includes('player') && !userRoles.includes('admin') && !userRoles.includes('captain') && !userRoles.includes('coach') && !userRoles.includes('treasurer')
  
  if (isGuest && active) {
    return forbidden(res, 'Los usuarios guest no pueden activar el rol de jugador. Contacta a un administrador para solicitar acceso.')
  }
  
  const playerRole = await prisma.role.findUnique({ where: { name: 'player' } })
  if (!playerRole) return serverError(res, 'Player role not found')
  
  const hasPlayerRole = user.roles.some(ur => ur.roleId === playerRole.id)
  
  if (active && !hasPlayerRole) {
    // Activate player role
    await prisma.userRole.create({
      data: { userId, roleId: playerRole.id }
    })
    
    const audit = createAuditHelper(req)
    await audit.log('ROLE_CHANGE', 'User', userId, {
      action: 'PLAYER_ROLE_ACTIVATED',
      email: user.email
    })
  } else if (!active && hasPlayerRole) {
    // Deactivate player role (but keep playerId if exists)
    await prisma.userRole.deleteMany({
      where: { userId, roleId: playerRole.id }
    })
    
    const audit = createAuditHelper(req)
    await audit.log('ROLE_CHANGE', 'User', userId, {
      action: 'PLAYER_ROLE_DEACTIVATED',
      email: user.email,
      note: 'PlayerId preserved if exists'
    })
  }
  
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } }
  })
  
  return updated(res, {
    id: updatedUser!.id,
    email: updatedUser!.email,
    name: updatedUser!.name,
    roles: (updatedUser!.roles || []).map((ur: any) => ur.role?.name).filter(Boolean),
    playerId: updatedUser!.playerId
  })
}))

export default router
