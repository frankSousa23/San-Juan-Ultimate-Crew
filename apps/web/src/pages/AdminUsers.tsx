import React, { useEffect, useState } from 'react'
import { useToast } from '../hooks/useToast'
import { http, adminUsersApi, usersApi } from '../lib/api'

interface UserItem { id: number; email: string; name?: string; roles: string[]; playerId: number | null; status?: string; createdAt?: string }

export default function AdminUsers() {
  const toast = useToast()
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
  const [approveRole, setApproveRole] = useState<Record<number, 'guest' | 'player' | 'admin'>>({})
  const [approvePlayerId, setApprovePlayerId] = useState<Record<number, string>>({})
  const [approving, setApproving] = useState<Record<number, boolean>>({})
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  const loadPendingUsers = async () => {
    setPendingLoading(true)
    try {
      const data = await usersApi.list('PENDING')
      setPendingUsers(data)
      const initRole: Record<number, 'guest' | 'player' | 'admin'> = {}
      const initPlayer: Record<number, string> = {}
      for (const u of data) {
        initRole[u.id] = 'guest' // Default role
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
    // Validate player ID if provided
    const playerIdStr = approvePlayerId[id]
    if (playerIdStr && playerIdStr.trim() !== '') {
      const playerIdNum = Number(playerIdStr)
      if (isNaN(playerIdNum) || playerIdNum <= 0) {
        toast.showErrorToast('El ID de jugador debe ser un número mayor a 0')
        return
      }
    }
    
    setApproving(prev => ({ ...prev, [id]: true }))
    try {
      const role = approveRole[id] || 'guest'
      const playerId = approvePlayerId[id] && approvePlayerId[id].trim() !== '' 
        ? Number(approvePlayerId[id]) 
        : undefined
      const result = await usersApi.approve(id, { role, playerId })
      toast.showSuccessToast(`Usuario aprobado con rol: ${result.roles?.[0] || role}`)
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

  const toggleRole = (id: number, r: 'guest'|'player') => {
    setRoles(prev => {
      const copy = { ...prev }
      const set = new Set(copy[id] || [])
      if (set.has(r)) set.delete(r); else set.add(r)
      copy[id] = set
      return copy
    })
  }

  const saveRoles = async (id: number) => {
    try {
      const list = Array.from(roles[id] || [])
      await adminUsersApi.setRoles(id, list as Array<'guest'|'player'>)
      await load()
      toast.showSuccessToast('Roles actualizados')
    } catch (e: any) { alert('No se pudo guardar roles') }
  }

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
                  <th className="text-left px-2 sm:px-4 py-2 hidden lg:table-cell">Player ID</th>
                  <th className="px-2 sm:px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="px-2 sm:px-4 py-2 break-words">{u.email}</td>
                    <td className="px-2 sm:px-4 py-2">{u.name || '-'}</td>
                    <td className="px-2 sm:px-4 py-2 hidden md:table-cell">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-2 sm:px-4 py-2">
                      <select
                        className="border rounded px-2 py-1 w-full sm:w-auto text-xs sm:text-sm"
                        value={approveRole[u.id] || 'guest'}
                        onChange={(e) => setApproveRole(prev => ({ ...prev, [u.id]: e.target.value as 'guest' | 'player' | 'admin' }))}
                      >
                        <option value="guest">Guest</option>
                        <option value="player">Player</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-2 sm:px-4 py-2 hidden lg:table-cell">
                      <input
                        className="border rounded px-2 py-1 w-20 sm:w-24 text-xs sm:text-sm"
                        type="number"
                        min="1"
                        value={approvePlayerId[u.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || /^\d+$/.test(val)) {
                            setApprovePlayerId(prev => ({ ...prev, [u.id]: val }))
                          }
                        }}
                        placeholder="ID"
                      />
                      {approvePlayerId[u.id] && approvePlayerId[u.id].trim() !== '' && (
                        (isNaN(Number(approvePlayerId[u.id])) || Number(approvePlayerId[u.id]) <= 0) && (
                          <p className="text-xs text-red-600 mt-1">ID debe ser un número mayor a 0</p>
                        )
                      )}
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
                  <label className="mr-3">
                    <input type="checkbox" checked={(roles[u.id]?.has('guest')) || false} onChange={() => toggleRole(u.id, 'guest')} /> guest
                  </label>
                  <label>
                    <input type="checkbox" checked={(roles[u.id]?.has('player')) || false} onChange={() => toggleRole(u.id, 'player')} /> player
                  </label>
                </td>
                <td className="px-4 py-2">
                  <input className="border rounded px-2 py-1 w-24" value={playerId[u.id] || ''} onChange={(e) => setPlayerId(prev => ({ ...prev, [u.id]: e.target.value }))} placeholder="id" />
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:justify-end">
                    <button className="px-2 py-1 bg-indigo-600 text-white rounded text-xs sm:text-sm whitespace-nowrap" onClick={() => saveRoles(u.id)}>Guardar roles</button>
                    <button className="px-2 py-1 bg-emerald-600 text-white rounded text-xs sm:text-sm whitespace-nowrap" onClick={() => saveLink(u.id)}>Vincular</button>
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
