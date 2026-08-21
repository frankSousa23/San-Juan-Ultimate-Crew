import axios from 'axios'
import { Player, CreatePlayerInput, UpdatePlayerInput } from '../types/player'
import { EventItem, CreateEventInput, UpdateEventInput } from '../types/event'
import { Channel, Message, CreateChannelInput, CreateMessageInput } from '../types/communications'
import { AttendanceRecord, UpsertAttendanceInput } from '../types/attendance'
import { Account, Category, TransactionItem, TransactionList, FinanceSummary, CreateAccountInput, CreateCategoryInput, CreateTransactionInput, UpdateTransactionInput } from '../types/finance'
import { PlayItem, CreatePlayInput, UpdatePlayInput } from '../types/plays'
import { EventParticipant } from '../types/event'
import { ResourceItem, CreateResourceInput, UpdateResourceInput } from '../types/resource'
import { EventAnnotation, CreateAnnotationInput, UpdateAnnotationInput, AnnotationStats } from '../types/annotation'
import { NewsPost, NewsPostFile, CreateNewsPostInput, UpdateNewsPostInput, NewsPostListResponse } from '../types/news'

function buildUrl(url: string, params?: Record<string, any>) {
  if (!params) return url
  const searchParams = new URLSearchParams()
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) {
      searchParams.append(key, String(val))
    }
  }
  const qs = searchParams.toString()
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url
}

// Native fetch backed HTTP client replacing axios across the whole application
export const http = {
  get: async <T = any>(url: string, config?: { params?: any; headers?: any; responseType?: string }) => {
    const fullUrl = buildUrl(url, config?.params)
    if (config?.responseType === 'blob') {
      const token = getAuthToken()
      const headers: Record<string, string> = { ...(config?.headers || {}) }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(fullUrl, { method: 'GET', headers })
      const blob = await res.blob()
      return { data: blob as unknown as T }
    }
    const data = await request<T>(fullUrl, { method: 'GET', headers: config?.headers })
    return { data }
  },
  post: async <T = any>(url: string, body?: any, config?: { params?: any; headers?: any }) => {
    const fullUrl = buildUrl(url, config?.params)
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    if (isFormData) {
      const token = getAuthToken()
      const headers: Record<string, string> = { ...(config?.headers || {}) }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(fullUrl, { method: 'POST', headers, body })
      const data = await res.json()
      return { data: data as T }
    }
    const data = await request<T>(fullUrl, { method: 'POST', headers: config?.headers, body: body !== undefined ? JSON.stringify(body) : undefined })
    return { data }
  },
  put: async <T = any>(url: string, body?: any, config?: { params?: any; headers?: any }) => {
    const fullUrl = buildUrl(url, config?.params)
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    if (isFormData) {
      const token = getAuthToken()
      const headers: Record<string, string> = { ...(config?.headers || {}) }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(fullUrl, { method: 'PUT', headers, body })
      const data = await res.json()
      return { data: data as T }
    }
    const data = await request<T>(fullUrl, { method: 'PUT', headers: config?.headers, body: body !== undefined ? JSON.stringify(body) : undefined })
    return { data }
  },
  patch: async <T = any>(url: string, body?: any, config?: { params?: any; headers?: any }) => {
    const fullUrl = buildUrl(url, config?.params)
    const data = await request<T>(fullUrl, { method: 'PATCH', headers: config?.headers, body: body !== undefined ? JSON.stringify(body) : undefined })
    return { data }
  },
  delete: async <T = any>(url: string, config?: { params?: any; headers?: any }) => {
    const fullUrl = buildUrl(url, config?.params)
    const data = await request<T>(fullUrl, { method: 'DELETE', headers: config?.headers })
    return { data }
  },
  interceptors: {
    request: { use: (cb: any) => {} },
    response: { use: (cb1: any, cb2: any) => {} },
  }
}

// Auth token management
const TOKEN_KEY = 'sigedivo.auth.token'
export function setAuthToken(token?: string) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// Native fetch helper that works reliably across iframe, cross-origin and local environments
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(path, {
      ...options,
      headers,
    })

    const text = await res.text()
    let data: any = {}
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { message: text }
    }

    if (!res.ok) {
      const errorMsg = data.error || data.message || `Error HTTP ${res.status}`
      const err: any = new Error(errorMsg)
      err.response = { status: res.status, data }
      throw err
    }

    return data as T
  } catch (err: any) {
    if (err.response) throw err
    // If fetch failed before response, wrap with clear message
    const wrappedErr: any = new Error(err.message || 'Error de conexión con el servidor')
    wrappedErr.response = { status: 0, data: { error: err.message || 'Error de conexión' } }
    throw wrappedErr
  }
}

http.interceptors.request.use((config: any) => {
  
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers || {}
    ;(config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle token expiration
http.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      setAuthToken()
      const currentPath = window.location.pathname
      const isAuthPage = currentPath.includes('/login') || 
                        currentPath.includes('/register') || 
                        currentPath.includes('/forgot-password') || 
                        currentPath.includes('/reset-password')
      
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/me') || 
                            error.config?.url?.includes('/api/auth/login')
      
      if (!isAuthPage && !isAuthEndpoint) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      }
    }
    return Promise.reject(error)
  }
)

// Auth API using native fetch for maximum reliability in iframes
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: { id: number; email: string; name?: string; roles?: string[]; playerId?: number | null; status?: 'PENDING' | 'APPROVED' | 'REJECTED' } }> => {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  register: async (email: string, password: string, name?: string, willBePlayer?: boolean, playerData?: { number: number; position: 'HANDLER' | 'CUTTER' | 'HYBRID'; status?: 'ACTIVE' | 'INJURED' | 'INACTIVE'; heightCm?: number; experience?: string }, teamId?: number | null): Promise<{ message: string; user: { id: number; email: string; name?: string; status: string; playerId?: number | null } }> => {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, willBePlayer, playerData, teamId }),
    })
  },
  me: async (): Promise<{ user?: { id: number; email: string; name?: string; roles?: string[]; playerId?: number | null; status?: 'PENDING' | 'APPROVED' | 'REJECTED' }; authDisabled?: boolean }> => {
    return request('/api/auth/me', { method: 'GET' })
  },
  logout: async (): Promise<{ ok: boolean }> => {
    return request('/api/auth/logout', { method: 'POST' })
  },
  forgotPassword: async (email: string): Promise<{ message: string; token?: string }> => {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  },
  checkStatus: async (email: string): Promise<{ exists: boolean; status?: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt?: string }> => {
    return request('/api/auth/check-status', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
}

export const playersApi = {
  list: async (): Promise<Player[]> => {
    const { data } = await http.get<Player[]>('/api/players')
    return data
  },
  create: async (payload: CreatePlayerInput): Promise<Player> => {
    const { data } = await http.post<Player>('/api/players', payload)
    return data
  },
  update: async (id: number, payload: UpdatePlayerInput): Promise<Player> => {
    const { data } = await http.put<Player>(`/api/players/${id}`, payload)
    return data
  },
  remove: async (id: number): Promise<void> => {
    await http.delete(`/api/players/${id}`)
  },
  getMatchStats: async (id: number): Promise<any> => {
    const { data } = await http.get(`/api/players/${id}/stats`)
    return data
  }
}

export const eventsApi = {
  list: async (): Promise<EventItem[]> => {
    const { data } = await http.get<EventItem[]>('/api/events')
    return data
  },
  create: async (payload: CreateEventInput): Promise<EventItem> => {
    const { data } = await http.post<EventItem>('/api/events', payload)
    return data
  },
  update: async (id: number, payload: UpdateEventInput): Promise<EventItem> => {
    const { data } = await http.put<EventItem>(`/api/events/${id}`, payload)
    return data
  },
  remove: async (id: number): Promise<void> => {
    await http.delete(`/api/events/${id}`)
  }
}

export const channelsApi = {
  list: async (eventId?: number): Promise<Channel[]> => {
    const { data } = await http.get<Channel[]>('/api/channels', { params: { eventId } })
    return data
  },
  create: async (payload: CreateChannelInput): Promise<Channel> => {
    const { data } = await http.post<Channel>('/api/channels', payload)
    return data
  },
  get: async (id: number): Promise<Channel> => {
    const { data } = await http.get<Channel>(`/api/channels/${id}`)
    return data
  }
}

export const messagesApi = {
  list: async (channelId: number, params?: { limit?: number; before?: string; since?: string }): Promise<Message[]> => (
    await http.get<Message[]>('/api/messages', { params: { channelId, ...params } })
  ).data,
  create: async (payload: CreateMessageInput): Promise<Message> => (
    await http.post<Message>('/api/messages', payload)
  ).data,
}

export const accountsApi = {
  list: async (): Promise<Account[]> => (await http.get<Account[]>('/api/accounts')).data,
  create: async (payload: CreateAccountInput): Promise<Account> => (
    await http.post<Account>('/api/accounts', payload)
  ).data,
}

export const categoriesApi = {
  list: async (): Promise<Category[]> => (await http.get<Category[]>('/api/categories')).data,
  create: async (payload: CreateCategoryInput): Promise<Category> => (await http.post<Category>('/api/categories', payload)).data,
}

export const transactionsApi = {
  list: async (params?: { from?: string; to?: string; type?: string; accountId?: number; categoryId?: number; limit?: number; offset?: number }): Promise<TransactionList> => (
    await http.get<TransactionList>('/api/transactions', { params })
  ).data,
  create: async (payload: CreateTransactionInput): Promise<TransactionItem> => (await http.post<TransactionItem>('/api/transactions', payload)).data,
  update: async (id: number, payload: UpdateTransactionInput): Promise<TransactionItem> => (await http.put<TransactionItem>(`/api/transactions/${id}`, payload)).data,
  remove: async (id: number): Promise<void> => { await http.delete(`/api/transactions/${id}`) },
  summary: async (params?: { from?: string; to?: string }): Promise<FinanceSummary> => (await http.get<FinanceSummary>('/api/transactions/summary/overall', { params })).data,
}

export const attendanceApi = {
  listByEvent: async (eventId: number): Promise<AttendanceRecord[]> => (
    await http.get<AttendanceRecord[]>('/api/attendance', { params: { eventId } })
  ).data,
  upsert: async (payload: UpsertAttendanceInput): Promise<AttendanceRecord> => (
    await http.put<AttendanceRecord>('/api/attendance', payload)
  ).data,
  remove: async (eventId: number, playerId: number): Promise<void> => {
    await http.delete('/api/attendance', { params: { eventId, playerId } })
  },
}

// Event Participants
export const eventParticipantsApi = {
  listByEvent: async (eventId: number): Promise<EventParticipant[]> => (
    await http.get<EventParticipant[]>('/api/event-participants', { params: { eventId } })
  ).data,
  upsert: async (payload: { eventId: number; playerId: number; role?: string | null; status?: string | null }): Promise<EventParticipant> => (
    await http.put<EventParticipant>('/api/event-participants', payload)
  ).data,
  remove: async (eventId: number, playerId: number): Promise<void> => {
    await http.delete('/api/event-participants', { params: { eventId, playerId } })
  },
}

export async function exportEventParticipantsCsv(eventId: number): Promise<Blob> {
  const items = await eventParticipantsApi.listByEvent(eventId)
  const header = ['eventId','playerId','playerNumber','playerName','role','status']
  const rows = items.map((it: any) => [
    it.eventId,
    it.playerId,
    it.player?.number ?? '',
    JSON.stringify(it.player ? it.player.name : ''),
    JSON.stringify(it.role ?? ''),
    JSON.stringify(it.status ?? ''),
  ].join(','))
  const csv = [header.join(','), ...rows].join('\n')
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

export const playsApi = {
  list: async (params?: { q?: string; category?: string }): Promise<PlayItem[]> => (
    await http.get<PlayItem[]>('/api/plays', { params })
  ).data,
  listPaged: async (params?: { q?: string; category?: string; limit?: number; offset?: number }): Promise<{ items: PlayItem[]; total: number; limit: number; offset: number }> => (
    await http.get('/api/plays/paged', { params })
  ).data,
  create: async (payload: CreatePlayInput): Promise<PlayItem> => (
    await http.post<PlayItem>('/api/plays', payload)
  ).data,
  update: async (id: number, payload: UpdatePlayInput): Promise<PlayItem> => (
    await http.put<PlayItem>(`/api/plays/${id}`, payload)
  ).data,
  remove: async (id: number): Promise<void> => { await http.delete(`/api/plays/${id}`) },
}

export async function exportPlaysCsv(params?: { q?: string; category?: string }): Promise<Blob> {
  const limit = 200
  let offset = 0
  let all: PlayItem[] = []
  // Fetch all pages
   
  while (true) {
    const { items, total } = await playsApi.listPaged({ ...params, limit, offset })
    all = all.concat(items)
    offset += items.length
    if (offset >= total || items.length === 0) break
  }
  // Build CSV
  const header = ['id','name','category','description','diagramUrl','createdAt']
  const rows = all.map(p => [
    p.id,
    JSON.stringify(p.name ?? ''),
    p.category,
    JSON.stringify(p.description ?? ''),
    JSON.stringify(p.diagramUrl ?? ''),
    p.createdAt,
  ].join(','))
  const csv = [header.join(','), ...rows].join('\n')
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

// Rivals paged + CSV + CRUD
export const rivalsApi = {
  list: async (): Promise<any[]> => {
    try {
      const res = await http.get('/api/rivals')
      const data = res.data
      if (Array.isArray(data)) return data
      if (data && Array.isArray((data as any).data)) return (data as any).data
      if (data && Array.isArray((data as any).items)) return (data as any).items
      return []
    } catch {
      return []
    }
  },
  listPaged: async (params?: { q?: string; limit?: number; offset?: number }): Promise<{ items: any[]; total: number; limit: number; offset: number }> => (
    await http.get('/api/rivals/paged', { params })
  ).data,
  create: async (payload: any): Promise<any> => (await http.post('/api/rivals', payload)).data,
  update: async (id: number, payload: any): Promise<any> => (await http.put(`/api/rivals/${id}`, payload)).data,
  remove: async (id: number): Promise<void> => { await http.delete(`/api/rivals/${id}`) },
  listPlayers: async (rivalId: number): Promise<Array<{ id: number; rivalId: number; name: string; number: number; position?: string; notes?: string }>> => {
    try {
      const res = await http.get(`/api/rivals/${rivalId}/players`)
      const data = res.data
      if (Array.isArray(data)) return data
      if (data && Array.isArray((data as any).data)) return (data as any).data
      return []
    } catch {
      return []
    }
  },
  createPlayer: async (rivalId: number, payload: { name: string; number: number; position?: string; notes?: string }): Promise<any> => (
    await http.post(`/api/rivals/${rivalId}/players`, payload)
  ).data,
  updatePlayer: async (rivalId: number, playerId: number, payload: { name?: string; number?: number; position?: string; notes?: string }): Promise<any> => (
    await http.put(`/api/rivals/${rivalId}/players/${playerId}`, payload)
  ).data,
  deletePlayer: async (rivalId: number, playerId: number): Promise<void> => {
    await http.delete(`/api/rivals/${rivalId}/players/${playerId}`)
  },
  getStats: async (id: number): Promise<{
    rival: { id: number; name: string }
    totalAnnotations: number
    eventsCount: number
    statsByType: Record<string, number>
    playerStats: Array<{
      player: { id: number; name: string; number: number }
      goals: number
      assists: number
      interceptions: number
      total: number
    }>
    recentEvents: Array<{
      event: { id: number; title: string; type: string; startsAt: string | null }
      type: string
      timestamp: string
    }>
  }> => (
    await http.get(`/api/rivals/${id}/stats`)
  ).data,
}

export async function exportRivalsCsv(params?: { q?: string }): Promise<Blob> {
  const limit = 200
  let offset = 0
  let all: any[] = []
  while (true) {
    const { items, total } = await rivalsApi.listPaged({ ...params, limit, offset })
    all = all.concat(items)
    offset += items.length
    if (offset >= total || items.length === 0) break
  }
  const header = ['id','name','strengths','weaknesses','lastPlayedAt','notes','createdAt']
  const rows = all.map(r => [
    r.id,
    JSON.stringify(r.name ?? ''),
    JSON.stringify(r.strengths ?? ''),
    JSON.stringify(r.weaknesses ?? ''),
    r.lastPlayedAt ?? '',
    JSON.stringify(r.notes ?? ''),
    r.createdAt,
  ].join(','))
  const csv = [header.join(','), ...rows].join('\n')
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

// Injuries paged + CSV
export const injuriesApi = {
  listPaged: async (params?: { playerId?: number; severity?: string; status?: string; limit?: number; offset?: number }): Promise<{ items: any[]; total: number; limit: number; offset: number }> => (
    await http.get('/api/injuries/paged', { params })
  ).data,
}

export async function exportInjuriesCsv(params?: { playerId?: number; severity?: string; status?: string }): Promise<Blob> {
  const limit = 200
  let offset = 0
  let all: any[] = []
  while (true) {
    const { items, total } = await injuriesApi.listPaged({ ...params, limit, offset })
    all = all.concat(items)
    offset += items.length
    if (offset >= total || items.length === 0) break
  }
  const header = ['id','player','type','severity','status','startDate','endDate','description','createdAt']
  const rows = all.map(i => [
    i.id,
    JSON.stringify(i.player ? `#${i.player.number} ${i.player.name}` : i.playerId),
    JSON.stringify(i.type ?? ''),
    i.severity,
    i.status,
    i.startDate,
    i.endDate ?? '',
    JSON.stringify(i.description ?? ''),
    i.createdAt,
  ].join(','))
  const csv = [header.join(','), ...rows].join('\n')
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

// Resources
export const resourcesApi = {
  list: async (params?: { q?: string; category?: string }): Promise<ResourceItem[]> => (
    await http.get<ResourceItem[]>('/api/resources', { params })
  ).data,
  categories: async (): Promise<string[]> => (
    await http.get<string[]>('/api/resources/categories')
  ).data,
  listPaged: async (params?: { q?: string; category?: string; limit?: number; offset?: number; order?: 'createdAtDesc' | 'titleAsc' }): Promise<{ items: ResourceItem[]; total: number; limit: number; offset: number }> => (
    await http.get('/api/resources/paged', { params })
  ).data,
  create: async (payload: CreateResourceInput): Promise<ResourceItem> => (
    await http.post<ResourceItem>('/api/resources', payload)
  ).data,
  update: async (id: number, payload: UpdateResourceInput): Promise<ResourceItem> => (
    await http.put<ResourceItem>(`/api/resources/${id}`, payload)
  ).data,
  remove: async (id: number): Promise<void> => { await http.delete(`/api/resources/${id}`) },
  bulkDelete: async (ids: number[]): Promise<{ deleted: number[] }> => (
    await http.post<{ deleted: number[] }>(`/api/resources/bulk-delete`, { ids })
  ).data,
}

export async function exportResourcesCsv(params?: { q?: string; category?: string }): Promise<Blob> {
  const items = await resourcesApi.list(params)
  const header = ['id','title','url','description','category','createdAt']
  const rows = items.map(r => [
    r.id,
    JSON.stringify(r.title ?? ''),
    JSON.stringify(r.url ?? ''),
    JSON.stringify(r.description ?? ''),
    JSON.stringify(r.category ?? ''),
    r.createdAt,
  ].join(','))
  const csv = [header.join(','), ...rows].join('\n')
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

export async function exportResourcesCsvServer(params?: { q?: string; category?: string; order?: 'createdAtDesc' | 'titleAsc' }): Promise<Blob> {
  const res = await http.get('/api/resources/export', { params, responseType: 'blob' })
  return res.data as Blob
}

// Admin: Users and Role Requests
export const adminUsersApi = {
  list: async (): Promise<Array<{ id: number; email: string; name?: string; roles: string[]; playerId: number | null }>> => (
    await http.get('/api/users')
  ).data,
  setRoles: async (id: number, roles: Array<'guest'|'player'>): Promise<{ ok: boolean }> => (
    await http.put(`/api/users/${id}/roles`, { roles })
  ).data,
  linkPlayer: async (id: number, playerId: number): Promise<{ id: number; playerId: number }> => (
    await http.put(`/api/users/${id}/link-player`, { playerId })
  ).data,
  listRoleRequests: async (status?: 'PENDING'|'APPROVED'|'DENIED'): Promise<any[]> => (
    await http.get('/api/users/role-requests', { params: { status } })
  ).data,
  approveRoleRequest: async (id: number): Promise<any> => (
    await http.post(`/api/users/role-requests/${id}/approve`, {})
  ).data,
  denyRoleRequest: async (id: number): Promise<any> => (
    await http.post(`/api/users/role-requests/${id}/deny`, {})
  ).data,
  updateRoleRequest: async (id: number, payload: { playerId?: number | null; note?: string }): Promise<any> => (
    await http.put(`/api/users/role-requests/${id}`, payload)
  ).data,
}

export const myRoleRequestsApi = {
  create: async (payload: { role: 'player'; playerId?: number; note?: string; playerData?: { number: number; position: 'HANDLER' | 'CUTTER' | 'HYBRID'; status?: 'ACTIVE' | 'INJURED' | 'INACTIVE'; heightCm?: number; experience?: string } }): Promise<any> => (
    await http.post('/api/users/role-requests', payload)
  ).data,
  listMine: async (): Promise<any[]> => (
    await http.get('/api/users/me/role-requests')
  ).data,
}

export const usersApi = {
  list: async (status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<any[]> => (
    await http.get('/api/users', { params: { status } })
  ).data,
  approve: async (
    id: number,
    payload?: { role?: 'guest' | 'player' | 'admin' | 'captain' | 'coach' | 'treasurer'; playerId?: number; playerData?: { number: number; position: 'HANDLER' | 'CUTTER' | 'HYBRID'; status?: 'ACTIVE' | 'INJURED' | 'INACTIVE'; heightCm?: number; experience?: string } }
  ): Promise<any> => (
    await http.post(`/api/users/${id}/approve`, payload || {})
  ).data,
  reject: async (id: number): Promise<any> => (
    await http.post(`/api/users/${id}/reject`, {})
  ).data,
  delete: async (id: number): Promise<{ message: string }> => (
    await http.delete(`/api/users/${id}`)
  ).data,
  updateProfile: async (payload: { name?: string }): Promise<{ id: number; email: string; name?: string; roles: string[]; playerId?: number | null }> => (
    await http.put('/api/users/me', payload)
  ).data,
  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => (
    await http.put('/api/users/me/password', payload)
  ).data,
  getActivity: async (limit?: number): Promise<any[]> => (
    await http.get('/api/users/me/activity', { params: { limit } })
  ).data,
  togglePlayerRole: async (active: boolean): Promise<{ id: number; email: string; name?: string; roles: string[]; playerId?: number | null }> => (
    await http.put('/api/users/me/player-role', { active })
  ).data,
}

// Annotations API
export const annotationsApi = {
  list: async (params?: { eventId?: number; playerId?: number }): Promise<EventAnnotation[]> => (
    await http.get<EventAnnotation[]>('/api/annotations', { params })
  ).data,
  get: async (id: number): Promise<EventAnnotation> => (
    await http.get<EventAnnotation>(`/api/annotations/${id}`)
  ).data,
  create: async (payload: CreateAnnotationInput): Promise<EventAnnotation> => (
    await http.post<EventAnnotation>('/api/annotations', payload)
  ).data,
  update: async (id: number, payload: UpdateAnnotationInput): Promise<EventAnnotation> => (
    await http.put<EventAnnotation>(`/api/annotations/${id}`, payload)
  ).data,
  remove: async (id: number): Promise<void> => {
    await http.delete(`/api/annotations/${id}`)
  },
  getEventStats: async (eventId: number): Promise<AnnotationStats> => (
    await http.get<AnnotationStats>(`/api/annotations/event/${eventId}/stats`)
  ).data,
}

// News API
export const newsApi = {
  list: async (params?: { published?: boolean; category?: string; limit?: number; offset?: number }): Promise<NewsPostListResponse> => (
    await http.get<NewsPostListResponse>('/api/news', { params })
  ).data,
  get: async (id: number): Promise<NewsPost> => (
    await http.get<NewsPost>(`/api/news/${id}`)
  ).data,
  create: async (payload: CreateNewsPostInput): Promise<NewsPost> => (
    await http.post<NewsPost>('/api/news', payload)
  ).data,
  update: async (id: number, payload: UpdateNewsPostInput): Promise<NewsPost> => (
    await http.put<NewsPost>(`/api/news/${id}`, payload)
  ).data,
  remove: async (id: number): Promise<void> => {
    await http.delete(`/api/news/${id}`)
  },
  uploadFile: async (postId: number, file: File, description?: string): Promise<NewsPostFile> => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    const { data } = await http.post<NewsPostFile>(`/api/news/${postId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },
  deleteFile: async (postId: number, fileId: number): Promise<void> => {
    await http.delete(`/api/news/${postId}/files/${fileId}`)
  },
  downloadFile: async (postId: number, fileId: number, originalName: string): Promise<void> => {
    const response = await http.get(`/api/news/${postId}/files/${fileId}/download`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', originalName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

// Teams API
export interface TeamItem {
  id: number
  name: string
  color?: string | null
  logoUrl?: string | null
  _count?: {
    players?: number
    users?: number
    events?: number
  }
}

export const teamsApi = {
  listPublic: async (): Promise<Array<{ id: number; name: string; color?: string | null; logoUrl?: string | null }>> => {
    const res = await request<any>('/api/teams/public', { method: 'GET' })
    return res.data || res || []
  },
  list: async (): Promise<TeamItem[]> => {
    const { data } = await http.get('/api/teams')
    return Array.isArray(data) ? data : data.data || []
  },
  get: async (id: number): Promise<TeamItem> => {
    const { data } = await http.get(`/api/teams/${id}`)
    return data.data || data
  },
  create: async (payload: { name: string; color?: string; logoUrl?: string }): Promise<TeamItem> => {
    const { data } = await http.post('/api/teams', payload)
    return data.data || data
  },
  update: async (id: number, payload: { name?: string; color?: string; logoUrl?: string }): Promise<TeamItem> => {
    const { data } = await http.put(`/api/teams/${id}`, payload)
    return data.data || data
  },
}

