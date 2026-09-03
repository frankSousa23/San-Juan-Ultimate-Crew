import type { SkillAxisData } from '../components/PlayerRadarChart'

export interface RolePerformanceProfile {
  role: 'HANDLER' | 'CUTTER'
  title: string
  icon: string
  description: string
  primaryMetrics: { label: string; value: string; rating: number; color: string }[]
  radarProfile: SkillAxisData
}

export interface TeamTacticalKpi {
  huckAccuracyPct: number        // % pases largos (>30 yd) completados
  stallOutResistancePct: number  // % posesiones resueltas antes del stall 7
  passCompletionPct: number      // % pases completados totales
  turnoverRatio: number          // pérdidas promedio por partido
  averageSpiritScore: number     // 0 - 20 (WFDF rubric)
  redZoneConversionPct: number   // % conversiones de gol en últimos 20m
}

export const CANONICAL_TEAM_RADAR: SkillAxisData = {
  catching: 84,
  throwing: 86,
  defense: 80,
  spirit: 94,
  stamina: 88,
}

export const CANONICAL_HANDLER_PROFILE: RolePerformanceProfile = {
  role: 'HANDLER',
  title: 'Especialistas Handlers (Lanzadores)',
  icon: '🎯',
  description: 'Control de disco, rompimiento de marcas (Break-mark), distribución y pases profundos.',
  primaryMetrics: [
    { label: 'Huck Accuracy (Tiros Largos)', value: '81%', rating: 81, color: '#6366f1' },
    { label: 'Resistencia al Stall (Pases rápidos)', value: '88%', rating: 88, color: '#3b82f6' },
    { label: 'Tasa de Desahogo (Dump-Swing)', value: '94%', rating: 94, color: '#10b981' },
    { label: 'Asistencias Directas por Partido', value: '3.4', rating: 85, color: '#f59e0b' },
  ],
  radarProfile: {
    catching: 76,
    throwing: 95,
    defense: 78,
    spirit: 92,
    stamina: 84,
  },
}

export const CANONICAL_CUTTER_PROFILE: RolePerformanceProfile = {
  role: 'CUTTER',
  title: 'Especialistas Cutters (Cortadores)',
  icon: '⚡',
  description: 'Aceleración, cambio de dirección explosivo, recepción en el tráfico y remate a la Endzone.',
  primaryMetrics: [
    { label: 'Confiabilidad de Atrapada (Catching)', value: '93%', rating: 93, color: '#06b6d4' },
    { label: 'Velocidad de Separación en Corte', value: '89%', rating: 89, color: '#8b5cf6' },
    { label: 'Efectividad en Zona de Gol (Iso)', value: '86%', rating: 86, color: '#10b981' },
    { label: 'Goles Anotados por Encuentro', value: '3.8', rating: 92, color: '#f43f5e' },
  ],
  radarProfile: {
    catching: 94,
    throwing: 74,
    defense: 86,
    spirit: 93,
    stamina: 92,
  },
}

export const CANONICAL_TACTICAL_KPIS: TeamTacticalKpi = {
  huckAccuracyPct: 78,
  stallOutResistancePct: 86,
  passCompletionPct: 91,
  turnoverRatio: 3.2,
  averageSpiritScore: 18.5,
  redZoneConversionPct: 83,
}

/**
 * Derives a 5-axis normalized skill radar (0-100) from athlete stats
 */
export function calculatePlayerRadar(stats: {
  goals?: number
  assists?: number
  defenses?: number
  turnovers?: number
  position?: string
  attendanceRate?: number
  spiritAvg?: number
}): SkillAxisData {
  const g = stats.goals || 0
  const a = stats.assists || 0
  const d = stats.defenses || 0
  const t = stats.turnovers || 0
  const att = stats.attendanceRate || 85
  const sAvg = stats.spiritAvg || 18.0
  const isHandler = (stats.position || '').toUpperCase().includes('HANDLER')

  // Catching calculation
  const catching = Math.min(98, Math.max(50, Math.round(55 + g * 3.5 + (isHandler ? 0 : 8))))

  // Throwing calculation (penalizes high turnovers slightly)
  const throwing = Math.min(98, Math.max(50, Math.round(55 + a * 4.0 - t * 1.5 + (isHandler ? 10 : 0))))

  // Defense calculation
  const defense = Math.min(98, Math.max(50, Math.round(55 + d * 5.0)))

  // Spirit calculation (scaled from 20 max to 100)
  const spirit = Math.min(100, Math.max(60, Math.round((sAvg / 20) * 100)))

  // Stamina based on attendance rate and participation
  const stamina = Math.min(98, Math.max(50, Math.round(att * 0.7 + (g + a + d > 10 ? 25 : 15))))

  return { catching, throwing, defense, spirit, stamina }
}
