import React, { useEffect, useMemo, useState } from 'react'
import { eventsApi, channelsApi, attendanceApi, playersApi, annotationsApi } from '../lib/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EventForm from '../components/EventForm'
import LiveAnnotationsTable from '../components/LiveAnnotationsTable'
import TournamentBracket from '../components/TournamentBracket'
import { EventItem, EventType, EventStatus } from '../types/event'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../contexts/AuthContext'
import { AttendanceRecord } from '../types/attendance'
import { Player } from '../types/player'
import { EventAnnotation, AnnotationType, CreateAnnotationInput } from '../types/annotation'
import { useEvents } from '../features/events/hooks/useEvents'
import { useToast } from '../hooks/useToast'
import { AnnotationForm } from '../features/events/components/AnnotationForm'
import { EventModals } from '../features/events/components/EventModals'

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
  const { user, hasPermission, hasRole } = useAuth()
  const isGuest = hasRole('guest') || user?.email === 'guest@sigedivo.com'
  const canManageEvents = hasPermission('events:manage') || hasRole('admin') || hasRole('captain') || hasRole('coach') || isGuest
  const canAnnotate = hasPermission('annotations:manage') || hasPermission('events:manage') || hasRole('admin') || hasRole('captain') || hasRole('coach') || hasRole('annotator') || isGuest
  
  const { state, actions } = useEvents()
  const {
    events, tab, typeFilter, statusFilter, q, limit, page,
    createOpen, editTarget, error, attEvent, annotEvent,
    selectedDateEvents, confirmState, loading, filtered, paged,
    totalPages, currentPage, searchParams
  } = state
  const [expandedTournaments, setExpandedTournaments] = useState<number[]>([])
  const {
    setTab, setTypeFilter, setStatusFilter, setQ, setLimit, setPage,
    setCreateOpen, setEditTarget, setError, setAttEvent, setAnnotEvent,
    setSelectedDateEvents, setConfirmState, setSearchParams,
    loadEvents, createEvent, updateEvent, deleteEvent
  } = actions

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
        {canManageEvents && (
          <button onClick={() => setCreateOpen(true)} className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 whitespace-nowrap text-sm sm:text-base shadow font-semibold">+ Crear Evento</button>
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
                  <React.Fragment key={e.id}>
                  <div className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                      
                      {canAnnotate && (
                        <button className="text-purple-700 hover:underline text-xs sm:text-sm whitespace-nowrap font-medium" onClick={() => setAnnotEvent(e)}>🥏 Anotaciones</button>
                      )}

                      {canManageEvents && (
                        <>
                          <button className="text-teal-700 hover:underline text-xs sm:text-sm whitespace-nowrap font-medium" onClick={() => setAttEvent(e)}>📋 Asistencia</button>
                          <button className="text-amber-700 hover:underline text-xs sm:text-sm whitespace-nowrap font-medium" onClick={() => setEditTarget(e)}>Editar</button>
                          <button className="text-red-600 hover:underline text-xs sm:text-sm whitespace-nowrap font-medium" onClick={() => {
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
                  {e.type === 'TOURNAMENT' && e.children && e.children.length > 0 && (
                    <div className="pl-4 border-l-2 border-indigo-200 mt-2 space-y-2">
                      <button
                        onClick={() => setExpandedTournaments(prev => prev.includes(e.id) ? prev.filter(id => id !== e.id) : [...prev, e.id])}
                        className="text-indigo-600 text-sm font-semibold hover:underline"
                      >
                        {expandedTournaments.includes(e.id) ? `▼ Ocultar ${e.children.length} Partidos` : `▶ Ver ${e.children.length} Partidos`}
                      </button>
                      {expandedTournaments.includes(e.id) && (
                        <div className="space-y-2 mt-2">
                          {e.children.map(child => (
                            <div key={child.id} className="bg-gray-50 border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ml-4">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-800 text-sm truncate">{child.title}</div>
                                <div className="text-xs text-gray-500">{typeLabel[child.type] || child.type}</div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadge[child.status]}`}>{child.status}</span>
                                <div className="text-xs text-gray-600 whitespace-nowrap">{child.startsAt ? new Date(child.startsAt).toLocaleString() : ''}</div>
                                {canManageEvents && (
                                  <button className="text-teal-700 hover:underline text-xs whitespace-nowrap" onClick={() => setAttEvent(child as any)}>Asistencia</button>
                                )}
                                {canAnnotate && (
                                  <button className="text-purple-700 hover:underline text-xs whitespace-nowrap font-medium" onClick={() => setAnnotEvent(child as any)}>🥏 Anotaciones</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  </React.Fragment>
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
      <EventModals 
        createOpen={createOpen}
        editTarget={editTarget}
        setCreateOpen={setCreateOpen}
        setEditTarget={setEditTarget}
        createEvent={createEvent}
        updateEvent={updateEvent}
      />
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
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setSelectedDateEvents(null)
                          setEditTarget(ev)
                        }}
                      >
                        <div className="font-semibold text-gray-800">{ev.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(ev.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {ev.endsAt && ` - ${new Date(ev.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[ev.status]}`}>
                            {ev.status}
                          </span>
                          <span className="text-xs text-gray-600">{typeLabel[ev.type]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {canAnnotate && (
                          <button
                            onClick={() => {
                              setSelectedDateEvents(null)
                              setAnnotEvent(ev)
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-md transition"
                          >
                            🥏 Anotar
                          </button>
                        )}
                        {canManageEvents && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedDateEvents(null)
                                setAttEvent(ev)
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-teal-100 text-teal-800 hover:bg-teal-200 rounded-md transition"
                            >
                              📋 Asistencia
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDateEvents(null)
                                setEditTarget(ev)
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-md transition"
                            >
                              ✏️ Editar
                            </button>
                          </>
                        )}
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
  const navigate = useNavigate()
  const { user, hasPermission, hasRole } = useAuth()
  const isGuest = hasRole('guest') || user?.email === 'guest@sigedivo.com'
  const canManage = hasPermission('annotations:manage') || hasPermission('events:manage') || hasRole('admin') || hasRole('captain') || hasRole('coach') || hasRole('annotator') || isGuest

  const annotationTypeLabels: Record<AnnotationType, string> = {
    GOAL: 'Gol',
    ASSIST: 'Asistencia',
    DEFENSE: 'Defensa',
    TURNOVER: 'Pérdida',
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose()
                  navigate(`/anotaciones?eventId=${eventItem.id}`)
                }}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow flex items-center gap-1 transition"
                title="Abrir en vista de anotaciones táctiles completas"
              >
                <span>🥏 Pizarra Completa</span>
              </button>
              {canManage && (
                <>
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
                    Pizarra Rápida
                  </button>
                </>
              )}
            </div>
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

