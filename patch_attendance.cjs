const fs = require('fs');
let code = fs.readFileSync('apps/api/src/routes/attendance.ts', 'utf8');

code = code.replace(
  /const records = await prisma\.attendance\.findMany\(\{/g,
  `const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (ev && !isAdmin && userTeamId && ev.teamId !== userTeamId && ev.teamId !== null) {
    return res.status(403).json({ error: 'Access denied to this event' });
  }
  const records = await prisma.attendance.findMany({`
);

code = code.replace(
  /const record = await prisma\.attendance\.upsert\(\{/g,
  `const u = (req as any).user;
  const isAdmin = u?.roles?.includes('admin');
  const userTeamId = (req as any).userTeamId;
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (ev && !isAdmin && userTeamId && ev.teamId !== userTeamId && ev.teamId !== null) {
    return res.status(403).json({ error: 'Access denied to this event' });
  }
  const record = await prisma.attendance.upsert({`
);

fs.writeFileSync('apps/api/src/routes/attendance.ts', code);
