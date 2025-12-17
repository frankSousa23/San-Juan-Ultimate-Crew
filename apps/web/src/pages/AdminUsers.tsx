import React, { useEffect, useState } from 'react'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import { http, adminUsersApi, usersApi } from '../lib/api'

interface UserItem { id: number; email: string; name?: string; roles: string[]; playerId: number | null; status?: string; createdAt?: string }

export default function AdminUsers() {
  const toast = useToast()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<Record<number, string>>({})
  const [roles, setRoles] = useState<Record<number, Set<string>>>({})
  const [requests, setRequests] = useState<any[]>([])
  const [requestStatus, setRequestStatus] = useState<'PENDING'|'APPROVED'|'DENIED'>('PENDING')
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestPlayerId, setRequestPlayerId] = useState<Record<number, string>>({})
  const [requestNote, setRequestNote] = useState<Record<number, string>>({})
  const [requestSaving, setRequestSaving] = useState<Record<number, boolean>>({})
  const [requestError, setRequestError] = useState<Record<number, string | null>>({})
  const [requestSaved, setRequestSaved] = useState<Record<number, boolean>>({})
  const [pendingUsers, setPendingUsers] = useState<UserItem[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [approveRole, setApproveRole] = useState<Record<number, 'guest' | 'player' | 'admin' | 'captain' | 'coach' | 'treasurer'>>({})
  const [approvePlayerId, setApprovePlayerId] = useState<Record<number, string>>({})
  const [approving, setApproving] = useState<Record<number, boolean>>({})
  const [showPlayerForm, setShowPlayerForm] = useState<Record<number, boolean>>({})
  const [playerData, setPlayerData] = useState<Record<number, { number: string; position: 'HANDLER' | 'CUTTER' | 'HYBRID'; heightCm: string; experience: string }>>({})
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [deleting, setDeleting] = useState<Record<number, boolean>>({})

  const loadPendingUsers = async () => {
    setPendingLoading(true)
    try {
      const data = await usersApi.list('PENDING')
      setPendingUsers(data)
      const initRole: Record<number, 'guest' | 'player' | 'admin' | 'captain' | 'coach' | 'treasurer'> = {}
      const initPlayer: Record<number, string> = {}
      for (const u of data) {
        // Por defecto, todos los usuarios nuevos empiezan como jugadores del equipo
        initRole[u.id] = 'player'
        initPlayer[u.id] = ''
      }
      setApproveRole(initRole)
      setApprovePlayerId(initPlayer)
    } catch (e: any) {
      toast.showErrorToast(e?.response?.data?.error || 'No se pudieron cargar usuarios pendientes')
    } finally {
      setPendingLoading(false)
    }
  }

  const handleApproveUser = async (id: number) => {
    // Si el rol es 'player' y no hay playerId, mostrar formulario de datos de jugador
    const role = approveRole[id] || 'player'
    const hasPlayerId = approvePlayerId[id] && approvePlayerId[id].trim() !== ''
    const shouldShowForm = role === 'player' && !hasPlayerId && !showPlayerForm[id]
    
    if (shouldShowForm) {
      setShowPlayerForm(prev => ({ ...prev, [id]: true }))
      setPlayerData(prev => ({ ...prev, [id]: { number: '', position: 'CUTTER', heightCm: '', experience: '' } }))
      return
    }
    
    setApproving(prev => ({ ...prev, [id]: true }))
    try {
      const payload: any = { role }
      
      // Si hay playerId, usarlo
      if (hasPlayerId) {
        payload.playerId = Number(approvePlayerId[id])
      } 
      // Si hay datos de jugador en el formulario, usarlos
      else if (showPlayerForm[id] && playerData[id]) {
        const data = playerData[id]
        if (!data.number || !data.position) {
          toast.showErrorToast('Número y posición son requeridos para crear jugador')
          setApproving(prev => ({ ...prev, [id]: false }))
          return
        }
        payload.playerData = {
          number: Number(data.number),
          position: data.position,
          status: 'ACTIVE',
          heightCm: data.heightCm ? Number(data.heightCm) : undefined,
          experience: data.experience.trim() || undefined,
        }
      }
      
      const result = await usersApi.approve(id, payload)
      toast.showSuccessToast(`Usuario aprobado con rol: ${result.roles?.[0] || role}`)
      setShowPlayerForm(prev => ({ ...prev, [id]: false }))
      setPlayerData(prev => {
        const newData = { ...prev }
        delete newData[id]
        return newData
      })
      await loadPendingUsers()
      await load() // Reload all users
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || 'No se pudo aprobar el usuario'
      toast.showErrorToast(errorMsg)
    } finally {
      setApproving(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleRejectUser = async (id: number) => {
    const user = pendingUsers.find(u => u.id === id)
    const email = user?.email || 'este usuario'
    if (!confirm(`¿Estás seguro de que deseas rechazar a ${email}? Esta acción no se puede deshacer.`)) return
    setApproving(prev => ({ ...prev, [id]: true }))
    try {
      await usersApi.reject(id)
      toast.showSuccessToast(`Usuario ${email} rechazado`)
      await loadPendingUsers()
      await load() // Reload all users
    } catch (e: any) {
      toast.showErrorToast(e?.response?.data?.error || 'No se pudo rechazar el usuario')
    } finally {
      setApproving(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleDeleteUser = async (id: number) => {
    const user = users.find(u => u.id === id) || pendingUsers.find(u => u.id === id)
    const email = user?.email || 'este usuario'
    const name = user?.name || email
    const isSelf = currentUser?.id === id
    
    // Primera confirmación
    if (!confirm(`¿Estás seguro de que deseas ELIMINAR permanentemente a ${name} (${email})?\n\nEsta acción es IRREVERSIBLE y eliminará:\n- El usuario y todos sus roles\n- Todas sus solicitudes de rol\n- El vínculo con su jugador (si existe)\n\n¿Continuar?`)) {
      return
    }
    
    // Segunda confirmación si es el mismo usuario
    if (isSelf) {
      if (!confirm(`⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEstás intentando eliminar TU PROPIA CUENTA.\n\nSi confirmas esta acción:\n- Perderás acceso inmediatamente\n- No podrás iniciar sesión nunca más\n- Todos tus datos serán eliminados permanentemente\n\n¿Estás ABSOLUTAMENTE SEGURO de que quieres continuar?\n\nEscribe "ELIMINAR" en el siguiente prompt para confirmar.`)) {
        return
      }
      
      const confirmation = prompt('Para confirmar la eliminación de tu propia cuenta, escribe exactamente: ELIMINAR')
      if (confirmation !== 'ELIMINAR') {
        toast.showErrorToast('Confirmación incorrecta. La eliminación ha sido cancelada.')
        return
      }
      
      // Tercera confirmación final
      if (!confirm(`ÚLTIMA OPORTUNIDAD\n\nEstás a punto de eliminar tu propia cuenta de forma permanente.\n\n¿Estás COMPLETAMENTE SEGURO de que quieres hacer esto?`)) {
        return
      }
    }
    
    setDeleting(prev => ({ ...prev, [id]: true }))
    try {
      await usersApi.delete(id)
      toast.showSuccessToast(`Usuario ${email} eliminado permanentemente`)
      await loadPendingUsers()
      await load() // Reload all users
      
      // Si se eliminó a sí mismo, redirigir al login
      if (isSelf) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || 'No se pudo eliminar el usuario'
      toast.showErrorToast(errorMsg)
      if (errorMsg.includes('cannot delete your own account')) {
        toast.showErrorToast('No puedes eliminar tu propia cuenta')
      }
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }))
    }
  }

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const status = userStatusFilter !== 'ALL' ? userStatusFilter : undefined
      const data = await usersApi.list(status)
      setUsers(data)
      const initRoles: Record<number, Set<string>> = {}
      const initPlayer: Record<number, string> = {}
      for (const u of data) {
        initRoles[u.id] = new Set(u.roles)
        initPlayer[u.id] = u.playerId ? String(u.playerId) : ''
      }
      setRoles(initRoles)
      setPlayerId(initPlayer)
      await loadRequests()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); loadPendingUsers() }, [])
  useEffect(() => { load() }, [userStatusFilter])

  const loadRequests = async () => {
    setRequestsLoading(true)
    try {
      const reqs = await adminUsersApi.listRoleRequests(requestStatus)
      setRequests(reqs)
      // seed editable fields
      const init: Record<number, string> = {}
      for (const r of reqs) init[r.id] = r.playerId ? String(r.playerId) : ''
      setRequestPlayerId(init)
  const initNote: Record<number, string> = {}
  for (const r of reqs) initNote[r.id] = r.note ?? ''
  setRequestNote(initNote)
    } catch (e) {
      // ignore error in isolated requests load; main error banner handled by load()
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => { loadRequests() }, [requestStatus])

  const saveLink = async (id: number) => {
    const pid = Number(playerId[id] || 0)
    if (!pid) return
    try {
      await adminUsersApi.linkPlayer(id, pid)
      await load()
      toast.showSuccessToast('Jugador vinculado')
    } catch (e: any) { alert('No se pudo vincular jugador') }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Admin: Usuarios</h2>
        <button
          onClick={() => { load(); loadPendingUsers() }}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm whitespace-nowrap"
        >
          🔄 Actualizar
        </button>
      </div>
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 text-sm">{error}</div>}
      
      {/* Pending Users Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-2 border-b bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Usuarios Pendientes de Aprobación</div>
              <div className="text-sm text-gray-600 mt-1">Usuarios que se han registrado y esperan aprobación del administrador</div>
            </div>
            {pendingUsers.length > 0 && (
              <span className="bg-yellow-500 text-white rounded-full px-3 py-1 text-sm font-semibold">
                {pendingUsers.length}
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle sm:px-0">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-2 sm:px-4 py-2">Email</th>
                  <th className="text-left px-2 sm:px-4 py-2">Nombre</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden md:table-cell">Fecha Registro</th>
                  <th className="text-left px-2 sm:px-4 py-2">Rol</th>
                  <th className="px-2 sm:px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(u => (
                  <React.Fragment key={u.id}>
                    <tr className="border-t">
                      <td className="px-2 sm:px-4 py-2 break-words">{u.email}</td>
                      <td className="px-2 sm:px-4 py-2">{u.name || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 hidden md:table-cell">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="px-2 sm:px-4 py-2">
                        <select
                          className="border rounded px-2 py-1 w-full sm:w-auto text-xs sm:text-sm"
                          value={approveRole[u.id] || 'player'}
                          onChange={(e) => {
                            setApproveRole(prev => ({
                              ...prev,
                              [u.id]: e.target.value as 'guest' | 'player' | 'admin' | 'captain' | 'coach' | 'treasurer'
                            }))
                            // Si cambia el rol y no es player, ocultar formulario
                            if (e.target.value !== 'player') {
                              setShowPlayerForm(prev => ({ ...prev, [u.id]: false }))
                            }
                          }}
                        >
                          <option value="guest">Refuerzo</option>
                          <option value="player">Jugador</option>
                          <option value="admin">Admin</option>
                          <option value="captain">Capitán</option>
                          <option value="coach">Entrenador</option>
                          <option value="treasurer">Tesorero</option>
                        </select>
                      </td>
                      <td className="px-2 sm:px-4 py-2">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                          <button
                            className="px-2 sm:px-3 py-1 bg-emerald-600 text-white rounded disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap"
                            disabled={!!approving[u.id]}
                            onClick={() => handleApproveUser(u.id)}
                          >
                            {approving[u.id] ? 'Aprobando…' : 'Aprobar'}
                          </button>
                          <button
                            className="px-2 sm:px-3 py-1 bg-rose-600 text-white rounded disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap"
                            disabled={!!approving[u.id]}
                            onClick={() => handleRejectUser(u.id)}
                          >
                            {approving[u.id] ? 'Rechazando…' : 'Rechazar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showPlayerForm[u.id] && (
                      <tr className="border-t bg-indigo-50">
                        <td colSpan={5} className="px-2 sm:px-4 py-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-indigo-900">Datos del Jugador</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Número <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  className="w-full border rounded px-3 py-2"
                                  value={playerData[u.id]?.number || ''}
                                  onChange={e => {
                                    const val = e.target.value
                                    if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                                      setPlayerData(prev => ({
                                        ...prev,
                                        [u.id]: { ...(prev[u.id] || { number: '', position: 'CUTTER', heightCm: '', experience: '' }), number: val }
                                      }))
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Posición <span className="text-red-500">*</span>
                                </label>
                                <select
                                  className="w-full border rounded px-3 py-2"
                                  value={playerData[u.id]?.position || 'CUTTER'}
                                  onChange={e => setPlayerData(prev => ({
                                    ...prev,
                                    [u.id]: { ...(prev[u.id] || { number: '', position: 'CUTTER', heightCm: '', experience: '' }), position: e.target.value as any }
                                  }))}
                                >
                                  <option value="CUTTER">Cutter</option>
                                  <option value="HANDLER">Handler</option>
                                  <option value="HYBRID">Híbrido</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Altura (cm) <span className="text-gray-500 text-xs">(opcional)</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  className="w-full border rounded px-3 py-2"
                                  value={playerData[u.id]?.heightCm || ''}
                                  onChange={e => {
                                    const val = e.target.value
                                    if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                                      setPlayerData(prev => ({
                                        ...prev,
                                        [u.id]: { ...(prev[u.id] || { number: '', position: 'CUTTER', heightCm: '', experience: '' }), heightCm: val }
                                      }))
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Experiencia <span className="text-gray-500 text-xs">(opcional)</span>
                                </label>
                                <input
                                  type="text"
                                  className="w-full border rounded px-3 py-2"
                                  value={playerData[u.id]?.experience || ''}
                                  onChange={e => setPlayerData(prev => ({
                                    ...prev,
                                    [u.id]: { ...(prev[u.id] || { number: '', position: 'CUTTER', heightCm: '', experience: '' }), experience: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
                                onClick={() => handleApproveUser(u.id)}
                                disabled={!!approving[u.id] || !playerData[u.id]?.number || !playerData[u.id]?.position}
                              >
                                {approving[u.id] ? 'Aprobando…' : 'Aprobar con estos datos'}
                              </button>
                              <button
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                onClick={() => {
                                  setShowPlayerForm(prev => ({ ...prev, [u.id]: false }))
                                  setPlayerData(prev => {
                                    const newData = { ...prev }
                                    delete newData[u.id]
                                    return newData
                                  })
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {pendingLoading && (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Cargando…</td></tr>
                )}
                {!pendingLoading && pendingUsers.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={6}>No hay usuarios pendientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
          <div className="font-medium">Todos los Usuarios</div>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={userStatusFilter}
            onChange={(e) => {
              setUserStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')
              load()
            }}
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobados</option>
            <option value="REJECTED">Rechazados</option>
          </select>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-left px-4 py-2">Roles</th>
              <th className="text-left px-4 py-2">PlayerId</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.name || ''}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    u.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    u.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    u.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {u.status || 'APPROVED'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1 text-xs sm:text-sm">
                    {u.roles.length === 0 && (
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">Sin rol</span>
                    )}
                    {u.roles.map(r => (
                      <span key={r} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {r === 'guest' ? 'Refuerzo' :
                         r === 'player' ? 'Jugador' :
                         r === 'admin' ? 'Admin' :
                         r === 'captain' ? 'Capitán' :
                         r === 'coach' ? 'Entrenador' :
                         r === 'treasurer' ? 'Tesorero' :
                         r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <input
                    className="border rounded px-2 py-1 w-24"
                    value={playerId[u.id] || ''}
                    onChange={(e) => setPlayerId(prev => ({ ...prev, [u.id]: e.target.value }))}
                    placeholder="id"
                    disabled={!!u.playerId}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                    <button
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-xs sm:text-sm whitespace-nowrap disabled:opacity-50"
                      onClick={() => saveLink(u.id)}
                      disabled={!!u.playerId || !playerId[u.id]}
                    >
                      Vincular
                    </button>
                    <button
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 hover:bg-red-700"
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={!!deleting[u.id]}
                      title="Eliminar usuario permanentemente"
                    >
                      {deleting[u.id] ? 'Eliminando…' : '🗑️ Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={5}>Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
          <div className="font-medium">Solicitudes de rol</div>
          <div className="text-sm flex items-center gap-2">
            <span className="text-gray-600">Estado:</span>
            <select
              className="border rounded px-2 py-1"
              value={requestStatus}
              onChange={(e) => setRequestStatus(e.target.value as 'PENDING'|'APPROVED'|'DENIED')}
            >
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="DENIED">Denegadas</option>
            </select>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">ID</th>
              <th className="text-left px-4 py-2">Usuario</th>
              <th className="text-left px-4 py-2">Rol</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-left px-4 py-2">PlayerId</th>
              <th className="text-left px-4 py-2">Nota</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r: any) => (
              <tr key={r.id} className="border-t" data-testid={`role-req-row-${r.id}`}>
                <td className="px-4 py-2">{r.id}</td>
                <td className="px-4 py-2">{r.user?.email}</td>
                <td className="px-4 py-2">{r.role}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2">
                  {r.status === 'PENDING' ? (
                    <input
                      data-testid={`role-req-playerId-${r.id}`}
                      className="border rounded px-2 py-1 w-24"
                      value={requestPlayerId[r.id] || ''}
                      onChange={(e) => setRequestPlayerId(prev => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="id"
                    />
                  ) : (
                    r.playerId ?? ''
                  )}
                </td>
                <td className="px-4 py-2">
                  {r.status === 'PENDING' ? (
                    <input
                      data-testid={`role-req-note-${r.id}`}
                      className="border rounded px-2 py-1 w-56"
                      value={requestNote[r.id] || ''}
                      onChange={(e) => setRequestNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="nota"
                    />
                  ) : (
                    r.note ?? ''
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {r.status === 'PENDING' && (
                    <>
                      <div className="flex flex-col items-end gap-1 mb-1">
                        {requestError[r.id] && (
                          <div className="text-rose-600 text-xs">{requestError[r.id]}</div>
                        )}
                        {requestSaved[r.id] && !requestError[r.id] && (
                          <div className="text-emerald-700 text-xs">Guardado</div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                      <button
                        data-testid={`role-req-save-${r.id}`}
                        className={`px-2 py-1 rounded text-xs sm:text-sm whitespace-nowrap ${requestSaving[r.id] ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-800'}`}
                        disabled={!!requestSaving[r.id]}
                        onClick={async () => {
                        const raw = requestPlayerId[r.id]
                          // Validate: allow blank or positive integer
                          if (raw && !/^[1-9]\d*$/.test(raw)) {
                            setRequestError(prev => ({ ...prev, [r.id]: 'PlayerId inválido (usa un número entero positivo o deja vacío)' }))
                            return
                          }
                          const pid = raw ? Number(raw) : null
                        try {
                          setRequestSaving(prev => ({ ...prev, [r.id]: true }))
                          setRequestError(prev => ({ ...prev, [r.id]: null }))
                          await adminUsersApi.updateRoleRequest(r.id, { playerId: pid, note: requestNote[r.id] ?? undefined })
                          setRequestSaved(prev => ({ ...prev, [r.id]: true }))
                          toast.showSuccessToast('Solicitud actualizada')
                            // auto-clear success after a short delay
                            setTimeout(() => {
                              setRequestSaved(prev => ({ ...prev, [r.id]: false }))
                            }, 1500)
                          await loadRequests()
                        } catch (e: any) {
                          const msg = e?.response?.data?.error || 'No se pudo actualizar la solicitud'
                          setRequestError(prev => ({ ...prev, [r.id]: msg }))
                          toast.showErrorToast(msg)
                        } finally {
                          setRequestSaving(prev => ({ ...prev, [r.id]: false }))
                        }
                      }}>
                        {requestSaving[r.id] ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button className="px-2 py-1 bg-emerald-600 text-white rounded text-xs sm:text-sm whitespace-nowrap" onClick={async () => { await adminUsersApi.approveRoleRequest(r.id); toast.showSuccessToast('Solicitud aprobada'); await loadRequests() }}>Aprobar</button>
                      <button className="px-2 py-1 bg-rose-600 text-white rounded text-xs sm:text-sm whitespace-nowrap" onClick={async () => { await adminUsersApi.denyRoleRequest(r.id); toast.showInfoToast('Solicitud denegada'); await loadRequests() }}>Denegar</button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {requestsLoading && (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Cargando…</td></tr>
            )}
            {!requestsLoading && requests.length === 0 && (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Sin solicitudes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
