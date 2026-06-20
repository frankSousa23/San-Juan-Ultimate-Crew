import * as dotenv from 'dotenv'
dotenv.config()
import { PrismaClient, PlayerPosition, PlayerStatus, EventType, EventStatus, InjurySeverity, InjuryStatus, PlayCategory, AccountType, TransactionType, AnnotationType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'

import { prisma } from '../src/lib/prisma.js'

// Constantes de cantidad multiplicadas
const NUM_PLAYERS = 300
const NUM_USERS = 320
const NUM_TOURNAMENTS = 50
const NUM_REGULAR_EVENTS = 600
const NUM_CHANNELS = 50
const NUM_MESSAGES_PER_CHANNEL = 100
const NUM_RIVALS = 50
const NUM_TRANSACTIONS = 1000
const NUM_INJURIES = 600
const NUM_RESOURCES = 100
const NUM_PLAYS = 100
const NUM_NEWS = 100

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Ambiente de producción detectado. El seeder masivo no se ejecutará aquí.')
    return
  }
  console.log('🌱 Iniciando seeder MASIVO REESTRUCTURADO...')
  
  console.log('🧹 Vaciando la base de datos...')
  await prisma.spiritScore.deleteMany()
  await prisma.playerMatchStats.deleteMany()
  await prisma.roleRequest.deleteMany()
  await prisma.eventAnnotation.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.eventParticipant.deleteMany()
  await prisma.message.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.newsPostFile.deleteMany()
  await prisma.newsPost.deleteMany()
  await prisma.injury.deleteMany()
  await prisma.rivalPlayer.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.rival.deleteMany()
  await prisma.play.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.channel.deleteMany()
  await prisma.category.deleteMany()
  await prisma.account.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.role.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.user.deleteMany()
  await prisma.player.deleteMany()
  await prisma.event.deleteMany()
  console.log('✨ Base de datos vaciada.')
  
  // 1. Roles y Permisos
  const managePerms = ['finance:manage', 'resources:manage', 'roster:manage', 'events:manage', 'communications:manage', 'injuries:manage', 'rivals:manage', 'plays:manage']
  const viewPerms = ['roster:view', 'events:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'finance:view', 'statistics:view']
  const allPermNames = [...managePerms, ...viewPerms]
  
  console.log('🔑 Creando permisos...')
  await prisma.permission.createMany({
    data: allPermNames.map(name => ({ name })),
    skipDuplicates: true
  })

  const roles = ['admin', 'guest', 'player', 'captain', 'coach', 'treasurer']
  console.log('🛡️ Creando roles...')
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
  await assignPerms('player', ['communications:manage', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'statistics:view'])
  await assignPerms('captain', ['roster:manage', 'events:manage', 'communications:manage', 'injuries:manage', 'rivals:manage', 'plays:manage', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'finance:view'])
  await assignPerms('coach', ['events:manage', 'communications:manage', 'injuries:manage', 'plays:manage', 'resources:manage', 'roster:view', 'injuries:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view'])
  await assignPerms('treasurer', ['finance:manage', 'finance:view', 'roster:view', 'events:view', 'statistics:view'])
  await assignPerms('guest', ['events:view', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'statistics:view'])

  // 2. Usuarios Base
  console.log('👤 Creando usuarios base...')
  const passwordHash = await bcrypt.hash('123456', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@sju.com' },
    update: { passwordHash, status: 'APPROVED' },
    create: { email: 'admin@sju.com', name: 'Administrador Masivo', passwordHash, status: 'APPROVED' }
  })
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@sju.com' } })
  if (adminUser) await prisma.userRole.upsert({ where: { userId_roleId: { userId: adminUser.id, roleId: roleMap['admin'] } }, update: {}, create: { userId: adminUser.id, roleId: roleMap['admin'] } })

  await prisma.user.upsert({
    where: { email: 'player@example.com' },
    update: { passwordHash, status: 'APPROVED' },
    create: { email: 'player@example.com', name: 'Test Player', passwordHash, status: 'APPROVED' }
  })
  const playerUser = await prisma.user.findUnique({ where: { email: 'player@example.com' } })
  if (playerUser) await prisma.userRole.upsert({ where: { userId_roleId: { userId: playerUser.id, roleId: roleMap['player'] } }, update: {}, create: { userId: playerUser.id, roleId: roleMap['player'] } })

  await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: { passwordHash, status: 'APPROVED' },
    create: { email: 'guest@example.com', name: 'Test Guest', passwordHash, status: 'APPROVED' }
  })
  const guestUser = await prisma.user.findUnique({ where: { email: 'guest@example.com' } })
  if (guestUser) await prisma.userRole.upsert({ where: { userId_roleId: { userId: guestUser.id, roleId: roleMap['guest'] } }, update: {}, create: { userId: guestUser.id, roleId: roleMap['guest'] } })

  // 3. Jugadores Masivos
  console.log(`🏃 Creando ${NUM_PLAYERS} jugadores...`)
  const playersData = Array.from({ length: NUM_PLAYERS }).map((_, i) => ({
    name: faker.person.fullName(),
    number: i + 1,
    position: faker.helpers.arrayElement(Object.values(PlayerPosition)),
    status: faker.helpers.weightedArrayElement([
      { weight: 70, value: PlayerStatus.ACTIVE },
      { weight: 20, value: PlayerStatus.INACTIVE },
      { weight: 10, value: PlayerStatus.INJURED }
    ]),
    heightCm: faker.number.int({ min: 155, max: 200 }),
    experience: `${faker.number.int({ min: 1, max: 15 })} años`
  }))
  await prisma.player.createMany({ data: playersData, skipDuplicates: true })
  const players = await prisma.player.findMany()

  // 4. Usuarios Masivos
  console.log(`🧑‍💻 Creando ${NUM_USERS} usuarios...`)
  const usersData = Array.from({ length: NUM_USERS }).map((_, i) => ({
    email: faker.internet.email() + i, 
    name: faker.person.fullName(),
    passwordHash,
    status: 'APPROVED' as any,
    playerId: i < players.length ? players[i].id : null,
  }))
  await prisma.user.createMany({ data: usersData, skipDuplicates: true })
  
  const allUsers = await prisma.user.findMany()
  const explicitUsers = ['admin@sju.com', 'player@example.com', 'guest@example.com']
  const userRolesData = allUsers.filter(u => !explicitUsers.includes(u.email)).map(u => ({
    userId: u.id,
    roleId: faker.helpers.arrayElement([roleMap['player'], roleMap['guest'], roleMap['captain']])
  }))
  await prisma.userRole.createMany({ data: userRolesData, skipDuplicates: true })

  // 5. Creación Jerárquica de Eventos y Torneos
  console.log(`🏆 Creando ${NUM_TOURNAMENTS} Torneos y Partidos hijos...`)
  
  const tournamentList = []
  for (let i = 0; i < NUM_TOURNAMENTS; i++) {
    const startsAt = faker.date.between({ from: '2025-01-01', to: '2026-12-31' })
    const status = startsAt < new Date() ? EventStatus.COMPLETED : faker.helpers.arrayElement([EventStatus.UPCOMING, EventStatus.CANCELLED])
    
    // Create Tournament
    const tournament = await prisma.event.create({
      data: {
        title: `Torneo ${faker.location.city()}`,
        description: faker.lorem.sentence(),
        type: EventType.TOURNAMENT,
        status,
        location: faker.location.streetAddress(),
        startsAt,
        endsAt: status === EventStatus.COMPLETED ? new Date(startsAt.getTime() + 1000 * 60 * 60 * 48) : null,
      }
    })
    tournamentList.push(tournament)

    // Create Matches for Tournament
    if (status === EventStatus.COMPLETED) {
      const numMatches = faker.number.int({ min: 4, max: 8 })
      const matchData = Array.from({ length: numMatches }).map((_, idx) => ({
        title: `Partido ${idx + 1} - ${tournament.title}`,
        type: EventType.FULL_DAY_OPEN, // Or AMISTOSO
        status: EventStatus.COMPLETED,
        location: tournament.location,
        startsAt: new Date(startsAt.getTime() + 1000 * 60 * 60 * idx * 2), // Match every 2 hours
        endsAt: new Date(startsAt.getTime() + 1000 * 60 * 60 * (idx * 2 + 1)),
        parentId: tournament.id
      }))
      await prisma.event.createMany({ data: matchData })
    }
  }

  console.log(`📅 Creando ${NUM_REGULAR_EVENTS} eventos regulares...`)
  const chunkSize = 500
  const regularEventsData = Array.from({ length: NUM_REGULAR_EVENTS }).map(() => {
    const startsAt = faker.date.between({ from: '2025-01-01', to: '2026-12-31' })
    const status = startsAt < new Date() ? EventStatus.COMPLETED : faker.helpers.arrayElement([EventStatus.UPCOMING, EventStatus.CANCELLED])
    return {
      title: faker.lorem.words(3),
      type: faker.helpers.arrayElement([EventType.TRAINING, EventType.SOCIAL, EventType.WORKSHOP, EventType.AMISTOSO]),
      status,
      location: faker.location.streetAddress(),
      startsAt,
      endsAt: status === EventStatus.COMPLETED ? new Date(startsAt.getTime() + 1000 * 60 * 60 * 2) : null,
    }
  })
  
  for (let i = 0; i < regularEventsData.length; i += chunkSize) {
    await prisma.event.createMany({ data: regularEventsData.slice(i, i + chunkSize) })
  }

  const allEvents = await prisma.event.findMany()
  const completedMatches = allEvents.filter(e => e.status === EventStatus.COMPLETED && e.parentId !== null)

  // 6. Rivales
  console.log(`🛡️ Creando ${NUM_RIVALS} rivales...`)
  const rivalData = Array.from({ length: NUM_RIVALS }).map(() => ({
    name: faker.company.name() + " Ultimate",
    strengths: faker.lorem.words(3),
    weaknesses: faker.lorem.words(3),
  }))
  await prisma.rival.createMany({ data: rivalData })
  const rivals = await prisma.rival.findMany()

  const rivalPlayersData = []
  for (const r of rivals) {
    for (let i = 1; i <= 15; i++) {
      rivalPlayersData.push({
        rivalId: r.id,
        name: faker.person.fullName(),
        number: i,
        position: faker.helpers.arrayElement(['Handler', 'Cutter']),
      })
    }
  }
  for (let i = 0; i < rivalPlayersData.length; i += chunkSize) {
    await prisma.rivalPlayer.createMany({ data: rivalPlayersData.slice(i, i + chunkSize), skipDuplicates: true })
  }
  const rivalPlayers = await prisma.rivalPlayer.findMany()

  // 7. Asistencia y Anotaciones para los partidos (Generación de estadísticas lógicas)
  console.log(`✅ Creando Participantes, Asistencia y Anotaciones...`)
  
  const participantData = []
  const attendanceData = []
  const annotationData = []
  
  for (const match of completedMatches) {
    // Escoger entre 14 y 21 jugadores para este partido
    const rosterForMatch = faker.helpers.shuffle(players).slice(0, faker.number.int({ min: 14, max: 21 }))
    const opponentTeam = faker.helpers.arrayElement(rivals)
    
    // Event Participants & Attendance
    for (const p of rosterForMatch) {
      participantData.push({
        eventId: match.id,
        playerId: p.id,
        role: 'player',
        status: 'confirmed',
        lineType: faker.helpers.arrayElement(['O-Line', 'D-Line', 'Flex'])
      })
      attendanceData.push({
        eventId: match.id,
        playerId: p.id,
        status: 'present'
      })
    }

    // Annotations (Goals, Assists, D's, etc)
    // Supongamos que en un partido hay de 10 a 15 puntos nuestros, y de 8 a 15 de ellos.
    const ourGoals = faker.number.int({ min: 8, max: 15 })
    for (let g = 0; g < ourGoals; g++) {
      const scorer = faker.helpers.arrayElement(rosterForMatch)
      const assister = faker.helpers.arrayElement(rosterForMatch.filter(p => p.id !== scorer.id))
      
      annotationData.push({
        eventId: match.id,
        type: AnnotationType.GOAL,
        playerId: scorer.id,
        timestamp: new Date(match.startsAt.getTime() + faker.number.int({min: 1000, max: 3000000})),
        opponentTeamName: opponentTeam.name,
      })
      annotationData.push({
        eventId: match.id,
        type: AnnotationType.ASSIST,
        playerId: assister.id,
        timestamp: new Date(match.startsAt.getTime() + faker.number.int({min: 1000, max: 3000000})),
        opponentTeamName: opponentTeam.name,
      })
    }
    
    // Other actions
    const otherActionsCount = faker.number.int({ min: 15, max: 30 })
    for (let a = 0; a < otherActionsCount; a++) {
      annotationData.push({
        eventId: match.id,
        type: faker.helpers.arrayElement([AnnotationType.DEFENSE, AnnotationType.TURNOVER, AnnotationType.DROP]),
        playerId: faker.helpers.arrayElement(rosterForMatch).id,
        timestamp: new Date(match.startsAt.getTime() + faker.number.int({min: 1000, max: 3000000})),
        opponentTeamName: opponentTeam.name,
      })
    }
  }

  for (let i = 0; i < participantData.length; i += chunkSize) {
    await prisma.eventParticipant.createMany({ data: participantData.slice(i, i + chunkSize), skipDuplicates: true })
  }
  for (let i = 0; i < attendanceData.length; i += chunkSize) {
    await prisma.attendance.createMany({ data: attendanceData.slice(i, i + chunkSize), skipDuplicates: true })
  }
  for (let i = 0; i < annotationData.length; i += chunkSize) {
    await prisma.eventAnnotation.createMany({ data: annotationData.slice(i, i + chunkSize) })
  }

  // 8. PlayerMatchStats (Generado a partir de las anotaciones de forma agregada por partido)
  console.log(`📊 Generando estadísticas agregadas de partidos (PlayerMatchStats)...`)
  const statsMap = new Map<string, any>()
  for (const ann of annotationData) {
    if (!ann.playerId) continue
    const key = `${ann.eventId}_${ann.playerId}`
    if (!statsMap.has(key)) {
      statsMap.set(key, { eventId: ann.eventId, playerId: ann.playerId, goals: 0, assists: 0, defenses: 0, turnovers: 0, drops: 0 })
    }
    const st = statsMap.get(key)
    if (ann.type === 'GOAL') st.goals++
    if (ann.type === 'ASSIST') st.assists++
    if (ann.type === 'DEFENSE') st.defenses++
    if (ann.type === 'TURNOVER') st.turnovers++
    if (ann.type === 'DROP') st.drops++
  }
  const statsData = Array.from(statsMap.values())
  for (let i = 0; i < statsData.length; i += chunkSize) {
    await prisma.playerMatchStats.createMany({ data: statsData.slice(i, i + chunkSize) })
  }

  // 9. Espíritu de Juego (SOTG)
  console.log(`🕊️ Evaluando SOTG...`)
  const spiritData = completedMatches.map(match => ({
    eventId: match.id,
    rulesKnowledge: faker.number.int({ min: 1, max: 4 }),
    foulsAndContact: faker.number.int({ min: 1, max: 4 }),
    fairMindedness: faker.number.int({ min: 1, max: 4 }),
    positiveAttitude: faker.number.int({ min: 1, max: 4 }),
    communication: faker.number.int({ min: 1, max: 4 }),
  }))
  for (let i = 0; i < spiritData.length; i += chunkSize) {
    await prisma.spiritScore.createMany({ data: spiritData.slice(i, i + chunkSize) })
  }

  // 10. Lesiones
  console.log(`🏥 Creando ${NUM_INJURIES} lesiones...`)
  const injuriesData = Array.from({ length: NUM_INJURIES }).map(() => ({
    playerId: faker.helpers.arrayElement(players).id,
    type: faker.lorem.words(2),
    severity: faker.helpers.arrayElement(Object.values(InjurySeverity)),
    status: faker.helpers.arrayElement(Object.values(InjuryStatus)),
    startDate: faker.date.past(),
    description: faker.lorem.sentence()
  }))
  for (let i = 0; i < injuriesData.length; i += chunkSize) {
    await prisma.injury.createMany({ data: injuriesData.slice(i, i + chunkSize) })
  }

  // 11. Canales y Mensajes
  console.log(`💬 Creando ${NUM_CHANNELS} canales y mensajes...`)
  const channelData = Array.from({ length: NUM_CHANNELS }).map(() => ({
    name: faker.lorem.words(2),
  }))
  await prisma.channel.createMany({ data: channelData })
  const channels = await prisma.channel.findMany()

  const messageData = []
  for (const c of channels) {
    for (let i = 0; i < NUM_MESSAGES_PER_CHANNEL; i++) {
      messageData.push({
        channelId: c.id,
        authorId: faker.helpers.arrayElement(players).id,
        content: faker.lorem.sentences(2),
        createdAt: faker.date.recent({ days: 60 })
      })
    }
  }
  for (let i = 0; i < messageData.length; i += chunkSize) {
    await prisma.message.createMany({ data: messageData.slice(i, i + chunkSize) })
  }

  // 12. Finanzas
  console.log(`💰 Creando ${NUM_TRANSACTIONS} transacciones financieras...`)
  await prisma.account.createMany({
    data: [{ name: 'Caja Chica', type: AccountType.CASH }, { name: 'Banco Principal', type: AccountType.BANK }]
  })
  await prisma.category.createMany({
    data: [{ name: 'Cuotas', kind: TransactionType.INCOME }, { name: 'Torneos', kind: TransactionType.INCOME }, { name: 'Material', kind: TransactionType.EXPENSE }, { name: 'Canchas', kind: TransactionType.EXPENSE }]
  })
  const accounts = await prisma.account.findMany()
  const categories = await prisma.category.findMany()
  const expenses = categories.filter(c => c.kind === TransactionType.EXPENSE)
  const incomes = categories.filter(c => c.kind === TransactionType.INCOME)

  const transactionData = Array.from({ length: NUM_TRANSACTIONS }).map(() => {
    const isIncome = faker.datatype.boolean()
    return {
      accountId: faker.helpers.arrayElement(accounts).id,
      categoryId: faker.helpers.arrayElement(isIncome ? incomes : expenses).id,
      type: isIncome ? TransactionType.INCOME : TransactionType.EXPENSE,
      amountCents: faker.number.int({ min: 1000, max: 100000 }), // $10 a $1000
      occurredAt: faker.date.past({ years: 1 }),
      description: faker.lorem.sentence()
    }
  })
  for (let i = 0; i < transactionData.length; i += chunkSize) {
    await prisma.transaction.createMany({ data: transactionData.slice(i, i + chunkSize) })
  }

  // 13. Recursos
  console.log(`📁 Creando ${NUM_RESOURCES} recursos...`)
  const resourceData = Array.from({ length: NUM_RESOURCES }).map(() => ({
    title: faker.system.fileName(),
    description: faker.lorem.sentence(),
    category: faker.helpers.arrayElement(['Video', 'Documento', 'Reglamento', 'Estrategia']),
    url: faker.internet.url(),
  }))
  await prisma.resource.createMany({ data: resourceData })

  // 14. Jugadas
  console.log(`📋 Creando ${NUM_PLAYS} jugadas...`)
  const playData = Array.from({ length: NUM_PLAYS }).map(() => ({
    name: faker.lorem.words(3),
    category: faker.helpers.arrayElement(Object.values(PlayCategory)),
    description: faker.lorem.sentences(2),
    content: faker.lorem.paragraphs(2),
  }))
  await prisma.play.createMany({ data: playData })

  // 15. Noticias y Anuncios
  console.log(`📰 Creando ${NUM_NEWS} noticias...`)
  const newsData = Array.from({ length: NUM_NEWS }).map(() => ({
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    authorId: faker.helpers.arrayElement(players).id,
    category: faker.helpers.arrayElement(['General', 'Torneos', 'Reuniones', 'Anuncios']),
    isPublished: true,
    isPinned: faker.datatype.boolean({ probability: 0.1 }),
  }))
  await prisma.newsPost.createMany({ data: newsData })

  console.log('✅ Seeder masivo reestructurado completado con éxito.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
