import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { success, unauthorized } from '../lib/response.js';
import { requireAuth } from './auth.js';
const router = Router();
router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const u = req.user;
    if (!u?.sub) {
        // For unauthenticated requests, return basic public stats (guest view)
        const [players, events, upcomingEvents, eventsByType] = await Promise.all([
            prisma.player.count({ where: { status: 'ACTIVE' } }),
            prisma.event.count({ where: { status: { not: 'CANCELLED' } } }),
            prisma.event.findMany({
                where: {
                    startsAt: { gte: new Date() },
                    status: { not: 'CANCELLED' }
                },
                orderBy: { startsAt: 'asc' },
                take: 5,
                select: { id: true, title: true, startsAt: true, type: true }
            }),
            prisma.event.groupBy({
                by: ['type'],
                where: { status: { not: 'CANCELLED' } },
                _count: { _all: true },
            }),
        ]);
        return success(res, {
            players,
            events,
            messages: 0, // Don't show message count to guests
            upcomingEvents,
            attendance: [], // Don't show attendance details to guests
            eventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count._all })),
            viewType: 'guest',
        });
    }
    const userId = Number(u.sub);
    if (!userId || isNaN(userId)) {
        return unauthorized(res, 'Invalid user ID');
    }
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            roles: {
                include: {
                    role: {
                        select: { name: true }
                    }
                }
            }
        }
    });
    if (!user) {
        return unauthorized(res, 'User not found');
    }
    const userRoles = [];
    if (user.roles && Array.isArray(user.roles)) {
        for (const userRole of user.roles) {
            if (userRole && userRole.role && userRole.role.name) {
                userRoles.push(userRole.role.name);
            }
        }
    }
    const isAdmin = userRoles.includes('admin');
    const isPlayer = userRoles.includes('player') || !!user.playerId;
    if (isAdmin) {
        // Admin: Full global statistics
        const [players, events, messages, upcomingEvents, attendanceTotals, eventsByType, activePlayers, completedEvents,] = await Promise.all([
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
            prisma.player.count({ where: { status: 'ACTIVE' } }),
            prisma.event.count({ where: { status: 'COMPLETED' } }),
        ]);
        return success(res, {
            players,
            events,
            messages,
            upcomingEvents,
            attendance: attendanceTotals.map((a) => ({ status: a.status, count: a._count._all })),
            eventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count._all })),
            activePlayers,
            completedEvents,
            viewType: 'admin',
        });
    }
    else if (isPlayer && user.playerId) {
        // Player: Personal statistics + basic global stats
        const [globalPlayers, globalEvents, upcomingEvents, eventsByType, playerAttendances, playerEvents, playerStats,] = await Promise.all([
            prisma.player.count({ where: { status: 'ACTIVE' } }),
            prisma.event.count({ where: { status: { not: 'CANCELLED' } } }),
            prisma.event.findMany({
                where: {
                    startsAt: { gte: new Date() },
                    status: { not: 'CANCELLED' }
                },
                orderBy: { startsAt: 'asc' },
                take: 5,
                select: { id: true, title: true, startsAt: true, type: true }
            }),
            prisma.event.groupBy({
                by: ['type'],
                where: { status: { not: 'CANCELLED' } },
                _count: { _all: true },
            }),
            prisma.attendance.findMany({
                where: { playerId: user.playerId },
                select: { status: true }
            }),
            prisma.eventParticipant.findMany({
                where: { playerId: user.playerId },
                include: { event: { select: { status: true } } }
            }),
            prisma.player.findUnique({
                where: { id: user.playerId },
                select: {
                    id: true,
                    name: true,
                    number: true,
                }
            }),
        ]);
        const attendanceCounts = playerAttendances.reduce((acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
        }, {});
        const eventsAttended = playerAttendances.filter(a => a.status === 'present').length;
        const eventsParticipated = playerEvents.length;
        const completedEvents = playerEvents.filter(ep => ep.event.status === 'COMPLETED').length;
        const attendanceRate = completedEvents > 0 ? Math.round((eventsAttended / completedEvents) * 100) : 0;
        return success(res, {
            players: globalPlayers,
            events: globalEvents,
            messages: 0, // Don't show message count to players
            upcomingEvents,
            attendance: Object.entries(attendanceCounts).map(([status, count]) => ({ status, count })),
            eventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count._all })),
            personalStats: {
                eventsAttended,
                eventsParticipated,
                completedEvents,
                attendanceRate,
            },
            viewType: 'player',
        });
    }
    else {
        // Guest: Basic public statistics only
        const [players, events, upcomingEvents, eventsByType] = await Promise.all([
            prisma.player.count({ where: { status: 'ACTIVE' } }),
            prisma.event.count({ where: { status: { not: 'CANCELLED' } } }),
            prisma.event.findMany({
                where: {
                    startsAt: { gte: new Date() },
                    status: { not: 'CANCELLED' }
                },
                orderBy: { startsAt: 'asc' },
                take: 5,
                select: { id: true, title: true, startsAt: true, type: true }
            }),
            prisma.event.groupBy({
                by: ['type'],
                where: { status: { not: 'CANCELLED' } },
                _count: { _all: true },
            }),
        ]);
        return success(res, {
            players,
            events,
            messages: 0,
            upcomingEvents,
            attendance: [],
            eventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count._all })),
            viewType: 'guest',
        });
    }
}));
export default router;
