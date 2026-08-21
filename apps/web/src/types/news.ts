export interface NewsComment {
  id: number
  postId: number
  userId?: number | null
  authorName?: string | null
  authorRole?: string | null
  content: string
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    name?: string | null
    email: string
  } | null
}

export interface NewsPost {
  id: number
  title: string
  content: string
  authorId?: number | null
  isPinned: boolean
  isPublished: boolean
  commentsLocked?: boolean
  eventId?: number | null
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
  comments?: NewsComment[]
  _count?: {
    files?: number
    comments?: number
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
  commentsLocked?: boolean
  eventId?: number | null
}

export interface UpdateNewsPostInput {
  title?: string
  content?: string
  category?: string
  isPinned?: boolean
  isPublished?: boolean
  commentsLocked?: boolean
  eventId?: number | null
}

export interface CreateNewsCommentInput {
  content: string
  authorName?: string
  authorRole?: string
}

export interface NewsPostListResponse {
  items: NewsPost[]
  total: number
  limit: number
  offset: number
}

