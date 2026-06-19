import React from 'react'
import { NavLink } from 'react-router-dom'
import { useProfile } from '../features/profile/hooks/useProfile'
import { useAuth } from '../contexts/AuthContext'
import { ProfileInfo } from '../features/profile/components/ProfileInfo'
import { ProfileSettings } from '../features/profile/components/ProfileSettings'
import { ProfileActivity } from '../features/profile/components/ProfileActivity'
import { ProfileStats } from '../features/profile/components/ProfileStats'
import { ProfileEvents } from '../features/profile/components/ProfileEvents'
import { ProfileRequests } from '../features/profile/components/ProfileRequests'

export default function Profile() {
  const { hasRole } = useAuth()
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
            {activeTab === 'overview' && (
              <ProfileInfo
                user={user}
                playerInfo={playerInfo}
                hasRole={hasRole}
                loadingStats={loadingStats}
                playerStats={playerStats}
                setActiveTab={setActiveTab}
              />
            )}

            {(activeTab === 'edit' || activeTab === 'password' || activeTab === 'security') && (
              <ProfileSettings
                user={user}
                activeTab={activeTab}
                editName={editName}
                setEditName={setEditName}
                handleUpdateProfile={handleUpdateProfile}
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                handleChangePassword={handleChangePassword}
                changingPassword={changingPassword}
                togglingPlayerRole={togglingPlayerRole}
                handleTogglePlayerRole={handleTogglePlayerRole}
                playerInfo={playerInfo}
              />
            )}

            {activeTab === 'activity' && (
              <ProfileActivity
                loadingActivity={loadingActivity}
                activityLogs={activityLogs}
              />
            )}

            {activeTab === 'stats' && user.roles?.includes('player') && (
              <ProfileStats
                loadingStats={loadingStats}
                playerStats={playerStats}
              />
            )}

            {activeTab === 'events' && user.roles?.includes('player') && (
              <ProfileEvents
                loadingEvents={loadingEvents}
                userEvents={userEvents}
              />
            )}

            {activeTab === 'requests' && (
              <ProfileRequests
                user={user}
                myRequests={myRequests}
                requestNote={requestNote}
                setRequestNote={setRequestNote}
                requestPlayerId={requestPlayerId}
                setRequestPlayerId={setRequestPlayerId}
                showPlayerDataForm={showPlayerDataForm}
                setShowPlayerDataForm={setShowPlayerDataForm}
                playerData={playerData}
                setPlayerData={setPlayerData}
                handleRoleRequest={handleRoleRequest}
              />
            )}

            {(activeTab === 'password' || activeTab === 'security') && (
              <div className="mt-8 border-t pt-6">
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
