import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from './useToast'
import DataService, { 
  Player, 
  Event, 
  Transaction, 
  Account, 
  Category, 
  Injury, 
  Rival, 
  Play, 
  Resource, 
  Message, 
  Channel, 
  Attendance, 
  EventParticipant 
} from '../services/dataService'

// Generic data hook
export function useData<T>(
  fetchFn: () => Promise<T[]>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos'
      const status = err?.response?.status
      
      // Only set error state and show toast for non-404/401 errors
      if (status !== 404 && status !== 401) {
        setError(errorMessage)
        showErrorToast(errorMessage)
      } else {
        // For 404/401, set empty data but don't show error
        setData([])
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [fetchFn, showErrorToast, ...dependencies])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Players hook
export function usePlayers() {
  return useData<Player>(() => DataService.getPlayers())
}

export function usePlayer(id: number) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchPlayer = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getPlayer(id)
      setPlayer(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar jugador'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchPlayer()
    }
  }, [id, fetchPlayer])

  const updatePlayer = useCallback(async (updates: Partial<Player>) => {
    try {
      const updated = await DataService.updatePlayer(id, updates)
      setPlayer(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar jugador'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  const deletePlayer = useCallback(async () => {
    try {
      await DataService.deletePlayer(id)
      setPlayer(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar jugador'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  return { player, loading, error, updatePlayer, deletePlayer, refetch: fetchPlayer }
}

// Events hook
export function useEvents() {
  return useData<Event>(() => DataService.getEvents())
}

export function useEvent(id: number) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getEvent(id)
      setEvent(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar evento'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id, fetchEvent])

  const updateEvent = useCallback(async (updates: Partial<Event>) => {
    try {
      const updated = await DataService.updateEvent(id, updates)
      setEvent(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar evento'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  const deleteEvent = useCallback(async () => {
    try {
      await DataService.deleteEvent(id)
      setEvent(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar evento'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  return { event, loading, error, updateEvent, deleteEvent, refetch: fetchEvent }
}

// Transactions hook
export function useTransactions() {
  return useData<Transaction>(() => DataService.getTransactions())
}

export function useTransaction(id: number) {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchTransaction = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getTransaction(id)
      setTransaction(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar transacción'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchTransaction()
    }
  }, [id, fetchTransaction])

  const updateTransaction = useCallback(async (updates: Partial<Transaction>) => {
    try {
      const updated = await DataService.updateTransaction(id, updates)
      setTransaction(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar transacción'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  const deleteTransaction = useCallback(async () => {
    try {
      await DataService.deleteTransaction(id)
      setTransaction(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar transacción'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  return { transaction, loading, error, updateTransaction, deleteTransaction, refetch: fetchTransaction }
}

// Accounts hook
export function useAccounts() {
  return useData<Account>(() => DataService.getAccounts())
}

// Categories hook
export function useCategories() {
  return useData<Category>(() => DataService.getCategories())
}

// Injuries hook
export function useInjuries() {
  return useData<Injury>(() => DataService.getInjuries())
}

export function useInjury(id: number) {
  const [injury, setInjury] = useState<Injury | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchInjury = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getInjury(id)
      setInjury(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar lesión'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchInjury()
    }
  }, [id, fetchInjury])

  const updateInjury = useCallback(async (updates: Partial<Injury>) => {
    try {
      const updated = await DataService.updateInjury(id, updates)
      setInjury(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar lesión'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  const deleteInjury = useCallback(async () => {
    try {
      await DataService.deleteInjury(id)
      setInjury(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar lesión'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  return { injury, loading, error, updateInjury, deleteInjury, refetch: fetchInjury }
}

// Rivals hook
export function useRivals() {
  return useData<Rival>(() => DataService.getRivals())
}

export function useRival(id: number) {
  const [rival, setRival] = useState<Rival | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchRival = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getRival(id)
      setRival(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar rival'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchRival()
    }
  }, [id, fetchRival])

  const updateRival = useCallback(async (updates: Partial<Rival>) => {
    try {
      const updated = await DataService.updateRival(id, updates)
      setRival(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar rival'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  const deleteRival = useCallback(async () => {
    try {
      await DataService.deleteRival(id)
      setRival(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar rival'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  return { rival, loading, error, updateRival, deleteRival, refetch: fetchRival }
}

// Plays hook
export function usePlays() {
  return useData<Play>(() => DataService.getPlays())
}

export function usePlay(id: number) {
  const [play, setPlay] = useState<Play | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchPlay = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getPlay(id)
      setPlay(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar jugada'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchPlay()
    }
  }, [id, fetchPlay])

  const updatePlay = useCallback(async (updates: Partial<Play>) => {
    try {
      const updated = await DataService.updatePlay(id, updates)
      setPlay(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar jugada'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  const deletePlay = useCallback(async () => {
    try {
      await DataService.deletePlay(id)
      setPlay(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar jugada'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  return { play, loading, error, updatePlay, deletePlay, refetch: fetchPlay }
}

// Resources hook
export function useResources() {
  return useData<Resource>(() => DataService.getResources())
}

export function useResource(id: number) {
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchResource = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getResource(id)
      setResource(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar recurso'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchResource()
    }
  }, [id, fetchResource])

  const updateResource = useCallback(async (updates: Partial<Resource>) => {
    try {
      const updated = await DataService.updateResource(id, updates)
      setResource(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar recurso'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  const deleteResource = useCallback(async () => {
    try {
      await DataService.deleteResource(id)
      setResource(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar recurso'
      showErrorToast(errorMessage)
      throw err
    }
  }, [id])

  return { resource, loading, error, updateResource, deleteResource, refetch: fetchResource }
}

// Messages hook
export function useMessages(channelId: number) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getMessages(channelId)
      setMessages(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar mensajes'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    if (channelId) {
      fetchMessages()
    }
  }, [channelId, fetchMessages])

  const sendMessage = useCallback(async (content: string) => {
    try {
      const newMessage = await DataService.createMessage(channelId, content)
      setMessages(prev => [...prev, newMessage])
      return newMessage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar mensaje'
      showErrorToast(errorMessage)
      throw err
    }
  }, [channelId])

  return { messages, loading, error, sendMessage, refetch: fetchMessages }
}

// Channels hook
export function useChannels() {
  return useData<Channel>(() => DataService.getChannels())
}

// Attendance hook
export function useAttendance() {
  return useData<Attendance>(() => DataService.getAttendance())
}

// Event Participants hook
export function useEventParticipants(eventId: number) {
  const [participants, setParticipants] = useState<EventParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getEventParticipants(eventId)
      setParticipants(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar participantes'
      setError(errorMessage)
      showErrorToast(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    if (eventId) {
      fetchParticipants()
    }
  }, [eventId, fetchParticipants])

  const addParticipant = useCallback(async (playerId: number, role?: string) => {
    try {
      const newParticipant = await DataService.addEventParticipant(eventId, playerId, role)
      setParticipants(prev => [...prev, newParticipant])
      return newParticipant
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar participante'
      showErrorToast(errorMessage)
      throw err
    }
  }, [eventId])

  const updateParticipant = useCallback(async (playerId: number, updates: Partial<EventParticipant>) => {
    try {
      const updated = await DataService.updateEventParticipant(eventId, playerId, updates)
      setParticipants(prev => prev.map(p => 
        p.playerId === playerId ? updated : p
      ))
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar participante'
      showErrorToast(errorMessage)
      throw err
    }
  }, [eventId])

  const removeParticipant = useCallback(async (playerId: number) => {
    try {
      await DataService.removeEventParticipant(eventId, playerId)
      setParticipants(prev => prev.filter(p => p.playerId !== playerId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al remover participante'
      showErrorToast(errorMessage)
      throw err
    }
  }, [eventId])

  return { 
    participants, 
    loading, 
    error, 
    addParticipant, 
    updateParticipant, 
    removeParticipant, 
    refetch: fetchParticipants 
  }
}

// Statistics hook
export function useStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showErrorToast } = useToast()
  const showErrorToastRef = useRef(showErrorToast)
  const isFetchingRef = useRef(false)

  // Keep ref updated
  useEffect(() => {
    showErrorToastRef.current = showErrorToast
  }, [showErrorToast])

  const fetchStats = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return
    }
    
    isFetchingRef.current = true
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getStats()
      setStats(result)
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas'
      const status = err?.response?.status
      const isNetworkError = !err?.response && (err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED')
      
      // Handle network errors and HTTP errors silently
      if (isNetworkError || status === 404 || status === 401) {
        // For network errors, 404/401, set empty stats but don't show error
        setStats({ players: 0, events: 0, messages: 0, upcomingEvents: [], attendance: [], eventsByType: [] })
        setError(null)
      } else {
        // Only show error for other HTTP errors (500, etc.)
        setError(errorMessage)
        showErrorToastRef.current(errorMessage)
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, []) // Empty dependencies - use refs for functions

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  return { stats, loading, error, refetch: fetchStats }
}
