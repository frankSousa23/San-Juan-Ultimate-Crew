export type EventType = 'TRAINING' | 'TOURNAMENT' | 'SOCIAL' | 'WORKSHOP'
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

export interface EventItem {
  id: number
  title: string
  description?: string
  type: EventType
  status: EventStatus
  location?: string
  startsAt: string
  endsAt?: string
}

export type CreateEventInput = Omit<EventItem, 'id'>
export type UpdateEventInput = Partial<Omit<EventItem, 'id'>>

export interface EventParticipant {
  eventId: number
  playerId: number
  role?: string | null
  status?: string | null
  player?: { id: number; name: string; number: number }
  event?: { id: number; title: string }
}
