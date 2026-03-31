import { run, runShell } from './_run.mjs'

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://sju:sju@localhost:5433/sju_dev?schema=public'

// API unit/integration tests
run('npm', ['-w', 'apps/api', 'run', 'test'], {
  env: { ...process.env, DATABASE_URL },
})

// E2E (best-effort: historically allowed to fail in CI)
runShell('npm -w apps/web run test:e2e', {
  env: {
    ...process.env,
    DATABASE_URL,
    AUTH_REQUIRED: process.env.AUTH_REQUIRED ?? 'false',
    BASE_URL: process.env.BASE_URL ?? 'http://localhost:5173',
    CI: process.env.CI ?? 'false',
  },
})

console.log('Tests completados.')

