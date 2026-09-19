import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { cleanSampleData } from '../src/lib/sampleDataService.js'

const connectionString = process.env.DATABASE_URL || 'postgresql://sju:sju@localhost:5433/sju_dev?schema=public'
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Limpiando datos de prueba de SIGEDIVO para empezar desde cero...')
  const result = await cleanSampleData(prisma)
  console.log('✨ Datos de prueba eliminados exitosamente:')
  console.log(JSON.stringify(result.deletedCounts, null, 2))
  console.log('🚀 El sistema está limpio y listo para ingresar los datos oficiales del club.')
}

main()
  .catch((e) => {
    console.error('Error al limpiar datos de prueba:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
