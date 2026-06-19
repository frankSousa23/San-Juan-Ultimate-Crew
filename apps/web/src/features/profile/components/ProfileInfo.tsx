import React from 'react'

interface ProfileInfoProps {
  user: any
  playerInfo: any
  hasRole: (role: string) => boolean
  loadingStats: boolean
  playerStats: any
  setActiveTab: (tab: any) => void
}

export function ProfileInfo({
  user,
  playerInfo,
  hasRole,
  loadingStats,
  playerStats,
  setActiveTab
}: ProfileInfoProps) {
  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Nombre</label>
              <div className="text-base font-medium text-gray-900">{user.name || 'No especificado'}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <div className="text-base font-medium text-gray-900">{user.email}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Roles</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role: string) => (
                    <span key={role} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium capitalize">
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">Sin roles asignados</span>
                )}
              </div>
            </div>
            {user.playerId && playerInfo && (
              <div>
                <label className="text-sm text-gray-500">Jugador Vinculado</label>
                <div className="text-base font-medium text-gray-900">
                  #{playerInfo.number} - {playerInfo.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {playerInfo.position === 'HANDLER' ? 'Manejador' : playerInfo.position === 'CUTTER' ? 'Cortador' : 'Híbrido'} • {playerInfo.status === 'ACTIVE' ? 'Activo' : playerInfo.status === 'INACTIVE' ? 'Inactivo' : 'Lesionado'}
                </div>
                {!user.roles?.includes('player') && (
                  <div className="text-xs text-amber-600 mt-1">
                    ℹ️ Tienes un jugador vinculado pero el rol de jugador está inactivo. 
                    Actívalo en la pestaña "Seguridad" para ver estadísticas.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {(hasRole('player') && user.roles?.includes('player')) || (user.playerId && user.roles?.includes('player')) ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Actividad</h3>
            {loadingStats ? (
              <div className="text-gray-500">Cargando estadísticas...</div>
            ) : playerStats ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Eventos Totales</div>
                  <div className="text-2xl font-bold text-blue-700">{playerStats.totalEvents}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Completados</div>
                  <div className="text-2xl font-bold text-green-700">{playerStats.completedEvents}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Asistencias</div>
                  <div className="text-2xl font-bold text-purple-700">{playerStats.eventsAttended}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600">Tasa</div>
                  <div className="text-2xl font-bold text-amber-700">{playerStats.attendanceRate}%</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No hay estadísticas disponibles</div>
            )}
          </div>
        ) : null}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => setActiveTab('edit')}
            className="p-3 border rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <div className="font-medium text-gray-800">✏️ Editar Perfil</div>
            <div className="text-sm text-gray-500">Actualiza tu información personal</div>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className="p-3 border rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <div className="font-medium text-gray-800">🔒 Cambiar Contraseña</div>
            <div className="text-sm text-gray-500">Actualiza tu contraseña de acceso</div>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className="p-3 border rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <div className="font-medium text-gray-800">📋 Ver Actividad</div>
            <div className="text-sm text-gray-500">Revisa tu historial de acciones</div>
          </button>
          {user.roles?.includes('player') && (
            <button
              onClick={() => setActiveTab('stats')}
              className="p-3 border rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-medium text-gray-800">📊 Ver Estadísticas</div>
              <div className="text-sm text-gray-500">Consulta tus métricas de jugador</div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
