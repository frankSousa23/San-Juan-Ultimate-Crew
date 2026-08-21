const fs = require('fs');
let code = fs.readFileSync('apps/api/src/routes/players.ts', 'utf8');

// 1. Add req.userTeamId awareness to GET /
// We need to find the GET / handler and add the where clause
code = code.replace(
  /const page = req\.query\.page \? parseInt\(req\.query\.page as string, 10\) : undefined;\n  const limit = req\.query\.limit \? parseInt\(req\.query\.limit as string, 10\) : 20;/,
  `const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  const whereClause = !isAdmin && userTeamId ? { OR: [{ teamId: userTeamId }, { teamId: null }] } : {};`
);

code = code.replace(
  /prisma\.player\.findMany\(\{ orderBy: \{ number: 'asc' \}, skip, take: limit \}\)/,
  `prisma.player.findMany({ where: whereClause, orderBy: { number: 'asc' }, skip, take: limit })`
);

code = code.replace(
  /prisma\.player\.count\(\)/,
  `prisma.player.count({ where: whereClause })`
);

code = code.replace(
  /const players = await prisma\.player\.findMany\(\{ orderBy: \{ number: 'asc' \} \}\);/,
  `const players = await prisma.player.findMany({ where: whereClause, orderBy: { number: 'asc' } });`
);

// 2. Add teamId to CREATE
code = code.replace(
  /const player = await prisma\.player\.create\(\{ data: req\.body \}\);/,
  `const data = { ...req.body };
  const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  if (!isAdmin && userTeamId) {
    data.teamId = userTeamId;
  }
  const player = await prisma.player.create({ data });`
);

fs.writeFileSync('apps/api/src/routes/players.ts', code);
