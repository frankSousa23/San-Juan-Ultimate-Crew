import React, { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { authApi, getAuthToken, myRoleRequestsApi, usersApi, eventsApi, attendanceApi, eventParticipantsApi, playersApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'

export default function Profile() {
  const { user: authUser, isAuthenticated, isLoading: authLoading, hasRole, refreshUser } = useAuth()
  const toasts = useToast()
  const navigate = useNavigate()
  const [authDisabled, setAuthDisabled] = useState<boolean>(false)
  const [user, setUser] = useState<{ id: number; email: string; name?: string; roles?: string[]; playerId?: number | null; status?: string } | null>(null)
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [requestNote, setRequestNote] = useState('')
  const [requestPlayerId, setRequestPlayerId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'password' | 'activity' | 'stats' | 'events' | 'requests' | 'security'>('overview')
  
  // Edit profile state
  const [editName, setEditName] = useState('')
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Activity logs
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  
  // Player stats (if user is a player)
  const [playerStats, setPlayerStats] = useState<{
    totalEvents: number
    eventsAttended: number
    attendanceRate: number
    eventsParticipated: number
    completedEvents: number
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  
  // User events
  const [userEvents, setUserEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  
  // Player info (if linked)
  const [playerInfo, setPlayerInfo] = useState<any>(null)

  const { execute: updateProfile } = useApi(usersApi.updateProfile, {
    onSuccess: async (data) => {
      setUser(data)
      toasts.success('Perfil actualizado exitosamente')
      // Refresh auth context to get updated user data
      try {
        const updatedUser = await refreshUser()
        if (updatedUser) {
          setUser(updatedUser)
          setEditName(updatedUser.name || '')
        }
      } catch (e) {
        console.error('Error refreshing user data:', e)
      }
    },
    showErrorToast: true
  })

  const { execute: changePassword } = useApi(usersApi.changePassword, {
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setChangingPassword(false)
      toasts.success('Contraseña cambiada exitosamente')
    },
    showErrorToast: true
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      setLoading(true)
      
      // Use user from AuthContext if available
      if (authUser) {
        setUser(authUser)
        setEditName(authUser.name || '')
        setLoading(false)
        
        // Load role requests if user is authenticated
        if (isAuthenticated) {
          try {
            const mine = await myRoleRequestsApi.listMine()
            if (!cancelled) {
              setMyRequests(mine)
            }
          } catch (e: any) {
            // Only log non-auth errors (404, 500, etc.) but don't show toasts
            if (!cancelled && e?.response?.status !== 401 && e?.response?.status !== 404) {
              console.error('Error loading role requests:', e)
            }
            // Silently handle 404 - endpoint might not be available
            if (!cancelled) {
              setMyRequests([])
            }
          }
        }
        return
      }
      
      // Fallback: check token and load user
      const token = getAuthToken()
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      
      try {
        const me = await authApi.me()
        if (cancelled) return
        if (me.authDisabled) {
          setAuthDisabled(true)
        } else if (me.user) {
          setUser(me.user)
          setEditName(me.user.name || '')
        }
        const mine = await myRoleRequestsApi.listMine()
        if (!cancelled) {
          setMyRequests(mine)
        }
      } catch (e: any) {
        if (!cancelled) {
          if (e?.response?.status === 401) {
            setError(null) // 401 is handled by interceptor
          } else if (e?.response?.status === 404) {
            // 404 means endpoint doesn't exist, set empty array
            setMyRequests([])
            setError(null) // Don't show error for missing endpoints
          } else {
            setError('No se pudo cargar el perfil')
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [authUser, isAuthenticated])

  // Load player info if user has playerId
  useEffect(() => {
    if (user?.playerId) {
      playersApi.list().then(players => {
        const player = players.find(p => p.id === user.playerId)
        if (player) {
          setPlayerInfo(player)
        }
      }).catch(() => {})
    } else {
      setPlayerInfo(null)
    }
  }, [user?.playerId])

  // Load role requests
  useEffect(() => {
    if (isAuthenticated) {
      myRoleRequestsApi.listMine().then(requests => {
        setMyRequests(requests)
      }).catch((e: any) => {
        // Silently handle errors (404, 401, etc.)
        setMyRequests([])
        if (e?.response?.status !== 401 && e?.response?.status !== 404) {
          console.error('Error loading role requests:', e)
        }
      })
    }
  }, [isAuthenticated, activeTab])

  // Load activity logs
  useEffect(() => {
    if (activeTab === 'activity' && isAuthenticated) {
      setLoadingActivity(true)
      usersApi.getActivity(50).then(logs => {
        setActivityLogs(logs)
      }).catch((e: any) => {
        // Silently handle errors (404, 401, etc.)
        setActivityLogs([])
        if (e?.response?.status !== 401 && e?.response?.status !== 404) {
          console.error('Error loading activity logs:', e)
        }
      }).finally(() => {
        setLoadingActivity(false)
      })
    }
  }, [activeTab, isAuthenticated])

  // Load player stats
  useEffect(() => {
    if (activeTab === 'stats' && user?.playerId && isAuthenticated) {
      setLoadingStats(true)
      const loadStats = async () => {
        try {
          const allEvents = await eventsApi.list()
          const completedEvents = allEvents.filter(e => e.status === 'COMPLETED')
          
          const allAttendances: any[] = []
          for (const event of completedEvents.slice(0, 15)) {
            try {
              const eventAttendances = await attendanceApi.listByEvent(event.id)
              const playerAttendance = eventAttendances.find(a => a.playerId === user.playerId)
              if (playerAttendance) {
                allAttendances.push(playerAttendance)
              }
            } catch {}
          }
          
          const allParticipants: any[] = []
          for (const event of allEvents.slice(0, 15)) {
            try {
              const eventParticipants = await eventParticipantsApi.listByEvent(event.id)
              const playerParticipant = eventParticipants.find(p => p.playerId === user.playerId)
              if (playerParticipant) {
                allParticipants.push(playerParticipant)
              }
            } catch {}
          }
          
          const eventsAttended = allAttendances.filter(a => a.status === 'present').length
          const totalCompleted = completedEvents.length
          const attendanceRate = totalCompleted > 0 ? Math.round((eventsAttended / totalCompleted) * 100) : 0
          
          setPlayerStats({
            totalEvents: allEvents.length,
            eventsAttended,
            attendanceRate,
            eventsParticipated: allParticipants.length,
            completedEvents: totalCompleted
          })
        } catch (error) {
          console.error('Error loading player stats:', error)
          setPlayerStats(null)
        } finally {
          setLoadingStats(false)
        }
      }
      loadStats()
    }
  }, [activeTab, user?.playerId, isAuthenticated])

  // Load user events
  useEffect(() => {
    if (activeTab === 'events' && user?.playerId && isAuthenticated) {
      setLoadingEvents(true)
      eventsApi.list().then(events => {
        // Get events where user participated
        Promise.all(events.map(async (event) => {
          try {
            const participants = await eventParticipantsApi.listByEvent(event.id)
            const isParticipant = participants.some(p => p.playerId === user.playerId)
            if (isParticipant) {
              const attendances = await attendanceApi.listByEvent(event.id).catch(() => [])
              const attendance = attendances.find(a => a.playerId === user.playerId)
              return { ...event, attendance }
            }
            return null
          } catch {
            return null
          }
        })).then(results => {
          setUserEvents(results.filter(e => e !== null))
        }).finally(() => {
          setLoadingEvents(false)
        })
      }).catch(() => {
        setUserEvents([])
        setLoadingEvents(false)
      })
    }
  }, [activeTab, user?.playerId, isAuthenticated])

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toasts.error('El nombre no puede estar vacío')
      return
    }
    await updateProfile({ name: editName.trim() })
  }

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toasts.error('Todos los campos son requeridos')
      return
    }
    if (newPassword.length < 6) {
      toasts.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword.length > 128) {
      toasts.error('La contraseña es demasiado larga (máximo 128 caracteres)')
      return
    }
    if (newPassword !== confirmPassword) {
      toasts.error('Las contraseñas no coinciden')
      return
    }
    changePassword({ currentPassword, newPassword })
  }

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
        <h2 className="text-2xl font-bold text-gray-800">Mi Perfil</h2>
        {user && (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                ...(hasRole('player') || user.playerId ? [{ id: 'stats', label: 'Estadísticas', icon: '📊' }] : []),
                ...(hasRole('player') || user.playerId ? [{ id: 'events', label: 'Mis Eventos', icon: '📅' }] : []),
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
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
                            {playerInfo.position} • {playerInfo.status}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasRole('player') || user.playerId ? (
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
                    {(hasRole('player') || user.playerId) && (
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
            {activeTab === 'stats' && (hasRole('player') || user.playerId) && (
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
            {activeTab === 'events' && (hasRole('player') || user.playerId) && (
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
                      Si eres parte del equipo, puedes solicitar acceso como jugador. Opcionalmente, indica tu ID de jugador si ya existes en el roster.
                    </p>
                    <div className="space-y-3">
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
                      </div>
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
                            await myRoleRequestsApi.create({
                              role: 'player',
                              note: requestNote.trim() || undefined,
                              playerId: requestPlayerId ? Number(requestPlayerId) : undefined
                            })
                            setRequestNote('')
                            setRequestPlayerId('')
                            const mine = await myRoleRequestsApi.listMine()
                            setMyRequests(mine)
                            toasts.success('Solicitud enviada exitosamente')
                          } catch (e: any) {
                            toasts.error(e?.response?.data?.error || 'No se pudo enviar la solicitud')
                          }
                        }}
                        disabled={!requestNote.trim() && !requestPlayerId}
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
