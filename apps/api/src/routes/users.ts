import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from './auth.js'
import { z } from 'zod'

const router = Router()
const db: any = prisma

// List users with roles and player link (admin only)
router.get('/', requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const users = await db.user.findMany({ include: { roles: { include: { role: true } } } })
    const list = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      playerId: u.playerId ?? null,
      roles: (u.roles || []).map((ur: any) => ur.role?.name).filter(Boolean),
    }))
    res.json(list)
  } catch {
    res.status(500).json({ error: 'Failed to list users' })
  }
})

// Authenticated user: list own role requests
router.get('/me/role-requests', requireAuth, async (req: Request, res: Response) => {
  const u = (req as any).user
  if (!u?.sub) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const items = await db.roleRequest.findMany({ where: { userId: Number(u.sub) }, orderBy: { createdAt: 'desc' } })
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to list your requests' })
  }
})

// Set roles (admin only). Allowed roles: guest, player (admin managed separately via seed or ops)
const setRolesSchema = z.object({ roles: z.array(z.enum(['guest','player'])).default([]) })
router.put('/:id/roles', requireRole(['admin']), async (req: Request, res: Response) => {
  const userId = Number(req.params.id)
  if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid id' })
  let parsed
  try { parsed = setRolesSchema.parse(req.body) } catch (e: any) { return res.status(400).json({ error: 'Invalid roles' }) }
  const { roles } = parsed
  try {
    const user = await db.user.findUnique({ where: { id: userId }, include: { roles: true } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    // Remove existing guest/player roles
    const roleRecords = await db.role.findMany({ where: { name: { in: ['guest','player'] } } })
    const byName: any = Object.fromEntries(roleRecords.map((r: any) => [r.name, r]))
    await db.userRole.deleteMany({ where: { userId, roleId: { in: roleRecords.map((r: any) => r.id) } } })
    // Add requested roles
    for (const r of roles) {
      const role = byName[r]
      if (role) {
        await db.userRole.upsert({
          where: { userId_roleId: { userId, roleId: role.id } },
          update: {},
          create: { userId, roleId: role.id }
        })
      }
    }
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update roles' })
  }
})

// Link a user to a Player (admin only)
const linkSchema = z.object({ playerId: z.coerce.number().int().positive() })
router.put('/:id/link-player', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  let body
  try { body = linkSchema.parse(req.body) } catch { return res.status(400).json({ error: 'Invalid payload' }) }
  try {
    // Ensure player exists and not already linked
    const player = await db.player.findUnique({ where: { id: body.playerId } })
    if (!player) return res.status(404).json({ error: 'Player not found' })
    const existing = await db.user.findFirst({ where: { playerId: body.playerId } })
    if (existing && existing.id !== id) return res.status(409).json({ error: 'Player already linked to another user' })
    const updated = await db.user.update({ where: { id }, data: { playerId: body.playerId } })
    res.json({ id: updated.id, playerId: updated.playerId })
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ error: 'User not found' })
    return res.status(500).json({ error: 'Failed to link player' })
  }
})

export default router
// Role Requests endpoints
// Create a role request (authenticated user). Only 'player' is allowed for now.
// body: { role: 'player', playerId?: number, note?: string }
const createReqSchema = z.object({
  role: z.literal('player'),
  playerId: z.coerce.number().int().positive().optional(),
  note: z.string().max(500).optional()
})

router.post('/role-requests', requireAuth, async (req: Request, res: Response) => {
  const u = (req as any).user
  if (!u?.sub) return res.status(401).json({ error: 'Unauthorized' })
  let body
  try { body = createReqSchema.parse(req.body) } catch (e: any) { return res.status(400).json({ error: 'Invalid payload' }) }
  try {
    // Only allow one pending request per user
    const pending = await db.roleRequest.findFirst({ where: { userId: Number(u.sub), status: 'PENDING' } })
    if (pending) return res.status(409).json({ error: 'You already have a pending request' })
    // Validate player if provided and not already linked
    if (body.playerId) {
      const player = await db.player.findUnique({ where: { id: body.playerId } })
      if (!player) return res.status(404).json({ error: 'Player not found' })
      const existing = await db.user.findFirst({ where: { playerId: body.playerId } })
      if (existing) return res.status(409).json({ error: 'Player already linked to another user' })
    }
    const created = await db.roleRequest.create({ data: { userId: Number(u.sub), role: 'player', playerId: body.playerId ?? null, note: body.note } })
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create request' })
  }
})

// Admin: list role requests, optional filter by status
router.get('/role-requests', requireRole(['admin']), async (req: Request, res: Response) => {
  const status = String(req.query.status || 'PENDING').toUpperCase()
  const valid = ['PENDING','APPROVED','DENIED']
  const where: any = valid.includes(status) ? { status } : {}
  try {
    const items = await db.roleRequest.findMany({ where, orderBy: { createdAt: 'desc' }, include: { user: true, player: true } })
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to list requests' })
  }
})

// Admin: approve a request. Effect: set status, set decidedBy/decidedAt, assign 'player' role and optionally link playerId
router.post('/role-requests/:id/approve', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const reqItem = await db.roleRequest.findUnique({ where: { id } })
    if (!reqItem) return res.status(404).json({ error: 'Request not found' })
    if (reqItem.status !== 'PENDING') return res.status(409).json({ error: 'Request already decided' })
    // Ensure role exists
    const role = await db.role.findUnique({ where: { name: 'player' } })
    if (!role) return res.status(500).json({ error: 'Missing player role' })
    // Link player if provided
    if (reqItem.playerId) {
      const existing = await db.user.findFirst({ where: { playerId: reqItem.playerId } })
      if (existing && existing.id !== reqItem.userId) return res.status(409).json({ error: 'Player already linked to another user' })
      await db.user.update({ where: { id: reqItem.userId }, data: { playerId: reqItem.playerId } })
    }
    // Assign role
    await db.userRole.upsert({
      where: { userId_roleId: { userId: reqItem.userId, roleId: role.id } },
      update: {},
      create: { userId: reqItem.userId, roleId: role.id }
    })
    const admin = (req as any).user
    const updated = await db.roleRequest.update({ where: { id }, data: { status: 'APPROVED', decidedById: Number(admin.sub), decidedAt: new Date() } })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve request' })
  }
})

// Admin: deny a request
router.post('/role-requests/:id/deny', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const reqItem = await db.roleRequest.findUnique({ where: { id } })
    if (!reqItem) return res.status(404).json({ error: 'Request not found' })
    if (reqItem.status !== 'PENDING') return res.status(409).json({ error: 'Request already decided' })
    const admin = (req as any).user
    const updated = await db.roleRequest.update({ where: { id }, data: { status: 'DENIED', decidedById: Number(admin.sub), decidedAt: new Date() } })
    res.json(updated)
  } catch {
    res.status(500).json({ error: 'Failed to deny request' })
  }
})

// Admin: update a pending role request (e.g., adjust playerId or note)
const updateReqSchema = z.object({
  playerId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  note: z.string().max(500).optional(),
})
router.put('/role-requests/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  let body: z.infer<typeof updateReqSchema>
  try { body = updateReqSchema.parse(req.body) } catch { return res.status(400).json({ error: 'Invalid payload' }) }
  try {
    const reqItem = await db.roleRequest.findUnique({ where: { id } })
    if (!reqItem) return res.status(404).json({ error: 'Request not found' })
    if (reqItem.status !== 'PENDING') return res.status(409).json({ error: 'Request already decided' })
    // If playerId provided (including null): validate existence and linkage
    if (Object.prototype.hasOwnProperty.call(body, 'playerId')) {
      const pid = body.playerId
      if (pid != null) {
        const player = await db.player.findUnique({ where: { id: pid } })
        if (!player) return res.status(404).json({ error: 'Player not found' })
        const existing = await db.user.findFirst({ where: { playerId: pid } })
        if (existing) return res.status(409).json({ error: 'Player already linked to another user' })
      }
    }
    const data: any = {}
    if (Object.prototype.hasOwnProperty.call(body, 'playerId')) data.playerId = body.playerId === undefined ? reqItem.playerId : body.playerId
    if (Object.prototype.hasOwnProperty.call(body, 'note')) data.note = body.note
    const updated = await db.roleRequest.update({ where: { id }, data })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: 'Failed to update request' })
  }
})
