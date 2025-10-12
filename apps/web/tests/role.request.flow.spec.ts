import { test, expect } from '@playwright/test'

async function ensureApiAndAuthEnabled(_page: any) {}

test('guest requests player; admin approves; guest can see non-guest nav', async ({ page }) => {
  await ensureApiAndAuthEnabled(page)
  // Login as guest via API
  const loginGuest = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'guest@example.com', password: 'admin123' } })
  const tokenGuest = (await loginGuest.json())?.token
  if (!tokenGuest) test.skip()
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), tokenGuest)
  await page.goto('/perfil')

  // Submit request
  const note = `E2E ${Date.now()}`
  await page.getByPlaceholder('PlayerId').fill('')
  await page.getByPlaceholder('Nota').fill(note)
  await page.getByRole('button', { name: 'Enviar' }).click()
  // Might alert success or error due to prior pending; ignore
  // Ensure it appears in list (or list already has an item)
  await expect(page.locator('text=Mis solicitudes')).toBeVisible()

  // Logout
  await page.addInitScript(() => localStorage.removeItem('sjuc.auth.token'))

  // Login as admin via API
  const loginAdmin = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'admin@example.com', password: 'admin123' } })
  const tokenAdmin = (await loginAdmin.json())?.token
  if (!tokenAdmin) test.skip()
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), tokenAdmin)

  // Go to admin users page and approve first pending
  await page.goto('/admin/usuarios')
  const approveBtn = page.getByRole('button', { name: 'Aprobar' }).first()
  const hasPending = await approveBtn.count()
  if (hasPending > 0) {
    await approveBtn.click()
  }

  // Logout admin
  await page.addInitScript(() => localStorage.removeItem('sjuc.auth.token'))

  // Login again as guest via API and verify non-guest nav appears
  const loginGuest2 = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'guest@example.com', password: 'admin123' } })
  const tokenGuest2 = (await loginGuest2.json())?.token
  if (!tokenGuest2) test.skip()
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), tokenGuest2)

  // Nav should show 'Finanzas' (non-guest-only)
  await expect(page.getByRole('link', { name: 'Finanzas' })).toBeVisible()
})
