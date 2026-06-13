export type AnnotationType = 
  | 'GOAL'
  | 'ASSIST'
  | 'DEFENSE'
  | 'TURNOVER'
  | 'DROP'
  | 'FOUL'
  | 'TIMEOUT'
  | 'SUBSTITUTION'
  | 'INJURY'
  | 'GENERAL'
  | 'STRATEGY'
  | 'PERFORMANCE'
  | 'CALLAHAN'
  | 'GREATEST'

export interface EventAnnotation {
  id: number
  eventId: number
  playerId: number | null
  type: AnnotationType
  note?: string
  timestamp: string
  category?: string // Para FULL_DAY: "OPEN" o "MIXTO"
  createdBy?: number
  createdAt: string
  updatedAt: string
  // Campos para versus
  opponentTeamName?: string | null
  opponentPlayerName?: string | null
  opponentPlayerNumber?: number | null
  teamSide?: 'HOME' | 'AWAY' | null
  scoreHome?: number | null
  scoreAway?: number | null
  event?: {
    id: number
    title: string
    type: string
    status: string
  }
  player?: {
    id: number
    name: string
    number: number
  } | null
}

export interface CreateAnnotationInput {
  eventId: number
  playerId?: number | null
  type: AnnotationType
  note?: string
  timestamp?: string
  category?: string
  // Campos para versus
  opponentTeamName?: string
  opponentPlayerName?: string
  opponentPlayerNumber?: number
  teamSide?: 'HOME' | 'AWAY'
  scoreHome?: number
  scoreAway?: number
}

export interface UpdateAnnotationInput {
  type?: AnnotationType
  note?: string
  timestamp?: string
  category?: string
  eventId?: number
  playerId?: number
}

export interface AnnotationStats {
  event: {
    id: number
    title: string
    type: string
  }
  total: number
  byType: Record<string, number>
  byPlayer: Array<{
    player: {
      id: number
      name: string
      number: number
    }
    total: number
    byType: Record<string, number>
  }>
  byCategory: Record<string, number>
}

