export type Position = 'HANDLER' | 'CUTTER' | 'HYBRID'
export type Status = 'ACTIVE' | 'INJURED' | 'INACTIVE'

export interface Player {
  id: number
  name: string
  number: number
  position: Position
  status: Status
  heightCm?: number
  experience?: string
}

export type CreatePlayerInput = Omit<Player, 'id'>
export type UpdatePlayerInput = Partial<Omit<Player, 'id'>>
