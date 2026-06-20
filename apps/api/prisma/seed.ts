import { PrismaClient, PlayerPosition, PlayerStatus, EventType, EventStatus, InjurySeverity, InjuryStatus, PlayCategory, AccountType, TransactionType, AnnotationType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

// Constantes de cantidad (Optimizadas para pruebas locales abundantes pero rápidas)
const NUM_PLAYERS = 150
const NUM_USERS = 160
const NUM_EVENTS = 300
const NUM_CHANNELS = 20
const NUM_MESSAGES_PER_CHANNEL = 30
const NUM_RIVALS = 25
const NUM_TRANSACTIONS = 500

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Ambiente de producción detectado. El seeder masivo no se ejecutará aquí.')
    console.log('Solo configurando datos mínimos si es necesario...')
    return
  }
  
  console.log('🌱 Iniciando seeder MASIVO...')
  const db: any = prisma;
  
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
  
  // 1. Roles y Permisos (Igual que el seed original para mantener coherencia)
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

  // Obtener roles y permisos para asignaciones rápidas
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
    create: { email: 'admin@sju.com', name: 'Superadmin', passwordHash, status: 'APPROVED' }
  })

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@sju.com' } })
  if (adminUser) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: roleMap['admin'] } },
      update: {}, create: { userId: adminUser.id, roleId: roleMap['admin'] }
    })
  }

  // Create explicit player and guest users for tests
  await prisma.user.upsert({
    where: { email: 'player@example.com' },
    update: { passwordHash, status: 'APPROVED' },
    create: { email: 'player@example.com', name: 'Test Player', passwordHash, status: 'APPROVED' }
  })
  const playerUser = await prisma.user.findUnique({ where: { email: 'player@example.com' } })
  if (playerUser) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: playerUser.id, roleId: roleMap['player'] } },
      update: {}, create: { userId: playerUser.id, roleId: roleMap['player'] }
    })
  }

  await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: { passwordHash, status: 'APPROVED' },
    create: { email: 'guest@example.com', name: 'Test Guest', passwordHash, status: 'APPROVED' }
  })
  const guestUser = await prisma.user.findUnique({ where: { email: 'guest@example.com' } })
  if (guestUser) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: guestUser.id, roleId: roleMap['guest'] } },
      update: {}, create: { userId: guestUser.id, roleId: roleMap['guest'] }
    })
  }

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

  // 4. Usuarios Masivos (asignados a jugadores)
  console.log(`🧑‍💻 Creando ${NUM_USERS} usuarios...`)
  const usersData = Array.from({ length: NUM_USERS }).map((_, i) => ({
    email: faker.internet.email() + i, // Evitar colisiones
    name: faker.person.fullName(),
    passwordHash,
    status: 'APPROVED',
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

  // 5. Eventos Masivos
  console.log(`📅 Creando ${NUM_EVENTS} eventos...`)
  const eventsData = Array.from({ length: NUM_EVENTS }).map(() => {
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
  // Insertar en chunks
  const chunkSize = 500
  for (let i = 0; i < eventsData.length; i += chunkSize) {
    await prisma.event.createMany({ data: eventsData.slice(i, i + chunkSize) })
  }
  const events = await prisma.event.findMany()

  // 5.5. Jerarquía de Torneos (Padres e Hijos)
  console.log(`🏆 Estableciendo jerarquía de torneos...`)
  const tournaments = events.filter(e => e.type === EventType.TOURNAMENT).slice(0, 30)
  const matches = events.filter(e => e.type !== EventType.TOURNAMENT && e.status === EventStatus.COMPLETED)
  let matchIndex = 0
  
  const updatePromises = []
  for (const tournament of tournaments) {
    const numMatches = faker.number.int({ min: 3, max: 6 })
    for (let i = 0; i < numMatches; i++) {
      if (matchIndex < matches.length) {
        updatePromises.push(
          prisma.event.update({
            where: { id: matches[matchIndex].id },
            data: { parentId: tournament.id }
          })
        )
        matchIndex++
      }
    }
  }
  await Promise.all(updatePromises)

  // 6. Participantes y Asistencia
  console.log(`✅ Creando participantes y asistencia...`)
  // Para no explotar memoria, seleccionamos un subset de eventos
  const eventsSub = events.slice(0, 200) 
  const participantData = []
  const attendanceData = []

  for (const event of eventsSub) {
    // 10 a 30 jugadores por evento
    const shuffledPlayers = faker.helpers.shuffle(players).slice(0, faker.number.int({ min: 10, max: 30 }))
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

  // 6.5. Espíritu de Juego (SOTG)
  console.log(`🕊️ Evaluando Espíritu de Juego (SOTG)...`)
  const completedMatches = eventsSub.filter(e => e.status === EventStatus.COMPLETED)
  const spiritData = completedMatches.map(match => ({
    eventId: match.id,
    evaluatorTeamId: null, // Asumimos que es nuestra evaluación al otro equipo
    rulesKnowledge: faker.number.int({ min: 1, max: 4 }),
    foulsAndContact: faker.number.int({ min: 1, max: 4 }),
    fairMindedness: faker.number.int({ min: 1, max: 4 }),
    positiveAttitude: faker.number.int({ min: 1, max: 4 }),
    communication: faker.number.int({ min: 1, max: 4 }),
    comment: faker.datatype.boolean() ? faker.lorem.sentence() : null
  }))
  await prisma.spiritScore.createMany({ data: spiritData })

  // 7. Lesiones
  console.log(`🏥 Creando lesiones...`)
  const injuriesData = Array.from({ length: 300 }).map(() => ({
    playerId: faker.helpers.arrayElement(players).id,
    type: faker.lorem.words(2),
    severity: faker.helpers.arrayElement(Object.values(InjurySeverity)),
    status: faker.helpers.arrayElement(Object.values(InjuryStatus)),
    startDate: faker.date.past(),
    description: faker.lorem.sentence()
  }))
  await prisma.injury.createMany({ data: injuriesData })

  // 8. Rivalidades y Jugadores Rivales
  console.log(`🛡️ Creando rivales y jugadores rivales...`)
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

  // 9. Canales y Mensajes
  console.log(`💬 Creando canales y mensajes...`)
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
        createdAt: faker.date.recent({ days: 30 })
      })
    }
  }
  for (let i = 0; i < messageData.length; i += chunkSize) {
    await prisma.message.createMany({ data: messageData.slice(i, i + chunkSize) })
  }

  // 10. Finanzas
  console.log(`💰 Creando transacciones financieras...`)
  await prisma.account.createMany({
    data: [
      { name: 'Caja Chica', type: AccountType.CASH },
      { name: 'Banco Principal', type: AccountType.BANK }
    ]
  })
  await prisma.category.createMany({
    data: [
      { name: 'Cuotas', kind: TransactionType.INCOME },
      { name: 'Torneos', kind: TransactionType.INCOME },
      { name: 'Material', kind: TransactionType.EXPENSE },
      { name: 'Canchas', kind: TransactionType.EXPENSE }
    ]
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

  // 11. Anotaciones (EventAnnotations)
  console.log(`📈 Creando anotaciones de eventos y rivales...`)
  const rivalPlayers = await prisma.rivalPlayer.findMany()
  
  const annotationData = []
  for (const event of eventsSub.filter(e => e.status === EventStatus.COMPLETED)) {
    for (let i = 0; i < 20; i++) {
      const isOurPlayer = faker.datatype.boolean()
      const type = faker.helpers.arrayElement(Object.values(AnnotationType))
      
      let annotation = {
        eventId: event.id,
        type,
        note: faker.lorem.sentence(),
        timestamp: faker.date.recent(),
        playerId: null as number | null,
        rivalId: null as number | null,
        rivalPlayerId: null as number | null,
        opponentTeamName: null as string | null,
      }
      
      if (isOurPlayer) {
        annotation.playerId = faker.helpers.arrayElement(players).id
      } else {
        const rivalPlayer = faker.helpers.arrayElement(rivalPlayers)
        annotation.rivalId = rivalPlayer.rivalId
        annotation.rivalPlayerId = rivalPlayer.id
        annotation.opponentTeamName = rivals.find(r => r.id === rivalPlayer.rivalId)?.name || null
      }
      
      annotationData.push(annotation)
    }
  }

  for (let i = 0; i < annotationData.length; i += chunkSize) {
    await prisma.eventAnnotation.createMany({ data: annotationData.slice(i, i + chunkSize) })
  }

  // 12. Recursos
  console.log(`📁 Creando recursos...`)
  const resourceData = Array.from({ length: 50 }).map(() => ({
    title: faker.system.fileName(),
    description: faker.lorem.sentence(),
    category: faker.helpers.arrayElement(['Video', 'Documento', 'Reglamento', 'Estrategia']),
    url: faker.internet.url(),
  }))
  await prisma.resource.createMany({ data: resourceData })

  // 13. Jugadas
  console.log(`📋 Creando jugadas...`)
  const playData = Array.from({ length: 50 }).map(() => ({
    name: faker.lorem.words(3),
    category: faker.helpers.arrayElement(Object.values(PlayCategory)),
    description: faker.lorem.sentences(2),
    content: faker.lorem.paragraphs(2),
  }))
  await prisma.play.createMany({ data: playData })

  // 14. Noticias y Anuncios
  console.log(`📰 Creando noticias...`)
  const newsData = Array.from({ length: 50 }).map(() => ({
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    authorId: faker.helpers.arrayElement(players).id,
    category: faker.helpers.arrayElement(['General', 'Torneos', 'Reuniones', 'Anuncios']),
    isPublished: true,
    isPinned: faker.datatype.boolean({ probability: 0.1 }),
  }))
  await prisma.newsPost.createMany({ data: newsData })

  // 15. PlayerMatchStats (Resumen Estadístico)
  console.log(`📊 Generando estadísticas de partidos...`)
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

  console.log('✅ Seeder masivo completado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
