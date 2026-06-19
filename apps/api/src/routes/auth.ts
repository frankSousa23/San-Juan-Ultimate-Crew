/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
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
  } catch (err: any) {
    // Provide more specific error messages
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' })
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

// Helper function to get user with roles and permissions
async function getUserWithPermissions(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      roles: { 
        include: { 
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        } 
      } 
    }
  })
  
  if (!user) return null
  
  const userRoles: string[] = []
  const userPermissions: string[] = []
  
  if (user.roles && Array.isArray(user.roles)) {
    for (const userRole of user.roles) {
      if (userRole && userRole.role && userRole.role.name) {
        userRoles.push(userRole.role.name)
        // Get permissions for this role
        if (userRole.role.permissions && Array.isArray(userRole.role.permissions)) {
          for (const rolePerm of userRole.role.permissions) {
            if (rolePerm && rolePerm.permission && rolePerm.permission.name) {
              if (!userPermissions.includes(rolePerm.permission.name)) {
                userPermissions.push(rolePerm.permission.name)
              }
            }
          }
        }
      }
    }
  }
  
  return { user, roles: userRoles, permissions: userPermissions }
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
      } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired. Please log in again.' })
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token' })
        }
        return res.status(401).json({ error: 'Authentication failed' })
      }
    }
    const userId = Number(u.sub)
    if (!userId || isNaN(userId)) {
      return res.status(401).json({ error: 'Invalid user ID' })
    }
    
    const userData = await getUserWithPermissions(userId)
    
    if (!userData) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    const has = userData.roles.some((roleName: string) => roles.includes(roleName))
    
    if (!has) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Required roles: ${roles.join(', ')}, User roles: ${userData.roles.join(', ') || 'none'}`
      })
    }
    
    // Store user data in request for use in route handlers
    ;(req as any).userRoles = userData.roles
    ;(req as any).userPermissions = userData.permissions
    
    next()
  }
}

// New function to require specific permission
export function requirePermission(permission: string) {
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
      } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired. Please log in again.' })
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token' })
        }
        return res.status(401).json({ error: 'Authentication failed' })
      }
    }
    const userId = Number(u.sub)
    if (!userId || isNaN(userId)) {
      return res.status(401).json({ error: 'Invalid user ID' })
    }
    
    const userData = await getUserWithPermissions(userId)
    
    if (!userData) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    // Admin always has all permissions
    if (userData.roles.includes('admin')) {
      ;(req as any).userRoles = userData.roles
      ;(req as any).userPermissions = userData.permissions
      return next()
    }
    
    // Check if user has the required permission
    const hasPermission = userData.permissions.includes(permission)
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Required permission: ${permission}, User permissions: ${userData.permissions.join(', ') || 'none'}`
      })
    }
    
    // Store user data in request for use in route handlers
    ;(req as any).userRoles = userData.roles
    ;(req as any).userPermissions = userData.permissions
    
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
    try { 
      u = jwt.verify(token, JWT_SECRET) as any 
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please log in again.' })
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' })
      }
      return res.status(401).json({ error: 'Authentication failed' })
    }
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
  const { email, password, name, willBePlayer, playerData } = req.body || {}
  if (!email || !password || !name || !String(name).trim()) {
    return validationError(res, 'name, email and password are required')
  }
  
  // Normalize email: trim whitespace and convert to lowercase
  const normalizedEmail = email.trim().toLowerCase()
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return validationError(res, 'Invalid email format')
  }
  
  if (password.length < 6) return validationError(res, 'password must be at least 6 characters')
  
  // Additional password strength validation (optional but recommended)
  if (password.length > 128) return validationError(res, 'password is too long (maximum 128 characters)')
  
  // Normalize and validate name (obligatorio)
  const normalizedName = String(name).trim()
  if (normalizedName.length > 100) {
    return validationError(res, 'name is too long (maximum 100 characters)')
  }
  
  // Validate player data if willBePlayer is true
  if (willBePlayer && playerData) {
    if (!playerData.number || !playerData.position) {
      return validationError(res, 'If registering as player, number and position are required')
    }
    if (!['HANDLER', 'CUTTER', 'HYBRID'].includes(playerData.position)) {
      return validationError(res, 'Invalid position. Must be HANDLER, CUTTER, or HYBRID')
    }
    const num = Number(playerData.number)
    if (!Number.isInteger(num) || num <= 0) {
      return validationError(res, 'Player number must be a positive integer')
    }
    // Check if player number already exists
    const existingPlayer = await prisma.player.findUnique({ where: { number: num } })
    if (existingPlayer) {
      return conflict(res, `Player number ${num} is already taken`)
    }
  }
  
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (exists) {
    if (exists.status === 'APPROVED' || exists.status === 'PENDING') {
      return conflict(res, 'Email already exists')
    }
    // If user was rejected, allow re-registration by updating to PENDING
    if (exists.status === 'REJECTED') {
      const passwordHash = await bcrypt.hash(password, 10)
      const updatedUser = await prisma.user.update({
        where: { id: exists.id },
        data: {
          passwordHash,
          name: normalizedName || exists.name,
          status: 'PENDING'
        }
      })
      
      // Log re-registration of rejected user
      const audit = createAuditHelper(req)
      await audit.log('UPDATE', 'User', exists.id, { 
        email: updatedUser.email,
        action: 'RE_REGISTERED',
        previousStatus: 'REJECTED',
        newStatus: 'PENDING'
      })
      
      return success(res, { 
        message: 'Registration successful. Your account is pending admin approval.',
        user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, status: 'PENDING' }
      })
    }
  }
  
  const passwordHash = await bcrypt.hash(password, 10)
  
  // Create user and optionally create player in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ 
      data: { 
        email: normalizedEmail, 
        passwordHash, 
        name: normalizedName,
        status: 'PENDING' // New users start as PENDING, need admin approval
      } 
    })
    
    let playerId: number | null = null
    // If willBePlayer is true and playerData is provided, create the player
    if (willBePlayer && playerData) {
      const player = await tx.player.create({
        data: {
          name: normalizedName,
          number: Number(playerData.number),
          position: playerData.position,
          status: playerData.status || 'ACTIVE',
          heightCm: playerData.heightCm ? Number(playerData.heightCm) : null,
          experience: playerData.experience || null,
        }
      })
      playerId = player.id
      
      // Link player to user
      await tx.user.update({
        where: { id: user.id },
        data: { playerId: player.id }
      })
    }
    
    return { user, playerId }
  })
  
  // Log user registration
  const audit = createAuditHelper(req)
  await audit.log('CREATE', 'User', result.user.id, { 
    email: result.user.email, 
    name: result.user.name,
    status: 'PENDING',
    action: 'REGISTERED',
    willBePlayer: !!willBePlayer,
    playerId: result.playerId
  })
  
  // Don't return token - user needs to be approved first
  return success(res, { 
    message: 'Registration successful. Your account is pending admin approval.',
    user: { 
      id: result.user.id, 
      email: result.user.email, 
      name: result.user.name, 
      status: 'PENDING',
      playerId: result.playerId
    }
  })
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
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body || {}
  if (!email || !password) return validationError(res, 'email and password required')
  
  // Normalize email: trim whitespace and convert to lowercase
  const normalizedEmail = email.trim().toLowerCase()
  
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { roles: { include: { role: true } } },
  })
  if (!user) return notFound(res, 'User')
  
  // Check if user is approved
  if (user.status === 'PENDING') {
    return unauthorized(res, 'Your account is pending admin approval. Please wait for approval before logging in.')
  }
  if (user.status === 'REJECTED') {
    return unauthorized(res, 'Your account has been rejected. Please contact an administrator.')
  }
  
  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) return unauthorized(res, 'Invalid credentials')
  const token = signToken({ sub: user.id, email: user.email })
  const audit = createAuditHelper(req)
  await audit.log('LOGIN', 'User', user.id, { email: user.email })
  const roleNames = Array.isArray(user.roles) ? user.roles.map((ur: any) => ur.role?.name).filter(Boolean) : []
  return success(res, { 
    token, 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      roles: roleNames, 
      playerId: user.playerId ?? null,
      status: user.status 
    } 
  })
}))

/**
 * @swagger
 * /api/auth/check-status:
 *   post:
 *     summary: Check user registration status by email (public endpoint)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User status information
 *       400:
 *         description: Invalid input
 */
router.post('/check-status', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body || {}
  if (!email) return validationError(res, 'email required')
  
  // Normalize email: trim whitespace and convert to lowercase
  const normalizedEmail = email.trim().toLowerCase()
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return validationError(res, 'Invalid email format')
  }
  
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, status: true, createdAt: true }
  })
  
  if (!user) {
    return success(res, { exists: false })
  }
  
  return success(res, {
    exists: true,
    status: user.status,
    createdAt: user.createdAt
  })
}))

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 authDisabled:
 *                   type: boolean
 *                   description: Whether authentication is disabled
 *       401:
 *         description: Unauthorized
 */
router.get('/me', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  if (!AUTH_REQUIRED) {
    return success(res, { authDisabled: true })
  }
  
  const u = (req as any).user as any
  if (!u?.sub) {
    return unauthorized(res, 'Unauthorized')
  }
  
  const userId = Number(u.sub)
  if (!userId || isNaN(userId)) {
    return unauthorized(res, 'Invalid user ID')
  }
  
  const userData = await getUserWithPermissions(userId)
  
  if (!userData) {
    return unauthorized(res, 'User not found')
  }
  
  return success(res, {
    user: {
      id: userData.user.id,
      email: userData.user.email,
      name: userData.user.name,
      roles: userData.roles,
      permissions: userData.permissions,
      playerId: userData.user.playerId ?? null,
      status: userData.user.status
    },
    authDisabled: false
  })
}))

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  if (!AUTH_REQUIRED) {
    return success(res, { ok: true })
  }
  
  const u = (req as any).user as any
  if (!u?.sub) {
    return unauthorized(res, 'Unauthorized')
  }
  
  const userId = Number(u.sub)
  if (!userId || isNaN(userId)) {
    return unauthorized(res, 'Invalid user ID')
  }
  
  const audit = createAuditHelper(req)
  await audit.log('LOGOUT', 'User', userId, { email: u.email || 'unknown' })
  
  return success(res, { ok: true })
}))

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent (always returns success for security)
 *       400:
 *         description: Invalid input
 */
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body || {}
  if (!email) return validationError(res, 'email required')
  
  // Normalize email: trim whitespace and convert to lowercase
  const normalizedEmail = email.trim().toLowerCase()
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalizedEmail)) {
    return validationError(res, 'Invalid email format')
  }
  
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  
  // Always return success for security (don't reveal if email exists)
  if (!user) {
    return success(res, { message: 'If an account with that email exists, a password reset link has been sent.' })
  }
  
  // Check if user has a recent password reset token (prevent spam)
  const recentToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      used: false,
      expiresAt: { gt: new Date() },
      createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) } // Created within last 5 minutes
    }
  })
  
  if (recentToken) {
    // Token already exists and is still valid, don't create a new one
    return success(res, { 
      message: 'If an account with that email exists, a password reset link has been sent.',
      ...(process.env.NODE_ENV === 'development' && { token: recentToken.token })
    })
  }
  
  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // Token expires in 1 hour
  
  // Clean up expired tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { 
      userId: user.id,
      OR: [
        { used: true },
        { expiresAt: { lt: new Date() } }
      ]
    }
  })
  
  // Delete any remaining active tokens for this user (only one active token at a time)
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id }
  })
  
  // Create new token
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  })
  
  // In a real application, you would send an email here
  // For now, we'll just log it (in production, use a proper email service)
  if (process.env.NODE_ENV === 'development') {
    const { logger } = await import('../lib/logger.js')
    logger.info('Password reset token generated', { 
      email, 
      token,
      resetLink: `${env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`
    })
  }
  
  // Clean up old expired/used tokens periodically (background task, non-blocking)
  prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Delete used tokens older than 24h
        { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Delete expired tokens older than 24h
      ]
    }
  }).catch(() => {
    // Silently fail - this is a background cleanup task
  })
  
  return success(res, { 
    message: 'If an account with that email exists, a password reset link has been sent.',
    // In development, return the token for testing
    ...(process.env.NODE_ENV === 'development' && { token })
  })
}))

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid input or expired token
 *       404:
 *         description: Invalid or expired token
 */
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body || {}
  if (!token || !password) {
    return validationError(res, 'token and password required')
  }
  if (password.length < 6) {
    return validationError(res, 'password must be at least 6 characters')
  }
  if (password.length > 128) {
    return validationError(res, 'password is too long (maximum 128 characters)')
  }
  
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  })
  
  if (!resetToken) {
    return notFound(res, 'Invalid or expired token')
  }
  
  if (resetToken.used) {
    return validationError(res, 'Token has already been used')
  }
  
  if (resetToken.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
    return validationError(res, 'Token has expired')
  }
  
  // Hash new password
  const passwordHash = await bcrypt.hash(password, 10)
  
  // Update user password and mark token as used
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    })
    
    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    })
  })
  
  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'User', resetToken.userId, { 
    action: 'PASSWORD_RESET',
    email: resetToken.user.email
  })
  
  return success(res, { message: 'Password reset successful' })
}))

export default router