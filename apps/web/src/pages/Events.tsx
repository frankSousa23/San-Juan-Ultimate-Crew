import React, { useEffect, useMemo, useState } from 'react'
import { eventsApi, channelsApi, attendanceApi, playersApi, annotationsApi } from '../lib/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TournamentStatsView from '../components/TournamentStatsView'
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
import RescheduleModal from '../features/events/components/RescheduleModal'
import MesaTecnicaModal from '../components/MesaTecnicaModal'

const typeLabel: Record<EventType, string> = {
  TRAINING: 'Entrenamiento / Scrimmage',
  TOURNAMENT: 'Torneo Oficial',
  SOCIAL: 'Social / Recreativo',
  WORKSHOP: 'Taller / Clínica',
  FULL_DAY_OPEN: 'Full Day Open',
  FULL_DAY_MIXTO: 'Full Day Mixto',
  AMISTOSO: 'Amistoso Interclub',
  MATCH: 'Partido Oficial',
}

const STATUS_LABELS: Record<EventStatus, string> = { UPCOMING: 'Próximo', ONGOING: 'En Curso', COMPLETED: 'Completado', CANCELLED: 'Cancelado / Postergado' };
const statusBadge: Record<EventStatus, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  ONGOING: 'bg-green-100 text-green-700 animate-pulse',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function Events() {
  const toasts = useToast()
  const navigate = useNavigate()
  const { user, hasPermission, hasRole } = useAuth()
  const isGuest = hasRole('guest') || user?.email === 'guest@sigedivo.com'
  const canManageEvents = hasPermission('events:manage') || hasRole('admin') || hasRole('captain') || hasRole('coach') || hasRole('directiva')

  const canUserAnnotate = (e: EventItem) => {
    if (hasRole('admin') || hasRole('directiva') || hasPermission('events:manage') || hasPermission('annotations:manage')) return true;
    if (hasRole('coach') || hasRole('captain') || hasRole('annotator')) return true;
    if (user?.id && e.officialAnnotatorId === user.id) return true;
    if (hasRole('player')) {
      const strictTypes = ['TOURNAMENT', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'MATCH'];
      if (e.isInternalScrimmage) return true;
      if (!strictTypes.includes(e.type)) return true;
      if (!e.isAnnotatorLocked) return true;
    }
    return false;
  }
  
  const { state, actions } = useEvents()
  const {
    events, tab, typeFilter, statusFilter, q, limit, page,
    createOpen, editTarget, error, attEvent, annotEvent,
    selectedDateEvents, confirmState, loading, filtered, paged,
    totalPages, currentPage, searchParams
  } = state
  const [expandedTournaments, setExpandedTournaments] = useState<number[]>([])
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<EventItem | null>(null)
  const [mesaTecnicaTarget, setMesaTecnicaTarget] = useState<EventItem | null>(null)
  const [categorySegment, setCategorySegment] = useState<'all' | 'major' | 'casual' | 'friendly'>('all')

  const {
    setTab, setTypeFilter, setStatusFilter, setQ, setLimit, setPage,
    setCreateOpen, setEditTarget, setError, setAttEvent, setAnnotEvent,
    setSelectedDateEvents, setConfirmState, setSearchParams,
    loadEvents, createEvent, updateEvent, deleteEvent
  } = actions

  const handleQuickScrimmage = async () => {
    try {
      const defaultScrimmage = {
        title: `Scrimmage Interno (${new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })})`,
        type: 'TRAINING' as EventType,
        status: 'ONGOING' as EventStatus,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        location: 'Cancha de Práctica',
        isInternalScrimmage: true,
        description: 'Partido de práctica entre escuadras internas (Claro vs Oscuro). Anotación rápida habilitada para cualquier jugador.',
      }
      const created = await createEvent(defaultScrimmage)
      if (created && created.id) {
        toasts.success('Scrimmage iniciado con éxito')
        navigate(`/anotaciones?eventId=${created.id}`)
      }
    } catch (err: any) {
      toasts.error(err?.message || 'Error al iniciar scrimmage rápido')
    }
  }

  // Filtered by category segment
  const segmentFiltered = useMemo(() => {
    if (categorySegment === 'major') {
      return paged.filter(e => e.type === 'TOURNAMENT' || e.type === 'FULL_DAY_OPEN' || e.type === 'FULL_DAY_MIXTO' || e.type === 'MATCH')
    }
    if (categorySegment === 'casual') {
      return paged.filter(e => e.type === 'TRAINING' || e.isInternalScrimmage)
    }
    if (categorySegment === 'friendly') {
      return paged.filter(e => e.type === 'AMISTOSO')
    }
    return paged
  }, [paged, categorySegment])

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Sistema de Eventos & Torneos</h2>
          <p className="text-xs text-gray-500 mt-0.5">Gestión de Mesa Técnica, Planificación de Torneos, Full Days, Entrenamientos y Scrimmages</p>
        </div>
        <div className="flex items-center gap-2">
          {canUserAnnotate({ type: 'TRAINING', isInternalScrimmage: true } as any) && (
            <button 
              onClick={handleQuickScrimmage} 
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-3.5 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 whitespace-nowrap text-xs sm:text-sm shadow font-bold flex items-center gap-1.5 transition"
              title="Iniciar de inmediato un partido de entrenamiento entre escuadras y abrir la pizarra"
            >
              <span>🥏</span>
              <span>+ Scrimmage Rápido</span>
            </button>
          )}
          {canManageEvents && (
            <button 
              onClick={() => setCreateOpen(true)} 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 whitespace-nowrap text-xs sm:text-sm shadow font-semibold transition"
            >
              + Crear Evento
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow">
        <div className="border-b border-gray-200">
          <nav className="flex gap-2 sm:gap-4 px-2 sm:px-4 overflow-x-auto">
            {[
              { k: 'events', label: 'Todos los Eventos' },
              { k: 'calendar', label: 'Calendario' },
              { k: 'tournaments', label: '🏆 Torneos & Mesa Técnica' },
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
              {/* Category Segment Pills */}
              <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Filtrar por:</span>
                <button
                  onClick={() => setCategorySegment('all')}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${categorySegment === 'all' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  🌟 Todos ({paged.length})
                </button>
                <button
                  onClick={() => setCategorySegment('major')}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${categorySegment === 'major' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'}`}
                >
                  🏆 Torneos & Full Days (Mesa Técnica)
                </button>
                <button
                  onClick={() => setCategorySegment('casual')}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${categorySegment === 'casual' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'}`}
                >
                  🥏 Entrenamientos & Scrimmages
                </button>
                <button
                  onClick={() => setCategorySegment('friendly')}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${categorySegment === 'friendly' ? 'bg-sky-600 text-white shadow-xs font-bold' : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'}`}
                >
                  🤝 Amistosos Interclubes
                </button>
              </div>

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
                  <option value="TRAINING">Entrenamientos / Scrimmage</option>
                  <option value="FULL_DAY_OPEN">Full Day Open</option>
                  <option value="FULL_DAY_MIXTO">Full Day Mixto</option>
                  <option value="AMISTOSO">Amistoso</option>
                  <option value="MATCH">Partido Oficial</option>
                  <option value="SOCIAL">Eventos Sociales</option>
                  <option value="WORKSHOP">Talleres</option>
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
                  <option value="ONGOING">En curso (En Vivo)</option>
                  <option value="COMPLETED">Completados</option>
                  <option value="CANCELLED">Postergados / Cancelados</option>
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
                <span className="text-sm text-gray-600">Mostrando {segmentFiltered.length} de {filtered.length} (Total {events.length})</span>
                <button className="px-2 py-1 rounded bg-gray-100 text-xs sm:text-sm" onClick={() => {
                  setTypeFilter('all'); setStatusFilter('all'); setQ(''); setLimit(20); setPage(1)
                  localStorage.removeItem('events.limit')
                  setSearchParams({ tab: 'events', page: '1', limit: '20' })
                }}>Limpiar filtros</button>
              </div>

              <div className="space-y-3">
                {segmentFiltered.map(e => {
                  const isMajor = e.type === 'TOURNAMENT' || e.type === 'FULL_DAY_OPEN' || e.type === 'FULL_DAY_MIXTO' || e.type === 'MATCH'
                  return (
                  <React.Fragment key={e.id}>
                  <div className="bg-white border hover:shadow-md transition-shadow rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <button onClick={() => setDetailEvent(e)} className="font-bold text-gray-900 hover:text-indigo-600 hover:underline text-left truncate text-base">
                          {e.title}
                        </button>
                        {e.isInternalScrimmage && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            🥏 Scrimmage Interno
                          </span>
                        )}
                        {isMajor && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                            🏆 Mesa Técnica
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{typeLabel[e.type]}</span>
                        {e.location && <span>• 📍 {e.location}</span>}
                        {e.officialAnnotator && (
                          <span className="text-indigo-700 font-medium">
                            • 📋 Mesa: {e.officialAnnotator.name || e.officialAnnotator.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium ${statusBadge[e.status]}`}>{STATUS_LABELS[e.status]}</span>
                      <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap font-medium">{e.startsAt ? new Date(e.startsAt).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      
                      {canUserAnnotate(e) && (
                        <button 
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs sm:text-sm whitespace-nowrap font-bold transition shadow-xs flex items-center gap-1" 
                          onClick={() => setAnnotEvent(e)}
                          title="Abrir Pizarra y Anotador en Vivo"
                        >
                          <span>🥏</span>
                          <span>Anotaciones</span>
                        </button>
                      )}

                      {canManageEvents && (
                        <>
                          {(e.type === 'TOURNAMENT' || e.type === 'FULL_DAY_OPEN' || e.type === 'FULL_DAY_MIXTO' || e.type === 'MATCH' || e.type === 'AMISTOSO') && (
                            <button
                              className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-xs sm:text-sm whitespace-nowrap font-bold transition shadow-xs flex items-center gap-1"
                              onClick={() => setMesaTecnicaTarget(e)}
                              title="Designar responsables de Mesa Técnica, planillero, cronometrista y relevos"
                            >
                              <span>📋</span>
                              <span>Mesa Técnica</span>
                            </button>
                          )}
                          <button 
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-xs sm:text-sm whitespace-nowrap font-semibold transition" 
                            onClick={() => setRescheduleTarget(e)}
                            title="Modificar horario, retrasos o contingencias climáticas rápidamente"
                          >
                            ⏱️ Horario
                          </button>
                          <button className="text-teal-700 hover:underline text-xs sm:text-sm whitespace-nowrap font-medium" onClick={() => setAttEvent(e)}>📋 Asistencia</button>
                          <button className="text-gray-700 hover:underline text-xs sm:text-sm whitespace-nowrap font-medium" onClick={() => setEditTarget(e)}>Editar</button>
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
                        {expandedTournaments.includes(e.id) ? `▼ Ocultar ${e.children.length} Partidos Planificados` : `▶ Ver ${e.children.length} Partidos Planificados`}
                      </button>
                      {expandedTournaments.includes(e.id) && (
                        <div className="space-y-2 mt-2">
                          {e.children.map(child => (
                            <div key={child.id} className="bg-gray-50 border hover:shadow-sm transition-shadow rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ml-4">
                              <div className="flex-1 min-w-0">
                                <button onClick={() => setDetailEvent(child as any)} className="font-medium text-indigo-900 hover:text-indigo-600 hover:underline text-sm truncate text-left w-full sm:w-auto">
                                  {child.title}
                                </button>
                                <div className="text-xs text-gray-500 mt-0.5">{typeLabel[child.type] || child.type}</div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadge[child.status]}`}>{STATUS_LABELS[child.status]}</span>
                                <div className="text-xs text-gray-600 whitespace-nowrap">{child.startsAt ? new Date(child.startsAt).toLocaleString() : ''}</div>
                                {canManageEvents && (
                                  <>
                                    <button 
                                      className="text-amber-700 hover:underline text-xs whitespace-nowrap font-medium" 
                                      onClick={() => setRescheduleTarget(child as any)}
                                    >
                                      ⏱️ Horario
                                    </button>
                                    <button className="text-teal-700 hover:underline text-xs whitespace-nowrap" onClick={() => setAttEvent(child as any)}>Asistencia</button>
                                  </>
                                )}
                                {canUserAnnotate(child as any) && (
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
                )})}
                {loading && <div className="text-gray-600">Cargando...</div>}
                {!loading && segmentFiltered.length === 0 && <div className="text-gray-600 p-8 text-center bg-gray-50 rounded-xl border border-dashed">No hay eventos para la categoría o filtros seleccionados.</div>}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl shadow-xs border border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Mesa Técnica & Planificación de Torneos</h3>
                  <p className="text-xs text-gray-500">
                    Administra calendarios, horarios, rondas de partidos y estadísticas acumuladas para Torneos y Full Days
                  </p>
                </div>
                {canManageEvents && (
                  <button
                    onClick={() => {
                      setEditTarget(null)
                      setCreateOpen(true)
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-colors"
                  >
                    + Nuevo Torneo / Full Day
                  </button>
                )}
              </div>

              {events.filter(e => e.type === 'TOURNAMENT' || e.type === 'FULL_DAY_OPEN' || e.type === 'FULL_DAY_MIXTO').length === 0 ? (
                 <div className="text-gray-500 italic p-12 bg-white rounded-xl border border-dashed text-center">
                   No hay torneos o jornadas Full Day registradas.
                 </div>
              ) : (
                events.filter(e => e.type === 'TOURNAMENT' || e.type === 'FULL_DAY_OPEN' || e.type === 'FULL_DAY_MIXTO').map(tournament => (
                  <TournamentBracket 
                    key={tournament.id} 
                    tournament={tournament} 
                    matches={events.filter(m => m.parentId === tournament.id)} 
                    canManage={canManageEvents}
                    onEditMatch={(m) => setEditTarget(m)}
                    onAddMatch={(t) => {
                      setEditTarget(null)
                      setCreateOpen(true)
                    }}
                  />
                ))
              )}
            </div>
          )}
          {tab === 'stats' && (
            <div className="space-y-6">
              <TournamentStatsView />
            </div>
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

    {detailEvent && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailEvent(null)}>
        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-4 text-white flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-90">Detalles del Evento</div>
              <div className="text-xl font-bold">{detailEvent.title}</div>
            </div>
            <button onClick={() => setDetailEvent(null)} className="text-white/80 hover:text-white text-xl font-bold p-1">✕</button>
          </div>
          <div className="p-5 space-y-4 text-sm">
            <div className="bg-orange-50 p-4 rounded-xl flex items-center justify-between border border-orange-100">
              <div>
                <span className="text-xs text-orange-800/70 block uppercase font-medium">Estado actual</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${statusBadge[detailEvent.status]}`}>
                  {STATUS_LABELS[detailEvent.status]}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-orange-800/70 block uppercase font-medium">Tipo</span>
                <span className="text-lg font-bold text-gray-900 mt-0.5 inline-block">
                  {typeLabel[detailEvent.type] || detailEvent.type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-gray-500 block mb-1">Inicio</span>
                <span className="font-semibold text-gray-800">{new Date(detailEvent.startsAt).toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-gray-500 block mb-1">Fin Estimado</span>
                <span className="font-semibold text-gray-800">{detailEvent.endsAt ? new Date(detailEvent.endsAt).toLocaleString() : 'No definido'}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <span className="text-xs text-gray-500 block mb-1 font-medium">Ubicación</span>
              <p className="text-gray-800 whitespace-pre-wrap">{detailEvent.location || 'Por confirmar'}</p>
            </div>

            {detailEvent.description && (
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <span className="text-xs text-gray-500 block mb-1 font-medium">Descripción / Notas</span>
                <p className="text-gray-800 whitespace-pre-wrap">{detailEvent.description}</p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  try {
                    const list = await channelsApi.list(detailEvent.id)
                    let ch = list[0]
                    if (!ch) ch = await channelsApi.create({ name: `Canal ${detailEvent.title}`, eventId: detailEvent.id })
                    navigate(`/comunicacion?channelId=${ch.id}`)
                  } catch {
                    toasts.info('No se pudo abrir el canal')
                  }
                }}
                className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 rounded-lg font-semibold transition"
              >
                Abrir Canal
              </button>
              
              {canManageEvents && (
                <button
                  onClick={() => {
                    const itemToEdit = detailEvent
                    setDetailEvent(null)
                    setEditTarget(itemToEdit)
                  }}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-medium transition"
                >
                  Editar Evento
                </button>
              )}
              
              <button
                onClick={() => setDetailEvent(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

  {/* global toasts via ToastProvider */}
      <EventModals 
        createOpen={createOpen}
        editTarget={editTarget}
        setCreateOpen={setCreateOpen}
        setEditTarget={setEditTarget}
        createEvent={async (data) => { await createEvent(data) }}
        updateEvent={async (id, data) => { await updateEvent(id, data) }}
      />
      {rescheduleTarget && (
        <RescheduleModal
          event={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSave={async (id, data) => {
            await updateEvent(id, data)
            toasts.success('Horario y contingencia actualizados correctamente')
          }}
        />
      )}
      {mesaTecnicaTarget && (
        <MesaTecnicaModal
          event={mesaTecnicaTarget}
          isOpen={Boolean(mesaTecnicaTarget)}
          onClose={() => setMesaTecnicaTarget(null)}
          onUpdated={() => {
            loadEvents()
          }}
        />
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
                        {canUserAnnotate(ev) && (
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
  
  const canManage = (() => {
    if (hasRole('admin') || hasRole('directiva') || hasPermission('events:manage') || hasPermission('annotations:manage')) return true;
    if (hasRole('coach') || hasRole('captain') || hasRole('annotator')) return true;
    if (hasRole('player')) {
      const strictTypes = ['TOURNAMENT', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'MATCH'];
      return !strictTypes.includes(eventItem.type);
    }
    return false;
  })()

  const annotationTypeLabels: Record<AnnotationType, string> = {
    GOAL: 'Gol',
    ASSIST: 'Asistencia',
    DEFENSE: 'Defensa',
    TURNOVER: 'Pérdida',
  }

  const annotationTypeColors: Record<AnnotationType, string> = {
    GOAL: 'bg-green-100 text-green-800',
    ASSIST: 'bg-blue-100 text-blue-800',
    DEFENSE: 'bg-purple-100 text-purple-800',
    TURNOVER: 'bg-red-100 text-red-800',
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

