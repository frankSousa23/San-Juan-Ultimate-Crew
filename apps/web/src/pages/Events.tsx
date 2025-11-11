import React, { useEffect, useMemo, useState } from 'react'
import { eventsApi, channelsApi, attendanceApi, playersApi } from '../lib/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EventForm from '../components/EventForm'
import { EventItem, EventType, EventStatus } from '../types/event'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'
import { AttendanceRecord } from '../types/attendance'
import { Player } from '../types/player'

const typeLabel: Record<EventType, string> = {
  TRAINING: 'Entrenamiento',
  TOURNAMENT: 'Torneo',
  SOCIAL: 'Social',
  WORKSHOP: 'Taller',
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
  
  const [confirmState, setConfirmState] = useState<{ title?: string; message: string; onYes: () => Promise<void> } | null>(null)

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
      setEvents(prev => prev.filter(x => x.id !== confirmState?.onYes))
      toasts.success('Evento eliminado exitosamente')
    },
    showErrorToast: true
  })

  useEffect(() => {
    loadEvents()
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
    if (type && (['TOURNAMENT','TRAINING','SOCIAL','WORKSHOP'].includes(type) || type === 'all') && typeFilter !== type) {
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Sistema de Eventos</h2>
        <button onClick={() => setCreateOpen(true)} className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600">+ Crear Evento</button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 px-4">
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
              <div className="flex gap-2 items-center flex-wrap">
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
                  className="px-3 py-2 border rounded-lg text-sm min-w-[220px]"
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
                  <div key={e.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{e.title}</div>
                      <div className="text-xs text-gray-500">{typeLabel[e.type]}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusBadge[e.status]}`}>{e.status}</span>
                      <div className="text-sm text-gray-600">{e.startsAt ? new Date(e.startsAt).toLocaleString() : ''}</div>
                      <button className="text-purple-700 hover:underline" onClick={async () => {
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
                      <button className="text-teal-700 hover:underline" onClick={() => setAttEvent(e)}>Asistencia</button>
                      <button className="text-amber-700 hover:underline" onClick={() => setEditTarget(e)}>Editar</button>
                      <button className="text-red-600 hover:underline" onClick={() => {
                        setConfirmState({
                          title: 'Confirmar eliminación',
                          message: `¿Eliminar evento "${e.title}"? Esta acción no se puede deshacer.`,
                          onYes: async () => {
                            await deleteEvent(e.id)
                          }
                        })
                      }}>Eliminar</button>
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
            <CalendarGrid events={events} onSelectDay={() => {}} />
          )}
          {tab === 'tournaments' && (
            <div className="text-gray-600">Gestión de brackets y llaves próximamente.</div>
          )}
          {tab === 'stats' && (
            <div className="text-gray-600">Estadísticas de eventos próximamente.</div>
          )}
        </div>
      </div>
    </div>
  {/* global toasts via ToastProvider */}
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
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
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
    const key = new Date(e.startsAt).toDateString()
    const arr = eventsByDate.get(key) || []
    arr.push(e)
    eventsByDate.set(key, arr)
  })

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button className="px-2 py-1" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</button>
        <div className="font-semibold">{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button className="px-2 py-1" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weeks.map((week, wi) => week.map((date, di) => (
          <div key={`${wi}-${di}`} className={`border rounded-lg min-h-[90px] p-1 ${date ? 'bg-white' : 'bg-gray-50'}`}>
            {date && (
              <div>
                <div className="text-xs text-gray-500 mb-1">{date.getDate()}</div>
                <div className="space-y-1">
                  {(eventsByDate.get(date.toDateString()) || []).slice(0,3).map(ev => (
                    <div key={ev.id} className="text-[11px] px-1 py-0.5 rounded bg-amber-100 text-amber-800 truncate" title={ev.title}>{ev.title}</div>
                  ))}
                  {(eventsByDate.get(date.toDateString()) || []).length > 3 && <div className="text-[11px] text-gray-500">+{(eventsByDate.get(date.toDateString()) || []).length - 3} más</div>}
                </div>
              </div>
            )}
          </div>
        )))}
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-teal-600 to-indigo-600 text-white p-4">
          <div className="text-lg font-bold">Asistencia — {eventItem.title}</div>
        </div>
        <div className="p-4">
          {loading && <div className="text-gray-600">Cargando…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">#</th>
                    <th className="text-left px-4 py-2">Jugador</th>
                    <th className="text-left px-4 py-2">Estado</th>
                    <th className="px-4 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-2">{p.number}</td>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          {(['present','absent','late'] as const).map(st => (
                            <button key={st} onClick={() => setStatus(p.id, st)} className={`px-2 py-1 rounded border text-xs ${statusOf(p.id)===st ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700'}`}>{st}</button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {statusOf(p.id) && <button onClick={() => clearStatus(p.id)} className="text-red-600 hover:underline">Limpiar</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
