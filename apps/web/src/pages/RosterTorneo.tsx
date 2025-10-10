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
  const availablePlayers = players.filter(p => !selectedIds.has(p.id))

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-2">Jugadores disponibles</h3>
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
          <h3 className="font-medium mb-2">Seleccionados para este evento</h3>
          <div className="max-h-96 overflow-auto divide-y">
            {participants.map(p => {
              const pl = p.player || playerById.get(p.playerId)
              return (
                <div key={p.playerId} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">#{pl?.number ?? p.playerId} {pl?.name ?? ''}</div>
                    <div className="text-xs text-gray-500">{p.role || 'sin rol'} · {p.status || 'sin estado'}</div>
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
