import React, { useEffect, useState } from 'react'
import { http } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'

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
  const isGuest = !isAdmin && !isPlayer

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {isAdmin ? 'Estadísticas del Equipo (Admin)' : 
             isPlayer ? 'Mis Estadísticas' : 
             'Estadísticas del Equipo'}
          </h2>
          {isGuest && (
            <p className="text-sm text-gray-600 mt-1">
              Vista pública del sistema - Únete como jugador para ver tus estadísticas personales
            </p>
          )}
        </div>
        <button 
          onClick={() => loadStats()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          🔄 Actualizar
        </button>
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
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
                <div className="text-blue-100 text-sm">Jugadores Totales</div>
                <div className="text-3xl font-bold">{stats.players}</div>
                <div className="text-blue-100 text-xs mt-1">Miembros del equipo</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                <div className="text-green-100 text-sm">Eventos Totales</div>
                <div className="text-3xl font-bold">{stats.events}</div>
                <div className="text-green-100 text-xs mt-1">Entrenamientos y torneos</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
                <div className="text-purple-100 text-sm">Mensajes</div>
                <div className="text-3xl font-bold">{stats.messages}</div>
                <div className="text-purple-100 text-xs mt-1">Comunicaciones</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6">
                <div className="text-orange-100 text-sm">Próximos Eventos</div>
                <div className="text-3xl font-bold">{stats.upcomingEvents.length}</div>
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

          {(isGuest || isPlayer) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
                <div className="text-blue-100 text-sm">Jugadores Activos</div>
                <div className="text-3xl font-bold">{stats.players}</div>
                <div className="text-blue-100 text-xs mt-1">Miembros del equipo</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                <div className="text-green-100 text-sm">Eventos Totales</div>
                <div className="text-3xl font-bold">{stats.events}</div>
                <div className="text-green-100 text-xs mt-1">Entrenamientos y torneos</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6">
                <div className="text-orange-100 text-sm">Próximos Eventos</div>
                <div className="text-3xl font-bold">{stats.upcomingEvents.length}</div>
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
            {(isAdmin || isPlayer) && stats.attendance.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-lg">
                    {isAdmin ? 'Asistencias Globales' : 'Mis Asistencias'}
                  </h3>
                </div>
                <div className="space-y-3">
                  {stats.attendance.map(a => (
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
                {stats.eventsByType.map(e => (
                  <div key={e.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 capitalize font-medium">{e.type.toLowerCase()}</span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">{e.count}</span>
                  </div>
                ))}
                {stats.eventsByType.length === 0 && (
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
              {stats.upcomingEvents.length > 0 ? (
                <div className="divide-y">
                  {stats.upcomingEvents.map(ev => (
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
        </>
      )}
    </div>
  )
}
