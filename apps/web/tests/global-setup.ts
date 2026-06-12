import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { spawn } from 'child_process'
import { chromium, FullConfig } from '@playwright/test'

async function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

async function waitForHealth(url: string, timeoutMs = 90_000, intervalMs = 1000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {}
    await sleep(intervalMs)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function tryAdminLogin(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' }),
    })
    if (!res.ok) {
      console.warn(`[globalSetup] Admin login failed with status ${res.status}`)
      return false
    }
    const data = await res.json().catch(() => null)
    const hasToken = Boolean(data?.token)
    if (!hasToken) {
      console.warn('[globalSetup] Admin login response missing token')
    }
    return hasToken
  } catch (error) {
    console.warn('[globalSetup] Admin login error:', error)
    return false
  }
}

async function runNpmScriptIn(dir: string, script: string) {
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, ['run', script], { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' })
    p.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${script} failed with code ${code}`))
    })
    p.on('error', reject)
  })
}

async function getTokenOrNull(email: string, password: string): Promise<string | null> {
  try {
    const login = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!login.ok) return null
    const data = await login.json().catch(() => null)
    return data?.token ?? null
  } catch {
    return null
  }
}

async function ensureUserAndGetToken(email: string, password: string, name?: string): Promise<string | null> {
  // Try register (best-effort), then login
  try {
    await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
      .then(() => undefined)
      .catch(() => undefined)
  } catch {}
  return await getTokenOrNull(email, password)
}

async function writeStorageStateForToken(baseURL: string, storagePath: string, token: string) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  // Ensure localStorage key exists for the app origin
  await page.addInitScript((t) => {
    try { localStorage.setItem('sjuc.auth.token', t as string) } catch {}
  }, token)
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await context.storageState({ path: storagePath })
  await browser.close()
}

const __filename = fileURLToPath(import.meta.url)
const __dirnameESM = path.dirname(__filename)

export default async function globalSetup(config: FullConfig) {
  // Wait for API to be up
  const healthUrl = 'http://localhost:4000/health'
  console.log('[globalSetup] Waiting for API health...')
  await waitForHealth(healthUrl)

  // Ensure default admin exists; if not, best-effort migrate+seed
  const hasAdmin = await tryAdminLogin()
  if (!hasAdmin) {
    console.warn('[globalSetup] Admin login failed; attempting prisma migrate + seed...')
    const apiDir = path.resolve(__dirnameESM, '..', '..', 'api')
    try {
      // Use migrate deploy instead of migrate dev (non-interactive)
      await runNpmScriptIn(apiDir, 'prisma:migrate')
      await runNpmScriptIn(apiDir, 'prisma:seed')
      // Wait a bit for seed to complete
      await sleep(2000)
    } catch (e) {
      console.warn('[globalSetup] prisma migrate/seed failed:', e)
    }
    const hasAdminAfter = await tryAdminLogin()
    if (!hasAdminAfter) {
      console.warn('[globalSetup] Admin still unavailable; some tests may be skipped')
      console.warn('[globalSetup] This is normal if AUTH_REQUIRED=false or admin user does not exist')
    } else {
      console.log('[globalSetup] Admin login successful after migrate/seed')
    }
  } else {
    console.log('[globalSetup] Admin login successful')
  }

  // Optional optimization: generate storageState files for authenticated runs
  try {
  const baseURL = (config.projects?.[0]?.use as any)?.baseURL || process.env.BASE_URL || 'http://localhost:5173'
  const authDir = path.resolve(__dirnameESM, '.auth')
    await fs.mkdir(authDir, { recursive: true })

    // Admin storage state
    const adminToken = await getTokenOrNull('admin@example.com', 'admin123')
    if (adminToken) {
      const adminPath = path.join(authDir, 'admin.json')
      await writeStorageStateForToken(baseURL, adminPath, adminToken)
      console.log(`[globalSetup] Wrote storageState: ${adminPath}`)
    } else {
      console.warn('[globalSetup] Could not obtain admin token for storageState')
    }

    // Guest storage state
    const guestEmail = 'guest@example.com'
    const guestPass = 'admin123'
    const guestToken = await getTokenOrNull(guestEmail, guestPass)
    if (guestToken) {
      const guestPath = path.join(authDir, 'guest.json')
      await writeStorageStateForToken(baseURL, guestPath, guestToken)
      console.log(`[globalSetup] Wrote storageState: ${guestPath}`)
    } else {
      console.warn('[globalSetup] Could not obtain guest token for storageState')
    }
  } catch (e) {
    console.warn('[globalSetup] storageState generation skipped due to error:', e)
  }
}
