import React, { useEffect, useMemo, useState } from 'react'
import { eventsApi, channelsApi, attendanceApi, playersApi, annotationsApi } from '../lib/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EventForm from '../components/EventForm'
import LiveAnnotationsTable from '../components/LiveAnnotationsTable'
import TournamentBracket from '../components/TournamentBracket'
import { EventItem, EventType, EventStatus } from '../types/event'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { AttendanceRecord } from '../types/attendance'
import { Player } from '../types/player'
import { EventAnnotation, AnnotationType, CreateAnnotationInput } from '../types/annotation'

const typeLabel: Record<EventType, string> = {
  TRAINING: 'Entrenamiento',
  TOURNAMENT: 'Torneo',
  SOCIAL: 'Social',
  WORKSHOP: 'Taller',
  FULL_DAY_OPEN: 'Full Day Open',
  FULL_DAY_MIXTO: 'Full Day Mixto',
  AMISTOSO: 'Amistoso',
}

const statusBadge: Record<EventStatus, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  ONGOING: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function Events() {
  const toasts = useToast()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<EventItem[]>([])
  const [tab, setTab] = useState<'events' | 'calendar' | 'tournaments' | 'stats'>('events')
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EventItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attEvent, setAttEvent] = useState<EventItem | null>(null)
  const [annotEvent, setAnnotEvent] = useState<EventItem | null>(null)
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ date: Date; events: EventItem[] } | null>(null)
  const [confirmState, setConfirmState] = useState<{ eventId?: number; title?: string; message: string; onYes: () => Promise<void> } | null>(null)

  // API hooks
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
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Sync state from URL
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase()
    return events.filter(e =>
      (typeFilter === 'all' || e.type === typeFilter) &&
      (statusFilter === 'all' || e.status === statusFilter) &&
      (text === '' || e.title.toLowerCase().includes(text))
    )
  }, [events, typeFilter, statusFilter, q])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (currentPage - 1) * limit
    return filtered.slice(start, start + limit)
  }, [filtered, currentPage, limit])

  // Show loading state on initial load
  if (loading && events.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6">
      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded flex items-center justify-between">
          <div className="text-sm truncate pr-2">{error}</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 rounded bg-gray-200" onClick={() => loadEvents()}>Reintentar</button>
            <button className="px-2 py-1 rounded bg-gray-200" onClick={() => setError(null)}>Ocultar</button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Sistema de Eventos</h2>
        {hasPermission('events:manage') && (
          <button onClick={() => setCreateOpen(true)} className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 whitespace-nowrap text-sm sm:text-base">+ Crear Evento</button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow">
        <div className="border-b border-gray-200">
          <nav className="flex gap-2 sm:gap-4 px-2 sm:px-4 overflow-x-auto">
            {[
              { k: 'events', label: 'Eventos' },
              { k: 'calendar', label: 'Calendario' },
              { k: 'tournaments', label: 'Torneos' },
              { k: 'stats', label: 'Estadísticas' },
            ].map(t => (
              <button key={t.k} onClick={() => {
                setTab(t.k as 'events' | 'calendar' | 'tournaments' | 'stats')
                const params: Record<string, string> = {}
                params.tab = t.k
                if (typeFilter !== 'all') params.type = typeFilter
                if (statusFilter !== 'all') params.status = statusFilter
                setSearchParams(params)
              }} className={`py-3 px-2 text-sm font-medium border-b-2 ${tab === t.k ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4">
          {tab === 'events' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-wrap">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const params: Record<string, string> = { tab: 'events' }
                      if (typeFilter !== 'all') params.type = typeFilter
                      if (statusFilter !== 'all') params.status = statusFilter
                      if (q.trim()) params.q = q.trim()
                      params.page = '1'
                      setSearchParams(params)
                    } else if (e.key === 'Escape') {
                      setQ('')
                      const params: Record<string, string> = { tab: 'events' }
                      if (typeFilter !== 'all') params.type = typeFilter
                      if (statusFilter !== 'all') params.status = statusFilter
                      params.page = '1'
                      setSearchParams(params)
                    }
                  }}
                  placeholder="Buscar por título…"
                  className="px-3 py-2 border rounded-lg text-sm w-full sm:min-w-[220px] sm:w-auto"
                />
                <select value={typeFilter} onChange={e => {
                  const val = e.target.value as 'all' | EventType
                  setTypeFilter(val)
                  const params: Record<string, string> = { tab: 'events' }
                  if (val !== 'all') params.type = val
                  if (statusFilter !== 'all') params.status = statusFilter
                  if (q.trim()) params.q = q.trim()
                  params.page = '1'
                  setSearchParams(params)
                }} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="all">Todos los tipos</option>
                  <option value="TOURNAMENT">Torneos</option>
                  <option value="TRAINING">Entrenamientos</option>
                  <option value="SOCIAL">Eventos Sociales</option>
                  <option value="WORKSHOP">Talleres</option>
                  <option value="FULL_DAY_OPEN">Full Day Open</option>
                  <option value="FULL_DAY_MIXTO">Full Day Mixto</option>
                  <option value="AMISTOSO">Amistoso</option>
                </select>
                <select value={statusFilter} onChange={e => {
                  const val = e.target.value as 'all' | EventStatus
                  setStatusFilter(val)
                  const params: Record<string, string> = { tab: 'events' }
                  if (typeFilter !== 'all') params.type = typeFilter
                  if (val !== 'all') params.status = val
                  if (q.trim()) params.q = q.trim()
                  params.page = '1'
                  setSearchParams(params)
                }} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="all">Todos los estados</option>
                  <option value="UPCOMING">Próximos</option>
                  <option value="ONGOING">En curso</option>
                  <option value="COMPLETED">Completados</option>
                  <option value="CANCELLED">Cancelados</option>
                </select>
                <select
                  value={String(limit)}
                  onChange={(e) => {
                    const n = parseInt(e.target.value)
                    setLimit(n)
                    localStorage.setItem('events.limit', String(n))
                    const params: Record<string, string> = { tab: 'events', page: '1', limit: String(n) }
                    if (typeFilter !== 'all') params.type = typeFilter
                    if (statusFilter !== 'all') params.status = statusFilter
                    if (q.trim()) params.q = q.trim()
                    setSearchParams(params)
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  {[10,20,50,100,200].map(n => <option key={n} value={n}>{n} por página</option>)}
                </select>
                <span className="text-sm text-gray-600">Mostrando {paged.length} de {filtered.length} (Total {events.length})</span>
                <button className="px-2 py-1 rounded bg-gray-100" onClick={() => {
                  setTypeFilter('all'); setStatusFilter('all'); setQ(''); setLimit(20); setPage(1)
                  localStorage.removeItem('events.limit')
                  setSearchParams({ tab: 'events', page: '1', limit: '20' })
                }}>Limpiar filtros</button>
                <button
                  className="px-3 py-2 rounded bg-amber-100 text-amber-700"
                  onClick={() => {
                    const params: Record<string, string> = { tab: 'events', page: '1', limit: String(limit) }
                    if (typeFilter !== 'all') params.type = typeFilter
                    if (statusFilter !== 'all') params.status = statusFilter
                    if (q.trim()) params.q = q.trim()
                    setSearchParams(params)
                  }}
                >Aplicar</button>
              </div>

              <div className="space-y-3">
                {paged.map(e => (
                  <div key={e.id} className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{e.title}</div>
                      <div className="text-xs text-gray-500">{typeLabel[e.type]}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusBadge[e.status]}`}>{e.status}</span>
                      <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">{e.startsAt ? new Date(e.startsAt).toLocaleString() : ''}</div>
                      <button className="text-purple-700 hover:underline text-xs sm:text-sm whitespace-nowrap" onClick={async () => {
                        try {
                          // try find or create channel for this event
                          const list = await channelsApi.list(e.id)
                          let ch = list[0]
                          if (!ch) ch = await channelsApi.create({ name: `Canal ${e.title}`, eventId: e.id })
                          navigate(`/comunicacion?channelId=${ch.id}`)
                        } catch {
                          toasts.info('No se pudo abrir el canal')
                        }
                      }}>Abrir canal</button>
                      {hasPermission('events:manage') && (
                        <>
                          <button className="text-teal-700 hover:underline text-xs sm:text-sm whitespace-nowrap" onClick={() => setAttEvent(e)}>Asistencia</button>
                          <button className="text-purple-700 hover:underline text-xs sm:text-sm whitespace-nowrap" onClick={() => setAnnotEvent(e)}>Anotaciones</button>
                          <button className="text-amber-700 hover:underline text-xs sm:text-sm whitespace-nowrap" onClick={() => setEditTarget(e)}>Editar</button>
                          <button className="text-red-600 hover:underline text-xs sm:text-sm whitespace-nowrap" onClick={() => {
                            setConfirmState({
                              eventId: e.id,
                              title: 'Confirmar eliminación',
                              message: `¿Eliminar evento "${e.title}"? Esta acción no se puede deshacer.`,
                              onYes: async () => {
                                await deleteEvent(e.id)
                              }
                            })
                          }}>Eliminar</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {loading && <div className="text-gray-600">Cargando...</div>}
                {!loading && filtered.length === 0 && <div className="text-gray-600">No hay eventos para los filtros seleccionados.</div>}
                {!loading && filtered.length > 0 && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-gray-600">Página {currentPage} de {totalPages}</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 rounded bg-gray-100 disabled:opacity-50"
                        disabled={currentPage <= 1}
                        onClick={() => {
                          const np = currentPage - 1
                          setPage(np)
                          const params = new URLSearchParams(searchParams)
                          params.set('tab', 'events')
                          params.set('page', String(np))
                          params.set('limit', String(limit))
                          if (typeFilter !== 'all') params.set('type', typeFilter); else params.delete('type')
                          if (statusFilter !== 'all') params.set('status', statusFilter); else params.delete('status')
                          if (q.trim()) params.set('q', q.trim()); else params.delete('q')
                          setSearchParams(params)
                        }}
                      >Anterior</button>
                      <button
                        className="px-2 py-1 rounded bg-gray-100 disabled:opacity-50"
                        disabled={currentPage >= totalPages}
                        onClick={() => {
                          const np = currentPage + 1
                          setPage(np)
                          const params = new URLSearchParams(searchParams)
                          params.set('tab', 'events')
                          params.set('page', String(np))
                          params.set('limit', String(limit))
                          if (typeFilter !== 'all') params.set('type', typeFilter); else params.delete('type')
                          if (statusFilter !== 'all') params.set('status', statusFilter); else params.delete('status')
                          if (q.trim()) params.set('q', q.trim()); else params.delete('q')
                          setSearchParams(params)
                        }}
                      >Siguiente</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'calendar' && (
            <CalendarGrid events={events} onSelectDay={(date) => {
              // Filter events for the selected date
              const dayEvents = events.filter(e => {
                if (!e.startsAt) return false
                const eventDate = new Date(e.startsAt)
                return eventDate.toDateString() === date.toDateString()
              })
              
              // If there are events, navigate to the first one or show a modal
              if (dayEvents.length > 0) {
                // If only one event, navigate directly
                if (dayEvents.length === 1) {
                  setEditTarget(dayEvents[0])
                } else {
                  // Multiple events - show selection modal
                  setSelectedDateEvents({ date, events: dayEvents })
                }
              }
            }} />
          )}
          {tab === 'tournaments' && (
            <div className="space-y-6">
              {events.filter(e => e.type === 'TOURNAMENT').length === 0 ? (
                 <div className="text-gray-500 italic p-4 text-center">No hay torneos registrados.</div>
              ) : (
                events.filter(e => e.type === 'TOURNAMENT').map(tournament => (
                  <TournamentBracket 
                    key={tournament.id} 
                    tournament={tournament} 
                    matches={events.filter(m => m.parentId === tournament.id)} 
                  />
                ))
              )}
            </div>
          )}
          {tab === 'stats' && (
            <div className="text-gray-600">Estadísticas de eventos próximamente.</div>
          )}
        </div>
      </div>
    </div>
    {confirmState && (
      <ConfirmModal
        title={confirmState.title || 'Confirmar'}
        message={confirmState.message}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => { await confirmState.onYes(); setConfirmState(null) }}
      />
    )}
  {/* global toasts via ToastProvider */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white p-4">
              <div className="text-lg font-bold">Crear Evento</div>
            </div>
            <div className="p-4">
              <EventForm
                mode="create"
                initial={null}
                onCancel={() => setCreateOpen(false)}
                onSubmit={(data) => createEvent(data)}
              />
            </div>
          </div>
        </div>
      )}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-amber-600 text-white p-4">
              <div className="text-lg font-bold">Editar Evento</div>
            </div>
            <div className="p-4">
              <EventForm
                mode="edit"
                initial={editTarget}
                onCancel={() => setEditTarget(null)}
                onSubmit={(data) => editTarget && updateEvent(editTarget.id, data)}
              />
            </div>
          </div>
        </div>
      )}
      {attEvent && (
        <AttendanceModal eventItem={attEvent} onClose={() => setAttEvent(null)} />
      )}
      {annotEvent && (
        <AnnotationsModal eventItem={annotEvent} onClose={() => setAnnotEvent(null)} />
      )}
      {selectedDateEvents && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDateEvents(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4">
              <div className="text-lg font-bold">
                Eventos del {selectedDateEvents.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {selectedDateEvents.events.length === 0 ? (
                <div className="text-gray-600 text-center py-4">No hay eventos en esta fecha</div>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.events.map(ev => (
                    <div 
                      key={ev.id} 
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedDateEvents(null)
                        setEditTarget(ev)
                      }}
                    >
                      <div className="font-semibold text-gray-800">{ev.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(ev.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {ev.endsAt && ` - ${new Date(ev.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadge[ev.status]}`}>
                          {ev.status}
                        </span>
                        <span className="text-xs text-gray-600">{typeLabel[ev.type]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 flex justify-end border-t">
              <button 
                onClick={() => setSelectedDateEvents(null)} 
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }

function CalendarGrid({ events, onSelectDay }: { events: EventItem[]; onSelectDay: (date: Date) => void }) {
  const [cursor, setCursor] = useState(new Date())
  const start = startOfMonth(cursor)
  const end = endOfMonth(cursor)
  const daysInMonth = end.getDate()
  const firstWeekday = (start.getDay() + 6) % 7 // Monday start
  const weeks: Array<Array<Date | null>> = []
  let day = 1 - firstWeekday
  while (day <= daysInMonth) {
    const week: Array<Date | null> = []
    for (let i = 0; i < 7; i++) {
      if (day < 1 || day > daysInMonth) week.push(null)
      else week.push(new Date(cursor.getFullYear(), cursor.getMonth(), day))
      day++
    }
    weeks.push(week)
  }

  const eventsByDate = new Map<string, EventItem[]>()
  events.forEach(e => {
    if (!e.startsAt) return
    const eventDate = new Date(e.startsAt)
    const key = eventDate.toDateString()
    const arr = eventsByDate.get(key) || []
    arr.push(e)
    eventsByDate.set(key, arr)
  })

  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'TRAINING': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'TOURNAMENT': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SOCIAL': return 'bg-green-100 text-green-800 border-green-200'
      case 'WORKSHOP': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-amber-100 text-amber-800 border-amber-200'
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  return (
    <div className="bg-white rounded-xl shadow p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button 
          className="px-2 sm:px-3 py-1 rounded hover:bg-gray-100 transition-colors text-xs sm:text-sm whitespace-nowrap" 
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          ← Anterior
        </button>
        <div className="font-semibold text-sm sm:text-lg px-2 text-center">{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button 
          className="px-2 sm:px-3 py-1 rounded hover:bg-gray-100 transition-colors text-xs sm:text-sm whitespace-nowrap" 
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          Siguiente →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-1 sm:py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weeks.map((week, wi) => week.map((date, di) => {
          const dayEvents = date ? (eventsByDate.get(date.toDateString()) || []) : []
          const hasEvents = dayEvents.length > 0
          const isCurrentDay = date ? isToday(date) : false
          
          return (
            <div 
              key={`${wi}-${di}`} 
              className={`border rounded-lg min-h-[60px] sm:min-h-[100px] p-1 sm:p-1.5 transition-all cursor-pointer ${
                date 
                  ? isCurrentDay 
                    ? 'bg-blue-50 border-blue-300 ring-1 sm:ring-2 ring-blue-200' 
                    : hasEvents 
                      ? 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  : 'bg-gray-50 border-gray-100'
              }`}
              onClick={() => date && onSelectDay(date)}
            >
              {date && (
                <div className="h-full flex flex-col">
                  <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${isCurrentDay ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>
                    {date.getDate()}
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div 
                        key={ev.id} 
                        className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded border truncate ${getEventColor(ev.type)}`}
                        title={`${ev.title} - ${new Date(ev.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectDay(date)
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] sm:text-[10px] text-gray-500 font-medium px-1">
                        +{dayEvents.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        }))}
      </div>
    </div>
  )
}

function AttendanceModal({ eventItem, onClose }: { eventItem: EventItem; onClose: () => void }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      attendanceApi.listByEvent(eventItem.id),
      playersApi.list(),
    ]).then(([recs, pls]) => {
      setRecords(recs)
      setPlayers(pls)
      setLoading(false)
    }).catch(() => { setError('No se pudo cargar asistencia'); setLoading(false) })
  }, [eventItem.id])

  const statusOf = (playerId: number): string | null => records.find(r => r.playerId === playerId)?.status ?? null

  const setStatus = async (playerId: number, status: 'present' | 'absent' | 'late') => {
    try {
      const existing = records.find(r => r.playerId === playerId)
      const payload = { eventId: eventItem.id, playerId, status }
      const saved = await attendanceApi.upsert(payload)
      if (existing) setRecords(prev => prev.map(r => r.playerId === playerId ? saved : r))
      else setRecords(prev => [...prev, saved])
    } catch {
      alert('No se pudo actualizar la asistencia')
    }
  }

  const clearStatus = async (playerId: number) => {
    try {
      await attendanceApi.remove(eventItem.id, playerId)
      setRecords(prev => prev.filter(r => r.playerId !== playerId))
    } catch {
      alert('No se pudo limpiar la asistencia')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-teal-600 to-indigo-600 text-white p-4">
          <div className="text-lg font-bold">Asistencia — {eventItem.title}</div>
        </div>
        <div className="p-4">
          {loading && <div className="text-gray-600">Cargando…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle sm:px-0">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-2 sm:px-4 py-2">#</th>
                      <th className="text-left px-2 sm:px-4 py-2">Jugador</th>
                      <th className="text-left px-2 sm:px-4 py-2">Estado</th>
                      <th className="px-2 sm:px-4 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map(p => (
                      <tr key={p.id} className="border-t">
                        <td className="px-2 sm:px-4 py-2">{p.number}</td>
                        <td className="px-2 sm:px-4 py-2">{p.name}</td>
                        <td className="px-2 sm:px-4 py-2">
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {(['present','absent','late'] as const).map(st => (
                              <button key={st} onClick={() => setStatus(p.id, st)} className={`px-2 py-1 rounded border text-xs whitespace-nowrap ${statusOf(p.id)===st ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700'}`}>{st}</button>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-right">
                          {statusOf(p.id) && <button onClick={() => clearStatus(p.id)} className="text-red-600 hover:underline text-xs sm:text-sm">Limpiar</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

function AnnotationsModal({ eventItem, onClose }: { eventItem: EventItem; onClose: () => void }) {
  const [annotations, setAnnotations] = useState<EventAnnotation[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAnnotation, setEditingAnnotation] = useState<EventAnnotation | null>(null)
  const [confirmState, setConfirmState] = useState<{ id: number; message: string; onYes: () => Promise<void> } | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list')
  const toasts = useToast()
  const { hasPermission } = useAuth()

  const canManage = hasPermission('events:manage')

  const annotationTypeLabels: Record<AnnotationType, string> = {
    GOAL: 'Gol',
    ASSIST: 'Asistencia',
    DEFENSE: 'Defensa',
    TURNOVER: 'Pérdida',
    DROP: 'Caída',
    FOUL: 'Falta',
    TIMEOUT: 'Tiempo muerto',
    SUBSTITUTION: 'Sustitución',
    INJURY: 'Lesión',
    GENERAL: 'General',
    STRATEGY: 'Estrategia',
    PERFORMANCE: 'Rendimiento',
  }

  const annotationTypeColors: Record<AnnotationType, string> = {
    GOAL: 'bg-green-100 text-green-800',
    ASSIST: 'bg-blue-100 text-blue-800',
    DEFENSE: 'bg-purple-100 text-purple-800',
    TURNOVER: 'bg-red-100 text-red-800',
    DROP: 'bg-orange-100 text-orange-800',
    FOUL: 'bg-yellow-100 text-yellow-800',
    TIMEOUT: 'bg-gray-100 text-gray-800',
    SUBSTITUTION: 'bg-indigo-100 text-indigo-800',
    INJURY: 'bg-red-200 text-red-900',
    GENERAL: 'bg-gray-100 text-gray-800',
    STRATEGY: 'bg-teal-100 text-teal-800',
    PERFORMANCE: 'bg-amber-100 text-amber-800',
  }

  useEffect(() => {
    loadData()
  }, [eventItem.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [anns, pls, sts] = await Promise.all([
        annotationsApi.list({ eventId: eventItem.id }),
        playersApi.list(),
        annotationsApi.getEventStats(eventItem.id).catch(() => null),
      ])
      setAnnotations(anns)
      setPlayers(pls)
      setStats(sts)
      setLoading(false)
    } catch (err) {
      setError('No se pudo cargar las anotaciones')
      setLoading(false)
    }
  }

  const handleCreate = async (data: CreateAnnotationInput) => {
    try {
      const created = await annotationsApi.create(data)
      setAnnotations(prev => [created, ...prev].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))
      setShowCreateForm(false)
      await loadData()
      toasts.success('Anotación creada exitosamente')
    } catch (err: any) {
      toasts.error(err?.response?.data?.error || 'No se pudo crear la anotación')
    }
  }

  const handleUpdate = async (id: number, data: Partial<CreateAnnotationInput>) => {
    try {
      const updated = await annotationsApi.update(id, data)
      setAnnotations(prev => prev.map(a => a.id === id ? updated : a).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))
      setEditingAnnotation(null)
      await loadData()
      toasts.success('Anotación actualizada exitosamente')
    } catch (err: any) {
      toasts.error(err?.response?.data?.error || 'No se pudo actualizar la anotación')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await annotationsApi.remove(id)
      setAnnotations(prev => prev.filter(a => a.id !== id))
      await loadData()
      toasts.success('Anotación eliminada exitosamente')
    } catch (err: any) {
      toasts.error(err?.response?.data?.error || 'No se pudo eliminar la anotación')
    }
  }

  const isFullDay = eventItem.type === 'FULL_DAY_OPEN' || eventItem.type === 'FULL_DAY_MIXTO'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-base sm:text-lg font-bold">Anotaciones — {eventItem.title}</div>
              <div className="text-xs sm:text-sm opacity-90">{typeLabel[eventItem.type]}</div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors ${
                    viewMode === 'list' ? 'bg-white text-purple-600' : 'bg-purple-500 text-white hover:bg-purple-400'
                  }`}
                >
                  Lista
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors ${
                    viewMode === 'table' ? 'bg-white text-purple-600' : 'bg-purple-500 text-white hover:bg-purple-400'
                  }`}
                >
                  Tabla
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {viewMode === 'table' && canManage ? (
            <LiveAnnotationsTable event={eventItem} onClose={onClose} embedded={true} />
          ) : (
            <>
              {loading && <div className="text-gray-600 text-center py-8">Cargando…</div>}
              {error && <div className="text-xs sm:text-sm text-red-600 mb-4 p-2 bg-red-50 rounded">{error}</div>}
              
              {!loading && (
                <>
              {stats && (
                <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600">Total Anotaciones</div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-700">{stats.total}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600">Por Tipo</div>
                    <div className="text-xs sm:text-sm mt-1">
                      {Object.entries(stats.byType).slice(0, 3).map(([type, count]) => (
                        <div key={type}>{annotationTypeLabels[type as AnnotationType]}: {count as number}</div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600">Jugadores con Anotaciones</div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-700">{stats.byPlayer.length}</div>
                  </div>
                </div>
              )}

              {canManage && !showCreateForm && !editingAnnotation && (
                <div className="mb-3 sm:mb-4">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                  >
                    + Nueva Anotación
                  </button>
                </div>
              )}

              {(showCreateForm || editingAnnotation) && canManage && (
                <AnnotationForm
                  eventId={eventItem.id}
                  players={players}
                  isFullDay={isFullDay}
                  initial={editingAnnotation}
                  onSubmit={(data) => {
                    if (editingAnnotation) {
                      handleUpdate(editingAnnotation.id, data)
                    } else {
                      handleCreate({ ...data, eventId: eventItem.id })
                    }
                  }}
                  onCancel={() => {
                    setShowCreateForm(false)
                    setEditingAnnotation(null)
                  }}
                />
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Anotaciones ({annotations.length})</h3>
                {annotations.length === 0 ? (
                  <div className="text-gray-500 text-center py-6 sm:py-8 text-sm">No hay anotaciones registradas</div>
                ) : (
                  <div className="space-y-2">
                    {annotations.map(ann => (
                      <div key={ann.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${annotationTypeColors[ann.type]}`}>
                                {annotationTypeLabels[ann.type]}
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                                #{ann.player?.number} {ann.player?.name}
                              </span>
                              {ann.category && (
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                  {ann.category}
                                </span>
                              )}
                            </div>
                            {ann.note && (
                              <div className="text-xs sm:text-sm text-gray-700 mt-1 break-words">{ann.note}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(ann.timestamp).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          {canManage && (
                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                              <button
                                onClick={() => setEditingAnnotation(ann)}
                                className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded text-sm transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setConfirmState({ id: ann.id, message: '¿Eliminar esta anotación?', onYes: () => handleDelete(ann.id) })}
                                className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
            </>
          )}
        </div>
        
        <div className="p-3 sm:p-4 flex justify-end border-t">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors text-sm sm:text-base">
            Cerrar
          </button>
        </div>
      </div>
      {confirmState && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={confirmState.message}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => { await confirmState.onYes(); setConfirmState(null) }}
        />
      )}
    </div>
  )
}

function AnnotationForm({
  eventId,
  players,
  isFullDay,
  initial,
  onSubmit,
  onCancel,
}: {
  eventId: number
  players: Player[]
  isFullDay: boolean
  initial?: EventAnnotation | null
  onSubmit: (data: CreateAnnotationInput) => void
  onCancel: () => void
}) {
  const [playerId, setPlayerId] = useState<number>(initial?.playerId || players[0]?.id || 0)
  const [type, setType] = useState<AnnotationType>(initial?.type || 'GENERAL')
  const [note, setNote] = useState<string>(initial?.note || '')
  const [timestamp, setTimestamp] = useState<string>(
    initial?.timestamp 
      ? new Date(initial.timestamp).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )
  const [category, setCategory] = useState<string>(initial?.category || '')

  const annotationTypes: AnnotationType[] = [
    'GOAL', 'ASSIST', 'DEFENSE', 'TURNOVER', 'DROP', 'CALLAHAN', 'MVP', 'FOUL',
    'TIMEOUT', 'SUBSTITUTION', 'INJURY', 'GENERAL', 'STRATEGY', 'PERFORMANCE'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      playerId,
      type,
      note: note.trim() || undefined,
      timestamp: new Date(timestamp).toISOString(),
      category: isFullDay && category ? category : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
      <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{initial ? 'Editar' : 'Nueva'} Anotación</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Jugador</label>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(Number(e.target.value))}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            required
          >
            {players.map(p => (
              <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AnnotationType)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            required
          >
            {annotationTypes.map(t => (
              <option key={t} value={t}>
                {t === 'GOAL' ? 'GOL' :
                 t === 'ASSIST' ? 'AST' :
                 t === 'DEFENSE' ? 'INT' :
                 t === 'TURNOVER' ? 'TURN' :
                 t === 'DROP' ? 'DROP' :
                 t === 'CALLAHAN' ? 'CALL' :
                 t === 'MVP' ? 'MVP' :
                 t === 'FOUL' ? 'Falta' :
                 t === 'TIMEOUT' ? 'Tiempo muerto' :
                 t === 'SUBSTITUTION' ? 'Sustitución' :
                 t === 'INJURY' ? 'Lesión' :
                 t === 'GENERAL' ? 'General' :
                 t === 'STRATEGY' ? 'Estrategia' :
                 t === 'PERFORMANCE' ? 'Rendimiento' : t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Momento</label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            required
          />
        </div>
        {isFullDay && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            >
              <option value="">Sin categoría</option>
              <option value="OPEN">Open</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>
        )}
        <div className={isFullDay ? 'md:col-span-2' : ''}>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nota/Descripción</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            rows={3}
            placeholder="Descripción detallada de la anotación..."
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3 sm:mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm"
        >
          {initial ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
