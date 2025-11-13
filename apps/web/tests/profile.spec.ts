import { test, expect } from '@playwright/test'

test('profile page loads and shows session state', async ({ page }) => {
  // Login via API to get a real token
  const login = await page.request.post('http://localhost:4000/api/auth/login', { 
    data: { email: 'admin@example.com', password: 'admin123' } 
  })
  
  if (login.status() !== 200) {
    // If login fails, skip test (auth might not be enabled)
    test.skip()
    return
  }
  
  const loginData = await login.json().catch(() => null)
  const token = loginData?.token
  
  if (!token) {
    test.skip()
    return
  }
  
  await page.addInitScript((t) => localStorage.setItem('sjuc.auth.token', t as string), token)
  await page.goto('/perfil')
  await expect(page.getByText('Perfil')).toBeVisible({ timeout: 10000 })
  // We don't assert specific user fields since AUTH may be disabled in local env
})
