import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from './auth.js'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const router = Router()

interface UserWithRoles {
  id: number
  email: string
  name: string | null
  playerId: number | null
  roles: Array<{ role: { name: string } }>
}

router.get('/', requireRole(['admin']), async (_req: Request, res: Response) => {
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
    res.json(list)
  } catch {
    res.status(500).json({ error: 'Failed to list users' })
  }
})

router.get('/me/role-requests', requireAuth, async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const items = await prisma.roleRequest.findMany({ 
      where: { userId: Number(u.sub) }, 
      orderBy: { createdAt: 'desc' } 
    })
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to list your requests' })
  }
})

const setRolesSchema = z.object({ roles: z.array(z.enum(['guest','player'])).default([]) })
router.put('/:id/roles', requireRole(['admin']), async (req: Request, res: Response) => {
  const userId = Number(req.params.id)
  if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid id' })
  let parsed
  try { 
    parsed = setRolesSchema.parse(req.body) 
  } catch (error) { 
    return res.status(400).json({ error: 'Invalid roles' }) 
  }
  const { roles } = parsed
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { roles: true } 
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
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
    const updated = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { roles: { include: { role: true } } } 
    })
    const roleNames = updated?.roles.map(ur => ur.role?.name).filter((name): name is string => Boolean(name)) || []
    res.json({ id: updated?.id, email: updated?.email, name: updated?.name, roles: roleNames })
  } catch {
    res.status(500).json({ error: 'Failed to update roles' })
  }
})

const linkPlayerSchema = z.object({ playerId: z.coerce.number().int().positive() })
router.put('/:id/link-player', requireRole(['admin']), async (req: Request, res: Response) => {
  const userId = Number(req.params.id)
  if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid id' })
  let parsed
  try { 
    parsed = linkPlayerSchema.parse(req.body) 
  } catch { 
    return res.status(400).json({ error: 'Invalid playerId' }) 
  }
  const { playerId } = parsed
  try {
    const player = await prisma.player.findUnique({ where: { id: playerId } })
    if (!player) return res.status(404).json({ error: 'Player not found' })
    const existing = await prisma.user.findFirst({ where: { playerId } })
    if (existing && existing.id !== userId) {
      return res.status(409).json({ error: 'Player already linked to another user' })
    }
    const updated = await prisma.user.update({ 
      where: { id: userId }, 
      data: { playerId } 
    })
    res.json({ id: updated.id, email: updated.email, name: updated.name, playerId: updated.playerId })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' })
    }
    res.status(500).json({ error: 'Failed to link player' })
  }
})

router.get('/role-requests', requireRole(['admin']), async (req: Request, res: Response) => {
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
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to list role requests' })
  }
})

const createRoleRequestSchema = z.object({
  role: z.enum(['player']),
  playerId: z.coerce.number().int().positive().optional(),
  note: z.string().max(500).optional(),
})

router.post('/role-requests', requireAuth, async (req: Request, res: Response) => {
  const u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) return res.status(401).json({ error: 'Unauthorized' })
  let parsed
  try { 
    parsed = createRoleRequestSchema.parse(req.body) 
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return res.status(400).json({ error: 'Invalid payload', issues: (error as z.ZodError).issues })
    }
    return res.status(400).json({ error: 'Invalid payload' })
  }
  const { role, playerId, note } = parsed
  try {
    if (playerId) {
      const player = await prisma.player.findUnique({ where: { id: playerId } })
      if (!player) return res.status(404).json({ error: 'Player not found' })
      const existing = await prisma.user.findFirst({ where: { playerId } })
      if (existing) {
        return res.status(409).json({ error: 'Player already linked to another user' })
      }
    }
    const created = await prisma.roleRequest.create({
      data: { userId: Number(u.sub), role, playerId: playerId ?? null, note: note ?? null }
    })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ error: 'Failed to create role request' })
  }
})

const updateRoleRequestSchema = z.object({
  playerId: z.coerce.number().int().positive().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
})

router.put('/role-requests/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  let parsed
  try { 
    parsed = updateRoleRequestSchema.parse(req.body) 
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return res.status(400).json({ error: 'Invalid payload', issues: (error as z.ZodError).issues })
    }
    return res.status(400).json({ error: 'Invalid payload' })
  }
  const { playerId, note } = parsed
  try {
    const existing = await prisma.roleRequest.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Role request not found' })
    if (existing.status !== 'PENDING') {
      return res.status(409).json({ error: 'Request already decided' })
    }
    if (playerId !== null && playerId !== undefined) {
      const player = await prisma.player.findUnique({ where: { id: playerId } })
      if (!player) return res.status(404).json({ error: 'Player not found' })
      const linkedUser = await prisma.user.findFirst({ where: { playerId } })
      if (linkedUser && linkedUser.id !== existing.userId) {
        return res.status(409).json({ error: 'Player already linked to another user' })
      }
    }
    const updated = await prisma.roleRequest.update({
      where: { id },
      data: { 
        playerId: playerId === null ? null : playerId, 
        note: note === null ? null : note 
      }
    })
    res.json(updated)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Role request not found' })
    }
    res.status(500).json({ error: 'Failed to update role request' })
  }
})

router.post('/role-requests/:id/approve', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  const admin = (req as Request & { user?: { sub: string } }).user
  if (!admin?.sub) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const request = await prisma.roleRequest.findUnique({ where: { id } })
    if (!request) return res.status(404).json({ error: 'Role request not found' })
    if (request.status !== 'PENDING') {
      return res.status(409).json({ error: 'Request already decided' })
    }
    if (request.playerId) {
      const linkedUser = await prisma.user.findFirst({ where: { playerId: request.playerId } })
      if (linkedUser && linkedUser.id !== request.userId) {
        return res.status(409).json({ error: 'Player already linked to another user' })
      }
    }
    const role = await prisma.role.findUnique({ where: { name: request.role } })
    if (!role) return res.status(500).json({ error: 'Role not found' })
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
    const updated = await prisma.roleRequest.update({
      where: { id },
      data: { 
        status: 'APPROVED', 
        decidedById: Number(admin.sub), 
        decidedAt: new Date() 
      }
    })
    res.json(updated)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Role request not found' })
      if (error.code === 'P2002') return res.status(409).json({ error: 'Conflict' })
    }
    res.status(500).json({ error: 'Failed to approve role request' })
  }
})

router.post('/role-requests/:id/deny', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  const admin = (req as Request & { user?: { sub: string } }).user
  if (!admin?.sub) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const request = await prisma.roleRequest.findUnique({ where: { id } })
    if (!request) return res.status(404).json({ error: 'Role request not found' })
    if (request.status !== 'PENDING') {
      return res.status(409).json({ error: 'Request already decided' })
    }
    const updated = await prisma.roleRequest.update({
      where: { id },
      data: { 
        status: 'DENIED', 
        decidedById: Number(admin.sub), 
        decidedAt: new Date() 
      }
    })
    res.json(updated)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Role request not found' })
    }
    res.status(500).json({ error: 'Failed to deny role request' })
  }
})

export default router
