import { PrismaClient, PlayerPosition, PlayerStatus, EventType, EventStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Players
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
    await prisma.player.upsert({
      where: { number: p.number },
      update: p,
      create: p,
    })
  }

  // Events
  const now = new Date()
  const events = [
    { title: 'Entrenamiento', type: EventType.TRAINING, status: EventStatus.UPCOMING, startsAt: new Date(now.getTime() + 24*3600*1000) },
    { title: 'Torneo Regional', type: EventType.TOURNAMENT, status: EventStatus.UPCOMING, startsAt: new Date(now.getTime() + 5*24*3600*1000) },
  ]

  for (const e of events) {
    await prisma.event.create({ data: e })
  }

  // Finance defaults (use any to avoid transient TS type lag after schema update)
  const prismaAny = prisma as any
  const mainAccount = await prismaAny.account.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Caja', type: 'CASH' },
  })
  const catIngreso = await prismaAny.category.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Cuotas', kind: 'INCOME' },
  })
  const catGasto = await prismaAny.category.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Equipamiento', kind: 'EXPENSE' },
  })
  // Sample transactions
  await prismaAny.transaction.create({ data: { accountId: mainAccount.id, categoryId: catIngreso.id, type: 'INCOME', amountCents: 5000, occurredAt: new Date(), description: 'Cuota octubre' } })
  await prismaAny.transaction.create({ data: { accountId: mainAccount.id, categoryId: catGasto.id, type: 'EXPENSE', amountCents: 2000, occurredAt: new Date(), description: 'Discos y conos' } })

  // Rivals
  await prismaAny.rival.createMany({
    data: [
      { name: 'Boricuas Ultimate', strengths: 'Velocidad en cortes', weaknesses: 'Zona débil', notes: 'Usan mucho handler weave' },
      { name: 'Isla Flyers', strengths: 'Defensa física', weaknesses: 'Pocas variantes ofensivas', notes: 'Forzarlos a lado backhand' },
    ],
    skipDuplicates: true,
  })

  // Plays
  await prismaAny.play.createMany({
    data: [
      { name: 'Vertical Stack Básico', category: 'OFFENSE', description: 'Vert con resets', content: '# Vert stack\nCortes 1-2, reset a handler.' },
      { name: 'Zona 3-3-1', category: 'DEFENSE', description: 'Zona básica', content: 'Columna de 3 al frente, 3 en media, 1 deep.' },
      { name: 'Drill de Lanzamientos', category: 'DRILL', description: 'Corta y lanza', content: '- 10 backhands\n- 10 forehands' },
    ],
    skipDuplicates: true,
  })

  console.log('Seed data inserted')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
