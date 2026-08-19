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

    // 3. Players - TOTALMENTE VACÍO
    this.players = [];
    this.nextId['player'] = 1;

    // 4. Users (Únicamente 2 usuarios iniciales pre-aprobados: Super Admin e Invitado)
    const coreUsers = [
      { id: 1, email: 'frankalfonso1988@gmail.com', name: 'Administrador General', role: 'admin', playerId: null },
      { id: 2, email: 'guest@sigedivo.com', name: 'Invitado / Demostración', role: 'guest', playerId: null },
    ];

    this.users = coreUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      passwordHash: DEFAULT_PW_HASH,
      status: 'APPROVED',
      playerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    this.nextId['user'] = 3;

    coreUsers.forEach((u) => {
      this.userRoles.push({ userId: u.id, roleId: roleMap[u.role] });
    });

    // 5. Rivales y Jugadores Oponentes - TOTALMENTE VACÍO
    this.rivals = [];
    this.nextId['rival'] = 1;
    this.rivalPlayers = [];
    this.nextId['rivalPlayer'] = 1;

    // 6. Eventos - TOTALMENTE VACÍO
    this.events = [];
    this.nextId['event'] = 1;

    // 7. Event Participants & Attendance - TOTALMENTE VACÍO
    this.eventParticipants = [];
    this.attendances = [];
    this.nextId['attendance'] = 1;

    // 8. Event Annotations - TOTALMENTE VACÍO
    this.eventAnnotations = [];
    this.nextId['annotation'] = 1;

    // 9. PlayerMatchStats - TOTALMENTE VACÍO
    this.playerMatchStats = [];
    this.nextId['playerMatchStats'] = 1;

    // 10. Spirit Scores - TOTALMENTE VACÍO
    this.spiritScores = [];
    this.nextId['spiritScore'] = 1;

    // 11. Finanzas: Cuentas, Categorías y Transacciones - TOTALMENTE VACÍO
    this.accounts = [];
    this.nextId['account'] = 1;
    this.categories = [];
    this.nextId['category'] = 1;
    this.transactions = [];
    this.nextId['transaction'] = 1;

    // 12. Jugadas Tácticas (Playbook) - TOTALMENTE VACÍO
    this.plays = [];
    this.nextId['play'] = 1;

    // 13. Lesiones - TOTALMENTE VACÍO
    this.injuries = [];
    this.nextId['injury'] = 1;

    // 14. Canales y Mensajes - TOTALMENTE VACÍO
    this.channels = [];
    this.nextId['channel'] = 1;
    this.messages = [];
    this.nextId['message'] = 1;

    // 15. Noticias y Recursos - TOTALMENTE VACÍO
    this.newsPosts = [];
    this.nextId['newsPost'] = 1;
    this.newsPostFiles = [];
    this.nextId['newsPostFile'] = 1;
    this.resources = [];
    this.nextId['resource'] = 1;
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
    if (include.playerMatchStats) {
      clone.playerMatchStats = dbInstance.playerMatchStats.filter((pms) => pms.playerId === item.id);
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
      clone.children = dbInstance.events.filter((e) => e.parentId === item.id);
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
