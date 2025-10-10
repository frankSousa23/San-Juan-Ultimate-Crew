import React, { useEffect, useState } from 'react'
import { http } from '../lib/api'

type Stats = {
  players: number
  events: number
  messages: number
  attendance: { status: string; count: number }[]
  eventsByType: { type: string; count: number }[]
  upcomingEvents: { id: number; title: string; startsAt: string; type: string }[]
}

export default function Statistics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    http.get<Stats>('/api/stats').then(({ data }) => { setStats(data); setLoading(false) }).catch(e => {
      setError(e?.response?.data?.error || 'Error al cargar stats')
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Estadísticas</h2>

      {loading && <div className="bg-white rounded-lg shadow p-4">Cargando…</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">{error}</div>}

      {stats && (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-sm">Jugadores</div>
              <div className="text-2xl font-semibold text-indigo-700">{stats.players}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-sm">Eventos</div>
              <div className="text-2xl font-semibold text-indigo-700">{stats.events}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-sm">Mensajes</div>
              <div className="text-2xl font-semibold text-indigo-700">{stats.messages}</div>
            </div>
          </div>

          {/* Attendance and events by type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2">Asistencias</div>
              <ul className="space-y-1 text-sm">
                {stats.attendance.map(a => (
                  <li key={a.status} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{a.status}</span>
                    <span className="font-medium">{a.count}</span>
                  </li>
                ))}
                {stats.attendance.length === 0 && <li className="text-gray-500">Sin datos.</li>}
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="font-semibold mb-2">Eventos por tipo</div>
              <ul className="space-y-1 text-sm">
                {stats.eventsByType.map(e => (
                  <li key={e.type} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{e.type.toLowerCase()}</span>
                    <span className="font-medium">{e.count}</span>
                  </li>
                ))}
                {stats.eventsByType.length === 0 && <li className="text-gray-500">Sin datos.</li>}
              </ul>
            </div>
          </div>

          {/* Upcoming events */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 font-semibold">Próximos eventos</div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">Fecha</th>
                    <th className="text-left px-4 py-2">Título</th>
                    <th className="text-left px-4 py-2">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.upcomingEvents.map(ev => (
                    <tr key={ev.id} className="border-t">
                      <td className="px-4 py-2">{new Date(ev.startsAt).toLocaleString()}</td>
                      <td className="px-4 py-2">{ev.title}</td>
                      <td className="px-4 py-2">{ev.type}</td>
                    </tr>
                  ))}
                  {stats.upcomingEvents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-500">Sin próximos eventos.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
