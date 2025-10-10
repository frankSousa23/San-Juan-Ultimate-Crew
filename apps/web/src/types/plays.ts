export type PlayCategory = 'OFFENSE' | 'DEFENSE' | 'DRILL'

export interface PlayItem {
  id: number
  name: string
  category: PlayCategory
  description?: string | null
  diagramUrl?: string | null
  content?: string | null
  createdAt: string
}

export interface CreatePlayInput {
  name: string
  category: PlayCategory
  description?: string | null
  diagramUrl?: string | null
  content?: string | null
}

export type UpdatePlayInput = Partial<CreatePlayInput>
