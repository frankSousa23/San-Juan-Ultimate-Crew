import fs from 'fs';

const path = 'apps/api/src/lib/mockDb.ts';
let code = fs.readFileSync(path, 'utf8');

const equipIdx = code.indexOf('// 3. Equipos del Ecosistema Beta Multi-Equipo');
const findManyIdx = code.indexOf('  async findMany(');

const newContent = `    // 3. System Cleaned
    this.teams = [];
    this.nextId['team'] = 1;
    this.players = [];
    this.nextId['player'] = 1;
    this.users = [
      { 
        id: 1, 
        email: 'frankalfonso1988@gmail.com', 
        name: 'Frank Sousa (Admin)', 
        passwordHash: ADMIN_PW_HASH, 
        status: 'APPROVED', 
        playerId: null, 
        teamId: null, 
        createdAt: new Date(), 
        updatedAt: new Date() 
      }
    ];
    this.nextId['user'] = 2;
    this.userRoles.push({ userId: 1, roleId: roleMap['admin'] });

    this.rivals = [];
    this.rivalPlayers = [];
    this.events = [];
    this.eventParticipants = [];
    this.eventAnnotations = [];
    this.playerMatchStats = [];
    this.spiritScores = [];
    this.accounts = [];
    this.categories = [];
    this.transactions = [];
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

const newCode = code.slice(0, equipIdx) + newContent + code.slice(findManyIdx);
fs.writeFileSync(path, newCode);
console.log('mockDb.ts patched successfully!');
