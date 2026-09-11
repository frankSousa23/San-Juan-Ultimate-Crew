import fs from 'fs';

// Ensure guest user and role exist in mockDb.ts without polluting transaction data
let mockDb = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

// Ensure guest user in coreUsers
if (!mockDb.includes("email: 'guest@sigedivo.com'")) {
  mockDb = mockDb.replace(
    /const coreUsers = \[\s*\{\s*id: 1, email: 'frankalfonso1988@gmail\.com'[^]*?\];/,
    `const coreUsers = [
      { id: 1, email: 'frankalfonso1988@gmail.com', name: 'Frank Sousa (Admin)', role: 'admin', playerId: null, teamId: null },
      { id: 2, email: 'guest@sigedivo.com', name: 'Invitado / Demostración', role: 'guest', playerId: null, teamId: null },
      { id: 3, email: 'player@sigedivo.com', name: 'Atleta Oficial', role: 'player', playerId: null, teamId: 1 }
    ];`
  );
  mockDb = mockDb.replace(/this\.nextId\['user'\] = \d+;/, "this.nextId['user'] = 4;");
}

// Ensure guest role is mapped in userRoles
if (!mockDb.includes(`this.userRoles.push({ userId: 2, roleId: roleMap['guest'] });`)) {
  mockDb = mockDb.replace(
    /this\.userRoles\.push\(\{ userId: 1, roleId: roleMap\['admin'\] \}\);/,
    `this.userRoles.push({ userId: 1, roleId: roleMap['admin'] });\n    this.userRoles.push({ userId: 2, roleId: roleMap['guest'] });`
  );
}

fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
console.log('mockDb.ts guest baseline verified cleanly (no phantom transactions injected).');
