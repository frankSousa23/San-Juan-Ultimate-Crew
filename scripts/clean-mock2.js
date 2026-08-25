import fs from 'fs';

const path = 'apps/api/src/lib/mockDb.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Clean Teams
code = code.replace(/this\.teams = \[\s*\{[^]*?\];/m, 'this.teams = [];');
code = code.replace(/this\.nextId\['team'\] = \d+;/, "this.nextId['team'] = 1;");

// 2. Clean Players
code = code.replace(/this\.players = \[\s*\/\/ Warao Open[^]*?\];/m, 'this.players = [];');
code = code.replace(/this\.nextId\['player'\] = \d+;/, "this.nextId['player'] = 1;");

// 3. Clean Users
const usersRegex = /const coreUsers = \[\s*\{ id: 1[^]*?\];/m;
code = code.replace(usersRegex, `const coreUsers = [
      { id: 1, email: 'frankalfonso1988@gmail.com', name: 'Frank Sousa (Admin)', role: 'admin', playerId: null, teamId: null },
    ];`);
code = code.replace(/this\.nextId\['user'\] = \d+;/, "this.nextId['user'] = 2;");

// 4. Clean Rivals
code = code.replace(/this\.rivals = \[\s*\{[^]*?\];/m, 'this.rivals = [];');
code = code.replace(/this\.nextId\['rival'\] = \d+;/, "this.nextId['rival'] = 1;");

// 5. Clean RivalPlayers
code = code.replace(/this\.rivalPlayers = \[\s*\{[^]*?\];/m, 'this.rivalPlayers = [];');
code = code.replace(/this\.nextId\['rivalPlayer'\] = \d+;/, "this.nextId['rivalPlayer'] = 1;");

// 6. Clean Events
code = code.replace(/this\.events = \[\s*\/\/ Torneo Principal[^]*?\];/m, 'this.events = [];');
code = code.replace(/this\.nextId\['event'\] = \d+;/, "this.nextId['event'] = 1;");

// 7. Clean EventParticipants
code = code.replace(/this\.eventParticipants = \[\s*\{[^]*?\];/m, 'this.eventParticipants = [];');

// 8. Clean EventAnnotations
code = code.replace(/this\.eventAnnotations = \[\s*\{[^]*?\];/m, 'this.eventAnnotations = [];');
code = code.replace(/this\.nextId\['eventAnnotation'\] = \d+;/, "this.nextId['eventAnnotation'] = 1;");

// 9. Clean PlayerMatchStats
code = code.replace(/this\.playerMatchStats = \[\s*\{[^]*?\];/m, 'this.playerMatchStats = [];');

// 10. Clean SpiritScores
code = code.replace(/this\.spiritScores = \[\s*\{[^]*?\];/m, 'this.spiritScores = [];');
code = code.replace(/this\.nextId\['spiritScore'\] = \d+;/, "this.nextId['spiritScore'] = 1;");

// 11. Clean Accounts
code = code.replace(/this\.accounts = \[\s*\{[^]*?\];/m, 'this.accounts = [];');
code = code.replace(/this\.nextId\['account'\] = \d+;/, "this.nextId['account'] = 1;");

// 12. Clean Categories
code = code.replace(/this\.categories = \[\s*\{[^]*?\];/m, 'this.categories = [];');
code = code.replace(/this\.nextId\['category'\] = \d+;/, "this.nextId['category'] = 1;");

// 13. Clean Transactions
code = code.replace(/this\.transactions = \[\s*\{[^]*?\];/m, 'this.transactions = [];');
code = code.replace(/this\.nextId\['transaction'\] = \d+;/, "this.nextId['transaction'] = 1;");

// 14. Clean Plays
code = code.replace(/this\.plays = \[\s*\{[^]*?\];/m, 'this.plays = [];');
code = code.replace(/this\.nextId\['play'\] = \d+;/, "this.nextId['play'] = 1;");

// 15. Clean Channels
code = code.replace(/this\.channels = \[\s*\{[^]*?\];/m, 'this.channels = [];');
code = code.replace(/this\.nextId\['channel'\] = \d+;/, "this.nextId['channel'] = 1;");

// 16. Clean Messages
code = code.replace(/this\.messages = \[\s*\{[^]*?\];/m, 'this.messages = [];');
code = code.replace(/this\.nextId\['message'\] = \d+;/, "this.nextId['message'] = 1;");

// 17. Clean NewsPosts
code = code.replace(/this\.newsPosts = \[\s*\{[^]*?\];/m, 'this.newsPosts = [];');
code = code.replace(/this\.nextId\['newsPost'\] = \d+;/, "this.nextId['newsPost'] = 1;");

// 18. Clean NewsComments
code = code.replace(/this\.newsComments = \[\s*\{[^]*?\];/m, 'this.newsComments = [];');
code = code.replace(/this\.nextId\['newsComment'\] = \d+;/, "this.nextId['newsComment'] = 1;");

// 19. Clean Resources
code = code.replace(/this\.resources = \[\s*\{[^]*?\];/m, 'this.resources = [];');
code = code.replace(/this\.nextId\['resource'\] = \d+;/, "this.nextId['resource'] = 1;");

fs.writeFileSync(path, code);
console.log('mockDb.ts fully cleaned up!');
