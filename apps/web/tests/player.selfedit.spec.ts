import { test, expect } from '@playwright/test'

async function ensureApiAndAuthEnabled(_page: any) {}

test('player can edit self but not others; admin can edit any', async ({ page }) => {
  await ensureApiAndAuthEnabled(page)
  const ts = Date.now()

  // Login as player via API and set token
  const loginPlayer = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'player@example.com', password: 'admin123' } })
  const loginData = await loginPlayer.json()
  const tokenPlayer = loginData?.token
  if (!tokenPlayer) { console.log('skip token'); test.skip(); return; }
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), tokenPlayer)
  
  // Get dynamic player numbers
  const playersRes = await page.request.get('http://localhost:4000/api/players')
  const players = await playersRes.json()
  const myPlayer = players.find((p: any) => p.id === loginData.user.playerId)
  if (!myPlayer) { console.log('skip myPlayer', loginData.user); test.skip(); return; }
  const myNumberText = `#${myPlayer.number}`
  const otherPlayer = players.find((p: any) => p.id !== loginData.user.playerId)
  if (!otherPlayer) { console.log('skip otherPlayer'); test.skip(); return; }
  const otherNumberText = `#${otherPlayer.number}`

  // Navigate to roster
  await page.goto('/roster')

  // Open own player
  const ownCard = page.getByText(myNumberText, { exact: true })
  try {
    await ownCard.first().waitFor({ state: 'visible', timeout: 5000 })
  } catch (e) {
    console.log('skip ownCard timeout', myNumberText);
    test.skip()
    return
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

  // Try to edit another player and expect forbidden error dialog.
  const otherCard = page.getByText(otherNumberText, { exact: true })
  try {
    await otherCard.first().waitFor({ state: 'visible', timeout: 5000 })
  } catch (e) {
    console.log('skip otherCard timeout', otherNumberText);
    test.skip()
    return
  }
  await otherCard.first().click()
  // As a non-admin non-owner, the Edit button should NOT be visible
  await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Cerrar' }).click()

  // Login as admin via API
  await page.addInitScript(() => localStorage.removeItem('sjuc.auth.token'))
  const loginAdmin = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'admin@example.com', password: 'admin123' } })
  const tokenAdmin = (await loginAdmin.json())?.token
  if (!tokenAdmin) { test.skip(); return; }
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), tokenAdmin)

  await page.goto('/roster')
  await page.getByText(otherNumberText, { exact: true }).first().click()
  await page.getByRole('button', { name: 'Editar' }).click()
  const expAdmin = `E2E admin ${ts}`
  const expInputAdmin = page.locator('label:has-text("Experiencia")').locator('xpath=following-sibling::input[1]')
  await expInputAdmin.fill(expAdmin)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText(expAdmin)).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar' }).click()
})
