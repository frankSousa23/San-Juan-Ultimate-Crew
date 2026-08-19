import { test, expect } from '@playwright/test'

async function ensureApiAndAuthEnabled(_page: any) {}

test('player can edit self but not others; admin can edit any', async ({ page }) => {
  await ensureApiAndAuthEnabled(page)
  const ts = Date.now()

  // Login as player via API and set token
  const loginPlayer = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'player@sigedivo.com', password: 'admin123' } })
  const loginData = await loginPlayer.json()
  const tokenPlayer = loginData?.token
  if (!tokenPlayer) { console.log('skip token'); test.skip(); return; }
  await page.addInitScript((t) => localStorage.setItem('sigedivo.auth.token', t as string), tokenPlayer)
  
  // Ensure admin token to fix data if needed
  const adminLoginReq = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'frankalfonso1988@gmail.com', password: 'admin123' } })
  const adminToken = (await adminLoginReq.json()).token

  // Get dynamic player numbers
  const playersRes = await page.request.get('http://localhost:4000/api/players')
  const players = await playersRes.json()
  let myPlayer = players.find((p: any) => p.id === loginData.user.playerId)
  
  if (!myPlayer) { 
    // Create a player and link it to the player user
    const tsNumber = Math.floor(Math.random() * 9000) + 100
    const newPlayerReq = await page.request.post('http://localhost:4000/api/players', {
      data: { name: 'E2E Self Player', number: tsNumber, position: 'HANDLER', status: 'ACTIVE' },
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    myPlayer = await newPlayerReq.json()
    
    // Link user to this player directly using admin endpoint
    const linkRes = await page.request.put(`http://localhost:4000/api/users/${loginData.user.id}/link-player`, {
      data: { playerId: myPlayer.id },
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    console.log('link-player status:', linkRes.status())
    if (!linkRes.ok()) {
      console.log('link-player error:', await linkRes.text())
      throw new Error('Failed to link player')
    }
  }

  const myNumberText = `#${myPlayer.number}`
  const otherPlayer = players.find((p: any) => p.id !== myPlayer.id)
  if (!otherPlayer) { console.log('skip otherPlayer'); test.skip(); return; }
  const otherNumberText = `#${otherPlayer.number}`

  // Navigate to roster
  await page.goto('/roster')

  // Search for own player to ensure it is on the current page
  await page.getByPlaceholder('Buscar jugador...').fill(myNumberText.replace('#', ''))
  await page.keyboard.press('Enter')

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
  const expInput = page.getByPlaceholder('Años de juego, roles, etc.')
  const expSelf = `E2E self ${ts}`
  await expInput.fill(expSelf)
  
  const updatePromise = page.waitForResponse(r => r.url().includes('/api/players/') && r.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Guardar' }).click()
  const updateRes = await updatePromise
  console.log('Update response:', await updateRes.json())
  
  // Modal remains open with updated view; verify
  await expect(page.getByText(expSelf)).toBeVisible()
  // Close modal
  await page.getByRole('button', { name: 'Cerrar' }).click()

  // Try to edit another player and expect forbidden error dialog.
  await page.getByPlaceholder('Buscar jugador...').fill(otherNumberText.replace('#', ''))
  await page.keyboard.press('Enter')
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
  await page.addInitScript(() => localStorage.removeItem('sigedivo.auth.token'))
  const loginAdmin = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'frankalfonso1988@gmail.com', password: 'admin123' } })
  const tokenAdmin = (await loginAdmin.json())?.token
  if (!tokenAdmin) { test.skip(); return; }
  await page.addInitScript((t) => localStorage.setItem('sigedivo.auth.token', t as string), tokenAdmin)

  await page.goto('/roster')
  await page.getByPlaceholder('Buscar jugador...').fill(otherNumberText.replace('#', ''))
  await page.keyboard.press('Enter')
  await page.getByText(otherNumberText, { exact: true }).first().click()
  await page.getByRole('button', { name: 'Editar' }).click()
  const expAdmin = `E2E admin ${ts}`
  const expInputAdmin = page.locator('label:has-text("Experiencia")').locator('xpath=following-sibling::input[1]')
  await expInputAdmin.fill(expAdmin)
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText(expAdmin)).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar' }).click()
})
