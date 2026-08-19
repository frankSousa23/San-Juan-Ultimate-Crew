import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const db: any = prisma

async function main() {
  console.log('🌱 Starting CLEAN seed (minimal data)...')

  // 1) Crear permisos base
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
    await db.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  // 2) Crear roles base
  const adminRole = await db.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  })

  const playerRole = await db.role.upsert({
    where: { name: 'player' },
    update: {},
    create: { name: 'player' },
  })

  const guestRole = await db.role.upsert({
    where: { name: 'guest' },
    update: {},
    create: { name: 'guest' },
  })

  const captainRole = await db.role.upsert({
    where: { name: 'captain' },
    update: {},
    create: { name: 'captain' },
  })

  const coachRole = await db.role.upsert({
    where: { name: 'coach' },
    update: {},
    create: { name: 'coach' },
  })

  const treasurerRole = await db.role.upsert({
    where: { name: 'treasurer' },
    update: {},
    create: { name: 'treasurer' },
  })

  const allPerms = await db.permission.findMany()

  // Admin con todos los permisos
  for (const p of allPerms) {
    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: p.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: p.id,
      },
    })
  }

  // Player: base role para todos los usuarios del equipo
  const playerPermNames = [
    'communications:manage',
    'roster:view',
    'injuries:view',
    'rivals:view',
    'plays:view',
    'resources:view',
    'events:view',
    'statistics:view',
  ]
  const playerPerms = allPerms.filter((p: any) => playerPermNames.includes(p.name))
  for (const p of playerPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: playerRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: playerRole.id, permissionId: p.id },
    })
  }

  // Captain: liderazgo deportivo, casi todo lo deportivo
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
    'events:view',
    'statistics:view',
    'finance:view',
  ]
  const captainPerms = allPerms.filter((p: any) => captainPermNames.includes(p.name))
  for (const p of captainPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: captainRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: captainRole.id, permissionId: p.id },
    })
  }

  // Coach: por debajo de captain, foco en jugadas, entrenos, recursos y lesiones
  const coachPermNames = [
    'events:manage',
    'communications:manage',
    'injuries:manage',
    'plays:manage',
    'resources:manage',
    'roster:view',
    'injuries:view',
    'plays:view',
    'resources:view',
    'events:view',
    'statistics:view',
  ]
  const coachPerms = allPerms.filter((p: any) => coachPermNames.includes(p.name))
  for (const p of coachPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: coachRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: coachRole.id, permissionId: p.id },
    })
  }

  // Treasurer: jugador con responsabilidad financiera
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
      create: { roleId: treasurerRole.id, permissionId: p.id },
    })
  }

  // Guest: refuerzo muy limitado (read-only deportivo)
  const guestPermNames = [
    'events:view',
    'roster:view',
    'injuries:view',
    'rivals:view',
    'plays:view',
    'resources:view',
    'statistics:view',
  ]
  const guestPerms = allPerms.filter((p: any) => guestPermNames.includes(p.name))
  for (const p of guestPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: guestRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: guestRole.id, permissionId: p.id },
    })
  }

  // 3) Crear usuarios de ejemplo para cada rol
  const defaultPassword = 'password123'
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  // Crear jugadores primero para vincularlos a los usuarios
  const players = []
  for (let i = 1; i <= 6; i++) {
    const player = await db.player.upsert({
      where: { number: i },
      update: {},
      create: {
        name: `Jugador ${i}`,
        number: i,
        position: i % 3 === 0 ? 'HANDLER' : i % 3 === 1 ? 'CUTTER' : 'HYBRID',
        status: 'ACTIVE',
        heightCm: 170 + (i * 2),
        experience: `Experiencia del jugador ${i}`,
      },
    })
    players.push(player)
  }

  // 1. ADMIN: admin + player
  const adminUser = await db.user.upsert({
    where: { email: 'admin@sju.com' },
    update: {
      passwordHash,
      status: 'APPROVED',
      name: 'Administrador',
      playerId: players[0].id,
    },
    create: {
      email: 'admin@sju.com',
      name: 'Administrador',
      passwordHash,
      status: 'APPROVED',
      playerId: players[0].id,
    },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: playerRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: playerRole.id },
  })

  // 2. CAPTAIN: captain + player
  const captainUser = await db.user.upsert({
    where: { email: 'captain@example.com' },
    update: {
      passwordHash,
      status: 'APPROVED',
      name: 'Capitán',
      playerId: players[1].id,
    },
    create: {
      email: 'captain@example.com',
      name: 'Capitán',
      passwordHash,
      status: 'APPROVED',
      playerId: players[1].id,
    },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: captainUser.id, roleId: captainRole.id } },
    update: {},
    create: { userId: captainUser.id, roleId: captainRole.id },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: captainUser.id, roleId: playerRole.id } },
    update: {},
    create: { userId: captainUser.id, roleId: playerRole.id },
  })

  // 3. COACH: coach + player
  const coachUser = await db.user.upsert({
    where: { email: 'coach@example.com' },
    update: {
      passwordHash,
      status: 'APPROVED',
      name: 'Entrenador',
      playerId: players[2].id,
    },
    create: {
      email: 'coach@example.com',
      name: 'Entrenador',
      passwordHash,
      status: 'APPROVED',
      playerId: players[2].id,
    },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: coachUser.id, roleId: coachRole.id } },
    update: {},
    create: { userId: coachUser.id, roleId: coachRole.id },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: coachUser.id, roleId: playerRole.id } },
    update: {},
    create: { userId: coachUser.id, roleId: playerRole.id },
  })

  // 4. TREASURER: treasurer + player
  const treasurerUser = await db.user.upsert({
    where: { email: 'treasurer@example.com' },
    update: {
      passwordHash,
      status: 'APPROVED',
      name: 'Tesorero',
      playerId: players[3].id,
    },
    create: {
      email: 'treasurer@example.com',
      name: 'Tesorero',
      passwordHash,
      status: 'APPROVED',
      playerId: players[3].id,
    },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: treasurerUser.id, roleId: treasurerRole.id } },
    update: {},
    create: { userId: treasurerUser.id, roleId: treasurerRole.id },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: treasurerUser.id, roleId: playerRole.id } },
    update: {},
    create: { userId: treasurerUser.id, roleId: playerRole.id },
  })

  // 5. PLAYER: solo player
  const playerUser = await db.user.upsert({
    where: { email: 'player@example.com' },
    update: {
      passwordHash,
      status: 'APPROVED',
      name: 'Jugador',
      playerId: players[4].id,
    },
    create: {
      email: 'player@example.com',
      name: 'Jugador',
      passwordHash,
      status: 'APPROVED',
      playerId: players[4].id,
    },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: playerUser.id, roleId: playerRole.id } },
    update: {},
    create: { userId: playerUser.id, roleId: playerRole.id },
  })

  // 6. GUEST: solo guest (refuerzo, sin playerId o con playerId limitado)
  const guestUser = await db.user.upsert({
    where: { email: 'guest@example.com' },
    update: {
      passwordHash,
      status: 'APPROVED',
      name: 'Refuerzo',
      playerId: players[5].id, // Tiene playerId pero es refuerzo
    },
    create: {
      email: 'guest@example.com',
      name: 'Refuerzo',
      passwordHash,
      status: 'APPROVED',
      playerId: players[5].id,
    },
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: guestUser.id, roleId: guestRole.id } },
    update: {},
    create: { userId: guestUser.id, roleId: guestRole.id },
  })

  console.log('\n✅ CLEAN seed completed:')
  console.log('- 6 usuarios de ejemplo creados (uno por cada rol)')
  console.log('- 6 jugadores creados y vinculados')
  console.log('- Base permissions and roles created')
  console.log('\n🔑 Credenciales de acceso (todos con password: password123):')
  console.log('   1. Admin:      admin@sju.com      (admin + player)')
  console.log('   2. Captain:    captain@example.com     (captain + player)')
  console.log('   3. Coach:      coach@example.com       (coach + player)')
  console.log('   4. Treasurer:  treasurer@example.com   (treasurer + player)')
  console.log('   5. Player:     player@example.com      (solo player)')
  console.log('   6. Guest:      guest@example.com       (solo guest)')
  console.log('\n💡 Todos los usuarios están aprobados y listos para usar.')
}

main()
  .catch((e) => {
    console.error('❌ CLEAN seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


