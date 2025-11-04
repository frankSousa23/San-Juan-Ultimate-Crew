import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { authApi, getAuthToken, myRoleRequestsApi } from '../lib/api'

export default function Profile() {
  const [authed, setAuthed] = useState<boolean>(!!getAuthToken())
  const [authDisabled, setAuthDisabled] = useState<boolean>(false)
  const [user, setUser] = useState<{ id: number; email: string; name?: string; roles?: string[] } | null>(null)
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [requestNote, setRequestNote] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAuthed(!!getAuthToken())
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      setUser(null)
      setAuthDisabled(false)
      if (!authed) return
      try {
        const me = await authApi.me()
        if (cancelled) return
        if (me.authDisabled) {
          setAuthDisabled(true)
        } else if (me.user) {
          setUser(me.user)
        }
        const mine = await myRoleRequestsApi.listMine()
        setMyRequests(mine)
      } catch (e: any) {
        setError('No se pudo cargar el perfil')
      }
    }
    load()
    return () => { cancelled = true }
  }, [authed])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Perfil de usuario</h2>
      {!authed && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 text-sm">
          Inicia sesión para ver tu perfil.
          <div className="mt-2">
            <NavLink to="/login?next=/perfil" className="text-indigo-700 underline">Ir a Login</NavLink>
          </div>
        </div>
      )}
      {authed && authDisabled && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded p-3 text-sm">
          Autenticación desactivada. El backend no valida el usuario; acciones protegidas en UI se habilitan por token.
        </div>
      )}
      {authed && error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 text-sm">{error}</div>
      )}
      {authed && !authDisabled && user && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Usuario</div>
          <div className="text-lg font-semibold">{user.name || user.email}</div>
          {user.name && <div className="text-gray-600">{user.email}</div>}
          {user.roles && user.roles.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">Roles: {user.roles.join(', ')}</div>
          )}
          {user.roles && user.roles.includes('guest') && (
            <div className="mt-4 border-t pt-3">
              <div className="font-medium">Solicitar rol de jugador</div>
              <div className="text-xs text-gray-500 mb-2">Opcional: indica el ID de jugador para vincular tu cuenta si ya existes en el roster.</div>
              <div className="flex items-center gap-2 mb-2">
                <input className="border rounded px-2 py-1 w-24" value={playerId} onChange={e => setPlayerId(e.target.value)} placeholder="PlayerId" />
                <input className="border rounded px-2 py-1 flex-1" value={requestNote} onChange={e => setRequestNote(e.target.value)} placeholder="Nota" />
                <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={async () => {
                  try {
                    await myRoleRequestsApi.create({ role: 'player', note: requestNote || undefined, playerId: playerId ? Number(playerId) : undefined })
                    setRequestNote(''); setPlayerId('')
                    const mine = await myRoleRequestsApi.listMine(); setMyRequests(mine)
                    alert('Solicitud enviada')
                  } catch (e: any) {
                    alert(e?.response?.data?.error || 'No se pudo enviar la solicitud')
                  }
                }}>Enviar</button>
              </div>
              <div className="text-sm text-gray-700">Mis solicitudes</div>
              <ul className="list-disc ml-5 text-sm text-gray-600">
                {myRequests.map((r: any) => (
                  <li key={r.id}>#{r.id} - {r.role} - {r.status}{r.playerId ? ` (playerId ${r.playerId})` : ''}</li>
                ))}
                {myRequests.length === 0 && <li className="list-none text-gray-500">Sin solicitudes</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
