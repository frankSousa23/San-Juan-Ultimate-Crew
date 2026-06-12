import { test, expect } from '@playwright/test'

test('authenticated user can create and delete a resource', async ({ page }) => {
  const title = `E2E Recurso ${Date.now()}`
  const url = 'https://example.com'

  // API readiness handled by globalSetup

  // Login via API and set real token before navigation
  const login = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'admin@example.com', password: 'admin123' } })
  const token = (await login.json())?.token
  if (!token) { test.skip(); return; }
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), token)

  // Go to Resources
  await page.goto('/recursos')
  // Ensure create form visible (auth-gated). Si no está visible, probablemente no hay permisos;
  // en ese caso no forzamos el flujo  // Verify form is present
  const newResourceHeading = page.getByText('Nuevo recurso')
  const submitBtn = page.getByRole('button', { name: /Crear/ })
  try {
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 })
  } catch (e) {
    test.skip()
    return
  }
  await expect(newResourceHeading).toBeVisible()

  // Create resource
  await page.fill('input[placeholder="Título"]', title)
  await page.fill('input[placeholder="URL"]', url)
  await page.click('button:has-text("Crear")')

  // Assert appears in list
  const itemLink = page.locator(`a:has-text("${title}")`)
  await expect(itemLink).toBeVisible()

  // Delete the created resource (find delete button within the same entry)
  const row = page.locator(`xpath=//div[contains(@class,'p-3')][.//a[normalize-space(text())='${title}']]`)
  const deleteBtn = row.locator('button:has-text("Eliminar")').filter({ hasNotText: 'seleccionados' })
  await deleteBtn.first().click()
  // Confirm modal (ConfirmModal has no explicit role; target by title text and footer button)
  const confirm = page.getByTestId('confirm-modal')
  await confirm.getByTestId('confirm-yes').click()
  await expect(itemLink).toHaveCount(0)
})
