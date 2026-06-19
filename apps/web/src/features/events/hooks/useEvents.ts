import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eventsApi } from '../../../lib/api'
import { EventItem, EventType, EventStatus } from '../../../types/event'
import { useApi } from '../../../hooks/useApi'
import { useToast } from '../../../hooks/useToast'

export function useEvents() {
  const toasts = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<EventItem[]>([])
  
  // URL-driven State
  const [tab, setTab] = useState<'events' | 'calendar' | 'tournaments' | 'stats'>('events')
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  
  // Local UI State
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EventItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attEvent, setAttEvent] = useState<EventItem | null>(null)
  const [annotEvent, setAnnotEvent] = useState<EventItem | null>(null)
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: Date; events: EventItem[] } | null>(null)
  const [confirmState, setConfirmState] = useState<{ eventId?: number; title?: string; message: string; onYes: () => Promise<void> } | null>(null)

  // API wrappers
  const { execute: loadEvents, loading } = useApi(eventsApi.list, {
    onSuccess: (data) => setEvents(data),
    showErrorToast: true
  })

  const { execute: createEvent } = useApi(eventsApi.create, {
    onSuccess: (data) => {
      setEvents(prev => [...prev, data].sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()))
      setCreateOpen(false)
      toasts.success('Evento creado exitosamente')
    },
    showErrorToast: true
  })

  const { execute: updateEvent } = useApi(eventsApi.update, {
    onSuccess: (data) => {
      setEvents(prev => prev.map(ev => ev.id === editTarget?.id ? data : ev).sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()))
      setEditTarget(null)
      toasts.success('Evento actualizado exitosamente')
    },
    showErrorToast: true
  })

  const { execute: deleteEvent } = useApi(eventsApi.remove, {
    onSuccess: () => {
      toasts.success('Evento eliminado exitosamente')
      loadEvents()
    },
    showErrorToast: true
  })

  // Initial Data Fetching
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        await loadEvents()
      } catch (err: any) {
        if (mounted) {
          setError(err?.response?.data?.error || 'Error al cargar eventos')
          console.error('Error loading events:', err)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Sync state from URL params
  useEffect(() => {
    const t = searchParams.get('tab')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const sq = searchParams.get('q') || ''
    const slimit = parseInt(searchParams.get('limit') || '')
    const spage = parseInt(searchParams.get('page') || '')
    if (t && ['events','calendar','tournaments','stats'].includes(t) && tab !== t) {
      setTab(t as 'events' | 'calendar' | 'tournaments' | 'stats')
    }
    if (type && (['TOURNAMENT','TRAINING','SOCIAL','WORKSHOP','FULL_DAY_OPEN','FULL_DAY_MIXTO','AMISTOSO'].includes(type) || type === 'all') && typeFilter !== type) {
      setTypeFilter(type as 'all' | EventType)
    }
    if (status && (['UPCOMING','ONGOING','COMPLETED','CANCELLED'].includes(status) || status === 'all') && statusFilter !== status) {
      setStatusFilter(status as 'all' | EventStatus)
    }
    if (sq !== q) setQ(sq)
    if (!Number.isNaN(slimit) && slimit >= 5 && slimit <= 200 && slimit !== limit) setLimit(slimit)
    if (!Number.isNaN(spage) && spage >= 1 && spage !== page) setPage(spage)
  }, [searchParams])

  // Seed limit from localStorage on first load if URL has no limit
  useEffect(() => {
    if (!searchParams.get('limit')) {
      const saved = localStorage.getItem('events.limit')
      if (saved) {
        const n = parseInt(saved)
        if (!Number.isNaN(n) && n >= 5 && n <= 200) {
          const params = new URLSearchParams(searchParams)
          params.set('limit', String(n))
          params.set('page', '1')
          setSearchParams(params)
        }
      }
    }
  }, [])

  // Memoized Filtering
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase()
    return events.filter(e =>
      (typeFilter === 'all' || e.type === typeFilter) &&
      (statusFilter === 'all' || e.status === statusFilter) &&
      (text === '' || e.title.toLowerCase().includes(text))
    )
  }, [events, typeFilter, statusFilter, q])

  // Pagination Logic
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(page, totalPages)
  
  const paged = useMemo(() => {
    const start = (currentPage - 1) * limit
    return filtered.slice(start, start + limit)
  }, [filtered, currentPage, limit])

  return {
    state: {
      events, tab, typeFilter, statusFilter, q, limit, page,
      createOpen, editTarget, error, attEvent, annotEvent,
      selectedDateEvents, confirmState, loading, filtered, paged,
      total, totalPages, currentPage, searchParams
    },
    actions: {
      setTab, setTypeFilter, setStatusFilter, setQ, setLimit, setPage,
      setCreateOpen, setEditTarget, setError, setAttEvent, setAnnotEvent,
      setSelectedDateEvents, setConfirmState, setSearchParams,
      loadEvents, createEvent, updateEvent, deleteEvent
    }
  }
}
