import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const router = Router()

const AUTH_REQUIRED = env.AUTH_REQUIRED
const JWT_SECRET: Secret = env.JWT_SECRET
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN

function signToken(payload: object) {
  const opts: SignOptions = { expiresIn: JWT_EXPIRES_IN as any }
  return jwt.sign(payload as any, JWT_SECRET, opts)
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!AUTH_REQUIRED) return next()
  const auth = req.headers.authorization || ''
  const [, token] = auth.split(' ')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    ;(req as any).user = decoded
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!AUTH_REQUIRED) return next()
    let u = (req as any).user as any
    if (!u?.sub) {
      const auth = req.headers.authorization || ''
      const [, token] = auth.split(' ')
      if (!token) return res.status(401).json({ error: 'Unauthorized' })
      try {
        u = jwt.verify(token, JWT_SECRET) as any
        ;(req as any).user = u
      } catch {
        return res.status(401).json({ error: 'Invalid token' })
      }
    }
  const user = await prisma.user.findUnique({
      where: { id: Number(u.sub) },
      include: { roles: { include: { role: true } } }
    })
  const has = user?.roles.some((ur: any) => roles.includes(ur.role.name))
    if (!has) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

export function requireSelfOrAdminForPlayer() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!AUTH_REQUIRED) return next()
    const auth = req.headers.authorization || ''
    const [, token] = auth.split(' ')
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    let u: any
    try { u = jwt.verify(token, JWT_SECRET) as any } catch { return res.status(401).json({ error: 'Invalid token' }) }
    ;(req as any).user = u
    const user = await prisma.user.findUnique({ where: { id: Number(u.sub) }, include: { roles: { include: { role: true } } } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    const isAdmin = user.roles.some((ur: any) => ur.role?.name === 'admin')
    if (isAdmin) return next()
    const targetId = Number(req.params.id)
    if (!Number.isInteger(targetId)) return res.status(400).json({ error: 'Invalid id' })
    if (user.playerId === targetId) return next()
    return res.status(403).json({ error: 'Forbidden' })
  }
}

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'email already exists' })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash, name } })
  const token = signToken({ sub: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'invalid credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid credentials' })
  const token = signToken({ sub: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ ok: true })
})

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  if (!AUTH_REQUIRED) return res.json({ authDisabled: true })
  const u = (req as any).user
  if (!u?.sub) return res.status(401).json({ error: 'Unauthorized' })
  const user = await prisma.user.findUnique({
    where: { id: Number(u.sub) },
    include: { roles: { include: { role: true } } },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  const roleNames = Array.isArray(user.roles) ? user.roles.map((ur: any) => ur.role?.name).filter(Boolean) : []
  res.json({ user: { id: user.id, email: user.email, name: user.name, roles: roleNames, playerId: user.playerId ?? null } })
})

export default router