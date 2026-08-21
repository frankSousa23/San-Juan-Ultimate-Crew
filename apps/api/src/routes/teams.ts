import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireRole } from './auth.js'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler.js'
import { createAuditHelper } from '../lib/audit.js'
import { success, created, updated, notFound, validationError } from '../lib/response.js'

const router = Router()

// Public listing of active teams (for registration and guest selector)
router.get('/public', asyncHandler(async (_req: Request, res: Response) => {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      tag: true,
      categories: true,
      color: true,
      logoUrl: true,
    },
    orderBy: { name: 'asc' }
  })
  return success(res, teams)
}))

// List all teams with player & event counts
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const teams = await prisma.team.findMany({
    include: {
      _count: {
        select: {
          players: true,
          users: true,
          events: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })
  return success(res, teams)
}))

// Get team by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (isNaN(id)) return validationError(res, 'Invalid team ID')
  
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: {
        orderBy: { number: 'asc' }
      },
      _count: {
        select: {
          events: true,
          users: true
        }
      }
    }
  })
  if (!team) return notFound(res, 'Team not found')
  return success(res, team)
}))

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  tag: z.string().optional().nullable(),
  categories: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
})

// Create team (Admin & Directiva)
router.post('/', requireRole(['admin', 'directiva']), asyncHandler(async (req: Request, res: Response) => {
  const parsed = createTeamSchema.safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid team data', parsed.error.issues)
  }
  const team = await prisma.team.create({ data: parsed.data })
  const audit = createAuditHelper(req)
  await audit.log('CREATE', 'Team', team.id, { name: team.name })
  return created(res, team)
}))

// Update team
router.put('/:id', requireRole(['admin', 'directiva']), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (isNaN(id)) return validationError(res, 'Invalid team ID')
  
  const parsed = createTeamSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    return validationError(res, 'Invalid team data', parsed.error.issues)
  }
  
  const existing = await prisma.team.findUnique({ where: { id } })
  if (!existing) return notFound(res, 'Team not found')
  
  const team = await prisma.team.update({
    where: { id },
    data: parsed.data
  })
  
  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'Team', team.id, { changes: Object.keys(parsed.data) })
  return updated(res, team)
}))

export { router as teamsRouter }
