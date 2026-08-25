import fs from 'fs';

// 1. Restore mockDb.ts
let mockDb = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

// Restore coreUsers to include guest
mockDb = mockDb.replace(
  /const coreUsers = \[\s*\{\s*id: 1, email: 'frankalfonso1988@gmail\.com'[^]*?\];/,
  `const coreUsers = [
      { id: 1, email: 'frankalfonso1988@gmail.com', name: 'Frank Sousa (Admin)', role: 'admin', playerId: null, teamId: null },
      { id: 2, email: 'guest@sigedivo.com', name: 'Invitado / Demostración', role: 'guest', playerId: null, teamId: null }
    ];`
);
mockDb = mockDb.replace(/this\.nextId\['user'\] = 2;/, "this.nextId['user'] = 3;");

// Make sure guest role is added to userRoles
if (!mockDb.includes(`this.userRoles.push({ userId: 2, roleId: roleMap['guest'] });`)) {
  mockDb = mockDb.replace(
    /this\.userRoles\.push\(\{ userId: 1, roleId: roleMap\['admin'\] \}\);/,
    `this.userRoles.push({ userId: 1, roleId: roleMap['admin'] });\n    this.userRoles.push({ userId: 2, roleId: roleMap['guest'] });`
  );
}

// Restore Finances, Resources, Plays
const replaceArray = (name, newContent) => {
  const regex = new RegExp(`this\\.${name} = \\[\\];`, 'm');
  mockDb = mockDb.replace(regex, `this.${name} = [\n${newContent}\n    ];`);
};

// Accounts
replaceArray('accounts', `      { id: 1, name: 'Caja Principal (Banco)', type: 'BANK', balance: 500.00, currency: 'USD', teamId: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Caja Chica (Efectivo)', type: 'CASH', balance: 120.00, currency: 'USD', teamId: null, createdAt: new Date(), updatedAt: new Date() }`);
mockDb = mockDb.replace(/this\.nextId\['account'\] = 1;/, "this.nextId['account'] = 3;");

// Categories
replaceArray('categories', `      { id: 1, name: 'Mensualidades', type: 'INCOME', description: 'Pago de cuotas de atletas', isDefault: true, createdAt: new Date() },
      { id: 2, name: 'Uniformes', type: 'INCOME', description: 'Venta de indumentaria', isDefault: false, createdAt: new Date() },
      { id: 3, name: 'Inscripción Torneos', type: 'EXPENSE', description: 'Pago de bid de torneos', isDefault: true, createdAt: new Date() },
      { id: 4, name: 'Canchas e Instalaciones', type: 'EXPENSE', description: 'Alquiler de espacios', isDefault: true, createdAt: new Date() }`);
mockDb = mockDb.replace(/this\.nextId\['category'\] = 1;/, "this.nextId['category'] = 5;");

// Transactions
replaceArray('transactions', `      { id: 1, accountId: 1, categoryId: 1, type: 'INCOME', amount: 35.00, description: 'Mensualidad Agosto - Jugador X', date: new Date(), receiptUrl: null, loggedById: 1, createdAt: new Date() },
      { id: 2, accountId: 1, categoryId: 3, type: 'EXPENSE', amount: 150.00, description: 'Abono Torneo Nacional', date: new Date(), receiptUrl: null, loggedById: 1, createdAt: new Date() }`);
mockDb = mockDb.replace(/this\.nextId\['transaction'\] = 1;/, "this.nextId['transaction'] = 3;");

// Plays
replaceArray('plays', `      { id: 1, title: 'Zona 3-3-1 Cup', type: 'DEFENSE', description: 'Defensa zonal estándar para frenar handlers.', elements: '[]', createdById: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, title: 'Stack Vertical (Ho)', type: 'OFFENSE', description: 'Ofensiva clásica con cortes a 45 grados.', elements: '[]', createdById: 1, createdAt: new Date(), updatedAt: new Date() }`);
mockDb = mockDb.replace(/this\.nextId\['play'\] = 1;/, "this.nextId['play'] = 3;");

// Resources
replaceArray('resources', `      { id: 1, title: 'Reglamento Oficial WFDF 2021-2024', type: 'LINK', url: 'https://rules.wfdf.org/', description: 'Reglas oficiales de Ultimate.', uploadedById: 1, createdAt: new Date() },
      { id: 2, title: 'Manual de Espíritu de Juego', type: 'DOCUMENT', url: 'https://wfdf.sport/spirit-of-the-game/', description: 'Guía de SOTG para equipos.', uploadedById: 1, createdAt: new Date() }`);
mockDb = mockDb.replace(/this\.nextId\['resource'\] = 1;/, "this.nextId['resource'] = 3;");

fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
console.log('mockDb.ts updated with examples and guest user');

