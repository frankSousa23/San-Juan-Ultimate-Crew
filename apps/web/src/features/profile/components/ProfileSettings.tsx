import React from 'react'
import { Link } from 'react-router-dom'

interface ProfileSettingsProps {
  user: any
  activeTab: 'edit' | 'password' | 'security'
  editName: string
  setEditName: (name: string) => void
  handleUpdateProfile: () => void
  currentPassword: string
  setCurrentPassword: (password: string) => void
  newPassword: string
  setNewPassword: (password: string) => void
  confirmPassword: string
  setConfirmPassword: (password: string) => void
  handleChangePassword: () => void
  changingPassword: boolean
  togglingPlayerRole: boolean
  handleTogglePlayerRole: () => void
  playerInfo: any
}

export function ProfileSettings({
  user,
  activeTab,
  editName,
  setEditName,
  handleUpdateProfile,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleChangePassword,
  changingPassword,
  togglingPlayerRole,
  handleTogglePlayerRole,
  playerInfo
}: ProfileSettingsProps) {
  if (!user) return null

  return (
    <>
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

      {activeTab === 'security' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Seguridad de la Cuenta</h3>
          
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
                    onClick={handleTogglePlayerRole}
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
                        : 'Activar Rol de Jugador'
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
