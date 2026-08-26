import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { playersApi, authApi, getAuthToken, attendanceApi, eventParticipantsApi, eventsApi, teamsApi, TeamItem } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import PlayerForm from '../components/PlayerForm'
import ConfirmModal from '../components/ConfirmModal'
import { Player, Position, Status } from '../types/player'

const badgeColor: Record<Status, string> = {
  ACTIVE: 'text-green-700',
  INJURED: 'text-red-700',
  INACTIVE: 'text-gray-700',
}

export default function Roster() {
  const { isAuthenticated: authed, hasPermission, user: authUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<'' | Position>('')
  const [st, setSt] = useState<'' | Status>('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 24
  const [selected, setSelected] = useState<Player | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => void } | null>(null)
  const [user, setUser] = useState<{ roles?: string[]; playerId?: number | null } | null>(null)
  const [playerStats, setPlayerStats] = useState<{
    totalEvents: number
    eventsAttended: number
    attendanceRate: number
    eventsParticipated: number
    completedEvents: number
    matchStats?: any
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  
  const toasts = useToast()
  const { execute: loadPlayers, loading, error } = useApi(playersApi.list, {
    onSuccess: (data) => setPlayers(data),
    showErrorToast: true
  })
  const { execute: createPlayer } = useApi(playersApi.create, {
    onSuccess: (data) => {
      setPlayers(prev => [...prev, data].sort((a,b) => a.number - b.number))
      setCreateOpen(false)
      toasts.success('Jugador creado exitosamente')
    },
    showErrorToast: true
  })
  const { execute: updatePlayer } = useApi(playersApi.update, {
    onSuccess: (data) => {
      setPlayers(prev => prev.map(p => p.id === selected?.id ? data : p).sort((a,b) => a.number - b.number))
      setEditOpen(false)
      setSelected(data)
      toasts.success('Jugador actualizado exitosamente')
    },
    showErrorToast: true
  })
  const { execute: deletePlayer } = useApi(playersApi.remove, {
    onSuccess: () => {
      setPlayers(prev => prev.filter(p => p.id !== selected?.id))
      setSelected(null)
      toasts.success('Jugador eliminado exitosamente')
    },
    showErrorToast: true
  })


  useEffect(() => {
    loadPlayers()
    teamsApi.list().then(setTeams).catch(() => {})
  }, [])

  useEffect(() => {
    let cancel = false
    if (!authed) { setUser(null); return }
    authApi.me().then(me => { if (!cancel && me.user) setUser({ roles: me.user.roles, playerId: me.user.playerId }) }).catch(() => {})
    return () => { cancel = true }
  }, [authed])

  // User state is provided by AuthContext

  // Load player statistics when a player is selected
  useEffect(() => {
    if (!selected) {
      setPlayerStats(null)
      return
    }
    
    setLoadingStats(true)
    const loadStats = async () => {
      try {
        const allEvents = await eventsApi.list()
        const completedEvents = allEvents.filter(e => e.status === 'COMPLETED')
        
        // Get all attendances for this player from completed events
        const allAttendances: any[] = []
        for (const event of completedEvents.slice(0, 15)) { // Limit to first 15 to avoid too many requests
          try {
            const eventAttendances = await attendanceApi.listByEvent(event.id)
            const playerAttendance = eventAttendances.find(a => a.playerId === selected.id)
            if (playerAttendance) {
              allAttendances.push(playerAttendance)
            }
          } catch {
            // Event might not have attendances
          }
        }
        
        // Get all participants for this player
        const allParticipants: any[] = []
        for (const event of allEvents.slice(0, 15)) { // Limit to first 15
          try {
            const eventParticipants = await eventParticipantsApi.listByEvent(event.id)
            const playerParticipant = eventParticipants.find(p => p.playerId === selected.id)
            if (playerParticipant) {
              allParticipants.push(playerParticipant)
            }
          } catch {
            // Event might not have participants
          }
        }
        
        const eventsAttended = allAttendances.filter(a => a.status === 'present').length
        const totalCompleted = completedEvents.length
        const attendanceRate = totalCompleted > 0 ? Math.round((eventsAttended / totalCompleted) * 100) : 0
        
        
        const matchStats = await playersApi.getMatchStats(selected.id)

        setPlayerStats({
          totalEvents: allEvents.length,
          eventsAttended,
          attendanceRate,
          eventsParticipated: allParticipants.length,
          completedEvents: totalCompleted,
          matchStats
        })
      } catch (error) {
        console.error('Error loading player stats:', error)
        setPlayerStats(null)
      } finally {
        setLoadingStats(false)
      }
    }
    
    loadStats()
  }, [selected])

  // Sync from URL -> state
  useEffect(() => {
    const sq = searchParams.get('q') || ''
    if (sq !== q) setQ(sq)
    const spos = (searchParams.get('pos') as Position | null) || ''
    if (spos !== pos && (spos === '' || ['HANDLER', 'CUTTER', 'HYBRID'].includes(spos))) {
      setPos(spos as '' | Position)
    }
    const sst = (searchParams.get('st') as Status | null) || ''
    if (sst !== st && (sst === '' || ['ACTIVE', 'INJURED', 'INACTIVE'].includes(sst))) {
      setSt(sst as '' | Status)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Sync state -> URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (pos) params.set('pos', pos)
    if (st) params.set('st', st)
    if (selectedTeamId) params.set('teamId', selectedTeamId)
    const next = params.toString()
    const curr = searchParams.toString()
    if (next !== curr) setSearchParams(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pos, st, selectedTeamId])

  const filtered = useMemo(() => {
    return players.filter(p => {
      const text = `${p.name} ${p.number}`.toLowerCase()
      const okText = text.includes(q.toLowerCase())
      const okPos = !pos || p.position === pos
      const okSt = !st || p.status === st
      const okTeam = !selectedTeamId || (selectedTeamId === 'none' ? !p.teamId : p.teamId === Number(selectedTeamId))
      return okText && okPos && okSt && okTeam
    })
  }, [players, q, pos, st, selectedTeamId])

  useEffect(() => {
    setPage(1)
  }, [q, pos, st, selectedTeamId])

  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const posClass = (p: Position) =>
    p === 'HANDLER' ? 'bg-gradient-to-br from-sky-500 to-cyan-400' :
    p === 'CUTTER' ? 'bg-gradient-to-br from-emerald-500 to-teal-400' :
    'bg-gradient-to-br from-fuchsia-500 to-yellow-300'

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Roster Principal</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Plantel de atletas y divisiones oficiales: Open (Fem/Masc), Mixto, Junior y Master
          </p>
        </div>
        {hasPermission('roster:manage') && (
          <button onClick={() => setCreateOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 whitespace-nowrap text-sm sm:text-base shadow font-semibold">+ Agregar Jugador</button>
        )}
      </div>

      {/* Filters & Quick Pills */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-4">
        {/* Main Search and Selects */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por nombre o número de dorsal..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>
          <select 
            aria-label="Filtrar por equipo o categoría" 
            value={selectedTeamId} 
            onChange={e => setSelectedTeamId(e.target.value)} 
            className="px-3 sm:px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 bg-white"
          >
            <option value=''>Todos los Equipos</option>
            {teams.map(t => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
            <option value='none'>Sin equipo asignado</option>
          </select>
        </div>

        {/* Quick Pill Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Posiciones */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold uppercase text-slate-400 text-[10px] mr-1">Posición:</span>
            <button
              onClick={() => setPos('')}
              className={`px-3 py-1 rounded-lg font-bold transition active:scale-95 ${
                !pos ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setPos('HANDLER')}
              className={`px-3 py-1 rounded-lg font-bold transition active:scale-95 ${
                pos === 'HANDLER' ? 'bg-sky-600 text-white shadow-xs' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              Manejador (Handler)
            </button>
            <button
              onClick={() => setPos('CUTTER')}
              className={`px-3 py-1 rounded-lg font-bold transition active:scale-95 ${
                pos === 'CUTTER' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Cortador (Cutter)
            </button>
            <button
              onClick={() => setPos('HYBRID')}
              className={`px-3 py-1 rounded-lg font-bold transition active:scale-95 ${
                pos === 'HYBRID' ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Híbrido
            </button>
          </div>

          {/* Estado de Salud */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold uppercase text-slate-400 text-[10px] mr-1">Disponibilidad:</span>
            <button
              onClick={() => setSt('')}
              className={`px-3 py-1 rounded-lg font-bold transition active:scale-95 ${
                !st ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSt('ACTIVE')}
              className={`px-3 py-1 rounded-lg font-bold transition active:scale-95 flex items-center gap-1 ${
                st === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Activos / Aptos</span>
            </button>
            <button
              onClick={() => setSt('INJURED')}
              className={`px-3 py-1 rounded-lg font-bold transition active:scale-95 flex items-center gap-1 ${
                st === 'INJURED' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Baja Médica</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {paginatedPlayers.map(p => (
          <button key={p.id} onClick={() => setSelected(p)} className="text-left bg-white rounded-2xl shadow-sm hover:shadow-md overflow-hidden hover:-translate-y-1 transition-all flex flex-col justify-between border border-slate-200 active:scale-[0.99] group">
            <div>
              <div className={`${posClass(p.position)} p-4 text-white text-center relative`}>
                <div className="text-2xl font-black tracking-tight drop-shadow-sm">#{p.number}</div>
                {/* Health Indicator Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-white">
                  <span className={`w-2 h-2 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-400' : p.status === 'INJURED' ? 'bg-rose-400 animate-pulse' : 'bg-slate-400'}`} />
                  <span>{p.status === 'ACTIVE' ? 'Apto' : p.status === 'INJURED' ? 'Lesionado' : 'Inactivo'}</span>
                </div>
                {p.team && (
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 bg-black/40 backdrop-blur-xs text-white rounded-full">
                    {p.team.name}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-base text-slate-900 mb-1 group-hover:text-purple-600 transition truncate">{p.name}</h3>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">
                    {p.position === 'HANDLER' ? '🎯 Manejador' : p.position === 'CUTTER' ? '⚡ Cortador' : '🔄 Híbrido'}
                  </span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded-md ${
                    p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                    p.status === 'INJURED' ? 'bg-rose-50 text-rose-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {p.status === 'ACTIVE' ? '🟢 Disponible' : p.status === 'INJURED' ? '🔴 En Tratamiento' : '⚪ Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            {p.user?.roles && p.user.roles.length > 0 && (
              <div className="px-4 py-1.5 bg-indigo-50/50 border-t border-indigo-50 flex items-center gap-1.5 flex-wrap">
                {p.user.roles.map(r => (
                  <span key={r.role.name} className="text-[9px] font-bold uppercase tracking-wide text-indigo-700 bg-indigo-100/50 px-1.5 py-0.5 rounded">
                    {r.role.name}
                  </span>
                ))}
              </div>
            )}
            {(p.team || p.category) && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  {p.team && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.team.color || '#4f46e5' }} />}
                  <span className="text-xs font-medium text-gray-600 truncate">{p.team?.name || 'Agente Libre'}</span>
                </div>
                {p.category && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{p.category}</span>
                )}
              </div>
            )}
          </button>
        ))}

        {loading && <div className="text-gray-600">Cargando...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-gray-600">No hay jugadores que coincidan con el filtro.</div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="text-gray-600 font-medium">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Modal (placeholder) */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
              <div className="text-lg font-bold">{selected.name} #{selected.number}</div>
              <div className="text-sm opacity-90">{selected.position}</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm"><span className="text-gray-500">Estado:</span> <span className={`font-semibold ${badgeColor[selected.status]}`}>{selected.status}</span></div>
              
              <div className="border-t pt-3 mt-3">
                <div className="font-semibold text-gray-700 mb-2">Información de Equipo</div>
                {selected.team ? (
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      {selected.team.logoUrl && <img src={selected.team.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />}
                      <span className="font-bold">{selected.team.name}</span>
                    </div>
                    {selected.team.categories && <div><span className="text-gray-500">Categorías del Equipo:</span> {selected.team.categories}</div>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">Agente Libre / Sin Equipo</div>
                )}
                {selected.category && <div className="text-sm mt-1"><span className="text-gray-500">Categoría del Jugador:</span> {selected.category}</div>}
              </div>

              {selected.user?.roles && selected.user.roles.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <div className="font-semibold text-gray-700 mb-2">Roles y Permisos del Usuario</div>
                  <div className="space-y-2">
                    {selected.user.roles.map(r => (
                      <div key={r.role.name} className="text-sm bg-gray-50 p-2 rounded border border-gray-100">
                        <div className="font-medium text-gray-900">{r.role.name}</div>
                        {r.role.roles && r.role.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.role.roles.map(p => (
                              <span key={p.permission.name} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] uppercase font-bold tracking-wide">
                                {p.permission.name.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 mt-1">Sin permisos explícitos</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="font-semibold text-gray-700 mb-2">Datos Físicos</div>
                {selected.experience && <div className="text-sm"><span className="text-gray-500">Experiencia:</span> {selected.experience}</div>}
                {selected.heightCm && <div className="text-sm"><span className="text-gray-500">Altura:</span> {selected.heightCm} cm</div>}
              </div>
              
              {/* Player Statistics */}
              <div className="border-t pt-3 mt-3">
                <div className="font-semibold text-gray-700 mb-2">Estadísticas</div>
                {loadingStats ? (
                  <div className="text-sm text-gray-500">Cargando estadísticas...</div>
                ) : playerStats ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-gray-600 text-xs">Eventos Totales</div>
                      <div className="font-bold text-blue-700">{playerStats.totalEvents}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-gray-600 text-xs">Eventos Completados</div>
                      <div className="font-bold text-green-700">{playerStats.completedEvents}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="text-gray-600 text-xs">Asistencias</div>
                      <div className="font-bold text-purple-700">{playerStats.eventsAttended}</div>
                    </div>
                    <div className="bg-amber-50 p-2 rounded">
                      <div className="text-gray-600 text-xs">Tasa de Asistencia</div>
                      <div className="font-bold text-amber-700">{playerStats.attendanceRate}%</div>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded">
                      <div className="text-gray-600 text-xs">Participaciones</div>
                      <div className="font-bold text-indigo-700">{playerStats.eventsParticipated}</div>
                    </div>
                    {playerStats.matchStats && (
                      <div className="bg-rose-50 p-2 rounded">
                        <div className="text-gray-600 text-xs">Eficiencia (+/-)</div>
                        <div className={`font-bold ${playerStats.matchStats.plusMinus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {playerStats.matchStats.plusMinus > 0 ? '+' : ''}{playerStats.matchStats.plusMinus}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No hay estadísticas disponibles</div>
                )}
              </div>
            </div>
            <div className="p-4 flex gap-2">
              {(hasPermission('roster:manage') || authUser?.playerId === selected.id) && (
              <button
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                onClick={() => { setEditOpen(true) }}
              >Editar</button>
              )}
              {hasPermission('roster:manage') && (
              <button
                className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg hover:bg-red-100"
                onClick={() => {
                  if (!selected) return
                  setConfirmState({
                    message: `¿Eliminar a ${selected.name}?`,
                    onYes: () => {
                      deletePlayer(selected.id)
                      setSelected(null)
                    }
                  })
                }}
              >Eliminar</button>
              )}
              <button className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200" onClick={() => setSelected(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white p-4">
              <div className="text-lg font-bold">Agregar Jugador</div>
            </div>
            <div className="p-4">
              <PlayerForm
                mode="create"
                initial={null}
                onCancel={() => setCreateOpen(false)}
                onSubmit={async (data) => { await createPlayer(data as any) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
              <div className="text-lg font-bold">Editar Jugador</div>
            </div>
            <div className="p-4">
              <PlayerForm
                mode="edit"
                initial={selected}
                onCancel={() => setEditOpen(false)}
                onSubmit={async (data) => { if (selected) await updatePlayer(selected.id, data as any) }}
              />
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={confirmState.message}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            await confirmState.onYes()
            setConfirmState(null)
          }}
        />
      )}
    </div>
  )
}
