import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { success } from '../lib/response.js';
const router = Router();
router.get('/', asyncHandler(async (_req, res) => {
    // Ejecutar todas las queries en paralelo para mejor performance
    const [players, events, messages, upcomingEvents, attendanceTotals, eventsByType,] = await Promise.all([
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
    ]);
    return success(res, {
        players,
        events,
        messages,
        upcomingEvents,
        attendance: attendanceTotals.map((a) => ({ status: a.status, count: a._count._all })),
        eventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count._all })),
    });
}));
export default router;
