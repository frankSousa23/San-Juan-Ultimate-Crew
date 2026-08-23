import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL || 'postgresql://sju:sju@localhost:5433/sju_dev?schema=public'
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seeder minimalista (Limpieza de sistema)...')

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
    if (!roleId) return
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

  console.log('👤 Creando administrador principal...')
  const passwordHashAdmin = await bcrypt.hash('passWORD23', 10)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'frankalfonso1988@gmail.com',
      name: 'Frank Sousa (Admin)',
      passwordHash: passwordHashAdmin,
      status: 'APPROVED',
    }
  })

  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: roleMap['admin']
    }
  })

  console.log('🛡️ Creando equipos oficiales por defecto...')
  const defaultTeams = [
    {
      name: 'El Pueblito',
      tag: 'EPB',
      categories: 'Open Masculino',
      color: '#111827',
      notes: 'Equipo Open Masculino - Color representativo Negro',
    },
    {
      name: 'Warao',
      tag: 'WAR',
      categories: 'Open Masculino',
      color: '#1f2937',
      notes: 'Equipo Open Masculino - Color representativo Negro',
    },
    {
      name: 'Medusa',
      tag: 'MED',
      categories: 'Open Femenino y Mixto',
      color: '#7e22ce',
      notes: 'Equipo Open Femenino y Mixto - Color representativo Púrpura',
    },
    {
      name: 'MotherFlowers',
      tag: 'MOF',
      categories: 'Open Femenino',
      color: '#ec4899',
      notes: 'Equipo Open Femenino - Color representativo Rosado',
    },
    {
      name: 'Raza',
      tag: 'RAZ',
      categories: 'Open Masculino',
      color: '#dc2626',
      notes: 'Equipo Open Masculino - Color representativo Rojo',
    },
    {
      name: 'Harakiri',
      tag: 'HKR',
      categories: 'Open Masculino',
      color: '#800020',
      notes: 'Equipo Open Masculino - Color representativo Vinotinto',
    },
    {
      name: 'Ad Astra',
      tag: 'AST',
      categories: 'Mixto',
      color: '#1d4ed8',
      notes: 'Equipo Mixto - Color representativo Azul',
    },
  ]

  for (const team of defaultTeams) {
    await prisma.team.upsert({
      where: { name: team.name },
      update: team,
      create: team,
    })
  }

  console.log('⚔️ Creando rivales base por defecto...')
  const defaultRivals = [
    {
      name: 'Comunidad El Oso',
      strengths: 'Juego vertical rápido, defensa de zona cerrada',
      weaknesses: 'Pases forzados bajo presión en la línea final',
      notes: 'Rival tradicional categoría Open y Mixto',
    },
    {
      name: 'Revolution Ultimate',
      strengths: 'Gran precisión en hucks largos, alto atletismo',
      weaknesses: 'Desgaste físico en segundas mitades de torneos',
      notes: 'Equipo élite de referencia',
    },
    {
      name: 'Discolocos',
      strengths: 'Handlers experimentados con lanzamientos invertidos (scoobers/hammers)',
      weaknesses: 'Vulnerables a marcas hombre a hombre asfixiantes',
      notes: 'Rival de circuito regional',
    },
  ]

  for (const rival of defaultRivals) {
    const existing = await prisma.rival.findFirst({ where: { name: rival.name } })
    if (!existing) {
      await prisma.rival.create({ data: rival })
    }
  }

  console.log('✅ Limpieza y seeder completado con éxito!')
}

main()
  .catch((e) => {
    console.error('Error durante el seeder:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
