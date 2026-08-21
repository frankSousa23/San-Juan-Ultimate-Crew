import fs from 'fs';
let mockDb = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

// EventParticipants
mockDb = mockDb.replace(/this\.eventParticipants = \[\s*\/\/ Medusa[^]*?\];/m, 'this.eventParticipants = [];');
// eventAnnotations
mockDb = mockDb.replace(/this\.eventAnnotations = \[\s*\{[^]*?\];/m, 'this.eventAnnotations = [];');
mockDb = mockDb.replace(/this\.nextId\['eventAnnotation'\] = \d+;/, "this.nextId['eventAnnotation'] = 1;");
// playerMatchStats
mockDb = mockDb.replace(/this\.playerMatchStats = \[\s*\{[^]*?\];/m, 'this.playerMatchStats = [];');
// spiritScores
mockDb = mockDb.replace(/this\.spiritScores = \[\s*\{[^]*?\];/m, 'this.spiritScores = [];');
mockDb = mockDb.replace(/this\.nextId\['spiritScore'\] = \d+;/, "this.nextId['spiritScore'] = 1;");

fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
console.log('Events related data cleared!');
