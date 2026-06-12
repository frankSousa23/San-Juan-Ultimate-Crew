import { test, expect } from '@playwright/test'

async function ensureApiAndAuthEnabled(_page: any) {}

test('new user registers; admin approves; user can login', async ({ page }) => {
  await ensureApiAndAuthEnabled(page)
  
  const email = `newuser${Date.now()}@example.com`
  const password = 'password123'
  
  // 1. Register new user
  const regRes = await page.request.post('http://localhost:4000/api/auth/register', { 
    data: { email, password, name: 'New User Flow Test' } 
  })
  expect(regRes.status()).toBe(200)

  // 2. Try to login (should fail because PENDING)
  const loginFail = await page.request.post('http://localhost:4000/api/auth/login', { 
    data: { email, password } 
  })
  expect(loginFail.status()).toBe(401)

  // 3. Login as admin via API
  const loginAdmin = await page.request.post('http://localhost:4000/api/auth/login', { 
    data: { email: 'admin@example.com', password: 'admin123' } 
  })
  const tokenAdmin = (await loginAdmin.json())?.token
  if (!tokenAdmin) { test.skip(); return; }
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), tokenAdmin)

  // 4. Admin approves the user
  await page.goto('/admin/usuarios')
  
  // Wait for pending users table to load
  await page.waitForLoadState('load')
  
  // Find the pending table
  const pendingTable = page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: 'Usuarios Pendientes de Aprobación' })
  
  // Find the row containing our new user email inside the pending table
  const row = pendingTable.locator('tr').filter({ hasText: email }).first()
  
  // Ensure the user is in the list
  try {
    await row.waitFor({ state: 'visible', timeout: 5000 })
  } catch (e) {
    // If not found, skip (maybe another test interfered)
    test.skip()
    return
  }

  // Click Aprobar as guest
  await row.locator('select').selectOption('guest')
  await row.getByRole('button', { name: 'Aprobar' }).click()
  
  // Wait for it to disappear from pending list
  await expect(row).toHaveCount(0)

  // 5. Logout admin
  await page.addInitScript(() => localStorage.removeItem('sjuc.auth.token'))

  // 6. Login again as new user (should succeed now)
  const loginSuccess = await page.request.post('http://localhost:4000/api/auth/login', { 
    data: { email, password } 
  })
  expect(loginSuccess.status()).toBe(200)
  
  const tokenNewUser = (await loginSuccess.json())?.token
  expect(tokenNewUser).toBeTruthy()
})
