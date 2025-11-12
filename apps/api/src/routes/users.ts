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
  try {
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
  } catch {
    return serverError(res, 'Failed to list users')
  }
}))

router.get('/me/role-requests', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) return unauthorized(res, 'Unauthorized')
  try {
    const items = await prisma.roleRequest.findMany({ 
      where: { userId: Number(u.sub) }, 
      orderBy: { createdAt: 'desc' } 
    })
    return success(res, items)
  } catch {
    return serverError(res, 'Failed to list your requests')
  }
}))

const setRolesSchema = z.object({ roles: z.array(z.enum(['guest','player'])).default([]) })
router.put('/:id/roles', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const userId = Number(req.params.id)
  if (!Number.isInteger(userId)) return validationError(res, 'Invalid id')
  let parsed
  try { 
    parsed = setRolesSchema.parse(req.body) 
  } catch (error) { 
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationError(res, 'Invalid roles', (error as z.ZodError).issues)
    }
    return validationError(res, 'Invalid roles')
  }
  const { roles } = parsed
  try {
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
  } catch {
    return serverError(res, 'Failed to update roles')
  }
}))

const linkPlayerSchema = z.object({ playerId: z.coerce.number().int().positive() })
router.put('/:id/link-player', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const userId = Number(req.params.id)
  if (!Number.isInteger(userId)) return validationError(res, 'Invalid id')
  let parsed
  try { 
    parsed = linkPlayerSchema.parse(req.body) 
  } catch (error) { 
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationError(res, 'Invalid playerId', (error as z.ZodError).issues)
    }
    return validationError(res, 'Invalid playerId')
  }
  const { playerId } = parsed
  try {
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
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'User')
    }
    throw error
  }
}))

router.get('/role-requests', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined
  try {
    const where: Prisma.RoleRequestWhereInput = status 
      ? { status: status as 'PENDING' | 'APPROVED' | 'DENIED' }
      : {}
    const items = await prisma.roleRequest.findMany({
      where,
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return success(res, items)
  } catch {
    return serverError(res, 'Failed to list role requests')
  }
}))

const createRoleRequestSchema = z.object({
  role: z.enum(['player']),
  playerId: z.coerce.number().int().positive().optional(),
  note: z.string().max(500).optional(),
})

router.post('/role-requests', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) return unauthorized(res, 'Unauthorized')
  let parsed
  try { 
    parsed = createRoleRequestSchema.parse(req.body) 
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationError(res, 'Invalid payload', (error as z.ZodError).issues)
    }
    return validationError(res, 'Invalid payload')
  }
  const { role, playerId, note } = parsed
  try {
    if (playerId) {
      const player = await prisma.player.findUnique({ where: { id: playerId } })
      if (!player) return notFound(res, 'Player')
      const existing = await prisma.user.findFirst({ where: { playerId } })
      if (existing) {
        return conflict(res, 'Player already linked to another user')
      }
    }
    const roleRequest = await prisma.roleRequest.create({
      data: { userId: Number(u.sub), role, playerId: playerId ?? null, note: note ?? null }
    })
    return created(res, roleRequest)
  } catch {
    return serverError(res, 'Failed to create role request')
  }
}))

const updateRoleRequestSchema = z.object({
  playerId: z.coerce.number().int().positive().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
})

router.put('/role-requests/:id', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return validationError(res, 'Invalid id')
  let parsed
  try { 
    parsed = updateRoleRequestSchema.parse(req.body) 
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationError(res, 'Invalid payload', (error as z.ZodError).issues)
    }
    return validationError(res, 'Invalid payload')
  }
  const { playerId, note } = parsed
  try {
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
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Role request')
    }
    throw error
  }
}))

router.post('/role-requests/:id/approve', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return validationError(res, 'Invalid id')
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

router.post('/role-requests/:id/deny', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return validationError(res, 'Invalid id')
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
