import { api } from '../lib/api'

// Types
export interface Player {
  id: number
  name: string
  number: number
  position: 'HANDLER' | 'CUTTER' | 'HYBRID'
  status: 'ACTIVE' | 'INJURED' | 'INACTIVE'
  heightCm?: number
  experience?: string
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: number
  title: string
  description?: string
  type: 'TRAINING' | 'TOURNAMENT' | 'SOCIAL' | 'WORKSHOP'
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  location?: string
  startsAt: string
  endsAt?: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: number
  accountId: number
  categoryId?: number
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amountCents: number
  occurredAt: string
  description?: string
  createdAt: string
  account?: Account
  category?: Category
}

export interface Account {
  id: number
  name: string
  type: 'CASH' | 'BANK' | 'MOBILE'
  createdAt: string
}

export interface Category {
  id: number
  name: string
  kind: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  createdAt: string
}

export interface Injury {
  id: number
  playerId: number
  type: string
  severity: 'MILD' | 'MODERATE' | 'SEVERE'
  status: 'ACTIVE' | 'RECOVERING' | 'RESOLVED'
  startDate: string
  endDate?: string
  description?: string
  createdAt: string
  player?: Player
}

export interface Rival {
  id: number
  name: string
  strengths?: string
  weaknesses?: string
  lastPlayedAt?: string
  notes?: string
  createdAt: string
}

export interface Play {
  id: number
  name: string
  category: 'OFFENSE' | 'DEFENSE' | 'DRILL'
  description?: string
  diagramUrl?: string
  content?: string
  createdAt: string
}

export interface Resource {
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

export interface Message {
  id: number
  channelId: number
  authorId?: number
  content: string
  createdAt: string
  author?: Player
}

export interface Channel {
  id: number
  name: string
  eventId?: number
  createdAt: string
  messages?: Message[]
}

export interface Attendance {
  id: number
  playerId: number
  eventId: number
  status: string
  note?: string
  createdAt: string
  player?: Player
  event?: Event
}

export interface EventParticipant {
  eventId: number
  playerId: number
  role?: string
  status?: string
  event?: Event
  player?: Player
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Data Service Class
export class DataService {
  // Players
  static async getPlayers(): Promise<Player[]> {
    const response = await api.get<Player[]>('/players')
    return response.data
  }

  static async getPlayer(id: number): Promise<Player> {
    const response = await api.get<Player>(`/players/${id}`)
    return response.data
  }

  static async createPlayer(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> {
    const response = await api.post<Player>('/players', player)
    return response.data
  }

  static async updatePlayer(id: number, player: Partial<Player>): Promise<Player> {
    const response = await api.put<Player>(`/players/${id}`, player)
    return response.data
  }

  static async deletePlayer(id: number): Promise<void> {
    await api.delete(`/players/${id}`)
  }

  // Events
  static async getEvents(): Promise<Event[]> {
    const response = await api.get<Event[]>('/events')
    return response.data
  }

  static async getEvent(id: number): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`)
    return response.data
  }

  static async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const response = await api.post<Event>('/events', event)
    return response.data
  }

  static async updateEvent(id: number, event: Partial<Event>): Promise<Event> {
    const response = await api.put<Event>(`/events/${id}`, event)
    return response.data
  }

  static async deleteEvent(id: number): Promise<void> {
    await api.delete(`/events/${id}`)
  }

  // Transactions
  static async getTransactions(): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/transactions')
    return response.data
  }

  static async getTransaction(id: number): Promise<Transaction> {
    const response = await api.get<Transaction>(`/transactions/${id}`)
    return response.data
  }

  static async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const response = await api.post<Transaction>('/transactions', transaction)
    return response.data
  }

  static async updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction> {
    const response = await api.put<Transaction>(`/transactions/${id}`, transaction)
    return response.data
  }

  static async deleteTransaction(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`)
  }

  // Accounts
  static async getAccounts(): Promise<Account[]> {
    const response = await api.get<Account[]>('/accounts')
    return response.data
  }

  static async createAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const response = await api.post<Account>('/accounts', account)
    return response.data
  }

  // Categories
  static async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories')
    return response.data
  }

  static async createCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const response = await api.post<Category>('/categories', category)
    return response.data
  }

  // Injuries
  static async getInjuries(): Promise<Injury[]> {
    const response = await api.get<Injury[]>('/injuries')
    return response.data
  }

  static async getInjury(id: number): Promise<Injury> {
    const response = await api.get<Injury>(`/injuries/${id}`)
    return response.data
  }

  static async createInjury(injury: Omit<Injury, 'id' | 'createdAt'>): Promise<Injury> {
    const response = await api.post<Injury>('/injuries', injury)
    return response.data
  }

  static async updateInjury(id: number, injury: Partial<Injury>): Promise<Injury> {
    const response = await api.put<Injury>(`/injuries/${id}`, injury)
    return response.data
  }

  static async deleteInjury(id: number): Promise<void> {
    await api.delete(`/injuries/${id}`)
  }

  // Rivals
  static async getRivals(): Promise<Rival[]> {
    const response = await api.get<Rival[]>('/rivals')
    return response.data
  }

  static async getRival(id: number): Promise<Rival> {
    const response = await api.get<Rival>(`/rivals/${id}`)
    return response.data
  }

  static async createRival(rival: Omit<Rival, 'id' | 'createdAt'>): Promise<Rival> {
    const response = await api.post<Rival>('/rivals', rival)
    return response.data
  }

  static async updateRival(id: number, rival: Partial<Rival>): Promise<Rival> {
    const response = await api.put<Rival>(`/rivals/${id}`, rival)
    return response.data
  }

  static async deleteRival(id: number): Promise<void> {
    await api.delete(`/rivals/${id}`)
  }

  // Plays
  static async getPlays(): Promise<Play[]> {
    const response = await api.get<Play[]>('/plays')
    return response.data
  }

  static async getPlay(id: number): Promise<Play> {
    const response = await api.get<Play>(`/plays/${id}`)
    return response.data
  }

  static async createPlay(play: Omit<Play, 'id' | 'createdAt'>): Promise<Play> {
    const response = await api.post<Play>('/plays', play)
    return response.data
  }

  static async updatePlay(id: number, play: Partial<Play>): Promise<Play> {
    const response = await api.put<Play>(`/plays/${id}`, play)
    return response.data
  }

  static async deletePlay(id: number): Promise<void> {
    await api.delete(`/plays/${id}`)
  }

  // Resources
  static async getResources(): Promise<Resource[]> {
    const response = await api.get<Resource[]>('/resources')
    return response.data
  }

  static async getResource(id: number): Promise<Resource> {
    const response = await api.get<Resource>(`/resources/${id}`)
    return response.data
  }

  static async createResource(resource: Omit<Resource, 'id' | 'createdAt'>): Promise<Resource> {
    const response = await api.post<Resource>('/resources', resource)
    return response.data
  }

  static async updateResource(id: number, resource: Partial<Resource>): Promise<Resource> {
    const response = await api.put<Resource>(`/resources/${id}`, resource)
    return response.data
  }

  static async deleteResource(id: number): Promise<void> {
    await api.delete(`/resources/${id}`)
  }

  // Messages
  static async getMessages(channelId: number): Promise<Message[]> {
    const response = await api.get<Message[]>(`/channels/${channelId}/messages`)
    return response.data
  }

  static async createMessage(channelId: number, content: string): Promise<Message> {
    const response = await api.post<Message>(`/channels/${channelId}/messages`, { content })
    return response.data
  }

  // Channels
  static async getChannels(): Promise<Channel[]> {
    const response = await api.get<Channel[]>('/channels')
    return response.data
  }

  static async createChannel(channel: Omit<Channel, 'id' | 'createdAt'>): Promise<Channel> {
    const response = await api.post<Channel>('/channels', channel)
    return response.data
  }

  // Attendance
  static async getAttendance(): Promise<Attendance[]> {
    const response = await api.get<Attendance[]>('/attendance')
    return response.data
  }

  static async createAttendance(attendance: Omit<Attendance, 'id' | 'createdAt'>): Promise<Attendance> {
    const response = await api.post<Attendance>('/attendance', attendance)
    return response.data
  }

  static async updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance> {
    const response = await api.put<Attendance>(`/attendance/${id}`, attendance)
    return response.data
  }

  // Event Participants
  static async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    const response = await api.get<EventParticipant[]>(`/events/${eventId}/participants`)
    return response.data
  }

  static async addEventParticipant(eventId: number, playerId: number, role?: string): Promise<EventParticipant> {
    const response = await api.post<EventParticipant>(`/events/${eventId}/participants`, { playerId, role })
    return response.data
  }

  static async updateEventParticipant(eventId: number, playerId: number, participant: Partial<EventParticipant>): Promise<EventParticipant> {
    const response = await api.put<EventParticipant>(`/events/${eventId}/participants/${playerId}`, participant)
    return response.data
  }

  static async removeEventParticipant(eventId: number, playerId: number): Promise<void> {
    await api.delete(`/events/${eventId}/participants/${playerId}`)
  }

  // Statistics
  static async getStats(): Promise<any> {
    const response = await api.get('/stats')
    return response.data
  }

  // Utility methods
  static formatCurrency(amountCents: number): string {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD'
    }).format(amountCents / 100)
  }

  static formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('es-PR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  static formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('es-PR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  static formatRelativeTime(date: string | Date): string {
    const now = new Date()
    const targetDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

    if (diffInSeconds < 60) return 'hace un momento'
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`
    if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`
    if (diffInSeconds < 31536000) return `hace ${Math.floor(diffInSeconds / 2592000)} meses`
    return `hace ${Math.floor(diffInSeconds / 31536000)} años`
  }
}

export default DataService
