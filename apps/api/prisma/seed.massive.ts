import { PrismaClient, PlayerPosition, PlayerStatus, EventType, EventStatus, InjurySeverity, InjuryStatus, PlayCategory, AccountType, TransactionType, AnnotationType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

// Constantes de cantidad
const NUM_PLAYERS = 500
const NUM_USERS = 600
const NUM_EVENTS = 1000
const NUM_CHANNELS = 100
const NUM_MESSAGES_PER_CHANNEL = 20
const NUM_RIVALS = 50
const NUM_TRANSACTIONS = 2000

async function main() {
  console.log('🌱 Iniciando seeder MASIVO...')
  const db: any = prisma;
  
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
  const passwordHash = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash, status: 'APPROVED' },
    create: { email: 'admin@example.com', name: 'Administrador Masivo', passwordHash, status: 'APPROVED' }
  })

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })
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
  const explicitUsers = ['admin@example.com', 'player@example.com', 'guest@example.com']
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
      endsAt: status === EventStatus.COMPLETED ? new Date(startsAt.getTime() + 1000 * 60 * 60 * 2) : null
    }
  })
  // Insertar en chunks
  const chunkSize = 500
  for (let i = 0; i < eventsData.length; i += chunkSize) {
    await prisma.event.createMany({ data: eventsData.slice(i, i + chunkSize) })
  }
  const events = await prisma.event.findMany()

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
        status: faker.helpers.arrayElement(['confirmed', 'tentative', 'declined'])
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
  console.log(`📈 Creando anotaciones de eventos...`)
  const annotationData = []
  for (const event of eventsSub.filter(e => e.status === EventStatus.COMPLETED)) {
    for (let i = 0; i < 20; i++) {
      annotationData.push({
        eventId: event.id,
        playerId: faker.datatype.boolean() ? faker.helpers.arrayElement(players).id : null,
        type: faker.helpers.arrayElement(Object.values(AnnotationType)),
        note: faker.lorem.sentence(),
        timestamp: faker.date.recent(),
      })
    }
  }

  for (let i = 0; i < annotationData.length; i += chunkSize) {
    await prisma.eventAnnotation.createMany({ data: annotationData.slice(i, i + chunkSize) })
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
