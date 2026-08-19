import { PrismaClient, PlayerPosition, PlayerStatus, EventType, EventStatus, InjurySeverity, InjuryStatus, AccountType, TransactionType, AnnotationType, PlayCategory } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { fakerES as faker } from '@faker-js/faker'

const connectionString = process.env.DATABASE_URL || 'postgresql://sju:sju@localhost:5433/sju_dev?schema=public'
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const NUM_PLAYERS = 150
const NUM_USERS = 160
const NUM_EVENTS = 300
const NUM_RIVALS = 20
const NUM_CHANNELS = 15
const NUM_MESSAGES_PER_CHANNEL = 40
const NUM_TRANSACTIONS = 500

async function main() {
  console.log('🌱 Iniciando seeder MASIVO Y ENRIQUECIDO...')

  // 0. Limpiar base de datos
  console.log('🧹 Vaciando la base de datos...')
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "UserRole", "RolePermission", "Permission", "Role", "User",
      "PlayerMatchStats", "EventAnnotation", "EventParticipant", "Attendance", "SpiritScore",
      "Injury", "Transaction", "Category", "Account",
      "Message", "Channel", "RivalPlayer", "Rival",
      "Play", "Resource", "NewsPostFile", "NewsPost",
      "Event", "Player", "AuditLog"
    CASCADE;
  `)
  console.log('✨ Base de datos vaciada.')

  // 1. Permisos
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

  // 2. Roles
  console.log('🛡️ Creando roles y matriz RBAC...')
  const roles = ['admin', 'player', 'captain', 'coach', 'treasurer', 'guest']
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
  await assignPerms('treasurer', ['finance:manage', 'finance:view', 'roster:view', 'events:view', 'statistics:view'])
  await assignPerms('guest', ['events:view', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'statistics:view', 'annotations:view'])

  // 3. Jugadores Base Destacados
  console.log('🏃 Creando jugadores base y masivos...')
  const basePlayersData = [
    { name: 'Franco Sousa (Capitán)', number: 1, position: PlayerPosition.HANDLER, status: PlayerStatus.ACTIVE, heightCm: 182, experience: '7 años en San Juan' },
    { name: 'Carlos Mendoza (Capitán Ofensivo)', number: 2, position: PlayerPosition.CUTTER, status: PlayerStatus.ACTIVE, heightCm: 185, experience: '5 años en San Juan' },
    { name: 'Eduardo Silva (Coach Táctico)', number: 3, position: PlayerPosition.HYBRID, status: PlayerStatus.ACTIVE, heightCm: 178, experience: '8 años en San Juan' },
    { name: 'Alejandro Ramos (Tesorero)', number: 4, position: PlayerPosition.HANDLER, status: PlayerStatus.ACTIVE, heightCm: 175, experience: '4 años en San Juan' },
    { name: 'Gabriel Torres (Cutter Titular)', number: 5, position: PlayerPosition.CUTTER, status: PlayerStatus.ACTIVE, heightCm: 188, experience: '3 años en San Juan' },
    { name: 'Daniel Salazar (Refuerzo)', number: 6, position: PlayerPosition.HYBRID, status: PlayerStatus.ACTIVE, heightCm: 180, experience: '2 años en San Juan' },
    { name: 'Marcos Peña (Defensa D-Line)', number: 7, position: PlayerPosition.CUTTER, status: PlayerStatus.ACTIVE, heightCm: 183, experience: '4 años en San Juan' },
    { name: 'Luis Navarro (Handler O-Line)', number: 8, position: PlayerPosition.HANDLER, status: PlayerStatus.ACTIVE, heightCm: 176, experience: '5 años en San Juan' },
    { name: 'Andrés Gómez (Cutter O-Line)', number: 9, position: PlayerPosition.CUTTER, status: PlayerStatus.ACTIVE, heightCm: 190, experience: '3 años en San Juan' },
    { name: 'Ricardo Morales (Deep Handler)', number: 10, position: PlayerPosition.HANDLER, status: PlayerStatus.ACTIVE, heightCm: 181, experience: '6 años en San Juan' },
  ]

  const additionalPlayersData = Array.from({ length: NUM_PLAYERS - basePlayersData.length }).map((_, i) => ({
    name: faker.person.fullName(),
    number: basePlayersData.length + i + 1,
    position: faker.helpers.arrayElement(Object.values(PlayerPosition)),
    status: faker.helpers.weightedArrayElement([
      { weight: 75, value: PlayerStatus.ACTIVE },
      { weight: 15, value: PlayerStatus.INACTIVE },
      { weight: 10, value: PlayerStatus.INJURED }
    ]),
    heightCm: faker.number.int({ min: 160, max: 202 }),
    experience: `${faker.number.int({ min: 1, max: 12 })} años`
  }))

  await prisma.player.createMany({
    data: [...basePlayersData, ...additionalPlayersData],
    skipDuplicates: true
  })
  const players = await prisma.player.findMany({ orderBy: { number: 'asc' } })

  // 4. Usuarios Clave y RBAC
  console.log('👤 Creando usuarios base vinculados a jugadores...')
  const passwordHash = await bcrypt.hash('123456', 10)

  const coreUsers = [
    { email: 'admin@sju.com', name: 'Administrador General', role: 'admin', playerId: players[0]?.id },
    { email: 'captain@example.com', name: 'Capitán Franco', role: 'captain', playerId: players[1]?.id },
    { email: 'coach@example.com', name: 'Entrenador Eduardo', role: 'coach', playerId: players[2]?.id },
    { email: 'treasurer@example.com', name: 'Tesorero Alejandro', role: 'treasurer', playerId: players[3]?.id },
    { email: 'player@example.com', name: 'Jugador Gabriel', role: 'player', playerId: players[4]?.id },
    { email: 'guest@example.com', name: 'Invitado / Refuerzo', role: 'guest', playerId: players[5]?.id },
  ]

  for (const u of coreUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, status: 'APPROVED', playerId: u.playerId, name: u.name },
      create: { email: u.email, name: u.name, passwordHash, status: 'APPROVED', playerId: u.playerId }
    })
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleMap[u.role] } },
      update: {},
      create: { userId: user.id, roleId: roleMap[u.role] }
    })
    // Asignar también rol de player para que tengan permisos de jugador
    if (u.role !== 'player' && u.role !== 'guest') {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: roleMap['player'] } },
        update: {},
        create: { userId: user.id, roleId: roleMap['player'] }
      })
    }
  }

  // Usuarios Masivos adicionales
  console.log(`🧑‍💻 Creando ${NUM_USERS} usuarios masivos...`)
  const usersData = Array.from({ length: NUM_USERS }).map((_, i) => ({
    email: `usuario.sju.${i + 1}@sju.com`,
    name: faker.person.fullName(),
    passwordHash,
    status: 'APPROVED',
    playerId: i + 6 < players.length ? players[i + 6].id : null,
  }))
  await prisma.user.createMany({ data: usersData, skipDuplicates: true })

  const additionalUsers = await prisma.user.findMany({
    where: { NOT: { email: { in: coreUsers.map(c => c.email) } } }
  })
  const userRolesData = additionalUsers.map(u => ({
    userId: u.id,
    roleId: faker.helpers.arrayElement([roleMap['player'], roleMap['guest'], roleMap['captain']])
  }))
  await prisma.userRole.createMany({ data: userRolesData, skipDuplicates: true })

  // 5. Rivales y Scouting
  console.log(`🛡️ Creando rivales y jugadores rivales...`)
  const keyRivals = [
    { name: 'Caracas Ultimate Club', strengths: 'Lanzadores zurdos rápidos, corte largo profundo', weaknesses: 'Defensa de zona con viento cruzado' },
    { name: 'Dragones de Valencia', strengths: 'Físico imponente, dominio aéreo en zona de gol', weaknesses: 'Transiciones lentas en turnover' },
    { name: 'Fénix Ultimate', strengths: 'Marcación hombre a hombre muy asfixiante', weaknesses: 'Poco recambio en banca' },
    { name: 'Guerreros de Maracay', strengths: 'Juego rápido de pases cortos (give and go)', weaknesses: 'Lanzamientos largos inconsistentes' },
  ]
  const additionalRivals = Array.from({ length: NUM_RIVALS - keyRivals.length }).map(() => ({
    name: faker.company.name() + " Ultimate",
    strengths: faker.lorem.words(3),
    weaknesses: faker.lorem.words(3),
  }))
  await prisma.rival.createMany({ data: [...keyRivals, ...additionalRivals] })
  const rivals = await prisma.rival.findMany()

  const rivalPlayersData = []
  for (const r of rivals) {
    for (let i = 1; i <= 15; i++) {
      rivalPlayersData.push({
        rivalId: r.id,
        name: faker.person.fullName(),
        number: i,
        position: faker.helpers.arrayElement(['Handler', 'Cutter', 'Hybrid']),
      })
    }
  }
  const chunkSize = 500
  for (let i = 0; i < rivalPlayersData.length; i += chunkSize) {
    await prisma.rivalPlayer.createMany({ data: rivalPlayersData.slice(i, i + chunkSize), skipDuplicates: true })
  }

  // 6. Torneo Destacado y Eventos
  console.log(`📅 Creando Torneo Activo y ${NUM_EVENTS} eventos...`)
  
  // Torneo Destacado Principal
  const activeTournament = await prisma.event.create({
    data: {
      title: '🏆 Torneo Nacional Ultimate 2026 - Copa San Juan',
      description: 'Torneo oficial nacional de Ultimate Frisbee con fase de grupos, eliminatorias y finales.',
      type: EventType.TOURNAMENT,
      status: EventStatus.ONGOING,
      location: 'Complejo Deportivo San Juan - Canchas Principales',
      startsAt: new Date(Date.now() - 3600000 * 24 * 2), // hace 2 días
      endsAt: new Date(Date.now() + 3600000 * 24 * 3), // en 3 días
      windSpeed: 12,
      windDirection: 'NE'
    }
  })

  // Partidos del Torneo Principal
  const liveMatch = await prisma.event.create({
    data: {
      title: 'San Juan UC vs Caracas Ultimate (EN VIVO - Semifinal)',
      description: 'Partido de semifinales en vivo. Marcador y estadísticas en tiempo real.',
      type: EventType.AMISTOSO,
      status: EventStatus.ONGOING,
      location: 'Cancha 1 (Principal)',
      parentId: activeTournament.id,
      matchCategory: 'SEMI_FINALS',
      rivalId: rivals[0].id,
      startsAt: new Date(Date.now() - 3600000 * 1), // Hace 1 hora
      endsAt: new Date(Date.now() + 3600000 * 1),
      windSpeed: 8,
      windDirection: 'E'
    }
  })

  const completedMatch = await prisma.event.create({
    data: {
      title: 'San Juan UC vs Dragones de Valencia (Cuartos de Final)',
      description: 'Victoria de San Juan 15 - 11 para avanzar a semifinales.',
      type: EventType.AMISTOSO,
      status: EventStatus.COMPLETED,
      location: 'Cancha 2',
      parentId: activeTournament.id,
      matchCategory: 'QUARTER_FINALS',
      rivalId: rivals[1].id,
      startsAt: new Date(Date.now() - 3600000 * 24),
      endsAt: new Date(Date.now() - 3600000 * 22),
      windSpeed: 15,
      windDirection: 'N'
    }
  })

  const internalScrimmage = await prisma.event.create({
    data: {
      title: 'Scrimmage Interno: Equipo Claro vs Equipo Oscuro',
      description: 'Entrenamiento de alta intensidad con partido interno de preparación.',
      type: EventType.TRAINING,
      status: EventStatus.ONGOING,
      location: 'Cancha 3',
      isInternalScrimmage: true,
      startsAt: new Date(Date.now() - 1800000),
      endsAt: new Date(Date.now() + 5400000),
      windSpeed: 5,
      windDirection: 'S'
    }
  })

  // Eventos masivos adicionales
  const eventsData = Array.from({ length: NUM_EVENTS - 4 }).map(() => {
    const startsAt = faker.date.between({ from: '2025-01-01', to: '2026-12-31' })
    const status = startsAt < new Date() ? EventStatus.COMPLETED : faker.helpers.arrayElement([EventStatus.UPCOMING, EventStatus.CANCELLED])
    return {
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      type: faker.helpers.arrayElement(Object.values(EventType)),
      status,
      location: faker.location.streetAddress(),
      startsAt,
      endsAt: status === EventStatus.COMPLETED ? new Date(startsAt.getTime() + 1000 * 60 * 60 * 2) : null,
      windSpeed: faker.number.int({ min: 0, max: 35 }),
      windDirection: faker.helpers.arrayElement(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'])
    }
  })

  for (let i = 0; i < eventsData.length; i += chunkSize) {
    await prisma.event.createMany({ data: eventsData.slice(i, i + chunkSize) })
  }
  const events = await prisma.event.findMany()

  // 7. Convocatorias (Participantes) y Asistencias
  console.log(`✅ Creando convocatorias con líneas tácticas y asistencias...`)
  const participantData = []
  const attendanceData = []

  // Convocatoria completa para los partidos del Torneo Activo
  for (const matchEvent of [liveMatch, completedMatch, internalScrimmage]) {
    for (let i = 0; i < 20; i++) {
      const p = players[i]
      const lineType = i < 7 ? 'O-Line' : i < 14 ? 'D-Line' : 'Flex'
      participantData.push({
        eventId: matchEvent.id,
        playerId: p.id,
        role: i === 0 ? 'Capitán' : i === 1 ? 'Capitán O-Line' : 'Jugador',
        status: 'confirmed',
        lineType
      })
      attendanceData.push({
        eventId: matchEvent.id,
        playerId: p.id,
        status: 'present',
        note: 'Presente en calentamiento táctico'
      })
    }
  }

  // Convocatorias para el resto de eventos
  const eventsSub = events.slice(0, 180)
  for (const event of eventsSub) {
    const shuffledPlayers = faker.helpers.shuffle(players).slice(0, faker.number.int({ min: 12, max: 28 }))
    for (const p of shuffledPlayers) {
      participantData.push({
        eventId: event.id,
        playerId: p.id,
        role: 'player',
        status: faker.helpers.arrayElement(['confirmed', 'tentative', 'declined']),
        lineType: faker.helpers.arrayElement(['O-Line', 'D-Line', 'Flex', null])
      })
      if (event.status === EventStatus.COMPLETED) {
        attendanceData.push({
          eventId: event.id,
          playerId: p.id,
          status: faker.helpers.weightedArrayElement([{weight:80, value:'present'}, {weight:10, value:'absent'}, {weight:10, value:'late'}])
        })
      }
    }
  }

  for (let i = 0; i < participantData.length; i += chunkSize) {
    await prisma.eventParticipant.createMany({ data: participantData.slice(i, i + chunkSize), skipDuplicates: true })
  }
  for (let i = 0; i < attendanceData.length; i += chunkSize) {
    await prisma.attendance.createMany({ data: attendanceData.slice(i, i + chunkSize), skipDuplicates: true })
  }

  // 8. Anotaciones en Vivo y Estadísticas de Partido
  console.log(`📈 Creando anotaciones en vivo y estadísticas...`)
  const annotationData = []

  // Anotaciones en vivo para el partido EN VIVO (San Juan vs Caracas)
  // San Juan (HOME: 8) vs Caracas (AWAY: 6)
  const homeScorers = [players[0], players[1], players[4], players[6], players[7], players[8], players[0], players[1]]
  const homeAssisters = [players[7], players[0], players[0], players[1], players[2], players[0], players[7], players[4]]
  
  for (let i = 0; i < homeScorers.length; i++) {
    annotationData.push({
      eventId: liveMatch.id,
      playerId: homeScorers[i].id,
      relatedPlayerId: homeAssisters[i].id,
      type: AnnotationType.GOAL,
      teamSide: 'HOME',
      scoreHome: i + 1,
      scoreAway: Math.min(i, 6),
      lineType: 'O-Line',
      timestamp: new Date(Date.now() - 3600000 + i * 300000),
      note: `Gol punto ${i + 1} de San Juan`
    })
  }

  // Defensas y Turnovers en el partido en vivo
  annotationData.push(
    { eventId: liveMatch.id, playerId: players[6].id, type: AnnotationType.DEFENSE, teamSide: 'HOME', scoreHome: 4, scoreAway: 3, lineType: 'D-Line', timestamp: new Date(Date.now() - 1500000), note: 'Layout D en media cancha' },
    { eventId: liveMatch.id, playerId: players[1].id, type: AnnotationType.DEFENSE, teamSide: 'HOME', scoreHome: 6, scoreAway: 5, lineType: 'D-Line', timestamp: new Date(Date.now() - 800000), note: 'Intercepción en zona de anotación' },
    { eventId: liveMatch.id, playerId: players[4].id, type: AnnotationType.TURNOVER, teamSide: 'HOME', scoreHome: 2, scoreAway: 2, lineType: 'O-Line', timestamp: new Date(Date.now() - 2500000), note: 'Pase forzado con viento' },
    { eventId: liveMatch.id, playerId: players[0].id, type: AnnotationType.DROP, teamSide: 'HOME', scoreHome: 5, scoreAway: 5, lineType: 'O-Line', timestamp: new Date(Date.now() - 1000000), note: 'Drop bajo presión' }
  )

  // Anotaciones para el partido completado
  for (let i = 0; i < 15; i++) {
    const scorer = players[i % 8]
    const assister = players[(i + 1) % 8]
    annotationData.push({
      eventId: completedMatch.id,
      playerId: scorer.id,
      relatedPlayerId: assister.id,
      type: AnnotationType.GOAL,
      teamSide: 'HOME',
      scoreHome: i + 1,
      scoreAway: Math.min(i, 11),
      lineType: 'O-Line',
      timestamp: new Date(completedMatch.startsAt.getTime() + i * 300000),
      note: `Gol oficial del partido #${i + 1}`
    })
  }

  // Anotaciones masivas para eventos completados
  for (const event of eventsSub.filter(e => e.status === EventStatus.COMPLETED && e.id !== completedMatch.id)) {
    for (let i = 0; i < 12; i++) {
      const isOurPlayer = faker.datatype.boolean()
      const type = faker.helpers.arrayElement(Object.values(AnnotationType))
      
      const annotation: any = {
        eventId: event.id,
        type,
        note: faker.lorem.sentence(),
        timestamp: faker.date.recent(),
        teamSide: isOurPlayer ? 'HOME' : 'AWAY',
        scoreHome: faker.number.int({ min: 0, max: 15 }),
        scoreAway: faker.number.int({ min: 0, max: 15 }),
      }
      
      if (isOurPlayer) {
        annotation.playerId = faker.helpers.arrayElement(players).id
        if (type === AnnotationType.GOAL) {
          annotation.relatedPlayerId = faker.helpers.arrayElement(players.filter(p => p.id !== annotation.playerId)).id
        }
      } else {
        const r = faker.helpers.arrayElement(rivals)
        annotation.rivalId = r.id
        annotation.opponentTeamName = r.name
      }
      annotationData.push(annotation)
    }
  }

  for (let i = 0; i < annotationData.length; i += chunkSize) {
    await prisma.eventAnnotation.createMany({ data: annotationData.slice(i, i + chunkSize) })
  }

  // SOTG (Espíritu de Juego)
  console.log(`🕊️ Evaluando Espíritu de Juego (SOTG)...`)
  const completedMatches = eventsSub.filter(e => e.status === EventStatus.COMPLETED)
  const spiritData = completedMatches.map(match => ({
    eventId: match.id,
    rulesKnowledge: faker.number.int({ min: 2, max: 4 }),
    foulsAndContact: faker.number.int({ min: 2, max: 4 }),
    fairMindedness: faker.number.int({ min: 2, max: 4 }),
    positiveAttitude: faker.number.int({ min: 2, max: 4 }),
    communication: faker.number.int({ min: 2, max: 4 }),
    comment: 'Excelente espíritu y comunicación durante todo el encuentro.'
  }))
  await prisma.spiritScore.createMany({ data: spiritData })

  // 9. PlayerMatchStats Agregadas
  console.log(`📊 Calculando tabla de estadísticas acumuladas...`)
  const statsMap = new Map<string, any>()
  for (const ann of annotationData) {
    if (!ann.playerId) continue
    const key = `${ann.eventId}_${ann.playerId}`
    if (!statsMap.has(key)) {
      statsMap.set(key, { eventId: ann.eventId, playerId: ann.playerId, goals: 0, assists: 0, defenses: 0, turnovers: 0, drops: 0 })
    }
    const st = statsMap.get(key)
    if (ann.type === AnnotationType.GOAL) st.goals++
    if (ann.type === AnnotationType.ASSIST) st.assists++
    if (ann.type === AnnotationType.DEFENSE) st.defenses++
    if (ann.type === AnnotationType.TURNOVER) st.turnovers++
    if (ann.type === AnnotationType.DROP) st.drops++
  }
  const statsData = Array.from(statsMap.values())
  for (let i = 0; i < statsData.length; i += chunkSize) {
    await prisma.playerMatchStats.createMany({ data: statsData.slice(i, i + chunkSize) })
  }

  // 10. Lesiones Médicas
  console.log(`🏥 Creando registro de lesiones...`)
  const injuriesData = [
    { playerId: players[1].id, type: 'Sobrecarga de isquiotibial derecho', severity: InjurySeverity.MILD, status: InjuryStatus.RESOLVED, startDate: new Date(Date.now() - 3600000 * 24 * 30), description: 'Recuperado con fisioterapia y fortalecimiento' },
    { playerId: players[5].id, type: 'Esguince de tobillo grado 1', severity: InjurySeverity.MILD, status: InjuryStatus.RECOVERING, startDate: new Date(Date.now() - 3600000 * 24 * 5), description: 'En readaptación deportiva y descanso activo' },
    ...Array.from({ length: 40 }).map(() => ({
      playerId: faker.helpers.arrayElement(players).id,
      type: faker.helpers.arrayElement(['Contractura de gemelo', 'Tendinitis rotuliana', 'Contusión de hombro', 'Esguince leve de dedo']),
      severity: faker.helpers.arrayElement(Object.values(InjurySeverity)),
      status: faker.helpers.arrayElement(Object.values(InjuryStatus)),
      startDate: faker.date.past(),
      description: faker.lorem.sentence()
    }))
  ]
  await prisma.injury.createMany({ data: injuriesData })

  // 11. Canales y Mensajería
  console.log(`💬 Creando canales de comunicación...`)
  const channelTournament = await prisma.channel.create({
    data: { name: 'torneo-nacional-2026', eventId: activeTournament.id }
  })
  const channelGeneral = await prisma.channel.create({
    data: { name: 'general-equipo' }
  })

  await prisma.message.createMany({
    data: [
      { channelId: channelTournament.id, authorId: players[0].id, content: '¡Muchachos, puntualidad para el calentamiento en la Cancha 1 a las 7:30 AM!' },
      { channelId: channelTournament.id, authorId: players[1].id, content: 'Lleven ambas camisetas (Clara y Oscura) y discos reglamentarios.' },
      { channelId: channelGeneral.id, authorId: players[2].id, content: 'Revisen la jugada de Vertical Stack en el módulo de Táctica antes del partido.' }
    ]
  })

  // 12. Finanzas
  console.log(`💰 Creando finanzas y balances...`)
  const accCaja = await prisma.account.create({ data: { name: 'Caja Chica Efectivo', type: AccountType.CASH } })
  const accBanco = await prisma.account.create({ data: { name: 'Banco Mercantil - Club', type: AccountType.BANK } })

  const catCuotas = await prisma.category.create({ data: { name: 'Cuotas Mensuales', kind: TransactionType.INCOME } })
  const catTorneos = await prisma.category.create({ data: { name: 'Inscripciones Torneos', kind: TransactionType.INCOME } })
  const catCanchas = await prisma.category.create({ data: { name: 'Alquiler de Canchas', kind: TransactionType.EXPENSE } })
  const catMaterial = await prisma.category.create({ data: { name: 'Discos y Conos', kind: TransactionType.EXPENSE } })

  const transactionData = [
    { accountId: accBanco.id, categoryId: catTorneos.id, type: TransactionType.INCOME, amountCents: 45000, occurredAt: new Date(Date.now() - 3600000 * 24 * 7), description: 'Inscripción Torneo Nacional 2026' },
    { accountId: accBanco.id, categoryId: catCuotas.id, type: TransactionType.INCOME, amountCents: 85000, occurredAt: new Date(Date.now() - 3600000 * 24 * 14), description: 'Cuotas de pretemporada de jugadores' },
    { accountId: accBanco.id, categoryId: catCanchas.id, type: TransactionType.EXPENSE, amountCents: 30000, occurredAt: new Date(Date.now() - 3600000 * 24 * 3), description: 'Pago de iluminación y canchas de entrenamiento' },
    { accountId: accCaja.id, categoryId: catMaterial.id, type: TransactionType.EXPENSE, amountCents: 12000, occurredAt: new Date(Date.now() - 3600000 * 24 * 10), description: 'Compra de 10 discos Discraft Ultrastar 175g' },
  ]
  await prisma.transaction.createMany({ data: transactionData })

  // 13. Pizarra Táctica de Jugadas
  console.log(`📋 Creando libro de jugadas tácticas...`)
  const playsData = [
    {
      name: 'Vertical Stack - Break Flow',
      category: PlayCategory.OFFENSE,
      description: 'Cortes en profundidad desde el fondo del stack aprovechando el lado abierto.',
      content: '1. Handlers mantienen el disco en el centro.\n2. Cutter 1 sale en diagonal al lado abierto.\n3. Si está cerrado, Cutter 2 ataca la zona libre tras el break.\n4. Handlers buscan el huck largo a la zona de anotación.'
    },
    {
      name: 'Horizontal Stack - Isolation Cutter',
      category: PlayCategory.OFFENSE,
      description: 'Espacio abierto central para cortes en isolación 1v1.',
      content: '1. 3 Handlers en la base y 4 Cutters alineados horizontalmente.\n2. Los dos cutters del centro crean el primer corte en tijera.\n3. Los cutters exteriores mantienen abiertos los carriles laterales.'
    },
    {
      name: 'Defensa de Zona 3-3-1 (Cup)',
      category: PlayCategory.DEFENSE,
      description: 'Zona compacta contra viento para forzar lanzamientos altos o turnovers.',
      content: '1. Cup de 3 jugadores bloquea los pases cortos de los handlers.\n2. 3 Mids cubren el medio campo y líneas laterales.\n3. 1 Deep cubre el fondo y los hucks largos.'
    },
    {
      name: 'Fuerza Línea Lateral (Force Sideline)',
      category: PlayCategory.DEFENSE,
      description: 'Defensa individual forzando al oponente hacia la línea lateral para reducir sus opciones de pase.',
      content: '1. La marca se sitúa bloqueando el centro del campo.\n2. Los defensores de corte anticipan el pase a la banda.'
    }
  ]
  await prisma.play.createMany({ data: playsData })

  // 14. Recursos y Noticias
  console.log(`📰 Creando noticias oficiales y recursos...`)
  await prisma.newsPost.createMany({
    data: [
      {
        title: '🏆 San Juan clasifica a Semifinales del Torneo Nacional',
        content: 'Tras una brillante victoria en cuartos de final frente a Dragones de Valencia, nuestro equipo avanza a la semifinal del campeonato nacional. ¡Acompáñanos a apoyar al equipo!',
        authorId: players[0].id,
        category: 'Torneos',
        isPublished: true,
        isPinned: true
      },
      {
        title: 'Horarios de Entrenamientos de Pretemporada 2026',
        content: 'Los entrenamientos oficiales se realizarán todos los martes y jueves a las 6:30 PM en las Canchas Principales. Se requiere puntualidad y asistencia confirmada.',
        authorId: players[2].id,
        category: 'Entrenamientos',
        isPublished: true,
        isPinned: false
      }
    ]
  })

  await prisma.resource.createMany({
    data: [
      { title: 'Reglamento Oficial WFDF Ultimate 2025-2028', category: 'Reglamento', description: 'Reglamento traducido oficial de la Federación Mundial de Disco Volador.', url: 'https://rules.wfdf.org' },
      { title: 'Guía de Espíritu de Juego (SOTG)', category: 'Espíritu de Juego', description: 'Criterios y rúbrica para evaluación del Spirit of the Game en torneos oficiales.', url: 'https://spirit.wfdf.org' }
    ]
  })

  console.log('🎉 Seeder enriquecido completado con éxito con todas las relaciones y datos para el torneo!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
