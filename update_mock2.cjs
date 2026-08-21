const fs = require('fs');
let code = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

// Replace { id: i + 1, name: name, ... } with { id: i + 1, name: name, teamId: 1, ... }
code = code.replace(/number: i \+ 1,/g, 'number: i + 1,\n      teamId: 1,');

fs.writeFileSync('apps/api/src/lib/mockDb.ts', code);
