import { PrismaClient, PlayerPosition, PlayerStatus, EventType, EventStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const db: any = prisma

async function main() {
  // 1) Auth: permissions, role admin, admin user
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
  for (const p of allPerms) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id }
    })
  }
  const email = 'admin@example.com'
  const passwordHash = await bcrypt.hash('admin123', 10)
  const adminUser = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Admin', passwordHash }
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id }
  })

  // Sample guest and player users
  const guestUser = await db.user.upsert({
    where: { email: 'guest@example.com' },
    update: {},
    create: { email: 'guest@example.com', name: 'Invitado', passwordHash }
  })
  await db.userRole.upsert({
    where: { userId_roleId: { userId: guestUser.id, roleId: guestRole.id } },
    update: {},
    create: { userId: guestUser.id, roleId: guestRole.id }
  })
  // Create a player-linked user for demonstration (links to player #7 if exists)
  const p7 = await db.player.findUnique({ where: { number: 7 } })
  if (p7) {
    const playerUser = await db.user.upsert({
      where: { email: 'player@example.com' },
      update: {},
      create: { email: 'player@example.com', name: p7.name, passwordHash, playerId: p7.id }
    })
    await db.userRole.upsert({
      where: { userId_roleId: { userId: playerUser.id, roleId: playerRole.id } },
      update: {},
      create: { userId: playerUser.id, roleId: playerRole.id }
    })
  }

  // 2) Players seed
  const players = [
    { name: 'Juan Martínez', number: 7, position: PlayerPosition.HANDLER, status: PlayerStatus.ACTIVE, experience: '3 años', heightCm: 178 },
    { name: 'María González', number: 12, position: PlayerPosition.CUTTER, status: PlayerStatus.ACTIVE, experience: '2 años', heightCm: 165 },
    { name: 'Carlos Rivera', number: 23, position: PlayerPosition.HYBRID, status: PlayerStatus.ACTIVE, experience: '4 años', heightCm: 182 },
    { name: 'Ana López', number: 5, position: PlayerPosition.HANDLER, status: PlayerStatus.ACTIVE, experience: '5 años', heightCm: 170 },
    { name: 'Diego Morales', number: 18, position: PlayerPosition.CUTTER, status: PlayerStatus.INJURED, experience: '1 año', heightCm: 175 },
    { name: 'Sofía Herrera', number: 9, position: PlayerPosition.HYBRID, status: PlayerStatus.ACTIVE, experience: '3 años', heightCm: 168 },
    { name: 'Roberto Silva', number: 14, position: PlayerPosition.HANDLER, status: PlayerStatus.ACTIVE, experience: '6 años', heightCm: 180 },
    { name: 'Lucia Vargas', number: 3, position: PlayerPosition.CUTTER, status: PlayerStatus.ACTIVE, experience: '2 años', heightCm: 172 },
  ]
  for (const p of players) {
    await prisma.player.upsert({ where: { number: p.number }, update: p, create: p })
  }

  // 3) Events seed
  const now = new Date()
  const events = [
    { title: 'Entrenamiento', type: EventType.TRAINING, status: EventStatus.UPCOMING, startsAt: new Date(now.getTime() + 24*3600*1000) },
    { title: 'Torneo Regional', type: EventType.TOURNAMENT, status: EventStatus.UPCOMING, startsAt: new Date(now.getTime() + 5*24*3600*1000) },
  ]
  for (const e of events) { await prisma.event.create({ data: e }) }

  // 4) Finance defaults
  const mainAccount = await prisma.account.upsert({ where: { id: 1 }, update: {}, create: { name: 'Caja', type: 'CASH' } })
  const catIngreso = await prisma.category.upsert({ where: { id: 1 }, update: {}, create: { name: 'Cuotas', kind: 'INCOME' } })
  const catGasto = await prisma.category.upsert({ where: { id: 2 }, update: {}, create: { name: 'Equipamiento', kind: 'EXPENSE' } })
  await prisma.transaction.create({ data: { accountId: mainAccount.id, categoryId: catIngreso.id, type: 'INCOME', amountCents: 5000, occurredAt: new Date(), description: 'Cuota octubre' } })
  await prisma.transaction.create({ data: { accountId: mainAccount.id, categoryId: catGasto.id, type: 'EXPENSE', amountCents: 2000, occurredAt: new Date(), description: 'Discos y conos' } })

  // 5) Rivals
  await prisma.rival.createMany({
    data: [
      { name: 'Boricuas Ultimate', strengths: 'Velocidad en cortes', weaknesses: 'Zona débil', notes: 'Usan mucho handler weave' },
      { name: 'Isla Flyers', strengths: 'Defensa física', weaknesses: 'Pocas variantes ofensivas', notes: 'Forzarlos a lado backhand' },
    ],
    skipDuplicates: true,
  })

  // 6) Plays
  await prisma.play.createMany({
    data: [
      { name: 'Vertical Stack Básico', category: 'OFFENSE', description: 'Vert con resets', content: '# Vert stack\nCortes 1-2, reset a handler.' },
      { name: 'Zona 3-3-1', category: 'DEFENSE', description: 'Zona básica', content: 'Columna de 3 al frente, 3 en media, 1 deep.' },
      { name: 'Drill de Lanzamientos', category: 'DRILL', description: 'Corta y lanza', content: '- 10 backhands\n- 10 forehands' },
    ],
    skipDuplicates: true,
  })

  console.log('Seed completed.')
  console.log('Users:')
  console.log('- Admin:  admin@example.com / admin123')
  console.log('- Guest:  guest@example.com / admin123')
  console.log('- Player: player@example.com / admin123 (linked to player #7 if exists)')
  
  // Create a sample pending role request for the guest to become player (unlinked)
  const existingReq = await db.roleRequest.findFirst({ where: { userId: guestUser.id, status: 'PENDING' } })
  if (!existingReq) {
    await db.roleRequest.create({ data: { userId: guestUser.id, role: 'player', note: 'Quiero participar como jugador' } })
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
