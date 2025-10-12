import { test, expect } from '@playwright/test'

test('can load login page and submit form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('text=Iniciar sesión')).toBeVisible()
  await page.fill('input[type="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button:has-text("Ingresar")')
  // We don't assert a specific redirect path because AUTH may be disabled; ensure no error banner
  await expect(page.locator('text=Error al iniciar sesión')).toHaveCount(0)
})
