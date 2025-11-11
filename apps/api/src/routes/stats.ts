import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

interface AttendanceGroup {
  status: string
  _count: { _all: number }
}

interface EventTypeGroup {
  type: string
  _count: { _all: number }
}

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const [players, events, messages] = await Promise.all([
    prisma.player.count(),
    prisma.event.count(),
    prisma.message.count(),
  ])

  // Attendance breakdown and upcoming events
  const upcomingEvents = await prisma.event.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    take: 5,
    select: { id: true, title: true, startsAt: true, type: true }
  })

  const attendanceTotals = await prisma.attendance.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  // Events by type
  const eventsByType = await prisma.event.groupBy({
    by: ['type'],
    _count: { _all: true },
  })

  res.json({
    players,
    events,
    messages,
    upcomingEvents,
    attendance: attendanceTotals.map((a: AttendanceGroup) => ({ status: a.status, count: a._count._all })),
    eventsByType: eventsByType.map((e: EventTypeGroup) => ({ type: e.type, count: e._count._all })),
  })
}))

export default router
