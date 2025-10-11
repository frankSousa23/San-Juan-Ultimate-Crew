import { useEffect, useMemo, useState } from 'react'
import { eventsApi, playersApi, eventParticipantsApi, exportEventParticipantsCsv } from '../lib/api'
import type { EventItem } from '../types/event'
import type { Player } from '../types/player'

export default function RosterTorneo() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [eventId, setEventId] = useState<number | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<string>('')
  const [pstatus, setPstatus] = useState<string>('')
  const [sortKey, setSortKey] = useState<'number' | 'name'>('number')

  // Auto-hide feedback
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 3500)
    return () => clearTimeout(t)
  }, [error])

  useEffect(() => {
    (async () => {
      try {
        const [evs, pls] = await Promise.all([eventsApi.list(), playersApi.list()])
        setEvents(evs)
        setPlayers(pls)
        if (evs.length > 0) setEventId(evs[0].id)
      } catch (e: any) {
        setError(e?.message || 'Error cargando datos')
      }
    })()
  }, [])

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    eventParticipantsApi.listByEvent(eventId)
      .then(setParticipants)
      .catch(err => setError(err?.message || 'Error listando participantes'))
      .finally(() => setLoading(false))
  }, [eventId])

  const playerById = useMemo(() => {
    const m = new Map<number, Player>()
    players.forEach(p => m.set(p.id, p))
    return m
  }, [players])

  const selectedIds = new Set<number>(participants.map(p => p.playerId))
  const availablePlayers = players
    .filter(p => !selectedIds.has(p.id))
    .filter(p => {
      if (q) {
        const s = q.toLowerCase()
        const matchesName = p.name.toLowerCase().includes(s)
        const matchesNumber = String(p.number).includes(s)
        if (!matchesName && !matchesNumber) return false
      }
      if (pos && p.position !== pos) return false
      if (pstatus && p.status !== pstatus) return false
      return true
    })
    .sort((a, b) => sortKey === 'number' ? a.number - b.number : a.name.localeCompare(b.name))

  async function addPlayer(pid: number) {
    if (!eventId) return
    setLoading(true)
    try {
      await eventParticipantsApi.upsert({ eventId, playerId: pid })
      const fresh = await eventParticipantsApi.listByEvent(eventId)
      setParticipants(fresh)
    } catch (e: any) {
      setError(e?.message || 'No se pudo agregar')
    } finally { setLoading(false) }
  }

  async function removePlayer(pid: number) {
    if (!eventId) return
    setLoading(true)
    try {
      await eventParticipantsApi.remove(eventId, pid)
      setParticipants(prev => prev.filter(p => p.playerId !== pid))
    } catch (e: any) {
      setError(e?.message || 'No se pudo quitar')
    } finally { setLoading(false) }
  }

  async function updateRole(pid: number, role: string) {
    if (!eventId) return
    // Optimistic update
    setParticipants(prev => prev.map(p => p.playerId === pid ? { ...p, role } : p))
    try {
      await eventParticipantsApi.upsert({ eventId, playerId: pid, role: role.trim() === '' ? null : role })
      setToast('Rol actualizado')
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el rol')
    }
  }

  async function updateStatus(pid: number, status: string) {
    if (!eventId) return
    // Optimistic update
    const val = status.trim() === '' ? null : status
    setParticipants(prev => prev.map(p => p.playerId === pid ? { ...p, status: val } : p))
    try {
      await eventParticipantsApi.upsert({ eventId, playerId: pid, status: val as any })
      setToast('Estado actualizado')
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el estado')
    }
  }

  async function exportCsv() {
    if (!eventId) return
    const blob = await exportEventParticipantsCsv(eventId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `roster-evento-${eventId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function addAllFiltered() {
    if (!eventId) return
    if (availablePlayers.length === 0) return
    setLoading(true)
    try {
      await Promise.allSettled(availablePlayers.map(p => eventParticipantsApi.upsert({ eventId, playerId: p.id })))
      const fresh = await eventParticipantsApi.listByEvent(eventId)
      setParticipants(fresh)
      setToast(`Agregados ${availablePlayers.length} jugadores`)
    } catch (e: any) {
      setError(e?.message || 'No se pudo agregar en lote')
    } finally { setLoading(false) }
  }

  async function removeAllSelected() {
    if (!eventId) return
    if (participants.length === 0) return
    setLoading(true)
    try {
      await Promise.allSettled(participants.map(p => eventParticipantsApi.remove(eventId, p.playerId)))
      setParticipants([])
      setToast('Seleccionados eliminados')
    } catch (e: any) {
      setError(e?.message || 'No se pudo quitar en lote')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Roster de Torneo por Evento</h2>
        <div className="flex gap-2 items-center">
          <label className="text-sm">Evento:</label>
          <select className="border rounded px-2 py-1" value={eventId ?? ''} onChange={e => setEventId(Number(e.target.value))}>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title} — {new Date(ev.startsAt).toLocaleString()}</option>
            ))}
          </select>
          <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={exportCsv} disabled={!eventId || loading}>Exportar CSV</button>
        </div>
      </div>

      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-sm px-3 py-2 rounded shadow">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Jugadores disponibles</h3>
            <div className="flex gap-2 items-center text-sm">
              <input className="border rounded px-2 py-1" placeholder="Buscar nombre o #"
                     value={q} onChange={e => setQ(e.target.value)} />
              <select className="border rounded px-2 py-1" value={pos} onChange={e => setPos(e.target.value)}>
                <option value="">Posición</option>
                <option value="HANDLER">HANDLER</option>
                <option value="CUTTER">CUTTER</option>
                <option value="HYBRID">HYBRID</option>
              </select>
              <select className="border rounded px-2 py-1" value={pstatus} onChange={e => setPstatus(e.target.value)}>
                <option value="">Estado</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INJURED">INJURED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <select className="border rounded px-2 py-1" value={sortKey} onChange={e => setSortKey(e.target.value as any)}>
                <option value="number">Orden: número</option>
                <option value="name">Orden: nombre</option>
              </select>
              <button className="ml-2 px-2 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
                      onClick={addAllFiltered} disabled={loading || availablePlayers.length === 0}>Agregar todos</button>
            </div>
          </div>
          <div className="max-h-96 overflow-auto divide-y">
            {availablePlayers.map(p => (
              <div key={p.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">#{p.number} {p.name}</div>
                  <div className="text-xs text-gray-500">{p.position} · {p.status}</div>
                </div>
                <button className="px-2 py-1 text-sm rounded bg-indigo-600 text-white" onClick={() => addPlayer(p.id)} disabled={loading}>Agregar</button>
              </div>
            ))}
            {availablePlayers.length === 0 && <div className="text-sm text-gray-500">No hay jugadores disponibles.</div>}
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Seleccionados para este evento</h3>
            <span className="inline-flex items-center justify-center text-xs bg-purple-600 text-white rounded-full px-2 py-0.5">
              {participants.length}
            </span>
            <button className="ml-auto px-2 py-1 rounded bg-rose-600 text-white disabled:opacity-50"
                    onClick={removeAllSelected} disabled={loading || participants.length === 0}>Quitar todos</button>
          </div>
          <div className="max-h-96 overflow-auto divide-y">
            {participants.map(p => {
              const pl = p.player || playerById.get(p.playerId)
              return (
                <div key={p.playerId} className="py-2 flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <div className="font-medium">#{pl?.number ?? p.playerId} {pl?.name ?? ''}</div>
                    <div className="mt-1 flex gap-2 items-center text-sm">
                      <label className="text-gray-500">Rol:</label>
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        defaultValue={p.role ?? ''}
                        placeholder="ej. Handler, Cutter"
                        onBlur={(e) => updateRole(p.playerId, e.target.value)}
                        disabled={loading}
                      />
                      <label className="text-gray-500 ml-3">Estado:</label>
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={(p.status as any) ?? ''}
                        onChange={(e) => updateStatus(p.playerId, e.target.value)}
                        disabled={loading}
                      >
                        <option value="">(sin estado)</option>
                        <option value="confirmed">confirmado</option>
                        <option value="tentative">tentativo</option>
                        <option value="declined">rechazado</option>
                      </select>
                    </div>
                  </div>
                  <button className="px-2 py-1 text-sm rounded bg-rose-600 text-white" onClick={() => removePlayer(p.playerId)} disabled={loading}>Quitar</button>
                </div>
              )
            })}
            {participants.length === 0 && <div className="text-sm text-gray-500">Aún no hay seleccionados.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
