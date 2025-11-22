import { PrismaClient, PlayerPosition, PlayerStatus, EventType, EventStatus, InjurySeverity, InjuryStatus, PlayCategory, AccountType, TransactionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const db: any = prisma

// Helper to generate random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper to get random element from array
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function main() {
  console.log('🌱 Starting seed...')

  // 1) Auth: permissions, roles, admin users
  const perms = [
    'finance:manage',
    'resources:manage',
    'roster:manage',
    'events:manage',
    'communications:manage',
  ]
  for (const name of perms) {
    await db.permission.upsert({ where: { name }, update: {}, create: { name } })
  }
  const adminRole = await db.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } })
  const guestRole = await db.role.upsert({ where: { name: 'guest' }, update: {}, create: { name: 'guest' } })
  const playerRole = await db.role.upsert({ where: { name: 'player' }, update: {}, create: { name: 'player' } })
  const allPerms = await db.permission.findMany()
  
  // Admin gets all permissions
  for (const p of allPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id }
    })
  }
  
  // Player gets read permissions for most resources, and can manage communications
  const playerPerms = allPerms.filter((p: any) => 
    p.name === 'communications:manage' || 
    p.name === 'events:manage'
  )
  for (const p of playerPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: playerRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: playerRole.id, permissionId: p.id }
    })
  }
  
  // Guest has no permissions (read-only access to public data only)
  const passwordHash = await bcrypt.hash('admin123', 10)
  
  // Create multiple admin users
  const adminEmails = [
    'admin@example.com',
    'admin1@example.com',
    'admin2@example.com',
  ]
  const adminUsers = []
  for (const email of adminEmails) {
    const adminUser = await db.user.upsert({
      where: { email },
      update: { passwordHash, status: 'APPROVED' },
      create: { email, name: `Admin ${email.split('@')[0]}`, passwordHash, status: 'APPROVED' }
    })
    await db.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id }
    })
    adminUsers.push(adminUser)
  }

  // Sample guest and player users
  const guestUser = await db.user.upsert({
    where: { email: 'guest@example.com' },
    update: { passwordHash, status: 'APPROVED' },
    create: { email: 'guest@example.com', name: 'Invitado', passwordHash, status: 'APPROVED' }
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: guestUser.id, roleId: guestRole.id } },
    update: {},
    create: { userId: guestUser.id, roleId: guestRole.id }
  })

  // 2) Create 50 players
  console.log('👥 Creating 50 players...')
  const positions: PlayerPosition[] = [PlayerPosition.HANDLER, PlayerPosition.CUTTER, PlayerPosition.HYBRID]
  const statuses: PlayerStatus[] = [PlayerStatus.ACTIVE, PlayerStatus.ACTIVE, PlayerStatus.ACTIVE, PlayerStatus.INJURED, PlayerStatus.INACTIVE]
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Diego', 'Sofía', 'Roberto', 'Lucía', 'Miguel', 'Elena', 'José', 'Carmen', 'Luis', 'Patricia', 'Fernando', 'Laura', 'Ricardo', 'Andrea', 'Daniel', 'Mónica', 'Alejandro', 'Natalia', 'Andrés', 'Valentina', 'Sebastián', 'Isabella', 'Gabriel', 'Camila', 'Rodrigo', 'Mariana']
  const lastNames = ['Martínez', 'González', 'Rivera', 'López', 'Morales', 'Herrera', 'Silva', 'Vargas', 'Ramírez', 'Torres', 'Flores', 'García', 'Rodríguez', 'Pérez', 'Sánchez', 'Romero', 'Díaz', 'Castro', 'Mendoza', 'Ortega', 'Jiménez', 'Ruiz', 'Hernández', 'Moreno', 'Álvarez', 'Gutiérrez', 'Ramos', 'Medina', 'Vega', 'Cruz']
  
  const players = []
  const usedNumbers = new Set<number>()
  
  for (let i = 0; i < 50; i++) {
    let number: number
    do {
      number = Math.floor(Math.random() * 99) + 1
    } while (usedNumbers.has(number))
    usedNumbers.add(number)
    
    const firstName = randomElement(firstNames)
    const lastName = randomElement(lastNames)
    const name = `${firstName} ${lastName}`
    const position = randomElement(positions)
    const status = randomElement(statuses)
    const heightCm = Math.floor(Math.random() * 30) + 160 // 160-190 cm
    const experienceYears = Math.floor(Math.random() * 8) + 1
    const experience = `${experienceYears} ${experienceYears === 1 ? 'año' : 'años'}`
    
    const player = await prisma.player.upsert({
      where: { number },
      update: { name, position, status, heightCm, experience },
      create: { name, number, position, status, heightCm, experience }
    })
    players.push(player)
  }
  
  console.log(`✅ Created ${players.length} players`)

  // 3) Create player users (some players will have user accounts)
  console.log('👤 Creating player users...')
  const playerUserEmails = [
    'player@example.com',
    'player1@example.com',
    'player2@example.com',
    'player3@example.com',
    'player4@example.com',
  ]
  
  // Get players that don't have users yet
  const playersWithoutUsers = []
  for (const player of players) {
    const existingUser = await db.user.findFirst({ where: { playerId: player.id } })
    if (!existingUser) {
      playersWithoutUsers.push(player)
    }
  }
  
  for (let i = 0; i < playerUserEmails.length && i < playersWithoutUsers.length; i++) {
    const email = playerUserEmails[i]
    const player = playersWithoutUsers[i]
    const playerUser = await db.user.upsert({
      where: { email },
      update: { passwordHash, playerId: player.id, status: 'APPROVED' },
      create: { email, name: player.name, passwordHash, playerId: player.id, status: 'APPROVED' }
    })
    await db.userRole.upsert({
      where: { userId_roleId: { userId: playerUser.id, roleId: playerRole.id } },
      update: {},
      create: { userId: playerUser.id, roleId: playerRole.id }
    })
  }

  // 4) Create pending users (will be approved by admins later)
  console.log('⏳ Creating pending users...')
  const pendingEmails = [
    'pending1@example.com',
    'pending2@example.com',
    'pending3@example.com',
  ]
  for (const email of pendingEmails) {
    await db.user.upsert({
      where: { email },
      update: { passwordHash, status: 'PENDING' },
      create: { email, name: `Pending ${email.split('@')[0]}`, passwordHash, status: 'PENDING' }
    })
  }

  // 5) Create events
  console.log('📅 Creating events...')
  const now = new Date()
  const eventTypes: EventType[] = [EventType.TRAINING, EventType.TOURNAMENT, EventType.SOCIAL, EventType.WORKSHOP]
  // Create more completed events for statistics
  const eventStatuses: EventStatus[] = [
    EventStatus.COMPLETED, EventStatus.COMPLETED, EventStatus.COMPLETED, // More completed events
    EventStatus.UPCOMING, EventStatus.ONGOING, EventStatus.CANCELLED
  ]
  const locations = ['Cancha Central', 'Parque Deportivo', 'Estadio Municipal', 'Campo de Entrenamiento', 'Gimnasio']
  
  const events = []
  // Create more completed events (at least 10) for statistics
  for (let i = 0; i < 20; i++) {
    const type = randomElement(eventTypes)
    // First 12 events should be completed for better statistics
    const status = i < 12 ? EventStatus.COMPLETED : randomElement(eventStatuses)
    const startsAt = randomDate(
      new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago for completed events
      status === EventStatus.COMPLETED 
        ? new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // Completed events in the past
        : new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // Future events
    )
    const endsAt = new Date(startsAt.getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000) // 2-6 hours later
    
    const titles = {
      [EventType.TRAINING]: ['Entrenamiento Regular', 'Práctica Técnica', 'Entrenamiento Físico', 'Sesión de Lanzamientos'],
      [EventType.TOURNAMENT]: ['Torneo Regional', 'Copa Nacional', 'Campeonato Local', 'Torneo de Verano'],
      [EventType.SOCIAL]: ['Reunión de Equipo', 'Asado del Equipo', 'Celebración', 'Evento Social'],
      [EventType.WORKSHOP]: ['Taller de Estrategia', 'Workshop de Lanzamientos', 'Seminario de Defensa', 'Clínica de Ultimate'],
    }
    
    const title = randomElement(titles[type])
    const location = randomElement(locations)
    const description = `Evento ${type.toLowerCase()} del equipo`
    
    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        status,
        location,
        startsAt,
        endsAt: status === EventStatus.COMPLETED ? endsAt : null,
      }
    })
    events.push(event)
  }
  console.log(`✅ Created ${events.length} events`)

  // 6) Create event participants
  console.log('👥 Creating event participants...')
  for (const event of events.slice(0, 15)) { // Add participants to first 15 events
    const numParticipants = Math.floor(Math.random() * 15) + 5 // 5-20 participants
    const selectedPlayers = players.slice(0, Math.min(numParticipants, players.length))
    const roles = ['player', 'captain', 'substitute', null]
    
    for (const player of selectedPlayers) {
      await prisma.eventParticipant.upsert({
        where: { eventId_playerId: { eventId: event.id, playerId: player.id } },
        update: {},
        create: {
          eventId: event.id,
          playerId: player.id,
          role: randomElement(roles),
          status: randomElement(['confirmed', 'tentative', 'declined'])
        }
      })
    }
  }
  console.log('✅ Created event participants')

  // 7) Create attendance records
  console.log('📋 Creating attendance records...')
  for (const event of events.slice(0, 10)) { // Add attendance to first 10 events
    const numAttendees = Math.floor(Math.random() * 20) + 10 // 10-30 attendees
    const selectedPlayers = players.slice(0, Math.min(numAttendees, players.length))
    const statuses = ['present', 'absent', 'late']
    
    for (const player of selectedPlayers) {
      await prisma.attendance.upsert({
        where: { playerId_eventId: { playerId: player.id, eventId: event.id } },
        update: {},
        create: {
          playerId: player.id,
          eventId: event.id,
          status: randomElement(statuses),
          note: Math.random() > 0.7 ? 'Llegó tarde' : null
        }
      })
    }
  }
  console.log('✅ Created attendance records')

  // 8) Create injuries
  console.log('🏥 Creating injuries...')
  const injuryTypes = ['Ankle sprain', 'Knee injury', 'Shoulder strain', 'Hamstring pull', 'Wrist fracture', 'Concussion', 'Back strain']
  const severities: InjurySeverity[] = [InjurySeverity.MILD, InjurySeverity.MODERATE, InjurySeverity.SEVERE]
  const injuryStatuses: InjuryStatus[] = [InjuryStatus.ACTIVE, InjuryStatus.RECOVERING, InjuryStatus.RESOLVED]
  
  const injuredPlayers = players.filter(p => p.status === PlayerStatus.INJURED).slice(0, 10)
  for (const player of injuredPlayers) {
    const startDate = randomDate(
      new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    )
    const status = randomElement(injuryStatuses)
    const endDate = status === InjuryStatus.RESOLVED 
      ? randomDate(startDate, now)
      : null
    
    await prisma.injury.create({
      data: {
        playerId: player.id,
        type: randomElement(injuryTypes),
        severity: randomElement(severities),
        status,
        startDate,
        endDate,
        description: `Lesión de ${randomElement(injuryTypes).toLowerCase()}`
      }
    })
  }
  console.log(`✅ Created injuries for ${injuredPlayers.length} players`)

  // 9) Create channels and messages
  console.log('💬 Creating channels and messages...')
  const channels = []
  // Create general channel
  const generalChannel = await prisma.channel.create({
    data: { name: 'General' }
  })
  channels.push(generalChannel)
  
  // Create channels for some events
  for (const event of events.slice(0, 5)) {
    const channel = await prisma.channel.create({
      data: {
        name: `Evento: ${event.title}`,
        eventId: event.id
      }
    })
    channels.push(channel)
  }
  
  // Create messages in channels
  const messageContents = [
    '¡Hola equipo!',
    'Recordatorio: entrenamiento mañana a las 6pm',
    'Excelente trabajo en el último partido',
    '¿Alguien puede traer los discos?',
    'Reunión después del entrenamiento',
    'Buen trabajo hoy',
    'Nos vemos en el próximo torneo',
    'Gracias por venir',
  ]
  
  for (const channel of channels) {
    const numMessages = Math.floor(Math.random() * 20) + 5 // 5-25 messages
    const selectedPlayers = players.slice(0, Math.min(numMessages, players.length))
    
    for (let i = 0; i < numMessages && i < selectedPlayers.length; i++) {
      const createdAt = randomDate(
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        now
      )
      
      await prisma.message.create({
        data: {
          channelId: channel.id,
          authorId: selectedPlayers[i].id,
          content: randomElement(messageContents),
          createdAt
        }
      })
    }
  }
  console.log(`✅ Created ${channels.length} channels with messages`)

  // 10) Create plays
  console.log('🎯 Creating plays...')
  const playCategories: PlayCategory[] = [PlayCategory.OFFENSE, PlayCategory.DEFENSE, PlayCategory.DRILL]
  const offensePlays = [
    'Vertical Stack Básico',
    'Horizontal Stack',
    'Side Stack',
    'Spread Offense',
    'Isolation Play',
  ]
  const defensePlays = [
    'Zona 3-3-1',
    'Zona 2-3-2',
    'Persona a Persona',
    'Force Backhand',
    'Force Forehand',
  ]
  const drillPlays = [
    'Drill de Lanzamientos',
    'Drill de Cortes',
    'Drill de Defensa',
    'Drill de Transiciones',
    'Drill de Condicionamiento',
  ]
  
  const allPlays = [
    ...offensePlays.map(name => ({ name, category: PlayCategory.OFFENSE })),
    ...defensePlays.map(name => ({ name, category: PlayCategory.DEFENSE })),
    ...drillPlays.map(name => ({ name, category: PlayCategory.DRILL })),
  ]
  
  for (const play of allPlays) {
    await prisma.play.create({
      data: {
        name: play.name,
        category: play.category,
        description: `Descripción de ${play.name}`,
        content: `# ${play.name}\n\nContenido detallado de la jugada.`
      }
    })
  }
  console.log(`✅ Created ${allPlays.length} plays`)

  // 11) Create rivals
  console.log('⚔️ Creating rivals...')
  const rivalNames = [
    'Boricuas Ultimate',
    'Isla Flyers',
    'Caribbean Storm',
    'Tropical Thunder',
    'Island Warriors',
    'Coastal Crushers',
    'Beach Ultimate',
    'Sunset Flyers',
  ]
  const strengths = ['Velocidad en cortes', 'Defensa física', 'Lanzamientos largos', 'Estrategia', 'Condicionamiento']
  const weaknesses = ['Zona débil', 'Pocas variantes ofensivas', 'Errores bajo presión', 'Falta de comunicación']
  
  for (const name of rivalNames) {
    await prisma.rival.create({
      data: {
        name,
        strengths: randomElement(strengths),
        weaknesses: randomElement(weaknesses),
        notes: `Notas sobre ${name}`,
        lastPlayedAt: randomDate(
          new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
          new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        )
      }
    })
  }
  console.log(`✅ Created ${rivalNames.length} rivals`)

  // 12) Create resources
  console.log('📚 Creating resources...')
  const resourceCategories = ['Manual', 'Video', 'Imagen', 'Documento', 'Enlace']
  const resourceTitles = [
    'Manual de Reglas',
    'Guía de Estrategia',
    'Video de Técnicas',
    'Plan de Entrenamiento',
    'Historial de Partidos',
  ]
  
  for (let i = 0; i < 15; i++) {
    await prisma.resource.create({
      data: {
        title: randomElement(resourceTitles) + ` ${i + 1}`,
        description: `Recurso ${i + 1}`,
        category: randomElement(resourceCategories),
        url: `https://example.com/resource-${i + 1}`,
      }
    })
  }
  console.log(`✅ Created 15 resources`)

  // 13) Finance defaults
  console.log('💰 Creating finance data...')
  const mainAccount = await prisma.account.upsert({ 
    where: { id: 1 }, 
    update: {}, 
    create: { name: 'Caja', type: AccountType.CASH } 
  })
  const bankAccount = await prisma.account.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Cuenta Bancaria', type: AccountType.BANK }
  })
  
  const incomeCategories = [
    { name: 'Cuotas', kind: TransactionType.INCOME },
    { name: 'Donaciones', kind: TransactionType.INCOME },
    { name: 'Patrocinios', kind: TransactionType.INCOME },
  ]
  const expenseCategories = [
    { name: 'Equipamiento', kind: TransactionType.EXPENSE },
    { name: 'Transporte', kind: TransactionType.EXPENSE },
    { name: 'Alimentación', kind: TransactionType.EXPENSE },
    { name: 'Instalaciones', kind: TransactionType.EXPENSE },
  ]
  
  const categories = []
  for (const cat of [...incomeCategories, ...expenseCategories]) {
    let category = await prisma.category.findFirst({ where: { name: cat.name } })
    if (!category) {
      category = await prisma.category.create({ data: cat })
    }
    categories.push(category)
  }
  
  // Create transactions
  for (let i = 0; i < 30; i++) {
    const isIncome = Math.random() > 0.4
    const category = isIncome 
      ? randomElement(categories.filter(c => c.kind === TransactionType.INCOME))
      : randomElement(categories.filter(c => c.kind === TransactionType.EXPENSE))
    const account = randomElement([mainAccount, bankAccount])
    const amountCents = isIncome
      ? Math.floor(Math.random() * 10000) + 1000 // $10-$100
      : Math.floor(Math.random() * 5000) + 500 // $5-$50
    
    await prisma.transaction.create({
      data: {
        accountId: account.id,
        categoryId: category.id,
        type: isIncome ? TransactionType.INCOME : TransactionType.EXPENSE,
        amountCents,
        occurredAt: randomDate(
          new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          now
        ),
        description: `${isIncome ? 'Ingreso' : 'Gasto'} ${i + 1}`
      }
    })
  }
  console.log('✅ Created finance data')

  // 14) Create role requests
  console.log('📝 Creating role requests...')
  const pendingUsers = await prisma.user.findMany({ where: { status: 'PENDING' } })
  for (const user of pendingUsers) {
    await db.roleRequest.upsert({
      where: { id: user.id },
      update: {},
      create: {
        userId: user.id,
        role: 'player',
        note: 'Solicitud de rol de jugador'
      }
    })
  }
  
  // Create a sample pending role request for the guest
  const existingReq = await db.roleRequest.findFirst({ where: { userId: guestUser.id, status: 'PENDING' } })
  if (!existingReq) {
    await db.roleRequest.create({ 
      data: { 
        userId: guestUser.id, 
        role: 'player', 
        note: 'Quiero participar como jugador' 
      } 
    })
  }
  console.log('✅ Created role requests')

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- ${adminUsers.length} admin users`)
  console.log(`- ${players.length} players`)
  console.log(`- ${events.length} events`)
  console.log(`- ${channels.length} channels`)
  console.log(`- ${allPlays.length} plays`)
  console.log(`- ${rivalNames.length} rivals`)
  console.log(`- 15 resources`)
  console.log(`- 30 transactions`)
  console.log('\n🔑 Login credentials:')
  console.log('- Admin:  admin@example.com / admin123')
  console.log('- Admin:  admin1@example.com / admin123')
  console.log('- Admin:  admin2@example.com / admin123')
  console.log('- Guest:  guest@example.com / admin123')
  console.log('- Player: player@example.com / admin123')
  console.log('- Player: player1@example.com / admin123')
  console.log('- Player: player2@example.com / admin123')
  console.log('- Player: player3@example.com / admin123')
  console.log('- Player: player4@example.com / admin123')
  console.log('\n⏳ Pending users (need admin approval):')
  for (const email of pendingEmails) {
    console.log(`- ${email} / admin123`)
  }
}

main().catch(e => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
