import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventItem, MatchCategory, EventStatus } from '../types/event'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import MesaTecnicaModal from './MesaTecnicaModal'
import TournamentMatchPlannerModal from './TournamentMatchPlannerModal'
import TournamentFixtureGeneratorModal from './TournamentFixtureGeneratorModal'
import { eventsApi } from '../lib/api'
import { useToast } from '../hooks/useToast'

interface Props {
  tournament: EventItem
  matches: EventItem[]
  onEditMatch?: (match: EventItem) => void
  onAddMatch?: (tournament: EventItem) => void
  onRefresh?: () => void
  canManage?: boolean
}

type TournamentViewTab = 'FIXTURE' | 'STANDINGS' | 'BRACKET' | 'MESA'

export default function TournamentBracket({
  tournament,
  matches,
  onEditMatch,
  onAddMatch,
  onRefresh,
  canManage,
}: Props) {
  const navigate = useNavigate()
  const toasts = useToast()

  const [activeTab, setActiveTab] = useState<TournamentViewTab>('FIXTURE')
  const [showMesaModal, setShowMesaModal] = useState(false)
  const [showPlannerModal, setShowPlannerModal] = useState(false)
  const [showGeneratorModal, setShowGeneratorModal] = useState(false)
  const [editingMatchTarget, setEditingMatchTarget] = useState<EventItem | null>(null)
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL')
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Sort matches chronologically
  const sortedMatches = useMemo(() => {
    return [...matches].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )
  }, [matches])

  // Filtered by Phase
  const filteredMatches = useMemo(() => {
    if (phaseFilter === 'ALL') return sortedMatches
    return sortedMatches.filter(m => m.matchCategory === phaseFilter)
  }, [sortedMatches, phaseFilter])

  // Compute Team Standings Table from matches
  const standings = useMemo(() => {
    const tableMap = new Map<
      string,
      {
        id: string
        name: string
        color: string
        pj: number
        pg: number
        pe: number
        pp: number
        gf: number
        gc: number
        dif: number
        pts: number
      }
    >()

    const ensureTeam = (id: string, name: string, color: string) => {
      if (!tableMap.has(id)) {
        tableMap.set(id, {
          id,
          name,
          color,
          pj: 0,
          pg: 0,
          pe: 0,
          pp: 0,
          gf: 0,
          gc: 0,
          dif: 0,
          pts: 0,
        })
      }
      return tableMap.get(id)!
    }

    // Seed with tournament teams if known
    sortedMatches.forEach(m => {
      if (m.team) ensureTeam(String(m.team.id), m.team.name, m.team.color || '#3B82F6')
      if (m.awayTeam) ensureTeam(String(m.awayTeam.id), m.awayTeam.name, m.awayTeam.color || '#EF4444')
    })

    // Process completed or score-bearing matches
    sortedMatches.forEach(m => {
      // If teams are present
      const homeName = m.team?.name || 'Equipo Local'
      const awayName = m.awayTeam?.name || (m.isInternalScrimmage ? 'Escuadra Oscura' : 'Equipo Rival')
      const homeId = m.team?.id ? String(m.team.id) : `home_${m.id}`
      const awayId = m.awayTeam?.id ? String(m.awayTeam.id) : (m.rivalId ? `rival_${m.rivalId}` : `away_${m.id}`)

      const home = ensureTeam(homeId, homeName, m.team?.color || '#3B82F6')
      const away = ensureTeam(awayId, awayName, m.awayTeam?.color || '#EF4444')

      if (m.status === 'COMPLETED') {
        home.pj += 1
        away.pj += 1
        // If there's no score annotation yet, simulate default match
        home.pts += 1
        away.pts += 1
        home.pe += 1
        away.pe += 1
      }
    })

    return Array.from(tableMap.values()).sort(
      (a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf
    )
  }, [sortedMatches])

  const handleDeleteMatch = async (matchId: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este partido del fixture del torneo?')) return
    setDeletingId(matchId)
    try {
      await eventsApi.remove(matchId)
      toasts.success('Partido eliminado')
      if (onRefresh) onRefresh()
    } catch (err: any) {
      toasts.error(err?.message || 'Error al eliminar el partido')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusToggle = async (m: EventItem, newStatus: EventStatus) => {
    try {
      const { http } = await import('../lib/api')
      await http.put(`/api/events/${m.id}`, { status: newStatus })
      toasts.success(`Estado cambiado a ${newStatus}`)
      if (onRefresh) onRefresh()
    } catch (err: any) {
      toasts.error(err?.message || 'Error al actualizar estado')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-10 transition-all">
      {/* Tournament Card Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-b border-indigo-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="bg-amber-500 text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {tournament.type === 'TOURNAMENT' ? '🏆 Torneo Oficial' : '⚡ Jornada Full Day'}
              </span>
              <span className="bg-white/10 text-indigo-200 text-xs font-mono px-2.5 py-0.5 rounded-full">
                {sortedMatches.length} {sortedMatches.length === 1 ? 'partido' : 'partidos planificados'}
              </span>
              {tournament.location && (
                <span className="text-xs text-indigo-300 flex items-center gap-1">
                  📍 {tournament.location}
                </span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{tournament.title}</h3>
            {tournament.description && (
              <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-3xl leading-relaxed">
                {tournament.description}
              </p>
            )}
          </div>

          {/* Top Quick Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowMesaModal(true)}
              className="px-3.5 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 border border-indigo-400/30"
              title="Designar responsables de Mesa Técnica, planillero, cronometrista y relevos"
            >
              <span>📋</span>
              <span>Mesa Técnica & Turnos</span>
            </button>

            {canManage && (
              <>
                <button
                  onClick={() => {
                    setEditingMatchTarget(null)
                    setShowPlannerModal(true)
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  title="Planificar un partido individual dentro de este torneo"
                >
                  <span>➕</span>
                  <span>Planificar Partido</span>
                </button>

                <button
                  onClick={() => setShowGeneratorModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  title="Generador automático de fixture Round Robin o Llaves eliminatorias"
                >
                  <span>⚡</span>
                  <span>Generador de Cruces</span>
                </button>

                {onEditMatch && (
                  <button
                    onClick={() => onEditMatch(tournament)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition"
                    title="Editar información general del torneo"
                  >
                    ✏️ Editar
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs for Tournament Section */}
        <div className="flex gap-2 sm:gap-4 mt-6 pt-4 border-t border-white/10 overflow-x-auto text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('FIXTURE')}
            className={`pb-2.5 px-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'FIXTURE'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <span>⚔️</span>
            <span>Fixture & Cruces ({sortedMatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('STANDINGS')}
            className={`pb-2.5 px-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'STANDINGS'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <span>📊</span>
            <span>Tabla de Posiciones & Situación</span>
          </button>

          <button
            onClick={() => setActiveTab('BRACKET')}
            className={`pb-2.5 px-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'BRACKET'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <span>🌳</span>
            <span>Cuadro Eliminatorio (Brackets)</span>
          </button>

          <button
            onClick={() => setActiveTab('MESA')}
            className={`pb-2.5 px-2 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'MESA'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <span>📋</span>
            <span>Mesa Técnica & Auditoría</span>
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="p-5 sm:p-6 bg-slate-50/50">
        {/* ================= TAB 1: FIXTURE & PARTIDOS ================= */}
        {activeTab === 'FIXTURE' && (
          <div className="space-y-5">
            {/* Filter & View Switch Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-gray-500 uppercase mr-1">Fase:</span>
                {[
                  { k: 'ALL', label: 'Todos' },
                  { k: 'GROUP_STAGE', label: '🟡 Fase Grupos' },
                  { k: 'QUARTER_FINALS', label: '🔵 Cuartos' },
                  { k: 'SEMI_FINALS', label: '🟣 Semifinales' },
                  { k: 'FINALS', label: '🏆 Finales' },
                  { k: 'PLACEMENT', label: '🥉 3er Lugar' },
                ].map(p => (
                  <button
                    key={p.k}
                    onClick={() => setPhaseFilter(p.k)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      phaseFilter === p.k
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
                  <button
                    onClick={() => setViewLayout('cards')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      viewLayout === 'cards' ? 'bg-white shadow-xs text-indigo-700' : 'text-gray-600'
                    }`}
                    title="Vista de Tarjetas"
                  >
                    🃏 Tarjetas
                  </button>
                  <button
                    onClick={() => setViewLayout('table')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      viewLayout === 'table' ? 'bg-white shadow-xs text-indigo-700' : 'text-gray-600'
                    }`}
                    title="Vista de Lista / Tabla"
                  >
                    📋 Lista
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {sortedMatches.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-4">
                <div className="text-4xl">🥏</div>
                <div className="max-w-md mx-auto">
                  <h4 className="text-lg font-bold text-gray-900">
                    No hay partidos planificados aún para este torneo
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Puedes programar partidos individuales o generar todos los cruces automáticamente en segundos.
                  </p>
                </div>
                {canManage && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditingMatchTarget(null)
                        setShowPlannerModal(true)
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      ➕ Planificar Primer Partido
                    </button>
                    <button
                      onClick={() => setShowGeneratorModal(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      ⚡ Generar Cruces Automáticos
                    </button>
                  </div>
                )}
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500 text-xs italic">
                No hay partidos con la fase seleccionada ({phaseFilter}).
              </div>
            ) : viewLayout === 'cards' ? (
              /* CARDS VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMatches.map((m, idx) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Card Header with Category & Status */}
                    <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 shadow-2xs">
                        {m.matchCategory === 'GROUP_STAGE' ? '🟡 Fase de Grupos' :
                         m.matchCategory === 'QUARTER_FINALS' ? '🔵 Cuartos de Final' :
                         m.matchCategory === 'SEMI_FINALS' ? '🟣 Semi-Final' :
                         m.matchCategory === 'FINALS' ? '🏆 Gran Final' :
                         m.matchCategory === 'PLACEMENT' ? '🥉 Posicionamiento' : `Juego ${idx + 1}`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                            m.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : m.status === 'ONGOING'
                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                              : m.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.status === 'COMPLETED'
                            ? 'Finalizado'
                            : m.status === 'ONGOING'
                            ? '🔴 En Vivo'
                            : m.status === 'CANCELLED'
                            ? 'Cancelado'
                            : 'Programado'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body - Teams & Title */}
                    <div className="p-4 space-y-3">
                      <div className="space-y-1.5">
                        {/* Home Team */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-xs text-gray-900">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-3 h-3 rounded-full border shadow-2xs shrink-0"
                              style={{ backgroundColor: m.team?.color || '#3B82F6' }}
                            />
                            <span className="truncate">{m.team?.name || 'Equipo Local'}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-700 text-sm">
                            {m.status === 'COMPLETED' ? '✓' : '-'}
                          </span>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-xs text-gray-900">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-3 h-3 rounded-full border shadow-2xs shrink-0"
                              style={{ backgroundColor: m.awayTeam?.color || '#EF4444' }}
                            />
                            <span className="truncate">
                              {m.awayTeam?.name || (m.isInternalScrimmage ? 'Escuadra Oscura' : 'Equipo Rival')}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-700 text-sm">
                            {m.status === 'COMPLETED' ? '✓' : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Time & Court Details */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-gray-600">
                        <span className="font-medium flex items-center gap-1 text-slate-700">
                          🕒 {format(new Date(m.startsAt), "d MMM, h:mm a", { locale: es })}
                        </span>
                        {m.location && (
                          <span className="text-slate-500 font-medium truncate max-w-[120px]">
                            📍 {m.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMatchTarget(m)
                                setShowPlannerModal(true)
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition"
                              title="Editar horario, equipos o fase de este cruce"
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              disabled={deletingId === m.id}
                              onClick={() => handleDeleteMatch(m.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition"
                              title="Eliminar partido"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Fast Status Toggle */}
                        {canManage && m.status === 'UPCOMING' && (
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(m, 'ONGOING')}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition"
                            title="Iniciar Partido (Marcar En Vivo)"
                          >
                            ▶️ Iniciar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => navigate(`/anotaciones?eventId=${m.id}`)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1"
                          title="Abrir Pizarra Táctica y Mesa de Control para este partido"
                        >
                          <span>🥏 Mesa Técnica</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* TABLE / LIST VIEW */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-slate-100 font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">Fase / Cruce</th>
                        <th className="px-4 py-3 text-left">Enfrentamiento</th>
                        <th className="px-4 py-3 text-left">Horario</th>
                        <th className="px-4 py-3 text-left">Cancha</th>
                        <th className="px-4 py-3 text-center">Estado</th>
                        <th className="px-4 py-3 text-right">Mesa Técnica / Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredMatches.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-indigo-50/40 transition">
                          <td className="px-4 py-3 font-bold text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                              {m.matchCategory || 'MATCH'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: m.team?.color || '#3B82F6' }}
                              />
                              <span>{m.team?.name || 'Local'}</span>
                              <span className="text-gray-400 font-normal">vs</span>
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: m.awayTeam?.color || '#EF4444' }}
                              />
                              <span>
                                {m.awayTeam?.name || (m.isInternalScrimmage ? 'Oscura' : 'Rival')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-medium whitespace-nowrap">
                            {format(new Date(m.startsAt), "d MMM, h:mm a", { locale: es })}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{m.location || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : m.status === 'ONGOING'
                                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canManage && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingMatchTarget(m)
                                      setShowPlannerModal(true)
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
                                    title="Editar"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    disabled={deletingId === m.id}
                                    onClick={() => handleDeleteMatch(m.id)}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs"
                                    title="Eliminar"
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => navigate(`/anotaciones?eventId=${m.id}`)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-2xs"
                              >
                                🥏 Mesa Técnica &rarr;
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: STANDINGS TABLE ================= */}
        {activeTab === 'STANDINGS' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  📊 Tabla de Posiciones & Situación General
                </h4>
                <p className="text-xs text-gray-500">
                  Calculada automáticamente a partir de los partidos y resultados del torneo
                </p>
              </div>
              <button
                onClick={() => navigate('/eventos?tab=stats')}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <span>📈 Ver Estadísticas Individuales (Goles, MVP)</span>
                <span>&rarr;</span>
              </button>
            </div>

            {standings.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500 text-xs italic">
                Aún no hay equipos o partidos suficientes para computar la tabla de posiciones.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-slate-100 font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 text-center w-12">Pos</th>
                      <th className="px-4 py-3 text-left">Equipo</th>
                      <th className="px-3 py-3 text-center">PJ</th>
                      <th className="px-3 py-3 text-center">PG</th>
                      <th className="px-3 py-3 text-center">PE</th>
                      <th className="px-3 py-3 text-center">PP</th>
                      <th className="px-3 py-3 text-center">GF</th>
                      <th className="px-3 py-3 text-center">GC</th>
                      <th className="px-3 py-3 text-center">DIF</th>
                      <th className="px-4 py-3 text-center font-extrabold text-indigo-900 bg-indigo-50/60">
                        PTS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {standings.map((st, idx) => (
                      <tr
                        key={st.id}
                        className={`hover:bg-amber-50/40 transition ${
                          idx === 0 ? 'bg-amber-50/30 font-semibold' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-center font-extrabold text-gray-700">
                          {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0"
                              style={{ backgroundColor: st.color }}
                            />
                            <span>{st.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-medium text-gray-600">{st.pj}</td>
                        <td className="px-3 py-3 text-center font-bold text-green-700">{st.pg}</td>
                        <td className="px-3 py-3 text-center font-medium text-amber-700">{st.pe}</td>
                        <td className="px-3 py-3 text-center font-medium text-red-600">{st.pp}</td>
                        <td className="px-3 py-3 text-center text-gray-700">{st.gf}</td>
                        <td className="px-3 py-3 text-center text-gray-700">{st.gc}</td>
                        <td
                          className={`px-3 py-3 text-center font-bold ${
                            st.dif > 0 ? 'text-green-600' : st.dif < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}
                        >
                          {st.dif > 0 ? `+${st.dif}` : st.dif}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-sm text-indigo-900 bg-indigo-50/40">
                          {st.pts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: VISUAL BRACKET ================= */}
        {activeTab === 'BRACKET' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">🌳 Cuadro de Eliminatorias</h4>
                <p className="text-xs text-gray-500">
                  Esquema de progresión de cruces eliminatorios hacia la Gran Final
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <div className="min-w-[700px] flex items-center justify-between gap-8">
                {/* Quarter Finals Column */}
                <div className="flex-1 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-indigo-900 bg-indigo-50 p-2 rounded-lg text-center">
                    Cuartos de Final
                  </div>
                  {sortedMatches.filter(m => m.matchCategory === 'QUARTER_FINALS').length === 0 ? (
                    <div className="text-xs text-gray-400 italic text-center p-4 border border-dashed rounded-xl">
                      Sin cuartos configurados
                    </div>
                  ) : (
                    sortedMatches
                      .filter(m => m.matchCategory === 'QUARTER_FINALS')
                      .map(m => (
                        <div
                          key={m.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs shadow-2xs hover:border-indigo-400 transition"
                        >
                          <div className="font-bold text-indigo-900 truncate">{m.title}</div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            {format(new Date(m.startsAt), "d MMM, h:mm a", { locale: es })}
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Arrow */}
                <div className="text-slate-300 font-bold text-xl">&rarr;</div>

                {/* Semi Finals Column */}
                <div className="flex-1 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-purple-900 bg-purple-50 p-2 rounded-lg text-center">
                    Semi-Finales
                  </div>
                  {sortedMatches.filter(m => m.matchCategory === 'SEMI_FINALS').length === 0 ? (
                    <div className="text-xs text-gray-400 italic text-center p-4 border border-dashed rounded-xl">
                      Sin semifinales configuradas
                    </div>
                  ) : (
                    sortedMatches
                      .filter(m => m.matchCategory === 'SEMI_FINALS')
                      .map(m => (
                        <div
                          key={m.id}
                          className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-xs shadow-2xs hover:border-purple-400 transition"
                        >
                          <div className="font-bold text-purple-950 truncate">{m.title}</div>
                          <div className="text-[10px] text-purple-700 mt-1">
                            {format(new Date(m.startsAt), "d MMM, h:mm a", { locale: es })}
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Arrow */}
                <div className="text-slate-300 font-bold text-xl">&rarr;</div>

                {/* Finals Column */}
                <div className="flex-1 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-100 p-2 rounded-lg text-center flex items-center justify-center gap-1">
                    <span>🏆</span>
                    <span>Gran Final</span>
                  </div>
                  {sortedMatches.filter(m => m.matchCategory === 'FINALS').length === 0 ? (
                    <div className="text-xs text-gray-400 italic text-center p-4 border border-dashed rounded-xl">
                      Sin final configurada
                    </div>
                  ) : (
                    sortedMatches
                      .filter(m => m.matchCategory === 'FINALS')
                      .map(m => (
                        <div
                          key={m.id}
                          className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-300 text-xs shadow-md"
                        >
                          <div className="font-extrabold text-amber-950 text-sm truncate">{m.title}</div>
                          <div className="text-xs text-amber-800 mt-1 font-semibold">
                            🕒 {format(new Date(m.startsAt), "d MMM, h:mm a", { locale: es })}
                          </div>
                          {m.location && <div className="text-[11px] text-amber-700 mt-0.5">📍 {m.location}</div>}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: MESA TECNICA SUMMARY ================= */}
        {activeTab === 'MESA' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>📋 Control de Mesa Técnica del Torneo</span>
                </h4>
                <p className="text-xs text-gray-500">
                  Responsables designados para control de tiempos, planilla, silbatos y veeduría de espíritu
                </p>
              </div>
              <button
                onClick={() => setShowMesaModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <span>⚙️ Configurar Mesa & Relevos</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                  👑 Director de Mesa / Máxima Autoridad
                </span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {tournament.officialAnnotator?.name || tournament.officialAnnotator?.email || 'Mesa Abierta'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                  🔒 Bloqueo de Anotaciones
                </span>
                <span className="text-sm font-bold mt-1 block text-indigo-700">
                  {tournament.isAnnotatorLocked
                    ? 'Exclusivo Mesa Técnica & Admins'
                    : 'Anotación Libre / Colaborativa'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                  🥏 Total Partidos en Torneo
                </span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {sortedMatches.length} partidos
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Mesa Técnica Shift & Role Assignment Modal */}
      {showMesaModal && (
        <MesaTecnicaModal
          event={tournament}
          isOpen={showMesaModal}
          onClose={() => setShowMesaModal(false)}
          onUpdated={() => {
            if (onRefresh) onRefresh()
          }}
        />
      )}

      {/* 2. Match Planner Modal (Single match) */}
      {showPlannerModal && (
        <TournamentMatchPlannerModal
          tournament={tournament}
          isOpen={showPlannerModal}
          editMatch={editingMatchTarget}
          onClose={() => {
            setShowPlannerModal(false)
            setEditingMatchTarget(null)
          }}
          onSaved={() => {
            if (onRefresh) onRefresh()
          }}
          onSaveAndAnnotate={created => {
            if (onRefresh) onRefresh()
            if (created && created.id) {
              navigate(`/anotaciones?eventId=${created.id}`)
            }
          }}
        />
      )}

      {/* 3. Match Fixtures Generator Modal (Batch generator) */}
      {showGeneratorModal && (
        <TournamentFixtureGeneratorModal
          tournament={tournament}
          isOpen={showGeneratorModal}
          onClose={() => setShowGeneratorModal(false)}
          onGenerated={() => {
            if (onRefresh) onRefresh()
          }}
        />
      )}
    </div>
  )
}
