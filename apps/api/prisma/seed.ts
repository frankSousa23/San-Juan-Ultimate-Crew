import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL || 'postgresql://sju:sju@localhost:5433/sju_dev?schema=public'
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando restauración y seeder limpio de SIGEDIVO...')

  // 0. Limpiar base de datos
  console.log('🧹 Vaciando tablas previas...')
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

  // 3. Usuarios Iniciales (ÚNICAMENTE 2 USUARIOS PRE-APROBADOS: ADMIN Y GUEST)
  console.log('👤 Creando únicamente los 2 usuarios iniciales autorizados (Admin y Guest)...')
  const passwordHash = await bcrypt.hash('123456', 10)

  const initialUsers = [
    { email: 'frankalfonso1988@gmail.com', name: 'Frank Sousa (Admin Global)', role: 'admin', playerId: null },
    { email: 'guest@sigedivo.com', name: 'Invitado / Demostración', role: 'guest', playerId: null },
  ]

  for (const u of initialUsers) {
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
  }

  console.log('✅ Restauración limpia completada. Sistema totalmente vacío.')
  console.log('🔑 Usuarios activos: Admin (frankalfonso1988@gmail.com) e Invitado (guest@sigedivo.com)')
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeder:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
