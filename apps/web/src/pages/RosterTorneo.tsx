import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import { eventsApi, playersApi, eventParticipantsApi, exportEventParticipantsCsv, getAuthToken, teamsApi } from '../lib/api'
import type { EventItem } from '../types/event'
import type { Player, Team } from '../types/player'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'

export default function RosterTorneo() {
  const { hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<EventItem[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
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
  const authed = !!getAuthToken() && hasPermission('roster:manage')

  const [activeLineTab, setActiveLineTab] = useState<'OLINE' | 'DLINE'>('OLINE')
  const [linesConfig, setLinesConfig] = useState<{ oLine: number[]; dLine: number[] }>({ oLine: [], dLine: [] })

  useEffect(() => {
    if (!eventId) return
    try {
      const raw = localStorage.getItem(`rosterTorneo.lines.${eventId}`)
      if (raw) {
        setLinesConfig(JSON.parse(raw))
      } else {
        setLinesConfig({ oLine: [], dLine: [] })
      }
    } catch {
      setLinesConfig({ oLine: [], dLine: [] })
    }
  }, [eventId])

  const saveLinesConfig = (next: { oLine: number[]; dLine: number[] }) => {
    setLinesConfig(next)
    if (eventId) {
      try {
        localStorage.setItem(`rosterTorneo.lines.${eventId}`, JSON.stringify(next))
      } catch { /* ignore */ }
    }
  }

  const togglePlayerInActiveLine = (pid: number) => {
    const isOLine = activeLineTab === 'OLINE'
    const currentList = isOLine ? linesConfig.oLine : linesConfig.dLine
    if (currentList.includes(pid)) {
      const nextList = currentList.filter(id => id !== pid)
      saveLinesConfig({
        ...linesConfig,
        [isOLine ? 'oLine' : 'dLine']: nextList,
      })
      toasts.info('Jugador retirado de la línea')
    } else {
      if (currentList.length >= 7) {
        toasts.warn('La línea reglamentaria de Ultimate Frisbee ya tiene 7 jugadores.')
        return
      }
      const nextList = [...currentList, pid]
      saveLinesConfig({
        ...linesConfig,
        [isOLine ? 'oLine' : 'dLine']: nextList,
      })
      toasts.success(`Jugador asignado a la ${isOLine ? 'O-Line' : 'D-Line'} (${nextList.length}/7)`)
    }
  }

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 3500)
    return () => clearTimeout(t)
  }, [error])

  useEffect(() => {
    (async () => {
      try {
        const [evs, pls, tms] = await Promise.all([eventsApi.list(), playersApi.list(), teamsApi.list().catch(() => [])])
        setEvents(evs)
        setPlayers(pls)
        setTeams(tms || [])
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

  // Compute map of registered dorsals in the current event roster:
  // Key: team_teamId_number or side_teamSide_number
  const registeredDorsalsMap = useMemo(() => {
    const map = new Map<string, { name: string; number: number; teamId?: number | null; teamSide?: string | null }>()
    participants.forEach(p => {
      const pl = p.player || playerById.get(p.playerId)
      if (pl && pl.number !== undefined && pl.number !== null) {
        const side = p.teamSide || 'HOME'
        if (pl.teamId) {
          map.set(`team_${pl.teamId}_${pl.number}`, { name: pl.name, number: pl.number, teamId: pl.teamId, teamSide: side })
        } else {
          map.set(`side_${side}_${pl.number}`, { name: pl.name, number: pl.number, teamId: null, teamSide: side })
        }
      }
    })
    return map
  }, [participants, playerById])

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
      if (selectedTeamId) {
        if (selectedTeamId === 'no_team' && p.teamId) return false
        if (selectedTeamId !== 'no_team' && String(p.teamId) !== selectedTeamId) return false
      }
      return true
    })
    .sort((a, b) => sortKey === 'number' ? a.number - b.number : a.name.localeCompare(b.name))

  async function addPlayer(pid: number) {
    if (!eventId) return
    const pl = playerById.get(pid)
    if (!pl) return

    if (pl.number === null || pl.number === undefined || isNaN(pl.number) || pl.number < 0) {
      toasts.error(`El jugador "${pl.name}" no tiene número dorsal asignado. Es obligatorio para el roster del evento.`)
      return
    }

    // Pre-check collision locally
    const lookupKey = pl.teamId ? `team_${pl.teamId}_${pl.number}` : `side_HOME_${pl.number}`
    if (registeredDorsalsMap.has(lookupKey)) {
      const occupant = registeredDorsalsMap.get(lookupKey)
      toasts.error(`Conflicto: El dorsal #${pl.number} ya está registrado para "${occupant?.name}" en este equipo.`)
      return
    }

    setLoading(true)
    try {
      await eventParticipantsApi.upsert({ eventId, playerId: pid })
      const fresh = await eventParticipantsApi.listByEvent(eventId)
      setParticipants(fresh)
      toasts.success(`"${pl.name}" (#${pl.number}) agregado al roster`)
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'No se pudo agregar al roster'
      setError(msg)
      toasts.error(msg)
    } finally { setLoading(false) }
  }

  async function removePlayer(pid: number) {
    if (!eventId) return
    setLoading(true)
    try {
      await eventParticipantsApi.remove(eventId, pid)
      setParticipants(prev => prev.filter(p => p.playerId !== pid))
      toasts.info('Jugador retirado del evento')
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

  async function updateRefuerzo(pid: number, isRefuerzo: boolean) {
    if (!eventId) return
    setParticipants(prev => prev.map(p => p.playerId === pid ? { ...p, isRefuerzo } : p))
    try {
      await eventParticipantsApi.upsert({ eventId, playerId: pid, isRefuerzo })
      toasts.success(isRefuerzo ? 'Marcado como Refuerzo' : 'Marcado como Regular')
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar condición de refuerzo')
    }
  }

  async function updateTeamSide(pid: number, teamSide: string) {
    if (!eventId) return
    const val = teamSide.trim() === '' ? null : teamSide
    setParticipants(prev => prev.map(p => p.playerId === pid ? { ...p, teamSide: val } : p))
    try {
      await eventParticipantsApi.upsert({ eventId, playerId: pid, teamSide: val })
      toasts.success('Lado/Equipo asignado')
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'No se pudo asignar lado de equipo'
      setError(msg)
      toasts.error(msg)
    }
  }

  // Positional categorization of confirmed participants
  const positionalMatrix = useMemo(() => {
    let handlers = 0
    let cutters = 0
    let hybrids = 0

    participants.forEach(p => {
      const pl = p.player || playerById.get(p.playerId)
      const roleStr = `${p.role || ''} ${pl?.position || ''}`.toUpperCase()
      if (roleStr.includes('HANDLER') || roleStr.includes('MANEJADOR') || roleStr.includes('LANZADOR')) {
        handlers++
      } else if (roleStr.includes('CUTTER') || roleStr.includes('CORTADOR')) {
        cutters++
      } else {
        hybrids++
      }
    })

    const total = participants.length
    return {
      handlers,
      cutters,
      hybrids,
      total,
      handlersPct: total > 0 ? Math.round((handlers / total) * 100) : 0,
      cuttersPct: total > 0 ? Math.round((cutters / total) * 100) : 0,
      hybridsPct: total > 0 ? Math.round((hybrids / total) * 100) : 0,
    }
  }, [participants, playerById])

  async function exportCsv() {
    if (!eventId) return
    try {
      const header = ['Dorsal', 'Nombre', 'Posicion_Club', 'Rol_Evento', 'Condicion', 'Lado_Equipo', 'O_Line', 'D_Line'].join(',')
      const rows = participants.map(p => {
        const pl = p.player || playerById.get(p.playerId)
        const dorsal = pl?.number ?? ''
        const name = `"${(pl?.name || '').replace(/"/g, '""')}"`
        const pos = pl?.position || 'HYBRID'
        const role = p.role || 'REGULAR'
        const cond = p.isRefuerzo ? 'REFUERZO' : 'REGULAR'
        const side = p.teamSide || 'HOME'
        const inO = linesConfig.oLine.includes(p.playerId) ? 'SI' : 'NO'
        const inD = linesConfig.dLine.includes(p.playerId) ? 'SI' : 'NO'
        return [dorsal, name, pos, role, cond, side, inO, inD].join(',')
      })
      const csvContent = '\uFEFF' + [header, ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nomina-oficial-torneo-${eventId}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toasts.success('Nómina oficial de torneo exportada exitosamente')
    } catch (e: any) {
      setError(e?.message || 'Error al exportar CSV')
    }
  }

  async function addAllFiltered() {
    if (!eventId) return
    if (availablePlayers.length === 0) return
    setLoading(true)
    try {
      const res = await eventParticipantsApi.batchUpsert({
        eventId,
        playerIds: availablePlayers.map(p => p.id)
      })
      const fresh = await eventParticipantsApi.listByEvent(eventId)
      setParticipants(fresh)
      if (res.skippedCount > 0) {
        toasts.warn(`Se agregaron ${res.addedCount} jugadores. ${res.skippedCount} omitidos por conflicto de dorsal en el mismo equipo.`)
      } else {
        toasts.success(`Agregados ${res.addedCount} jugadores al roster`)
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'No se pudo agregar en lote'
      setError(msg)
      toasts.error(msg)
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900">
          <div>
            <span className="font-semibold">Evento seleccionado:</span> {events.find(e => e.id === eventId)?.title}
          </div>
          <div className="text-xs text-purple-700">
            📌 <strong>Regla de Roster:</strong> Los dorsales son obligatorios y únicos por equipo en cada evento.
          </div>
        </div>
      )}

      {/* 🎯 Matriz de Balance Táctico y Constructor de Líneas 7v7 */}
      {eventId && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🥏</span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Matriz Táctica de Líneas 7v7 & Balance de Plantilla
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura y valida las líneas oficiales de 7 jugadores (O-Line / D-Line) y supervisa el balance posicional de la nómina.
              </p>
            </div>

            {/* Selector de Línea Activa */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
              <button
                onClick={() => setActiveLineTab('OLINE')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeLineTab === 'OLINE'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ O-Line ({linesConfig.oLine.length}/7)
              </button>
              <button
                onClick={() => setActiveLineTab('DLINE')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeLineTab === 'DLINE'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛡️ D-Line ({linesConfig.dLine.length}/7)
              </button>
            </div>
          </div>

          {/* Positional Balance Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-indigo-900 block">🎯 Handlers</span>
                <span className="text-[11px] text-indigo-600 font-medium">Lanzadores / Distribución</span>
              </div>
              <span className="text-xl font-black text-indigo-700">
                {positionalMatrix.handlers} <span className="text-xs font-bold text-indigo-500">({positionalMatrix.handlersPct}%)</span>
              </span>
            </div>

            <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-cyan-900 block">⚡ Cutters</span>
                <span className="text-[11px] text-cyan-600 font-medium">Cortadores / Zona Roja</span>
              </div>
              <span className="text-xl font-black text-cyan-700">
                {positionalMatrix.cutters} <span className="text-xs font-bold text-cyan-500">({positionalMatrix.cuttersPct}%)</span>
              </span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-emerald-900 block">🔄 Hybrids</span>
                <span className="text-[11px] text-emerald-600 font-medium">Versátiles / Transición</span>
              </div>
              <span className="text-xl font-black text-emerald-700">
                {positionalMatrix.hybrids} <span className="text-xs font-bold text-emerald-500">({positionalMatrix.hybridsPct}%)</span>
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Balance Recomendado</span>
              <span className="text-xs font-extrabold text-slate-800 mt-0.5">
                {activeLineTab === 'OLINE' ? '3 Handlers + 4 Cutters' : '2 Handlers + 3 Cutters + 2 Hybrids'}
              </span>
            </div>
          </div>

          {/* Active 7-Player Line Visual Slots */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold uppercase tracking-wider text-amber-300">
                  {activeLineTab === 'OLINE' ? '⚡ Línea Ofensiva (O-Line) - 7 Atletas' : '🛡️ Línea Defensiva (D-Line) - 7 Atletas'}
                </span>
                <span className="text-xs text-slate-400">
                  ({activeLineTab === 'OLINE' ? linesConfig.oLine.length : linesConfig.dLine.length} de 7 seleccionados)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const isOLine = activeLineTab === 'OLINE'
                    saveLinesConfig({
                      ...linesConfig,
                      [isOLine ? 'oLine' : 'dLine']: [],
                    })
                    toasts.info('Línea reiniciada')
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 font-bold transition"
                >
                  Vaciar Línea
                </button>
              </div>
            </div>

            {/* 7 Interactive Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map(slotIdx => {
                const currentList = activeLineTab === 'OLINE' ? linesConfig.oLine : linesConfig.dLine
                const playerId = currentList[slotIdx]
                const player = playerId ? playerById.get(playerId) : null

                return (
                  <div
                    key={slotIdx}
                    onClick={() => {
                      if (playerId) togglePlayerInActiveLine(playerId)
                    }}
                    className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center min-h-[82px] cursor-pointer ${
                      player
                        ? activeLineTab === 'OLINE'
                          ? 'bg-amber-500/20 border-amber-400/80 hover:bg-amber-500/30'
                          : 'bg-rose-500/20 border-rose-400/80 hover:bg-rose-500/30'
                        : 'bg-slate-800/60 border-dashed border-slate-700 hover:border-slate-500 opacity-60'
                    }`}
                    title={player ? `Click para quitar a ${player.name}` : 'Slot disponible'}
                  >
                    {player ? (
                      <>
                        <span className="text-base font-black text-white leading-tight">
                          #{player.number}
                        </span>
                        <span className="text-[11px] font-bold text-slate-200 truncate max-w-[95%]">
                          {player.name}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 mt-0.5">
                          {player.position || 'Cutter'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-500 font-mono">Slot {slotIdx + 1}</span>
                        <span className="text-[10px] text-slate-400 mt-1 font-semibold">+ Asignar</span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {error && <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {/* global toasts via ToastProvider */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <div className="flex flex-col gap-2 mb-2">
            <h3 className="font-medium">Jugadores disponibles</h3>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center text-sm flex-wrap">
              <input className="border rounded px-2 py-1 flex-1 min-w-[120px]" placeholder="Buscar nombre o #"
                     value={q} onChange={e => setQ(e.target.value)} />
              {teams.length > 0 && (
                <select 
                  className="border rounded px-2 py-1 bg-indigo-50/40 text-indigo-900 font-medium"
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                >
                  <option value="">Todos los Equipos/Categorías</option>
                  {teams.map(t => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                  <option value="no_team">Sin Equipo Asignado</option>
                </select>
              )}
              <select className="border rounded px-2 py-1" value={pos} onChange={e => setPos(e.target.value)}>
                <option value="">Posición</option>
                <option value="HANDLER">Manejador</option>
                <option value="CUTTER">Cortador</option>
                <option value="HYBRID">Híbrido</option>
              </select>
              <select className="border rounded px-2 py-1" value={pstatus} onChange={e => setPstatus(e.target.value)}>
                <option value="">Estado</option>
                <option value="ACTIVE">Activo</option>
                <option value="INJURED">Lesionado</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
              <select className="border rounded px-2 py-1" value={sortKey} onChange={e => setSortKey(e.target.value as any)}>
                <option value="number">Orden: número</option>
                <option value="name">Orden: nombre</option>
              </select>
              <span className="text-gray-500 whitespace-nowrap">Disponibles: {availablePlayers.length}</span>
              <button className="px-2 py-1 rounded bg-gray-200 whitespace-nowrap" onClick={() => {
                setQ(''); setPos(''); setPstatus(''); setSelectedTeamId('')
                const params = new URLSearchParams()
                if (eventId) params.set('eventId', String(eventId))
                if (sortKey !== 'number') params.set('sort', sortKey)
                setSearchParams(params)
              }}>Limpiar filtros</button>
        {authed && (
    <button className="px-2 py-1 rounded bg-indigo-600 text-white disabled:opacity-50 whitespace-nowrap"
      onClick={() => setConfirmState({ message: `¿Agregar ${availablePlayers.length} jugadores filtrados al roster?`, onYes: addAllFiltered })}
      disabled={loading || availablePlayers.length === 0}>Agregar todos</button>
        )}
            </div>
          </div>
          <div className="max-h-96 overflow-auto divide-y">
            {availablePlayers.map(p => {
              const playerTeam = teams.find(t => t.id === p.teamId)
              const hasNoNumber = p.number === null || p.number === undefined || isNaN(p.number) || p.number < 0
              const teamKey = p.teamId ? `team_${p.teamId}_${p.number}` : `side_HOME_${p.number}`
              const conflictOccupant = !hasNoNumber ? registeredDorsalsMap.get(teamKey) : null

              return (
                <div key={p.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {hasNoNumber ? '(Sin #)' : `#${p.number}`} {p.name}
                      </span>
                      {playerTeam && (
                        <span 
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: playerTeam.color ? `${playerTeam.color}20` : '#e0e7ff',
                            color: playerTeam.color || '#3730a3',
                            border: `1px solid ${playerTeam.color ? `${playerTeam.color}40` : '#c7d2fe'}`
                          }}
                        >
                          {playerTeam.name}
                        </span>
                      )}
                      {conflictOccupant && (
                        <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-semibold">
                          ⚠️ #{p.number} ocupado por {conflictOccupant.name}
                        </span>
                      )}
                      {hasNoNumber && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                          ⚠️ Sin dorsal asignado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {p.position === 'HANDLER' ? 'Manejador' : p.position === 'CUTTER' ? 'Cortador' : 'Híbrido'} · {p.status === 'ACTIVE' ? 'Activo' : p.status === 'INACTIVE' ? 'Inactivo' : 'Lesionado'}
                    </div>
                  </div>
                  {authed && (
                    <button 
                      className={`px-2 py-1 text-sm rounded whitespace-nowrap ${
                        conflictOccupant || hasNoNumber 
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`} 
                      onClick={() => addPlayer(p.id)} 
                      disabled={loading || Boolean(conflictOccupant) || hasNoNumber}
                      title={
                        hasNoNumber 
                          ? 'Debe asignar un dorsal al jugador antes de convocarlo' 
                          : conflictOccupant 
                          ? `Dorsal #${p.number} ya usado por ${conflictOccupant.name} en el equipo` 
                          : 'Agregar al roster'
                      }
                    >
                      {conflictOccupant ? 'Dorsal en uso' : hasNoNumber ? 'Sin dorsal' : 'Agregar'}
                    </button>
                  )}
                </div>
              )
            })}
            {availablePlayers.length === 0 && <div className="text-sm text-gray-500 py-4 text-center">No hay jugadores disponibles.</div>}
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
                <div key={p.playerId} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">#{pl?.number ?? p.playerId} {pl?.name ?? ''}</div>
                    <div className="mt-1.5 flex flex-wrap gap-2 items-center text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <label className="text-gray-500">Rol:</label>
                        {authed ? (
                          <input
                            className="border rounded px-2 py-1 text-xs sm:text-sm w-32"
                            defaultValue={p.role ?? ''}
                            placeholder="ej. Manejador"
                            onBlur={(e) => updateRole(p.playerId, e.target.value)}
                            disabled={loading}
                          />
                        ) : (
                          <span className="text-gray-700 font-medium">{p.role || '(sin rol)'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-gray-500">Estado:</label>
                        {authed ? (
                          <select
                            className="border rounded px-2 py-1 text-xs sm:text-sm"
                            value={(p.status as any) ?? ''}
                            onChange={(e) => updateStatus(p.playerId, e.target.value)}
                            disabled={loading}
                          >
                            <option value="">(sin estado)</option>
                            <option value="confirmed">confirmado</option>
                            <option value="tentative">tentativo</option>
                            <option value="declined">rechazado</option>
                          </select>
                        ) : (
                          <span className="text-gray-700 font-medium">{p.status || '(sin estado)'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-gray-500">Lado:</label>
                        {authed ? (
                          <select
                            className="border rounded px-2 py-1 text-xs sm:text-sm"
                            value={p.teamSide ?? 'HOME'}
                            onChange={(e) => updateTeamSide(p.playerId, e.target.value)}
                            disabled={loading}
                          >
                            <option value="HOME">Local (Home)</option>
                            <option value="AWAY">Visitante (Away)</option>
                          </select>
                        ) : (
                          <span className="text-gray-700 font-medium">{p.teamSide === 'AWAY' ? 'Visitante' : 'Local'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {authed ? (
                          <label className="flex items-center gap-1 cursor-pointer select-none text-xs bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            <input
                              type="checkbox"
                              checked={!!p.isRefuerzo}
                              onChange={(e) => updateRefuerzo(p.playerId, e.target.checked)}
                              disabled={loading}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span className="font-bold text-amber-800">Refuerzo</span>
                          </label>
                        ) : (
                          p.isRefuerzo && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                              🌟 Refuerzo
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setActiveLineTab('OLINE')
                        togglePlayerInActiveLine(p.playerId)
                      }}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                        linesConfig.oLine.includes(p.playerId)
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                      }`}
                      title={linesConfig.oLine.includes(p.playerId) ? 'Quitar de O-Line' : 'Agregar a O-Line'}
                    >
                      ⚡ O
                    </button>
                    <button
                      onClick={() => {
                        setActiveLineTab('DLINE')
                        togglePlayerInActiveLine(p.playerId)
                      }}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                        linesConfig.dLine.includes(p.playerId)
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                      }`}
                      title={linesConfig.dLine.includes(p.playerId) ? 'Quitar de D-Line' : 'Agregar a D-Line'}
                    >
                      🛡️ D
                    </button>
                    {authed && (
                      <button className="px-2.5 py-1 text-xs sm:text-sm rounded bg-rose-600 hover:bg-rose-700 text-white whitespace-nowrap" onClick={() => setConfirmState({ message: `¿Quitar a ${pl?.name ?? 'este jugador'} del roster del torneo?`, onYes: () => removePlayer(p.playerId) })} disabled={loading}>
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {participants.length === 0 && <div className="text-sm text-gray-500 py-4 text-center">Aún no hay seleccionados.</div>}
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
