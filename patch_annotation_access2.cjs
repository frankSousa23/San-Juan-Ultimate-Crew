const fs = require('fs');
let code = fs.readFileSync('apps/api/src/middleware/annotationAccess.ts', 'utf8');

const replacement = `    // Guardar para rutas
    ;(req as any).userRoles = userRoles
    ;(req as any).userPermissions = userPermissions

    let eventId = req.body?.eventId || req.query?.eventId;
    if (!eventId && req.params?.id) {
        const ann = await prisma.eventAnnotation.findUnique({
          where: { id: Number(req.params.id) },
          select: { eventId: true }
        })
        if (ann) eventId = ann.eventId
    }
    if (eventId) {
        const event = await prisma.event.findUnique({
            where: { id: Number(eventId) },
            select: { type: true, teamId: true }
        })
        if (event && !userRoles.includes('admin') && user.teamId && event.teamId !== user.teamId && event.teamId !== null) {
            return res.status(403).json({ error: 'Forbidden: Evento de otro equipo.' });
        }
    }

    if (userRoles.includes('admin') || userRoles.includes('directiva') || userPermissions.includes('annotations:manage') || userPermissions.includes('events:manage')) {
      return next()
    }
    if (userRoles.includes('coach') || userRoles.includes('captain') || userRoles.includes('annotator')) {
      return next()
    }
    if (userRoles.includes('player')) {
      if (eventId) {
        const event = await prisma.event.findUnique({
          where: { id: Number(eventId) },
          select: { type: true, teamId: true }
        })
        if (event) {
          const strictTypes = ['TOURNAMENT', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'MATCH']
          if (!strictTypes.includes(event.type)) {
            return next()
          }
        }
      }
    }
    return res.status(403).json({ error: 'Forbidden: No tienes permisos para anotar en este tipo de evento.' })`;

code = code.replace(/    \/\/ Guardar para rutas[\s\S]*?return res\.status\(403\)\.json\(\{ error: 'Forbidden: No tienes permisos para anotar en este tipo de evento\.' \}\)/, replacement);

fs.writeFileSync('apps/api/src/middleware/annotationAccess.ts', code);
