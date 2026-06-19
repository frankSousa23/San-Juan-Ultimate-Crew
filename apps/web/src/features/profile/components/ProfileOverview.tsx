import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useProfile } from '../features/profile/hooks/useProfile'

export default function Profile() {
  const { state, actions } = useProfile()
  const {
    authDisabled, user, myRequests, requestNote, requestPlayerId, showPlayerDataForm,
    playerData, error, loading, activeTab, editName, currentPassword, newPassword,
    confirmPassword, changingPassword, activityLogs, loadingActivity, playerStats,
    loadingStats, userEvents, loadingEvents, playerInfo, togglingPlayerRole, authLoading, isAuthenticated
  } = state
  const {
    setAuthDisabled, setUser, setMyRequests, setRequestNote, setRequestPlayerId, setShowPlayerDataForm,
    setPlayerData, setError, setLoading, setActiveTab, setEditName, setCurrentPassword, setNewPassword,
    setConfirmPassword, setChangingPassword, setActivityLogs, setLoadingActivity, setPlayerStats,
    setLoadingStats, setUserEvents, setLoadingEvents, setPlayerInfo, setTogglingPlayerRole,
    handleUpdateProfile, handleChangePassword, handleRoleRequest, handleTogglePlayerRole
  } = actions
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando perfil...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mi Perfil</h2>
        {user && (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              user.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
              user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {user.status === 'APPROVED' ? 'Aprobado' : user.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
            </span>
          </div>
        )}
      </div>

      {!isAuthenticated && !user && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          <p className="mb-2">Inicia sesión para ver tu perfil.</p>
          <NavLink to="/login?next=/perfil" className="text-indigo-700 underline font-medium">Ir a Login</NavLink>
        </div>
      )}

      {authDisabled && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4">
          Autenticación desactivada. El backend no valida el usuario; acciones protegidas en UI se habilitan por token.
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-4">{error}</div>
      )}

      {user && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-1 px-2 sm:px-4 overflow-x-auto">
              {[
                { id: 'overview', label: 'Resumen', icon: '👤' },
                { id: 'edit', label: 'Editar Perfil', icon: '✏️' },
                { id: 'password', label: 'Contraseña', icon: '🔒' },
                { id: 'security', label: 'Seguridad', icon: '🛡️' },
                { id: 'activity', label: 'Actividad', icon: '📋' },
                { id: 'requests', label: 'Solicitudes', icon: '📝' },
                ...(user.roles?.includes('player') ? [{ id: 'stats', label: 'Estadísticas', icon: '📊' }] : []),
                ...(user.roles?.includes('player') ? [{ id: 'events', label: 'Mis Eventos', icon: '📅' }] : []),
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1 sm:mr-2">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
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
                            user.roles.map(role => (
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

                {/* Quick Actions */}
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
            )}

            {/* Edit Profile Tab */}
            {activeTab === 'edit' && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-semibold text-gray-800">Editar Información Personal</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tu nombre"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">{editName.length}/100 caracteres</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={editName.trim() === (user.name || '')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => {
                      setEditName(user.name || '')
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-semibold text-gray-800">Cambiar Contraseña</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa tu contraseña actual"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres, máximo 128"
                    minLength={6}
                    maxLength={128}
                  />
                  <p className="text-xs text-gray-500 mt-1">{newPassword.length}/128 caracteres</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : 'focus:ring-blue-500'
                    }`}
                    placeholder="Confirma tu nueva contraseña"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cambiar Contraseña
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Historial de Actividad</h3>
                {loadingActivity ? (
                  <div className="text-gray-500">Cargando actividad...</div>
                ) : activityLogs.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {activityLogs.map((log: any) => (
                      <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{log.action}</div>
                            <div className="text-sm text-gray-600">{log.entityType} #{log.entityId}</div>
                            {log.details && (
                              <div className="text-xs text-gray-500 mt-1">
                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString('es-ES')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No hay actividad registrada</div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && user.roles?.includes('player') && (
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
            )}

            {/* Events Tab */}
            {activeTab === 'events' && user.roles?.includes('player') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Mis Eventos</h3>
                  <Link
                    to="/eventos"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver todos los eventos →
                  </Link>
                </div>
                {loadingEvents ? (
                  <div className="text-gray-500">Cargando eventos...</div>
                ) : userEvents.length > 0 ? (
                  <div className="space-y-3">
                    {userEvents.map((event: any) => (
                      <Link
                        key={event.id}
                        to={`/eventos?eventId=${event.id}`}
                        className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{event.title}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {new Date(event.startsAt).toLocaleString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {event.location && (
                              <div className="text-xs text-gray-500 mt-1">📍 {event.location}</div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                event.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                event.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                                event.status === 'ONGOING' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {event.status === 'COMPLETED' ? 'Completado' :
                                 event.status === 'UPCOMING' ? 'Próximo' :
                                 event.status === 'ONGOING' ? 'En Curso' : 'Cancelado'}
                              </span>
                              <span className="text-xs text-gray-500">{event.type}</span>
                              {event.attendance && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  event.attendance.status === 'present' ? 'bg-green-100 text-green-700' :
                                  event.attendance.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {event.attendance.status === 'present' ? '✓ Presente' :
                                   event.attendance.status === 'late' ? '⏰ Tarde' : '✗ Ausente'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 mb-2">No has participado en ningún evento aún</div>
                    <Link
                      to="/eventos"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver eventos disponibles →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Mis Solicitudes de Rol</h3>
                
                {/* Create new request for guests */}
                {user.roles && user.roles.includes('guest') && !user.roles.includes('player') && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-indigo-900 mb-2">Solicitar Rol de Jugador</h4>
                    <p className="text-sm text-indigo-700 mb-4">
                      Si eres parte del equipo, puedes solicitar acceso como jugador. Puedes vincular un jugador existente o crear uno nuevo.
                    </p>
                    <div className="space-y-3">
                      {!showPlayerDataForm && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ID de Jugador (opcional)</label>
                          <input
                            type="number"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={requestPlayerId}
                            onChange={e => {
                              const val = e.target.value
                              if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                                setRequestPlayerId(val)
                              }
                            }}
                            placeholder="Ingresa tu número de jugador si ya estás en el roster"
                            min="1"
                          />
                          <button
                            type="button"
                            className="mt-2 text-sm text-indigo-600 hover:underline"
                            onClick={() => setShowPlayerDataForm(true)}
                          >
                            O crear un nuevo jugador
                          </button>
                        </div>
                      )}
                      
                      {showPlayerDataForm && (
                        <div className="bg-white border border-indigo-300 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-indigo-900">Datos del Jugador</h5>
                            <button
                              type="button"
                              className="text-sm text-gray-600 hover:text-gray-800"
                              onClick={() => {
                                setShowPlayerDataForm(false)
                                setPlayerData({ number: '', position: 'CUTTER', heightCm: '', experience: '' })
                              }}
                            >
                              Usar ID existente
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                required
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={playerData.number}
                                onChange={e => {
                                  const val = e.target.value
                                  if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                                    setPlayerData(prev => ({ ...prev, number: val }))
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Posición <span className="text-red-500">*</span>
                              </label>
                              <select
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={playerData.position}
                                onChange={e => setPlayerData(prev => ({ ...prev, position: e.target.value as any }))}
                              >
                                <option value="HANDLER">Manejador</option>
                                <option value="CUTTER">Cortador</option>
                                <option value="HYBRID">Híbrido</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Altura (cm) <span className="text-gray-500 text-xs">(opcional)</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={playerData.heightCm}
                                onChange={e => {
                                  const val = e.target.value
                                  if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                                    setPlayerData(prev => ({ ...prev, heightCm: val }))
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Experiencia <span className="text-gray-500 text-xs">(opcional)</span>
                              </label>
                              <input
                                type="text"
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={playerData.experience}
                                onChange={e => setPlayerData(prev => ({ ...prev, experience: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                        <textarea
                          className="w-full border rounded px-3 py-2 text-sm"
                          value={requestNote}
                          onChange={e => setRequestNote(e.target.value)}
                          placeholder="Agrega información adicional sobre tu solicitud"
                          rows={3}
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">{requestNote.length}/500 caracteres</p>
                      </div>
                      <button
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        onClick={async () => {
                          try {
                            const payload: any = {
                              role: 'player',
                              note: requestNote.trim() || undefined,
                            }
                            
                            if (showPlayerDataForm && playerData.number && playerData.position) {
                              payload.playerData = {
                                number: Number(playerData.number),
                                position: playerData.position,
                                status: 'ACTIVE',
                                heightCm: playerData.heightCm ? Number(playerData.heightCm) : undefined,
                                experience: playerData.experience.trim() || undefined,
                              }
                            } else if (requestPlayerId) {
                              payload.playerId = Number(requestPlayerId)
                            }
                            
                            await myRoleRequestsApi.create(payload)
                            setRequestNote('')
                            setRequestPlayerId('')
                            setShowPlayerDataForm(false)
                            setPlayerData({ number: '', position: 'CUTTER', heightCm: '', experience: '' })
                            const mine = await myRoleRequestsApi.listMine()
                            setMyRequests(mine)
                            toasts.success('Solicitud enviada exitosamente')
                          } catch (e: any) {
                            toasts.error(e?.response?.data?.error || 'No se pudo enviar la solicitud')
                          }
                        }}
                        disabled={(!requestNote.trim() && !requestPlayerId && !showPlayerDataForm) || (showPlayerDataForm && (!playerData.number || !playerData.position))}
                      >
                        Enviar Solicitud
                      </button>
                    </div>
                  </div>
                )}

                {/* List of requests */}
                {myRequests.length > 0 ? (
                  <div className="space-y-3">
                    {myRequests.map((r: any) => (
                      <div key={r.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800">Solicitud #{r.id}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              r.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              r.status === 'DENIED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {r.status === 'APPROVED' ? '✓ Aprobada' : 
                               r.status === 'DENIED' ? '✗ Denegada' : 
                               '⏳ Pendiente'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(r.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 space-y-1">
                          <div><span className="font-medium">Rol solicitado:</span> {r.role}</div>
                          {r.playerId && <div><span className="font-medium">ID de Jugador:</span> {r.playerId}</div>}
                          {r.note && (
                            <div>
                              <span className="font-medium">Nota:</span>
                              <div className="text-gray-600 mt-1 bg-gray-50 p-2 rounded">{r.note}</div>
                            </div>
                          )}
                          {r.decidedAt && (
                            <div className="text-xs text-gray-500 mt-2">
                              Decidida el: {new Date(r.decidedAt).toLocaleString('es-ES')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-500">No tienes solicitudes de rol</div>
                    {user.roles && user.roles.includes('guest') && !user.roles.includes('player') && (
                      <div className="text-sm text-gray-400 mt-2">Usa el formulario arriba para crear una</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Seguridad de la Cuenta</h3>
                
                {/* Player Role Management */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-900 mb-2">👤 Gestión de Rol de Jugador</h4>
                  {user.roles?.includes('guest') && !user.roles?.includes('player') && !user.roles?.includes('admin') && !user.roles?.includes('captain') && !user.roles?.includes('coach') && !user.roles?.includes('treasurer') ? (
                    <div>
                      <p className="text-sm text-indigo-700 mb-4">
                        Como usuario guest, no puedes activar el rol de jugador por ti mismo. 
                        Un administrador debe activarlo desde la sección de gestión de usuarios.
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">
                            Rol de Jugador: Inactivo
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Contacta a un administrador para solicitar acceso como jugador.
                          </div>
                        </div>
                        <Link
                          to="/admin/usuarios"
                          className="px-4 py-2 rounded-lg font-medium text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          Ir a Gestión de Usuarios
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-indigo-700 mb-4">
                        Puedes activar o desactivar tu rol de jugador en cualquier momento. 
                        Si tienes un jugador vinculado (playerId), se mantendrá aunque desactives el rol.
                        Al desactivar el rol, no verás estadísticas de jugador ni podrás participar en eventos como jugador.
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">
                            Rol de Jugador: {user.roles?.includes('player') ? 'Activo' : 'Inactivo'}
                          </div>
                          {user.playerId && (
                            <div className="text-sm text-gray-600 mt-1">
                              Jugador vinculado: #{playerInfo?.number || user.playerId} - {playerInfo?.name || 'Cargando...'}
                            </div>
                          )}
                          {!user.playerId && user.roles?.includes('player') && (
                            <div className="text-sm text-amber-600 mt-1 space-y-2">
                              <div>
                                ℹ️ Tienes rol de jugador pero no estás vinculado a un jugador. 
                                {user.roles?.includes('admin') ? (
                                  <span> Puedes crear tu perfil de jugador desde la sección de administración de usuarios.</span>
                                ) : (
                                  <span> Contacta a un administrador para vincular tu perfil de jugador.</span>
                                )}
                              </div>
                              {user.roles?.includes('admin') && (
                                <Link
                                  to="/admin/usuarios"
                                  className="inline-block mt-1 px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors"
                                >
                                  Ir a Gestión de Usuarios
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            const newState = !user.roles?.includes('player')
                            setTogglingPlayerRole(true)
                            try {
                              const updated = await usersApi.togglePlayerRole(newState)
                              setUser(updated)
                              await refreshUser()
                              toasts.success(
                                newState 
                                  ? 'Rol de jugador activado. Ahora puedes ver estadísticas y participar en eventos como jugador.' 
                                  : 'Rol de jugador desactivado. Ya no verás estadísticas de jugador.'
                              )
                            } catch (e: any) {
                              toasts.error(e?.response?.data?.error || 'No se pudo cambiar el estado del rol de jugador')
                            } finally {
                              setTogglingPlayerRole(false)
                            }
                          }}
                          disabled={togglingPlayerRole}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            user.roles?.includes('player')
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {togglingPlayerRole 
                            ? 'Procesando...' 
                            : user.roles?.includes('player') 
                              ? 'Desactivar Rol de Jugador' 
                              : 'Activar Rol de Jugador'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">🔐 Información de Seguridad</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center justify-between">
                      <span>Estado de la cuenta:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {user.status === 'APPROVED' ? 'Aprobada' : 
                         user.status === 'PENDING' ? 'Pendiente' : 'Rechazada'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email verificado:</span>
                      <span className="text-green-700 font-medium">✓ Verificado</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Última actualización:</span>
                      <span className="text-gray-600">{new Date().toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Cambiar Contraseña</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Mantén tu cuenta segura usando una contraseña fuerte y única.
                  </p>
                  <button
                    onClick={() => setActiveTab('password')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Ir a Cambiar Contraseña →
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Recuperación de Contraseña</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Si olvidas tu contraseña, puedes usar el enlace de recuperación por email.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Recuperar Contraseña →
                  </Link>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Recomendaciones de Seguridad</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Usa una contraseña única y segura (mínimo 6 caracteres)</li>
                    <li>No compartas tu contraseña con nadie</li>
                    <li>Cambia tu contraseña regularmente</li>
                    <li>Cierra sesión cuando uses dispositivos compartidos</li>
                    <li>Revisa tu actividad regularmente para detectar accesos no autorizados</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
