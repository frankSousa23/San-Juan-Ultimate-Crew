/**
 * ============================================================================
 * SIGEDIVO (Sistema de Gestión para el Disco Volador)
 * MIDDLEWARE DE CONTROL DE ACCESO A MESA TÉCNICA (annotationAccess.ts)
 * ============================================================================
 * 
 * Este middleware protege todas las operaciones de registro y consulta de
 * anotaciones en vivo (goles, asistencias, defensas, pérdidas, espíritu SOTG).
 * 
 * REGLAS DE ACCESO Y SEGURIDAD:
 * 1. Autenticación Requerida:
 *    - Valida que la petición cuente con un token JWT válido y extrae el usuario.
 * 2. Bloqueo de Mesa Técnica Oficial (`isAnnotatorLocked`):
 *    - Si un partido está marcado como "bloqueado por mesa técnica", SOLO el
 *      anotador oficial asignado (`officialAnnotatorId`) o usuarios con rol
 *      `admin` / `directiva` pueden realizar mutaciones (POST, PUT, DELETE, PATCH).
 * 3. Aislamiento Multi-Equipo (Tenant Isolation):
 *    - Verifica que el usuario pertenezca al equipo local, al equipo rival o figure
 *      en la lista de participantes/refuerzos de la convocatoria del evento.
 * 4. Inyección de Contexto en Request:
 *    - Inyecta `req.userRoles`, `req.userPermissions` y `req.userData` para
 *      evitar consultas redundantes en los controladores subsecuentes.
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'

export const requireAnnotationAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const u = (req as any).user
    if (!u || !u.sub) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = Number(u.sub)
    
    // Recuperar usuario, roles y permisos usando prisma.user.findUnique
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const userRoles: string[] = []
    const userPermissions: string[] = []

    if (user.roles && Array.isArray(user.roles)) {
      for (const userRole of user.roles) {
        if (userRole && userRole.role && userRole.role.name) {
          userRoles.push(userRole.role.name)
          if (userRole.role.permissions && Array.isArray(userRole.role.permissions)) {
            for (const rolePerm of userRole.role.permissions) {
              if (rolePerm && rolePerm.permission && rolePerm.permission.name) {
                if (!userPermissions.includes(rolePerm.permission.name)) {
                  userPermissions.push(rolePerm.permission.name)
                }
              }
            }
          }
        }
      }
    }

    // Guardar para rutas
    ;(req as any).userRoles = userRoles
    ;(req as any).userPermissions = userPermissions
    ;(req as any).userData = user

    let eventId = req.body?.eventId || req.query?.eventId
    if (!eventId && req.params?.id) {
      const ann = await prisma.eventAnnotation.findUnique({
        where: { id: Number(req.params.id) },
        select: { eventId: true }
      })
      if (ann) eventId = ann.eventId
    }

    const isAdminOrDirectiva = userRoles.includes('admin') || userRoles.includes('directiva')

    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: Number(eventId) },
        include: {
          officialAnnotator: {
            select: { id: true, name: true, email: true }
          },
          participants: {
            where: user.playerId ? { playerId: user.playerId } : undefined,
            select: { playerId: true, isRefuerzo: true }
          }
        }
      })

      if (event) {
        // 1. Verificación de Control y Bloqueo de Mesa Técnica Oficial
        const isOfficialAnnotator = event.officialAnnotatorId === user.id
        const isMethodWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)

        if (isMethodWrite && event.isAnnotatorLocked && !isAdminOrDirectiva && !isOfficialAnnotator) {
          const annotatorName = event.officialAnnotator?.name || event.officialAnnotator?.email || 'un anotador oficial'
          return res.status(403).json({
            error: `Mesa técnica bloqueada: la gestión de anotaciones está reservada exclusivamente para ${annotatorName} y el equipo directivo/admin.`
          })
        }

        // 2. Verificación de Aislamiento Multi-Equipo (Permitir Local, Visitante, Refuerzos en convocatoria y Admins)
        if (!isAdminOrDirectiva && user.teamId && event.teamId !== null) {
          const isHomeTeam = event.teamId === user.teamId
          const isAwayTeam = event.awayTeamId === user.teamId
          const isParticipantRefuerzo = (event.participants && event.participants.length > 0)

          if (!isHomeTeam && !isAwayTeam && !isParticipantRefuerzo && !isOfficialAnnotator) {
            return res.status(403).json({
              error: 'Forbidden: No perteneces a los equipos del evento ni estás convocado como refuerzo.'
            })
          }
        }
      }
    }

    // Permisos generales
    if (isAdminOrDirectiva || userPermissions.includes('annotations:manage') || userPermissions.includes('events:manage')) {
      return next()
    }
    if (userRoles.includes('coach') || userRoles.includes('captain') || userRoles.includes('annotator')) {
      return next()
    }
    if (userRoles.includes('player')) {
      if (eventId) {
        const event = await prisma.event.findUnique({
          where: { id: Number(eventId) },
          select: { type: true, teamId: true, officialAnnotatorId: true }
        })
        if (event) {
          // Si el jugador es el anotador oficial asignado para este partido, puede anotar sin restricción
          if (event.officialAnnotatorId === user.id) {
            return next()
          }
          const strictTypes = ['TOURNAMENT', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'MATCH']
          if (!strictTypes.includes(event.type)) {
            return next()
          }
        }
      }
    }
    return res.status(403).json({ error: 'Forbidden: No tienes permisos para anotar en este tipo de evento.' })
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error validating permissions' })
  }
}
