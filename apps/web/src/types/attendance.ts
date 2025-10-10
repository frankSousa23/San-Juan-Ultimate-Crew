export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface AttendanceRecord {
  id: number
  playerId: number
  eventId: number
  status: AttendanceStatus
  note?: string | null
  createdAt: string
  // optional includes
  player?: { id: number; name: string; number: number }
}

export interface UpsertAttendanceInput {
  eventId: number
  playerId: number
  status: AttendanceStatus
  note?: string | null
}