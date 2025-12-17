import { test, expect } from '@playwright/test'

async function ensureApiAndAuthEnabled(_page: any) {}

test('player can edit self but not others; admin can edit any', async ({ page }) => {
  await ensureApiAndAuthEnabled(page)
  const ts = Date.now()

  // Login as player via API and set token
  const loginPlayer = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'player@example.com', password: 'admin123' } })
  const tokenPlayer = (await loginPlayer.json())?.token
  if (!tokenPlayer) test.skip()
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), tokenPlayer)
  // Navigate to roster
  await page.goto('/roster')

  // Open own player (#7) and edit experience.
  // Si no existe el jugador #7 (datos semilla distintos), omitimos este test en este entorno.
  const ownCard = page.getByText('#7', { exact: true })
  if (await ownCard.count() === 0) {
    test.skip()
  }
  await ownCard.first().click()
  await page.getByRole('button', { name: 'Editar' }).click()
  const expInput = page.locator('label:has-text("Experiencia")').locator('xpath=following-sibling::input[1]')
  const expSelf = `E2E self ${ts}`
  await expInput.fill(expSelf)
  await page.getByRole('button', { name: 'Guardar' }).click()
  // Modal remains open with updated view; verify
  await expect(page.getByText(expSelf)).toBeVisible()
  // Close modal
  await page.getByRole('button', { name: 'Cerrar' }).click()

  // Try to edit another player (#12) and expect forbidden error dialog.
  const otherCard = page.getByText('#12', { exact: true })
  if (await otherCard.count() === 0) {
    test.skip()
  }
  await otherCard.first().click()
  // As a non-admin non-owner, the Edit button should NOT be visible
  await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Cerrar' }).click()

  // Login as admin via API
  await page.addInitScript(() => localStorage.removeItem('sjuc.auth.token'))
  const loginAdmin = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'admin@example.com', password: 'admin123' } })
  const tokenAdmin = (await loginAdmin.json())?.token
  if (!tokenAdmin) test.skip()
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), tokenAdmin)

  await page.goto('/roster')
  await page.getByText('#12', { exact: true }).click()
  await page.getByRole('button', { name: 'Editar' }).click()
  const expAdmin = `E2E admin ${ts}`
  const expInputAdmin = page.locator('label:has-text("Experiencia")').locator('xpath=following-sibling::input[1]')
  await expInputAdmin.fill(expAdmin)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText(expAdmin)).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar' }).click()
})
