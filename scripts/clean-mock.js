import fs from 'fs';

const path = 'apps/api/src/lib/mockDb.ts';
let code = fs.readFileSync(path, 'utf8');

const equipIdx = code.indexOf('// 3. Escuadras Internas del Club (White-Label Intra-Club Squads)');
const findManyIdx = code.indexOf('  async findMany(');

if (equipIdx !== -1 && findManyIdx !== -1) {
  const cleanSquadsAndState = `// 3. Escuadras Internas del Club (White-Label Intra-Club Squads)
    this.teams = [
      {
        id: 1,
        name: 'Equipo A',
        tag: 'EQA',
        categories: 'Open Masculino',
        color: '#111827',
        notes: 'Escuadra Principal Open Masculino',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Equipo B',
        tag: 'EQB',
        categories: 'Open Masculino',
        color: '#0284c7',
        notes: 'Escuadra de Desarrollo y Formación',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: 'Femenino',
        tag: 'FEM',
        categories: 'Open Femenino',
        color: '#ec4899',
        notes: 'Escuadra Femenina Oficial',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        name: 'Mixto',
        tag: 'MIX',
        categories: 'Mixto',
        color: '#10b981',
        notes: 'Escuadra Mixta para Torneos y Caimaneras',
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    this.nextId['team'] = 5;

    this.players = [];
    this.nextId['player'] = 1;

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

    this.rivals = [];
    this.rivalPlayers = [];
    this.events = [];
    this.eventParticipants = [];
    this.eventAnnotations = [];
    this.playerMatchStats = [];
    this.spiritScores = [];
    this.accounts = [
      { id: 1, name: 'Caja Chica (Efectivo / USD)', type: 'CASH', balanceCents: 0, description: 'Fondos en efectivo para hidratación, hielo y gastos menores de cancha.', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Cuenta Bancaria / Pago Móvil / Zelle', type: 'BANK', balanceCents: 0, description: 'Cuenta bancaria para cuotas mensuales de atletas, inscripciones y patrocinios.', createdAt: new Date(), updatedAt: new Date() },
    ];
    this.nextId['account'] = 3;
    this.categories = [];
    this.transactions = [];
    this.nextId['transaction'] = 1;
    this.plays = [];
    this.injuries = [];
    this.channels = [];
    this.messages = [];
    this.newsPosts = [];
    this.newsPostFiles = [];
    this.newsComments = [];
    this.resources = [];
    this.roleRequests = [];
    this.auditLogs = [];
  }

  `;

  const newCode = code.slice(0, equipIdx) + cleanSquadsAndState + code.slice(findManyIdx);
  fs.writeFileSync(path, newCode);
  console.log('mockDb.ts reset to clean intra-club baseline.');
} else {
  console.log('Indices not found; mockDb.ts already formatted cleanly.');
}
