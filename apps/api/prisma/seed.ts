import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL || 'postgresql://sju:sju@localhost:5433/sju_dev?schema=public'
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando restauración y seeder multi-equipo de SIGEDIVO...')

  // 0. Limpiar base de datos
  console.log('🧹 Vaciando tablas previas...')
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "UserRole", "RolePermission", "Permission", "Role", "User",
      "PlayerMatchStats", "EventAnnotation", "EventParticipant", "Attendance", "SpiritScore",
      "Injury", "Transaction", "Category", "Account",
      "Message", "Channel", "RivalPlayer", "Rival",
      "Play", "Resource", "NewsPostFile", "NewsPost",
      "Event", "Player", "Team", "AuditLog"
    CASCADE;
  `)
  console.log('✨ Base de datos limpia.')

  // 1. Permisos del Sistema
  console.log('🔑 Creando permisos...')
  const allPermNames = [
    'roster:view', 'roster:manage',
    'events:view', 'events:manage',
    'attendance:view', 'attendance:manage',
    'finance:view', 'finance:manage',
    'communications:manage',
    'injuries:view', 'injuries:manage',
    'rivals:view', 'rivals:manage',
    'plays:view', 'plays:manage',
    'resources:view', 'resources:manage',
    'users:manage', 'audit:view',
    'statistics:view',
    'annotations:view', 'annotations:manage'
  ]

  await prisma.permission.createMany({
    data: allPermNames.map(name => ({ name })),
    skipDuplicates: true
  })

  // 2. Roles RBAC
  console.log('🛡️ Creando roles y matriz RBAC...')
  const roles = ['admin', 'player', 'captain', 'coach', 'directiva', 'annotator', 'treasurer', 'guest']
  await prisma.role.createMany({
    data: roles.map(name => ({ name })),
    skipDuplicates: true
  })

  const dbRoles = await prisma.role.findMany()
  const roleMap = Object.fromEntries(dbRoles.map(r => [r.name, r.id]))
  const dbPerms = await prisma.permission.findMany()
  const permMap = Object.fromEntries(dbPerms.map(p => [p.name, p.id]))

  const assignPerms = async (roleName: string, perms: string[]) => {
    const roleId = roleMap[roleName]
    const data = perms.map(p => ({ roleId, permissionId: permMap[p] }))
    await prisma.rolePermission.createMany({ data, skipDuplicates: true })
  }

  await assignPerms('admin', allPermNames)
  await assignPerms('player', ['communications:manage', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'attendance:view', 'annotations:view'])
  await assignPerms('captain', ['roster:manage', 'events:manage', 'communications:manage', 'injuries:manage', 'rivals:manage', 'plays:manage', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'finance:view', 'attendance:manage', 'attendance:view', 'annotations:view', 'annotations:manage'])
  await assignPerms('coach', ['events:manage', 'communications:manage', 'injuries:manage', 'plays:manage', 'resources:manage', 'roster:view', 'injuries:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'attendance:manage', 'attendance:view', 'annotations:view', 'annotations:manage'])
  await assignPerms('directiva', ['roster:view', 'events:view', 'events:manage', 'attendance:view', 'attendance:manage', 'finance:view', 'communications:manage', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'statistics:view', 'annotations:view', 'annotations:manage'])
  await assignPerms('annotator', ['events:view', 'roster:view', 'rivals:view', 'statistics:view', 'attendance:view', 'annotations:view', 'annotations:manage'])
  await assignPerms('treasurer', ['finance:manage', 'finance:view', 'roster:view', 'events:view', 'statistics:view'])
  await assignPerms('guest', ['events:view', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'statistics:view', 'annotations:view'])

  // 3. Equipos del Ecosistema Beta Multi-Equipo
  console.log('🛡️ Creando equipos de competencia...')
  const teamWarao = await prisma.team.create({
    data: {
      name: 'Warao Open Masculino',
      color: '#1E40AF',
      notes: 'Equipo élite categoría Masculina / Open de alto rendimiento.'
    }
  })

  const teamMedusa = await prisma.team.create({
    data: {
      name: 'Medusa Mixto',
      color: '#7C3AED',
      notes: 'Equipo representativo categoría Mixta con balance y dinámica táctica.'
    }
  })

  const teamMotherflowers = await prisma.team.create({
    data: {
      name: 'Motherflowers',
      color: '#E11D48',
      notes: 'Club tradicional categoría Mixta reconocido por su velocidad y cortes profundos.'
    }
  })

  // 4. Jugadores (Rosters por Equipo + Agentes Libres Sin Equipo)
  console.log('🏃 Creando atletas y asignando nóminas...')

  // Jugadores Warao Open
  const pWarao1 = await prisma.player.create({ data: { name: 'Frank Sousa', number: 23, position: 'HANDLER', status: 'ACTIVE', teamId: teamWarao.id } })
  const pWarao2 = await prisma.player.create({ data: { name: 'Juan Pérez', number: 7, position: 'CUTTER', status: 'ACTIVE', teamId: teamWarao.id } })
  const pWarao3 = await prisma.player.create({ data: { name: 'Carlos Díaz', number: 15, position: 'CUTTER', status: 'ACTIVE', teamId: teamWarao.id } })
  const pWarao4 = await prisma.player.create({ data: { name: 'Miguel Torres', number: 21, position: 'HYBRID', status: 'ACTIVE', teamId: teamWarao.id } })
  const pWarao5 = await prisma.player.create({ data: { name: 'Andrés Mendoza', number: 8, position: 'HANDLER', status: 'ACTIVE', teamId: teamWarao.id } })
  const pWarao6 = await prisma.player.create({ data: { name: 'Ricardo Ramos', number: 19, position: 'CUTTER', status: 'ACTIVE', teamId: teamWarao.id } })

  // Jugadores Medusa Mixto
  const pMedusa1 = await prisma.player.create({ data: { name: 'María Gonzalez', number: 10, position: 'HANDLER', status: 'ACTIVE', teamId: teamMedusa.id } })
  const pMedusa2 = await prisma.player.create({ data: { name: 'Pedro Luis', number: 99, position: 'HYBRID', status: 'ACTIVE', teamId: teamMedusa.id } })
  const pMedusa3 = await prisma.player.create({ data: { name: 'Ana Silva', number: 12, position: 'CUTTER', status: 'ACTIVE', teamId: teamMedusa.id } })
  const pMedusa4 = await prisma.player.create({ data: { name: 'Gabriel Silva', number: 17, position: 'CUTTER', status: 'ACTIVE', teamId: teamMedusa.id } })
  const pMedusa5 = await prisma.player.create({ data: { name: 'Sofía Rojas', number: 4, position: 'HANDLER', status: 'ACTIVE', teamId: teamMedusa.id } })
  const pMedusa6 = await prisma.player.create({ data: { name: 'Luis Martínez', number: 88, position: 'HANDLER', status: 'ACTIVE', teamId: teamMedusa.id } })

  // Jugadores Motherflowers
  const pMother1 = await prisma.player.create({ data: { name: 'Laura Gómez', number: 33, position: 'CUTTER', status: 'ACTIVE', teamId: teamMotherflowers.id } })
  const pMother2 = await prisma.player.create({ data: { name: 'Valentina Torres', number: 9, position: 'HANDLER', status: 'ACTIVE', teamId: teamMotherflowers.id } })
  const pMother3 = await prisma.player.create({ data: { name: 'Diego Castro', number: 5, position: 'HYBRID', status: 'ACTIVE', teamId: teamMotherflowers.id } })
  const pMother4 = await prisma.player.create({ data: { name: 'Camila Rivas', number: 14, position: 'CUTTER', status: 'ACTIVE', teamId: teamMotherflowers.id } })
  const pMother5 = await prisma.player.create({ data: { name: 'Roberto Morales', number: 11, position: 'HANDLER', status: 'ACTIVE', teamId: teamMotherflowers.id } })
  const pMother6 = await prisma.player.create({ data: { name: 'Elena Ramos', number: 27, position: 'CUTTER', status: 'ACTIVE', teamId: teamMotherflowers.id } })

  // Jugadores Libres (Sin Equipo Asignado / Refuerzos Disponibles)
  const pFree1 = await prisma.player.create({ data: { name: 'Daniela Herrera', number: 22, position: 'HYBRID', status: 'ACTIVE', teamId: null } })
  const pFree2 = await prisma.player.create({ data: { name: 'Javier Blanco', number: 18, position: 'HANDLER', status: 'ACTIVE', teamId: null } })
  const pFree3 = await prisma.player.create({ data: { name: 'Valeria Morales', number: 3, position: 'CUTTER', status: 'ACTIVE', teamId: null } })
  const pFree4 = await prisma.player.create({ data: { name: 'Marcos Peñaloza', number: 30, position: 'CUTTER', status: 'ACTIVE', teamId: null } })

  const allPlayers = [
    pWarao1, pWarao2, pWarao3, pWarao4, pWarao5, pWarao6,
    pMedusa1, pMedusa2, pMedusa3, pMedusa4, pMedusa5, pMedusa6,
    pMother1, pMother2, pMother3, pMother4, pMother5, pMother6,
    pFree1, pFree2, pFree3, pFree4
  ]

  // 5. Usuarios y Cuentas de Acceso RBAC
  console.log('👤 Creando usuarios con credenciales y roles para capitanes, mesa técnica y directiva...')
  const defaultPass = await bcrypt.hash('123456', 10)
  const passwordHashAdmin = await bcrypt.hash('passWORD23', 10)

  const initialUsers = [
    { email: 'frankalfonso1988@gmail.com', name: 'Frank Sousa (Admin)', role: 'admin', playerId: pWarao1.id, teamId: teamWarao.id, pass: passwordHashAdmin, status: 'APPROVED' },
    { email: 'guest@sigedivo.com', name: 'Invitado / Demostración', role: 'guest', playerId: null, teamId: null, pass: defaultPass, status: 'APPROVED' },
    { email: 'capitan.warao@sigedivo.com', name: 'Juan Pérez (Capitán Warao)', role: 'captain', playerId: pWarao2.id, teamId: teamWarao.id, pass: defaultPass, status: 'APPROVED' },
    { email: 'capitan.medusa@sigedivo.com', name: 'María Gonzalez (Capitana Medusa)', role: 'captain', playerId: pMedusa1.id, teamId: teamMedusa.id, pass: defaultPass, status: 'APPROVED' },
    { email: 'capitan.motherflowers@sigedivo.com', name: 'Laura Gómez (Capitana Motherflowers)', role: 'captain', playerId: pMother1.id, teamId: teamMotherflowers.id, pass: defaultPass, status: 'APPROVED' },
    { email: 'mesa.tecnica@sigedivo.com', name: 'Mesa Técnica Oficial', role: 'annotator', playerId: null, teamId: null, pass: defaultPass, status: 'APPROVED' },
    { email: 'coach.medusa@sigedivo.com', name: 'Pedro Luis (Coach Medusa)', role: 'coach', playerId: pMedusa2.id, teamId: teamMedusa.id, pass: defaultPass, status: 'APPROVED' },
    { email: 'jugador.libre@sigedivo.com', name: 'Daniela Herrera (Agente Libre / Refuerzo)', role: 'player', playerId: pFree1.id, teamId: null, pass: defaultPass, status: 'APPROVED' },
    { email: 'jugador.warao@sigedivo.com', name: 'Carlos Díaz (Warao Open)', role: 'player', playerId: pWarao3.id, teamId: teamWarao.id, pass: defaultPass, status: 'APPROVED' },
  ]

  const userRecordsMap: Record<string, any> = {}
  for (const u of initialUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: u.pass, status: u.status as any, playerId: u.playerId, name: u.name, teamId: u.teamId },
      create: { email: u.email, name: u.name, passwordHash: u.pass, status: u.status as any, playerId: u.playerId, teamId: u.teamId }
    })
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleMap[u.role] } },
      update: {},
      create: { userId: user.id, roleId: roleMap[u.role] }
    })
    userRecordsMap[u.email] = user
  }

  const mesaUser = userRecordsMap['mesa.tecnica@sigedivo.com']

  // 6. Torneo Mixto de Fin de Mes (Evento Principal y Fixtures)
  console.log('🏆 Creando Torneo Mixto de Fin de Mes con horarios, canchas y cruces...')
  const tournamentDate = new Date('2026-08-29T08:00:00Z')
  const tournamentEndDate = new Date('2026-08-30T19:00:00Z')

  const mainTournament = await prisma.event.create({
    data: {
      title: 'Torneo Mixto de Fin de Mes',
      type: 'TOURNAMENT',
      status: 'UPCOMING',
      location: 'Complejo Deportivo Simón Bolívar - Canchas 1 y 2',
      startsAt: tournamentDate,
      endsAt: tournamentEndDate,
      officialAnnotatorId: mesaUser ? mesaUser.id : null,
      isAnnotatorLocked: false,
      description: 'Gran Torneo Mixto de integración y ranking. Participan Warao Open, Medusa Mixto, Motherflowers y refuerzos libres. Control de horarios, plantillas y estadísticas por Mesa Técnica.',
    }
  })

  // Partidos del Fixture
  const match1 = await prisma.event.create({
    data: {
      title: 'Fase de Grupos: Medusa Mixto vs Motherflowers',
      type: 'MATCH',
      status: 'UPCOMING',
      location: 'Cancha 1 - Césped Principal',
      startsAt: new Date('2026-08-29T09:00:00Z'),
      endsAt: new Date('2026-08-29T10:30:00Z'),
      parentId: mainTournament.id,
      teamId: teamMedusa.id,
      awayTeamId: teamMotherflowers.id,
      matchCategory: 'GROUP_STAGE',
      officialAnnotatorId: mesaUser ? mesaUser.id : null,
      description: 'Jornada inaugural del Torneo Mixto. Duración 80 min a 15 puntos.',
    }
  })

  const match2 = await prisma.event.create({
    data: {
      title: 'Fase de Grupos: Warao Open vs Medusa Mixto',
      type: 'MATCH',
      status: 'UPCOMING',
      location: 'Cancha Central',
      startsAt: new Date('2026-08-29T11:30:00Z'),
      endsAt: new Date('2026-08-29T13:00:00Z'),
      parentId: mainTournament.id,
      teamId: teamWarao.id,
      awayTeamId: teamMedusa.id,
      matchCategory: 'GROUP_STAGE',
      officialAnnotatorId: mesaUser ? mesaUser.id : null,
      description: 'Clásico de velocidad y manejo de disco en categoría abierta/mixta.',
    }
  })

  const match3 = await prisma.event.create({
    data: {
      title: 'Fase de Grupos: Motherflowers vs Warao Open',
      type: 'MATCH',
      status: 'UPCOMING',
      location: 'Cancha 2',
      startsAt: new Date('2026-08-29T14:30:00Z'),
      endsAt: new Date('2026-08-29T16:00:00Z'),
      parentId: mainTournament.id,
      teamId: teamMotherflowers.id,
      awayTeamId: teamWarao.id,
      matchCategory: 'GROUP_STAGE',
      officialAnnotatorId: mesaUser ? mesaUser.id : null,
      description: 'Definición de posiciones de cara a la Gran Final.',
    }
  })

  const matchFinal = await prisma.event.create({
    data: {
      title: 'Gran Final - Torneo Mixto de Fin de Mes',
      type: 'MATCH',
      status: 'UPCOMING',
      location: 'Cancha Central',
      startsAt: new Date('2026-08-30T16:00:00Z'),
      endsAt: new Date('2026-08-30T18:00:00Z'),
      parentId: mainTournament.id,
      matchCategory: 'FINALS',
      officialAnnotatorId: mesaUser ? mesaUser.id : null,
      description: 'Gran Final por la Copa de Fin de Mes y Premio de Espíritu de Juego (SOTG).',
    }
  })

  // Convocatoria de Jugadores con Aprobación de Asistencia y Refuerzos
  console.log('📋 Convocando nóminas y configurando aprobación de asistencia...')
  
  // Medusa Mixto Roster en Torneo
  const medusaParticipants = [pMedusa1, pMedusa2, pMedusa3, pMedusa4, pMedusa5, pMedusa6]
  for (const p of medusaParticipants) {
    await prisma.eventParticipant.create({
      data: {
        eventId: mainTournament.id,
        playerId: p.id,
        role: p.position === 'HANDLER' ? 'Manejador' : 'Cortador',
        status: 'confirmed',
        lineType: p.position === 'HANDLER' ? 'O-Line' : 'D-Line',
        teamSide: 'HOME',
        isRefuerzo: false,
      }
    })
  }

  // Refuerzo libre añadido a Medusa: Daniela Herrera
  await prisma.eventParticipant.create({
    data: {
      eventId: mainTournament.id,
      playerId: pFree1.id,
      role: 'Refuerzo Híbrido',
      status: 'confirmed',
      lineType: 'O-Line',
      teamSide: 'HOME',
      isRefuerzo: true,
    }
  })

  // Motherflowers Roster en Torneo
  const motherParticipants = [pMother1, pMother2, pMother3, pMother4, pMother5, pMother6]
  for (const p of motherParticipants) {
    await prisma.eventParticipant.create({
      data: {
        eventId: mainTournament.id,
        playerId: p.id,
        role: p.position === 'HANDLER' ? 'Manejador' : 'Cortador',
        status: 'confirmed',
        lineType: 'O-Line',
        teamSide: 'AWAY',
        isRefuerzo: false,
      }
    })
  }

  // Refuerzo libre añadido a Motherflowers: Javier Blanco
  await prisma.eventParticipant.create({
    data: {
      eventId: mainTournament.id,
      playerId: pFree2.id,
      role: 'Refuerzo Handler',
      status: 'tentative',
      lineType: 'O-Line',
      teamSide: 'AWAY',
      isRefuerzo: true,
    }
  })

  // Warao Open Roster en Torneo
  const waraoParticipants = [pWarao1, pWarao2, pWarao3, pWarao4, pWarao5, pWarao6]
  for (const p of waraoParticipants) {
    await prisma.eventParticipant.create({
      data: {
        eventId: mainTournament.id,
        playerId: p.id,
        role: p.position === 'HANDLER' ? 'Manejador' : 'Cortador',
        status: 'confirmed',
        lineType: 'O-Line',
        isRefuerzo: false,
      }
    })
  }

  // Mesa Técnica asignada en EventParticipants
  await prisma.eventParticipant.create({
    data: {
      eventId: mainTournament.id,
      playerId: pWarao5.id, // Andrés Mendoza
      role: 'DIRECTOR_MESA',
      status: 'confirmed',
    }
  })
  await prisma.eventParticipant.create({
    data: {
      eventId: mainTournament.id,
      playerId: pMedusa5.id, // Sofía Rojas
      role: 'PLANILLERO_ANOTADOR',
      status: 'confirmed',
    }
  })
  await prisma.eventParticipant.create({
    data: {
      eventId: mainTournament.id,
      playerId: pMother2.id, // Valentina Torres
      role: 'VEEDOR_ESPIRITU',
      status: 'confirmed',
    }
  })

  // Asistencia individual registrada
  for (const p of allPlayers) {
    await prisma.attendance.create({
      data: {
        eventId: mainTournament.id,
        playerId: p.id,
        status: 'present',
      }
    })
  }

  // 7. Evento Especial Completado con Estadísticas Reales y Anotaciones en Vivo
  console.log('📊 Creando evento de exhibición previo con anotaciones, MVP y estadísticas...')
  const completedTournament = await prisma.event.create({
    data: {
      title: 'Full Day Mixto - Copa Apertura',
      type: 'FULL_DAY_MIXTO',
      status: 'COMPLETED',
      location: 'Cancha Central Simón Bolívar',
      startsAt: new Date(Date.now() - 86400000 * 6),
      endsAt: new Date(Date.now() - 86400000 * 6 + 28800000),
      teamId: teamMedusa.id,
      awayTeamId: teamMotherflowers.id,
      officialAnnotatorId: mesaUser ? mesaUser.id : null,
      description: 'Jornada completa de partidos con seguimiento oficial por Mesa Técnica.',
    }
  })

  // Anotaciones en Vivo (Play-by-play) del Evento Completado
  const sampleAnnotations = [
    { eventId: completedTournament.id, type: 'GOAL' as const, playerId: pMedusa1.id, relatedPlayerId: pMedusa2.id, teamSide: 'HOME' as const, scoreHome: 1, scoreAway: 0, lineType: 'O-Line', note: 'Pase largo perfecto de Pedro a María en la zona' },
    { eventId: completedTournament.id, type: 'GOAL' as const, playerId: pMother1.id, relatedPlayerId: pMother3.id, teamSide: 'AWAY' as const, scoreHome: 1, scoreAway: 1, lineType: 'O-Line', note: 'Respuesta inmediata de Motherflowers' },
    { eventId: completedTournament.id, type: 'DEFENSE' as const, playerId: pMedusa3.id, teamSide: 'HOME' as const, lineType: 'D-Line', note: 'Bloqueo aéreo de Ana Silva' },
    { eventId: completedTournament.id, type: 'GOAL' as const, playerId: pFree1.id, relatedPlayerId: pMedusa1.id, teamSide: 'HOME' as const, scoreHome: 2, scoreAway: 1, lineType: 'O-Line', isRefuerzo: true, note: 'Gol anotado por Daniela Herrera (Refuerzo Libre)' },
    { eventId: completedTournament.id, type: 'GOAL' as const, playerId: pMother4.id, relatedPlayerId: pMother2.id, teamSide: 'AWAY' as const, scoreHome: 2, scoreAway: 2, lineType: 'O-Line', note: 'Corte hacia break side de Camila' },
    { eventId: completedTournament.id, type: 'DEFENSE' as const, playerId: pWarao1.id, teamSide: 'HOME' as const, lineType: 'D-Line', note: 'Intercepción de Frank Sousa' },
    { eventId: completedTournament.id, type: 'GOAL' as const, playerId: pWarao2.id, relatedPlayerId: pWarao1.id, teamSide: 'HOME' as const, scoreHome: 3, scoreAway: 2, lineType: 'O-Line', note: 'Asistencia de Frank a Juan Pérez' },
    { eventId: completedTournament.id, type: 'TURNOVER' as const, playerId: pMother5.id, teamSide: 'AWAY' as const, lineType: 'O-Line', note: 'Pase forzado con stall 9' },
    { eventId: completedTournament.id, type: 'GOAL' as const, playerId: pMedusa2.id, relatedPlayerId: pFree1.id, teamSide: 'HOME' as const, scoreHome: 4, scoreAway: 2, lineType: 'O-Line', note: 'Asistencia clave de la jugadora libre Daniela' },
    { eventId: completedTournament.id, type: 'GOAL' as const, playerId: pMother1.id, relatedPlayerId: pMother5.id, teamSide: 'AWAY' as const, scoreHome: 4, scoreAway: 3, lineType: 'O-Line', note: 'Segundo gol de Laura Gómez' },
  ]

  for (const ann of sampleAnnotations) {
    await prisma.eventAnnotation.create({
      data: {
        ...ann,
        createdBy: mesaUser ? mesaUser.id : null,
      }
    })
  }

  // Estadísticas Acumuladas de Jugadores en el Evento
  await prisma.playerMatchStats.createMany({
    data: [
      { eventId: completedTournament.id, playerId: pMedusa1.id, goals: 3, assists: 4, defenses: 1, turnovers: 1, pointsPlayed: 14, isRefuerzo: false },
      { eventId: completedTournament.id, playerId: pMedusa2.id, goals: 4, assists: 3, defenses: 2, turnovers: 1, pointsPlayed: 15, isRefuerzo: false },
      { eventId: completedTournament.id, playerId: pFree1.id, goals: 3, assists: 2, defenses: 2, turnovers: 0, pointsPlayed: 12, isRefuerzo: true },
      { eventId: completedTournament.id, playerId: pMother1.id, goals: 5, assists: 1, defenses: 0, turnovers: 2, pointsPlayed: 16, isRefuerzo: false },
      { eventId: completedTournament.id, playerId: pMother2.id, goals: 1, assists: 5, defenses: 1, turnovers: 1, pointsPlayed: 14, isRefuerzo: false },
      { eventId: completedTournament.id, playerId: pWarao1.id, goals: 2, assists: 6, defenses: 3, turnovers: 1, pointsPlayed: 15, isRefuerzo: false },
      { eventId: completedTournament.id, playerId: pWarao2.id, goals: 4, assists: 1, defenses: 1, turnovers: 1, pointsPlayed: 13, isRefuerzo: false },
      { eventId: completedTournament.id, playerId: pMedusa3.id, goals: 1, assists: 1, defenses: 4, turnovers: 0, pointsPlayed: 11, isRefuerzo: false },
    ]
  })

  // Calificaciones de Espíritu de Juego (SOTG)
  await prisma.spiritScore.create({
    data: {
      eventId: completedTournament.id,
      teamId: teamMotherflowers.id,
      evaluatedTeam: 'Medusa Mixto',
      rulesKnowledge: 4,
      foulsAndContact: 4,
      fairMindedness: 4,
      positiveAttitude: 4,
      communication: 4,
      totalScore: 20,
      comments: 'Excelente partido, juego fluido y gran respeto por las reglas.',
    }
  })

  // 8. Finanzas
  console.log('💰 Creando finanzas y balance general...')
  const acc1 = await prisma.account.create({ data: { name: 'Caja Chica (Efectivo / USD)', type: 'CASH' } })
  const acc2 = await prisma.account.create({ data: { name: 'Cuenta Bancaria / Pago Móvil / Zelle', type: 'BANK' } })

  const cat1 = await prisma.category.create({ data: { name: 'Cuotas de Membresía Mensual', kind: 'INCOME' } })
  const cat2 = await prisma.category.create({ data: { name: 'Inscripción Torneo Mixto de Fin de Mes', kind: 'INCOME' } })
  const cat3 = await prisma.category.create({ data: { name: 'Compra de Discos Oficiales y Conos', kind: 'EXPENSE' } })
  const cat4 = await prisma.category.create({ data: { name: 'Hidratación, Hielo y Primeros Auxilios', kind: 'EXPENSE' } })

  await prisma.transaction.createMany({
    data: [
      { accountId: acc2.id, categoryId: cat1.id, type: 'INCOME', amountCents: 15000, description: 'Cobro de cuotas mensuales de atletas (Warao, Medusa, Motherflowers)', occurredAt: new Date(Date.now() - 86400000 * 15) },
      { accountId: acc2.id, categoryId: cat2.id, type: 'INCOME', amountCents: 20000, description: 'Inscripciones de equipos para el Torneo Mixto de Fin de Mes', occurredAt: new Date(Date.now() - 86400000 * 5) },
      { accountId: acc2.id, categoryId: cat3.id, type: 'EXPENSE', amountCents: 14000, description: 'Lote de 12 Discos Oficiales Discraft Ultra-Star 175g', occurredAt: new Date(Date.now() - 86400000 * 8) },
      { accountId: acc1.id, categoryId: cat4.id, type: 'EXPENSE', amountCents: 2500, description: 'Agua mineral, sales de rehidratación y hielo para el torneo', occurredAt: new Date(Date.now() - 86400000 * 2) },
    ]
  })

  // 9. Pizarra Táctica (Playbook)
  console.log('📋 Creando jugadas tácticas...')
  await prisma.play.createMany({
    data: [
      {
        name: 'Vertical Stack Estándar (Cortes Open y Break Side)',
        category: 'OFFENSE',
        description: 'Formación clásica en columna vertical. Cortadores atacan sucesivamente desde el fondo hacia el lado abierto o lado cerrado con resets rápidos en stall 6.',
        content: '### Vertical Stack\n- 2-3 Handlers en la base y 4 Cutters en el centro.\n- Cortes sucesivos desde el fondo del stack hacia open side o break side.\n- Desahogos (dumps) rápidos a la cuenta de stall 6.'
      },
      {
        name: 'Horizontal Stack (H-Stack) con Variación Deep Iso',
        category: 'OFFENSE',
        description: 'Formación en línea transversal con 3 handlers y 4 cutters. Genera pasillos abiertos en carriles centrales e incorpora corte profundo aislado para receptores veloces.',
        content: '### Horizontal Stack\n- 3 Handlers en la base y 4 Cutters a lo ancho del campo.\n- Cortes centrales cruzados e incursión profunda aislada (Deep Iso).'
      },
      {
        name: 'Defensa en Zona Cup (3-3-1 Cup Defense)',
        category: 'DEFENSE',
        description: 'Sistema de copa de 3 defensas (Mark, Middle, Point), 3 intermedios (Short Deep y Wings) y 1 Deep-Deep. Excelente para frenar ataques en días de viento.',
        content: '### Defensa en Zona Cup\n- Copa de 3 presiona al lanzador.\n- 3 medios cortan pases altos y laterales.\n- 1 Deep-Deep cuida lanzamientos largos.'
      },
      {
        name: 'Defensa Dome / Clam (Cúpula Modular)',
        category: 'DEFENSE',
        description: 'Esquema defensivo híbrido en domo que colapsa el centro del campo contra stacks verticales, forzando tiros difíciles hacia las bandas e induciendo stall outs.',
        content: '### Defensa Dome\n- Cobertura semicircular que niega el centro de la cancha y fuerza pases hacia las líneas laterales.'
      },
    ]
  })

  // 10. Recursos Oficiales WFDF
  console.log('📚 Creando recursos oficiales de Ultimate Frisbee...')
  await prisma.resource.createMany({
    data: [
      {
        title: 'Reglamento Oficial de Ultimate WFDF 2021-2024 / 2025 (Español)',
        category: 'Reglamento y Normativas',
        description: 'Reglas oficiales de la World Flying Disc Federation: no contacto, stall count de 10s, autogestión de faltas y dimensiones de campo 100x37m.',
        url: 'https://rules.wfdf.sport/',
        fileName: 'Reglas_Oficiales_WFDF_Ultimate.pdf',
        size: 1850000
      },
      {
        title: 'Manual de Espíritu de Juego (Spirit of the Game - SOTG)',
        category: 'Espíritu de Juego',
        description: 'Criterios y rúbrica oficial de la WFDF para la puntuación SOTG: Conocimiento de reglas, faltas y contacto, imparcialidad, actitud positiva y comunicación.',
        url: 'https://wfdf.sport/organisation/spirit-of-the-game/',
        fileName: 'Guia_Oficial_Espiritu_de_Juego_SOTG.pdf',
        size: 920000
      },
      {
        title: 'Guía de Planillaje y Anotación para Mesa Técnica',
        category: 'Mesa Técnica',
        description: 'Instrucciones oficiales para el registro de goles, asistencias, defensas (D-blocks), pérdidas (turnovers) y auditoría de partidos.',
        url: 'https://wfdf.sport/',
        fileName: 'Guia_Mesa_Tecnica_SIGEDIVO.pdf',
        size: 1100000
      }
    ]
  })

  // 11. Canales y Noticias Oficiales
  console.log('📢 Creando canales y comunicados oficiales...')
  const ch1 = await prisma.channel.create({ data: { name: 'Anuncios del Torneo Mixto' } })
  await prisma.channel.create({ data: { name: 'Mesa Técnica y Horarios' } })
  await prisma.channel.create({ data: { name: 'Capitanes y Coordinación' } })

  await prisma.message.create({
    data: {
      channelId: ch1.id,
      content: '¡Bienvenidos al Torneo Mixto de Fin de Mes! Los capitanes de Warao Open, Medusa Mixto y Motherflowers ya pueden configurar sus nóminas y convocar a los jugadores y refuerzos libres.'
    }
  })

  await prisma.newsPost.create({
    data: {
      title: '🏆 Lanzamiento Oficial: Torneo Mixto de Fin de Mes (Beta Multi-Equipo)',
      content: `¡Saludos a toda la comunidad de Ultimate Frisbee!\n\nDamos inicio oficial a la preparación del **Torneo Mixto de Fin de Mes**, unificando las categorías y equipos en nuestro ecosistema deportivo:\n\n1. **🛡️ Equipos Participantes**: Warao Open Masculino, Medusa Mixto, Motherflowers y Agentes Libres sin equipo definido que actuarán como refuerzos.\n2. **⏱️ Mesa Técnica Oficial**: Asignación de Director de Mesa, Planillero y Veedor de Espíritu de Juego (SOTG) para cada encuentro.\n3. **✅ Aprobación de Asistencia**: Cada jugador puede confirmar su asistencia directamente desde su panel de eventos.\n4. **📈 Estadísticas en Vivo y Acumuladas**: Los goles, asistencias, defensas y puntaje MVP se consolidan automáticamente tanto en el partido como en las estadísticas globales de los equipos.\n\n*¡Mucho éxito a todos los equipos y a jugar con el máximo Espíritu de Juego!*`,
      isPinned: true,
      isPublished: true,
      category: 'Torneos'
    }
  })

  console.log('✅ Seeder multi-equipo de SIGEDIVO completado con éxito!')
  console.log('🔑 Cuentas disponibles:')
  console.log(' - Admin: frankalfonso1988@gmail.com (pass: passWORD23)')
  console.log(' - Capitán Warao: capitan.warao@sigedivo.com (pass: 123456)')
  console.log(' - Capitana Medusa: capitan.medusa@sigedivo.com (pass: 123456)')
  console.log(' - Capitana Motherflowers: capitan.motherflowers@sigedivo.com (pass: 123456)')
  console.log(' - Mesa Técnica: mesa.tecnica@sigedivo.com (pass: 123456)')
  console.log(' - Jugadora Libre / Refuerzo: jugador.libre@sigedivo.com (pass: 123456)')
  console.log(' - Invitado / Demo: guest@sigedivo.com (pass: 123456)')
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeder:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
