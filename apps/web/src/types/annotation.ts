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

export interface EventAnnotation {
  id: number
  eventId: number
  playerId: number
  type: AnnotationType
  note?: string
  timestamp: string
  category?: string // Para FULL_DAY: "OPEN" o "MIXTO"
  createdBy?: number
  createdAt: string
  updatedAt: string
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
  }
}

export interface CreateAnnotationInput {
  eventId: number
  playerId: number
  type: AnnotationType
  note?: string
  timestamp?: string
  category?: string
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

