const fs = require('fs');
let code = fs.readFileSync('apps/api/src/routes/injuries.ts', 'utf8');

code = code.replace(
  /const items = await prisma\.injury\.findMany\(\{ include: \{ player: true \}, orderBy: \{ startDate: 'desc' \} \}\)/,
  `const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  const whereClause = !isAdmin && userTeamId ? { player: { OR: [{ teamId: userTeamId }, { teamId: null }] } } : {};
  const items = await prisma.injury.findMany({ where: whereClause, include: { player: true }, orderBy: { startDate: 'desc' } })`
);

fs.writeFileSync('apps/api/src/routes/injuries.ts', code);
