const fs = require('fs');
let code = fs.readFileSync('apps/api/src/routes/auth.ts', 'utf8');

code = code.replace(/playerId: user\.playerId \?\? null,/g, 'playerId: user.playerId ?? null,\n      teamId: userData?.user?.teamId ?? null,\n      teamName: userData?.user?.team?.name ?? null,');

code = code.replace(/playerId: userData\.user\.playerId \?\? null,/g, 'playerId: userData.user.playerId ?? null,\n      teamId: userData.user.teamId ?? null,\n      teamName: userData.user.team?.name ?? null,');

fs.writeFileSync('apps/api/src/routes/auth.ts', code);
