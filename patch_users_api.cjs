const fs = require('fs');
let code = fs.readFileSync('apps/api/src/routes/users.ts', 'utf8');

const route = `
// Asignar equipo a un usuario (Admin)
router.patch('/:id/team', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id)
  if (isNaN(userId)) return badRequest(res, 'Invalid ID')

  const { teamId } = req.body
  
  // Verify team exists if set
  if (teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) return notFound(res, 'Team not found')
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { teamId },
    include: { team: true }
  })
  
  // also update player if linked
  if (user.playerId) {
    await prisma.player.update({
      where: { id: user.playerId },
      data: { teamId }
    })
  }

  return success(res, user)
}))
`;

code = code.replace(/export \{ router as usersRouter \}/, route + '\nexport { router as usersRouter }');
fs.writeFileSync('apps/api/src/routes/users.ts', code);
