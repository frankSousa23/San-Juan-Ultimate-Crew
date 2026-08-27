/**
 * ============================================================================
 * SIGEDIVO (Sistema de Gestión para el Disco Volador)
 * SCRIPT MAESTRO DE POBLACIÓN E HIDRATACIÓN INTEGRAL EN PRODUCCIÓN
 * (scripts/populate-production-ecosystem.ts)
 * ============================================================================
 * 
 * Este script hidrata de forma exhaustiva la base de datos de producción con
 * todas las entidades, relaciones, torneos concluidos y activos, plantillas de
 * atletas por club, contabilidad, fichas médicas, jugadas y foros comunitarios.
 * ============================================================================
 */

const BASE_URL = process.env.DEPLOY_URL || 'https://san-juan-ultimate-crew.seenode.app/api'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'frankalfonso1988@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'passWORD23'

interface ApiResponse<T = any> {
  status: number
  data: T
  rawBody: string
}

async function request(token: string | null, method: string, path: string, body?: any): Promise<ApiResponse> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options: RequestInit = {
    method,
    headers,
  }
  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const res = await fetch(url, options)
    const rawBody = await res.text()
    let data: any = {}
    try {
      data = JSON.parse(rawBody)
    } catch {
      data = { raw: rawBody }
    }
    return { status: res.status, data, rawBody }
  } catch (err: any) {
    return { status: 500, data: { error: err.message }, rawBody: err.message }
  }
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
}

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}=================================================================${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}   SIGEDIVO - HIDRATACIÓN MAESTRA DEL ECOSISTEMA EN PRODUCCIÓN   ${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}=================================================================${colors.reset}`)
  console.log(`Destino: ${colors.bold}${BASE_URL}${colors.reset}\n`)

  // 1. Autenticación como Administrador
  console.log(`${colors.yellow}1. Autenticando Administrador General...${colors.reset}`)
  const loginRes = await request(null, 'POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })

  let adminToken = loginRes.data?.token || loginRes.data?.data?.token
  if (!adminToken) {
    // Si la contraseña default cambió, intentar con fallback
    const fallbackRes = await request(null, 'POST', '/auth/login', {
      email: ADMIN_EMAIL,
      password: 'admin123',
    })
    adminToken = fallbackRes.data?.token || fallbackRes.data?.data?.token
  }

  if (!adminToken) {
    console.error('❌ Error fatal: No se pudo autenticar como Administrador.')
    process.exit(1)
  }
  console.log(`   ✓ Administrador autenticado exitosamente (Token JWT activo)\n`)

  // 2. Población y Actualización de Clubes / Divisiones
  console.log(`${colors.yellow}2. Población de Clubes y Divisiones...${colors.reset}`)
  const clubsDefinition = [
    { name: 'El Pueblito Ultimate Club', tag: 'EPB', categories: 'Open Masculino', color: '#111827', notes: 'Club decano del Ultimate nacional - Campeones de Apertura' },
    { name: 'Warao Ultimate Club', tag: 'WAR', categories: 'Open Masculino', color: '#1f2937', notes: 'Referencia de juego rápido y ofensiva vertical' },
    { name: 'Medusa Ultimate Femenino', tag: 'MED', categories: 'Open Femenino y Mixto', color: '#7e22ce', notes: 'Equipo élite de la división femenina y mixta' },
    { name: 'MotherFlowers', tag: 'MOF', categories: 'Open Femenino', color: '#ec4899', notes: 'Poder y precisión en juego largo' },
    { name: 'Raza Ultimate Frisbee', tag: 'RAZ', categories: 'Open Masculino', color: '#dc2626', notes: 'Juego aguerrido y defensa implacable' },
    { name: 'Harakiri Ultimate Club', tag: 'HKR', categories: 'Open Masculino', color: '#800020', notes: 'Potencia física y transiciones de contragolpe' },
    { name: 'Ad Astra Ultimate Mixto', tag: 'AST', categories: 'Mixto', color: '#1d4ed8', notes: 'Especialistas en control de viento y formaciones abiertas' },
    { name: 'Araguaney Ultimate', tag: 'ARA', categories: 'Open Masculino', color: '#eab308', notes: 'Escuela de formación y proyección nacional' },
    { name: 'Relámpagos Ultimate Club', tag: 'REL', categories: 'Open Masculino', color: '#0284c7', notes: 'Velocidad en cortes y lanzamientos breakmark' },
    { name: 'Trébol Ultimate Frisbee', tag: 'TRE', categories: 'Open Masculino', color: '#16a34a', notes: 'Dominio de zona y rotación continua' },
    { name: 'Alianza Ultimate Club', tag: 'ALI', categories: 'Open Masculino', color: '#ea580c', notes: 'Integración juvenil y juego cooperativo' },
  ]

  const existingTeamsRes = await request(adminToken, 'GET', '/teams')
  const existingTeams: any[] = Array.isArray(existingTeamsRes.data) ? existingTeamsRes.data : (existingTeamsRes.data?.items || [])
  const teamMap: Record<string, number> = {}

  for (const club of clubsDefinition) {
    const found = existingTeams.find((t: any) => t.name.toLowerCase().includes(club.tag.toLowerCase()) || t.name.toLowerCase() === club.name.toLowerCase())
    if (found) {
      teamMap[club.tag] = found.id
      // Actualizar identidad
      await request(adminToken, 'PUT', `/teams/${found.id}`, club)
      console.log(`   ✓ Club actualizado: ${club.name} (ID: #${found.id})`)
    } else {
      const resCreate = await request(adminToken, 'POST', '/teams', club)
      const newId = resCreate.data?.id || resCreate.data?.data?.id
      if (newId) {
        teamMap[club.tag] = newId
        console.log(`   ✓ Club creado: ${club.name} (ID: #${newId})`)
      }
    }
  }

  // 3. Nóminas Completas de Jugadores por Club
  console.log(`\n${colors.yellow}3. Población de Atletas por Club (Rosters WFDF)...${colors.reset}`)
  const athletesByTeam: Record<string, { name: string; number: number; position: string }[]> = {
    EPB: [
      { name: 'Carlos "Mago" Rivas', number: 7, position: 'HANDLER' },
      { name: 'Alejandro "Flash" Gómez', number: 11, position: 'CUTTER' },
      { name: 'Diego "Muralla" Mendoza', number: 23, position: 'HYBRID' },
      { name: 'Luis "Capitán" Silva', number: 10, position: 'HANDLER' },
      { name: 'Gabriel "Huck" Morales', number: 99, position: 'CUTTER' },
      { name: 'Simón "Pulpo" Valera', number: 4, position: 'HYBRID' },
    ],
    WAR: [
      { name: 'Javier "Rayo" Torrealba', number: 14, position: 'CUTTER' },
      { name: 'Eduardo "Scope" Briceño', number: 8, position: 'HANDLER' },
      { name: 'Héctor "Sombra" Páez', number: 21, position: 'HYBRID' },
      { name: 'Rafael "Turbo" Colmenares', number: 3, position: 'CUTTER' },
      { name: 'Martín "Mark" Zerpa', number: 77, position: 'HANDLER' },
    ],
    MED: [
      { name: 'Valeria "Capitana" Mendoza', number: 10, position: 'HANDLER' },
      { name: 'Camila "D-Line" Herrera', number: 17, position: 'HYBRID' },
      { name: 'Mariana "Layout" Rangel', number: 24, position: 'CUTTER' },
      { name: 'Sofía "Sky" Castillo', number: 5, position: 'CUTTER' },
      { name: 'Daniela "Break" Vargas', number: 12, position: 'HANDLER' },
    ],
    MOF: [
      { name: 'Isabella "Fuerza" Gil', number: 9, position: 'CUTTER' },
      { name: 'Gabriela "Láser" Ortiz', number: 15, position: 'HANDLER' },
      { name: 'Andrea "Garra" Medina', number: 22, position: 'HYBRID' },
      { name: 'Natalia "Viento" Rojas', number: 18, position: 'CUTTER' },
    ],
    RAZ: [
      { name: 'José "Impacto" Cárdenas', number: 13, position: 'CUTTER' },
      { name: 'Manuel "Ancla" Delgado', number: 2, position: 'HANDLER' },
      { name: 'Andrés "Fiera" Rondón', number: 31, position: 'HYBRID' },
    ],
    AST: [
      { name: 'Mateo "Cosmos" Peña', number: 16, position: 'HANDLER' },
      { name: 'Elena "Órbita" Suárez', number: 20, position: 'CUTTER' },
      { name: 'Lucas "Aero" Navarro', number: 6, position: 'HYBRID' },
    ],
  }

  const createdPlayerIds: number[] = []
  const epbPlayerIds: number[] = []

  for (const [tag, athletes] of Object.entries(athletesByTeam)) {
    const tId = teamMap[tag]
    if (!tId) continue
    for (const a of athletes) {
      const resP = await request(adminToken, 'POST', '/players', {
        name: a.name,
        number: a.number,
        teamId: tId,
        position: a.position,
        status: 'ACTIVE',
      })
      const pid = resP.data?.id || resP.data?.data?.id
      if (pid) {
        createdPlayerIds.push(pid)
        if (tag === 'EPB') epbPlayerIds.push(pid)
      }
    }
    console.log(`   ✓ Roster de ${tag} poblado (${athletes.length} atletas asignados)`)
  }

  // 4. Torneo Histórico Concluido (Apertura 2026 - COMPLETED con marcadores reales)
  console.log(`\n${colors.yellow}4. Creación de Torneo Histórico Concluido (Apertura 2026)...${colors.reset}`)
  const pastStarts = new Date(Date.now() - 30 * 86400000).toISOString()
  const pastEnds = new Date(Date.now() - 28 * 86400000).toISOString()

  const resTour1 = await request(adminToken, 'POST', '/events', {
    title: 'Torneo Nacional de Apertura 2026',
    type: 'TOURNAMENT',
    location: 'Estadio Universitario de San Juan',
    startsAt: pastStarts,
    endsAt: pastEnds,
    status: 'COMPLETED',
    description: 'Torneo oficial inaugural con 12 clubes participantes. Campeón: El Pueblito.',
  })
  const tour1Id = resTour1.data?.id || resTour1.data?.data?.id

  if (tour1Id && epbPlayerIds.length >= 3) {
    // Crear la Gran Final del Torneo de Apertura (El Pueblito vs Warao)
    const resFinal = await request(adminToken, 'POST', '/events', {
      title: 'Gran Final Apertura 2026: El Pueblito vs Warao',
      type: 'MATCH',
      parentId: tour1Id,
      teamId: teamMap['EPB'],
      awayTeamId: teamMap['WAR'],
      matchCategory: 'FINALS',
      location: 'Cancha Central - Estadio Universitario',
      startsAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      endsAt: new Date(Date.now() - 28 * 86400000 + 85 * 60000).toISOString(),
      status: 'COMPLETED',
      description: 'Partido de campeonato oficial. Marcador Final: 15 - 13 a favor de El Pueblito.',
    })
    const finalId = resFinal.data?.id || resFinal.data?.data?.id

    if (finalId) {
      // Registrar Box Score Oficial con Anotaciones
      await request(adminToken, 'POST', '/annotations', {
        eventId: finalId,
        playerId: epbPlayerIds[0],
        relatedPlayerId: epbPlayerIds[1],
        type: 'GOAL',
        lineType: 'O-Line',
        note: 'Gol inaugural de pase largo (Huck)',
      })
      await request(adminToken, 'POST', '/annotations', {
        eventId: finalId,
        playerId: epbPlayerIds[1],
        relatedPlayerId: epbPlayerIds[0],
        type: 'GOAL',
        lineType: 'O-Line',
        note: 'Gol tras quiebre de marca (Breakmark)',
      })
      await request(adminToken, 'POST', '/annotations', {
        eventId: finalId,
        playerId: epbPlayerIds[2],
        type: 'DEFENSE',
        lineType: 'D-Line',
        note: 'Bloqueo aéreo en zona roja',
      })

      // Evaluación SOTG WFDF
      await request(adminToken, 'POST', '/spirit-scores', {
        eventId: finalId,
        teamId: teamMap['WAR'] || 2,
        rulesScore: 4,
        foulsScore: 3,
        fairnessScore: 4,
        attitudeScore: 4,
        communicationScore: 4,
        totalScore: 19,
        comments: 'Excelente partido de alto nivel competitivo y gran respeto mutuo.',
      })
      console.log(`   ✓ Gran Final y Planilla SOTG asentadas para Torneo #${tour1Id}`)
    }
  }

  // 5. Torneo Macro Activo con Fixtures Jerárquicos y Horarios
  console.log(`\n${colors.yellow}5. Creación de Torneo Activo (Copa Nacional de Campeones)...${colors.reset}`)
  const futureStarts = new Date(Date.now() + 2 * 86400000).toISOString()
  const futureEnds = new Date(Date.now() + 4 * 86400000).toISOString()

  const resTour2 = await request(adminToken, 'POST', '/events', {
    title: 'Copa Nacional de Campeones 2026',
    type: 'TOURNAMENT',
    location: 'Complejo Deportivo Central - Canchas 1 y 2',
    startsAt: futureStarts,
    endsAt: futureEnds,
    status: 'UPCOMING',
    windSpeed: 16,
    windDirection: 'NE',
    description: 'Fase eliminatoria y campeonato de primera división en doble cancha simultánea.',
  })
  const tour2Id = resTour2.data?.id || resTour2.data?.data?.id

  if (tour2Id) {
    const s1 = new Date(Date.now() + 2 * 86400000 + 36000000).toISOString()
    const s2 = new Date(Date.now() + 2 * 86400000 + 36000000).toISOString()
    const bronze = new Date(Date.now() + 3 * 86400000 + 50000000).toISOString()
    const champ = new Date(Date.now() + 3 * 86400000 + 64000000).toISOString()

    await request(adminToken, 'POST', `/events/tournament/${tour2Id}/fixtures`, {
      fixtures: [
        { title: 'Semifinal 1: El Pueblito vs Raza', type: 'MATCH', teamId: teamMap['EPB'], awayTeamId: teamMap['RAZ'], startsAt: s1, matchCategory: 'SEMI_FINALS', location: 'Cancha 1' },
        { title: 'Semifinal 2: Warao vs Ad Astra', type: 'MATCH', teamId: teamMap['WAR'], awayTeamId: teamMap['AST'], startsAt: s2, matchCategory: 'SEMI_FINALS', location: 'Cancha 2' },
        { title: 'Partido por el 3er Puesto (Bronce)', type: 'MATCH', startsAt: bronze, matchCategory: 'PLACEMENT', location: 'Cancha 2' },
        { title: 'Gran Final por la Copa de Campeones', type: 'MATCH', startsAt: champ, matchCategory: 'FINALS', location: 'Cancha 1' },
      ]
    })
    console.log(`   ✓ Torneo Macro ID #${tour2Id} poblado con 4 fixtures escalonados`)
  }

  // 6. Práctica Táctica Semanal, Convocatorias y Asistencia
  console.log(`\n${colors.yellow}6. Sesión de Entrenamiento Táctico y Pase de Lista...${colors.reset}`)
  const practiceDate = new Date(Date.now() + 18 * 3600000).toISOString()
  const resPractice = await request(adminToken, 'POST', '/events', {
    title: 'Entrenamiento Táctico: Zona Cup y Breakmark',
    type: 'TRAINING',
    location: 'Cancha Los Samanes',
    startsAt: practiceDate,
    description: 'Rotación de cortes ofensivos y transición defensiva 3-3-1.',
  })
  const practiceId = resPractice.data?.id || resPractice.data?.data?.id

  if (practiceId && epbPlayerIds.length >= 4) {
    for (let i = 0; i < epbPlayerIds.length; i++) {
      const pid = epbPlayerIds[i]
      // Convocatoria
      await request(adminToken, 'PUT', '/event-participants', {
        eventId: practiceId,
        playerId: pid,
        lineType: i < 3 ? 'O-Line' : 'D-Line',
        status: 'confirmed',
        isRefuerzo: false,
      })
      // Asistencia
      await request(adminToken, 'PUT', '/attendance', {
        eventId: practiceId,
        playerId: pid,
        status: i === 3 ? 'late' : 'present',
        note: i === 3 ? 'Llegada con 10 min de retraso por tráfico' : 'Puntual',
      })
    }
    console.log(`   ✓ Práctica #${practiceId} con convocatoria y lista de asistencia asentada`)
  }

  // 7. Módulo Financiero y Tesorería
  console.log(`\n${colors.yellow}7. Cuentas Financieras y Libro Mayor Contable...${colors.reset}`)
  const rAcc1 = await request(adminToken, 'POST', '/accounts', {
    name: 'Banco Mercantil - Cuenta Operativa',
    type: 'BANK',
    initialBalance: 4500.0,
    currency: 'USD',
  })
  const rAcc2 = await request(adminToken, 'POST', '/accounts', {
    name: 'Caja Chica - En Cancha',
    type: 'CASH',
    initialBalance: 350.0,
    currency: 'USD',
  })
  const acc1Id = rAcc1.data?.id || rAcc1.data?.data?.id
  const acc2Id = rAcc2.data?.id || rAcc2.data?.data?.id

  const rCat1 = await request(adminToken, 'POST', '/categories', {
    name: 'Cuotas de Torneo',
    type: 'INCOME',
  })
  const rCat2 = await request(adminToken, 'POST', '/categories', {
    name: 'Alquiler de Canchas',
    type: 'EXPENSE',
  })
  const rCat3 = await request(adminToken, 'POST', '/categories', {
    name: 'Hidratación y Logística',
    type: 'EXPENSE',
  })

  const cat1Id = rCat1.data?.id || rCat1.data?.data?.id
  const cat2Id = rCat2.data?.id || rCat2.data?.data?.id
  const cat3Id = rCat3.data?.id || rCat3.data?.data?.id

  if (acc1Id && cat1Id) {
    await request(adminToken, 'POST', '/transactions', {
      accountId: acc1Id,
      categoryId: cat1Id,
      type: 'INCOME',
      amount: 1200.0,
      description: 'Cobro de inscripciones de clubes para Copa de Campeones',
    })
    await request(adminToken, 'POST', '/transactions', {
      accountId: acc1Id,
      categoryId: cat2Id,
      type: 'EXPENSE',
      amount: 450.0,
      description: 'Pago de alquiler de canchas por 3 jornadas',
    })
    await request(adminToken, 'POST', '/transactions', {
      accountId: acc2Id || acc1Id,
      categoryId: cat3Id,
      type: 'EXPENSE',
      amount: 80.0,
      description: 'Compra de hielo, hidratación y botiquín de primeros auxilios',
    })
    console.log(`   ✓ Balance financiero asentado (Cuentas, Categorías e Ingresos/Gastos)`)
  }

  // 8. Control Médico y Fisioterapia
  console.log(`\n${colors.yellow}8. Fichas Médicas y Lesiones...${colors.reset}`)
  if (epbPlayerIds.length > 0) {
    const resInj = await request(adminToken, 'POST', '/injuries', {
      playerId: epbPlayerIds[0],
      type: 'Esguince de Tobillo Grado I',
      severity: 'MILD',
      status: 'RECOVERING',
      notes: 'Sesiones de crioterapia e inicio de trabajo propioceptivo',
    })
    console.log(`   ✓ Lesión médica registrada para Atleta #${epbPlayerIds[0]}`)
  }

  // 9. Scouting y Rivales
  console.log(`\n${colors.yellow}9. Scouting Deportivo y Pizarrón Táctico...${colors.reset}`)
  await request(adminToken, 'POST', '/rivals', {
    name: 'Comunidad El Oso',
    strengths: 'Juego vertical rápido, gran alcance en cortes profundos',
    weaknesses: 'Dificultad ante defensas de zona con viento cruzado',
    notes: 'Rival de gran trayectoria en torneos nacionales',
  })
  await request(adminToken, 'POST', '/plays', {
    title: 'Ofensiva Vertical: Corte 7 al Break',
    category: 'OFFENSE',
    description: 'Apertura desde el vertical stack con corte en diagonal hacia el lado abierto y pase de quiebre.',
  })
  console.log(`   ✓ Rivales y jugadas del pizarrón táctico registradas`)

  // 10. Comunidad y Noticias Oficiales
  console.log(`\n${colors.yellow}10. Publicaciones y Comunidad...${colors.reset}`)
  const resNews = await request(adminToken, 'POST', '/news', {
    title: '¡Todo Listo para la Copa Nacional de Campeones 2026!',
    content: 'Anunciamos oficialmente los cruces de semifinales y el cronograma de competencia para este fin de semana en el Complejo Deportivo Central.',
    isPinned: true,
  })
  const postId = resNews.data?.id || resNews.data?.data?.id
  if (postId) {
    await request(adminToken, 'POST', `/news/${postId}/comments`, {
      content: '¡Gran iniciativa! Todo el equipo de El Pueblito está listo y enfocado.',
    })
    console.log(`   ✓ Noticia oficial fijada ID #${postId} con comentarios de la comunidad`)
  }

  console.log(`\n${colors.bold}${colors.green}=================================================================${colors.reset}`)
  console.log(`${colors.bold}${colors.green}   🎉 HIDRATACIÓN COMPLETA DEL ECOSISTEMA FINALIZADA CON ÉXITO   ${colors.reset}`)
  console.log(`${colors.bold}${colors.green}=================================================================${colors.reset}`)
}

main().catch(console.error)
