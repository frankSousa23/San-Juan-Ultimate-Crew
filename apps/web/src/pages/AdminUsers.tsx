import React, { useEffect, useState } from 'react'
import { useToast } from '../hooks/useToast'
import { http, adminUsersApi } from '../lib/api'

interface UserItem { id: number; email: string; name?: string; roles: string[]; playerId: number | null }

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

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await adminUsersApi.list()
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

  useEffect(() => { load() }, [])

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
    } catch (e: any) { alert('No se pudo guardar roles') }
  }

  const saveLink = async (id: number) => {
    const pid = Number(playerId[id] || 0)
    if (!pid) return
    try {
      await adminUsersApi.linkPlayer(id, pid)
      await load()
    } catch (e: any) { alert('No se pudo vincular jugador') }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Admin: Usuarios</h2>
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 text-sm">{error}</div>}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Nombre</th>
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
                <td className="px-4 py-2 text-right space-x-2">
                  <button className="px-2 py-1 bg-indigo-600 text-white rounded" onClick={() => saveRoles(u.id)}>Guardar roles</button>
                  <button className="px-2 py-1 bg-emerald-600 text-white rounded" onClick={() => saveLink(u.id)}>Vincular</button>
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
                <td className="px-4 py-2 text-right space-x-2">
                  {r.status === 'PENDING' && (
                    <>
                      <div className="flex flex-col items-start gap-1">
                        {requestError[r.id] && (
                          <div className="text-rose-600 text-xs">{requestError[r.id]}</div>
                        )}
                        {requestSaved[r.id] && !requestError[r.id] && (
                          <div className="text-emerald-700 text-xs">Guardado</div>
                        )}
                      </div>
                      <button
                        data-testid={`role-req-save-${r.id}`}
                        className={`px-2 py-1 rounded ${requestSaving[r.id] ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-800'}`}
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
                          toast.success('Solicitud actualizada')
                            // auto-clear success after a short delay
                            setTimeout(() => {
                              setRequestSaved(prev => ({ ...prev, [r.id]: false }))
                            }, 1500)
                          await loadRequests()
                        } catch (e: any) {
                          const msg = e?.response?.data?.error || 'No se pudo actualizar la solicitud'
                          setRequestError(prev => ({ ...prev, [r.id]: msg }))
                          toast.error(msg)
                        } finally {
                          setRequestSaving(prev => ({ ...prev, [r.id]: false }))
                        }
                      }}>
                        {requestSaving[r.id] ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button className="px-2 py-1 bg-emerald-600 text-white rounded" onClick={async () => { await adminUsersApi.approveRoleRequest(r.id); toast.success('Solicitud aprobada'); await loadRequests() }}>Aprobar</button>
                      <button className="px-2 py-1 bg-rose-600 text-white rounded" onClick={async () => { await adminUsersApi.denyRoleRequest(r.id); toast.info('Solicitud denegada'); await loadRequests() }}>Denegar</button>
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
