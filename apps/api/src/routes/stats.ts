import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, unauthorized, notFound } from '../lib/response.js'
import { isGuestRequest, GUEST_PLAYERS, GUEST_EVENTS, GUEST_MATCH_STATS, GUEST_EVENT_ANNOTATIONS } from '../lib/guestDemoData.js'

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

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  if (isGuestRequest(req)) {
    return success(res, {
      players: GUEST_PLAYERS.length,
      events: GUEST_EVENTS.length,
      messages: 0,
      upcomingEvents: GUEST_EVENTS.filter(e => e.status === 'UPCOMING'),
      attendance: [
        { status: 'present', count: 22 },
        { status: 'late', count: 1 },
        { status: 'absent', count: 2 },
      ],
      eventsByType: [
        { type: 'TOURNAMENT', count: 2 },
        { type: 'TRAINING', count: 1 },
        { type: 'WORKSHOP', count: 1 },
      ],
      activePlayers: 11,
      completedEvents: 2,
      viewType: 'guest' as const,
    })
  }

  // Try to get user from token if present (optional auth)
  let u = (req as Request & { user?: { sub: string } }).user
  if (!u?.sub) {
    // Try to extract token from header if not already set
    const auth = req.headers.authorization || ''
    const [, token] = auth.split(' ')
    if (token) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
        u = jwt.verify(token, JWT_SECRET) as any
        ;(req as any).user = u
      } catch (err) {
        // Invalid token, treat as guest
        u = undefined
      }
    }
  }
  
  if (!u?.sub) {
    // For unauthenticated requests, return basic public stats (guest view)
    try {
      const [players, events, upcomingEvents, eventsByType] = await Promise.all([
        prisma.player.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
        prisma.event.count({ where: { status: { not: 'CANCELLED' } } }).catch(() => 0),
        prisma.event.findMany({
          where: { 
            startsAt: { gte: new Date() },
            status: { not: 'CANCELLED' }
          },
          orderBy: { startsAt: 'asc' },
          take: 5,
          select: { id: true, title: true, startsAt: true, type: true }
        }).catch(() => []),
        prisma.event.groupBy({
          by: ['type'],
          where: { status: { not: 'CANCELLED' } },
          _count: { _all: true },
        }).catch(() => []),
      ])

      return success(res, {
        players: players || 0,
        events: events || 0,
        messages: 0, // Don't show message count to guests
        upcomingEvents: upcomingEvents || [],
        attendance: [], // Don't show attendance details to guests
        eventsByType: (eventsByType || []).map((e: EventTypeGroup) => ({ type: e.type, count: e._count._all })),
        viewType: 'guest' as const,
      })
    } catch (error) {
      // If database is empty or has errors, return empty stats
      return success(res, {
        players: 0,
        events: 0,
        messages: 0,
        upcomingEvents: [],
        attendance: [],
        eventsByType: [],
        viewType: 'guest' as const,
      })
    }
  }

  const userId = Number(u.sub)
  if (!userId || isNaN(userId)) {
    return unauthorized(res, 'Invalid user ID')
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
  })

  if (!user) {
    return unauthorized(res, 'User not found')
  }

  const userRoles: string[] = []
  if (user.roles && Array.isArray(user.roles)) {
    for (const userRole of user.roles) {
      if (userRole && userRole.role && userRole.role.name) {
        userRoles.push(userRole.role.name)
      }
    }
  }

  const isAdmin = userRoles.includes('admin')
  const isPlayer = userRoles.includes('player') // Only check role, not playerId
  const isGuestRole = userRoles.includes('guest')
  const hasPlayerLink = !!user.playerId
  const isAdminAndPlayer = isAdmin && isPlayer && hasPlayerLink
  // Jugador de refuerzo: tiene playerId pero sólo rol guest (sin rol player/admin)
  const isReinforcement = isGuestRole && hasPlayerLink && !isPlayer && !isAdmin

  if (isAdminAndPlayer) {
    // Admin who is also a player: Global admin stats + Personal player stats
    try {
      const [
        players,
        events,
        messages,
        upcomingEvents,
        attendanceTotals,
        eventsByType,
        activePlayers,
        completedEvents,
        playerAttendances,
        playerEvents,
      ] = await Promise.all([
        prisma.player.count().catch(() => 0),
        prisma.event.count().catch(() => 0),
        prisma.message.count().catch(() => 0),
        prisma.event.findMany({
          where: { startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' },
          take: 5,
          select: { id: true, title: true, startsAt: true, type: true }
        }).catch(() => []),
        prisma.attendance.groupBy({
          by: ['status'],
          _count: { _all: true },
        }).catch(() => []),
        prisma.event.groupBy({
          by: ['type'],
          _count: { _all: true },
        }).catch(() => []),
        prisma.player.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
        prisma.event.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
        prisma.attendance.findMany({
          where: { playerId: user.playerId! },
          select: { status: true }
        }).catch(() => []),
        prisma.eventParticipant.findMany({
          where: { playerId: user.playerId! },
          include: { event: { select: { status: true } } }
        }).catch(() => []),
      ])

      const attendanceCounts = (playerAttendances || []).reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const eventsAttended = (playerAttendances || []).filter(a => a.status === 'present').length
      const eventsParticipated = (playerEvents || []).length
      const playerCompletedEvents = (playerEvents || []).filter(ep => ep.event?.status === 'COMPLETED').length
      const attendanceRate = playerCompletedEvents > 0 ? Math.round((eventsAttended / playerCompletedEvents) * 100) : 0

      return success(res, {
        players: players || 0,
        events: events || 0,
        messages: messages || 0,
        upcomingEvents: upcomingEvents || [],
        attendance: (attendanceTotals || []).map((a: AttendanceGroup) => ({ status: a.status, count: a._count._all })),
        eventsByType: (eventsByType || []).map((e: EventTypeGroup) => ({ type: e.type, count: e._count._all })),
        activePlayers: activePlayers || 0,
        completedEvents: completedEvents || 0,
        viewType: 'admin' as const,
        personalStats: {
          eventsAttended,
          eventsParticipated,
          completedEvents: playerCompletedEvents,
          attendanceRate,
        },
      })
    } catch (error) {
      return success(res, {
        players: 0,
        events: 0,
        messages: 0,
        upcomingEvents: [],
        attendance: [],
        eventsByType: [],
        activePlayers: 0,
        completedEvents: 0,
        viewType: 'admin' as const,
        personalStats: {
          eventsAttended: 0,
          eventsParticipated: 0,
          completedEvents: 0,
          attendanceRate: 0,
        },
      })
    }
  } else if (isAdmin) {
    // Admin (not a player): Full global statistics only
    try {
      const [
        players,
        events,
        messages,
        upcomingEvents,
        attendanceTotals,
        eventsByType,
        activePlayers,
        completedEvents,
      ] = await Promise.all([
        prisma.player.count().catch(() => 0),
        prisma.event.count().catch(() => 0),
        prisma.message.count().catch(() => 0),
        prisma.event.findMany({
          where: { startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' },
          take: 5,
          select: { id: true, title: true, startsAt: true, type: true }
        }).catch(() => []),
        prisma.attendance.groupBy({
          by: ['status'],
          _count: { _all: true },
        }).catch(() => []),
        prisma.event.groupBy({
          by: ['type'],
          _count: { _all: true },
        }).catch(() => []),
        prisma.player.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
        prisma.event.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      ])

      return success(res, {
        players: players || 0,
        events: events || 0,
        messages: messages || 0,
        upcomingEvents: upcomingEvents || [],
        attendance: (attendanceTotals || []).map((a: AttendanceGroup) => ({ status: a.status, count: a._count._all })),
        eventsByType: (eventsByType || []).map((e: EventTypeGroup) => ({ type: e.type, count: e._count._all })),
        activePlayers: activePlayers || 0,
        completedEvents: completedEvents || 0,
        viewType: 'admin' as const,
      })
    } catch (error) {
      return success(res, {
        players: 0,
        events: 0,
        messages: 0,
        upcomingEvents: [],
        attendance: [],
        eventsByType: [],
        activePlayers: 0,
        completedEvents: 0,
        viewType: 'admin' as const,
      })
    }
  } else if (isPlayer && user.playerId) {
    // Player: Personal statistics + basic global stats
    try {
      const [
        globalPlayers,
        globalEvents,
        upcomingEvents,
        eventsByType,
        playerAttendances,
        playerEvents,
        playerStats,
      ] = await Promise.all([
        prisma.player.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
        prisma.event.count({ where: { status: { not: 'CANCELLED' } } }).catch(() => 0),
        prisma.event.findMany({
          where: { 
            startsAt: { gte: new Date() },
            status: { not: 'CANCELLED' }
          },
          orderBy: { startsAt: 'asc' },
          take: 5,
          select: { id: true, title: true, startsAt: true, type: true }
        }).catch(() => []),
        prisma.event.groupBy({
          by: ['type'],
          where: { status: { not: 'CANCELLED' } },
          _count: { _all: true },
        }).catch(() => []),
        prisma.attendance.findMany({
          where: { playerId: user.playerId },
          select: { status: true }
        }).catch(() => []),
        prisma.eventParticipant.findMany({
          where: { playerId: user.playerId },
          include: { event: { select: { status: true } } }
        }).catch(() => []),
        prisma.player.findUnique({
          where: { id: user.playerId },
          select: {
            id: true,
            name: true,
            number: true,
          }
        }).catch(() => null),
      ])

      const attendanceCounts = (playerAttendances || []).reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const eventsAttended = (playerAttendances || []).filter(a => a.status === 'present').length
      const eventsParticipated = (playerEvents || []).length
      const completedEvents = (playerEvents || []).filter(ep => ep.event?.status === 'COMPLETED').length
      const attendanceRate = completedEvents > 0 ? Math.round((eventsAttended / completedEvents) * 100) : 0

      return success(res, {
        players: globalPlayers || 0,
        events: globalEvents || 0,
        messages: 0, // Don't show message count to players
        upcomingEvents: upcomingEvents || [],
        attendance: Object.entries(attendanceCounts).map(([status, count]) => ({ status, count })),
        eventsByType: (eventsByType || []).map((e: EventTypeGroup) => ({ type: e.type, count: e._count._all })),
        personalStats: {
          eventsAttended,
          eventsParticipated,
          completedEvents,
          attendanceRate,
        },
        viewType: 'player' as const,
      })
    } catch (error) {
      // If database is empty or has errors, return empty stats
      return success(res, {
        players: 0,
        events: 0,
        messages: 0,
        upcomingEvents: [],
        attendance: [],
        eventsByType: [],
        personalStats: {
          eventsAttended: 0,
          eventsParticipated: 0,
          completedEvents: 0,
          attendanceRate: 0,
        },
        viewType: 'player' as const,
      })
    }
  } else if (isReinforcement && user.playerId) {
    // Jugador de refuerzo (guest con playerId): estadísticas personales pero sin vista de administración
    try {
      const [
        globalPlayers,
        globalEvents,
        upcomingEvents,
        eventsByType,
        playerAttendances,
        playerEvents,
      ] = await Promise.all([
        prisma.player.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
        prisma.event.count({ where: { status: { not: 'CANCELLED' } } }).catch(() => 0),
        prisma.event.findMany({
          where: { 
            startsAt: { gte: new Date() },
            status: { not: 'CANCELLED' }
          },
          orderBy: { startsAt: 'asc' },
          take: 5,
          select: { id: true, title: true, startsAt: true, type: true }
        }).catch(() => []),
        prisma.event.groupBy({
          by: ['type'],
          where: { status: { not: 'CANCELLED' } },
          _count: { _all: true },
        }).catch(() => []),
        prisma.attendance.findMany({
          where: { playerId: user.playerId },
          select: { status: true }
        }).catch(() => []),
        prisma.eventParticipant.findMany({
          where: { playerId: user.playerId },
          include: { event: { select: { status: true } } }
        }).catch(() => []),
      ])

      const attendanceCounts = (playerAttendances || []).reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const eventsAttended = (playerAttendances || []).filter(a => a.status === 'present').length
      const eventsParticipated = (playerEvents || []).length
      const completedEvents = (playerEvents || []).filter(ep => ep.event?.status === 'COMPLETED').length
      const attendanceRate = completedEvents > 0 ? Math.round((eventsAttended / completedEvents) * 100) : 0

      return success(res, {
        players: globalPlayers || 0,
        events: globalEvents || 0,
        messages: 0,
        upcomingEvents: upcomingEvents || [],
        attendance: Object.entries(attendanceCounts).map(([status, count]) => ({ status, count })),
        eventsByType: (eventsByType || []).map((e: EventTypeGroup) => ({ type: e.type, count: e._count._all })),
        personalStats: {
          eventsAttended,
          eventsParticipated,
          completedEvents,
          attendanceRate,
        },
        // viewType separado para distinguir en frontend si se desea
        viewType: 'reinforcement' as 'guest',
      })
    } catch (error) {
      return success(res, {
        players: 0,
        events: 0,
        messages: 0,
        upcomingEvents: [],
        attendance: [],
        eventsByType: [],
        personalStats: {
          eventsAttended: 0,
          eventsParticipated: 0,
          completedEvents: 0,
          attendanceRate: 0,
        },
        viewType: 'reinforcement' as 'guest',
      })
    }
  } else {
    // Guest sin playerId: estadísticas públicas básicas únicamente
    try {
      const [players, events, upcomingEvents, eventsByType] = await Promise.all([
        prisma.player.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
        prisma.event.count({ where: { status: { not: 'CANCELLED' } } }).catch(() => 0),
        prisma.event.findMany({
          where: { 
            startsAt: { gte: new Date() },
            status: { not: 'CANCELLED' }
          },
          orderBy: { startsAt: 'asc' },
          take: 5,
          select: { id: true, title: true, startsAt: true, type: true }
        }).catch(() => []),
        prisma.event.groupBy({
          by: ['type'],
          where: { status: { not: 'CANCELLED' } },
          _count: { _all: true },
        }).catch(() => []),
      ])

      return success(res, {
        players: players || 0,
        events: events || 0,
        messages: 0,
        upcomingEvents: upcomingEvents || [],
        attendance: [],
        eventsByType: (eventsByType || []).map((e: EventTypeGroup) => ({ type: e.type, count: e._count._all })),
        viewType: 'guest' as const,
      })
    } catch (error) {
      // If database is empty or has errors, return empty stats
      return success(res, {
        players: 0,
        events: 0,
        messages: 0,
        upcomingEvents: [],
        attendance: [],
        eventsByType: [],
        viewType: 'guest' as const,
      })
    }
  }
}))

router.get('/tournament/:id', asyncHandler(async (req: Request, res: Response) => {
  const tournamentId = Number(req.params.id);
  if (isNaN(tournamentId)) return unauthorized(res, 'Invalid tournament ID');

  if (isGuestRequest(req)) {
    const guestEvent = GUEST_EVENTS.find(e => e.id === tournamentId) || GUEST_EVENTS[0];
    const annotations = GUEST_EVENT_ANNOTATIONS.filter(a => a.eventId === tournamentId || tournamentId === 101);
    
    const totalGoals = annotations.filter(a => a.type === 'GOAL').length || 15;
    const totalAssists = annotations.filter(a => a.type === 'ASSIST').length || 12;
    const totalDefenses = annotations.filter(a => a.type === 'DEFENSE').length || 10;
    const totalTurnovers = annotations.filter(a => a.type === 'TURNOVER').length || 6;

    const playerStatsMap = new Map<number, any>();
    GUEST_PLAYERS.slice(0, 10).forEach(p => {
      const pGoals = annotations.filter(a => a.playerId === p.id && a.type === 'GOAL').length;
      const pAssists = annotations.filter(a => a.playerId === p.id && a.type === 'ASSIST').length;
      const pDefenses = annotations.filter(a => a.playerId === p.id && a.type === 'DEFENSE').length;
      const pTurnovers = annotations.filter(a => a.playerId === p.id && a.type === 'TURNOVER').length;
      
      const g = pGoals || (p.id === 1 ? 5 : p.id === 2 ? 4 : p.id === 3 ? 2 : 1);
      const a = pAssists || (p.id === 1 ? 3 : p.id === 2 ? 4 : p.id === 4 ? 3 : 0);
      const d = pDefenses || (p.id === 7 ? 4 : p.id === 9 ? 3 : 1);
      const t = pTurnovers || (p.id === 5 ? 2 : 0);
      const mvp = Number((g * 1.5 + a * 1.2 + d * 2.0 - t * 0.8).toFixed(1));

      playerStatsMap.set(p.id, {
        playerId: p.id,
        playerName: p.name,
        playerNumber: p.number,
        goals: g,
        assists: a,
        defenses: d,
        turnovers: t,
        mvpScore: mvp,
        pointsPlayed: g + a + d + t + 4,
      });
    });

    const playerStats = Array.from(playerStatsMap.values()).sort((a, b) => b.mvpScore - a.mvpScore);

    return success(res, {
      event: {
        id: guestEvent.id,
        title: guestEvent.title,
        type: guestEvent.type,
        status: guestEvent.status,
        date: guestEvent.date,
        location: guestEvent.location,
      },
      matchesPlayed: 4,
      goals: totalGoals,
      assists: totalAssists,
      defenses: totalDefenses,
      turnovers: totalTurnovers,
      playerStats,
      matchesList: [
        { id: 101, title: 'Fase de Grupos - vs Dragones', opponent: 'Dragones Ultimate Club', scoreHome: 15, scoreAway: 11, status: 'COMPLETED', category: 'GROUP_STAGE' },
        { id: 102, title: 'Semifinal - vs Tiburones', opponent: 'Tiburones de la Bahía', scoreHome: 15, scoreAway: 13, status: 'COMPLETED', category: 'SEMI_FINALS' },
        { id: 103, title: 'Gran Final - vs Cóndores', opponent: 'Cóndores Voladores', scoreHome: 15, scoreAway: 14, status: 'COMPLETED', category: 'FINALS' },
      ],
      spiritStats: {
        overallAverage: 18.4,
        maxScore: 20,
        breakdown: {
          rulesKnowledge: 3.8,
          foulsAndContact: 3.7,
          fairMindedness: 3.9,
          positiveAttitude: 3.6,
          communication: 3.4,
        }
      },
      mesaTecnica: {
        members: [
          { playerId: 1, playerName: 'Franco Rivas', roleLabel: 'Director de Mesa', isPlayer: true },
          { playerId: 2, playerName: 'Valeria Mendoza', roleLabel: 'Planillero Oficial', isPlayer: true },
          { playerId: 10, playerName: 'Valentina Rojas', roleLabel: 'Veedor SOTG', isPlayer: true },
        ],
        annotatorsAudit: [
          { id: 1, name: 'Franco Rivas', email: 'franco@sigedivo.com', annotationsCount: 15 },
          { id: 2, name: 'Valeria Mendoza', email: 'valeria@sigedivo.com', annotationsCount: 8 },
        ]
      }
    });
  }

  // 1. Fetch main event and any sub-matches (children)
  const targetEvent = await prisma.event.findUnique({
    where: { id: tournamentId },
    include: {
      team: { select: { id: true, name: true, color: true } },
      awayTeam: { select: { id: true, name: true, color: true } },
      officialAnnotator: { select: { id: true, name: true, email: true } },
      children: {
        include: {
          team: { select: { id: true, name: true, color: true } },
          awayTeam: { select: { id: true, name: true, color: true } },
          officialAnnotator: { select: { id: true, name: true, email: true } },
        }
      },
      participants: {
        where: {
          OR: [
            { role: { startsWith: 'MESA' } },
            { role: { in: ['DIRECTOR_MESA', 'PLANILLERO_ANOTADOR', 'CRONOMETRISTA', 'VEEDOR_ESPIRITU', 'DELEGADO_CAMPO', 'STAFF_MESA'] } }
          ]
        },
        include: {
          player: { select: { id: true, name: true, number: true } }
        }
      }
    }
  });

  if (!targetEvent) return notFound(res, 'Event not found');

  const matchIds = targetEvent.children && targetEvent.children.length > 0
    ? [targetEvent.id, ...targetEvent.children.map(c => c.id)]
    : [targetEvent.id];

  // 2. Fetch all annotations and players/teams for these matches
  const allTeams = await prisma.team.findMany().catch(() => []);
  const teamLookup = new Map<number, any>(allTeams.map(t => [t.id, t]));

  const annotations = await prisma.eventAnnotation.findMany({
    where: { eventId: { in: matchIds } },
    include: {
      player: { select: { id: true, name: true, number: true, teamId: true } },
      createdByUser: { select: { id: true, name: true, email: true } }
    },
    orderBy: { timestamp: 'asc' }
  });

  // 3. Aggregate player stats
  const playerStatsMap = new Map<number, {
    playerId: number;
    playerName: string;
    playerNumber: number;
    teamId?: number | null;
    teamName?: string;
    teamColor?: string;
    isRefuerzo?: boolean;
    goals: number;
    assists: number;
    defenses: number;
    turnovers: number;
    mvpScore: number;
    pointsPlayed: number;
  }>();

  for (const ann of annotations) {
    if (ann.player) {
      let stat = playerStatsMap.get(ann.player.id);
      if (!stat) {
        const playerTeam = ann.player.teamId ? teamLookup.get(ann.player.teamId) : null;
        stat = {
          playerId: ann.player.id,
          playerName: ann.player.name,
          playerNumber: ann.player.number,
          teamId: ann.player.teamId,
          teamName: playerTeam?.name || (ann.player.teamId ? `Equipo ${ann.player.teamId}` : 'Agente Libre / Refuerzo'),
          teamColor: playerTeam?.color || '#64748b',
          isRefuerzo: !ann.player.teamId || ann.isRefuerzo || false,
          goals: 0,
          assists: 0,
          defenses: 0,
          turnovers: 0,
          mvpScore: 0,
          pointsPlayed: 0,
        };
        playerStatsMap.set(ann.player.id, stat);
      }

      if (ann.type === 'GOAL') stat.goals += 1;
      else if (ann.type === 'ASSIST') stat.assists += 1;
      else if (ann.type === 'DEFENSE') stat.defenses += 1;
      else if (ann.type === 'TURNOVER') stat.turnovers += 1;
      if (ann.isRefuerzo) stat.isRefuerzo = true;
    }
  }

  // Also include participants from the event who may not have scored yet
  if (targetEvent.participants && targetEvent.participants.length > 0) {
    for (const p of targetEvent.participants) {
      if (p.player && !playerStatsMap.has(p.player.id)) {
        const playerTeam = p.player.teamId ? teamLookup.get(p.player.teamId) : null;
        playerStatsMap.set(p.player.id, {
          playerId: p.player.id,
          playerName: p.player.name,
          playerNumber: p.player.number,
          teamId: p.player.teamId,
          teamName: playerTeam?.name || (p.player.teamId ? `Equipo ${p.player.teamId}` : 'Agente Libre / Refuerzo'),
          teamColor: playerTeam?.color || '#64748b',
          isRefuerzo: !p.player.teamId || p.isRefuerzo || false,
          goals: 0,
          assists: 0,
          defenses: 0,
          turnovers: 0,
          mvpScore: 0,
          pointsPlayed: 0,
        });
      }
    }
  }

  // Compute MVP rating for each player
  const playerStats = Array.from(playerStatsMap.values()).map(s => {
    const mvp = Number((s.goals * 1.5 + s.assists * 1.2 + s.defenses * 2.0 - s.turnovers * 0.8).toFixed(1));
    return {
      ...s,
      mvpScore: mvp,
      pointsPlayed: s.goals + s.assists + s.defenses + s.turnovers
    };
  }).sort((a, b) => b.mvpScore - a.mvpScore || (b.goals + b.assists) - (a.goals + a.assists));

  const totalGoals = playerStats.reduce((acc, curr) => acc + curr.goals, 0);
  const totalAssists = playerStats.reduce((acc, curr) => acc + curr.assists, 0);
  const totalDefenses = playerStats.reduce((acc, curr) => acc + curr.defenses, 0);
  const totalTurnovers = playerStats.reduce((acc, curr) => acc + curr.turnovers, 0);

  // 4. Matches breakdown with latest scores
  const allMatchEvents = [targetEvent, ...(targetEvent.children || [])];
  const matchesList = allMatchEvents.map(m => {
    const mAnn = annotations.filter(a => a.eventId === m.id);
    const lastAnn = mAnn[mAnn.length - 1];
    const scoreHome = lastAnn?.scoreHome ?? mAnn.filter(a => a.type === 'GOAL' && (!a.teamSide || a.teamSide === 'HOME')).length;
    const scoreAway = lastAnn?.scoreAway ?? mAnn.filter(a => a.type === 'GOAL' && a.teamSide === 'AWAY').length;

    return {
      id: m.id,
      title: m.title,
      homeTeamId: m.teamId,
      homeTeamName: m.team?.name || 'Equipo Local',
      homeTeamColor: m.team?.color || '#1E40AF',
      awayTeamId: m.awayTeamId,
      awayTeamName: m.awayTeam?.name || (m.isInternalScrimmage ? 'Escuadra Oscura' : 'Equipo Rival'),
      awayTeamColor: m.awayTeam?.color || '#E11D48',
      opponent: m.awayTeam?.name || (m.isInternalScrimmage ? 'Escuadra Oscura' : 'Equipo Rival'),
      scoreHome,
      scoreAway,
      status: m.status,
      category: m.matchCategory || 'MATCH',
      startsAt: m.startsAt,
      location: m.location,
    };
  });

  // Calculate Team Standings Table
  const teamStandingsMap = new Map<number, {
    teamId: number;
    teamName: string;
    teamColor: string;
    matchesPlayed: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
  }>();

  const ensureTeamStanding = (tId: number, defaultName?: string, defaultColor?: string) => {
    let standing = teamStandingsMap.get(tId);
    if (!standing) {
      const tInfo = teamLookup.get(tId);
      standing = {
        teamId: tId,
        teamName: tInfo?.name || defaultName || `Equipo ${tId}`,
        teamColor: tInfo?.color || defaultColor || '#3B82F6',
        matchesPlayed: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      };
      teamStandingsMap.set(tId, standing);
    }
    return standing;
  };

  // Seed with all known tournament teams
  allTeams.forEach(t => ensureTeamStanding(t.id, t.name, t.color));

  for (const m of matchesList) {
    if (m.homeTeamId && m.awayTeamId && (m.scoreHome > 0 || m.scoreAway > 0 || m.status === 'COMPLETED')) {
      const homeStanding = ensureTeamStanding(m.homeTeamId, m.homeTeamName, m.homeTeamColor);
      const awayStanding = ensureTeamStanding(m.awayTeamId, m.awayTeamName, m.awayTeamColor);

      homeStanding.matchesPlayed += 1;
      awayStanding.matchesPlayed += 1;
      homeStanding.goalsFor += m.scoreHome;
      homeStanding.goalsAgainst += m.scoreAway;
      awayStanding.goalsFor += m.scoreAway;
      awayStanding.goalsAgainst += m.scoreHome;

      if (m.scoreHome > m.scoreAway) {
        homeStanding.won += 1;
        homeStanding.points += 3;
        awayStanding.lost += 1;
      } else if (m.scoreAway > m.scoreHome) {
        awayStanding.won += 1;
        awayStanding.points += 3;
        homeStanding.lost += 1;
      } else {
        homeStanding.drawn += 1;
        homeStanding.points += 1;
        awayStanding.drawn += 1;
        awayStanding.points += 1;
      }
    }
  }

  const teamStandings = Array.from(teamStandingsMap.values()).map(st => ({
    ...st,
    goalDiff: st.goalsFor - st.goalsAgainst
  })).sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);

  // 5. Spirit of the game (SOTG)
  const spiritScores = await prisma.spiritScore.findMany({
    where: { eventId: { in: matchIds } }
  }).catch(() => []);

  let spiritStats = {
    overallAverage: 17.5,
    maxScore: 20,
    breakdown: {
      rulesKnowledge: 3.5,
      foulsAndContact: 3.5,
      fairMindedness: 3.5,
      positiveAttitude: 3.5,
      communication: 3.5,
    }
  };

  if (spiritScores.length > 0) {
    const count = spiritScores.length;
    const avgRules = spiritScores.reduce((acc, s) => acc + s.rulesKnowledge, 0) / count;
    const avgFouls = spiritScores.reduce((acc, s) => acc + s.foulsAndContact, 0) / count;
    const avgFair = spiritScores.reduce((acc, s) => acc + s.fairMindedness, 0) / count;
    const avgAttitude = spiritScores.reduce((acc, s) => acc + s.positiveAttitude, 0) / count;
    const avgComm = spiritScores.reduce((acc, s) => acc + s.communication, 0) / count;
    const totalAvg = avgRules + avgFouls + avgFair + avgAttitude + avgComm;

    spiritStats = {
      overallAverage: Number(totalAvg.toFixed(1)),
      maxScore: 20,
      breakdown: {
        rulesKnowledge: Number(avgRules.toFixed(1)),
        foulsAndContact: Number(avgFouls.toFixed(1)),
        fairMindedness: Number(avgFair.toFixed(1)),
        positiveAttitude: Number(avgAttitude.toFixed(1)),
        communication: Number(avgComm.toFixed(1)),
      }
    };
  }

  // 6. Mesa técnica staff and audit
  const roleLabelMap: Record<string, string> = {
    DIRECTOR_MESA: 'Director de Mesa',
    PLANILLERO_ANOTADOR: 'Planillero Oficial',
    CRONOMETRISTA: 'Cronometrista de Campo',
    VEEDOR_ESPIRITU: 'Veedor SOTG',
    DELEGADO_CAMPO: 'Delegado de Campo',
    STAFF_MESA: 'Mesa Técnica',
  };

  const mesaMembers = targetEvent.participants.map(p => ({
    playerId: p.playerId,
    playerName: p.player?.name || 'Miembro Mesa',
    playerNumber: p.player?.number || 0,
    role: p.role || 'STAFF_MESA',
    roleLabel: roleLabelMap[p.role || ''] || p.role || 'Mesa Técnica',
    isPlayer: true,
  }));

  const annotatorsMap = new Map<number, { id: number; name: string; email: string; annotationsCount: number }>();
  for (const ann of annotations) {
    if (ann.createdByUser) {
      const ex = annotatorsMap.get(ann.createdByUser.id);
      if (ex) {
        ex.annotationsCount += 1;
      } else {
        annotatorsMap.set(ann.createdByUser.id, {
          id: ann.createdByUser.id,
          name: ann.createdByUser.name || ann.createdByUser.email,
          email: ann.createdByUser.email,
          annotationsCount: 1
        });
      }
    }
  }

  return success(res, {
    event: {
      id: targetEvent.id,
      title: targetEvent.title,
      type: targetEvent.type,
      status: targetEvent.status,
      startsAt: targetEvent.startsAt,
      endsAt: targetEvent.endsAt,
      location: targetEvent.location,
      isAnnotatorLocked: targetEvent.isAnnotatorLocked,
      officialAnnotator: targetEvent.officialAnnotator,
    },
    matchesPlayed: matchesList.length,
    goals: totalGoals,
    assists: totalAssists,
    defenses: totalDefenses,
    turnovers: totalTurnovers,
    playerStats,
    matchesList,
    teamStandings,
    spiritStats,
    mesaTecnica: {
      officialAnnotator: targetEvent.officialAnnotator,
      members: mesaMembers,
      annotatorsAudit: Array.from(annotatorsMap.values())
    }
  });
}));

export default router
