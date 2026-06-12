import { run, runShell } from './_run.mjs'

// Defaults for Dockerized Postgres on Windows (see docker-compose.yml).
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://sju:sju@localhost:5433/sju_dev?schema=public'

runShell('docker compose up -d')

// Prisma generate can hit EPERM on Windows with node-api engine; binary is more reliable.
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary'
runShell(`npm -w apps/api run prisma:generate`, {
  env: { ...process.env },
})

runShell(`npm -w apps/api run prisma:migrate`, {
  env: { ...process.env, DATABASE_URL },
})

// Seed (best-effort) – exit on failure to keep setup deterministic.
run('npm', ['-w', 'apps/api', 'run', 'prisma:seed'], {
  env: { ...process.env, DATABASE_URL },
})

console.log('Setup dev completado.')

