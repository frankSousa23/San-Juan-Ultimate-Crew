import React from 'react'

export function ProfileStats({ loadingStats, playerStats }: { loadingStats: boolean, playerStats: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Estadísticas de Jugador</h3>
      {loadingStats ? (
        <div className="text-gray-500">Cargando estadísticas...</div>
      ) : playerStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Eventos Totales</div>
            <div className="text-3xl font-bold text-blue-700 mt-2">{playerStats.totalEvents}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Eventos Completados</div>
            <div className="text-3xl font-bold text-green-700 mt-2">{playerStats.completedEvents}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Asistencias</div>
            <div className="text-3xl font-bold text-purple-700 mt-2">{playerStats.eventsAttended}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Tasa de Asistencia</div>
            <div className="text-3xl font-bold text-amber-700 mt-2">{playerStats.attendanceRate}%</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 col-span-full">
            <div className="text-sm text-gray-600">Participaciones en Eventos</div>
            <div className="text-2xl font-bold text-indigo-700 mt-2">{playerStats.eventsParticipated} eventos</div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">No hay estadísticas disponibles</div>
      )}
    </div>
  )
}
