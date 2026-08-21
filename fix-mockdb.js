import fs from 'fs';
let mockDb = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

// The user wants injuries empty if players are empty in the REAL db
mockDb = mockDb.replace(/this\.injuries = \[\s*\{[\s\S]*?\];/m, 'this.injuries = [];');
mockDb = mockDb.replace(/this\.nextId\['injury'\] = \d+;/, "this.nextId['injury'] = 1;");

fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
console.log('Injuries cleared from mockDb');
