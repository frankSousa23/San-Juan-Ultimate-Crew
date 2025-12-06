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
  // Permisos de gestión (manage)
  const managePerms = [
    'finance:manage',
    'resources:manage',
    'roster:manage',
    'events:manage',
    'communications:manage',
    'injuries:manage',
    'rivals:manage',
    'plays:manage',
  ]
  // Permisos de visualización (view)
  const viewPerms = [
    'roster:view',
    'events:view',
    'injuries:view',
    'rivals:view',
    'plays:view',
    'resources:view',
    'finance:view',
    'statistics:view',
  ]
  const allPermNames = [...managePerms, ...viewPerms]
  for (const name of allPermNames) {
    await db.permission.upsert({ where: { name }, update: {}, create: { name } })
  }
  
  // Crear roles
  const adminRole = await db.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } })
  const guestRole = await db.role.upsert({ where: { name: 'guest' }, update: {}, create: { name: 'guest' } })
  const playerRole = await db.role.upsert({ where: { name: 'player' }, update: {}, create: { name: 'player' } })
  const captainRole = await db.role.upsert({ where: { name: 'captain' }, update: {}, create: { name: 'captain' } })
  const coachRole = await db.role.upsert({ where: { name: 'coach' }, update: {}, create: { name: 'coach' } })
  const treasurerRole = await db.role.upsert({ where: { name: 'treasurer' }, update: {}, create: { name: 'treasurer' } })
  
  const allPerms = await db.permission.findMany()
  
  // Admin gets all permissions
  for (const p of allPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id }
    })
  }
  
  // Player: communications and events management, view permissions for most resources
  const playerPermNames = [
    'communications:manage',
    'events:manage',
    'roster:view',
    'injuries:view',
    'rivals:view',
    'plays:view',
    'resources:view',
    'statistics:view',
  ]
  const playerPerms = allPerms.filter((p: any) => playerPermNames.includes(p.name))
  for (const p of playerPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: playerRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: playerRole.id, permissionId: p.id }
    })
  }
  
  // Captain: manage roster (for tournaments), events, injuries, rivals, plays; view statistics
  const captainPermNames = [
    'roster:manage',
    'events:manage',
    'communications:manage',
    'injuries:manage',
    'rivals:manage',
    'plays:manage',
    'roster:view',
    'injuries:view',
    'rivals:view',
    'plays:view',
    'resources:view',
    'statistics:view',
  ]
  const captainPerms = allPerms.filter((p: any) => captainPermNames.includes(p.name))
  for (const p of captainPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: captainRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: captainRole.id, permissionId: p.id }
    })
  }
  
  // Coach: manage events, injuries, plays, resources; view roster, statistics
  const coachPermNames = [
    'events:manage',
    'communications:manage',
    'injuries:manage',
    'plays:manage',
    'resources:manage',
    'roster:view',
    'roster:manage', // Can manage tournament rosters
    'injuries:view',
    'plays:view',
    'resources:view',
    'statistics:view',
  ]
  const coachPerms = allPerms.filter((p: any) => coachPermNames.includes(p.name))
  for (const p of coachPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: coachRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: coachRole.id, permissionId: p.id }
    })
  }
  
  // Treasurer: manage finances; view roster, events, statistics
  const treasurerPermNames = [
    'finance:manage',
    'finance:view',
    'roster:view',
    'events:view',
    'statistics:view',
  ]
  const treasurerPerms = allPerms.filter((p: any) => treasurerPermNames.includes(p.name))
  for (const p of treasurerPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: treasurerRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: treasurerRole.id, permissionId: p.id }
    })
  }
  
  // Guest has limited permissions (only statistics and public events view - for demo/showcase purposes)
  const guestPermNames = [
    'statistics:view',
    'events:view', // Can view public events info
  ]
  const guestPerms = allPerms.filter((p: any) => guestPermNames.includes(p.name))
  for (const p of guestPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: guestRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: guestRole.id, permissionId: p.id }
    })
  }
  const passwordHash = await bcrypt.hash('admin123', 10)
  
  // Create multiple admin users (all admins are also players) - 7 admins for testing
  const adminEmails = [
    'admin@example.com',
    'admin1@example.com',
    'admin2@example.com',
    'admin3@example.com',
    'admin4@example.com',
    'admin5@example.com',
    'admin6@example.com',
  ]
  const adminUsers = []
  for (const email of adminEmails) {
    const adminUser = await db.user.upsert({
      where: { email },
      update: { passwordHash, status: 'APPROVED' },
      create: { email, name: `Admin ${email.split('@')[0]}`, passwordHash, status: 'APPROVED' }
    })
    // Admin has admin role
    await db.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id }
    })
    // Admin also has player role
    await db.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: playerRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: playerRole.id }
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

  // 3) Create player users (20 players with user accounts for testing)
  console.log('👤 Creating player users...')
  const playerUserEmails = [
    'player@example.com',
    'player1@example.com',
    'player2@example.com',
    'player3@example.com',
    'player4@example.com',
    'player5@example.com',
    'player6@example.com',
    'player7@example.com',
    'player8@example.com',
    'player9@example.com',
    'player10@example.com',
    'player11@example.com',
    'player12@example.com',
    'player13@example.com',
    'player14@example.com',
    'player15@example.com',
    'player16@example.com',
    'player17@example.com',
    'player18@example.com',
    'player19@example.com',
  ]
  
  // Get players that don't have users yet
  const playersWithoutUsers = []
  for (const player of players) {
    const existingUser = await db.user.findFirst({ where: { playerId: player.id } })
    if (!existingUser) {
      playersWithoutUsers.push(player)
    }
  }
  
  const playerUsers = []
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
    playerUsers.push(playerUser)
  }

  // Create multiple users for new roles (captain, coach, treasurer) - 3 of each for testing
  console.log('👑 Creating captain, coach, and treasurer users...')
  
  // Find players that don't have users yet
  const playersWithUsers = await db.user.findMany({
    where: { playerId: { not: null } },
    select: { playerId: true }
  })
  const playerIdsWithUsers = new Set(playersWithUsers.map((u: any) => u.playerId).filter(Boolean))
  const availablePlayers = players.filter((p: any) => !playerIdsWithUsers.has(p.id))
  
  // Create 3 captain users (linked to players)
  const captainEmails = ['captain@example.com', 'captain1@example.com', 'captain2@example.com']
  const captainUsers = []
  for (let i = 0; i < captainEmails.length && i < availablePlayers.length; i++) {
    const email = captainEmails[i]
    const player = availablePlayers[i]
    const captainUser = await db.user.upsert({
      where: { email },
      update: { passwordHash, playerId: player.id, status: 'APPROVED' },
      create: { email, name: `Capitán ${i + 1}`, passwordHash, playerId: player.id, status: 'APPROVED' }
    })
    // Captain has captain role
    await db.userRole.upsert({
      where: { userId_roleId: { userId: captainUser.id, roleId: captainRole.id } },
      update: {},
      create: { userId: captainUser.id, roleId: captainRole.id }
    })
    // Captain also has player role
    await db.userRole.upsert({
      where: { userId_roleId: { userId: captainUser.id, roleId: playerRole.id } },
      update: {},
      create: { userId: captainUser.id, roleId: playerRole.id }
    })
    captainUsers.push(captainUser)
  }
  
  // Create 3 coach users (not linked to players, but have player role)
  const coachEmails = ['coach@example.com', 'coach1@example.com', 'coach2@example.com']
  const coachUsers = []
  for (let i = 0; i < coachEmails.length; i++) {
    const email = coachEmails[i]
    const coachUser = await db.user.upsert({
      where: { email },
      update: { passwordHash, status: 'APPROVED' },
      create: { email, name: `Entrenador ${i + 1}`, passwordHash, status: 'APPROVED' }
    })
    // Coach has coach role
    await db.userRole.upsert({
      where: { userId_roleId: { userId: coachUser.id, roleId: coachRole.id } },
      update: {},
      create: { userId: coachUser.id, roleId: coachRole.id }
    })
    // Coach also has player role
    await db.userRole.upsert({
      where: { userId_roleId: { userId: coachUser.id, roleId: playerRole.id } },
      update: {},
      create: { userId: coachUser.id, roleId: playerRole.id }
    })
    coachUsers.push(coachUser)
  }
  
  // Create 3 treasurer users (not linked to players, but have player role)
  const treasurerEmails = ['treasurer@example.com', 'treasurer1@example.com', 'treasurer2@example.com']
  const treasurerUsers = []
  for (let i = 0; i < treasurerEmails.length; i++) {
    const email = treasurerEmails[i]
    const treasurerUser = await db.user.upsert({
      where: { email },
      update: { passwordHash, status: 'APPROVED' },
      create: { email, name: `Tesorero ${i + 1}`, passwordHash, status: 'APPROVED' }
    })
    // Treasurer has treasurer role
    await db.userRole.upsert({
      where: { userId_roleId: { userId: treasurerUser.id, roleId: treasurerRole.id } },
      update: {},
      create: { userId: treasurerUser.id, roleId: treasurerRole.id }
    })
    // Treasurer also has player role
    await db.userRole.upsert({
      where: { userId_roleId: { userId: treasurerUser.id, roleId: playerRole.id } },
      update: {},
      create: { userId: treasurerUser.id, roleId: playerRole.id }
    })
    treasurerUsers.push(treasurerUser)
  }
  
  // Create 3 guest users for testing
  const guestEmails = ['guest@example.com', 'guest1@example.com', 'guest2@example.com']
  const guestUsers = []
  for (let i = 0; i < guestEmails.length; i++) {
    const email = guestEmails[i]
    const guestUser = await db.user.upsert({
      where: { email },
      update: { passwordHash, status: 'APPROVED' },
      create: { email, name: `Invitado ${i + 1}`, passwordHash, status: 'APPROVED' }
    })
    await db.userRole.upsert({
      where: { userId_roleId: { userId: guestUser.id, roleId: guestRole.id } },
      update: {},
      create: { userId: guestUser.id, roleId: guestRole.id }
    })
    guestUsers.push(guestUser)
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
  const eventTypes: EventType[] = [
    EventType.TRAINING, 
    EventType.TOURNAMENT, 
    EventType.SOCIAL, 
    EventType.WORKSHOP,
    EventType.FULL_DAY_OPEN,
    EventType.FULL_DAY_MIXTO,
    EventType.AMISTOSO
  ]
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
      [EventType.FULL_DAY_OPEN]: ['Full Day Abierto - Verano', 'Full Day Abierto - Primavera', 'Full Day Abierto - Regional'],
      [EventType.FULL_DAY_MIXTO]: ['Full Day Mixto - Verano', 'Full Day Mixto - Primavera', 'Full Day Mixto - Regional'],
      [EventType.AMISTOSO]: ['Partido Amistoso Local', 'Amistoso Interregional', 'Amistoso de Preparación'],
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

  // 6) Create event participants - prioritize players with user accounts
  console.log('👥 Creating event participants...')
  // Get players that have user accounts (for better testing)
  const playersWithUsersForEvents = await db.user.findMany({
    where: { playerId: { not: null } },
    select: { playerId: true }
  })
  const playerIdsWithUsersForEvents = new Set(playersWithUsersForEvents.map((u: any) => u.playerId).filter(Boolean))
  const playersWithAccounts = players.filter((p: any) => playerIdsWithUsersForEvents.has(p.id))
  const playersWithoutAccounts = players.filter((p: any) => !playerIdsWithUsersForEvents.has(p.id))
  
  for (const event of events.slice(0, 18)) { // Add participants to first 18 events
    const numParticipants = Math.floor(Math.random() * 20) + 10 // 10-30 participants
    // Prioritize players with accounts, then add others
    const selectedPlayers = [
      ...playersWithAccounts.slice(0, Math.min(numParticipants, playersWithAccounts.length)),
      ...playersWithoutAccounts.slice(0, Math.max(0, numParticipants - playersWithAccounts.length))
    ]
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
  console.log('✅ Created event participants (prioritizing users with accounts)')

  // 7) Create attendance records - prioritize players with user accounts
  console.log('📋 Creating attendance records...')
  for (const event of events.slice(0, 15)) { // Add attendance to first 15 events
    const numAttendees = Math.floor(Math.random() * 25) + 15 // 15-40 attendees
    // Prioritize players with accounts for attendance
    const selectedPlayers = [
      ...playersWithAccounts.slice(0, Math.min(numAttendees, playersWithAccounts.length)),
      ...playersWithoutAccounts.slice(0, Math.max(0, numAttendees - playersWithAccounts.length))
    ]
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
  console.log('✅ Created attendance records (prioritizing users with accounts)')

  // 7.5) Create specific events created by specific users (captains, coaches, players)
  console.log('📅 Creating user-specific events...')
  const usersWhoCanCreateEvents = [
    ...playerUsers.slice(0, 5), // First 5 players
    ...captainUsers,
    ...coachUsers,
  ]
  
  // Create 10 additional events created by specific users
  for (let i = 0; i < 10 && i < usersWhoCanCreateEvents.length; i++) {
    const creator = usersWhoCanCreateEvents[i]
    const creatorPlayer = creator.playerId ? await prisma.player.findUnique({ where: { id: creator.playerId } }) : null
    
    if (creatorPlayer) {
      const eventType = randomElement(eventTypes)
      const startsAt = randomDate(
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days ahead
      )
      
      const titles = {
        [EventType.TRAINING]: ['Entrenamiento Regular', 'Práctica Técnica', 'Entrenamiento Físico'],
        [EventType.TOURNAMENT]: ['Torneo Regional', 'Copa Nacional', 'Campeonato Local'],
        [EventType.SOCIAL]: ['Reunión de Equipo', 'Asado del Equipo', 'Celebración'],
        [EventType.WORKSHOP]: ['Taller de Estrategia', 'Workshop de Lanzamientos', 'Seminario de Defensa'],
        [EventType.FULL_DAY_OPEN]: ['Full Day Abierto - Verano', 'Full Day Abierto - Primavera'],
        [EventType.FULL_DAY_MIXTO]: ['Full Day Mixto - Verano', 'Full Day Mixto - Primavera'],
        [EventType.AMISTOSO]: ['Partido Amistoso Local', 'Amistoso Interregional'],
      }
      
      const event = await prisma.event.create({
        data: {
          title: `${randomElement(titles[eventType])} - Creado por ${creator.name}`,
          description: `Evento creado por ${creator.name} (${creator.email})`,
          type: eventType,
          status: startsAt > now ? EventStatus.UPCOMING : EventStatus.COMPLETED,
          location: randomElement(locations),
          startsAt,
          endsAt: startsAt > now ? null : new Date(startsAt.getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000),
        }
      })
      events.push(event)
      
      // Add creator as participant
      await prisma.eventParticipant.create({
        data: {
          eventId: event.id,
          playerId: creatorPlayer.id,
          role: captainUsers.includes(creator) ? 'captain' : 'player',
          status: 'confirmed'
        }
      })
    }
  }
  console.log('✅ Created user-specific events')

  // 8) Create injuries - prioritize players with user accounts
  console.log('🏥 Creating injuries...')
  const injuryTypes = ['Ankle sprain', 'Knee injury', 'Shoulder strain', 'Hamstring pull', 'Wrist fracture', 'Concussion', 'Back strain']
  const severities: InjurySeverity[] = [InjurySeverity.MILD, InjurySeverity.MODERATE, InjurySeverity.SEVERE]
  const injuryStatuses: InjuryStatus[] = [InjuryStatus.ACTIVE, InjuryStatus.RECOVERING, InjuryStatus.RESOLVED]
  
  // Get injured players, prioritizing those with user accounts
  const injuredPlayersWithAccounts = playersWithAccounts.filter(p => p.status === PlayerStatus.INJURED)
  const injuredPlayersWithoutAccounts = playersWithoutAccounts.filter(p => p.status === PlayerStatus.INJURED)
  const injuredPlayers = [
    ...injuredPlayersWithAccounts.slice(0, 8),
    ...injuredPlayersWithoutAccounts.slice(0, 7)
  ].slice(0, 15)
  
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
  console.log(`✅ Created injuries for ${injuredPlayers.length} players (prioritizing users with accounts)`)

  // 8.5) Create specific injuries created by captains/coaches for specific players
  console.log('🏥 Creating user-managed injuries...')
  const usersWhoCanManageInjuries = [...captainUsers, ...coachUsers]
  const playersForInjuries = playersWithAccounts.slice(0, 10) // First 10 players with accounts
  
  for (let i = 0; i < 8 && i < playersForInjuries.length; i++) {
    const player = playersForInjuries[i]
    const manager = randomElement(usersWhoCanManageInjuries)
    
    const startDate = randomDate(
      new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    )
    
    await prisma.injury.create({
      data: {
        playerId: player.id,
        type: randomElement(injuryTypes),
        severity: randomElement(severities),
        status: randomElement([InjuryStatus.ACTIVE, InjuryStatus.RECOVERING]),
        startDate,
        endDate: null,
        description: `Lesión registrada por ${manager.name} (${manager.email})`
      }
    })
  }
  console.log('✅ Created user-managed injuries')

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
  
  // Create messages in channels - interconect users (players, captains, coaches, admins)
  const messageContents = [
    '¡Hola equipo!',
    'Recordatorio: entrenamiento mañana a las 6pm',
    'Excelente trabajo en el último partido',
    '¿Alguien puede traer los discos?',
    'Reunión después del entrenamiento',
    'Buen trabajo hoy',
    'Nos vemos en el próximo torneo',
    'Gracias por venir',
    'Recordatorio importante para todos',
    'Revisen el calendario de eventos',
    'Gran esfuerzo en el entrenamiento',
    'Próximo torneo: confirmen asistencia',
    'Material de entrenamiento disponible',
    'Reunión de estrategia esta semana',
  ]
  
  // Get players linked to users for messages (prioritize players with accounts)
  const playersForMessages = playersWithAccounts.length > 0 
    ? playersWithAccounts 
    : players.slice(0, 30) // Fallback if no players with accounts
  
  for (const channel of channels) {
    const numMessages = Math.floor(Math.random() * 30) + 10 // 10-40 messages
    const shuffledPlayers = [...playersForMessages].sort(() => Math.random() - 0.5)
    
    for (let i = 0; i < numMessages && i < shuffledPlayers.length; i++) {
      const createdAt = randomDate(
        new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        now
      )
      
      await prisma.message.create({
        data: {
          channelId: channel.id,
          authorId: shuffledPlayers[i].id,
          content: randomElement(messageContents),
          createdAt
        }
      })
    }
  }
  console.log(`✅ Created ${channels.length} channels with messages from users`)

  // 9.5) Create specific channels created by specific users
  console.log('💬 Creating user-created channels...')
  const usersWhoCanCreateChannels = [
    ...playerUsers.slice(0, 3),
    ...captainUsers,
    ...coachUsers.slice(0, 2),
  ]
  
  // Get all users that can send messages
  const usersWhoCanMessage = [
    ...playerUsers,
    ...captainUsers,
    ...coachUsers,
    ...adminUsers,
  ]
  
  // Create 5 additional channels by specific users
  for (let i = 0; i < 5 && i < usersWhoCanCreateChannels.length; i++) {
    const creator = usersWhoCanCreateChannels[i]
    const creatorPlayer = creator.playerId ? await prisma.player.findUnique({ where: { id: creator.playerId } }) : null
    
    if (creatorPlayer) {
      const channel = await prisma.channel.create({
        data: {
          name: `Canal de ${creator.name}`,
        }
      })
      channels.push(channel)
      
      // Creator sends first message
      await prisma.message.create({
        data: {
          channelId: channel.id,
          authorId: creatorPlayer.id,
          content: `Canal creado por ${creator.name}. ¡Bienvenidos!`,
          createdAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000) // Different dates
        }
      })
      
      // Add more messages from other users
      const otherUsers = usersWhoCanMessage.filter((u: any) => u.id !== creator.id).slice(0, 5)
      for (const otherUser of otherUsers) {
        const otherPlayer = otherUser.playerId ? await prisma.player.findUnique({ where: { id: otherUser.playerId } }) : null
        if (otherPlayer) {
          await prisma.message.create({
            data: {
              channelId: channel.id,
              authorId: otherPlayer.id,
              content: randomElement(messageContents),
              createdAt: randomDate(
                new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000),
                now
              )
            }
          })
        }
      }
    }
  }
  console.log('✅ Created user-created channels with messages')

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

  // 10.5) Create specific plays created by captains/coaches
  console.log('🎯 Creating user-created plays...')
  const usersWhoCanCreatePlays = [...captainUsers, ...coachUsers]
  
  const customPlays = [
    { name: 'Estrategia Ofensiva Personalizada', category: PlayCategory.OFFENSE, creator: captainUsers[0] },
    { name: 'Defensa Adaptativa', category: PlayCategory.DEFENSE, creator: coachUsers[0] },
    { name: 'Drill de Coordinación', category: PlayCategory.DRILL, creator: captainUsers[1] },
    { name: 'Ataque Rápido', category: PlayCategory.OFFENSE, creator: coachUsers[1] },
    { name: 'Zona de Presión', category: PlayCategory.DEFENSE, creator: captainUsers[0] },
  ]
  
  for (const playData of customPlays) {
    if (playData.creator) {
      await prisma.play.create({
        data: {
          name: playData.name,
          category: playData.category,
          description: `Jugada creada por ${playData.creator.name} (${playData.creator.email})`,
          content: `# ${playData.name}\n\nJugada diseñada por ${playData.creator.name}.\n\nContenido detallado de la estrategia.`
        }
      })
    }
  }
  console.log('✅ Created user-created plays')

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

  // 11.5) Create specific rivals created by captains
  console.log('⚔️ Creating user-created rivals...')
  const usersWhoCanCreateRivals = captainUsers
  
  const customRivals = [
    { name: 'Equipo Elite', strengths: 'Velocidad y precisión', weaknesses: 'Poca resistencia', creator: captainUsers[0] },
    { name: 'Storm Riders', strengths: 'Estrategia táctica', weaknesses: 'Falta de agresividad', creator: captainUsers[1] },
  ]
  
  for (const rivalData of customRivals) {
    if (rivalData.creator) {
      await prisma.rival.create({
        data: {
          name: rivalData.name,
          strengths: rivalData.strengths,
          weaknesses: rivalData.weaknesses,
          notes: `Información recopilada por ${rivalData.creator.name} (${rivalData.creator.email})`,
          lastPlayedAt: randomDate(
            new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
            new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
          )
        }
      })
    }
  }
  console.log('✅ Created user-created rivals')

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

  // 12.5) Create specific resources uploaded by coaches
  console.log('📚 Creating user-uploaded resources...')
  const usersWhoCanUploadResources = coachUsers
  
  const customResources = [
    { title: 'Manual de Entrenamiento Avanzado', category: 'Manual', creator: coachUsers[0] },
    { title: 'Video de Técnicas de Lanzamiento', category: 'Video', creator: coachUsers[1] },
    { title: 'Plan de Acondicionamiento Físico', category: 'Documento', creator: coachUsers[0] },
    { title: 'Guía de Estrategias Defensivas', category: 'Manual', creator: coachUsers[2] },
  ]
  
  for (const resourceData of customResources) {
    if (resourceData.creator) {
      await prisma.resource.create({
        data: {
          title: resourceData.title,
          description: `Recurso subido por ${resourceData.creator.name} (${resourceData.creator.email})`,
          category: resourceData.category,
          url: `https://example.com/resources/${resourceData.title.toLowerCase().replace(/\s+/g, '-')}`,
        }
      })
    }
  }
  console.log('✅ Created user-uploaded resources')

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

  // 13.5) Create specific transactions created by treasurers
  console.log('💰 Creating user-created transactions...')
  const usersWhoCanCreateTransactions = treasurerUsers
  
  const customTransactions = [
    { type: TransactionType.INCOME, amountCents: 50000, description: 'Cuota mensual - Enero', creator: treasurerUsers[0] },
    { type: TransactionType.INCOME, amountCents: 30000, description: 'Donación de patrocinador', creator: treasurerUsers[1] },
    { type: TransactionType.EXPENSE, amountCents: 15000, description: 'Compra de equipamiento', creator: treasurerUsers[0] },
    { type: TransactionType.EXPENSE, amountCents: 8000, description: 'Transporte a torneo', creator: treasurerUsers[2] },
    { type: TransactionType.INCOME, amountCents: 25000, description: 'Cuota mensual - Febrero', creator: treasurerUsers[1] },
  ]
  
  for (const transData of customTransactions) {
    if (transData.creator && mainAccount && bankAccount) {
      const category = transData.type === TransactionType.INCOME 
        ? randomElement(categories.filter((c: any) => c.kind === TransactionType.INCOME))
        : randomElement(categories.filter((c: any) => c.kind === TransactionType.EXPENSE))
      const account = randomElement([mainAccount, bankAccount])
      
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          categoryId: category.id,
          type: transData.type,
          amountCents: transData.amountCents,
          description: `${transData.description} - Registrado por ${transData.creator.name}`,
          occurredAt: randomDate(
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            now
          )
        }
      })
    }
  }
  console.log('✅ Created user-created transactions')

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

  // 15) Create news posts with files
  console.log('📰 Creating news posts...')
  const newsCategories = ['Anuncios', 'Eventos', 'General', 'Torneos', 'Entrenamientos', 'Importante']
  const newsTitles = [
    'Bienvenida al Nuevo Año Deportivo',
    'Próximo Torneo Regional - Confirmar Asistencia',
    'Cambios en el Horario de Entrenamientos',
    'Resultados del Último Partido',
    'Reunión de Equipo - Próxima Semana',
    'Nuevo Material de Entrenamiento Disponible',
    'Recordatorio: Pago de Cuotas',
    'Celebración del Aniversario del Equipo',
    'Actualización de Reglas del Torneo',
    'Invitación a Torneo de Verano',
    'Taller de Estrategia - Próximo Mes',
    'Logros del Equipo este Mes',
    'Información sobre Próximo Amistoso',
    'Actualización de Uniformes',
    'Reunión de Padres y Jugadores',
  ]

  const newsContents = [
    `# Bienvenida al Nuevo Año Deportivo

¡Bienvenidos al nuevo año deportivo! Estamos emocionados de comenzar esta temporada con todos ustedes.

## Objetivos de la Temporada
- Mejorar nuestro ranking regional
- Participar en al menos 3 torneos importantes
- Fortalecer el trabajo en equipo

¡Vamos equipo! 💪`,
    `# Próximo Torneo Regional

Tenemos el honor de participar en el Torneo Regional que se llevará a cabo el próximo mes.

## Detalles Importantes
- **Fecha**: Por confirmar
- **Ubicación**: Estadio Central
- **Formato**: Round-robin seguido de playoffs

Por favor confirmen su asistencia antes del 15 de este mes.`,
    `# Cambios en el Horario de Entrenamientos

A partir de la próxima semana, los entrenamientos se realizarán:

- **Lunes y Miércoles**: 6:00 PM - 8:00 PM
- **Sábados**: 9:00 AM - 11:00 AM

Estos cambios son para optimizar nuestros horarios y mejorar la asistencia.`,
    `# Resultados del Último Partido

¡Excelente trabajo en el último partido! Logramos una victoria importante contra nuestro rival.

## Resumen del Partido
- **Resultado**: 15-12 a nuestro favor
- **MVP**: Por determinar
- **Próximo Partido**: Próxima semana

¡Sigan así! 🎉`,
    `# Reunión de Equipo - Próxima Semana

Invitamos a todos los miembros del equipo a la reunión general que se realizará:

**Fecha**: Próximo sábado
**Hora**: 2:00 PM
**Lugar**: Sede del equipo

Agenda:
- Revisión de objetivos
- Planificación de eventos
- Discusión de mejoras`,
  ]

  // Get users who can create posts (players, captains, coaches, admins with playerId)
  const usersWhoCanCreatePosts = [
    ...playerUsers.slice(0, 8),
    ...captainUsers,
    ...coachUsers,
    ...adminUsers.filter((u: any) => u.playerId),
  ]

  const newsPosts = []
  for (let i = 0; i < 15; i++) {
    const author = randomElement(usersWhoCanCreatePosts)
    const authorPlayer = author.playerId ? await prisma.player.findUnique({ where: { id: author.playerId } }) : null
    
    if (!authorPlayer) continue

    const isPinned = i < 3 // First 3 posts are pinned
    const isPublished = i < 12 // First 12 are published, last 3 are drafts
    const category = randomElement(newsCategories)
    const title = newsTitles[i] || `Noticia ${i + 1}`
    const content = newsContents[i % newsContents.length] || `Contenido de la noticia ${i + 1}`
    
    const createdAt = randomDate(
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      now
    )
    const publishedAt = isPublished ? createdAt : null

    const post = await prisma.newsPost.create({
      data: {
        title,
        content,
        authorId: authorPlayer.id,
        isPinned,
        isPublished,
        category,
        views: Math.floor(Math.random() * 500) + 10, // 10-510 views
        createdAt,
        publishedAt,
      }
    })
    newsPosts.push(post)
  }
  console.log(`✅ Created ${newsPosts.length} news posts`)

  // 15.5) Create files for some news posts
  console.log('📎 Creating news post files...')
  const fileTypes = [
    { name: 'Reglamento_Torneo.pdf', mimeType: 'application/pdf', size: 245760 },
    { name: 'Calendario_2024.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 153600 },
    { name: 'Foto_Equipo.jpg', mimeType: 'image/jpeg', size: 2048000 },
    { name: 'Video_Entrenamiento.mp4', mimeType: 'video/mp4', size: 15728640 },
    { name: 'Manual_Reglas.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 512000 },
    { name: 'Presentacion_Reunion.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 3072000 },
    { name: 'Lista_Asistencia.pdf', mimeType: 'application/pdf', size: 102400 },
    { name: 'Resultados_Partidos.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 81920 },
  ]

  // Add files to first 8 posts
  for (let i = 0; i < Math.min(8, newsPosts.length); i++) {
    const post = newsPosts[i]
    const numFiles = Math.floor(Math.random() * 3) + 1 // 1-3 files per post
    
    for (let j = 0; j < numFiles; j++) {
      const fileType = randomElement(fileTypes)
      const fileName = `${Date.now()}-${i}-${j}-${fileType.name.split('.')[0]}.${fileType.name.split('.').pop()}`
      const storagePath = `uploads/news/${fileName}`
      
      await prisma.newsPostFile.create({
        data: {
          postId: post.id,
          fileName,
          originalName: fileType.name,
          mimeType: fileType.mimeType,
          size: fileType.size,
          storagePath,
          description: j === 0 ? 'Documento principal' : `Archivo adjunto ${j + 1}`,
        }
      })
    }
  }
  console.log('✅ Created news post files')

  // 16) Create event annotations for some events
  console.log('📝 Creating event annotations...')
  const annotationTypes = ['GOAL', 'ASSIST', 'DEFENSE', 'TURNOVER', 'DROP', 'FOUL', 'TIMEOUT', 'SUBSTITUTION', 'GENERAL', 'STRATEGY', 'PERFORMANCE']
  
  // Get events that can have annotations (completed or ongoing)
  // Also include new event types
  const eventsForAnnotations = events.filter(e => 
    e.status === EventStatus.COMPLETED || 
    e.status === EventStatus.ONGOING
  )

  // Get players with accounts for annotations
  const playersForAnnotations = playersWithAccounts.slice(0, 25)

  for (let i = 0; i < Math.min(10, eventsForAnnotations.length); i++) {
    const event = eventsForAnnotations[i]
    const isFullDay = event.type === EventType.FULL_DAY_OPEN || event.type === EventType.FULL_DAY_MIXTO
    const numAnnotations = Math.floor(Math.random() * 15) + 5 // 5-20 annotations per event
    
    for (let j = 0; j < numAnnotations && j < playersForAnnotations.length; j++) {
      const player = playersForAnnotations[j]
      const annotationType = randomElement(annotationTypes)
      const timestamp = randomDate(
        event.startsAt,
        event.endsAt || new Date(event.startsAt.getTime() + 4 * 60 * 60 * 1000)
      )
      
      const notes = [
        `Anotación durante el evento ${event.title}`,
        `Momento importante del partido`,
        `Jugada destacada`,
        `Estrategia ejecutada correctamente`,
        `Punto clave del encuentro`,
      ]

      const category = isFullDay ? randomElement(['OPEN', 'MIXTO']) : null

      await prisma.eventAnnotation.create({
        data: {
          eventId: event.id,
          playerId: player.id,
          type: annotationType,
          note: randomElement(notes),
          timestamp,
          category,
        }
      })
    }
  }
  console.log('✅ Created event annotations')

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- ${adminUsers.length} admin users (all with player role)`)
  console.log(`- ${guestUsers.length} guest users`)
  console.log(`- ${playerUsers.length} player users`)
  console.log(`- ${captainUsers.length} captain users (all with player role)`)
  console.log(`- ${coachUsers.length} coach users (all with player role)`)
  console.log(`- ${treasurerUsers.length} treasurer users (all with player role)`)
  console.log(`- ${players.length} players in roster`)
  console.log(`- ${events.length} events`)
  console.log(`- ${channels.length} channels`)
  console.log(`- ${allPlays.length} plays`)
  console.log(`- ${rivalNames.length} rivals`)
  console.log(`- 15 resources`)
  console.log(`- 30 transactions`)
  console.log(`- ${newsPosts.length} news posts`)
  console.log(`- Event annotations created`)
  console.log('\n🔑 Login credentials (all passwords: admin123):')
  console.log('\n👑 Admins (7):')
  for (const admin of adminUsers) {
    console.log(`   - ${admin.email}`)
  }
  console.log('\n👤 Players (20):')
  for (let i = 0; i < Math.min(10, playerUsers.length); i++) {
    console.log(`   - ${playerUsers[i].email}`)
  }
  console.log(`   ... and ${playerUsers.length - 10} more (player10@example.com to player19@example.com)`)
  console.log('\n🎖️ Captains (3):')
  for (const captain of captainUsers) {
    console.log(`   - ${captain.email}`)
  }
  console.log('\n🏃 Coaches (3):')
  for (const coach of coachUsers) {
    console.log(`   - ${coach.email}`)
  }
  console.log('\n💰 Treasurers (3):')
  for (const treasurer of treasurerUsers) {
    console.log(`   - ${treasurer.email}`)
  }
  console.log('\n👁️ Guests (3):')
  for (const guest of guestUsers) {
    console.log(`   - ${guest.email}`)
  }
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
