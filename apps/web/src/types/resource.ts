export interface ResourceItem {
  id: number
  title: string
  description?: string
  url?: string
  category?: string
  fileName?: string
  mimeType?: string
  size?: number
  storagePath?: string
  createdAt: string
}

export type CreateResourceInput = Omit<ResourceItem, 'id' | 'createdAt'>
export type UpdateResourceInput = Partial<CreateResourceInput>
