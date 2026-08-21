export type EventType = 'TRAINING' | 'TOURNAMENT' | 'SOCIAL' | 'WORKSHOP' | 'FULL_DAY_OPEN' | 'FULL_DAY_MIXTO' | 'AMISTOSO' | 'MATCH'
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
export type MatchCategory = 'GROUP_STAGE' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'FINALS' | 'PLACEMENT'

export interface EventItem {
  id: number
  title: string
  description?: string
  type: EventType
  status: EventStatus
  location?: string
  startsAt: string
  endsAt?: string
  teamId?: number | null
  awayTeamId?: number | null
  officialAnnotatorId?: number | null
  isAnnotatorLocked?: boolean
  parentId?: number | null
  matchCategory?: MatchCategory | null
  rivalId?: number | null
  isInternalScrimmage?: boolean
  team?: { id: number; name: string; color?: string | null; logoUrl?: string | null } | null
  awayTeam?: { id: number; name: string; color?: string | null; logoUrl?: string | null } | null
  officialAnnotator?: { id: number; name?: string | null; email: string } | null
  children?: EventItem[]
}

export type CreateEventInput = Omit<EventItem, 'id' | 'team' | 'awayTeam' | 'officialAnnotator' | 'children'>
export type UpdateEventInput = Partial<Omit<EventItem, 'id' | 'team' | 'awayTeam' | 'officialAnnotator' | 'children'>>

export interface EventParticipant {
  eventId: number
  playerId: number
  role?: string | null
  status?: string | null
  lineType?: string | null
  teamSide?: string | null
  isRefuerzo?: boolean
  player?: { id: number; name: string; number: number; teamId?: number | null; team?: { id: number; name: string } | null }
  event?: { id: number; title: string }
}
