const fs = require('fs');
let code = fs.readFileSync('apps/api/src/routes/auth.ts', 'utf8');

code = code.replace(/;\(req as any\)\.userRoles = userData\.roles/g, ';\(req as any\).userRoles = userData.roles\n    ;\(req as any\).userTeamId = userData.user?.teamId');

fs.writeFileSync('apps/api/src/routes/auth.ts', code);
