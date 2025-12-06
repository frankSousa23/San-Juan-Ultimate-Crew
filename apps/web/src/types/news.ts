export interface NewsPost {
  id: number
  title: string
  content: string
  authorId?: number | null
  isPinned: boolean
  isPublished: boolean
  category?: string | null
  views: number
  createdAt: string
  updatedAt: string
  publishedAt?: string | null
  author?: {
    id: number
    name: string
    number: number
  }
  files?: NewsPostFile[]
  _count?: {
    files: number
  }
}

export interface NewsPostFile {
  id: number
  postId: number
  fileName: string
  originalName: string
  mimeType: string
  size: number
  storagePath: string
  description?: string | null
  createdAt: string
}

export interface CreateNewsPostInput {
  title: string
  content: string
  category?: string
  isPinned?: boolean
  isPublished?: boolean
}

export interface UpdateNewsPostInput {
  title?: string
  content?: string
  category?: string
  isPinned?: boolean
  isPublished?: boolean
}

export interface NewsPostListResponse {
  items: NewsPost[]
  total: number
  limit: number
  offset: number
}

