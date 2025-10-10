import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
const router = Router();
router.get('/', async (_req, res) => {
    try {
        const [players, events, messages] = await Promise.all([
            prisma.player.count(),
            prisma.event.count(),
            prisma.message.count(),
        ]);
        // Attendance breakdown and upcoming events
        const upcomingEvents = await prisma.event.findMany({
            where: { startsAt: { gte: new Date() } },
            orderBy: { startsAt: 'asc' },
            take: 5,
            select: { id: true, title: true, startsAt: true, type: true }
        });
        const attendanceTotals = await prisma.attendance.groupBy({
            by: ['status'],
            _count: { _all: true },
        });
        // Events by type
        const eventsByType = await prisma.event.groupBy({
            by: ['type'],
            _count: { _all: true },
        });
        res.json({
            players,
            events,
            messages,
            upcomingEvents,
            attendance: attendanceTotals.map((a) => ({ status: a.status, count: a._count._all })),
            eventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count._all })),
        });
    }
    catch (e) {
        res.status(500).json({ error: e?.message || 'stats failed' });
    }
});
export default router;
