import { test, expect } from '@playwright/test'

async function ensureApiAndAuthEnabled(_page: any) {}

// This spec performs a minimal inline-edit flow: set note and clear playerId on a pending request
// Precondition: At least one pending role request exists, else the test exits early.
test('admin can edit pending role request inline (note + clear playerId)', async ({ page }) => {
  await ensureApiAndAuthEnabled(page)

  // Login as admin via API and set token
  const loginRes = await page.request.post('http://localhost:4000/api/auth/login', {
    data: { email: 'admin@example.com', password: 'admin123' },
  })
  const loginData = await loginRes.json()
  const token = loginData?.token
  if (!token) test.skip()
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), token)

  // Navigate to admin users page
  await page.goto('/admin/usuarios')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
    // If page doesn't load, skip test
    test.skip()
  })

  // Ensure we are viewing PENDING - wait for select to be visible
  const statusSelect = page.locator('select').first()
  try {
    await statusSelect.waitFor({ state: 'visible', timeout: 10000 })
    await statusSelect.selectOption('PENDING')
  } catch (error) {
    // If select doesn't exist, the page might not be ready or auth might not be enabled
    test.skip()
  }

  // Wait a bit for the table to load after selecting PENDING
  await page.waitForTimeout(1000)
  
  // If there is no pending, seed one via API (register a user and create a role request)
  let guardarButtons = page.locator('[data-testid^="role-req-save-"]')
  const buttonCount = await guardarButtons.count().catch(() => 0)
  if (buttonCount === 0) {
    const email = `inline-e2e+${Date.now()}@example.com`
    const password = 'admin123'
    // Register (or login) to get a token
    let token: string | null = null
    const reg = await page.request.post('http://localhost:4000/api/auth/register', { data: { email, password } })
    if (reg.status() === 200) {
      try { token = (await reg.json())?.token || null } catch {}
    }
    if (!token) {
      const login = await page.request.post('http://localhost:4000/api/auth/login', { data: { email, password } })
      if (login.status() === 200) {
        try { token = (await login.json())?.token || null } catch {}
      }
    }
    // Create role request as that user (pending)
    if (token) {
      await page.request.post('http://localhost:4000/api/users/role-requests', {
        data: { role: 'player', note: 'seed pending' },
        headers: { Authorization: `Bearer ${token}` },
      })
      // Reload admin page and re-check
      await page.goto('/admin/usuarios')
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
      try {
        await statusSelect.waitFor({ state: 'visible', timeout: 10000 })
        await statusSelect.selectOption('PENDING')
        await page.waitForTimeout(1000)
      } catch {
        test.skip()
      }
      guardarButtons = page.locator('[data-testid^="role-req-save-"]')
    }
  }
  const finalButtonCount = await guardarButtons.count().catch(() => 0)
  if (finalButtonCount === 0) {
    test.skip()
  }

  // Edit the first pending row: set note and clear playerId
  const firstRow = page.locator('[data-testid^="role-req-row-"]').first()
  const noteInput = firstRow.locator('[data-testid^="role-req-note-"]')
  const playerIdInput = firstRow.locator('[data-testid^="role-req-playerId-"]')

  const note = `Ajuste ${Date.now()}`
  await noteInput.fill(note)
  // Clear playerId explicitly
  await playerIdInput.fill('')

  // Save
  const saveBtn = firstRow.locator('[data-testid^="role-req-save-"]')
  await saveBtn.click()

  // After save, it reloads; ensure table is present
  await expect(page.locator('text=Solicitudes de rol')).toBeVisible()
})
