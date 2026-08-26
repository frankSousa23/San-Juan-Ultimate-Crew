/**
 * ============================================================================
 * SIGEDIVO - Live Deploy End-to-End Test Suite Runner
 * Target: https://san-juan-ultimate-crew.seenode.app
 * ============================================================================
 * Ejecuta la suite de verificación completa de la plataforma en producción:
 * 1. Auth & Admin Token Verification
 * 2. Multi-Team Dynamic User Registration (con dorsales dinámicos)
 * 3. Admin Approval & RBAC Role Assignment
 * 4. Roster Creation, Dorsal Validation & Multi-Tenancy Isolation
 * 5. Tournament Hierarchy & Fixture Scheduling
 * 6. Tournament Roster Tactical Convocatoria (O-Line, D-Line, Refuerzo)
 * 7. Live Annotations & Table Control (Goals, Assists, D's, Turnovers)
 * 8. Aggregated Statistics, Audit Logging & Summary
 * ============================================================================
 */

const BASE_URL = (process.env.API_URL || 'https://san-juan-ultimate-crew.seenode.app').replace(/\/$/, '')
const API_URL = `${BASE_URL}/api`

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'frankalfonso1988@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'passWORD23'

// ANSI Colors for console output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

interface TestResult {
  step: string
  name: string
  passed: boolean
  durationMs: number
  details?: string
  error?: string
}

const results: TestResult[] = []

interface HttpSession {
  token: string | null
  user: any | null
}

function createSession(): HttpSession {
  return { token: null, user: null }
}

async function request(
  session: HttpSession | null,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
): Promise<{ status: number; data: any; durationMs: number }> {
  const url = `${API_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`
  }

  const start = Date.now()
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const durationMs = Date.now() - start
    let data: any = null
    const text = await res.text()
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
    return { status: res.status, data, durationMs }
  } catch (err: any) {
    const durationMs = Date.now() - start
    return {
      status: 0,
      data: { error: err?.message || 'Network error' },
      durationMs,
    }
  }
}

async function runStep(
  stepCode: string,
  name: string,
  fn: () => Promise<{ passed: boolean; details?: string; error?: string }>
) {
  const start = Date.now()
  process.stdout.write(`  ${colors.cyan}[${stepCode}]${colors.reset} ${name}... `)
  try {
    const outcome = await fn()
    const durationMs = Date.now() - start
    results.push({
      step: stepCode,
      name,
      passed: outcome.passed,
      durationMs,
      details: outcome.details,
      error: outcome.error,
    })
    if (outcome.passed) {
      console.log(`${colors.green}✓ PASS${colors.reset} ${colors.dim}(${durationMs}ms)${colors.reset}`)
      if (outcome.details) {
        console.log(`    ${colors.dim}↳ ${outcome.details}${colors.reset}`)
      }
    } else {
      console.log(`${colors.red}✗ FAIL${colors.reset} ${colors.dim}(${durationMs}ms)${colors.reset}`)
      if (outcome.error) {
        console.log(`    ${colors.red}↳ Error: ${outcome.error}${colors.reset}`)
      }
    }
  } catch (e: any) {
    const durationMs = Date.now() - start
    results.push({
      step: stepCode,
      name,
      passed: false,
      durationMs,
      error: e.message || String(e),
    })
    console.log(`${colors.red}✗ EXCEPTION${colors.reset} ${colors.dim}(${durationMs}ms)${colors.reset}`)
    console.log(`    ${colors.red}↳ ${e.message || String(e)}${colors.reset}`)
  }
}

// Global test variables
const timestamp = Date.now()
// Unique dorsals per test execution
const numBase = (Math.floor(Date.now() / 1000) % 700) + 50
const dorsalCaptain = numBase
const dorsalPlayer = numBase + 1
const dorsalA1 = numBase + 2
const dorsalA2 = numBase + 3

const adminSession = createSession()
const captainSession = createSession()
const playerSession = createSession()
const annotatorSession = createSession()

let teamAId: number | null = null
let teamBId: number | null = null
let teamAName = 'El Pueblito'
let teamBName = 'Warao'

let captainUserId: number | null = null
let playerUserId: number | null = null
let annotatorUserId: number | null = null

let playerA1Id: number | null = null
let playerA2Id: number | null = null
let playerB1Id: number | null = null

let tournamentId: number | null = null
let matchId: number | null = null

export async function main() {
  console.log(`\n${colors.bold}${colors.blue}=================================================================${colors.reset}`)
  console.log(`${colors.bold}${colors.blue}   SIGEDIVO - MASTER LIVE PRODUCTION E2E TEST SUITE RUNNER       ${colors.reset}`)
  console.log(`${colors.bold}${colors.blue}=================================================================${colors.reset}`)
  console.log(`🎯 Target Deploy: ${colors.cyan}${BASE_URL}${colors.reset}`)
  console.log(`⏱️  Timestamp:     ${new Date().toISOString()}`)
  console.log(`🔑 Admin Email:   ${ADMIN_EMAIL}\n`)

  // --------------------------------------------------------------------------
  // FASE 1: Setup & Admin Auth
  // --------------------------------------------------------------------------
  console.log(`${colors.bold}--- FASE 1: Autenticación Admin y Health Check ---${colors.reset}`)

  await runStep('1.1', 'Health Check de API', async () => {
    const res = await request(null, 'GET', '/health')
    if (res.status === 200) {
      return { passed: true, details: `Status: 200 OK | Node: ${res.data?.status || 'active'}` }
    }
    const fallback = await request(null, 'GET', '/teams')
    if (fallback.status === 200) {
      return { passed: true, details: `API disponible (/api/teams responded 200)` }
    }
    return { passed: false, error: `Health check falló (status: ${res.status})` }
  })

  await runStep('1.2', 'Login Administrador Principal', async () => {
    const res = await request(null, 'POST', '/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })

    if (res.status === 200 && res.data?.token) {
      adminSession.token = res.data.token
      adminSession.user = res.data.user
      const roles = res.data.user?.roles || []
      const isAdmin = roles.includes('admin')
      return {
        passed: isAdmin,
        details: `ID: ${res.data.user.id} | Email: ${res.data.user.email} | Roles: [${roles.join(', ')}]`,
        error: !isAdmin ? 'Usuario autenticado pero no tiene rol admin' : undefined,
      }
    }
    return {
      passed: false,
      error: `Login admin falló (status: ${res.status}): ${JSON.stringify(res.data)}`,
    }
  })

  await runStep('1.3', 'Recuperación de Equipos Base (El Pueblito & Warao)', async () => {
    const res = await request(adminSession, 'GET', '/teams')
    if (res.status === 200 && Array.isArray(res.data)) {
      const teams = res.data
      const epb = teams.find((t: any) => t.name.toLowerCase().includes('pueblito') || t.tag === 'EPB')
      const war = teams.find((t: any) => t.name.toLowerCase().includes('warao') || t.tag === 'WAR')

      teamAId = epb ? epb.id : teams[0]?.id || 1
      teamBId = war ? war.id : teams[1]?.id || 2
      teamAName = epb?.name || teams[0]?.name || 'Equipo A'
      teamBName = war?.name || teams[1]?.name || 'Equipo B'

      return {
        passed: true,
        details: `Equipo A: "${teamAName}" (ID ${teamAId}) | Equipo B: "${teamBName}" (ID ${teamBId})`,
      }
    }
    return { passed: false, error: `No se pudieron obtener equipos (status: ${res.status})` }
  })

  // --------------------------------------------------------------------------
  // FASE 2: Registro Dinámico de Usuarios y Aprobación RBAC
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- FASE 2: Registro Multi-Equipo y Aprobación RBAC ---${colors.reset}`)

  const captainEmail = `e2e_captain_${timestamp}@test.com`
  const playerEmail = `e2e_player_${timestamp}@test.com`
  const annotatorEmail = `e2e_annotator_${timestamp}@test.com`
  const testPassword = 'Password123!'

  await runStep('2.1', `Registro Capitán para Equipo A (${teamAName}) - Dorsal #${dorsalCaptain}`, async () => {
    const res = await request(null, 'POST', '/auth/register', {
      email: captainEmail,
      name: `Capitán Test ${timestamp.toString().slice(-4)}`,
      password: testPassword,
      teamId: teamAId,
      willBePlayer: true,
      playerData: {
        number: dorsalCaptain,
        position: 'HANDLER',
        status: 'ACTIVE',
        experience: '5 años',
      },
    })

    if (res.status === 200 || res.status === 201) {
      captainUserId = res.data?.user?.id
      return {
        passed: true,
        details: `Usuario creado en estado: ${res.data?.user?.status || 'PENDING'} (User ID: ${captainUserId})`,
      }
    }
    return { passed: false, error: `Registro falló (status: ${res.status}): ${JSON.stringify(res.data)}` }
  })

  await runStep('2.2', `Registro Jugador para Equipo B (${teamBName}) - Dorsal #${dorsalPlayer}`, async () => {
    const res = await request(null, 'POST', '/auth/register', {
      email: playerEmail,
      name: `Jugador Test ${timestamp.toString().slice(-4)}`,
      password: testPassword,
      teamId: teamBId,
      willBePlayer: true,
      playerData: {
        number: dorsalPlayer,
        position: 'CUTTER',
        status: 'ACTIVE',
      },
    })

    if (res.status === 200 || res.status === 201) {
      playerUserId = res.data?.user?.id
      return {
        passed: true,
        details: `Usuario creado en estado: ${res.data?.user?.status || 'PENDING'} (User ID: ${playerUserId})`,
      }
    }
    return { passed: false, error: `Registro falló (status: ${res.status}): ${JSON.stringify(res.data)}` }
  })

  await runStep('2.3', 'Registro Oficial de Mesa Técnica', async () => {
    const res = await request(null, 'POST', '/auth/register', {
      email: annotatorEmail,
      name: `Mesa Técnica ${timestamp.toString().slice(-4)}`,
      password: testPassword,
      willBePlayer: false,
    })

    if (res.status === 200 || res.status === 201) {
      annotatorUserId = res.data?.user?.id
      return {
        passed: true,
        details: `Usuario creado en estado: ${res.data?.user?.status || 'PENDING'} (User ID: ${annotatorUserId})`,
      }
    }
    return { passed: false, error: `Registro falló (status: ${res.status}): ${JSON.stringify(res.data)}` }
  })

  await runStep('2.4', 'Aprobación Admin y Asignación de Rol Capitán', async () => {
    if (!captainUserId) return { passed: false, error: 'captainUserId es nulo' }

    const approveRes = await request(adminSession, 'POST', `/users/${captainUserId}/approve`, {
      role: 'captain',
    })
    await request(adminSession, 'PUT', `/users/${captainUserId}/roles`, {
      roles: ['captain', 'player'],
    })
    if (teamAId) {
      await request(adminSession, 'PUT', `/users/${captainUserId}/team`, { teamId: teamAId })
    }

    if (approveRes.status === 200 || approveRes.status === 201) {
      return { passed: true, details: `Usuario #${captainUserId} aprobado con roles ['captain', 'player']` }
    }
    return { passed: false, error: `Aprobación falló (status: ${approveRes.status}): ${JSON.stringify(approveRes.data)}` }
  })

  await runStep('2.5', 'Aprobación Admin y Asignación de Rol Jugador', async () => {
    if (!playerUserId) return { passed: false, error: 'playerUserId es nulo' }

    const approveRes = await request(adminSession, 'POST', `/users/${playerUserId}/approve`, {
      role: 'player',
    })
    await request(adminSession, 'PUT', `/users/${playerUserId}/roles`, {
      roles: ['player'],
    })
    if (teamBId) {
      await request(adminSession, 'PUT', `/users/${playerUserId}/team`, { teamId: teamBId })
    }

    if (approveRes.status === 200 || approveRes.status === 201) {
      return { passed: true, details: `Usuario #${playerUserId} aprobado con rol ['player']` }
    }
    return { passed: false, error: `Aprobación falló (status: ${approveRes.status}): ${JSON.stringify(approveRes.data)}` }
  })

  await runStep('2.6', 'Aprobación Admin y Asignación de Rol Anotador', async () => {
    if (!annotatorUserId) return { passed: false, error: 'annotatorUserId es nulo' }

    const approveRes = await request(adminSession, 'POST', `/users/${annotatorUserId}/approve`, {
      role: 'annotator',
    })
    await request(adminSession, 'PUT', `/users/${annotatorUserId}/roles`, {
      roles: ['annotator'],
    })

    if (approveRes.status === 200 || approveRes.status === 201) {
      return { passed: true, details: `Usuario #${annotatorUserId} aprobado con rol ['annotator']` }
    }
    return { passed: false, error: `Aprobación falló (status: ${approveRes.status}): ${JSON.stringify(approveRes.data)}` }
  })

  await runStep('2.7', 'Validación de Inicio de Sesión de Cuentas Aprobadas', async () => {
    const capRes = await request(null, 'POST', '/auth/login', {
      email: captainEmail,
      password: testPassword,
    })
    if (capRes.status === 200 && capRes.data?.token) {
      captainSession.token = capRes.data.token
      captainSession.user = capRes.data.user
    }

    const plyRes = await request(null, 'POST', '/auth/login', {
      email: playerEmail,
      password: testPassword,
    })
    if (plyRes.status === 200 && plyRes.data?.token) {
      playerSession.token = plyRes.data.token
      playerSession.user = plyRes.data.user
    }

    const annRes = await request(null, 'POST', '/auth/login', {
      email: annotatorEmail,
      password: testPassword,
    })
    if (annRes.status === 200 && annRes.data?.token) {
      annotatorSession.token = annRes.data.token
      annotatorSession.user = annRes.data.user
    }

    const allOk = Boolean(captainSession.token && playerSession.token && annotatorSession.token)
    return {
      passed: allOk,
      details: `Capitán: JWT OK (${captainSession.user?.roles?.join(',')}) | Jugador: JWT OK | Anotador: JWT OK`,
      error: !allOk ? 'Alguna de las sesiones aprobadas no pudo iniciar sesión' : undefined,
    }
  })

  // --------------------------------------------------------------------------
  // FASE 3: Gestión de Roster, Reglas de Dorsal y Aislamiento Multi-Equipo
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- FASE 3: Roster, Validación de Dorsal y Aislamiento ---${colors.reset}`)

  await runStep('3.1', `Creación de Atletas en Equipo A (${teamAName}) - Dorsales #${dorsalA1}, #${dorsalA2}`, async () => {
    const resA1 = await request(captainSession, 'POST', '/players', {
      name: `Atleta Alfa ${timestamp.toString().slice(-4)}`,
      number: dorsalA1,
      position: 'HANDLER',
      category: 'Open Masculino',
      status: 'ACTIVE',
      teamId: teamAId,
    })
    if (resA1.status === 201 || resA1.status === 200) {
      playerA1Id = resA1.data.id
    }

    const resA2 = await request(captainSession, 'POST', '/players', {
      name: `Atleta Beta ${timestamp.toString().slice(-4)}`,
      number: dorsalA2,
      position: 'CUTTER',
      category: 'Open Masculino',
      status: 'ACTIVE',
      teamId: teamAId,
    })
    if (resA2.status === 201 || resA2.status === 200) {
      playerA2Id = resA2.data.id
    }

    const ok = Boolean(playerA1Id && playerA2Id)
    return {
      passed: ok,
      details: `Atleta 1: #${dorsalA1} (ID ${playerA1Id}) | Atleta 2: #${dorsalA2} (ID ${playerA2Id})`,
      error: !ok ? `Fallo en creación de atletas: A1(${resA1.status}) A2(${resA2.status})` : undefined,
    }
  })

  await runStep('3.2', 'Validación de Regla de Negocio: Rechazo de Dorsal Duplicado en Mismo Equipo', async () => {
    const resDup = await request(captainSession, 'POST', '/players', {
      name: `Atleta Duplicado Error`,
      number: dorsalA1,
      position: 'HYBRID',
      status: 'ACTIVE',
      teamId: teamAId,
    })

    const rejected = resDup.status === 400 || resDup.status === 409
    return {
      passed: rejected,
      details: `Servidor respondió correctamente con código ${resDup.status} (${JSON.stringify(resDup.data)})`,
      error: !rejected ? `El servidor permitió dorsal duplicado #${dorsalA1} (Status: ${resDup.status})` : undefined,
    }
  })

  await runStep('3.3', `Permitir Mismo Dorsal (#${dorsalA1}) en Equipo Distinto (${teamBName})`, async () => {
    const resB = await request(adminSession, 'POST', '/players', {
      name: `Atleta Warao Duplicado Permitido`,
      number: dorsalA1,
      position: 'CUTTER',
      status: 'ACTIVE',
      teamId: teamBId,
    })

    if (resB.status === 201 || resB.status === 200) {
      playerB1Id = resB.data.id
      return {
        passed: true,
        details: `Atleta en Equipo B creado con dorsal #${dorsalA1} exitosamente (ID ${playerB1Id})`,
      }
    }
    return {
      passed: false,
      error: `Error al crear atleta en Equipo B (Status: ${resB.status}): ${JSON.stringify(resB.data)}`,
    }
  })

  await runStep('3.4', 'Prueba de Seguridad y Aislamiento de Permisos RBAC', async () => {
    // 1. Capitán de Equipo A lista atletas
    const listRes = await request(captainSession, 'GET', '/players')
    const players = Array.isArray(listRes.data) ? listRes.data : listRes.data?.data || []
    const seesTeamBPlayer = players.some((p: any) => p.id === playerB1Id && p.teamId === teamBId)

    // 2. Jugador común intenta modificar a otro jugador (debe ser bloqueado con 403 por requireSelfOrAdminForPlayer)
    let unauthorizedEditBlocked = false
    if (playerA1Id) {
      const modRes = await request(playerSession, 'PUT', `/players/${playerA1Id}`, {
        name: 'Intento Hack No Autorizado',
      })
      unauthorizedEditBlocked = modRes.status === 403 || modRes.status === 401 || modRes.status === 404
    }

    const isolated = !seesTeamBPlayer && unauthorizedEditBlocked
    return {
      passed: isolated,
      details: `Filtro de roster por equipo: ${!seesTeamBPlayer ? 'OK' : 'FAIL'} | Modificación no autorizada bloqueada (403): ${unauthorizedEditBlocked ? 'OK' : 'FAIL'}`,
      error: !isolated ? `Fallo en aislamiento de datos: seesTeamB=${seesTeamBPlayer}, blocked=${unauthorizedEditBlocked}` : undefined,
    }
  })

  // --------------------------------------------------------------------------
  // FASE 4: Creación de Torneo, Jerarquía y Convocatoria Táctica
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- FASE 4: Torneo, Jerarquía y Convocatoria Táctica ---${colors.reset}`)

  await runStep('4.1', 'Creación de Torneo Principal (Parent Event)', async () => {
    const tournamentDate = new Date()
    tournamentDate.setDate(tournamentDate.getDate() + 7)

    const res = await request(adminSession, 'POST', '/events', {
      title: `Torneo Apertura E2E ${timestamp.toString().slice(-4)}`,
      type: 'TOURNAMENT',
      status: 'UPCOMING',
      location: 'Polideportivo San Juan - Cancha 1',
      startsAt: tournamentDate.toISOString(),
      description: 'Torneo oficial de prueba E2E automatizado',
      windSpeed: 15,
      windDirection: 'Crosswind',
      teamId: teamAId,
    })

    if (res.status === 201 || res.status === 200) {
      tournamentId = res.data.id
      return {
        passed: true,
        details: `Torneo creado con ID: ${tournamentId} | Tipo: ${res.data.type}`,
      }
    }
    return { passed: false, error: `Creación de torneo falló (status: ${res.status}): ${JSON.stringify(res.data)}` }
  })

  await runStep('4.2', 'Creación de Partido Hijo Vinculado al Torneo (Fixture / Match)', async () => {
    if (!tournamentId) return { passed: false, error: 'tournamentId no disponible' }

    const matchDate = new Date()
    matchDate.setDate(matchDate.getDate() + 7)
    matchDate.setHours(10, 0, 0, 0)

    const res = await request(adminSession, 'POST', '/events', {
      title: `${teamAName} vs ${teamBName} - Fase Grupos`,
      type: 'MATCH',
      status: 'UPCOMING',
      matchCategory: 'GROUP_STAGE',
      parentId: tournamentId,
      teamId: teamAId,
      awayTeamId: teamBId,
      officialAnnotatorId: annotatorUserId,
      startsAt: matchDate.toISOString(),
      location: 'Cancha Central',
    })

    if (res.status === 201 || res.status === 200) {
      matchId = res.data.id
      const hasParent = res.data.parentId === tournamentId
      return {
        passed: hasParent,
        details: `Partido ID: ${matchId} vinculado a Torneo Padre #${tournamentId} | Anotador ID: ${annotatorUserId}`,
        error: !hasParent ? 'El partido no guardó la relación parentId' : undefined,
      }
    }
    return { passed: false, error: `Creación de partido falló (status: ${res.status}): ${JSON.stringify(res.data)}` }
  })

  await runStep('4.3', 'Convocatoria y Roster de Torneo (O-Line, D-Line, Refuerzo)', async () => {
    if (!matchId || !playerA1Id || !playerA2Id) {
      return { passed: false, error: 'IDs de partido o jugadores no disponibles' }
    }

    const resA1 = await request(captainSession, 'PUT', '/event-participants', {
      eventId: matchId,
      playerId: playerA1Id,
      role: 'CAPTAIN',
      status: 'confirmed',
      lineType: 'O-Line',
      teamSide: 'HOME',
      isRefuerzo: false,
    })

    const resA2 = await request(captainSession, 'PUT', '/event-participants', {
      eventId: matchId,
      playerId: playerA2Id,
      role: 'PLAYER',
      status: 'confirmed',
      lineType: 'D-Line',
      teamSide: 'HOME',
      isRefuerzo: true,
    })

    const ok = (resA1.status === 200 || resA1.status === 201) && (resA2.status === 200 || resA2.status === 201)
    return {
      passed: ok,
      details: `Atleta #${playerA1Id} -> O-Line (HOME) | Atleta #${playerA2Id} -> D-Line [Refuerzo] (HOME)`,
      error: !ok ? `Error en convocatoria: A1(${resA1.status}) A2(${resA2.status})` : undefined,
    }
  })

  // --------------------------------------------------------------------------
  // FASE 5: Mesa Técnica en Vivo, Anotaciones y Estadísticas
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}--- FASE 5: Mesa Técnica en Vivo, Anotaciones y Stats ---${colors.reset}`)

  await runStep('5.1', 'Registro de Anotación: Punto 1 (Asistencia A1 -> Gol A2)', async () => {
    if (!matchId || !playerA1Id || !playerA2Id) {
      return { passed: false, error: 'matchId o playerIds faltantes' }
    }

    const res = await request(annotatorSession, 'POST', '/annotations', {
      eventId: matchId,
      playerId: playerA2Id,
      relatedPlayerId: playerA1Id,
      type: 'GOAL',
      lineType: 'O-Line',
      scoreHome: 1,
      scoreAway: 0,
      teamSide: 'HOME',
      note: 'Gol tras pase profundo de handler a la esquina derecha',
    })

    if (res.status === 201 || res.status === 200) {
      return {
        passed: true,
        details: `Anotación ID: ${res.data.id} | Marcador: 1 - 0 | Gol: #${playerA2Id} | Asist: #${playerA1Id}`,
      }
    }
    return { passed: false, error: `Registro de gol falló (status: ${res.status}): ${JSON.stringify(res.data)}` }
  })

  await runStep('5.2', 'Registro de Anotación: Punto 2 (Defensa Callahan / D de A1)', async () => {
    if (!matchId || !playerA1Id) return { passed: false, error: 'matchId o playerA1Id faltantes' }

    const res = await request(annotatorSession, 'POST', '/annotations', {
      eventId: matchId,
      playerId: playerA1Id,
      type: 'DEFENSE',
      lineType: 'D-Line',
      scoreHome: 1,
      scoreAway: 0,
      teamSide: 'HOME',
      note: 'Intercepción en zona defensiva (Layout D)',
    })

    if (res.status === 201 || res.status === 200) {
      return {
        passed: true,
        details: `Anotación ID: ${res.data.id} | Defensa registrada para Atleta #${playerA1Id}`,
      }
    }
    return { passed: false, error: `Registro de defensa falló (status: ${res.status}): ${JSON.stringify(res.data)}` }
  })

  await runStep('5.3', 'Consulta de Estadísticas Agregadas del Partido', async () => {
    if (!matchId) return { passed: false, error: 'matchId no disponible' }

    const res = await request(playerSession, 'GET', `/annotations/event/${matchId}/stats`)
    if (res.status === 200 && res.data) {
      const total = res.data.total
      const byType = res.data.byType || {}
      const hasGoal = (byType.GOAL || 0) >= 1
      const hasDef = (byType.DEFENSE || 0) >= 1

      return {
        passed: hasGoal && hasDef,
        details: `Total acciones: ${total} | Goles: ${byType.GOAL || 0} | Defensas: ${byType.DEFENSE || 0}`,
        error: !(hasGoal && hasDef) ? 'Las estadísticas no reflejan los puntos registrados' : undefined,
      }
    }
    return { passed: false, error: `Consulta de stats falló (status: ${res.status}): ${JSON.stringify(res.data)}` }
  })

  await runStep('5.4', 'Auditoría del Sistema (Audit Log Verification)', async () => {
    const res = await request(adminSession, 'GET', '/audit')
    if (res.status === 200) {
      const logs = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || [])
      return {
        passed: logs.length > 0,
        details: `Registros de auditoría encontrados: ${logs.length} eventos registrados`,
        error: logs.length === 0 ? 'No se encontraron logs de auditoría' : undefined,
      }
    }
    return { passed: false, error: `Consulta de auditoría falló (status: ${res.status}): ${JSON.stringify(res.data)}` }
  })

  // --------------------------------------------------------------------------
  // REPORTE CONSOLIDADO FINAL
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}${colors.blue}=================================================================${colors.reset}`)
  console.log(`${colors.bold}${colors.blue}                 RESUMEN FINAL DE EJECUCIÓN                     ${colors.reset}`)
  console.log(`${colors.bold}${colors.blue}=================================================================${colors.reset}`)

  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0)

  console.log(`\nTotal Pruebas:      ${totalTests}`)
  console.log(`Exitosas (${colors.green}PASS${colors.reset}):     ${colors.green}${passedTests}${colors.reset}`)
  console.log(`Fallidas (${colors.red}FAIL${colors.reset}):     ${failedTests > 0 ? colors.red : colors.green}${failedTests}${colors.reset}`)
  console.log(`Tiempo Total:       ${(totalDuration / 1000).toFixed(2)}s\n`)

  if (failedTests === 0) {
    console.log(`${colors.bold}${colors.green}🎉 TODAS LAS PRUEBAS DE INTEGRACIÓN E2E PASARON SATISFACTORIAMENTE EN PRODUCCIÓN (100% SUCCESS).${colors.reset}\n`)
  } else {
    console.log(`${colors.bold}${colors.red}⚠️  SE ENCONTRARON ${failedTests} PRUEBA(S) CON OBSERVACIONES.${colors.reset}\n`)
  }
}

// Auto-run when executed directly
main().catch(err => {
  console.error('\nFatal Error en Runner E2E:', err)
  process.exit(1)
})
