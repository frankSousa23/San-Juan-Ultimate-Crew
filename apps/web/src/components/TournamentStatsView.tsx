import React, { useEffect, useState } from 'react';
import { http, eventsApi } from '../lib/api';
import { EventItem } from '../types/event';

type PlayerPerformance = {
  playerId: number;
  playerName: string;
  playerNumber: number;
  teamId?: number | null;
  teamName?: string;
  teamColor?: string;
  isRefuerzo?: boolean;
  goals: number;
  assists: number;
  defenses: number;
  turnovers: number;
  mvpScore: number;
  pointsPlayed: number;
};

type MatchResult = {
  id: number;
  title: string;
  homeTeamId?: number | null;
  homeTeamName?: string;
  homeTeamColor?: string;
  awayTeamId?: number | null;
  awayTeamName?: string;
  awayTeamColor?: string;
  opponent: string;
  scoreHome: number;
  scoreAway: number;
  status: string;
  category: string;
  startsAt?: string;
  location?: string;
};

type TeamStanding = {
  teamId: number;
  teamName: string;
  teamColor: string;
  matchesPlayed: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

type SpiritStats = {
  overallAverage: number;
  maxScore: number;
  breakdown: {
    rulesKnowledge: number;
    foulsAndContact: number;
    fairMindedness: number;
    positiveAttitude: number;
    communication: number;
  };
};

type MesaStaffMember = {
  playerId?: number;
  playerName: string;
  playerNumber?: number;
  roleLabel: string;
  isPlayer?: boolean;
};

type AnnotatorAudit = {
  id: number;
  name: string;
  email: string;
  annotationsCount: number;
};

type SpecialEventStatsResponse = {
  event: {
    id: number;
    title: string;
    type: string;
    status: string;
    startsAt?: string;
    endsAt?: string;
    location?: string;
    isAnnotatorLocked?: boolean;
    officialAnnotator?: { id: number; name?: string | null; email: string } | null;
  };
  matchesPlayed: number;
  goals: number;
  assists: number;
  defenses: number;
  turnovers: number;
  playerStats: PlayerPerformance[];
  matchesList: MatchResult[];
  teamStandings?: TeamStanding[];
  spiritStats: SpiritStats;
  mesaTecnica: {
    officialAnnotator?: { id: number; name?: string | null; email: string } | null;
    members: MesaStaffMember[];
    annotatorsAudit: AnnotatorAudit[];
  };
};

type TabType = 'STANDINGS' | 'PLAYERS' | 'MATCHES' | 'SPIRIT' | 'MESA_AUDIT';

export default function TournamentStatsView() {
  const [specialEvents, setSpecialEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<TabType>('PLAYERS');
  const [stats, setStats] = useState<SpecialEventStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await eventsApi.list();
      if (!Array.isArray(res)) return;
      const specialTypes = ['TOURNAMENT', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'MATCH', 'AMISTOSO'];
      const filtered = res
        .filter(e => specialTypes.includes(e.type))
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
      
      setSpecialEvents(filtered);
      if (filtered.length > 0) {
        setSelectedEventId(filtered[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    http.get<SpecialEventStatsResponse>(`/api/stats/tournament/${selectedEventId}`)
      .then(res => {
        if (res && res.data) {
          setStats(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  const filteredEvents = specialEvents.filter(e => {
    if (filterType === 'ALL') return true;
    return e.type === filterType;
  });

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'TOURNAMENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">🏆 Torneo Oficial</span>;
      case 'FULL_DAY_OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">⚡ Full Day Open</span>;
      case 'FULL_DAY_MIXTO':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">🌈 Full Day Mixto</span>;
      case 'MATCH':
      case 'AMISTOSO':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">🥏 Encuentro / Amistoso</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">🏁 Finalizado / Acta Cerrada</span>;
      case 'ONGOING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse">🔴 En Vivo / Mesa Activa</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">⏳ Programado</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
      {/* Header & Controls */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h3 className="font-black text-xl tracking-tight">Estadísticas y Actas por Evento Especial</h3>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Registro separado por Torneo, Full Day y Encuentro con supervisión y aval de Mesa Técnica.
            </p>
          </div>

          <button
            onClick={() => setShowPrintModal(true)}
            disabled={!stats}
            className="self-start md:self-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span>📄</span>
            <span>Ver / Exportar Acta Oficial</span>
          </button>
        </div>

        {/* Filter and Event Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-indigo-900/50">
          <div>
            <label className="block text-xs font-semibold text-indigo-300 mb-1">Filtrar Categoría:</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                const nextEvents = specialEvents.filter(ev => e.target.value === 'ALL' || ev.type === e.target.value);
                if (nextEvents.length > 0) setSelectedEventId(nextEvents[0].id);
              }}
              className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos los Eventos Especiales</option>
              <option value="TOURNAMENT">🏆 Torneos Oficiales</option>
              <option value="FULL_DAY_OPEN">⚡ Full Day Open</option>
              <option value="FULL_DAY_MIXTO">🌈 Full Day Mixto</option>
              <option value="MATCH">🥏 Encuentros / Amistosos</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-indigo-300 mb-1">Seleccionar Evento Especial:</label>
            {filteredEvents.length > 0 ? (
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                {filteredEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({new Date(ev.startsAt).toLocaleDateString('es-ES')})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-slate-400">
                No hay eventos especiales en esta categoría.
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-gray-500 space-y-2 animate-pulse">
          <div className="text-3xl">🥏</div>
          <div className="font-bold text-sm">Cargando datos y actas del evento...</div>
        </div>
      )}

      {!loading && stats && (
        <div>
          {/* Event Summary Banner */}
          <div className="p-6 bg-slate-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg font-black text-gray-900">{stats.event.title}</h4>
                  {getEventTypeBadge(stats.event.type)}
                  {getStatusBadge(stats.event.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 font-medium flex-wrap">
                  {stats.event.startsAt && (
                    <span>📅 {new Date(stats.event.startsAt).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                  {stats.event.location && (
                    <span>📍 {stats.event.location}</span>
                  )}
                  {stats.event.officialAnnotator && (
                    <span>📋 Anotador Oficial: <strong className="text-gray-800">{stats.event.officialAnnotator.name || stats.event.officialAnnotator.email}</strong></span>
                  )}
                </div>
              </div>

              {/* Quick KPIs */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-lg font-black text-indigo-600">{stats.matchesPlayed}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Partidos</div>
                </div>
                <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-lg font-black text-green-600">{stats.goals}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Goles</div>
                </div>
                <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-lg font-black text-blue-600">{stats.assists}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">Asist.</div>
                </div>
                <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-lg font-black text-purple-600">{stats.defenses}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">D's</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mt-6 border-b border-gray-200 pb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('STANDINGS')}
                className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'STANDINGS'
                    ? 'bg-white text-indigo-700 border-t-2 border-x border-gray-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>🏆</span>
                <span>Tabla de Posiciones ({stats.teamStandings?.length || 0} Equipos)</span>
              </button>

              <button
                onClick={() => setActiveTab('PLAYERS')}
                className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'PLAYERS'
                    ? 'bg-white text-indigo-700 border-t-2 border-x border-gray-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>👤</span>
                <span>Rendimiento Individual & MVP</span>
              </button>

              <button
                onClick={() => setActiveTab('MATCHES')}
                className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'MATCHES'
                    ? 'bg-white text-indigo-700 border-t-2 border-x border-gray-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>⚔️</span>
                <span>Resultados de Partidos ({stats.matchesList?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('SPIRIT')}
                className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'SPIRIT'
                    ? 'bg-white text-indigo-700 border-t-2 border-x border-gray-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>🤝</span>
                <span>Espíritu de Juego (SOTG)</span>
              </button>

              <button
                onClick={() => setActiveTab('MESA_AUDIT')}
                className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'MESA_AUDIT'
                    ? 'bg-white text-indigo-700 border-t-2 border-x border-gray-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>📋</span>
                <span>Mesa Técnica & Auditoría</span>
              </button>
            </div>
          </div>

          {/* Tab 0: Team Standings */}
          {activeTab === 'STANDINGS' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Clasificación y Puntuación General por Equipos</h4>
                  <p className="text-xs text-gray-500">
                    Criterio de orden: Puntos ganados (3V / 1E / 0D) &rarr; Diferencia de goles (+/-) &rarr; Goles a favor (GF).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full text-xs text-left text-gray-600">
                  <thead className="bg-gray-100 text-gray-700 uppercase font-black tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3 text-center">Pos</th>
                      <th className="px-4 py-3">Equipo</th>
                      <th className="px-4 py-3 text-center">PJ</th>
                      <th className="px-4 py-3 text-center">G</th>
                      <th className="px-4 py-3 text-center">E</th>
                      <th className="px-4 py-3 text-center">P</th>
                      <th className="px-4 py-3 text-center">GF</th>
                      <th className="px-4 py-3 text-center">GC</th>
                      <th className="px-4 py-3 text-center">+/-</th>
                      <th className="px-4 py-3 text-center text-indigo-700 bg-indigo-50 font-black">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stats.teamStandings && stats.teamStandings.length > 0 ? (
                      stats.teamStandings.map((st, idx) => (
                        <tr key={st.teamId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-black text-center text-gray-700">
                            {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-2">
                            <span 
                              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: st.teamColor || '#3B82F6' }}
                            />
                            <span>{st.teamName}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-700">{st.matchesPlayed}</td>
                          <td className="px-4 py-3 text-center font-semibold text-green-600">{st.won}</td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-500">{st.drawn}</td>
                          <td className="px-4 py-3 text-center font-semibold text-red-500">{st.lost}</td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-800">{st.goalsFor}</td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-500">{st.goalsAgainst}</td>
                          <td className={`px-4 py-3 text-center font-bold ${st.goalDiff > 0 ? 'text-green-600' : st.goalDiff < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                            {st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff}
                          </td>
                          <td className="px-4 py-3 text-center font-black text-indigo-700 bg-indigo-50/50 text-sm">
                            {st.points}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                          No hay registros de equipos disponibles en este evento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 1: Players & MVP */}
          {activeTab === 'PLAYERS' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Tabla de Rendimiento de Jugadores en este Evento</h4>
                  <p className="text-xs text-gray-500">
                    Valoración MVP ponderada: (Goles × 1.5) + (Asistencias × 1.2) + (Defensas × 2.0) - (Turnovers × 0.8)
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-xs text-left text-gray-600">
                  <thead className="bg-gray-100 text-gray-700 uppercase font-black tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Jugador / Equipo</th>
                      <th className="px-4 py-3 text-center">Goles</th>
                      <th className="px-4 py-3 text-center">Asist.</th>
                      <th className="px-4 py-3 text-center">D's</th>
                      <th className="px-4 py-3 text-center">Turnovers</th>
                      <th className="px-4 py-3 text-center">Total G+A</th>
                      <th className="px-4 py-3 text-center text-indigo-700 bg-indigo-50 font-black">Índice MVP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stats.playerStats && stats.playerStats.length > 0 ? (
                      stats.playerStats.map((p, idx) => (
                        <tr key={p.playerId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black border">
                                {p.playerNumber || '-'}
                              </span>
                              <span>{p.playerName}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded font-black">👑 MVP</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {p.teamName && (
                                <span 
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: p.teamColor ? `${p.teamColor}15` : '#f1f5f9',
                                    color: p.teamColor || '#475569',
                                    border: `1px solid ${p.teamColor ? `${p.teamColor}40` : '#cbd5e1'}`
                                  }}
                                >
                                  {p.teamName}
                                </span>
                              )}
                              {p.isRefuerzo && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Refuerzo
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-green-600">{p.goals > 0 ? p.goals : '-'}</td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600">{p.assists > 0 ? p.assists : '-'}</td>
                          <td className="px-4 py-3 text-center font-bold text-purple-600">{p.defenses > 0 ? p.defenses : '-'}</td>
                          <td className="px-4 py-3 text-center font-medium text-red-500">{p.turnovers > 0 ? p.turnovers : '-'}</td>
                          <td className="px-4 py-3 text-center font-bold text-gray-800">{p.goals + p.assists}</td>
                          <td className="px-4 py-3 text-center font-black text-indigo-700 bg-indigo-50/50">
                            {p.mvpScore.toFixed(1)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No hay registros de anotaciones en este evento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Match Results */}
          {activeTab === 'MATCHES' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-sm">Partidos y Cruces del Evento</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.matchesList && stats.matchesList.length > 0 ? (
                  stats.matchesList.map((m, idx) => (
                    <div key={m.id || idx} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-indigo-200 transition-all space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700">{m.title}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                          {m.category}
                        </span>
                      </div>

                      {/* Scoreboard */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex-1 text-center font-black text-gray-900 text-sm truncate px-1">
                          <span 
                            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle"
                            style={{ backgroundColor: m.homeTeamColor || '#1E40AF' }}
                          />
                          {m.homeTeamName || 'Local'}
                        </div>
                        <div className="px-4 py-1 bg-slate-900 text-white rounded-lg font-black text-lg tracking-wider">
                          {m.scoreHome} : {m.scoreAway}
                        </div>
                        <div className="flex-1 text-center font-black text-gray-900 text-sm truncate px-1">
                          <span 
                            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle"
                            style={{ backgroundColor: m.awayTeamColor || '#E11D48' }}
                          />
                          {m.awayTeamName || m.opponent || 'Visitante'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>
                          {m.startsAt && `⏰ ${new Date(m.startsAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                          {m.location && ` • 📍 ${m.location}`}
                        </span>
                        {m.scoreHome > m.scoreAway ? (
                          <span className="font-bold text-green-600">Victoria {m.homeTeamName || 'Local'}</span>
                        ) : m.scoreHome < m.scoreAway ? (
                          <span className="font-bold text-indigo-600">Victoria {m.awayTeamName || m.opponent}</span>
                        ) : (
                          <span className="font-bold text-gray-600">{m.status === 'COMPLETED' ? 'Empate' : m.status}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
                    No hay partidos registrados en este evento.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Spirit of the Game */}
          {activeTab === 'SPIRIT' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl shadow">
                <div>
                  <div className="text-xs uppercase font-bold text-teal-100">Promedio General SOTG</div>
                  <div className="text-3xl font-black">{stats.spiritStats.overallAverage} / {stats.spiritStats.maxScore}</div>
                  <p className="text-xs text-teal-100 mt-1">Calificación ponderada en las 5 dimensiones de la WFDF</p>
                </div>
                <div className="text-4xl">🤝</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
                  <div className="text-xs font-bold text-gray-600">Reglas</div>
                  <div className="text-xl font-black text-teal-600">{stats.spiritStats.breakdown.rulesKnowledge} / 4.0</div>
                  <div className="text-[10px] text-gray-500">Conocimiento y uso</div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
                  <div className="text-xs font-bold text-gray-600">Faltas & Contacto</div>
                  <div className="text-xl font-black text-teal-600">{stats.spiritStats.breakdown.foulsAndContact} / 4.0</div>
                  <div className="text-[10px] text-gray-500">Cuidado físico</div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
                  <div className="text-xs font-bold text-gray-600">Imparcialidad</div>
                  <div className="text-xl font-black text-teal-600">{stats.spiritStats.breakdown.fairMindedness} / 4.0</div>
                  <div className="text-[10px] text-gray-500">Objetividad en cobros</div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
                  <div className="text-xs font-bold text-gray-600">Actitud Positiva</div>
                  <div className="text-xl font-black text-teal-600">{stats.spiritStats.breakdown.positiveAttitude} / 4.0</div>
                  <div className="text-[10px] text-gray-500">Autocontrol y respeto</div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-1">
                  <div className="text-xs font-bold text-gray-600">Comunicación</div>
                  <div className="text-xl font-black text-teal-600">{stats.spiritStats.breakdown.communication} / 4.0</div>
                  <div className="text-[10px] text-gray-500">Claridad y diálogo</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Mesa Técnica & Audit */}
          {activeTab === 'MESA_AUDIT' && (
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Cuerpo Responsable de Mesa Técnica</h4>
                <p className="text-xs text-gray-500">
                  Responsables designados específicamente para la gestión operativa, cronometraje y planilla de este evento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {stats.mesaTecnica.members && stats.mesaTecnica.members.length > 0 ? (
                  stats.mesaTecnica.members.map((m, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                        {m.playerNumber ? `#${m.playerNumber}` : '📋'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{m.playerName}</div>
                        <div className="text-xs font-semibold text-indigo-600">{m.roleLabel}</div>
                        {m.isPlayer && (
                          <div className="text-[10px] text-gray-500 mt-0.5">👤 Jugador del Club</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                    No se han asignado miembros específicos de mesa técnica aún.
                  </div>
                )}
              </div>

              {/* Anotadores Audit */}
              <div className="pt-4 border-t border-gray-200">
                <h5 className="font-bold text-gray-800 text-xs uppercase mb-3">Auditoría de Planillaje y Registro en Vivo</h5>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full text-xs text-left text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-black text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Responsable en Planilla</th>
                        <th className="px-4 py-2.5">Correo</th>
                        <th className="px-4 py-2.5 text-center">Anotaciones Certificadas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {stats.mesaTecnica.annotatorsAudit && stats.mesaTecnica.annotatorsAudit.length > 0 ? (
                        stats.mesaTecnica.annotatorsAudit.map(a => (
                          <tr key={a.id}>
                            <td className="px-4 py-3 font-bold text-gray-900">{a.name}</td>
                            <td className="px-4 py-3 text-gray-500">{a.email}</td>
                            <td className="px-4 py-3 text-center font-bold text-indigo-600">{a.annotationsCount}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                            Sin registro de auditoría aún.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Official Report Modal */}
      {showPrintModal && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span>📄</span>
                <span className="font-black text-sm">Acta Oficial Certificada del Evento</span>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-gray-800 text-xs">
              <div className="border-b pb-4 text-center space-y-1">
                <h2 className="text-xl font-black tracking-tight text-gray-900">SISTEMA INTEGRAL DE GESTIÓN DEPORTIVA (SIGEDIVO)</h2>
                <p className="font-semibold text-gray-600">ACTA OFICIAL DE EVENTO ESPECIAL Y ESTADÍSTICAS</p>
                <div className="text-[11px] text-gray-500">Certificación y Aval de Mesa Técnica</div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <span className="font-bold text-gray-500 block">Evento:</span>
                  <span className="font-black text-gray-900 text-sm">{stats.event.title}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">Categoría:</span>
                  <span className="font-bold text-gray-800">{stats.event.type}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">Partidos Jugados:</span>
                  <span className="font-bold text-gray-800">{stats.matchesPlayed}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">Goles Totales:</span>
                  <span className="font-bold text-gray-800">{stats.goals}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2 uppercase text-[11px]">Top 5 Goleadores y Asistentes</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full text-left">
                    <thead className="bg-gray-100 text-gray-700 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2">Jugador</th>
                        <th className="p-2 text-center">Goles</th>
                        <th className="p-2 text-center">Asist.</th>
                        <th className="p-2 text-center">D's</th>
                        <th className="p-2 text-center">MVP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.playerStats.slice(0, 5).map(p => (
                        <tr key={p.playerId}>
                          <td className="p-2 font-bold">{p.playerName}</td>
                          <td className="p-2 text-center">{p.goals}</td>
                          <td className="p-2 text-center">{p.assists}</td>
                          <td className="p-2 text-center">{p.defenses}</td>
                          <td className="p-2 text-center font-black text-indigo-700">{p.mvpScore.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-8 border-t space-y-4">
                <div className="text-center font-semibold text-gray-600">Firmas de Mesa Técnica Responsable:</div>
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div className="border-t border-gray-400 text-center pt-2">
                    <div className="font-bold text-gray-900">{stats.event.officialAnnotator?.name || 'Director de Mesa'}</div>
                    <div className="text-[10px] text-gray-500">Planillero / Director Oficial</div>
                  </div>
                  <div className="border-t border-gray-400 text-center pt-2">
                    <div className="font-bold text-gray-900">Capitán / Veedor SOTG</div>
                    <div className="text-[10px] text-gray-500">Aval de Espíritu y Fair Play</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
              >
                Imprimir Documento
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
