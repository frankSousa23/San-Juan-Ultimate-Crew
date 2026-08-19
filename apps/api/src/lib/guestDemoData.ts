import jwt from 'jsonwebtoken'
import { Request } from 'express'

export function isGuestRequest(req: Request): boolean {
  const user = (req as any).user
  if (user?.email === 'guest@sigedivo.com') return true
  const roles = (req as any).userRoles
  if (Array.isArray(roles) && roles.includes('guest') && !roles.includes('admin')) return true
  
  // If authorization header has token, inspect token payload
  const auth = req.headers?.authorization || ''
  const [, token] = auth.split(' ')
  if (token) {
    try {
      const decoded = jwt.decode(token) as any
      if (decoded?.email === 'guest@sigedivo.com') return true
    } catch {
      // ignore
    }
  }
  return false
}

// 1. Jugadores de Muestra (Equipo Local)
export const GUEST_PLAYERS = [
  {
    id: 1,
    name: 'Franco Sousa (Capitán)',
    number: 1,
    position: 'HANDLER',
    status: 'ACTIVE',
    heightCm: 182,
    experience: '7 años en el equipo • Especialista en Backhand Huck y visión de campo',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 2,
    name: 'Carlos Mendoza (Capitán Ofensivo)',
    number: 2,
    position: 'CUTTER',
    status: 'ACTIVE',
    heightCm: 185,
    experience: '5 años en el equipo • Corte profundo y recepción en endzone',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 3,
    name: 'Eduardo Silva (Coach Táctico)',
    number: 3,
    position: 'HYBRID',
    status: 'ACTIVE',
    heightCm: 178,
    experience: '8 años en el equipo • Estrategia de zona y manejo de tiempos',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 4,
    name: 'Alejandro Ramos (Armador O-Line)',
    number: 4,
    position: 'HANDLER',
    status: 'ACTIVE',
    heightCm: 175,
    experience: '4 años en el equipo • Pases rápidos de rompimiento (Break mark)',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 5,
    name: 'Gabriel Torres (Cutter Titular)',
    number: 5,
    position: 'CUTTER',
    status: 'ACTIVE',
    heightCm: 188,
    experience: '3 años en el equipo • Dominio aéreo en saltos disputados',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 6,
    name: 'Daniel Salazar (Manejador Secundario)',
    number: 6,
    position: 'HYBRID',
    status: 'ACTIVE',
    heightCm: 180,
    experience: '2 años en el equipo • Agilidad en cortes de descarga',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 7,
    name: 'Marcos Peña (Defensa D-Line)',
    number: 7,
    position: 'CUTTER',
    status: 'ACTIVE',
    heightCm: 183,
    experience: '4 años en el equipo • Especialista en bloqueo defensivo (Layout D)',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 8,
    name: 'Luis Navarro (Lanzador Largo)',
    number: 8,
    position: 'HANDLER',
    status: 'ACTIVE',
    heightCm: 176,
    experience: '5 años en el equipo • Lanzamientos Hammer y Scoober de precisión',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 9,
    name: 'Roberto Álvarez (Cortador Medio)',
    number: 9,
    position: 'HYBRID',
    status: 'ACTIVE',
    heightCm: 181,
    experience: '3 años en el equipo • Continuidad de juego en Vert Stack',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 10,
    name: 'Valentina Rojas (Capitana Femenina)',
    number: 10,
    position: 'HANDLER',
    status: 'ACTIVE',
    heightCm: 170,
    experience: '6 años en el equipo • Precisión en lanzamientos Inside-Out y liderazgo',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 11,
    name: 'Sofía Castillo (Cutter Rápido)',
    number: 11,
    position: 'CUTTER',
    status: 'ACTIVE',
    heightCm: 168,
    experience: '4 años en el equipo • Velocidad y desmarques en línea de banda',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
  {
    id: 12,
    name: 'Diego Hurtado (Defensa de Copa)',
    number: 12,
    position: 'CUTTER',
    status: 'INJURED',
    heightCm: 184,
    experience: '3 años en el equipo • Marcación de presión en copa defensiva',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z'),
  },
]

// 2. Eventos de Muestra
const now = new Date()
export const GUEST_EVENTS = [
  {
    id: 101,
    title: 'Torneo Nacional de Ultimate 2026 - Gran Final vs Dragones de Valencia',
    description: 'Partido oficial de final del Torneo Apertura. Victoria épica de nuestro equipo 15 a 13.',
    type: 'TOURNAMENT',
    status: 'COMPLETED',
    location: 'Complejo Deportivo Central • Cancha 1',
    startsAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
    endsAt: new Date(now.getTime() - 86400000 * 4 + 7200000).toISOString(),
    windSpeed: 14,
    windDirection: 'NE',
    matchCategory: 'FINALS',
    rivalId: 202,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  },
  {
    id: 102,
    title: 'Entrenamiento Táctico - Ofensiva Vertical & Swing Rápido',
    description: 'Sesión intensiva de cortes primarios, swings a campo abierto y defensa hombre a hombre.',
    type: 'TRAINING',
    status: 'COMPLETED',
    location: 'Cancha Principal • Sede Norte',
    startsAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    endsAt: new Date(now.getTime() - 86400000 * 2 + 7200000).toISOString(),
    windSpeed: 10,
    windDirection: 'E',
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  },
  {
    id: 103,
    title: 'Torneo Regional Centro 2026 - Semifinal vs Caracas Ultimate',
    description: 'Encuentro clasificatorio para el Campeonato Nacional. Se jugará con marcación Force Sideline.',
    type: 'TOURNAMENT',
    status: 'UPCOMING',
    location: 'Parque Deportivo Los Samanes • Cancha Principal',
    startsAt: new Date(now.getTime() + 86400000 * 3).toISOString(),
    endsAt: new Date(now.getTime() + 86400000 * 3 + 9000000).toISOString(),
    windSpeed: 18,
    windDirection: 'N',
    matchCategory: 'SEMI_FINALS',
    rivalId: 201,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  },
  {
    id: 104,
    title: 'Clínica Táctica de Lanzamientos y Defensa de Zona',
    description: 'Taller abierto para el perfeccionamiento de lanzamientos largos con viento y posicionamiento en copa 3-3-1.',
    type: 'WORKSHOP',
    status: 'UPCOMING',
    location: 'Cancha • Sede Norte',
    startsAt: new Date(now.getTime() + 86400000 * 7).toISOString(),
    endsAt: new Date(now.getTime() + 86400000 * 7 + 10800000).toISOString(),
    windSpeed: 8,
    windDirection: 'SE',
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  },
]

// 3. Participantes de Eventos de Muestra
export const GUEST_EVENT_PARTICIPANTS = GUEST_EVENTS.flatMap(ev =>
  GUEST_PLAYERS.map(pl => ({
    eventId: ev.id,
    playerId: pl.id,
    role: pl.number <= 2 ? 'CAPTAIN' : pl.number === 3 ? 'COACH' : 'PLAYER',
    status: pl.id === 12 ? 'declined' : 'confirmed',
    lineType: [1, 2, 4, 5, 8, 10].includes(pl.id) ? 'O-Line' : 'D-Line',
    player: pl,
  }))
)

// 4. Asistencias de Muestra (para eventos completados 101 y 102)
export const GUEST_ATTENDANCES = [
  ...GUEST_PLAYERS.map(pl => ({
    id: pl.id,
    eventId: 101,
    playerId: pl.id,
    status: pl.id === 12 ? 'absent' : pl.id === 6 ? 'late' : 'present',
    note: pl.id === 12 ? 'Baja por lesión de tobillo' : pl.id === 6 ? 'Llegada 10 min tarde por tráfico' : null,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    player: pl,
  })),
  ...GUEST_PLAYERS.map(pl => ({
    id: 100 + pl.id,
    eventId: 102,
    playerId: pl.id,
    status: pl.id === 12 ? 'absent' : 'present',
    note: pl.id === 12 ? 'En rehabilitación con kinesiólogo' : null,
    createdAt: new Date('2025-01-17T10:00:00Z'),
    player: pl,
  })),
]

// 5. Rivales de Muestra
export const GUEST_RIVALS = [
  {
    id: 201,
    name: 'Caracas Ultimate Club',
    strengths: 'Lanzadores zurdos rápidos, cortes largos a campo abierto (Huck game fluido)',
    weaknesses: 'Dificultad para salir de defensa de zona con viento cruzado',
    lastPlayedAt: new Date(now.getTime() - 86400000 * 20).toISOString(),
    notes: 'Rival histórico tradicional. Clave marcar force backhand y cerrar línea cerrada.',
    createdAt: new Date('2025-01-05T10:00:00Z'),
  },
  {
    id: 202,
    name: 'Dragones de Valencia',
    strengths: 'Físico imponente, dominio aéreo en zona de gol, atleticismo en defensa',
    weaknesses: 'Transiciones lentas luego de sufrir un turnover defensivo',
    lastPlayedAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
    notes: 'Equipo muy físico. Se les ganó la final 15-13 con paciencia en swings cortos.',
    createdAt: new Date('2025-01-05T10:00:00Z'),
  },
  {
    id: 203,
    name: 'Fénix Ultimate (Aragua)',
    strengths: 'Marcación hombre a hombre muy asfixiante, intensidad alta los primeros 30 min',
    weaknesses: 'Poco recambio en banca, bajan el rendimiento físico en la segunda mitad',
    lastPlayedAt: new Date(now.getTime() - 86400000 * 45).toISOString(),
    notes: 'Explotar la rotación del disco rápido para desgastar a sus marcadores titulares.',
    createdAt: new Date('2025-01-05T10:00:00Z'),
  },
]

export const GUEST_RIVAL_PLAYERS = [
  { id: 1, rivalId: 202, name: 'Marcos Benítez (Capitán Dragones)', number: 10, position: 'HANDLER' },
  { id: 2, rivalId: 202, name: 'Andrés Gil (Cutter Principal)', number: 7, position: 'CUTTER' },
  { id: 3, rivalId: 201, name: 'Sebastián Lugo (Handler Zurdo)', number: 11, position: 'HANDLER' },
]

// 6. Anotaciones del Partido de Final (Evento 101 - Equipo Local 15 vs Dragones 13)
export const GUEST_EVENT_ANNOTATIONS = [
  {
    id: 1,
    eventId: 101,
    playerId: 2, // Carlos Mendoza (Goal)
    relatedPlayerId: 1, // Franco Sousa (Assist)
    type: 'GOAL',
    lineType: 'O-Line',
    scoreHome: 1,
    scoreAway: 0,
    note: 'Huck largo de Franco Sousa recibido por Carlos Mendoza en la esquina derecha de la endzone.',
    timestamp: new Date(now.getTime() - 86400000 * 4 + 300000).toISOString(),
    player: GUEST_PLAYERS[1],
  },
  {
    id: 2,
    eventId: 101,
    playerId: 1, // Franco Sousa (Assist)
    type: 'ASSIST',
    lineType: 'O-Line',
    scoreHome: 1,
    scoreAway: 0,
    note: 'Pase perfecto de 40 yardas que rompió la marcación.',
    timestamp: new Date(now.getTime() - 86400000 * 4 + 300000).toISOString(),
    player: GUEST_PLAYERS[0],
  },
  {
    id: 3,
    eventId: 101,
    playerId: 7, // Marcos Peña (Defense)
    type: 'DEFENSE',
    lineType: 'D-Line',
    scoreHome: 1,
    scoreAway: 1,
    note: 'Layout D espectacular interceptando el pase de Dragones.',
    timestamp: new Date(now.getTime() - 86400000 * 4 + 900000).toISOString(),
    player: GUEST_PLAYERS[6],
  },
  {
    id: 4,
    eventId: 101,
    playerId: 5, // Gabriel Torres (Goal)
    relatedPlayerId: 10, // Valentina Rojas (Assist)
    type: 'GOAL',
    lineType: 'O-Line',
    scoreHome: 8,
    scoreAway: 7,
    note: 'Punto de descanso (Halftime) concretado con corte hacia adelante.',
    timestamp: new Date(now.getTime() - 86400000 * 4 + 3600000).toISOString(),
    player: GUEST_PLAYERS[4],
  },
  {
    id: 5,
    eventId: 101,
    playerId: 1, // Franco Sousa (Goal del Campeonato)
    relatedPlayerId: 2, // Carlos Mendoza (Assist)
    type: 'GOAL',
    lineType: 'O-Line',
    scoreHome: 15,
    scoreAway: 13,
    note: '¡Punto de Campeonato! Franco Sousa atrapa el disco en doble marca y sella la victoria 15-13.',
    timestamp: new Date(now.getTime() - 86400000 * 4 + 6800000).toISOString(),
    player: GUEST_PLAYERS[0],
  },
]

// 7. Estadísticas de Jugadores de Muestra (Torneo / Match Stats)
export const GUEST_MATCH_STATS = [
  {
    id: 1,
    playerId: 1,
    playerName: 'Franco Sousa (Capitán)',
    playerNumber: 1,
    eventId: 101,
    goals: 4,
    assists: 5,
    defenses: 2,
    turnovers: 1,
    drops: 0,
    pointsPlayed: 18,
  },
  {
    id: 2,
    playerId: 2,
    playerName: 'Carlos Mendoza (Capitán Ofensivo)',
    playerNumber: 2,
    eventId: 101,
    goals: 5,
    assists: 3,
    defenses: 1,
    turnovers: 2,
    drops: 1,
    pointsPlayed: 17,
  },
  {
    id: 3,
    playerId: 3,
    playerName: 'Eduardo Silva (Coach Táctico)',
    playerNumber: 3,
    eventId: 101,
    goals: 1,
    assists: 3,
    defenses: 3,
    turnovers: 0,
    drops: 0,
    pointsPlayed: 15,
  },
  {
    id: 4,
    playerId: 4,
    playerName: 'Alejandro Ramos (Armador O-Line)',
    playerNumber: 4,
    eventId: 101,
    goals: 0,
    assists: 2,
    defenses: 1,
    turnovers: 1,
    drops: 0,
    pointsPlayed: 14,
  },
  {
    id: 5,
    playerId: 5,
    playerName: 'Gabriel Torres (Cutter Titular)',
    playerNumber: 5,
    eventId: 101,
    goals: 3,
    assists: 1,
    defenses: 1,
    turnovers: 0,
    drops: 0,
    pointsPlayed: 16,
  },
  {
    id: 6,
    playerId: 7,
    playerName: 'Marcos Peña (Defensa D-Line)',
    playerNumber: 7,
    eventId: 101,
    goals: 1,
    assists: 0,
    defenses: 4,
    turnovers: 1,
    drops: 0,
    pointsPlayed: 19,
  },
  {
    id: 7,
    playerId: 10,
    playerName: 'Valentina Rojas (Capitana Femenina)',
    playerNumber: 10,
    eventId: 101,
    goals: 1,
    assists: 1,
    defenses: 2,
    turnovers: 0,
    drops: 0,
    pointsPlayed: 16,
  },
]

// 8. Playbook Táctico de Muestra
export const GUEST_PLAYS = [
  {
    id: 301,
    name: 'Vertical Stack - Break Flow',
    category: 'OFFENSE',
    description: 'Ataque clásico en pila vertical. Los 3 handlers dominan el centro del campo y el último cortador rompe hacia el lado cerrado (break side) con opción de swing veloz para abrir el campo.',
    createdAt: new Date('2025-01-08T10:00:00Z'),
    updatedAt: new Date('2025-01-08T10:00:00Z'),
  },
  {
    id: 302,
    name: 'Horizontal Stack - Doble Corte Central',
    category: 'OFFENSE',
    description: 'Formación horizontal con 3 handlers y 4 cortadores en línea abierta. Genera amplios pasillos centrales para cortes diagonales de ganancia media (under cuts) o lanzamientos largos.',
    createdAt: new Date('2025-01-08T10:00:00Z'),
    updatedAt: new Date('2025-01-08T10:00:00Z'),
  },
  {
    id: 303,
    name: 'Defensa de Zona 3-3-1 (Cup)',
    category: 'DEFENSE',
    description: 'Estrategia defensiva de copa con 3 jugadores presionando al lanzador para atraparlo en línea de banda, 3 alas en zona intermedia conteniendo swings y 1 profundo (deep deep) cuidando el huck largo.',
    createdAt: new Date('2025-01-08T10:00:00Z'),
    updatedAt: new Date('2025-01-08T10:00:00Z'),
  },
  {
    id: 304,
    name: 'Force Sideline & Trap Defensivo',
    category: 'DEFENSE',
    description: 'Marcación hombre a hombre forzando hacia la línea de banda. En los últimos 10 metros se cierra la trampa para forzar tiros disputados o generar turnovers por conteo de stall.',
    createdAt: new Date('2025-01-08T10:00:00Z'),
    updatedAt: new Date('2025-01-08T10:00:00Z'),
  },
  {
    id: 305,
    name: 'Drill de Endzone 3v3 con Alta Presión',
    category: 'DRILL',
    description: 'Ejercicio de espacio reducido en los últimos 15 metros para practicar cortes en L, desmarques rápidos y lanzamientos de descarga con conteo rápido de 5 segundos.',
    createdAt: new Date('2025-01-08T10:00:00Z'),
    updatedAt: new Date('2025-01-08T10:00:00Z'),
  },
]

// 9. Reportes Médicos / Lesiones de Muestra
export const GUEST_INJURIES = [
  {
    id: 401,
    playerId: 12,
    type: 'Esguince de Tobillo Grado II',
    severity: 'MODERATE',
    status: 'RECOVERING',
    startDate: new Date(now.getTime() - 86400000 * 12).toISOString(),
    endDate: new Date(now.getTime() + 86400000 * 10).toISOString(),
    description: 'Torcedura durante el entrenamiento en cambio de dirección. Actualmente en fase de fortalecimiento con kinesiólogo y trabajo en piscina.',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    player: GUEST_PLAYERS[11],
  },
]

// 10. Recursos y Manuales de Muestra
export const GUEST_RESOURCES = [
  {
    id: 501,
    title: '📘 Manual del Usuario y Guía de Operaciones SIGEDIVO (PDF Oficial)',
    category: 'Manuales y Operaciones',
    description: 'Manual completo interactivo con la matriz de roles y permisos, arquitectura y explicación detallada con capturas de pantalla de todas las vistas del sistema.',
    url: '#manual-viewer',
    fileName: 'Manual_Completo_SIGEDIVO_2026.pdf',
    mimeType: 'application/pdf',
    size: 2854000,
    createdAt: new Date('2025-01-01T10:00:00Z'),
  },
  {
    id: 502,
    title: 'Reglamento Oficial WFDF Ultimate 2025-2028',
    category: 'Reglamento',
    description: 'Reglamento traducido oficial de la Federación Mundial de Disco Volador con las últimas actualizaciones de reglas de juego.',
    url: 'https://rules.wfdf.org',
    fileName: 'Reglamento_WFDF_2025.pdf',
    mimeType: 'application/pdf',
    size: 1450000,
    createdAt: new Date('2025-01-01T10:00:00Z'),
  },
  {
    id: 503,
    title: 'Guía de Espíritu de Juego (SOTG) y Rúbrica de Puntuación',
    category: 'Espíritu de Juego',
    description: 'Criterios y rúbrica oficial para evaluación del Spirit of the Game en torneos federados.',
    url: 'https://spirit.wfdf.org',
    fileName: 'Guia_SOTG_Oficial.pdf',
    mimeType: 'application/pdf',
    size: 890000,
    createdAt: new Date('2025-01-01T10:00:00Z'),
  },
  {
    id: 504,
    title: 'Plan de Preparación Física y Prevención de Lesiones',
    category: 'Entrenamiento Físico',
    description: 'Rutina de movilidad articular, pliometría y fortalecimiento de tren inferior diseñada para jugadores de Ultimate.',
    url: 'https://ultimatefrisbee.org/training-plan',
    fileName: 'Preparacion_Fisica_Ultimate.pdf',
    mimeType: 'application/pdf',
    size: 1120000,
    createdAt: new Date('2025-01-01T10:00:00Z'),
  },
]
