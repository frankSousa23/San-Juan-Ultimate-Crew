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

// Default password hashes
const DEFAULT_PW_HASH = bcrypt.hashSync('123456', 10);
const ADMIN_PW_HASH = bcrypt.hashSync('passWORD23', 10);

class InMemoryDB {
  teams: any[] = [];
  permissions: any[] = [];
  roles: any[] = [];
  rolePermissions: any[] = [];
  users: any[] = [];
  userRoles: any[] = [];
  players: any[] = [];
  events: any[] = [];
  channels: any[] = [];
  messages: any[] = [];
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
  newsComments: any[] = [];
  roleRequests: any[] = [];
  auditLogs: any[] = [];
  passwordResetTokens: any[] = [];
  feedbacks: any[] = [];

  private nextId: Record<string, number> = {};

  constructor() {
    this.seed();
  }

  public getId(table: string): number {
    if (!this.nextId[table]) this.nextId[table] = 1;
    return this.nextId[table]++;
  }

  seed() {
    // Reset all arrays and ID counters for clean baseline
    this.userRoles = [];
    this.rolePermissions = [];

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
    const roleNames = ['admin', 'player', 'captain', 'coach', 'directiva', 'annotator', 'treasurer', 'guest'];
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
    assignPerms('directiva', ['roster:view', 'events:view', 'events:manage', 'attendance:view', 'attendance:manage', 'finance:view', 'communications:manage', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'statistics:view', 'annotations:view', 'annotations:manage']);
    assignPerms('annotator', ['events:view', 'roster:view', 'rivals:view', 'statistics:view', 'attendance:view', 'annotations:view', 'annotations:manage']);
    assignPerms('treasurer', ['finance:manage', 'finance:view', 'roster:view', 'events:view', 'statistics:view']);
    assignPerms('guest', ['events:view', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'statistics:view', 'annotations:view']);

    // 3. Equipos del Ecosistema Beta Multi-Equipo
    this.teams = [
      { id: 1, name: 'Warao', tag: 'WAR', categories: 'Open Masculino, Mixto', color: '#1E40AF', notes: 'Equipo élite categoría Masculina / Open de alto rendimiento.', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Medusa', tag: 'MED', categories: 'Mixto', color: '#7C3AED', notes: 'Equipo representativo categoría Mixta con balance y dinámica táctica.', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Motherflowers', tag: 'MF', categories: 'Mixto, Femenino', color: '#E11D48', notes: 'Club tradicional categoría Mixta reconocido por su velocidad y cortes profundos.', createdAt: new Date(), updatedAt: new Date() },
    ];
    this.nextId['team'] = 4;

    // 4. Players (Roster por Equipo + Agentes Libres / Sin Equipo)
    this.players = [
      // Warao Open & Mixto
      { id: 1, name: 'Frank Sousa', number: 23, position: 'HANDLER', status: 'ACTIVE', teamId: 1, category: 'Open Masculino', heightCm: 182, experience: '8 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Juan Pérez', number: 7, position: 'CUTTER', status: 'ACTIVE', teamId: 1, category: 'Open Masculino', heightCm: 178, experience: '5 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Carlos Díaz', number: 15, position: 'CUTTER', status: 'ACTIVE', teamId: 1, category: 'Open Masculino', heightCm: 175, experience: '4 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: 'Miguel Torres', number: 21, position: 'HYBRID', status: 'ACTIVE', teamId: 1, category: 'Mixto', heightCm: 180, experience: '6 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: 'Andrés Mendoza', number: 8, position: 'HANDLER', status: 'ACTIVE', teamId: 1, category: 'Mixto', heightCm: 176, experience: '4 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: 'Ricardo Ramos', number: 19, position: 'CUTTER', status: 'ACTIVE', teamId: 1, category: 'Open Masculino', heightCm: 183, experience: '3 años', createdAt: new Date(), updatedAt: new Date() },

      // Medusa Mixto
      { id: 7, name: 'María Gonzalez', number: 10, position: 'HANDLER', status: 'ACTIVE', teamId: 2, category: 'Mixto', heightCm: 168, experience: '6 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 8, name: 'Pedro Luis', number: 99, position: 'HYBRID', status: 'ACTIVE', teamId: 2, category: 'Mixto', heightCm: 184, experience: '7 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 9, name: 'Ana Silva', number: 12, position: 'CUTTER', status: 'ACTIVE', teamId: 2, category: 'Mixto', heightCm: 165, experience: '3 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 10, name: 'Gabriel Silva', number: 17, position: 'CUTTER', status: 'ACTIVE', teamId: 2, category: 'Mixto', heightCm: 177, experience: '4 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 11, name: 'Sofía Rojas', number: 4, position: 'HANDLER', status: 'ACTIVE', teamId: 2, category: 'Mixto', heightCm: 170, experience: '5 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 12, name: 'Luis Martínez', number: 88, position: 'HANDLER', status: 'ACTIVE', teamId: 2, category: 'Mixto', heightCm: 179, experience: '8 años', createdAt: new Date(), updatedAt: new Date() },

      // Motherflowers
      { id: 13, name: 'Laura Gómez', number: 33, position: 'CUTTER', status: 'ACTIVE', teamId: 3, category: 'Mixto', heightCm: 167, experience: '5 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 14, name: 'Valentina Torres', number: 9, position: 'HANDLER', status: 'ACTIVE', teamId: 3, category: 'Femenino', heightCm: 164, experience: '4 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 15, name: 'Diego Castro', number: 5, position: 'HYBRID', status: 'ACTIVE', teamId: 3, category: 'Mixto', heightCm: 181, experience: '6 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 16, name: 'Camila Rivas', number: 14, position: 'CUTTER', status: 'ACTIVE', teamId: 3, category: 'Femenino', heightCm: 172, experience: '3 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 17, name: 'Roberto Morales', number: 11, position: 'HANDLER', status: 'ACTIVE', teamId: 3, category: 'Mixto', heightCm: 175, experience: '5 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 18, name: 'Elena Ramos', number: 27, position: 'CUTTER', status: 'ACTIVE', teamId: 3, category: 'Mixto', heightCm: 169, experience: '2 años', createdAt: new Date(), updatedAt: new Date() },

      // Free Agents / Sin Equipo (Refuerzos Libres)
      { id: 19, name: 'Daniela Herrera', number: 22, position: 'HYBRID', status: 'ACTIVE', teamId: null, category: null, heightCm: 171, experience: '4 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 20, name: 'Javier Blanco', number: 18, position: 'HANDLER', status: 'ACTIVE', teamId: null, category: null, heightCm: 177, experience: '6 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 21, name: 'Valeria Morales', number: 3, position: 'CUTTER', status: 'ACTIVE', teamId: null, category: null, heightCm: 166, experience: '3 años', createdAt: new Date(), updatedAt: new Date() },
      { id: 22, name: 'Marcos Peñaloza', number: 30, position: 'CUTTER', status: 'ACTIVE', teamId: null, category: null, heightCm: 180, experience: '2 años', createdAt: new Date(), updatedAt: new Date() },
    ];
    this.nextId['player'] = 23;

    // 5. Users (Admin, Guest, Capitanes, Coaches, Mesa Técnica y Atletas)
    const coreUsers = [
      { id: 1, email: 'frankalfonso1988@gmail.com', name: 'Frank Sousa (Admin)', role: 'admin', playerId: 1, teamId: 1 },
      { id: 2, email: 'guest@sigedivo.com', name: 'Invitado / Demostración', role: 'guest', playerId: null, teamId: null },
      { id: 3, email: 'capitan.warao@sigedivo.com', name: 'Juan Pérez (Capitán Warao)', role: 'captain', playerId: 2, teamId: 1 },
      { id: 4, email: 'capitan.medusa@sigedivo.com', name: 'María Gonzalez (Capitana Medusa)', role: 'captain', playerId: 7, teamId: 2 },
      { id: 5, email: 'capitan.motherflowers@sigedivo.com', name: 'Laura Gómez (Capitana Motherflowers)', role: 'captain', playerId: 13, teamId: 3 },
      { id: 6, email: 'mesa.tecnica@sigedivo.com', name: 'Mesa Técnica Oficial', role: 'annotator', playerId: null, teamId: null },
      { id: 7, email: 'coach.medusa@sigedivo.com', name: 'Pedro Luis (Coach Medusa)', role: 'coach', playerId: 8, teamId: 2 },
      { id: 8, email: 'jugador.libre@sigedivo.com', name: 'Daniela Herrera (Agente Libre / Refuerzo)', role: 'player', playerId: 19, teamId: null },
      { id: 9, email: 'jugador.warao@sigedivo.com', name: 'Carlos Díaz (Warao Open)', role: 'player', playerId: 3, teamId: 1 },
    ];

    this.users = coreUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      passwordHash: u.role === 'admin' ? ADMIN_PW_HASH : DEFAULT_PW_HASH,
      status: 'APPROVED',
      playerId: u.playerId,
      teamId: u.teamId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    this.nextId['user'] = 10;

    coreUsers.forEach((u) => {
      this.userRoles.push({ userId: u.id, roleId: roleMap[u.role] });
    });

    // 6. Rivales y Jugadores Oponentes
    this.rivals = [
      { id: 1, name: 'Dragones Ultimate Club', notes: 'Rival de zona central', createdAt: new Date() },
      { id: 2, name: 'Tiburones de la Bahía', notes: 'Equipo costero', createdAt: new Date() },
    ];
    this.nextId['rival'] = 3;

    this.rivalPlayers = [
      { id: 1, rivalId: 1, name: 'Alex Rondón', number: 10, position: 'HANDLER', createdAt: new Date() },
      { id: 2, rivalId: 1, name: 'Gabriel Soto', number: 21, position: 'CUTTER', createdAt: new Date() },
    ];
    this.nextId['rivalPlayer'] = 3;

    // 7. Eventos (Torneo Mixto de Fin de Mes con Fixtures + Evento Completado Previo)
    const tournamentDate = new Date('2026-08-29T08:00:00Z');
    const tournamentEndDate = new Date('2026-08-30T19:00:00Z');

    this.events = [
      // Torneo Mixto de Fin de Mes (Evento Padre)
      {
        id: 1,
        title: 'Torneo Mixto de Fin de Mes',
        type: 'TOURNAMENT',
        status: 'UPCOMING',
        location: 'Complejo Deportivo Simón Bolívar - Canchas 1 y 2',
        startsAt: tournamentDate,
        endsAt: tournamentEndDate,
        officialAnnotatorId: 6,
        isAnnotatorLocked: false,
        description: 'Gran Torneo Mixto de integración y ranking. Participan Warao Open, Medusa Mixto, Motherflowers y refuerzos libres. Control de horarios, plantillas y estadísticas por Mesa Técnica.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Partido 1 Fixture
      {
        id: 2,
        title: 'Fase de Grupos: Medusa Mixto vs Motherflowers',
        type: 'MATCH',
        status: 'UPCOMING',
        location: 'Cancha 1 - Césped Principal',
        startsAt: new Date('2026-08-29T09:00:00Z'),
        endsAt: new Date('2026-08-29T10:30:00Z'),
        parentId: 1,
        teamId: 2,
        awayTeamId: 3,
        matchCategory: 'GROUP_STAGE',
        officialAnnotatorId: 6,
        description: 'Jornada inaugural del Torneo Mixto. Duración 80 min a 15 puntos.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Partido 2 Fixture
      {
        id: 3,
        title: 'Fase de Grupos: Warao Open vs Medusa Mixto',
        type: 'MATCH',
        status: 'UPCOMING',
        location: 'Cancha Central',
        startsAt: new Date('2026-08-29T11:30:00Z'),
        endsAt: new Date('2026-08-29T13:00:00Z'),
        parentId: 1,
        teamId: 1,
        awayTeamId: 2,
        matchCategory: 'GROUP_STAGE',
        officialAnnotatorId: 6,
        description: 'Clásico de velocidad y manejo de disco en categoría abierta/mixta.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Partido 3 Fixture
      {
        id: 4,
        title: 'Fase de Grupos: Motherflowers vs Warao Open',
        type: 'MATCH',
        status: 'UPCOMING',
        location: 'Cancha 2',
        startsAt: new Date('2026-08-29T14:30:00Z'),
        endsAt: new Date('2026-08-29T16:00:00Z'),
        parentId: 1,
        teamId: 3,
        awayTeamId: 1,
        matchCategory: 'GROUP_STAGE',
        officialAnnotatorId: 6,
        description: 'Definición de posiciones de cara a la Gran Final.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Gran Final Fixture
      {
        id: 5,
        title: 'Gran Final - Torneo Mixto de Fin de Mes',
        type: 'MATCH',
        status: 'UPCOMING',
        location: 'Cancha Central',
        startsAt: new Date('2026-08-30T16:00:00Z'),
        endsAt: new Date('2026-08-30T18:00:00Z'),
        parentId: 1,
        matchCategory: 'FINALS',
        officialAnnotatorId: 6,
        description: 'Gran Final por la Copa de Fin de Mes y Premio de Espíritu de Juego (SOTG).',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Evento Especial Completado (Copa Apertura)
      {
        id: 6,
        title: 'Full Day Mixto - Copa Apertura',
        type: 'FULL_DAY_MIXTO',
        status: 'COMPLETED',
        location: 'Cancha Central Simón Bolívar',
        startsAt: new Date(Date.now() - 86400000 * 6),
        endsAt: new Date(Date.now() - 86400000 * 6 + 28800000),
        teamId: 2,
        awayTeamId: 3,
        officialAnnotatorId: 6,
        description: 'Jornada completa de partidos con seguimiento oficial por Mesa Técnica.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    this.nextId['event'] = 7;

    // 8. Event Participants & Attendance (Nóminas, Refuerzos y Mesa Técnica)
    this.eventParticipants = [
      // Medusa Mixto en Torneo
      { id: 1, eventId: 1, playerId: 7, role: 'Manejador', status: 'confirmed', lineType: 'O-Line', teamSide: 'HOME', isRefuerzo: false },
      { id: 2, eventId: 1, playerId: 8, role: 'Manejador', status: 'confirmed', lineType: 'O-Line', teamSide: 'HOME', isRefuerzo: false },
      { id: 3, eventId: 1, playerId: 9, role: 'Cortador', status: 'confirmed', lineType: 'D-Line', teamSide: 'HOME', isRefuerzo: false },
      { id: 4, eventId: 1, playerId: 10, role: 'Cortador', status: 'confirmed', lineType: 'D-Line', teamSide: 'HOME', isRefuerzo: false },
      { id: 5, eventId: 1, playerId: 11, role: 'Manejador', status: 'confirmed', lineType: 'O-Line', teamSide: 'HOME', isRefuerzo: false },
      { id: 6, eventId: 1, playerId: 12, role: 'Manejador', status: 'confirmed', lineType: 'O-Line', teamSide: 'HOME', isRefuerzo: false },
      // Refuerzo libre añadido a Medusa: Daniela Herrera (#19)
      { id: 7, eventId: 1, playerId: 19, role: 'Refuerzo Híbrido', status: 'confirmed', lineType: 'O-Line', teamSide: 'HOME', isRefuerzo: true },

      // Motherflowers en Torneo
      { id: 8, eventId: 1, playerId: 13, role: 'Cortador', status: 'confirmed', lineType: 'O-Line', teamSide: 'AWAY', isRefuerzo: false },
      { id: 9, eventId: 1, playerId: 14, role: 'Manejador', status: 'confirmed', lineType: 'O-Line', teamSide: 'AWAY', isRefuerzo: false },
      { id: 10, eventId: 1, playerId: 15, role: 'Cortador', status: 'confirmed', lineType: 'D-Line', teamSide: 'AWAY', isRefuerzo: false },
      { id: 11, eventId: 1, playerId: 16, role: 'Cortador', status: 'confirmed', lineType: 'D-Line', teamSide: 'AWAY', isRefuerzo: false },
      { id: 12, eventId: 1, playerId: 17, role: 'Manejador', status: 'confirmed', lineType: 'O-Line', teamSide: 'AWAY', isRefuerzo: false },
      { id: 13, eventId: 1, playerId: 18, role: 'Cortador', status: 'confirmed', lineType: 'O-Line', teamSide: 'AWAY', isRefuerzo: false },
      // Refuerzo libre añadido a Motherflowers: Javier Blanco (#20)
      { id: 14, eventId: 1, playerId: 20, role: 'Refuerzo Handler', status: 'tentative', lineType: 'O-Line', teamSide: 'AWAY', isRefuerzo: true },

      // Warao Open en Torneo
      { id: 15, eventId: 1, playerId: 1, role: 'Manejador', status: 'confirmed', lineType: 'O-Line', isRefuerzo: false },
      { id: 16, eventId: 1, playerId: 2, role: 'Cortador', status: 'confirmed', lineType: 'O-Line', isRefuerzo: false },
      { id: 17, eventId: 1, playerId: 3, role: 'Cortador', status: 'confirmed', lineType: 'O-Line', isRefuerzo: false },
      { id: 18, eventId: 1, playerId: 4, role: 'Cortador', status: 'confirmed', lineType: 'D-Line', isRefuerzo: false },
      { id: 19, eventId: 1, playerId: 5, role: 'Manejador', status: 'confirmed', lineType: 'O-Line', isRefuerzo: false },
      { id: 20, eventId: 1, playerId: 6, role: 'Cortador', status: 'confirmed', lineType: 'D-Line', isRefuerzo: false },

      // Mesa Técnica en Torneo
      { id: 21, eventId: 1, playerId: 5, role: 'DIRECTOR_MESA', status: 'confirmed' },
      { id: 22, eventId: 1, playerId: 11, role: 'PLANILLERO_ANOTADOR', status: 'confirmed' },
      { id: 23, eventId: 1, playerId: 14, role: 'VEEDOR_ESPIRITU', status: 'confirmed' },
    ];
    this.nextId['eventParticipant'] = 24;

    // Asistencias registradas
    this.attendances = this.players.map((p, idx) => ({
      id: idx + 1,
      eventId: 1,
      playerId: p.id,
      status: 'present',
      confirmedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    this.nextId['attendance'] = this.players.length + 1;

    // 9. Event Annotations (Play-by-play del Evento Completado #6)
    this.eventAnnotations = [
      { id: 1, eventId: 6, type: 'GOAL', playerId: 7, relatedPlayerId: 8, teamSide: 'HOME', scoreHome: 1, scoreAway: 0, lineType: 'O-Line', note: 'Pase largo perfecto de Pedro a María en la zona', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 600000), createdAt: new Date() },
      { id: 2, eventId: 6, type: 'GOAL', playerId: 13, relatedPlayerId: 15, teamSide: 'AWAY', scoreHome: 1, scoreAway: 1, lineType: 'O-Line', note: 'Respuesta inmediata de Motherflowers', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 1200000), createdAt: new Date() },
      { id: 3, eventId: 6, type: 'DEFENSE', playerId: 9, teamSide: 'HOME', lineType: 'D-Line', note: 'Bloqueo aéreo de Ana Silva', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 1800000), createdAt: new Date() },
      { id: 4, eventId: 6, type: 'GOAL', playerId: 19, relatedPlayerId: 7, teamSide: 'HOME', scoreHome: 2, scoreAway: 1, lineType: 'O-Line', isRefuerzo: true, note: 'Gol anotado por Daniela Herrera (Refuerzo Libre)', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 2400000), createdAt: new Date() },
      { id: 5, eventId: 6, type: 'GOAL', playerId: 16, relatedPlayerId: 14, teamSide: 'AWAY', scoreHome: 2, scoreAway: 2, lineType: 'O-Line', note: 'Corte hacia break side de Camila', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 3000000), createdAt: new Date() },
      { id: 6, eventId: 6, type: 'DEFENSE', playerId: 1, teamSide: 'HOME', lineType: 'D-Line', note: 'Intercepción de Frank Sousa', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 3600000), createdAt: new Date() },
      { id: 7, eventId: 6, type: 'GOAL', playerId: 2, relatedPlayerId: 1, teamSide: 'HOME', scoreHome: 3, scoreAway: 2, lineType: 'O-Line', note: 'Asistencia de Frank a Juan Pérez', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 4200000), createdAt: new Date() },
      { id: 8, eventId: 6, type: 'TURNOVER', playerId: 17, teamSide: 'AWAY', lineType: 'O-Line', note: 'Pase forzado con stall 9', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 4800000), createdAt: new Date() },
      { id: 9, eventId: 6, type: 'GOAL', playerId: 8, relatedPlayerId: 19, teamSide: 'HOME', scoreHome: 4, scoreAway: 2, lineType: 'O-Line', note: 'Asistencia clave de la jugadora libre Daniela', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 5400000), createdAt: new Date() },
      { id: 10, eventId: 6, type: 'GOAL', playerId: 13, relatedPlayerId: 17, teamSide: 'AWAY', scoreHome: 4, scoreAway: 3, lineType: 'O-Line', note: 'Segundo gol de Laura Gómez', createdBy: 6, timestamp: new Date(Date.now() - 86400000 * 6 + 6000000), createdAt: new Date() },
    ];
    this.nextId['annotation'] = 11;

    // 10. PlayerMatchStats
    this.playerMatchStats = [
      { id: 1, eventId: 6, playerId: 7, goals: 3, assists: 4, defenses: 1, turnovers: 1, pointsPlayed: 14, isRefuerzo: false },
      { id: 2, eventId: 6, playerId: 8, goals: 4, assists: 3, defenses: 2, turnovers: 1, pointsPlayed: 15, isRefuerzo: false },
      { id: 3, eventId: 6, playerId: 19, goals: 3, assists: 2, defenses: 2, turnovers: 0, pointsPlayed: 12, isRefuerzo: true },
      { id: 4, eventId: 6, playerId: 13, goals: 5, assists: 1, defenses: 0, turnovers: 2, pointsPlayed: 16, isRefuerzo: false },
      { id: 5, eventId: 6, playerId: 14, goals: 1, assists: 5, defenses: 1, turnovers: 1, pointsPlayed: 14, isRefuerzo: false },
      { id: 6, eventId: 6, playerId: 1, goals: 2, assists: 6, defenses: 3, turnovers: 1, pointsPlayed: 15, isRefuerzo: false },
      { id: 7, eventId: 6, playerId: 2, goals: 4, assists: 1, defenses: 1, turnovers: 1, pointsPlayed: 13, isRefuerzo: false },
      { id: 8, eventId: 6, playerId: 9, goals: 1, assists: 1, defenses: 4, turnovers: 0, pointsPlayed: 11, isRefuerzo: false },
    ];
    this.nextId['playerMatchStats'] = 9;

    // 11. Spirit Scores
    this.spiritScores = [
      {
        id: 1,
        eventId: 6,
        teamId: 3,
        evaluatedTeam: 'Medusa Mixto',
        rulesKnowledge: 4,
        foulsAndContact: 4,
        fairMindedness: 4,
        positiveAttitude: 4,
        communication: 4,
        totalScore: 20,
        comments: 'Excelente partido, juego fluido y gran respeto por las reglas.',
        createdAt: new Date(),
      },
    ];
    this.nextId['spiritScore'] = 2;

    // 11. Finanzas: Cuentas, Categorías y Transacciones de Ejemplo Realista
    this.accounts = [
      { id: 1, name: 'Caja Chica (Efectivo / USD)', type: 'CASH', balanceCents: 15000, description: 'Fondos en efectivo para hidratación, hielo y gastos menores de cancha.', createdAt: new Date() },
      { id: 2, name: 'Cuenta Bancaria / Pago Móvil / Zelle', type: 'BANK', balanceCents: 125000, description: 'Cuenta bancaria para cuotas mensuales de atletas, inscripciones y patrocinios.', createdAt: new Date() },
    ];
    this.nextId['account'] = 3;

    this.categories = [
      { id: 1, name: 'Cuotas de Membresía Mensual', kind: 'INCOME', description: 'Pago de mensualidades y mantenimiento deportivo de atletas.', createdAt: new Date() },
      { id: 2, name: 'Venta de Discos Oficiales 175g', kind: 'INCOME', description: 'Venta de discos oficiales Discraft Ultra-Star de competencia.', createdAt: new Date() },
      { id: 3, name: 'Patrocinios y Donaciones', kind: 'INCOME', description: 'Aportes de aliados y patrocinadores del club.', createdAt: new Date() },
      { id: 4, name: 'Compra de Discos y Conos', kind: 'EXPENSE', description: 'Adquisición de material técnico reglamentario.', createdAt: new Date() },
      { id: 5, name: 'Hidratación y Primeros Auxilios', kind: 'EXPENSE', description: 'Botellones de agua, hielo, vendas y botiquín.', createdAt: new Date() },
      { id: 6, name: 'Inscripción a Torneo Nacional', kind: 'EXPENSE', description: 'Pago de Bid Fee y cuotas de participación en torneos.', createdAt: new Date() },
    ];
    this.nextId['category'] = 7;

    this.transactions = [
      { id: 1, type: 'INCOME', amountCents: 10000, description: 'Cobro de cuotas mensuales de atletas (Enero)', occurredAt: new Date(Date.now() - 86400000 * 18), accountId: 2, categoryId: 1, createdBy: 1, createdAt: new Date() },
      { id: 2, type: 'INCOME', amountCents: 7500, description: 'Venta de 5 discos oficiales Discraft Ultra-Star 175g', occurredAt: new Date(Date.now() - 86400000 * 12), accountId: 2, categoryId: 2, createdBy: 1, createdAt: new Date() },
      { id: 3, type: 'EXPENSE', amountCents: 12000, description: 'Compra de lote de 10 discos oficiales de competencia', occurredAt: new Date(Date.now() - 86400000 * 10), accountId: 2, categoryId: 4, createdBy: 1, createdAt: new Date() },
      { id: 4, type: 'EXPENSE', amountCents: 1850, description: 'Agua potable y bolsas de hielo para entrenamiento de fin de semana', occurredAt: new Date(Date.now() - 86400000 * 5), accountId: 1, categoryId: 5, createdBy: 1, createdAt: new Date() },
      { id: 5, type: 'EXPENSE', amountCents: 15000, description: 'Anticipo de Bid Fee - Copa Nacional de Ultimate Frisbee', occurredAt: new Date(Date.now() - 86400000 * 3), accountId: 2, categoryId: 6, createdBy: 1, createdAt: new Date() },
    ];
    this.nextId['transaction'] = 6;

    // 12. Jugadas Tácticas (Playbook) - Ultimate Frisbee / Disco Volador
    this.plays = [
      {
        id: 1,
        name: 'Vertical Stack Estándar (Cortes Open y Break Side)',
        category: 'OFFENSE',
        description: 'Formación clásica en columna vertical en el centro del campo con 2-3 handlers y 4 cutters. Los cortadores atacan sucesivamente desde el fondo del stack hacia el lado abierto (open side) o lado cerrado (break side).',
        diagramUrl: null,
        content: `### Vertical Stack (V-Stack)
- **Estructura**: 2 o 3 Armadores (Handlers) en la base y 4 Cortadores (Cutters) alineados en fila vertical a 15-20 metros de distancia.
- **Dinámica**:
  1. El último cortador en la fila inicia el corte principal (corte hacia adentro o corte profundo).
  2. Si no recibe, despeja de inmediato y vuelve a la fila para no obstruir el carril.
  3. El segundo en la fila inicia el siguiente corte.
- **Resets**: Los handlers realizan pases de desahogo (dumps) al llegar a la cuenta de stall 6.`,
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'Horizontal Stack (H-Stack) con Variación Deep Iso',
        category: 'OFFENSE',
        description: 'Formación en línea transversal con 3 handlers y 4 cortadores distribuidos a lo ancho de la cancha. Genera pasillos abiertos e incorpora la variante de corte profundo aislado (Deep Iso) para receptores rápidos.',
        diagramUrl: null,
        content: `### Horizontal Stack (H-Stack)
- **Estructura**: 3 Handlers (Center, Left, Right) y 4 Cutters alineados en horizontal ocupando los 4 carriles (Left Wing, Left Middle, Right Middle, Right Wing).
- **Variación Deep Iso**:
  - Los cortadores laterales limpian hacia las bandas mientras uno de los medios ataca en velocidad el fondo para un pase largo (huck).
- **Ventaja**: Crea grandes pasillos de pase para jugadas uno contra uno.`,
        createdAt: new Date(),
      },
      {
        id: 3,
        name: 'Defensa en Zona Cup (3-3-1 Cup Defense)',
        category: 'DEFENSE',
        description: 'Sistema defensivo clásico de copa contra viento o ataques rápidos. Una copa de 3 defensas (Mark, Middle, Point) contiene el disco, 3 defensas intermedios (Short Deep y dos Wings) cubren pases medios, y 1 Deep-Deep protege el fondo.',
        diagramUrl: null,
        content: `### Defensa en Zona Cup (3-3-1)
- **Copa (3 jugadores)**: Point (bloquea pases frontales), Middle (evita pases cruzados) y Mark (presiona lanzamientos).
- **Línea Media (3 jugadores)**:
  - Short Deep: Corta pases sobre la copa (hammers y scoobers).
  - Left & Right Wings: Presionan pases hacia las líneas laterales.
- **Deep-Deep (1 jugador)**: Último hombre cubriendo cualquier pase largo (huck).`,
        createdAt: new Date(),
      },
      {
        id: 4,
        name: 'Defensa Dome / Clam (Cúpula Modular)',
        category: 'DEFENSE',
        description: 'Sistema defensivo híbrido en cúpula (Dome) protegiendo el centro del campo contra stacks verticales, forzando pases incómodos hacia las líneas laterales e induciendo errores de stall out.',
        diagramUrl: null,
        content: `### Defensa Dome / Clam
- **Objetivo**: Colapsar el medio campo e impedir cortes directos al pecho.
- **Distribución**: Los defensores forman un domo semicircular alrededor del stack rival.
- **Efectividad**: Altamente recomendada contra equipos dependientes de manejadores centrales.`,
        createdAt: new Date(),
      },
      {
        id: 5,
        name: 'Variación Endzone Iso (Aislamiento de Anotación)',
        category: 'OFFENSE',
        description: 'Jugada táctica para los últimos 15 metros. Los cortadores secundarios despejan al lado débil creando un espacio de 1 contra 1 para el cutter principal en la zona de gol.',
        diagramUrl: null,
        content: `### Endzone Iso (Zona Roja)
- **Posicionamiento**: 3 cortadores se abren hacia el lado break para vaciar el espacio de anotación.
- **Ejecución**: El cortador principal realiza un cambio de dirección violento hacia el cono frontal para recibir un pase de muñeca bajo o flick rápido.`,
        createdAt: new Date(),
      },
      {
        id: 6,
        name: 'Drill de Lanzamientos con Presión (Dump-Swing & 3-Man Weave)',
        category: 'DRILL',
        description: 'Ejercicio dinámico de 3 atletas para entrenar pases en movimiento, cambio de lado rápido del disco (swing) y reset defensivo en stall alto.',
        diagramUrl: null,
        content: `### Drill Dump-Swing
- **Objetivo**: Mecanizar el desahogo de disco cuando el lanzador llega a stall 6.
- **Duración**: 15 minutos en calentamiento con foco en pivoteo y pase de revés/flick bajo.`,
        createdAt: new Date(),
      },
    ];
    this.nextId['play'] = 7;

    // 13. Lesiones
    this.injuries = [];
    this.nextId['injury'] = 1;

    // 14. Canales y Mensajes de Comunicación
    this.channels = [
      { id: 1, name: 'Anuncios Generales', eventId: null, createdAt: new Date() },
      { id: 2, name: 'Línea Táctica y Entrenamientos', eventId: null, createdAt: new Date() },
    ];
    this.nextId['channel'] = 3;

    this.messages = [
      { id: 1, channelId: 1, authorId: null, content: '¡Bienvenidos a SIGEDIVO San Juan Ultimate Crew! Utilicen este canal para enterarse de los comunicados oficiales, eventos y directrices del club.', createdAt: new Date() },
      { id: 2, channelId: 2, authorId: null, content: 'Recuerden revisar el Playbook táctico (Vertical Stack y Zona Cup) antes de la práctica del fin de semana.', createdAt: new Date() },
    ];
    this.nextId['message'] = 3;

    // 15. Noticias y Recursos de Disco Volador / Ultimate Frisbee
    this.newsPosts = [
      {
        id: 1,
        title: '🏆 Gran Torneo Regional Open & Mixto: Convocatoria Oficial y Asignación de Mesa Técnica',
        content: `La Directiva y el Comité Técnico informan a todo el plantel que ha quedado oficialmente programado el **Torneo Regional Open & Mixto**.
        
📌 **Directrices Clave**:
- **Fecha y Lugar**: Sábado y Domingo en el Complejo Deportivo Central (Canchas 1 y 2).
- **Mesa Técnica**: Se han asignado anotadores oficiales autorizados para el control de cronómetro, planillas digitales en vivo y Spirit Score.
- **Roster & Asistencia**: Todo jugador debe confirmar su estado de asistencia en el módulo de Eventos antes del jueves 20:00.
- **Indumentaria**: Llevar ambas camisetas oficiales (Oscura y Clara/Blanca).

*Por favor utilicen los comentarios abajo para dudas puntuales sobre logística o transporte. Recordamos el límite de 3 comentarios por miembro.*`,
        authorId: 1,
        isPinned: true,
        isPublished: true,
        category: '🏆 Torneo / Evento',
        commentsLocked: false,
        eventId: 1,
        createdAt: new Date(Date.now() - 3600000 * 5),
        updatedAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        id: 2,
        title: '⏱️ Aviso de Mesa Técnica: Ajuste de Horarios por Clima / Mantenimiento',
        content: `Atención a todas las escuadras: Debido a los trabajos de drenaje en Cancha 2 y pronóstico de llovizna matutina, los primeros 2 encuentros tendrán un **desplazamiento de +30 minutos**.
        
- **Partido Inaugural**: Iniciará a las 09:30 AM (en lugar de las 09:00 AM).
- **Control de Mesa**: Las planillas en vivo y el reloj de calentamiento se abrirán 15 minutos antes.
- **Recomendación**: Llevar calzado con tapones adecuados para césped húmedo y toallas de microfibra para secar discos.`,
        authorId: 2,
        isPinned: true,
        isPublished: true,
        category: '⏱️ Eventualidad de Mesa Técnica',
        commentsLocked: false,
        eventId: 2,
        createdAt: new Date(Date.now() - 3600000 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        id: 3,
        title: '🥏 Guía Rápida de SIGEDIVO San Juan Ultimate Crew',
        content: `¡Saludos a todos los atletas y miembros de **San Juan Ultimate Crew**!

Esta plataforma ha sido diseñada para optimizar nuestra gestión deportiva, táctica y organizativa:

1. **📅 Calendario y Convocatorias (RSVP)**: Confirmen asistencia antes de cada entrenamiento y partido para estructurar Líneas O y D.
2. **📋 Pizarra Táctica (Playbook)**: Consulten jugadas como Vertical Stack, Horizontal Stack y Defensa Cup.
3. **💰 Transparencia Financiera**: Revisen aportes, compras de material y presupuestos de torneos.
4. **📚 Recursos y Reglamento**: Acceso al reglamento oficial de la WFDF y manual de Espíritu de Juego (SOTG).`,
        authorId: null,
        isPinned: false,
        isPublished: true,
        category: 'Anuncios',
        commentsLocked: false,
        createdAt: new Date(Date.now() - 86400000 * 3),
        updatedAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        id: 4,
        title: '🥏 Taller de Lanzamientos: Perfeccionamiento de Forehand y Lanzamientos Invertidos',
        content: `En las próximas sesiones dedicaremos un bloque especial al pulido del pase de derecha (Forehand / Flick), Hammer y Scoober para romper marcas en zona. Revisen el material complementario en la sección de Recursos.`,
        authorId: null,
        isPinned: false,
        isPublished: true,
        category: 'Entrenamiento',
        commentsLocked: false,
        createdAt: new Date(Date.now() - 86400000 * 5),
        updatedAt: new Date(Date.now() - 86400000 * 5),
      },
    ];
    this.nextId['newsPost'] = 5;
    this.newsPostFiles = [];
    this.nextId['newsPostFile'] = 1;

    this.newsComments = [
      {
        id: 1,
        postId: 1,
        userId: 1,
        authorName: 'Admin Frank',
        authorRole: 'Directiva',
        content: 'Recordamos a los capitanes estar 45 minutos antes para la reunión de capitanes y sorteo de discos.',
        createdAt: new Date(Date.now() - 3600000 * 4),
        updatedAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        id: 2,
        postId: 1,
        userId: 2,
        authorName: 'Capitán Carlos',
        authorRole: 'Capitán',
        content: 'Entendido. Línea O confirmada al 100%. Llevaremos conos adicionales para el calentamiento.',
        createdAt: new Date(Date.now() - 3600000 * 3),
        updatedAt: new Date(Date.now() - 3600000 * 3),
      },
      {
        id: 3,
        postId: 2,
        userId: 3,
        authorName: 'Mesa Técnica Principal',
        authorRole: 'Mesa Técnica',
        content: 'Canchas revisadas. El cronómetro oficial y la transmisión de anotaciones en vivo comenzarán a las 09:15 AM.',
        createdAt: new Date(Date.now() - 3600000 * 1),
        updatedAt: new Date(Date.now() - 3600000 * 1),
      },
    ];
    this.nextId['newsComment'] = 4;

    this.resources = [
      {
        id: 1,
        title: 'Reglamento Oficial de Ultimate WFDF 2021-2024 / 2025 (Español)',
        category: 'Reglamento y Normativas',
        description: 'Reglas oficiales de la World Flying Disc Federation: no contacto físico, conteo de stall de 10 segundos, autogestión de faltas y dimensiones de campo (100x37m).',
        url: 'https://rules.wfdf.sport/',
        fileName: 'Reglas_Oficiales_WFDF_Ultimate.pdf',
        mimeType: 'application/pdf',
        size: 1850000,
        storagePath: null,
        createdAt: new Date(),
      },
      {
        id: 2,
        title: 'Manual de Espíritu de Juego (Spirit of the Game - SOTG)',
        category: 'Espíritu de Juego',
        description: 'Criterios y rúbrica oficial de la WFDF para la puntuación SOTG: Conocimiento de reglas, faltas y contacto, imparcialidad, actitud positiva y comunicación.',
        url: 'https://wfdf.sport/organisation/spirit-of-the-game/',
        fileName: 'Guia_Oficial_Espiritu_de_Juego_SOTG.pdf',
        mimeType: 'application/pdf',
        size: 920000,
        storagePath: null,
        createdAt: new Date(),
      },
      {
        id: 3,
        title: 'Guía Oficial de Señales de Mano WFDF',
        category: 'Reglamento y Normativas',
        description: 'Señales gestuales estándar para llamadas en cancha: In/Out, Falta, Pick, Travel, Stall Out, Delay y Gol.',
        url: 'https://rules.wfdf.sport/',
        fileName: 'Senales_de_Mano_WFDF.pdf',
        mimeType: 'application/pdf',
        size: 1250000,
        storagePath: null,
        createdAt: new Date(),
      },
      {
        id: 4,
        title: 'Manual Técnico de Lanzamientos Fundamentales',
        category: 'Entrenamiento Técnico',
        description: 'Mecánica de agarres y lanzamientos: Backhand (Revés), Forehand/Flick (Sidearm), Hammer (Martillo), Scoober y pivoteo con pie de apoyo.',
        url: 'https://wfdf.sport/',
        fileName: 'Manual_Lanzamientos_Ultimate.pdf',
        mimeType: 'application/pdf',
        size: 2100000,
        storagePath: null,
        createdAt: new Date(),
      },
      {
        id: 5,
        title: 'Guía de Nutrición e Hidratación para Torneos de Fin de Semana',
        category: 'Salud y Bienestar',
        description: 'Protocolos de recarga de electrolitos, ingesta calórica entre partidos consecutivos y prevención de calambres bajo calor intenso.',
        url: 'https://wfdf.sport/',
        fileName: 'Nutricion_e_Hidratacion_Ultimate.pdf',
        mimeType: 'application/pdf',
        size: 780000,
        storagePath: null,
        createdAt: new Date(),
      },
    ];
    this.nextId['resource'] = 6;
    this.roleRequests = [];
    this.nextId['roleRequest'] = 1;
    this.auditLogs = [];
    this.nextId['auditLog'] = 1;
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
    if ((key === 'eventId_playerId' || key === 'playerId_eventId') && typeof val === 'object' && val !== null) {
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
      const seenRoleIds = new Set<number>();
      clone.roles = dbInstance.userRoles
        .filter((ur) => {
          if (ur.userId !== item.id) return false;
          if (seenRoleIds.has(ur.roleId)) return false;
          seenRoleIds.add(ur.roleId);
          return true;
        })
        .map((ur) => {
          const role = dbInstance.roles.find((r) => r.id === ur.roleId);
          const roleObj: any = role ? { ...role } : null;
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
    if (include.team) {
      clone.team = item.teamId ? dbInstance.teams.find((t) => t.id === item.teamId) || null : null;
    }
    if (include.user) {
      clone.user = dbInstance.users.find((u) => u.playerId === item.id) || null;
    }
    if (include.injuries) {
      clone.injuries = dbInstance.injuries.filter((i) => i.playerId === item.id);
    }
    if (include.attendances) {
      clone.attendances = dbInstance.attendances.filter((a) => a.playerId === item.id);
    }
    if (include.playerMatchStats) {
      clone.playerMatchStats = dbInstance.playerMatchStats.filter((pms) => pms.playerId === item.id);
    }
  }

  if (tableName === 'event') {
    if (include.team) {
      clone.team = item.teamId ? dbInstance.teams.find((t) => t.id === item.teamId) || null : null;
    }
    if (include.awayTeam) {
      clone.awayTeam = item.awayTeamId ? dbInstance.teams.find((t) => t.id === item.awayTeamId) || null : null;
    }
    if (include.officialAnnotator) {
      clone.officialAnnotator = item.officialAnnotatorId ? dbInstance.users.find((u) => u.id === item.officialAnnotatorId) || null : null;
    }
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
      clone.annotations = dbInstance.eventAnnotations
        .filter((ea) => ea.eventId === item.id)
        .map((ea) => ({
          ...ea,
          player: ea.playerId ? dbInstance.players.find((p) => p.id === ea.playerId) || null : null,
          relatedPlayer: ea.relatedPlayerId ? dbInstance.players.find((p) => p.id === ea.relatedPlayerId) || null : null,
          rival: ea.rivalId ? dbInstance.rivals.find((r) => r.id === ea.rivalId) || null : null,
          rivalPlayer: ea.rivalPlayerId ? dbInstance.rivalPlayers.find((rp) => rp.id === ea.rivalPlayerId) || null : null,
        }));
    }
    if (include.children) {
      clone.children = dbInstance.events
        .filter((e) => e.parentId === item.id)
        .map((child) => ({
          ...child,
          team: child.teamId ? dbInstance.teams.find((t) => t.id === child.teamId) || null : null,
          awayTeam: child.awayTeamId ? dbInstance.teams.find((t) => t.id === child.awayTeamId) || null : null,
          officialAnnotator: child.officialAnnotatorId ? dbInstance.users.find((u) => u.id === child.officialAnnotatorId) || null : null,
        }));
    }
    if (include.parent) {
      clone.parent = dbInstance.events.find((e) => e.id === item.parentId) || null;
    }
    if (include.rival) {
      clone.rival = dbInstance.rivals.find((r) => r.id === item.rivalId) || null;
    }
    if (include.spiritScores) {
      clone.spiritScores = dbInstance.spiritScores.filter((s) => s.eventId === item.id);
    }
  }

  if (tableName === 'eventAnnotation') {
    if (include.player) {
      clone.player = item.playerId ? dbInstance.players.find((p) => p.id === item.playerId) || null : null;
    }
    if (include.relatedPlayer) {
      clone.relatedPlayer = item.relatedPlayerId ? dbInstance.players.find((p) => p.id === item.relatedPlayerId) || null : null;
    }
    if (include.event) {
      clone.event = dbInstance.events.find((e) => e.id === item.eventId) || null;
    }
    if (include.createdByUser) {
      clone.createdByUser = item.createdBy ? dbInstance.users.find((u) => u.id === item.createdBy) || null : null;
    }
    if (include.rival) {
      clone.rival = item.rivalId ? dbInstance.rivals.find((r) => r.id === item.rivalId) || null : null;
    }
    if (include.rivalPlayer) {
      clone.rivalPlayer = item.rivalPlayerId ? dbInstance.rivalPlayers.find((rp) => rp.id === item.rivalPlayerId) || null : null;
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

  if (tableName === 'channel') {
    if (include.event) {
      clone.event = item.eventId ? dbInstance.events.find((e) => e.id === item.eventId) || null : null;
    }
    if (include.messages) {
      let msgs = dbInstance.messages.filter((m) => m.channelId === item.id);
      if (include.messages.orderBy?.createdAt === 'desc') {
        msgs = [...msgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      if (include.messages.take) {
        msgs = msgs.slice(0, include.messages.take);
      }
      clone.messages = msgs;
    }
    if (include._count?.select?.messages) {
      clone._count = { messages: dbInstance.messages.filter((m) => m.channelId === item.id).length };
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
    if (include.comments) {
      let comments = dbInstance.newsComments.filter((c) => c.postId === item.id);
      if (include.comments.orderBy?.createdAt === 'desc') {
        comments = [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        comments = [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      clone.comments = comments.map((c) => ({
        ...c,
        user: c.userId ? dbInstance.users.find((u) => u.id === c.userId) || null : null,
      }));
    }
    if (include._count?.select?.comments) {
      clone._count = {
        ...(clone._count || {}),
        comments: dbInstance.newsComments.filter((c) => c.postId === item.id).length,
      };
    }
    if (include.event) {
      clone.event = item.eventId ? dbInstance.events.find((e) => e.id === item.eventId) || null : null;
    }
  }

  if (tableName === 'newsComment') {
    if (include.user) {
      clone.user = item.userId ? dbInstance.users.find((u) => u.id === item.userId) || null : null;
    }
    if (include.post) {
      clone.post = dbInstance.newsPosts.find((p) => p.id === item.postId) || null;
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

// Apply update data including increment / decrement operators
function applyUpdateData(target: any, data: any) {
  if (!data) return target;
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) {
      if (typeof (v as any).increment === 'number') {
        target[k] = (target[k] || 0) + (v as any).increment;
      } else if (typeof (v as any).decrement === 'number') {
        target[k] = (target[k] || 0) - (v as any).decrement;
      } else if (typeof (v as any).set !== 'undefined') {
        target[k] = (v as any).set;
      } else {
        target[k] = v;
      }
    } else {
      target[k] = v;
    }
  }
  target.updatedAt = new Date();
  return target;
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
      applyUpdateData(arr[index], args?.data);
      return hydrateItem(tableName, arr[index], args?.include);
    },
    updateMany: async (args: any) => {
      const arr = getArray();
      let count = 0;
      for (let i = 0; i < arr.length; i++) {
        if (matchesWhere(arr[i], args?.where)) {
          applyUpdateData(arr[i], args?.data);
          count++;
        }
      }
      return { count };
    },
    upsert: async (args: any) => {
      const arr = getArray();
      const index = arr.findIndex((it) => matchesWhere(it, args?.where));
      if (index !== -1) {
        applyUpdateData(arr[index], args?.update);
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
      if (args?._sum) {
        res._sum = {};
        for (const sumKey of Object.keys(args._sum)) {
          res._sum[sumKey] = matches.reduce((acc, it) => acc + (Number(it[sumKey]) || 0), 0);
        }
      }
      return res;
    },
    groupBy: async (args: any) => {
      const arr = getArray();
      const matches = arr.filter((it) => matchesWhere(it, args?.where));
      const byFields: string[] = Array.isArray(args?.by) ? args.by : [args?.by];
      const groups = new Map<string, any>();

      for (const item of matches) {
        const key = byFields.map((f) => String(item[f])).join(':::');
        if (!groups.has(key)) {
          const groupObj: any = {};
          byFields.forEach((f) => {
            groupObj[f] = item[f];
          });
          if (args?._count) {
            groupObj._count = { _all: 0 };
          }
          if (args?._sum) {
            groupObj._sum = {};
            for (const sumKey of Object.keys(args._sum)) {
              groupObj._sum[sumKey] = 0;
            }
          }
          groups.set(key, groupObj);
        }

        const group = groups.get(key);
        if (group._count) {
          group._count._all++;
        }
        if (group._sum) {
          for (const sumKey of Object.keys(args._sum)) {
            group._sum[sumKey] += Number(item[sumKey]) || 0;
          }
        }
      }

      return Array.from(groups.values());
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
  team: createModelHandler('team', () => dbInstance.teams),
  user: createModelHandler('user', () => dbInstance.users),
  role: createModelHandler('role', () => dbInstance.roles),
  permission: createModelHandler('permission', () => dbInstance.permissions),
  userRole: createModelHandler('userRole', () => dbInstance.userRoles),
  rolePermission: createModelHandler('rolePermission', () => dbInstance.rolePermissions),
  player: createModelHandler('player', () => dbInstance.players),
  event: createModelHandler('event', () => dbInstance.events),
  channel: createModelHandler('channel', () => dbInstance.channels),
  message: createModelHandler('message', () => dbInstance.messages),
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
  newsComment: createModelHandler('newsComment', () => dbInstance.newsComments),
  roleRequest: createModelHandler('roleRequest', () => dbInstance.roleRequests),
  auditLog: createModelHandler('auditLog', () => dbInstance.auditLogs),
  passwordResetToken: createModelHandler('passwordResetToken', () => dbInstance.passwordResetTokens),
  feedback: createModelHandler('feedback', () => dbInstance.feedbacks),

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
