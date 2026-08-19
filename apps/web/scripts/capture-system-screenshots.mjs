import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:4000'
const OUTPUT_DIR = path.resolve('..', '..', 'docs', 'images')

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function captureAll() {
  console.log('📸 Iniciando captura con rutas oficiales en español...')

  const adminLoginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'frankalfonso1988@gmail.com', password: '123456' })
  })
  const adminData = await adminLoginRes.json()
  const adminToken = adminData.token
  const adminUser = JSON.stringify(adminData.user)

  const captainLoginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'captain@sigedivo.com', password: '123456' })
  })
  const captainData = await captainLoginRes.json()
  const captainToken = captainData.token
  const captainUser = JSON.stringify(captainData.user)

  const browser = await chromium.launch({ headless: true })
  
  // 0. LOGIN
  console.log('  -> Capturando 00_login.png...')
  const anonContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  const loginPage = await anonContext.newPage()
  await loginPage.goto(`${BASE_URL}/login`)
  await loginPage.waitForTimeout(1000)
  await loginPage.screenshot({ path: path.join(OUTPUT_DIR, '00_login.png') })
  await anonContext.close()

  // CONTEXTO AUTENTICADO COMO ADMIN
  const authContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  await authContext.addInitScript(({ token, user }) => {
    localStorage.setItem('sigedivo.auth.token', token)
    localStorage.setItem('token', token)
    localStorage.setItem('user', user)
  }, { token: adminToken, user: adminUser })

  const page = await authContext.newPage()

  // 1. DASHBOARD
  console.log('  -> Capturando 01_dashboard.png...')
  await page.goto(`${BASE_URL}/`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_dashboard.png') })

  // 2. ROSTER / JUGADORES
  console.log('  -> Capturando 02_roster.png...')
  await page.goto(`${BASE_URL}/roster`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_roster.png') })

  // 3. ANOTACIONES SELECTOR
  console.log('  -> Capturando 03_anotaciones_selector.png...')
  await page.goto(`${BASE_URL}/anotaciones`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_anotaciones_selector.png') })

  // 4. EVENTOS Y TORNEOS
  console.log('  -> Capturando 04_eventos_torneos.png...')
  await page.goto(`${BASE_URL}/eventos`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_eventos_torneos.png') })

  // 5. FINANZAS
  console.log('  -> Capturando 05_finanzas.png...')
  await page.goto(`${BASE_URL}/finanzas`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_finanzas.png') })

  // 6. LESIONES
  console.log('  -> Capturando 06_lesiones.png...')
  await page.goto(`${BASE_URL}/lesiones`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_lesiones.png') })

  // 7. JUGADAS
  console.log('  -> Capturando 07_jugadas_tacticas.png...')
  await page.goto(`${BASE_URL}/jugadas`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_jugadas_tacticas.png') })

  // 8. RIVALES
  console.log('  -> Capturando 08_scouting_rivales.png...')
  await page.goto(`${BASE_URL}/rivales`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_scouting_rivales.png') })

  // 9. COMUNICACIONES
  console.log('  -> Capturando 09_comunicaciones.png...')
  await page.goto(`${BASE_URL}/comunicacion`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_comunicaciones.png') })

  // 10. ESTADÍSTICAS
  console.log('  -> Capturando 10_estadisticas.png...')
  await page.goto(`${BASE_URL}/estadisticas`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_estadisticas.png') })

  // 11. RECURSOS
  console.log('  -> Capturando 11_recursos.png...')
  await page.goto(`${BASE_URL}/recursos`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_recursos.png') })

  // 12. ADMIN USUARIOS
  console.log('  -> Capturando 12_admin_usuarios.png...')
  await page.goto(`${BASE_URL}/admin/usuarios`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_admin_usuarios.png') })

  // 13. SWAGGER UI
  console.log('  -> Capturando 13_swagger_api.png...')
  await page.goto(`${API_URL}/api-docs/`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_swagger_api.png') })

  // 14. VISTA MÓVIL TÁCTIL (iPhone 14)
  console.log('  -> Capturando 14_anotaciones_movil_tactil.png...')
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true
  })
  await mobileContext.addInitScript(({ token, user }) => {
    localStorage.setItem('sigedivo.auth.token', token)
    localStorage.setItem('token', token)
    localStorage.setItem('user', user)
  }, { token: captainToken, user: captainUser })

  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto(`${BASE_URL}/anotaciones`)
  await mobilePage.waitForTimeout(1500)
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '14_anotaciones_movil_tactil.png') })

  await browser.close()
  console.log('🎉 ¡Todas las capturas de pantalla se generaron con éxito!')
}

captureAll().catch(err => {
  console.error('Error generando capturas:', err)
  process.exit(1)
})
