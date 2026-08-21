export type Position = 'HANDLER' | 'CUTTER' | 'HYBRID'
export type Status = 'ACTIVE' | 'INJURED' | 'INACTIVE'
export type UltimateCategory = 'OPEN' | 'WOMEN' | 'MIXED' | 'JUNIOR' | 'MASTER'

export interface Team {
  id: number
  name: string
  color?: string | null
  logoUrl?: string | null
  categories?: string | null
}

export interface Player {
  id: number
  name: string
  number: number
  position: Position
  status: Status
  heightCm?: number
  experience?: string
  category?: string | null
  teamId?: number | null
  team?: Team | null
  user?: {
    id: number
    email: string
    roles?: {
      role: {
        name: string
        roles: { permission: { name: string } }[]
      }
    }[]
  } | null
}

export type CreatePlayerInput = Omit<Player, 'id' | 'team' | 'user'>
export type UpdatePlayerInput = Partial<Omit<Player, 'id' | 'team' | 'user'>>
