import fs from 'fs';
let mockDb = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

// Events
const regex = /this\.events = \[\s*\/\/ Torneo Mixto[^]*?\];/m;
mockDb = mockDb.replace(regex, 'this.events = [];');
mockDb = mockDb.replace(/this\.nextId\['event'\] = \d+;/, "this.nextId['event'] = 1;");

fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
console.log('Events cleared!');
