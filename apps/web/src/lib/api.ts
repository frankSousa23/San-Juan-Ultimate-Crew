import axios from 'axios'
import { Player, CreatePlayerInput, UpdatePlayerInput } from '../types/player'
import { EventItem, CreateEventInput, UpdateEventInput } from '../types/event'
import { Channel, Message, CreateChannelInput, CreateMessageInput } from '../types/communications'
import { AttendanceRecord, UpsertAttendanceInput } from '../types/attendance'
import { Account, Category, TransactionItem, TransactionList, FinanceSummary, CreateAccountInput, CreateCategoryInput, CreateTransactionInput, UpdateTransactionInput } from '../types/finance'
import { PlayItem, CreatePlayInput, UpdatePlayInput } from '../types/plays'
import { EventParticipant } from '../types/event'

const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'

export const http = axios.create({ baseURL })

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
  list: async (channelId: number, params?: { limit?: number; before?: string; since?: string }): Promise<Message[]> => {
    const { data } = await http.get<Message[]>('/api/messages', { params: { channelId, ...params } })
    return data
  },
  create: async (payload: CreateMessageInput): Promise<Message> => {
    const { data } = await http.post<Message>('/api/messages', payload)
    return data
  }
}

export const accountsApi = {
  list: async (): Promise<Account[]> => (await http.get<Account[]>('/api/accounts')).data,
  create: async (payload: CreateAccountInput): Promise<Account> => (await http.post<Account>('/api/accounts', payload)).data,
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
  // eslint-disable-next-line no-constant-condition
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

// Rivals paged + CSV
export const rivalsApi = {
  listPaged: async (params?: { q?: string; limit?: number; offset?: number }): Promise<{ items: any[]; total: number; limit: number; offset: number }> => (
    await http.get('/api/rivals/paged', { params })
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
