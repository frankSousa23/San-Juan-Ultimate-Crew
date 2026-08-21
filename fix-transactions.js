import fs from 'fs';
let mockDb = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

// The array started at line 265, ended at line 266. Let's just replace this chunk.
mockDb = mockDb.replace(
  /this\.transactions = \[\s*\{\s*id: 1, type: 'INCOME'[^]*?\];/m,
  `this.transactions = [
    { id: 1, type: 'INCOME', amountCents: 10000, description: 'Cobro de cuotas mensuales de atletas (Enero)', occurredAt: new Date(new Date().getTime() - 86400000 * 18).toISOString(), accountId: 2, categoryId: 1, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
    { id: 2, type: 'INCOME', amountCents: 7500, description: 'Venta de 5 discos oficiales Discraft Ultra-Star 175g', occurredAt: new Date(new Date().getTime() - 86400000 * 12).toISOString(), accountId: 2, categoryId: 2, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
    { id: 3, type: 'EXPENSE', amountCents: 12000, description: 'Compra de lote de 10 discos oficiales de competencia', occurredAt: new Date(new Date().getTime() - 86400000 * 10).toISOString(), accountId: 2, categoryId: 4, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
    { id: 4, type: 'EXPENSE', amountCents: 1850, description: 'Agua potable y bolsas de hielo para entrenamiento de fin de semana', occurredAt: new Date(new Date().getTime() - 86400000 * 5).toISOString(), accountId: 1, categoryId: 5, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
    { id: 5, type: 'EXPENSE', amountCents: 15000, description: 'Anticipo de Bid Fee - Copa Nacional de Ultimate Frisbee', occurredAt: new Date(new Date().getTime() - 86400000 * 3).toISOString(), accountId: 2, categoryId: 6, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') }
  ];`
);
mockDb = mockDb.replace(/this\.nextId\['transaction'\] = \d+;/, "this.nextId['transaction'] = 6;");

fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
console.log('Fixed transactions!');
