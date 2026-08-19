import bcrypt from 'bcryptjs';

// Enums
export const PlayerPosition = {
  HANDLER: 'HANDLER',
  CUTTER: 'CUTTER',
  HYBRID: 'HYBRID',
} as const;

export const PlayerStatus = {
  ACTIVE: 'ACTIVE',
  INJURED: 'INJURED',
  INACTIVE: 'INACTIVE',
} as const;

export const EventType = {
  TRAINING: 'TRAINING',
  TOURNAMENT: 'TOURNAMENT',
  SOCIAL: 'SOCIAL',
  WORKSHOP: 'WORKSHOP',
  FULL_DAY_OPEN: 'FULL_DAY_OPEN',
  FULL_DAY_MIXTO: 'FULL_DAY_MIXTO',
  AMISTOSO: 'AMISTOSO',
  MATCH: 'MATCH',
} as const;

export const EventStatus = {
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const InjurySeverity = {
  MILD: 'MILD',
  MODERATE: 'MODERATE',
  SEVERE: 'SEVERE',
} as const;

export const InjuryStatus = {
  ACTIVE: 'ACTIVE',
  RECOVERING: 'RECOVERING',
  RESOLVED: 'RESOLVED',
} as const;

export const PlayCategory = {
  OFFENSE: 'OFFENSE',
  DEFENSE: 'DEFENSE',
  DRILL: 'DRILL',
} as const;

export const AnnotationType = {
  GOAL: 'GOAL',
  ASSIST: 'ASSIST',
  DEFENSE: 'DEFENSE',
  TURNOVER: 'TURNOVER',
  DROP: 'DROP',
} as const;

export const AccountType = {
  CASH: 'CASH',
  BANK: 'BANK',
  MOBILE: 'MOBILE',
} as const;

export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER: 'TRANSFER',
} as const;

// Default password hash for "123456"
const DEFAULT_PW_HASH = bcrypt.hashSync('123456', 10);

class InMemoryDB {
  permissions: any[] = [];
  roles: any[] = [];
  rolePermissions: any[] = [];
  users: any[] = [];
  userRoles: any[] = [];
  players: any[] = [];
  events: any[] = [];
  spiritScores: any[] = [];
  playerMatchStats: any[] = [];
  eventParticipants: any[] = [];
  attendances: any[] = [];
  eventAnnotations: any[] = [];
  accounts: any[] = [];
  categories: any[] = [];
  transactions: any[] = [];
  injuries: any[] = [];
  rivals: any[] = [];
  rivalPlayers: any[] = [];
  plays: any[] = [];
  resources: any[] = [];
  newsPosts: any[] = [];
  newsPostFiles: any[] = [];
  roleRequests: any[] = [];
  auditLogs: any[] = [];
  passwordResetTokens: any[] = [];

  private nextId: Record<string, number> = {};

  constructor() {
    this.seed();
  }

  private getId(table: string): number {
    if (!this.nextId[table]) this.nextId[table] = 1;
    return this.nextId[table]++;
  }

  seed() {
    // 1. Permissions
    const permNames = [
      'roster:view', 'roster:manage',
      'events:view', 'events:manage',
      'attendance:view', 'attendance:manage',
      'finance:view', 'finance:manage',
      'communications:manage',
      'injuries:view', 'injuries:manage',
      'rivals:view', 'rivals:manage',
      'plays:view', 'plays:manage',
      'resources:view', 'resources:manage',
      'users:manage', 'audit:view',
      'statistics:view',
      'annotations:view', 'annotations:manage',
    ];
    this.permissions = permNames.map((name, i) => ({
      id: i + 1,
      name,
      createdAt: new Date(),
    }));
    this.nextId['permission'] = permNames.length + 1;

    // 2. Roles
    const roleNames = ['admin', 'player', 'captain', 'coach', 'treasurer', 'guest'];
    this.roles = roleNames.map((name, i) => ({
      id: i + 1,
      name,
      createdAt: new Date(),
    }));
    this.nextId['role'] = roleNames.length + 1;

    const roleMap = Object.fromEntries(this.roles.map((r) => [r.name, r.id]));
    const permMap = Object.fromEntries(this.permissions.map((p) => [p.name, p.id]));

    const assignPerms = (roleName: string, perms: string[]) => {
      const roleId = roleMap[roleName];
      perms.forEach((p) => {
        if (permMap[p]) {
          this.rolePermissions.push({ roleId, permissionId: permMap[p] });
        }
      });
    };

    assignPerms('admin', permNames);
    assignPerms('player', ['communications:manage', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'attendance:view', 'annotations:view']);
    assignPerms('captain', ['roster:manage', 'events:manage', 'communications:manage', 'injuries:manage', 'rivals:manage', 'plays:manage', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'finance:view', 'attendance:manage', 'attendance:view', 'annotations:view', 'annotations:manage']);
    assignPerms('coach', ['events:manage', 'communications:manage', 'injuries:manage', 'plays:manage', 'resources:manage', 'roster:view', 'injuries:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'attendance:manage', 'attendance:view', 'annotations:view', 'annotations:manage']);
    assignPerms('treasurer', ['finance:manage', 'finance:view', 'roster:view', 'events:view', 'statistics:view']);
    assignPerms('guest', ['events:view', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'statistics:view', 'annotations:view']);

    // 3. Players
    const basePlayers = [
      { id: 1, name: 'Franco Sousa (Capitán)', number: 1, position: 'HANDLER', status: 'ACTIVE', heightCm: 182, experience: '7 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Carlos Mendoza (Capitán Ofensivo)', number: 2, position: 'CUTTER', status: 'ACTIVE', heightCm: 185, experience: '5 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Eduardo Silva (Coach Táctico)', number: 3, position: 'HYBRID', status: 'ACTIVE', heightCm: 178, experience: '8 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: 'Alejandro Ramos (Tesorero)', number: 4, position: 'HANDLER', status: 'ACTIVE', heightCm: 175, experience: '4 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: 'Gabriel Torres (Cutter Titular)', number: 5, position: 'CUTTER', status: 'ACTIVE', heightCm: 188, experience: '3 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: 'Daniel Salazar (Refuerzo)', number: 6, position: 'HYBRID', status: 'ACTIVE', heightCm: 180, experience: '2 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 7, name: 'Marcos Peña (Defensa D-Line)', number: 7, position: 'CUTTER', status: 'ACTIVE', heightCm: 183, experience: '4 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 8, name: 'Luis Navarro (Handler O-Line)', number: 8, position: 'HANDLER', status: 'ACTIVE', heightCm: 176, experience: '5 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 9, name: 'Andrés Gómez (Cutter O-Line)', number: 9, position: 'CUTTER', status: 'ACTIVE', heightCm: 190, experience: '3 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 10, name: 'Ricardo Morales (Deep Handler)', number: 10, position: 'HANDLER', status: 'ACTIVE', heightCm: 181, experience: '6 años en San Juan', createdAt: new Date(), updatedAt: new Date() },
      { id: 11, name: 'Sebastián Blanco', number: 11, position: 'CUTTER', status: 'ACTIVE', heightCm: 184, experience: '2 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 12, name: 'Valentina Rojas', number: 12, position: 'HANDLER', status: 'ACTIVE', heightCm: 168, experience: '3 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 13, name: 'Camila Herrera', number: 13, position: 'CUTTER', status: 'ACTIVE', heightCm: 172, experience: '4 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 14, name: 'Mateo Fernández', number: 14, position: 'HYBRID', status: 'ACTIVE', heightCm: 179, experience: '2 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 15, name: 'Diego Castillo', number: 15, position: 'DEFENSE' as any || 'CUTTER', status: 'INJURED', heightCm: 186, experience: '5 años', createdAt: new Date(), updatedAt: new Date() },
    ];
    this.players = basePlayers;
    this.nextId['player'] = 50;

    // 4. Users
    const coreUsers = [
      { id: 1, email: 'admin@sju.com', name: 'Administrador General', role: 'admin', playerId: 1 },
      { id: 2, email: 'captain@example.com', name: 'Capitán Franco', role: 'captain', playerId: 2 },
      { id: 3, email: 'coach@example.com', name: 'Entrenador Eduardo', role: 'coach', playerId: 3 },
      { id: 4, email: 'treasurer@example.com', name: 'Tesorero Alejandro', role: 'treasurer', playerId: 4 },
      { id: 5, email: 'player@example.com', name: 'Jugador Gabriel', role: 'player', playerId: 5 },
      { id: 6, email: 'guest@example.com', name: 'Invitado / Refuerzo', role: 'guest', playerId: 6 },
    ];

    this.users = coreUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      passwordHash: DEFAULT_PW_HASH,
      status: 'APPROVED',
      playerId: u.playerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    this.nextId['user'] = 20;

    coreUsers.forEach((u) => {
      this.userRoles.push({ userId: u.id, roleId: roleMap[u.role] });
      if (u.role !== 'player' && u.role !== 'guest') {
        this.userRoles.push({ userId: u.id, roleId: roleMap['player'] });
      }
    });

    // 5. Rivales
    const keyRivals = [
      { id: 1, name: 'Caracas Ultimate Club', strengths: 'Lanzadores zurdos rápidos, corte largo profundo', weaknesses: 'Defensa de zona con viento cruzado', lastPlayedAt: new Date(), notes: 'Rival tradicional', createdAt: new Date() },
      { id: 2, name: 'Dragones de Valencia', strengths: 'Físico imponente, dominio aéreo en zona de gol', weaknesses: 'Transiciones lentas en turnover', lastPlayedAt: new Date(), notes: 'Muy fuertes en hucks', createdAt: new Date() },
      { id: 3, name: 'Fénix Ultimate', strengths: 'Marcación hombre a hombre muy asfixiante', weaknesses: 'Poco recambio en banca', lastPlayedAt: new Date(), notes: 'Defensa física', createdAt: new Date() },
      { id: 4, name: 'Guerreros de Maracay', strengths: 'Juego rápido de pases cortos (give and go)', weaknesses: 'Lanzamientos largos inconsistentes', lastPlayedAt: new Date(), notes: 'Mucha velocidad', createdAt: new Date() },
    ];
    this.rivals = keyRivals;
    this.nextId['rival'] = 10;

    this.rivalPlayers = [
      { id: 1, rivalId: 1, name: 'José Alvarado', number: 7, position: 'Handler', notes: 'Lanzador clave', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, rivalId: 1, name: 'Pedro Morales', number: 10, position: 'Cutter', notes: 'Receptor alto', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, rivalId: 2, name: 'Juan Castillo', number: 14, position: 'Hybrid', notes: 'Defensa dura', createdAt: new Date(), updatedAt: new Date() },
    ];
    this.nextId['rivalPlayer'] = 10;

    // 6. Events & Tournament
    const now = Date.now();
    const activeTournament = {
      id: 1,
      title: '🏆 Torneo Nacional Ultimate 2026 - Copa San Juan',
      description: 'Torneo oficial nacional de Ultimate Frisbee con fase de grupos, eliminatorias y finales.',
      type: 'TOURNAMENT',
      status: 'ONGOING',
      location: 'Complejo Deportivo San Juan - Canchas Principales',
      startsAt: new Date(now - 3600000 * 24 * 2),
      endsAt: new Date(now + 3600000 * 24 * 3),
      windSpeed: 12,
      windDirection: 'NE',
      parentId: null,
      matchCategory: null,
      rivalId: null,
      isInternalScrimmage: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const liveMatch = {
      id: 2,
      title: 'San Juan UC vs Caracas Ultimate (EN VIVO - Semifinal)',
      description: 'Partido de semifinales en vivo. Marcador y estadísticas en tiempo real.',
      type: 'AMISTOSO',
      status: 'ONGOING',
      location: 'Cancha 1 (Principal)',
      parentId: 1,
      matchCategory: 'SEMI_FINALS',
      rivalId: 1,
      startsAt: new Date(now - 3600000 * 1),
      endsAt: new Date(now + 3600000 * 1),
      windSpeed: 8,
      windDirection: 'E',
      isInternalScrimmage: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const completedMatch = {
      id: 3,
      title: 'San Juan UC vs Dragones de Valencia (Cuartos de Final)',
      description: 'Victoria de San Juan 15 - 11 para avanzar a semifinales.',
      type: 'AMISTOSO',
      status: 'COMPLETED',
      location: 'Cancha 2',
      parentId: 1,
      matchCategory: 'QUARTER_FINALS',
      rivalId: 2,
      startsAt: new Date(now - 3600000 * 24),
      endsAt: new Date(now - 3600000 * 22),
      windSpeed: 15,
      windDirection: 'N',
      isInternalScrimmage: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const trainingEvent = {
      id: 4,
      title: 'Entrenamiento Táctico - Transición Ofensiva',
      description: 'Práctica de Vertical Stack y cortes en profundidad con viento.',
      type: 'TRAINING',
      status: 'UPCOMING',
      location: 'Cancha de Prácticas SJU',
      parentId: null,
      matchCategory: null,
      rivalId: null,
      isInternalScrimmage: false,
      startsAt: new Date(now + 3600000 * 24 * 2),
      endsAt: new Date(now + 3600000 * 24 * 2 + 7200000),
      windSpeed: 10,
      windDirection: 'W',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.events = [activeTournament, liveMatch, completedMatch, trainingEvent];
    this.nextId['event'] = 20;

    // 7. Event Participants & Attendance
    [liveMatch.id, completedMatch.id, trainingEvent.id].forEach((eventId) => {
      this.players.slice(0, 10).forEach((p, idx) => {
        this.eventParticipants.push({
          eventId,
          playerId: p.id,
          role: idx === 0 ? 'Capitán' : idx === 1 ? 'Capitán O-Line' : 'Jugador',
          status: 'confirmed',
          lineType: idx < 4 ? 'O-Line' : idx < 7 ? 'D-Line' : 'Flex',
        });
        this.attendances.push({
          id: this.getId('attendance'),
          eventId,
          playerId: p.id,
          status: 'present',
          note: 'Confirmado y en cancha',
          createdAt: new Date(),
        });
      });
    });

    // 8. Event Annotations
    const homeScorers = [1, 2, 5, 7, 8, 9, 1, 2];
    const homeAssisters = [8, 1, 1, 2, 3, 1, 8, 5];
    homeScorers.forEach((scorerId, idx) => {
      this.eventAnnotations.push({
        id: this.getId('annotation'),
        eventId: 2,
        playerId: scorerId,
        relatedPlayerId: homeAssisters[idx],
        type: 'GOAL',
        teamSide: 'HOME',
        scoreHome: idx + 1,
        scoreAway: Math.min(idx, 5),
        lineType: 'O-Line',
        timestamp: new Date(now - 3600000 + idx * 300000),
        note: `Gol #${idx + 1} de San Juan`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    this.eventAnnotations.push(
      {
        id: this.getId('annotation'),
        eventId: 2,
        playerId: 7,
        type: 'DEFENSE',
        teamSide: 'HOME',
        scoreHome: 4,
        scoreAway: 3,
        lineType: 'D-Line',
        timestamp: new Date(now - 1500000),
        note: 'Layout D en media cancha',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.getId('annotation'),
        eventId: 2,
        playerId: 2,
        type: 'DEFENSE',
        teamSide: 'HOME',
        scoreHome: 6,
        scoreAway: 5,
        lineType: 'D-Line',
        timestamp: new Date(now - 800000),
        note: 'Intercepción en zona de anotación',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    // 9. Accounts & Categories & Transactions
    this.accounts = [
      { id: 1, name: 'Caja Chica Efectivo', type: 'CASH', createdAt: new Date() },
      { id: 2, name: 'Banco Mercantil - Club', type: 'BANK', createdAt: new Date() },
    ];
    this.nextId['account'] = 5;

    this.categories = [
      { id: 1, name: 'Cuotas Mensuales', kind: 'INCOME', createdAt: new Date() },
      { id: 2, name: 'Inscripciones Torneos', kind: 'INCOME', createdAt: new Date() },
      { id: 3, name: 'Alquiler de Canchas', kind: 'EXPENSE', createdAt: new Date() },
      { id: 4, name: 'Discos y Conos', kind: 'EXPENSE', createdAt: new Date() },
    ];
    this.nextId['category'] = 10;

    this.transactions = [
      { id: 1, accountId: 2, categoryId: 2, type: 'INCOME', amountCents: 45000, occurredAt: new Date(now - 3600000 * 24 * 7), description: 'Inscripción Torneo Nacional 2026', createdAt: new Date() },
      { id: 2, accountId: 2, categoryId: 1, type: 'INCOME', amountCents: 85000, occurredAt: new Date(now - 3600000 * 24 * 14), description: 'Cuotas de pretemporada de jugadores', createdAt: new Date() },
      { id: 3, accountId: 2, categoryId: 3, type: 'EXPENSE', amountCents: 30000, occurredAt: new Date(now - 3600000 * 24 * 3), description: 'Pago de iluminación y canchas de entrenamiento', createdAt: new Date() },
      { id: 4, accountId: 1, categoryId: 4, type: 'EXPENSE', amountCents: 12000, occurredAt: new Date(now - 3600000 * 24 * 10), description: 'Compra de 10 discos Discraft Ultrastar 175g', createdAt: new Date() },
    ];
    this.nextId['transaction'] = 10;

    // 10. Plays
    this.plays = [
      {
        id: 1,
        name: 'Vertical Stack - Break Flow',
        category: 'OFFENSE',
        description: 'Cortes en profundidad desde el fondo del stack aprovechando el lado abierto.',
        content: '1. Handlers mantienen el disco en el centro.\n2. Cutter 1 sale en diagonal al lado abierto.\n3. Si está cerrado, Cutter 2 ataca la zona libre tras el break.\n4. Handlers buscan el huck largo a la zona de anotación.',
        diagramUrl: '',
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'Horizontal Stack - Isolation Cutter',
        category: 'OFFENSE',
        description: 'Espacio abierto central para cortes en isolación 1v1.',
        content: '1. 3 Handlers en la base y 4 Cutters alineados horizontalmente.\n2. Los dos cutters del centro crean el primer corte en tijera.\n3. Los cutters exteriores mantienen abiertos los carriles laterales.',
        diagramUrl: '',
        createdAt: new Date(),
      },
      {
        id: 3,
        name: 'Defensa de Zona 3-3-1 (Cup)',
        category: 'DEFENSE',
        description: 'Zona compacta contra viento para forzar lanzamientos altos o turnovers.',
        content: '1. Cup de 3 jugadores bloquea los pases cortos de los handlers.\n2. 3 Mids cubren el medio campo y líneas laterales.\n3. 1 Deep cubre el fondo y los hucks largos.',
        diagramUrl: '',
        createdAt: new Date(),
      },
    ];
    this.nextId['play'] = 10;

    // 11. Injuries
    this.injuries = [
      { id: 1, playerId: 2, type: 'Sobrecarga de isquiotibial derecho', severity: 'MILD', status: 'RESOLVED', startDate: new Date(now - 3600000 * 24 * 30), description: 'Recuperado con fisioterapia y fortalecimiento', createdAt: new Date() },
      { id: 2, playerId: 6, type: 'Esguince de tobillo grado 1', severity: 'MILD', status: 'RECOVERING', startDate: new Date(now - 3600000 * 24 * 5), description: 'En readaptación deportiva y descanso activo', createdAt: new Date() },
    ];
    this.nextId['injury'] = 10;

    // 12. Channels & Messages
    this.channels = [
      { id: 1, name: 'torneo-nacional-2026', eventId: 1, createdAt: new Date() },
      { id: 2, name: 'general-equipo', eventId: null, createdAt: new Date() },
    ];
    this.nextId['channel'] = 10;

    this.messages = [
      { id: 1, channelId: 1, authorId: 1, content: '¡Muchachos, puntualidad para el calentamiento en la Cancha 1 a las 7:30 AM!', createdAt: new Date(now - 3600000 * 5) },
      { id: 2, channelId: 1, authorId: 2, content: 'Lleyen ambas camisetas (Clara y Oscura) y discos reglamentarios.', createdAt: new Date(now - 3600000 * 4) },
      { id: 3, channelId: 2, authorId: 3, content: 'Revisen la jugada de Vertical Stack en el módulo de Táctica antes del partido.', createdAt: new Date(now - 3600000 * 3) },
    ];
    this.nextId['message'] = 10;

    // 13. News & Resources
    this.newsPosts = [
      {
        id: 1,
        title: '🏆 San Juan clasifica a Semifinales del Torneo Nacional',
        content: 'Tras una brillante victoria en cuartos de final frente a Dragones de Valencia, nuestro equipo avanza a la semifinal del campeonato nacional. ¡Acompáñanos a apoyar al equipo!',
        authorId: 1,
        category: 'Torneos',
        isPublished: true,
        isPinned: true,
        views: 124,
        createdAt: new Date(now - 3600000 * 12),
        updatedAt: new Date(),
      },
      {
        id: 2,
        title: 'Horarios de Entrenamientos de Pretemporada 2026',
        content: 'Los entrenamientos oficiales se realizarán todos los martes y jueves a las 6:30 PM en las Canchas Principales. Se requiere puntualidad y asistencia confirmada.',
        authorId: 3,
        category: 'Entrenamientos',
        isPublished: true,
        isPinned: false,
        views: 89,
        createdAt: new Date(now - 3600000 * 36),
        updatedAt: new Date(),
      },
    ];
    this.nextId['newsPost'] = 10;

    this.resources = [
      { id: 1, title: 'Reglamento Oficial WFDF Ultimate 2025-2028', category: 'Reglamento', description: 'Reglamento traducido oficial de la Federación Mundial de Disco Volador.', url: 'https://rules.wfdf.org', createdAt: new Date() },
      { id: 2, title: 'Guía de Espíritu de Juego (SOTG)', category: 'Espíritu de Juego', description: 'Criterios y rúbrica para evaluación del Spirit of the Game en torneos oficiales.', url: 'https://spirit.wfdf.org', createdAt: new Date() },
    ];
    this.nextId['resource'] = 10;
  }
}

export const dbInstance = new InMemoryDB();

// Helper to filter items matching Prisma where condition
function matchesWhere(item: any, where?: any): boolean {
  if (!where) return true;
  for (const [key, val] of Object.entries(where)) {
    if (key === 'AND' && Array.isArray(val)) {
      if (!val.every((clause) => matchesWhere(item, clause))) return false;
      continue;
    }
    if (key === 'OR' && Array.isArray(val)) {
      if (!val.some((clause) => matchesWhere(item, clause))) return false;
      continue;
    }
    if (key === 'NOT') {
      if (matchesWhere(item, val)) return false;
      continue;
    }
    if (key === 'userId_roleId' && typeof val === 'object' && val !== null) {
      if (item.userId !== (val as any).userId || item.roleId !== (val as any).roleId) return false;
      continue;
    }
    if (key === 'eventId_playerId' && typeof val === 'object' && val !== null) {
      if (item.eventId !== (val as any).eventId || item.playerId !== (val as any).playerId) return false;
      continue;
    }

    const itemVal = item[key];
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      const ops = val as any;
      if (ops.equals !== undefined && itemVal !== ops.equals) return false;
      if (ops.not !== undefined && itemVal === ops.not) return false;
      if (ops.in !== undefined && Array.isArray(ops.in) && !ops.in.includes(itemVal)) return false;
      if (ops.notIn !== undefined && Array.isArray(ops.notIn) && ops.notIn.includes(itemVal)) return false;
      if (ops.contains !== undefined && (typeof itemVal !== 'string' || !itemVal.toLowerCase().includes(String(ops.contains).toLowerCase()))) return false;
      if (ops.startsWith !== undefined && (typeof itemVal !== 'string' || !itemVal.startsWith(String(ops.startsWith)))) return false;
      if (ops.gt !== undefined && !(itemVal > ops.gt)) return false;
      if (ops.gte !== undefined && !(itemVal >= ops.gte)) return false;
      if (ops.lt !== undefined && !(itemVal < ops.lt)) return false;
      if (ops.lte !== undefined && !(itemVal <= ops.lte)) return false;
    } else {
      if (itemVal !== val) return false;
    }
  }
  return true;
}

// Hydrate relations for Prisma include
function hydrateItem(tableName: string, item: any, include?: any): any {
  if (!item || !include) return item;
  const clone = { ...item };

  if (tableName === 'user') {
    if (include.roles) {
      clone.roles = dbInstance.userRoles
        .filter((ur) => ur.userId === item.id)
        .map((ur) => {
          const role = dbInstance.roles.find((r) => r.id === ur.roleId);
          let roleObj: any = role ? { ...role } : null;
          if (roleObj && include.roles.include?.role) {
            const roleInc = include.roles.include.role;
            if (roleInc.include?.permissions) {
              const perms = dbInstance.rolePermissions
                .filter((rp) => rp.roleId === role.id)
                .map((rp) => {
                  const p = dbInstance.permissions.find((perm) => perm.id === rp.permissionId);
                  return { roleId: rp.roleId, permissionId: rp.permissionId, permission: p ? { ...p } : null };
                });
              roleObj.permissions = perms;
            }
          }
          return { userId: ur.userId, roleId: ur.roleId, role: roleObj };
        });
    }
    if (include.player) {
      clone.player = dbInstance.players.find((p) => p.id === item.playerId) || null;
    }
    if (include.roleRequests) {
      clone.roleRequests = dbInstance.roleRequests.filter((rr) => rr.userId === item.id);
    }
  }

  if (tableName === 'player') {
    if (include.user) {
      clone.user = dbInstance.users.find((u) => u.playerId === item.id) || null;
    }
    if (include.injuries) {
      clone.injuries = dbInstance.injuries.filter((i) => i.playerId === item.id);
    }
    if (include.attendances) {
      clone.attendances = dbInstance.attendances.filter((a) => a.playerId === item.id);
    }
  }

  if (tableName === 'event') {
    if (include.participants) {
      clone.participants = dbInstance.eventParticipants
        .filter((ep) => ep.eventId === item.id)
        .map((ep) => ({
          ...ep,
          player: dbInstance.players.find((p) => p.id === ep.playerId) || null,
        }));
    }
    if (include.attendances) {
      clone.attendances = dbInstance.attendances
        .filter((a) => a.eventId === item.id)
        .map((a) => ({
          ...a,
          player: dbInstance.players.find((p) => p.id === a.playerId) || null,
        }));
    }
    if (include.channel) {
      clone.channel = dbInstance.channels.find((c) => c.eventId === item.id) || null;
    }
    if (include.annotations) {
      clone.annotations = dbInstance.eventAnnotations.filter((ea) => ea.eventId === item.id);
    }
    if (include.children) {
      clone.children = dbInstance.events.filter((e) => e.parentId === item.id);
    }
    if (include.parent) {
      clone.parent = dbInstance.events.find((e) => e.id === item.parentId) || null;
    }
  }

  if (tableName === 'eventAnnotation') {
    if (include.player) {
      clone.player = dbInstance.players.find((p) => p.id === item.playerId) || null;
    }
    if (include.event) {
      clone.event = dbInstance.events.find((e) => e.id === item.eventId) || null;
    }
    if (include.rival) {
      clone.rival = dbInstance.rivals.find((r) => r.id === item.rivalId) || null;
    }
    if (include.rivalPlayer) {
      clone.rivalPlayer = dbInstance.rivalPlayers.find((rp) => rp.id === item.rivalPlayerId) || null;
    }
  }

  if (tableName === 'eventParticipant') {
    if (include.player) {
      clone.player = dbInstance.players.find((p) => p.id === item.playerId) || null;
    }
    if (include.event) {
      clone.event = dbInstance.events.find((e) => e.id === item.eventId) || null;
    }
  }

  if (tableName === 'attendance') {
    if (include.player) {
      clone.player = dbInstance.players.find((p) => p.id === item.playerId) || null;
    }
    if (include.event) {
      clone.event = dbInstance.events.find((e) => e.id === item.eventId) || null;
    }
  }

  if (tableName === 'transaction') {
    if (include.account) {
      clone.account = dbInstance.accounts.find((a) => a.id === item.accountId) || null;
    }
    if (include.category) {
      clone.category = dbInstance.categories.find((c) => c.id === item.categoryId) || null;
    }
  }

  if (tableName === 'injury') {
    if (include.player) {
      clone.player = dbInstance.players.find((p) => p.id === item.playerId) || null;
    }
  }

  if (tableName === 'message') {
    if (include.author) {
      clone.author = dbInstance.players.find((p) => p.id === item.authorId) || null;
    }
    if (include.channel) {
      clone.channel = dbInstance.channels.find((c) => c.id === item.channelId) || null;
    }
  }

  if (tableName === 'newsPost') {
    if (include.author) {
      clone.author = dbInstance.players.find((p) => p.id === item.authorId) || null;
    }
    if (include.files) {
      clone.files = dbInstance.newsPostFiles.filter((f) => f.postId === item.id);
    }
  }

  if (tableName === 'roleRequest') {
    if (include.user) {
      clone.user = dbInstance.users.find((u) => u.id === item.userId) || null;
    }
    if (include.player) {
      clone.player = dbInstance.players.find((p) => p.id === item.playerId) || null;
    }
    if (include.decidedBy) {
      clone.decidedBy = dbInstance.users.find((u) => u.id === item.decidedById) || null;
    }
  }

  return clone;
}

// Generic model handler creator
function createModelHandler(tableName: string, getArray: () => any[]) {
  return {
    findUnique: async (args: any) => {
      const arr = getArray();
      const item = arr.find((it) => matchesWhere(it, args?.where));
      return item ? hydrateItem(tableName, item, args?.include) : null;
    },
    findFirst: async (args: any) => {
      const arr = getArray();
      let matches = arr.filter((it) => matchesWhere(it, args?.where));
      if (args?.orderBy) {
        matches = sortItems(matches, args.orderBy);
      }
      const item = matches[0];
      return item ? hydrateItem(tableName, item, args?.include) : null;
    },
    findMany: async (args: any) => {
      const arr = getArray();
      let matches = arr.filter((it) => matchesWhere(it, args?.where));
      if (args?.orderBy) {
        matches = sortItems(matches, args.orderBy);
      }
      if (typeof args?.skip === 'number') {
        matches = matches.slice(args.skip);
      }
      if (typeof args?.take === 'number') {
        matches = matches.slice(0, args.take);
      }
      return matches.map((it) => hydrateItem(tableName, it, args?.include));
    },
    create: async (args: any) => {
      const arr = getArray();
      const id = (dbInstance as any).getId(tableName);
      const newItem = {
        id,
        ...args?.data,
        createdAt: args?.data?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      arr.push(newItem);
      return hydrateItem(tableName, newItem, args?.include);
    },
    createMany: async (args: any) => {
      const arr = getArray();
      const list = Array.isArray(args?.data) ? args.data : [args?.data];
      let count = 0;
      for (const d of list) {
        const id = (dbInstance as any).getId(tableName);
        arr.push({ id, ...d, createdAt: new Date(), updatedAt: new Date() });
        count++;
      }
      return { count };
    },
    update: async (args: any) => {
      const arr = getArray();
      const index = arr.findIndex((it) => matchesWhere(it, args?.where));
      if (index === -1) {
        throw new Error(`Record to update not found in ${tableName}`);
      }
      arr[index] = {
        ...arr[index],
        ...args?.data,
        updatedAt: new Date(),
      };
      return hydrateItem(tableName, arr[index], args?.include);
    },
    updateMany: async (args: any) => {
      const arr = getArray();
      let count = 0;
      for (let i = 0; i < arr.length; i++) {
        if (matchesWhere(arr[i], args?.where)) {
          arr[i] = { ...arr[i], ...args?.data, updatedAt: new Date() };
          count++;
        }
      }
      return { count };
    },
    upsert: async (args: any) => {
      const arr = getArray();
      const index = arr.findIndex((it) => matchesWhere(it, args?.where));
      if (index !== -1) {
        arr[index] = { ...arr[index], ...args?.update, updatedAt: new Date() };
        return hydrateItem(tableName, arr[index], args?.include);
      } else {
        const id = (dbInstance as any).getId(tableName);
        const newItem = { id, ...args?.create, createdAt: new Date(), updatedAt: new Date() };
        arr.push(newItem);
        return hydrateItem(tableName, newItem, args?.include);
      }
    },
    delete: async (args: any) => {
      const arr = getArray();
      const index = arr.findIndex((it) => matchesWhere(it, args?.where));
      if (index === -1) {
        throw new Error(`Record to delete not found in ${tableName}`);
      }
      const [deleted] = arr.splice(index, 1);
      return deleted;
    },
    deleteMany: async (args: any) => {
      const arr = getArray();
      const initialLen = arr.length;
      const remaining = arr.filter((it) => !matchesWhere(it, args?.where));
      arr.length = 0;
      arr.push(...remaining);
      return { count: initialLen - remaining.length };
    },
    count: async (args: any) => {
      const arr = getArray();
      const matches = arr.filter((it) => matchesWhere(it, args?.where));
      return matches.length;
    },
    aggregate: async (args: any) => {
      const arr = getArray();
      const matches = arr.filter((it) => matchesWhere(it, args?.where));
      const res: any = { _count: matches.length };
      if (args?._sum?.amountCents) {
        const sum = matches.reduce((acc, it) => acc + (it.amountCents || 0), 0);
        res._sum = { amountCents: sum };
      }
      return res;
    },
  };
}

function sortItems(items: any[], orderBy: any): any[] {
  if (!orderBy) return items;
  const clone = [...items];
  const orderEntries = Array.isArray(orderBy) ? orderBy : [orderBy];

  clone.sort((a, b) => {
    for (const order of orderEntries) {
      for (const [key, dir] of Object.entries(order)) {
        const valA = a[key];
        const valB = b[key];
        if (valA === valB) continue;
        if (valA === undefined || valA === null) return dir === 'asc' ? -1 : 1;
        if (valB === undefined || valB === null) return dir === 'asc' ? 1 : -1;
        const res = valA > valB ? 1 : -1;
        return dir === 'desc' ? -res : res;
      }
    }
    return 0;
  });
  return clone;
}

export const mockPrisma: any = {
  user: createModelHandler('user', () => dbInstance.users),
  role: createModelHandler('role', () => dbInstance.roles),
  permission: createModelHandler('permission', () => dbInstance.permissions),
  userRole: createModelHandler('userRole', () => dbInstance.userRoles),
  rolePermission: createModelHandler('rolePermission', () => dbInstance.rolePermissions),
  player: createModelHandler('player', () => dbInstance.players),
  event: createModelHandler('event', () => dbInstance.events),
  spiritScore: createModelHandler('spiritScore', () => dbInstance.spiritScores),
  playerMatchStats: createModelHandler('playerMatchStats', () => dbInstance.playerMatchStats),
  eventParticipant: createModelHandler('eventParticipant', () => dbInstance.eventParticipants),
  attendance: createModelHandler('attendance', () => dbInstance.attendances),
  eventAnnotation: createModelHandler('eventAnnotation', () => dbInstance.eventAnnotations),
  account: createModelHandler('account', () => dbInstance.accounts),
  category: createModelHandler('category', () => dbInstance.categories),
  transaction: createModelHandler('transaction', () => dbInstance.transactions),
  injury: createModelHandler('injury', () => dbInstance.injuries),
  rival: createModelHandler('rival', () => dbInstance.rivals),
  rivalPlayer: createModelHandler('rivalPlayer', () => dbInstance.rivalPlayers),
  play: createModelHandler('play', () => dbInstance.plays),
  resource: createModelHandler('resource', () => dbInstance.resources),
  newsPost: createModelHandler('newsPost', () => dbInstance.newsPosts),
  newsPostFile: createModelHandler('newsPostFile', () => dbInstance.newsPostFiles),
  roleRequest: createModelHandler('roleRequest', () => dbInstance.roleRequests),
  auditLog: createModelHandler('auditLog', () => dbInstance.auditLogs),
  passwordResetToken: createModelHandler('passwordResetToken', () => dbInstance.passwordResetTokens),

  $transaction: async (arg: any) => {
    if (typeof arg === 'function') {
      return arg(mockPrisma);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg;
  },
  $executeRawUnsafe: async () => 0,
  $queryRawUnsafe: async () => [],
  $disconnect: async () => {},
};
