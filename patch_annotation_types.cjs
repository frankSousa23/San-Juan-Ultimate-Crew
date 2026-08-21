const fs = require('fs');
let code = fs.readFileSync('apps/web/src/types/annotation.ts', 'utf8');

code = code.replace(/playerId\?: number\n  relatedPlayerId\?: number/, 'playerId?: number | null\n  relatedPlayerId?: number | null');

fs.writeFileSync('apps/web/src/types/annotation.ts', code);
