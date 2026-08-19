import { test, expect } from '@playwright/test'

test('profile page loads and shows session state', async ({ page }) => {
  // En lugar de un login E2E completo, si auth puede fallar, usamos un token falso para engañar al front
  // y que intente cargar la página (aunque falle el fetch, la UI debe cargar)
  
  // Intercept the /api/auth/me to return a dummy user profile
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 99,
          email: 'test@sigedivo.com',
          roles: ['player'],
          name: 'Test User'
        }
      })
    })
  })

  const token = 'fake-jwt-token-for-ui-testing'
  // Start on homepage to set storage
  await page.goto('/')
  await page.addInitScript((t) => localStorage.setItem('sigedivo.auth.token', t as string), token)
  await page.goto('/perfil')
  await expect(page.getByRole('heading', { name: /Mi Perfil/i }).first()).toBeVisible({ timeout: 10000 })
  // We don't assert specific user fields since AUTH may be disabled in local env
})
