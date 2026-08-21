const fs = require('fs');
let code = fs.readFileSync('apps/api/src/routes/injuries.ts', 'utf8');

code = code.replace(
  /const where: Prisma\.InjuryWhereInput = \{\}/,
  `const where: Prisma.InjuryWhereInput = {}
  const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  if (!isAdmin && userTeamId) {
    where.player = {
      OR: [{ teamId: userTeamId }, { teamId: null }]
    };
  }`
);

fs.writeFileSync('apps/api/src/routes/injuries.ts', code);
