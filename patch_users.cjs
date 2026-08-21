const fs = require('fs');
let code = fs.readFileSync('apps/api/src/routes/users.ts', 'utf8');

const newEndpoint = `
router.put('/:id/team', requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { teamId } = req.body;
  if (teamId !== null && typeof teamId !== 'number') return badRequest(res, 'Invalid teamId');
  const user = await prisma.user.update({
    where: { id },
    data: { teamId }
  });
  return success(res, { id: user.id, teamId: user.teamId });
}));
`;

code = code.replace(/export default router;/, newEndpoint + '\nexport default router;');

fs.writeFileSync('apps/api/src/routes/users.ts', code);
