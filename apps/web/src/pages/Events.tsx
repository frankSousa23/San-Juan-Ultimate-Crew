import React, { useEffect, useMemo, useState } from 'react'
import { eventsApi, channelsApi, attendanceApi, playersApi } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import EventForm from '../components/EventForm'
import { EventItem, EventType, EventStatus } from '../types/event'

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
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventItem[]>([])
  const [tab, setTab] = useState<'events' | 'calendar' | 'tournaments' | 'stats'>('events')
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EventItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attEvent, setAttEvent] = useState<EventItem | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    eventsApi.list().then(setEvents).catch(() => setError('No se pudo cargar eventos')).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return events.filter(e => (typeFilter === 'all' || e.type === typeFilter) && (statusFilter === 'all' || e.status === statusFilter))
  }, [events, typeFilter, statusFilter])

  return (
    <>
    <div className="space-y-6">
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
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`py-3 px-2 text-sm font-medium border-b-2 ${tab === t.k ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4">
          {tab === 'events' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-2">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="all">Todos los tipos</option>
                  <option value="TOURNAMENT">Torneos</option>
                  <option value="TRAINING">Entrenamientos</option>
                  <option value="SOCIAL">Eventos Sociales</option>
                  <option value="WORKSHOP">Talleres</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="all">Todos los estados</option>
                  <option value="UPCOMING">Próximos</option>
                  <option value="ONGOING">En curso</option>
                  <option value="COMPLETED">Completados</option>
                  <option value="CANCELLED">Cancelados</option>
                </select>
              </div>

              <div className="space-y-3">
                {filtered.map(e => (
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
                          alert('No se pudo abrir el canal')
                        }
                      }}>Abrir canal</button>
                      <button className="text-teal-700 hover:underline" onClick={() => setAttEvent(e)}>Asistencia</button>
                      <button className="text-amber-700 hover:underline" onClick={() => setEditTarget(e)}>Editar</button>
                      <button className="text-red-600 hover:underline" onClick={async () => {
                        if (!confirm(`¿Eliminar evento "${e.title}"?`)) return
                        try {
                          await eventsApi.remove(e.id)
                          setEvents(prev => prev.filter(x => x.id !== e.id))
                        } catch {
                          alert('No se pudo eliminar')
                        }
                      }}>Eliminar</button>
                    </div>
                  </div>
                ))}
                {loading && <div className="text-gray-600">Cargando...</div>}
                {!loading && filtered.length === 0 && <div className="text-gray-600">No hay eventos para los filtros seleccionados.</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
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
                onSubmit={async (data) => {
                  try {
                    const r = await eventsApi.create(data as any)
                    setEvents(prev => [...prev, r].sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()))
                    setCreateOpen(false)
                  } catch (e: any) {
                    alert('Error al crear: ' + (e?.response?.data?.error || ''))
                  }
                }}
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
                onSubmit={async (data) => {
                  try {
                    const id = editTarget!.id
                    const r = await eventsApi.update(id, data as any)
                    setEvents(prev => prev.map(ev => ev.id === id ? r : ev).sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()))
                    setEditTarget(null)
                  } catch (e: any) {
                    alert('Error al guardar: ' + (e?.response?.data?.error || ''))
                  }
                }}
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
  const [records, setRecords] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
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
                          {['present','absent','late'].map(st => (
                            <button key={st} onClick={() => setStatus(p.id, st as any)} className={`px-2 py-1 rounded border text-xs ${statusOf(p.id)===st ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700'}`}>{st}</button>
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
