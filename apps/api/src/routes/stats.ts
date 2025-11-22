import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success } from '../lib/response.js'

const router = Router()

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Dashboard statistics including counts, upcoming events, attendance breakdown, and events by type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 players:
 *                   type: integer
 *                 events:
 *                   type: integer
 *                 messages:
 *                   type: integer
 *                 upcomingEvents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       startsAt:
 *                         type: string
 *                         format: date-time
 *                       type:
 *                         type: string
 *                 attendance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 eventsByType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       count:
 *                         type: integer
 */
interface AttendanceGroup {
  status: string
  _count: { _all: number }
}

interface EventTypeGroup {
  type: string
  _count: { _all: number }
}

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const [
    players,
    events,
    messages,
    upcomingEvents,
    attendanceTotals,
    eventsByType,
  ] = await Promise.all([
    prisma.player.count(),
    prisma.event.count(),
    prisma.message.count(),
    prisma.event.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 5,
      select: { id: true, title: true, startsAt: true, type: true }
    }),
    prisma.attendance.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.event.groupBy({
      by: ['type'],
      _count: { _all: true },
    }),
  ])

  return success(res, {
    players,
    events,
    messages,
    upcomingEvents,
    attendance: attendanceTotals.map((a: AttendanceGroup) => ({ status: a.status, count: a._count._all })),
    eventsByType: eventsByType.map((e: EventTypeGroup) => ({ type: e.type, count: e._count._all })),
  })
}))

export default router
