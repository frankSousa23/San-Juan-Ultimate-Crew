import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import { eventsApi, playersApi, eventParticipantsApi, exportEventParticipantsCsv, getAuthToken } from '../lib/api'
import type { EventItem } from '../types/event'
import type { Player } from '../types/player'
import { useToast } from '../hooks/useToast'

export default function RosterTorneo() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<EventItem[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [eventId, setEventId] = useState<number | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toasts = useToast()
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<string>('')
  const [pstatus, setPstatus] = useState<string>('')
  const [sortKey, setSortKey] = useState<'number' | 'name'>('number')
  const [confirmState, setConfirmState] = useState<{ title?: string; message: string; onYes: () => Promise<void> } | null>(null)
  const authed = !!getAuthToken()

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
        if (evs.length > 0) {
          // Prefer URL param, then localStorage, otherwise first event
          const spEvent = Number(searchParams.get('eventId') || '')
          const lsEvent = Number(localStorage.getItem('rosterTorneo.eventId') || '')
          const pick = (!Number.isNaN(spEvent) && evs.some(e => e.id === spEvent)) ? spEvent
            : (!Number.isNaN(lsEvent) && evs.some(e => e.id === lsEvent)) ? lsEvent
            : evs[0].id
          setEventId(pick)
        }
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
  toasts.success('Rol actualizado')
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
  toasts.success('Estado actualizado')
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el estado')
    }
  }

  async function exportCsv() {
    if (!eventId) return
    try {
      const blob = await exportEventParticipantsCsv(eventId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `roster-evento-${eventId}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.message || 'Error al exportar CSV')
    }
  }

  async function addAllFiltered() {
    if (!eventId) return
    if (availablePlayers.length === 0) return
    setLoading(true)
    try {
  await Promise.allSettled(availablePlayers.map(p => eventParticipantsApi.upsert({ eventId, playerId: p.id })))
      const fresh = await eventParticipantsApi.listByEvent(eventId)
      setParticipants(fresh)
  toasts.success(`Agregados ${availablePlayers.length} jugadores`)
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
  toasts.success('Seleccionados eliminados')
    } catch (e: any) {
      setError(e?.message || 'No se pudo quitar en lote')
    } finally { setLoading(false) }
  }

  // URL-sync: read params -> state
  useEffect(() => {
    // eventId depends on events list to validate
    const spEvent = Number(searchParams.get('eventId') || '')
    if (!Number.isNaN(spEvent) && spEvent !== eventId && events.some(e => e.id === spEvent)) {
      setEventId(spEvent)
    }
    const sq = searchParams.get('q') || ''
    if (sq !== q) setQ(sq)
    const spos = searchParams.get('pos') || ''
    if (spos !== pos) setPos(spos)
    const sps = searchParams.get('status') || ''
    if (sps !== pstatus) setPstatus(sps)
    const ssort = (searchParams.get('sort') as 'number' | 'name') || 'number'
    if (ssort !== sortKey) setSortKey(ssort)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, events])

  // URL-sync: state -> params (only include non-empty filters)
  useEffect(() => {
    const params = new URLSearchParams()
    if (eventId) params.set('eventId', String(eventId))
    if (q.trim()) params.set('q', q.trim())
    if (pos) params.set('pos', pos)
    if (pstatus) params.set('status', pstatus)
    if (sortKey !== 'number') params.set('sort', sortKey)
    const next = params.toString()
    const curr = searchParams.toString()
    if (next !== curr) setSearchParams(params)
    if (eventId) localStorage.setItem('rosterTorneo.eventId', String(eventId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, q, pos, pstatus, sortKey])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">Roster de Torneo por Evento</h2>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <label className="text-sm flex items-center">Evento:</label>
          <select className="border rounded px-2 py-1 flex-1 sm:flex-initial" value={eventId ?? ''} onChange={e => setEventId(Number(e.target.value))}>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title} — {new Date(ev.startsAt).toLocaleString()}</option>
            ))}
          </select>
          <button className="px-3 py-1 rounded bg-emerald-600 text-white whitespace-nowrap" onClick={exportCsv} disabled={!eventId || loading}>Exportar CSV</button>
          {eventId && (
            <button
              className="px-3 py-1 rounded bg-gray-100 text-gray-800 whitespace-nowrap"
              onClick={() => {
                try {
                  const url = new URL(window.location.href)
                  url.searchParams.set('eventId', String(eventId))
                  if (q) url.searchParams.set('q', q); else url.searchParams.delete('q')
                  if (pos) url.searchParams.set('pos', pos); else url.searchParams.delete('pos')
                  if (pstatus) url.searchParams.set('status', pstatus); else url.searchParams.delete('status')
                  if (sortKey !== 'number') url.searchParams.set('sort', sortKey); else url.searchParams.delete('sort')
                  navigator.clipboard.writeText(url.toString())
                  toasts.info('Enlace copiado')
                } catch { /* ignore */ }
              }}
            >Copiar enlace</button>
          )}
        </div>
      </div>
      {eventId && (
        <div className="text-sm text-gray-600">Evento actual: <span className="font-medium">{events.find(e => e.id === eventId)?.title}</span></div>
      )}

      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      {/* global toasts via ToastProvider */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <div className="flex flex-col gap-2 mb-2">
            <h3 className="font-medium">Jugadores disponibles</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center text-sm">
              <input className="border rounded px-2 py-1 flex-1" placeholder="Buscar nombre o #"
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
              <span className="text-gray-500 whitespace-nowrap">Disponibles: {availablePlayers.length}</span>
              <button className="px-2 py-1 rounded bg-gray-200 whitespace-nowrap" onClick={() => {
                setQ(''); setPos(''); setPstatus('')
                const params = new URLSearchParams()
                if (eventId) params.set('eventId', String(eventId))
                if (sortKey !== 'number') params.set('sort', sortKey)
                setSearchParams(params)
              }}>Limpiar filtros</button>
        {authed && (
    <button className="px-2 py-1 rounded bg-indigo-600 text-white disabled:opacity-50 whitespace-nowrap"
      onClick={() => setConfirmState({ message: `¿Agregar ${availablePlayers.length} jugadores filtrados?`, onYes: addAllFiltered })}
      disabled={loading || availablePlayers.length === 0}>Agregar todos</button>
        )}
            </div>
          </div>
          <div className="max-h-96 overflow-auto divide-y">
            {availablePlayers.map(p => (
              <div key={p.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">#{p.number} {p.name}</div>
                  <div className="text-xs text-gray-500">{p.position} · {p.status}</div>
                </div>
                {authed && <button className="px-2 py-1 text-sm rounded bg-indigo-600 text-white" onClick={() => addPlayer(p.id)} disabled={loading}>Agregar</button>}
              </div>
            ))}
            {availablePlayers.length === 0 && <div className="text-sm text-gray-500">No hay jugadores disponibles.</div>}
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
      <div className="flex items-center gap-2">
        <h3 className="font-medium">Seleccionados para este evento</h3>
        <span className="inline-flex items-center justify-center text-xs bg-purple-600 text-white rounded-full px-2 py-0.5">
          {participants.length}
        </span>
      </div>
      {authed && (
        <button className="px-2 py-1 rounded bg-rose-600 text-white disabled:opacity-50 whitespace-nowrap"
          onClick={() => setConfirmState({ message: `¿Quitar ${participants.length} seleccionados de este evento?`, onYes: removeAllSelected })}
          disabled={loading || participants.length === 0}>Quitar todos</button>
      )}
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
                      {authed && (
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        defaultValue={p.role ?? ''}
                        placeholder="ej. Handler, Cutter"
                        onBlur={(e) => updateRole(p.playerId, e.target.value)}
                        disabled={loading}
                      />
                      )}
                      <label className="text-gray-500 ml-3">Estado:</label>
                      {authed && (
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
                      )}
                    </div>
                  </div>
                  {authed && <button className="px-2 py-1 text-sm rounded bg-rose-600 text-white" onClick={() => removePlayer(p.playerId)} disabled={loading}>Quitar</button>}
                </div>
              )
            })}
            {participants.length === 0 && <div className="text-sm text-gray-500">Aún no hay seleccionados.</div>}
          </div>
        </div>
      </div>
      {confirmState && (
        <ConfirmModal
          title={confirmState.title || 'Confirmar'}
          message={confirmState.message}
          confirmText="Sí"
          cancelText="Cancelar"
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => { await confirmState.onYes(); setConfirmState(null) }}
        />
      )}
    </div>
  )
}
