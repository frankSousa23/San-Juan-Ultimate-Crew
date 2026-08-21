const fs = require('fs');
let code = fs.readFileSync('apps/api/src/middleware/annotationAccess.ts', 'utf8');

code = code.replace(
  /const event = await prisma\.event\.findUnique\(\{/,
  `const userTeamId = user.teamId;
        const event = await prisma.event.findUnique({`
);

code = code.replace(
  /select: \{ type: true \}/,
  `select: { type: true, teamId: true }`
);

code = code.replace(
  /if \(event\) \{/,
  `if (event) {
          if (!userRoles.includes('admin') && userTeamId && event.teamId !== userTeamId && event.teamId !== null) {
            return res.status(403).json({ error: 'Forbidden: Evento de otro equipo.' });
          }`
);

fs.writeFileSync('apps/api/src/middleware/annotationAccess.ts', code);
