import { test, expect } from '@playwright/test'

test('authenticated user can create and delete a finance transaction', async ({ page }) => {
  const now = new Date()
  const ts = now.getTime()
  const acctName = `E2E Cuenta ${ts}`
  const catName = `E2E Categoría ${ts}`
  const desc = `E2E Tx ${ts}`
  const occurredAt = new Date(ts - 60_000).toISOString().slice(0, 16) // yyyy-MM-ddTHH:mm

  // API readiness handled by globalSetup

  // Login via API and set real token
  const login = await page.request.post('http://localhost:4000/api/auth/login', { data: { email: 'admin@example.com', password: 'admin123' } })
  const token = (await login.json())?.token
  if (!token) test.skip()
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), token)

  await page.goto('/finanzas')

  // Create Account via UI
  await page.locator('label:has-text("Cuenta") button:has-text("Nueva")').click()
  const accountModal = page.locator('div:has(> .bg-indigo-600:has-text("Nueva Cuenta"))').first()
  await expect(accountModal).toBeVisible()
  await accountModal.locator('label:has-text("Nombre") ~ input').fill(acctName)
  // Type defaults to Efectivo (CASH); keep default
  await accountModal.getByRole('button', { name: 'Guardar' }).click()
  // Wait for modal to close and toast to appear
  await expect(accountModal).not.toBeVisible({ timeout: 5000 })
  // Verify toast appears (check for message in toast container)
  await expect(page.locator('.fixed.top-0.right-0').getByText('Cuenta creada', { exact: false })).toBeVisible({ timeout: 3000 })

  // Create Category via UI
  await page.locator('label:has-text("Categoría") button:has-text("Nueva")').click()
  const categoryModal = page.locator('div:has(> .bg-indigo-600:has-text("Nueva Categoría"))').first()
  await expect(categoryModal).toBeVisible()
  await categoryModal.locator('label:has-text("Nombre") ~ input').fill(catName)
  // Kind defaults to Ingreso; keep default
  await categoryModal.getByRole('button', { name: 'Guardar' }).click()
  // Wait for modal to close and toast to appear
  await expect(categoryModal).not.toBeVisible({ timeout: 5000 })
  // Verify toast appears
  await expect(page.locator('.fixed.top-0.right-0').getByText('Categoría creada', { exact: false })).toBeVisible({ timeout: 3000 })

  // Open create transaction modal
  await page.getByRole('button', { name: '+ Agregar' }).click()
  await expect(page.getByText('Nueva Transacción')).toBeVisible()

  // Fill transaction form
  const modal = page.locator('div:has(> .bg-gradient-to-r:has-text("Transacción"))')
  await modal.locator('input[type="number"]').fill('1234') // 12.34
  await modal.locator('input[type="datetime-local"]').fill(occurredAt)
  await modal.locator('select').nth(1).selectOption({ label: acctName }) // account select (2nd select in modal)
  await modal.locator('select').nth(2).selectOption({ label: catName }) // category select (3rd select in modal)
  await modal.locator('label:has-text("Descripción") ~ input').fill(desc)
  await modal.getByRole('button', { name: 'Guardar' }).click()

  // Verify appears in table
  const row = page.locator(`xpath=//tr[.//td[normalize-space(.)='${desc}']]`)
  await expect(row).toBeVisible()

  // Delete it
  await row.locator('button:has-text("Eliminar")').click()
  const confirm = page.getByTestId('confirm-modal')
  await confirm.getByTestId('confirm-yes').click()
  await expect(row).toHaveCount(0)
})
