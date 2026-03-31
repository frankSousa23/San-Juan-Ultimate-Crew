import fs from 'node:fs'
import path from 'node:path'

function copyIfMissing(from, to) {
  if (fs.existsSync(to)) return false
  if (!fs.existsSync(from)) return false
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
  return true
}

const root = process.cwd()

const apiExample = path.join(root, 'apps', 'api', '.env.example')
const apiEnv = path.join(root, 'apps', 'api', '.env')

const webExample = path.join(root, 'apps', 'web', '.env.example')
const webEnvLocal = path.join(root, 'apps', 'web', '.env.local')

const wrote = []

if (copyIfMissing(apiExample, apiEnv)) wrote.push('apps/api/.env')
if (copyIfMissing(webExample, webEnvLocal)) wrote.push('apps/web/.env.local')

if (wrote.length === 0) {
  console.log('No se creó ningún archivo de entorno (ya existen o faltan .env.example).')
} else {
  console.log(`Archivos creados: ${wrote.join(', ')}`)
}

