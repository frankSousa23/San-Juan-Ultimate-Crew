import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createAuditHelper } from '../lib/audit.js'
import { success, validationError, conflict, unauthorized, notFound } from '../lib/response.js'
import { asyncHandler } from '../middleware/errorHandler.js'

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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already exists
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body || {}
  if (!email || !password) return validationError(res, 'email and password required')
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return conflict(res, 'email already exists')
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash, name } })
  const token = signToken({ sub: user.id, email: user.email })
  return success(res, { token, user: { id: user.id, email: user.email, name: user.name } })
}))

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body || {}
  if (!email || !password) return validationError(res, 'email and password required')
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return unauthorized(res, 'invalid credentials')
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return unauthorized(res, 'invalid credentials')
  const token = signToken({ sub: user.id, email: user.email })
  const audit = createAuditHelper(req)
  await audit.log('LOGIN', 'User', user.id, { email: user.email })
  return success(res, { token, user: { id: user.id, email: user.email, name: user.name } })
}))

router.post('/logout', (_req: Request, res: Response) => {
  return success(res, { ok: true })
})

router.get('/me', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  if (!AUTH_REQUIRED) return success(res, { authDisabled: true })
  const u = (req as any).user
  if (!u?.sub) return unauthorized(res, 'Unauthorized')
  const user = await prisma.user.findUnique({
    where: { id: Number(u.sub) },
    include: { roles: { include: { role: true } } },
  })
  if (!user) return notFound(res, 'User')
  const roleNames = Array.isArray(user.roles) ? user.roles.map((ur: any) => ur.role?.name).filter(Boolean) : []
  return success(res, { user: { id: user.id, email: user.email, name: user.name, roles: roleNames, playerId: user.playerId ?? null } })
}))

export default router