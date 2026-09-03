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

    // 3. Equipos del Ecosistema Multi-Equipo por Defecto
    this.teams = [
      {
        id: 1,
        name: 'El Pueblito',
        tag: 'EPB',
        categories: 'Open Masculino',
        color: '#111827',
        notes: 'Equipo Open Masculino - Color representativo Negro',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Warao',
        tag: 'WAR',
        categories: 'Open Masculino',
        color: '#1f2937',
        notes: 'Equipo Open Masculino - Color representativo Negro',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: 'Medusa',
        tag: 'MED',
        categories: 'Open Femenino y Mixto',
        color: '#7e22ce',
        notes: 'Equipo Open Femenino y Mixto - Color representativo Púrpura',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        name: 'MotherFlowers',
        tag: 'MOF',
        categories: 'Open Femenino',
        color: '#ec4899',
        notes: 'Equipo Open Femenino - Color representativo Rosado',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        name: 'Raza',
        tag: 'RAZ',
        categories: 'Open Masculino',
        color: '#dc2626',
        notes: 'Equipo Open Masculino - Color representativo Rojo',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        name: 'Harakiri',
        tag: 'HKR',
        categories: 'Open Masculino',
        color: '#800020',
        notes: 'Equipo Open Masculino - Color representativo Vinotinto',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 7,
        name: 'Ad Astra',
        tag: 'AST',
        categories: 'Mixto',
        color: '#1d4ed8',
        notes: 'Equipo Mixto - Color representativo Azul',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 8,
        name: 'Araguaney',
        tag: 'ARA',
        categories: 'Open Masculino',
        color: '#eab308',
        notes: 'Equipo Open Masculino - Color representativo Amarillo',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 9,
        name: 'Voladores',
        tag: 'VOL',
        categories: 'Open Masculino',
        color: '#f8fafc',
        notes: 'Equipo Open Masculino - Color representativo Blanco',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 10,
        name: 'Trébol',
        tag: 'TRE',
        categories: 'Open Masculino',
        color: '#16a34a',
        notes: 'Equipo Open Masculino - Color representativo Verde',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 11,
        name: 'Alianza',
        tag: 'ALI',
        categories: 'Open Masculino',
        color: '#ea580c',
        notes: 'Equipo Open Masculino - Color representativo Naranja',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    this.nextId['team'] = 12;

    // 4. Players (Roster por Equipo + Agentes Libres / Sin Equipo)
    this.players = [];
    this.nextId['player'] = 1;

    // 5. Users (Admin, Guest, Capitanes, Coaches, Mesa Técnica y Atletas)
    const coreUsers = [
      { id: 1, email: 'frankalfonso1988@gmail.com', name: 'Frank Sousa (Admin)', role: 'admin', playerId: null, teamId: null },
      { id: 2, email: 'guest@sigedivo.com', name: 'Invitado / Demostración', role: 'guest', playerId: null, teamId: null },
      { id: 3, email: 'player@sigedivo.com', name: 'Atleta Oficial', role: 'player', playerId: null, teamId: 1 }
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
    this.nextId['user'] = 4;

    coreUsers.forEach((u) => {
      this.userRoles.push({ userId: u.id, roleId: roleMap[u.role] });
    });

    // 6. Rivales y Jugadores Oponentes
    this.rivals = [
      {
        id: 1,
        name: 'Comunidad El Oso',
        strengths: 'Juego vertical rápido, defensa de zona cerrada',
        weaknesses: 'Pases forzados bajo presión en la línea final',
        lastPlayedAt: null,
        notes: 'Rival tradicional categoría Open y Mixto',
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'Revolution Ultimate',
        strengths: 'Gran precisión en hucks largos, alto atletismo',
        weaknesses: 'Desgaste físico en segundas mitades de torneos',
        lastPlayedAt: null,
        notes: 'Equipo élite de referencia',
        createdAt: new Date(),
      },
      {
        id: 3,
        name: 'Discolocos',
        strengths: 'Handlers experimentados con lanzamientos invertidos (scoobers/hammers)',
        weaknesses: 'Vulnerables a marcas hombre a hombre asfixiantes',
        lastPlayedAt: null,
        notes: 'Rival de circuito regional',
        createdAt: new Date(),
      },
    ];
    this.nextId['rival'] = 4;

    this.rivalPlayers = [];
    this.nextId['rivalPlayer'] = 1;

    // 7. Eventos (Torneo Mixto de Fin de Mes con Fixtures + Evento Completado Previo)
    const tournamentDate = new Date('2026-08-29T08:00:00Z');
    const tournamentEndDate = new Date('2026-08-30T19:00:00Z');

    this.events = [];
    this.nextId['event'] = 1;

    // 8. Event Participants & Attendance (Nóminas, Refuerzos y Mesa Técnica)
    this.eventParticipants = [];
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
    this.eventAnnotations = [];
    this.nextId['annotation'] = 11;

    // 10. PlayerMatchStats
    this.playerMatchStats = [];
    this.nextId['playerMatchStats'] = 9;

    // 11. Spirit Scores
    this.spiritScores = [];
    this.nextId['spiritScore'] = 1;

    // 11. Finanzas: Cuentas, Categorías y Transacciones de Ejemplo Realista
    this.accounts = [
  { id: 1, name: 'Caja Chica (Efectivo / USD)', type: 'CASH', balanceCents: 15000, description: 'Fondos en efectivo para hidratación, hielo y gastos menores de cancha.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 2, name: 'Cuenta Bancaria / Pago Móvil / Zelle', type: 'BANK', balanceCents: 125000, description: 'Cuenta bancaria para cuotas mensuales de atletas, inscripciones y patrocinios.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
];
    this.nextId['account'] = 3;

    this.categories = [
  { id: 1, name: 'Cuotas de Membresía Mensual', kind: 'INCOME', description: 'Pago de mensualidades y mantenimiento deportivo de atletas.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 2, name: 'Venta de Discos Oficiales 175g', kind: 'INCOME', description: 'Venta de discos oficiales Discraft Ultra-Star de competencia.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 3, name: 'Patrocinios y Donaciones', kind: 'INCOME', description: 'Aportes de aliados y patrocinadores del club.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 4, name: 'Compra de Discos y Conos', kind: 'EXPENSE', description: 'Adquisición de material técnico reglamentario.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 5, name: 'Hidratación y Primeros Auxilios', kind: 'EXPENSE', description: 'Botellones de agua, hielo, vendas y botiquín.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 6, name: 'Inscripción a Torneo Nacional', kind: 'EXPENSE', description: 'Pago de Bid Fee y cuotas de participación en torneos.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
];
    this.nextId['category'] = 7;

    this.transactions = [
    { id: 1, type: 'INCOME', amountCents: 10000, description: 'Cobro de cuotas mensuales de atletas (Enero)', occurredAt: new Date(new Date().getTime() - 86400000 * 18).toISOString(), accountId: 2, categoryId: 1, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
    { id: 2, type: 'INCOME', amountCents: 7500, description: 'Venta de 5 discos oficiales Discraft Ultra-Star 175g', occurredAt: new Date(new Date().getTime() - 86400000 * 12).toISOString(), accountId: 2, categoryId: 2, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
    { id: 3, type: 'EXPENSE', amountCents: 12000, description: 'Compra de lote de 10 discos oficiales de competencia', occurredAt: new Date(new Date().getTime() - 86400000 * 10).toISOString(), accountId: 2, categoryId: 4, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
    { id: 4, type: 'EXPENSE', amountCents: 1850, description: 'Agua potable y bolsas de hielo para entrenamiento de fin de semana', occurredAt: new Date(new Date().getTime() - 86400000 * 5).toISOString(), accountId: 1, categoryId: 5, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
    { id: 5, type: 'EXPENSE', amountCents: 15000, description: 'Anticipo de Bid Fee - Copa Nacional de Ultimate Frisbee', occurredAt: new Date(new Date().getTime() - 86400000 * 3).toISOString(), accountId: 2, categoryId: 6, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') }
  ];
    this.nextId['transaction'] = 6;

    // 12. Jugadas Tácticas (Playbook) - Ultimate Frisbee / Disco Volador
    this.plays = [
  { id: 301, name: 'Vertical Stack Estándar (Cortes Open y Break Side)', category: 'OFFENSE', description: 'Formación clásica en columna vertical. Cortadores atacan sucesivamente desde el fondo hacia el lado abierto o lado cerrado con resets rápidos en stall 6.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 302, name: 'Horizontal Stack (H-Stack) con Variación Deep Iso', category: 'OFFENSE', description: 'Formación en línea transversal con 3 handlers y 4 cutters. Genera pasillos abiertos en carriles centrales e incorpora corte profundo aislado para receptores veloces.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 303, name: 'Defensa en Zona Cup (3-3-1 Cup Defense)', category: 'DEFENSE', description: 'Sistema de copa de 3 defensas (Mark, Middle, Point), 3 intermedios (Short Deep y Wings) y 1 Deep-Deep. Excelente para frenar ataques en días de viento.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 304, name: 'Defensa Dome / Clam (Cúpula Modular)', category: 'DEFENSE', description: 'Esquema defensivo híbrido en domo que colapsa el centro del campo contra stacks verticales, forzando tiros difíciles hacia las bandas e induciendo stall outs.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 305, name: 'Variación Endzone Iso (Aislamiento de Anotación)', category: 'OFFENSE', description: 'Jugada en zona roja (últimos 15 metros). Cutters despejan al lado débil dejando espacio libre de 1 contra 1 para el cortador principal.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 306, name: 'Drill de Lanzamientos con Presión (Dump-Swing)', category: 'DRILL', description: 'Ejercicio dinámico de 3 atletas para mecanizar pases en movimiento, cambio rápido de frente (swing) y desahogo con pivoteo bajo marca estricta.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
];
    this.nextId['play'] = 307;

    // 13. Lesiones
    this.injuries = [];
    this.nextId['injury'] = 1;

    // 14. Canales y Mensajes de Comunicación
    this.channels = [];
    this.nextId['channel'] = 1;

    this.messages = [];
    this.nextId['message'] = 1;

    // 15. Noticias y Recursos de Disco Volador / Ultimate Frisbee
    this.newsPosts = [
  {
    id: 1,
    title: '🏆 ¡Bienvenidos a SIGEDIVO! Guía Rápida del Sistema',
    content: `¡Saludos a todos los atletas y miembros de **SIGEDIVO**!
Esta plataforma ha sido diseñada para optimizar nuestra gestión deportiva, táctica y organizativa. A continuación, les compartimos los puntos clave para el uso diario:

1. **📅 Calendario y Convocatorias (RSVP)**: Ingresen a la sección de *Eventos* para confirmar su disponibilidad (Asistiré / Pendiente / No podré) antes de cada entrenamiento y partido. Esto permite a los entrenadores y capitanes definir las líneas de juego (Línea O / Línea D).
2. **📋 Pizarra Táctica (Playbook)**: Consulten las jugadas oficiales (*Vertical Stack*, *Horizontal Stack*, *Defensa en Zona Cup* y *Dome*) para llegar al campo con la estrategia clara.
3. **💰 Transparencia Financiera**: En el módulo de *Finanzas* pueden revisar el balance general del club, aportes de membresía, compra de discos reglamentarios y presupuesto de torneos.
4. **📚 Recursos y Reglamento**: En la sección de *Recursos* tienen acceso al reglamento oficial de la **WFDF**, la guía de **Espíritu de Juego (SOTG)** y manuales de preparación técnica.
5. **💬 Canales de Chat**: Manténganse conectados en los canales de mensajería para coordinar traslados y resolver dudas con capitanes y cuerpo técnico.

*¡A darlo todo en la cancha con el mejor Espíritu de Juego!*`,
    isImportant: true,
    isPinned: true,
    category: 'Anuncios',
    createdAt: new Date(new Date().getTime() - 86400000 * 1).toISOString(),
    updatedAt: new Date(new Date().getTime() - 86400000 * 1).toISOString(),
    authorId: 1
  }
];
    this.nextId['newsPost'] = 2;
    this.newsPostFiles = [];
    this.nextId['newsPostFile'] = 1;

    this.newsComments = [];
    this.nextId['newsComment'] = 1;

    this.resources = [
  { id: 501, title: 'Reglamento Oficial de Ultimate WFDF 2021-2024 / 2025 (Español)', category: 'Reglamento y Normativas', description: 'Reglas oficiales de la World Flying Disc Federation: no contacto, stall count de 10s, autogestión de faltas y dimensiones de campo 100x37m.', url: 'https://rules.wfdf.sport/', fileName: 'Reglas_Oficiales_WFDF_Ultimate.pdf', size: 1850000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 502, title: 'Manual de Espíritu de Juego (Spirit of the Game - SOTG)', category: 'Espíritu de Juego', description: 'Criterios y rúbrica oficial de la WFDF para la puntuación SOTG: Conocimiento de reglas, faltas y contacto, imparcialidad, actitud positiva y comunicación.', url: 'https://wfdf.sport/organisation/spirit-of-the-game/', fileName: 'Guia_Oficial_Espiritu_de_Juego_SOTG.pdf', size: 920000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 503, title: 'Guía Oficial de Señales de Mano WFDF', category: 'Reglamento y Normativas', description: 'Señales gestuales universales de jugadores: In/Out, Falta, Pick, Travel, Stall Out, Delay y Gol.', url: 'https://rules.wfdf.sport/', fileName: 'Senales_de_Mano_WFDF.pdf', size: 1250000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 504, title: 'Manual Técnico de Lanzamientos Fundamentales', category: 'Entrenamiento Técnico', description: 'Mecánica de agarres y lanzamientos: Backhand (Revés), Forehand/Flick (Sidearm), Hammer (Martillo), Scoober y pivoteo con pie de apoyo.', url: 'https://wfdf.sport/', fileName: 'Manual_Lanzamientos_Ultimate.pdf', size: 2100000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 505, title: 'Guía de Nutrición e Hidratación para Torneos de Fin de Semana', category: 'Salud y Bienestar', description: 'Protocolos de recarga de electrolitos, ingesta calórica entre partidos consecutivos y prevención de calambres bajo calor intenso.', url: 'https://wfdf.sport/', fileName: 'Nutricion_e_Hidratacion_Ultimate.pdf', size: 780000, createdAt: new Date('2025-01-01T10:00:00Z') },
];
    this.nextId['resource'] = 506;
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

  if (tableName === 'team') {
    if (include.players) {
      let pls = dbInstance.players.filter((p) => p.teamId === item.id);
      if (include.players.orderBy?.number === 'asc') {
        pls = [...pls].sort((a, b) => (a.number || 0) - (b.number || 0));
      }
      clone.players = pls;
    }
    if (include._count) {
      const playersCount = dbInstance.players.filter((p) => p.teamId === item.id).length;
      const usersCount = dbInstance.users.filter((u) => u.teamId === item.id).length;
      const eventsCount = dbInstance.events.filter((e) => e.teamId === item.id || e.awayTeamId === item.id).length;
      clone._count = {
        players: playersCount,
        users: usersCount,
        events: eventsCount,
      };
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
