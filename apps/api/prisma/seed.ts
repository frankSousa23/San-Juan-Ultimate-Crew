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
  const passwordHashGuest = await bcrypt.hash('123456', 10)
  const passwordHashAdmin = await bcrypt.hash('passWORD23', 10)

  const initialUsers = [
    { email: 'frankalfonso1988@gmail.com', name: 'Frank Sousa', role: 'admin', playerId: null, pass: passwordHashAdmin },
    { email: 'guest@sigedivo.com', name: 'Invitado / Demostración', role: 'guest', playerId: null, pass: passwordHashGuest },
  ]

  for (const u of initialUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: u.pass, status: 'APPROVED', playerId: u.playerId, name: u.name },
      create: { email: u.email, name: u.name, passwordHash: u.pass, status: 'APPROVED', playerId: u.playerId }
    })
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleMap[u.role] } },
      update: {},
      create: { userId: user.id, roleId: roleMap[u.role] }
    })
  }

  // 4. Finanzas (Cuentas, Categorías y Transacciones de prueba)
  console.log('💰 Creando finanzas...')
  const acc1 = await prisma.account.create({
    data: { name: 'Caja Chica (Efectivo / USD)', type: 'CASH' }
  })
  const acc2 = await prisma.account.create({
    data: { name: 'Cuenta Bancaria / Pago Móvil / Zelle', type: 'BANK' }
  })

  const cat1 = await prisma.category.create({ data: { name: 'Cuotas de Membresía Mensual', kind: 'INCOME' } })
  const cat2 = await prisma.category.create({ data: { name: 'Venta de Discos Oficiales 175g', kind: 'INCOME' } })
  const cat3 = await prisma.category.create({ data: { name: 'Patrocinios y Donaciones', kind: 'INCOME' } })
  const cat4 = await prisma.category.create({ data: { name: 'Compra de Discos y Conos', kind: 'EXPENSE' } })
  const cat5 = await prisma.category.create({ data: { name: 'Hidratación y Primeros Auxilios', kind: 'EXPENSE' } })
  const cat6 = await prisma.category.create({ data: { name: 'Inscripción a Torneo Nacional', kind: 'EXPENSE' } })

  await prisma.transaction.createMany({
    data: [
      { accountId: acc2.id, categoryId: cat1.id, type: 'INCOME', amountCents: 10000, description: 'Cobro de cuotas mensuales de atletas (Enero)', occurredAt: new Date(Date.now() - 86400000 * 18) },
      { accountId: acc2.id, categoryId: cat2.id, type: 'INCOME', amountCents: 7500, description: 'Venta de 5 discos oficiales Discraft Ultra-Star 175g', occurredAt: new Date(Date.now() - 86400000 * 12) },
      { accountId: acc2.id, categoryId: cat4.id, type: 'EXPENSE', amountCents: 12000, description: 'Compra de lote de 10 discos oficiales de competencia', occurredAt: new Date(Date.now() - 86400000 * 10) },
      { accountId: acc1.id, categoryId: cat5.id, type: 'EXPENSE', amountCents: 1850, description: 'Agua potable y bolsas de hielo para entrenamiento de fin de semana', occurredAt: new Date(Date.now() - 86400000 * 5) },
      { accountId: acc2.id, categoryId: cat6.id, type: 'EXPENSE', amountCents: 15000, description: 'Anticipo de Bid Fee - Copa Nacional de Ultimate Frisbee', occurredAt: new Date(Date.now() - 86400000 * 3) },
    ]
  })

  // 5. Jugadas Tácticas (Playbook)
  console.log('📋 Creando jugadas tácticas de Ultimate Frisbee...')
  await prisma.play.createMany({
    data: [
      {
        name: 'Vertical Stack Estándar (Cortes Open y Break Side)',
        category: 'OFFENSE',
        description: 'Formación clásica en columna vertical. Cortadores atacan sucesivamente desde el fondo hacia el lado abierto o lado cerrado con resets rápidos en stall 6.',
        content: '### Vertical Stack\n- 2-3 Handlers en la base y 4 Cutters en el centro.\n- Cortes sucesivos desde el fondo del stack hacia open side o break side.\n- Desahogos (dumps) rápidos a la cuenta de stall 6.'
      },
      {
        name: 'Horizontal Stack (H-Stack) con Variación Deep Iso',
        category: 'OFFENSE',
        description: 'Formación en línea transversal con 3 handlers y 4 cutters. Genera pasillos abiertos en carriles centrales e incorpora corte profundo aislado para receptores veloces.',
        content: '### Horizontal Stack\n- 3 Handlers en la base y 4 Cutters a lo ancho del campo.\n- Cortes centrales cruzados e incursión profunda aislada (Deep Iso).'
      },
      {
        name: 'Defensa en Zona Cup (3-3-1 Cup Defense)',
        category: 'DEFENSE',
        description: 'Sistema de copa de 3 defensas (Mark, Middle, Point), 3 intermedios (Short Deep y Wings) y 1 Deep-Deep. Excelente para frenar ataques en días de viento.',
        content: '### Defensa en Zona Cup\n- Copa de 3 presiona al lanzador.\n- 3 medios cortan pases altos y laterales.\n- 1 Deep-Deep cuida lanzamientos largos.'
      },
      {
        name: 'Defensa Dome / Clam (Cúpula Modular)',
        category: 'DEFENSE',
        description: 'Esquema defensivo híbrido en domo que colapsa el centro del campo contra stacks verticales, forzando tiros difíciles hacia las bandas e induciendo stall outs.',
        content: '### Defensa Dome\n- Cobertura semicircular que niega el centro de la cancha y fuerza pases hacia las líneas laterales.'
      },
      {
        name: 'Variación Endzone Iso (Aislamiento de Anotación)',
        category: 'OFFENSE',
        description: 'Jugada en zona roja (últimos 15 metros). Cutters despejan al lado débil dejando espacio libre de 1 contra 1 para el cortador principal.',
        content: '### Endzone Iso\n- Limpieza del espacio de anotación para un mano a mano con pase raso de muñeca.'
      },
      {
        name: 'Drill de Lanzamientos con Presión (Dump-Swing)',
        category: 'DRILL',
        description: 'Ejercicio dinámico de 3 atletas para mecanizar pases en movimiento, cambio rápido de frente (swing) y desahogo con pivoteo bajo marca estricta.',
        content: '### Dump-Swing Drill\n- Ejercicio de 3 jugadores con pivoteo forzado y cambio de lado del disco en stall alto.'
      },
    ]
  })

  // 6. Recursos Oficiales
  console.log('📚 Creando recursos...')
  await prisma.resource.createMany({
    data: [
      {
        title: 'Reglamento Oficial de Ultimate WFDF 2021-2024 / 2025 (Español)',
        category: 'Reglamento y Normativas',
        description: 'Reglas oficiales de la World Flying Disc Federation: no contacto, stall count de 10s, autogestión de faltas y dimensiones de campo 100x37m.',
        url: 'https://rules.wfdf.sport/',
        fileName: 'Reglas_Oficiales_WFDF_Ultimate.pdf',
        size: 1850000
      },
      {
        title: 'Manual de Espíritu de Juego (Spirit of the Game - SOTG)',
        category: 'Espíritu de Juego',
        description: 'Criterios y rúbrica oficial de la WFDF para la puntuación SOTG: Conocimiento de reglas, faltas y contacto, imparcialidad, actitud positiva y comunicación.',
        url: 'https://wfdf.sport/organisation/spirit-of-the-game/',
        fileName: 'Guia_Oficial_Espiritu_de_Juego_SOTG.pdf',
        size: 920000
      },
      {
        title: 'Guía Oficial de Señales de Mano WFDF',
        category: 'Reglamento y Normativas',
        description: 'Señales gestuales universales de jugadores: In/Out, Falta, Pick, Travel, Stall Out, Delay y Gol.',
        url: 'https://rules.wfdf.sport/',
        fileName: 'Senales_de_Mano_WFDF.pdf',
        size: 1250000
      },
      {
        title: 'Manual Técnico de Lanzamientos Fundamentales',
        category: 'Entrenamiento Técnico',
        description: 'Mecánica de agarres y lanzamientos: Backhand (Revés), Forehand/Flick (Sidearm), Hammer (Martillo), Scoober y pivoteo con pie de apoyo.',
        url: 'https://wfdf.sport/',
        fileName: 'Manual_Lanzamientos_Ultimate.pdf',
        size: 2100000
      },
      {
        title: 'Guía de Nutrición e Hidratación para Torneos de Fin de Semana',
        category: 'Salud y Bienestar',
        description: 'Protocolos de recarga de electrolitos, ingesta calórica entre partidos consecutivos y prevención de calambres bajo calor intenso.',
        url: 'https://wfdf.sport/',
        fileName: 'Nutricion_e_Hidratacion_Ultimate.pdf',
        size: 780000
      },
    ]
  })

  // 7. Comunicación
  console.log('📢 Creando canales y noticias...')
  const ch1 = await prisma.channel.create({ data: { name: 'Anuncios Generales' } })
  await prisma.channel.create({ data: { name: 'Línea Táctica y Entrenamientos' } })
  await prisma.message.create({
    data: {
      channelId: ch1.id,
      content: '¡Bienvenidos a SIGEDIVO San Juan Ultimate Crew! Utilicen este canal para enterarse de los comunicados oficiales, eventos y directrices del club.'
    }
  })

  await prisma.newsPost.create({
    data: {
      title: '🏆 ¡Bienvenidos a SIGEDIVO - San Juan Ultimate Crew! Guía Rápida del Sistema',
      content: `¡Saludos a todos los atletas y miembros de **San Juan Ultimate Crew**!\n\nEsta plataforma ha sido diseñada para optimizar nuestra gestión deportiva, táctica y organizativa. A continuación, les compartimos los puntos clave para el uso diario:\n\n1. **📅 Calendario y Convocatorias (RSVP)**: Ingresen a la sección de *Eventos* para confirmar su disponibilidad (Asistiré / Pendiente / No podré) antes de cada entrenamiento y partido.\n2. **📋 Pizarra Táctica (Playbook)**: Consulten las jugadas oficiales (*Vertical Stack*, *Horizontal Stack*, *Defensa en Zona Cup* y *Dome*) para llegar al campo con la estrategia clara.\n3. **💰 Transparencia Financiera**: En el módulo de *Finanzas* pueden revisar el balance general del club, aportes de membresía, compra de discos reglamentarios y presupuesto de torneos.\n4. **📚 Recursos y Reglamento**: En la sección de *Recursos* tienen acceso al reglamento oficial de la **WFDF**, la guía de **Espíritu de Juego (SOTG)** y manuales de preparación técnica.\n5. **💬 Canales de Chat**: Manténganse conectados en los canales de mensajería para coordinar traslados y resolver dudas con capitanes y cuerpo técnico.\n\n*¡A darlo todo en la cancha con el mejor Espíritu de Juego!*`,
      isPinned: true,
      isPublished: true,
      category: 'Anuncios'
    }
  })

  console.log('✅ Restauración y carga de ejemplos de Ultimate Frisbee completada con éxito.')
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
