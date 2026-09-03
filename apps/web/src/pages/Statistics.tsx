import React, { useEffect, useState } from 'react'
import { http } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import TournamentStatsView from '../components/TournamentStatsView'
import PlayerRadarChart from '../components/PlayerRadarChart'
import {
  CANONICAL_TEAM_RADAR,
  CANONICAL_HANDLER_PROFILE,
  CANONICAL_CUTTER_PROFILE,
  CANONICAL_TACTICAL_KPIS,
  calculatePlayerRadar,
} from '../lib/performanceStats'

type Stats = {
  players: number
  events: number
  messages: number
  attendance: { status: string; count: number }[]
  eventsByType: { type: string; count: number }[]
  upcomingEvents: { id: number; title: string; startsAt: string; type: string }[]
  viewType?: 'admin' | 'player' | 'guest'
  activePlayers?: number
  completedEvents?: number
  personalStats?: {
    eventsAttended: number
    eventsParticipated: number
    completedEvents: number
    attendanceRate: number
  }
}

export default function Statistics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [radarBenchmark, setRadarBenchmark] = useState<'TEAM' | 'HANDLER' | 'CUTTER'>('TEAM')
  const toasts = useToast()
  const { user, hasRole } = useAuth()

  const { execute: loadStats, loading, error } = useApi(
    () => http.get<Stats>('/api/stats').then(({ data }) => data),
    {
      onSuccess: (data) => setStats(data),
      showErrorToast: true
    }
  )

  useEffect(() => {
    loadStats()
  }, [])

  const isAdmin = hasRole('admin')
  const isPlayer = hasRole('player') || !!user?.playerId
  const isGuest = !isAdmin && !isPlayer && !hasRole('captain') && !hasRole('coach') && !hasRole('treasurer')
  const isCaptain = hasRole('captain')
  const isCoach = hasRole('coach')
  const isTreasurer = hasRole('treasurer')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {isAdmin ? 'Estadísticas del Equipo (Admin)' : 
             isCaptain ? 'Estadísticas del Equipo (Capitán)' :
             isCoach ? 'Estadísticas del Equipo (Entrenador)' :
             isTreasurer ? 'Estadísticas del Equipo (Tesorero)' :
             isPlayer ? 'Mis Estadísticas' : 
             'Estadísticas del Equipo'}
          </h2>
          {isGuest && (
            <p className="text-sm text-gray-600 mt-1">
              Vista pública del sistema - Únete como jugador para ver tus estadísticas personales
            </p>
          )}
          {(isCaptain || isCoach) && (
            <p className="text-sm text-gray-600 mt-1">
              Estadísticas generales del equipo y tus actividades
            </p>
          )}
          {isTreasurer && (
            <p className="text-sm text-gray-600 mt-1">
              Estadísticas generales del equipo y gestión financiera
            </p>
          )}
        </div>
      </div>

      {loading && <div className="bg-white rounded-lg shadow p-4">Cargando estadísticas…</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-start justify-between">
          <div className="pr-3">{error}</div>
          <button className="px-2 py-1 bg-red-100 rounded" onClick={() => loadStats()}>Reintentar</button>
        </div>
      )}

      {stats && (
        <>
          {/* Top KPIs - Different for each role */}
          {isAdmin && !isPlayer && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
                <div className="text-blue-100 text-sm">Jugadores Totales</div>
                <div className="text-3xl font-bold">{stats.players || stats.activePlayers || 0}</div>
                <div className="text-blue-100 text-xs mt-1">Miembros del equipo</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                <div className="text-green-100 text-sm">Eventos Totales</div>
                <div className="text-3xl font-bold">{stats.events || 0}</div>
                <div className="text-green-100 text-xs mt-1">Entrenamientos y torneos</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
                <div className="text-purple-100 text-sm">Mensajes</div>
                <div className="text-3xl font-bold">{stats.messages || 0}</div>
                <div className="text-purple-100 text-xs mt-1">Comunicaciones</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6">
                <div className="text-orange-100 text-sm">Próximos Eventos</div>
                <div className="text-3xl font-bold">{stats.upcomingEvents?.length || 0}</div>
                <div className="text-orange-100 text-xs mt-1">Programados</div>
              </div>
            </div>
          )}

          {/* Admin who is also a player: Show both admin and player stats */}
          {isAdmin && isPlayer && (
            <>
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Estadísticas del Sistema (Admin)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
                    <div className="text-blue-100 text-sm">Jugadores Totales</div>
                    <div className="text-3xl font-bold">{stats.players || stats.activePlayers || 0}</div>
                    <div className="text-blue-100 text-xs mt-1">Miembros del equipo</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                    <div className="text-green-100 text-sm">Eventos Totales</div>
                    <div className="text-3xl font-bold">{stats.events || 0}</div>
                    <div className="text-green-100 text-xs mt-1">Entrenamientos y torneos</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
                    <div className="text-purple-100 text-sm">Mensajes</div>
                    <div className="text-3xl font-bold">{stats.messages || 0}</div>
                    <div className="text-purple-100 text-xs mt-1">Comunicaciones</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6">
                    <div className="text-orange-100 text-sm">Próximos Eventos</div>
                    <div className="text-3xl font-bold">{stats.upcomingEvents?.length || 0}</div>
                    <div className="text-orange-100 text-xs mt-1">Programados</div>
                  </div>
                </div>
              </div>
              {stats.personalStats && (
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">👤 Mis Estadísticas como Jugador</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
                      <div className="text-blue-100 text-sm">Eventos Asistidos</div>
                      <div className="text-3xl font-bold">{stats.personalStats.eventsAttended}</div>
                      <div className="text-blue-100 text-xs mt-1">Asistencias confirmadas</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                      <div className="text-green-100 text-sm">Tasa de Asistencia</div>
                      <div className="text-3xl font-bold">{stats.personalStats.attendanceRate}%</div>
                      <div className="text-green-100 text-xs mt-1">De eventos completados</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
                      <div className="text-purple-100 text-sm">Eventos Participados</div>
                      <div className="text-3xl font-bold">{stats.personalStats.eventsParticipated}</div>
                      <div className="text-purple-100 text-xs mt-1">Total de participaciones</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Captain/Coach/Treasurer KPIs */}
          {(isCaptain || isCoach || isTreasurer) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
                <div className="text-blue-100 text-sm">Jugadores Activos</div>
                <div className="text-3xl font-bold">{stats.players || stats.activePlayers || 0}</div>
                <div className="text-blue-100 text-xs mt-1">Miembros del equipo</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                <div className="text-green-100 text-sm">Eventos Totales</div>
                <div className="text-3xl font-bold">{stats.events || 0}</div>
                <div className="text-green-100 text-xs mt-1">Entrenamientos y torneos</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6">
                <div className="text-orange-100 text-sm">Próximos Eventos</div>
                <div className="text-3xl font-bold">{stats.upcomingEvents?.length || 0}</div>
                <div className="text-orange-100 text-xs mt-1">Programados</div>
              </div>
            </div>
          )}

          {isPlayer && stats.personalStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
                <div className="text-blue-100 text-sm">Eventos Asistidos</div>
                <div className="text-3xl font-bold">{stats.personalStats.eventsAttended}</div>
                <div className="text-blue-100 text-xs mt-1">Asistencias confirmadas</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                <div className="text-green-100 text-sm">Tasa de Asistencia</div>
                <div className="text-3xl font-bold">{stats.personalStats.attendanceRate}%</div>
                <div className="text-green-100 text-xs mt-1">De eventos completados</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
                <div className="text-purple-100 text-sm">Eventos Participados</div>
                <div className="text-3xl font-bold">{stats.personalStats.eventsParticipated}</div>
                <div className="text-purple-100 text-xs mt-1">Total de participaciones</div>
              </div>
            </div>
          )}

          {isGuest && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
                <div className="text-blue-100 text-sm">Jugadores Activos</div>
                <div className="text-3xl font-bold">{stats.players || stats.activePlayers || 0}</div>
                <div className="text-blue-100 text-xs mt-1">Miembros del equipo</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                <div className="text-green-100 text-sm">Eventos Totales</div>
                <div className="text-3xl font-bold">{stats.events || 0}</div>
                <div className="text-green-100 text-xs mt-1">Entrenamientos y torneos</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6">
                <div className="text-orange-100 text-sm">Próximos Eventos</div>
                <div className="text-3xl font-bold">{stats.upcomingEvents?.length || 0}</div>
                <div className="text-orange-100 text-xs mt-1">Programados</div>
              </div>
            </div>
          )}

          {/* Player Personal Stats Details */}
          {isPlayer && stats.personalStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Actividad Personal</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{stats.personalStats.eventsAttended}</div>
                  <div className="text-sm text-gray-600">Eventos Asistidos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{stats.personalStats.eventsParticipated}</div>
                  <div className="text-sm text-gray-600">Eventos Participados</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{stats.personalStats.completedEvents}</div>
                  <div className="text-sm text-gray-600">Eventos Completados</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-700">{stats.personalStats.attendanceRate}%</div>
                  <div className="text-sm text-gray-600">Tasa de Asistencia</div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance and events by type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {((isAdmin && !isPlayer) || (isPlayer && !isAdmin)) && stats.attendance && stats.attendance.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-lg">
                    {isAdmin && !isPlayer ? 'Asistencias Globales' : 'Mis Asistencias'}
                  </h3>
                </div>
                <div className="space-y-3">
                  {stats.attendance.map((a: any) => (
                    <div key={a.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 capitalize font-medium">
                        {a.status === 'present' ? 'Presente' : 
                         a.status === 'late' ? 'Tarde' : 
                         a.status === 'absent' ? 'Ausente' : a.status}
                      </span>
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">{a.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="font-semibold text-lg">Eventos por Tipo</h3>
              </div>
              <div className="space-y-3">
                {stats.eventsByType && stats.eventsByType.length > 0 ? (
                  stats.eventsByType.map((e: any) => (
                    <div key={e.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 capitalize font-medium">{e.type.toLowerCase()}</span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">{e.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">📅</div>
                    <div>Sin eventos registrados</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming events */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <h3 className="font-semibold text-lg">Próximos Eventos</h3>
              </div>
            </div>
            <div className="overflow-auto">
              {stats.upcomingEvents && stats.upcomingEvents.length > 0 ? (
                <div className="divide-y">
                  {stats.upcomingEvents.map((ev: any) => (
                    <div key={ev.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{ev.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(ev.startsAt).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ev.type === 'TRAINING' ? 'bg-blue-100 text-blue-800' :
                            ev.type === 'TOURNAMENT' ? 'bg-green-100 text-green-800' :
                            ev.type === 'SOCIAL' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ev.type.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-2">📅</div>
                  <div className="text-lg font-medium">Sin próximos eventos</div>
                  <div className="text-sm">Los eventos programados aparecerán aquí</div>
                </div>
              )}
            </div>
          </div>
          
          {/* 🏆 Radar de Rendimiento y Habilidades Atléticas (Infografía Oficial) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥏</span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Radar Pentagonal de Habilidades & Análisis Táctico
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Evaluación multidimensional de Ultimate Frisbee: Catching, Throwing, Defense, Spirit y Stamina.
                </p>
              </div>

              {/* Selector de Comparación */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
                <button
                  onClick={() => setRadarBenchmark('TEAM')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    radarBenchmark === 'TEAM'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🛡️ vs Equipo SJUC
                </button>
                <button
                  onClick={() => setRadarBenchmark('HANDLER')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    radarBenchmark === 'HANDLER'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🎯 vs Elite Handler
                </button>
                <button
                  onClick={() => setRadarBenchmark('CUTTER')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    radarBenchmark === 'CUTTER'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ vs Elite Cutter
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Radar Chart SVG */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-indigo-50/20 rounded-2xl border border-slate-200/80">
                <PlayerRadarChart
                  data={
                    isPlayer && stats?.personalStats
                      ? calculatePlayerRadar({
                          goals: 8,
                          assists: 11,
                          defenses: 6,
                          turnovers: 2,
                          attendanceRate: stats.personalStats.attendanceRate,
                        })
                      : CANONICAL_TEAM_RADAR
                  }
                  benchmarkData={
                    radarBenchmark === 'TEAM'
                      ? (isPlayer ? CANONICAL_TEAM_RADAR : undefined)
                      : radarBenchmark === 'HANDLER'
                      ? CANONICAL_HANDLER_PROFILE.radarProfile
                      : CANONICAL_CUTTER_PROFILE.radarProfile
                  }
                  dataLabel={isPlayer ? (user?.name?.split(' ')[0] || 'Mi Perfil') : 'Equipo SJUC'}
                  benchmarkLabel={
                    radarBenchmark === 'TEAM' ? 'Media Equipo' :
                    radarBenchmark === 'HANDLER' ? 'Patrón Handler' : 'Patrón Cutter'
                  }
                  size={320}
                />
              </div>

              {/* Métricas Tácticas de Apoyo */}
              <div className="lg:col-span-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100">
                    <span className="text-[11px] font-black uppercase text-indigo-800 tracking-wider block">
                      🚀 Huck Accuracy
                    </span>
                    <span className="text-2xl font-black text-indigo-900 mt-1 block">
                      {CANONICAL_TACTICAL_KPIS.huckAccuracyPct}%
                    </span>
                    <span className="text-[11px] text-indigo-600 font-medium mt-0.5 block">
                      Pases largos &gt;30 yd completados
                    </span>
                  </div>

                  <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100">
                    <span className="text-[11px] font-black uppercase text-blue-800 tracking-wider block">
                      ⏱️ Resistencia al Stall
                    </span>
                    <span className="text-2xl font-black text-blue-900 mt-1 block">
                      {CANONICAL_TACTICAL_KPIS.stallOutResistancePct}%
                    </span>
                    <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">
                      Liberaciones antes del conteo 7
                    </span>
                  </div>

                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
                    <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider block">
                      🕊️ Espíritu de Juego (SOTG)
                    </span>
                    <span className="text-2xl font-black text-emerald-900 mt-1 block">
                      {CANONICAL_TACTICAL_KPIS.averageSpiritScore} / 20
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
                      Promedio oficial según rúbrica WFDF
                    </span>
                  </div>

                  <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100">
                    <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider block">
                      🎯 Red Zone Conversion
                    </span>
                    <span className="text-2xl font-black text-amber-900 mt-1 block">
                      {CANONICAL_TACTICAL_KPIS.redZoneConversionPct}%
                    </span>
                    <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
                      Puntos anotados dentro de las 20y
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-200">
                  💡 <span className="font-bold">Consejo de Entrenamiento:</span> Para optimizar el polígono hacia la marca de 90+, priorizar drills de <em>Dump-Swing</em> al corte rápido y transición ofensiva al lado cerrado (Break-side).
                </div>
              </div>
            </div>
          </div>
          
          <TournamentStatsView />
        </>
      )}
    </div>
  )
}
