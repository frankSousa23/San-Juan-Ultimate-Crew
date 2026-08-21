const fs = require('fs');
let code = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

const teamSeed = `
    this.teams = [
      { id: 1, name: 'San Juan Ultimate Crew', color: '#ff0000', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Equipo B', color: '#00ff00', createdAt: new Date(), updatedAt: new Date() },
    ];
    this.nextId['team'] = 3;
`;

code = code.replace('this.users =', teamSeed + '\n    this.users =');
fs.writeFileSync('apps/api/src/lib/mockDb.ts', code);
