import jwt from 'jsonwebtoken'
import { Request } from 'express'

export function isGuestRequest(req: Request): boolean {
  const user = (req as any).user
  if (user?.email === 'guest@sigedivo.com') return true

  const roles = (req as any).userRoles
  if (Array.isArray(roles) && roles.includes('guest') && !roles.includes('admin')) return true
  
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

const now = new Date()

export const GUEST_PLAYERS = [
  { id: 1, name: 'Franco Sousa', number: 1, position: 'HANDLER', status: 'ACTIVE', heightCm: 182, experience: 'Capitán • Especialista en pase largo de revés', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 2, name: 'Carlos Mendoza', number: 2, position: 'CUTTER', status: 'ACTIVE', heightCm: 185, experience: 'Capitán Ofensivo • Cortes profundos', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 3, name: 'Eduardo Silva', number: 3, position: 'HANDLER', status: 'ACTIVE', heightCm: 178, experience: 'Coach Táctico', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 4, name: 'Alejandro Ramos', number: 4, position: 'HANDLER', status: 'ACTIVE', heightCm: 175, experience: 'Armador Línea O', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 5, name: 'Gabriel Torres', number: 5, position: 'CUTTER', status: 'ACTIVE', heightCm: 188, experience: 'Cutter Titular', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 6, name: 'Luis Navarro', number: 6, position: 'CUTTER', status: 'INACTIVE', heightCm: 180, experience: 'Descanso temporal', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 7, name: 'Marcos Peña', number: 7, position: 'CUTTER', status: 'ACTIVE', heightCm: 190, experience: 'Defensa Línea D', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 8, name: 'Andrés Gil', number: 8, position: 'HANDLER', status: 'ACTIVE', heightCm: 176, experience: 'Línea D Handler', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 9, name: 'Diego Ríos', number: 9, position: 'CUTTER', status: 'ACTIVE', heightCm: 184, experience: 'Especialista en planchas', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 10, name: 'Valentina Rojas', number: 10, position: 'HANDLER', status: 'ACTIVE', heightCm: 168, experience: 'Capitana Femenina', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 11, name: 'Camila Pineda', number: 11, position: 'CUTTER', status: 'ACTIVE', heightCm: 172, experience: 'Cutter agresiva', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 12, name: 'Javier Cárdenas', number: 12, position: 'HANDLER', status: 'INJURED', heightCm: 179, experience: 'Esguince tobillo', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 13, name: 'Sebastián Lugo', number: 13, position: 'CUTTER', status: 'ACTIVE', heightCm: 186, experience: 'Buen salto vertical', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 14, name: 'Mariana López', number: 14, position: 'CUTTER', status: 'ACTIVE', heightCm: 165, experience: 'Velocidad y resistencia', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 15, name: 'Ricardo Sanz', number: 15, position: 'HANDLER', status: 'ACTIVE', heightCm: 181, experience: 'Lanzamientos largos', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 16, name: 'Tomás Rivera', number: 16, position: 'CUTTER', status: 'ACTIVE', heightCm: 174, experience: 'Novato estrella', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 17, name: 'Daniela Castro', number: 17, position: 'HANDLER', status: 'ACTIVE', heightCm: 170, experience: 'Dominio de dump', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 18, name: 'Fernando Ruiz', number: 18, position: 'CUTTER', status: 'ACTIVE', heightCm: 183, experience: 'Cutter profundo', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 19, name: 'Andrea Gómez', number: 19, position: 'CUTTER', status: 'ACTIVE', heightCm: 169, experience: 'Marcación estricta', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 20, name: 'Héctor Mora', number: 20, position: 'HANDLER', status: 'ACTIVE', heightCm: 177, experience: 'Armador seguro', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 21, name: 'Lucía Fernández', number: 21, position: 'CUTTER', status: 'INJURED', heightCm: 171, experience: 'Lesión de rodilla', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 22, name: 'Martín Paredes', number: 22, position: 'HANDLER', status: 'ACTIVE', heightCm: 180, experience: 'Línea O', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
]

export const GUEST_EVENTS = [
  { id: 101, title: 'Final - Copa Nacional Ultimate 2026', type: 'MATCH', date: new Date(now.getTime() - 86400000 * 4).toISOString(), time: '14:00', location: 'Estadio Nacional', status: 'COMPLETED', createdAt: new Date('2025-01-08T10:00:00Z') },
  { id: 102, title: 'Entrenamiento Táctico Avanzado (Línea O vs Línea D)', type: 'TRAINING', date: new Date(now.getTime() - 86400000 * 2).toISOString(), time: '18:30', location: 'Cancha Central', status: 'COMPLETED', createdAt: new Date('2025-01-08T10:00:00Z') },
  { id: 103, title: 'Torneo Relámpago - Fase de Grupos', type: 'TOURNAMENT', date: new Date(now.getTime() - 86400000 * 15).toISOString(), time: '09:00', location: 'Complejo Deportivo', status: 'COMPLETED', createdAt: new Date('2025-01-08T10:00:00Z') },
  { id: 104, title: 'Full Day Mixto de Integración', type: 'FULL_DAY_MIXTO', date: new Date(now.getTime() - 86400000 * 8).toISOString(), time: '08:00', location: 'Parque Recreacional', status: 'COMPLETED', createdAt: new Date('2025-01-08T10:00:00Z') },
  { id: 105, title: 'Amistoso Preparatorio vs. Cóndores', type: 'MATCH', date: new Date(now.getTime() - 86400000 * 20).toISOString(), time: '16:00', location: 'Cancha Sur', status: 'COMPLETED', createdAt: new Date('2025-01-08T10:00:00Z') },
  { id: 106, title: 'Entrenamiento Físico y Pliometría', type: 'TRAINING', date: new Date(now.getTime() - 86400000 * 22).toISOString(), time: '19:00', location: 'Gimnasio del Club', status: 'COMPLETED', createdAt: new Date('2025-01-08T10:00:00Z') },
  { id: 107, title: 'Reunión de Directiva y Finanzas', type: 'SOCIAL', date: new Date(now.getTime() - 86400000 * 1).toISOString(), time: '20:00', location: 'Sede Principal', status: 'COMPLETED', createdAt: new Date('2025-01-08T10:00:00Z') },
  { id: 108, title: 'Próximo Partido Oficial - Liga Regional', type: 'MATCH', date: new Date(now.getTime() + 86400000 * 5).toISOString(), time: '15:00', location: 'Estadio Este', status: 'SCHEDULED', createdAt: new Date('2025-01-08T10:00:00Z') },
  { id: 109, title: 'Taller de Lanzamientos (Manejadores)', type: 'WORKSHOP', date: new Date(now.getTime() - 86400000 * 30).toISOString(), time: '10:00', location: 'Cancha Central', status: 'COMPLETED', createdAt: new Date('2025-01-08T10:00:00Z') },
  { id: 110, title: 'Full Day Open', type: 'FULL_DAY_OPEN', date: new Date(now.getTime() + 86400000 * 12).toISOString(), time: '07:30', location: 'Complejo Norte', status: 'SCHEDULED', createdAt: new Date('2025-01-08T10:00:00Z') },
]

export const GUEST_EVENT_PARTICIPANTS: any[] = []
GUEST_EVENTS.forEach(ev => {
  GUEST_PLAYERS.forEach(pl => {
    if (pl.status === 'ACTIVE') {
      // Arbitrary math to spread participants out realistically
      if ((ev.id + pl.id) % 3 !== 0) { 
        GUEST_EVENT_PARTICIPANTS.push({
          id: ev.id * 1000 + pl.id,
          eventId: ev.id,
          playerId: pl.id,
          player: pl
        })
      }
    }
  })
})

export const GUEST_ATTENDANCES: any[] = []
GUEST_EVENTS.forEach(ev => {
  if (ev.status === 'COMPLETED') {
    GUEST_PLAYERS.forEach(pl => {
      if (pl.status === 'ACTIVE') {
        if ((ev.id * pl.id) % 4 !== 0) { 
          GUEST_ATTENDANCES.push({
            eventId: ev.id,
            playerId: pl.id,
            status: 'PRESENT',
            player: pl
          })
        }
      }
    })
  }
})

export const GUEST_RIVALS = [
  { id: 201, name: 'Dragones Ultimate Club', strength: 'Fuerte, juego aéreo rápido', color: '#B91C1C', createdAt: new Date('2025-01-05T10:00:00Z') },
  { id: 202, name: 'Cóndores Voladores', strength: 'Defensa en zona muy cerrada', color: '#1D4ED8', createdAt: new Date('2025-01-05T10:00:00Z') },
  { id: 203, name: 'Tiburones de la Bahía', strength: 'Manejadores muy precisos', color: '#047857', createdAt: new Date('2025-01-05T10:00:00Z') },
  { id: 204, name: 'Relámpagos Mixto', strength: 'Equipo mixto equilibrado', color: '#D97706', createdAt: new Date('2025-01-05T10:00:00Z') },
]

export const GUEST_RIVAL_PLAYERS = [
  { id: 1, rivalId: 201, name: 'Alejandro Vargas (MVP)', number: 10, position: 'CUTTER' },
  { id: 2, rivalId: 201, name: 'Andrés Gil (Cortador Principal)', number: 7, position: 'CUTTER' },
  { id: 3, rivalId: 201, name: 'Sebastián Lugo (Manejador Zurdo)', number: 11, position: 'HANDLER' },
  { id: 4, rivalId: 202, name: 'Mateo Ortiz (Defensa Férreo)', number: 33, position: 'CUTTER' },
  { id: 5, rivalId: 202, name: 'Julio Paz (Capitán)', number: 1, position: 'HANDLER' },
  { id: 6, rivalId: 203, name: 'David Flores', number: 22, position: 'HANDLER' },
]

GUEST_RIVALS.forEach(r => {
  (r as any).players = GUEST_RIVAL_PLAYERS.filter(p => p.rivalId === r.id);
})

export const GUEST_EVENT_ANNOTATIONS = [
  // Event 101 - Final (15 annotations)
  { id: 1, eventId: 101, playerId: 2, relatedPlayerId: 1, type: 'GOAL', lineType: 'Línea O', scoreHome: 1, scoreAway: 0, note: 'Pase largo de Franco.', timestamp: new Date(now.getTime() - 86400000 * 4 + 300000).toISOString(), player: GUEST_PLAYERS[1] },
  { id: 2, eventId: 101, playerId: 1, type: 'ASSIST', lineType: 'Línea O', scoreHome: 1, scoreAway: 0, timestamp: new Date(now.getTime() - 86400000 * 4 + 300000).toISOString(), player: GUEST_PLAYERS[0] },
  { id: 3, eventId: 101, playerId: 7, type: 'DEFENSE', lineType: 'Línea D', scoreHome: 1, scoreAway: 1, note: 'Defensa en plancha espectacular.', timestamp: new Date(now.getTime() - 86400000 * 4 + 900000).toISOString(), player: GUEST_PLAYERS[6] },
  { id: 4, eventId: 101, playerId: 5, relatedPlayerId: 10, type: 'GOAL', lineType: 'Línea O', scoreHome: 8, scoreAway: 7, note: 'Punto de descanso.', timestamp: new Date(now.getTime() - 86400000 * 4 + 3600000).toISOString(), player: GUEST_PLAYERS[4] },
  { id: 5, eventId: 101, playerId: 1, relatedPlayerId: 2, type: 'GOAL', lineType: 'Línea O', scoreHome: 15, scoreAway: 13, note: '¡Punto de Campeonato!', timestamp: new Date(now.getTime() - 86400000 * 4 + 6800000).toISOString(), player: GUEST_PLAYERS[0] },
  { id: 6, eventId: 101, playerId: 9, type: 'DEFENSE', lineType: 'Línea D', scoreHome: 8, scoreAway: 8, note: 'Bloqueo en el aire.', timestamp: new Date(now.getTime() - 86400000 * 4 + 3800000).toISOString(), player: GUEST_PLAYERS[8] },
  { id: 7, eventId: 101, playerId: 11, relatedPlayerId: 3, type: 'GOAL', lineType: 'Línea O', scoreHome: 12, scoreAway: 11, note: 'Corte rápido a endzone.', timestamp: new Date(now.getTime() - 86400000 * 4 + 5000000).toISOString(), player: GUEST_PLAYERS[10] },
  { id: 8, eventId: 101, playerId: 13, type: 'TURNOVER', lineType: 'Línea O', scoreHome: 12, scoreAway: 11, note: 'Caída en zona de gol.', timestamp: new Date(now.getTime() - 86400000 * 4 + 5200000).toISOString(), player: GUEST_PLAYERS[12] },
  
  // Event 102 - Entrenamiento
  { id: 9, eventId: 102, playerId: 4, relatedPlayerId: 15, type: 'GOAL', lineType: 'Línea O', scoreHome: 1, scoreAway: 0, note: 'Punto de práctica.', timestamp: new Date(now.getTime() - 86400000 * 2 + 100000).toISOString(), player: GUEST_PLAYERS[3] },
  { id: 10, eventId: 102, playerId: 17, type: 'ASSIST', lineType: 'Línea D', scoreHome: 1, scoreAway: 1, note: 'Pase cruzado.', timestamp: new Date(now.getTime() - 86400000 * 2 + 200000).toISOString(), player: GUEST_PLAYERS[16] },
  { id: 11, eventId: 102, playerId: 19, type: 'DEFENSE', lineType: 'Línea D', scoreHome: 2, scoreAway: 1, note: 'Intercepción en zona.', timestamp: new Date(now.getTime() - 86400000 * 2 + 300000).toISOString(), player: GUEST_PLAYERS[18] },
  { id: 12, eventId: 102, playerId: 20, type: 'TURNOVER', lineType: 'Línea O', scoreHome: 2, scoreAway: 1, note: 'Pase fuera.', timestamp: new Date(now.getTime() - 86400000 * 2 + 400000).toISOString(), player: GUEST_PLAYERS[19] },
  { id: 13, eventId: 102, playerId: 5, type: 'GOAL', lineType: 'Línea O', scoreHome: 3, scoreAway: 2, timestamp: new Date(now.getTime() - 86400000 * 2 + 500000).toISOString(), player: GUEST_PLAYERS[4] },
  { id: 14, eventId: 102, playerId: 7, type: 'DEFENSE', lineType: 'Línea D', scoreHome: 3, scoreAway: 2, timestamp: new Date(now.getTime() - 86400000 * 2 + 600000).toISOString(), player: GUEST_PLAYERS[6] },

  // Event 103 - Torneo Relámpago
  { id: 15, eventId: 103, playerId: 1, relatedPlayerId: 10, type: 'GOAL', lineType: 'Línea O', scoreHome: 10, scoreAway: 5, note: 'Punto de la victoria en grupos.', timestamp: new Date(now.getTime() - 86400000 * 15 + 3000000).toISOString(), player: GUEST_PLAYERS[0] },
  { id: 16, eventId: 103, playerId: 2, type: 'DEFENSE', lineType: 'Línea D', scoreHome: 1, scoreAway: 0, timestamp: new Date(now.getTime() - 86400000 * 15 + 100000).toISOString(), player: GUEST_PLAYERS[1] },
  { id: 17, eventId: 103, playerId: 3, type: 'ASSIST', lineType: 'Línea O', scoreHome: 2, scoreAway: 0, timestamp: new Date(now.getTime() - 86400000 * 15 + 200000).toISOString(), player: GUEST_PLAYERS[2] },
  { id: 18, eventId: 103, playerId: 4, type: 'GOAL', lineType: 'Línea O', scoreHome: 2, scoreAway: 0, timestamp: new Date(now.getTime() - 86400000 * 15 + 200000).toISOString(), player: GUEST_PLAYERS[3] },
  { id: 19, eventId: 103, playerId: 5, type: 'TURNOVER', lineType: 'Línea O', scoreHome: 2, scoreAway: 1, timestamp: new Date(now.getTime() - 86400000 * 15 + 300000).toISOString(), player: GUEST_PLAYERS[4] },

  // Event 104 - Full Day
  { id: 20, eventId: 104, playerId: 14, type: 'GOAL', category: 'MIXTO', scoreHome: 5, scoreAway: 3, timestamp: new Date(now.getTime() - 86400000 * 8 + 1000000).toISOString(), player: GUEST_PLAYERS[13] },
  { id: 21, eventId: 104, playerId: 10, type: 'ASSIST', category: 'MIXTO', scoreHome: 5, scoreAway: 3, timestamp: new Date(now.getTime() - 86400000 * 8 + 1000000).toISOString(), player: GUEST_PLAYERS[9] },
  { id: 22, eventId: 104, playerId: 11, type: 'DEFENSE', category: 'MIXTO', scoreHome: 5, scoreAway: 4, timestamp: new Date(now.getTime() - 86400000 * 8 + 1500000).toISOString(), player: GUEST_PLAYERS[10] },
  
  // Event 105 - Amistoso vs Cóndores
  { id: 23, eventId: 105, playerId: 18, type: 'GOAL', scoreHome: 3, scoreAway: 2, timestamp: new Date(now.getTime() - 86400000 * 20 + 400000).toISOString(), player: GUEST_PLAYERS[17] },
  { id: 24, eventId: 105, playerId: 16, type: 'ASSIST', scoreHome: 3, scoreAway: 2, timestamp: new Date(now.getTime() - 86400000 * 20 + 400000).toISOString(), player: GUEST_PLAYERS[15] },
  { id: 25, eventId: 105, playerId: 8, type: 'DEFENSE', scoreHome: 3, scoreAway: 3, timestamp: new Date(now.getTime() - 86400000 * 20 + 600000).toISOString(), player: GUEST_PLAYERS[7] },
  { id: 26, eventId: 105, playerId: 15, type: 'GOAL', scoreHome: 4, scoreAway: 3, timestamp: new Date(now.getTime() - 86400000 * 20 + 800000).toISOString(), player: GUEST_PLAYERS[14] },
  { id: 27, eventId: 105, playerId: 1, type: 'TURNOVER', scoreHome: 4, scoreAway: 4, timestamp: new Date(now.getTime() - 86400000 * 20 + 900000).toISOString(), player: GUEST_PLAYERS[0] },
]

export const GUEST_MATCH_STATS = GUEST_PLAYERS.map(pl => {
  return {
    id: pl.id,
    playerId: pl.id,
    playerName: pl.name,
    playerNumber: pl.number,
    eventId: 101, // Aggregated or specific
    goals: Math.floor(Math.random() * 8),
    assists: Math.floor(Math.random() * 10),
    defenses: Math.floor(Math.random() * 5),
    turnovers: Math.floor(Math.random() * 3),
    drops: Math.floor(Math.random() * 2),
    pointsPlayed: Math.floor(Math.random() * 30) + 10,
  }
})

export const GUEST_PLAYS = [
  { id: 301, name: 'Vertical Stack - Break Flow', category: 'OFFENSE', description: 'Ataque clásico en pila vertical.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 302, name: 'Horizontal Stack - Doble Corte', category: 'OFFENSE', description: 'Formación horizontal con 3 manejadores y 4 cortadores.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 303, name: 'Defensa de Zona 3-3-1 (Cup)', category: 'DEFENSE', description: 'Estrategia defensiva de copa.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 304, name: 'Force Sideline & Trap', category: 'DEFENSE', description: 'Marcación hombre a hombre forzando a la línea.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 305, name: 'Drill Endzone 3v3', category: 'DRILL', description: 'Ejercicio de espacio reducido.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 306, name: 'Hexagon Offense', category: 'OFFENSE', description: 'Ofensiva fluida basada en principios de hexágono para mover el disco velozmente.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 307, name: 'Defensa Bracket (Switch)', category: 'DEFENSE', description: 'Defensa con cambios automáticos (switches) sobre los cortadores principales en stack vertical.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 308, name: 'Drill de Marcación 1v1', category: 'DRILL', description: 'Mejora del posicionamiento defensivo ante cortes agresivos.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
]

export const GUEST_INJURIES = [
  { id: 401, playerId: 12, type: 'Esguince de Tobillo Grado II', severity: 'MODERATE', status: 'RECOVERING', startDate: new Date(now.getTime() - 86400000 * 12).toISOString(), endDate: new Date(now.getTime() + 86400000 * 10).toISOString(), description: 'Torcedura durante entrenamiento.', player: GUEST_PLAYERS[11], createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 402, playerId: 21, type: 'Rotura de Ligamento Cruzado', severity: 'SEVERE', status: 'RECOVERING', startDate: new Date(now.getTime() - 86400000 * 45).toISOString(), description: 'Cirugía exitosa, en rehabilitación activa de 6 a 9 meses.', player: GUEST_PLAYERS[20], createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 403, playerId: 6, type: 'Tendinitis Patelar', severity: 'MILD', status: 'HEALED', startDate: new Date(now.getTime() - 86400000 * 60).toISOString(), endDate: new Date(now.getTime() - 86400000 * 30).toISOString(), description: 'Rodilla del saltador, recuperado con reposo y fisioterapia.', player: GUEST_PLAYERS[5], createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 404, playerId: 9, type: 'Desgarro Isquiotibial', severity: 'MODERATE', status: 'RECOVERING', startDate: new Date(now.getTime() - 86400000 * 5).toISOString(), endDate: new Date(now.getTime() + 86400000 * 20).toISOString(), description: 'Ocurrido en un plancha defensiva. Reposo por 3 semanas.', player: GUEST_PLAYERS[8], createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
]

export const GUEST_RESOURCES = [
  { id: 501, title: '📘 Manual Oficial SIGEDIVO', category: 'Manuales y Operaciones', description: 'Manual completo interactivo con la matriz de roles y permisos.', url: '#', fileName: 'Manual.pdf', size: 2854000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 502, title: 'Reglamento Oficial WFDF', category: 'Reglamento', description: 'Reglamento traducido oficial de la Federación.', url: 'https://rules.wfdf.org', fileName: 'Reglas.pdf', size: 1450000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 503, title: 'Guía de Espíritu de Juego (SOTG)', category: 'Espíritu de Juego', description: 'Criterios y rúbrica oficial.', url: 'https://spirit.wfdf.org', fileName: 'SOTG.pdf', size: 890000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 504, title: 'Plan de Preparación Física', category: 'Entrenamiento Físico', description: 'Rutina de movilidad articular.', url: '#', fileName: 'Prep.pdf', size: 1120000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 505, title: 'Guía Nutricional para Torneos', category: 'Salud', description: 'Alimentación óptima.', url: '#', fileName: 'Nutricion.pdf', size: 540000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 506, title: 'Ejercicios de Movilidad Articular', category: 'Entrenamiento Físico', description: 'Estiramientos dinámicos.', url: '#', fileName: 'Movilidad.pdf', size: 1890000, createdAt: new Date('2025-01-01T10:00:00Z') },
]

export const GUEST_ACCOUNTS = [
  { id: 1, name: 'Caja Chica (Efectivo)', type: 'CASH', balanceCents: 15000, description: 'Efectivo para hidratación y gastos menores.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 2, name: 'Cuenta Banco Z (Torneos)', type: 'BANK', balanceCents: 125000, description: 'Fondo principal del equipo.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
]

export const GUEST_CATEGORIES = [
  { id: 1, name: 'Mensualidad Jugadores', kind: 'INCOME', description: 'Pago mensual de cuotas.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 2, name: 'Patrocinadores', kind: 'INCOME', description: 'Ingresos por sponsors.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 3, name: 'Inscripción Torneos', kind: 'EXPENSE', description: 'Pago de bid fees.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 4, name: 'Hidratación y Médico', kind: 'EXPENSE', description: 'Agua, hielo, botiquín.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
]

export const GUEST_TRANSACTIONS = [
  { id: 1, type: 'INCOME', amountCents: 20000, description: 'Mensualidades Enero', occurredAt: new Date(now.getTime() - 86400000 * 20).toISOString(), accountId: 2, categoryId: 1, createdBy: 1, account: GUEST_ACCOUNTS[1], category: GUEST_CATEGORIES[0], creator: GUEST_PLAYERS[0], createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 2, type: 'INCOME', amountCents: 50000, description: 'Sponsor: Tienda Deportiva', occurredAt: new Date(now.getTime() - 86400000 * 15).toISOString(), accountId: 2, categoryId: 2, createdBy: 1, account: GUEST_ACCOUNTS[1], category: GUEST_CATEGORIES[1], creator: GUEST_PLAYERS[0], createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 3, type: 'EXPENSE', amountCents: 15000, description: 'Inscripción Copa Nacional', occurredAt: new Date(now.getTime() - 86400000 * 10).toISOString(), accountId: 2, categoryId: 3, createdBy: 1, account: GUEST_ACCOUNTS[1], category: GUEST_CATEGORIES[2], creator: GUEST_PLAYERS[0], createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 4, type: 'EXPENSE', amountCents: 2500, description: 'Botellas de agua y hielo', occurredAt: new Date(now.getTime() - 86400000 * 4).toISOString(), accountId: 1, categoryId: 4, createdBy: 1, account: GUEST_ACCOUNTS[0], category: GUEST_CATEGORIES[3], creator: GUEST_PLAYERS[0], createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
  { id: 5, type: 'TRANSFER', amountCents: 5000, description: 'Retiro para caja chica', occurredAt: new Date(now.getTime() - 86400000 * 2).toISOString(), accountId: 2, toAccountId: 1, categoryId: null, createdBy: 1, account: GUEST_ACCOUNTS[1], toAccount: GUEST_ACCOUNTS[0], category: null, creator: GUEST_PLAYERS[0], createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
]

export const GUEST_POSTS = [
  { id: 1, title: '¡Campeones de la Copa Nacional 2026!', content: 'Felicidades a todo el equipo por el increíble esfuerzo. Demostramos nuestro mejor nivel en la final. El entrenamiento está rindiendo frutos.', isImportant: true, createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(), updatedAt: new Date(now.getTime() - 86400000 * 3).toISOString(), author: GUEST_PLAYERS[0] },
  { id: 2, title: 'Nuevo Horario de Entrenamiento', content: 'A partir de la próxima semana, agregaremos pliometría los días miércoles a las 19:00 hrs. Favor llevar calzado adecuado.', isImportant: false, createdAt: new Date(now.getTime() - 86400000 * 8).toISOString(), updatedAt: new Date(now.getTime() - 86400000 * 8).toISOString(), author: GUEST_PLAYERS[2] },
  { id: 3, title: 'Cuotas del mes', content: 'Recuerden que las mensualidades deben depositarse antes del día 5. Hablen con el tesorero si tienen dudas.', isImportant: false, createdAt: new Date(now.getTime() - 86400000 * 18).toISOString(), updatedAt: new Date(now.getTime() - 86400000 * 18).toISOString(), author: GUEST_PLAYERS[1] },
]
