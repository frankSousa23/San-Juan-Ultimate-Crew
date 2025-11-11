import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { playersApi, authApi, getAuthToken } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import PlayerForm from '../components/PlayerForm'
import { Player, Position, Status } from '../types/player'

const badgeColor: Record<Status, string> = {
  ACTIVE: 'text-green-600',
  INJURED: 'text-red-600',
  INACTIVE: 'text-gray-600',
}

export default function Roster() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [players, setPlayers] = useState<Player[]>([])
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<'' | Position>('')
  const [st, setSt] = useState<'' | Status>('')
  const [selected, setSelected] = useState<Player | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [user, setUser] = useState<{ roles?: string[]; playerId?: number | null } | null>(null)
  const authed = !!getAuthToken()
  
  const toasts = useToast()
  const { execute: loadPlayers, loading, error } = useApi(playersApi.list, {
    onSuccess: (data) => setPlayers(data),
    showErrorToast: true
  })
  const { execute: createPlayer } = useApi(playersApi.create, {
    onSuccess: (data) => {
      setPlayers(prev => [...prev, data].sort((a,b) => a.number - b.number))
      setCreateOpen(false)
      toasts.success('Jugador creado exitosamente')
    },
    showErrorToast: true
  })
  const { execute: updatePlayer } = useApi(playersApi.update, {
    onSuccess: (data) => {
      setPlayers(prev => prev.map(p => p.id === selected?.id ? data : p).sort((a,b) => a.number - b.number))
      setEditOpen(false)
      setSelected(data)
      toasts.success('Jugador actualizado exitosamente')
    },
    showErrorToast: true
  })
  const { execute: deletePlayer } = useApi(playersApi.remove, {
    onSuccess: () => {
      setPlayers(prev => prev.filter(p => p.id !== selected?.id))
      setSelected(null)
      toasts.success('Jugador eliminado exitosamente')
    },
    showErrorToast: true
  })


  useEffect(() => {
    loadPlayers()
  }, [])

  useEffect(() => {
    let cancel = false
    if (!authed) { setUser(null); return }
    authApi.me().then(me => { if (!cancel && me.user) setUser({ roles: me.user.roles, playerId: me.user.playerId }) }).catch(() => {})
    return () => { cancel = true }
  }, [authed])

  // Sync from URL -> state
  useEffect(() => {
    const sq = searchParams.get('q') || ''
    if (sq !== q) setQ(sq)
    const spos = (searchParams.get('pos') as Position | null) || ''
    if (spos !== pos && (spos === '' || ['HANDLER', 'CUTTER', 'HYBRID'].includes(spos))) {
      setPos(spos as '' | Position)
    }
    const sst = (searchParams.get('st') as Status | null) || ''
    if (sst !== st && (sst === '' || ['ACTIVE', 'INJURED', 'INACTIVE'].includes(sst))) {
      setSt(sst as '' | Status)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Sync state -> URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (pos) params.set('pos', pos)
    if (st) params.set('st', st)
    const next = params.toString()
    const curr = searchParams.toString()
    if (next !== curr) setSearchParams(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pos, st])

  const filtered = useMemo(() => {
    return players.filter(p => {
      const text = `${p.name} ${p.number}`.toLowerCase()
      const okText = text.includes(q.toLowerCase())
      const okPos = !pos || p.position === pos
      const okSt = !st || p.status === st
      return okText && okPos && okSt
    })
  }, [players, q, pos, st])

  const posClass = (p: Position) =>
    p === 'HANDLER' ? 'bg-gradient-to-br from-sky-500 to-cyan-400' :
    p === 'CUTTER' ? 'bg-gradient-to-br from-emerald-500 to-teal-400' :
    'bg-gradient-to-br from-fuchsia-500 to-yellow-300'

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Roster Principal</h2>
        {(user?.roles?.includes('admin')) && (
          <button onClick={() => setCreateOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">+ Agregar Jugador</button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const params: Record<string, string> = {}
                if (q.trim()) params.q = q.trim()
                if (pos) params.pos = pos
                if (st) params.st = st
                setSearchParams(params)
              } else if (e.key === 'Escape') {
                setQ('')
                const params: Record<string, string> = {}
                if (pos) params.pos = pos
                if (st) params.st = st
                setSearchParams(params)
              }
            }}
            placeholder="Buscar jugador..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select value={pos} onChange={e => setPos(e.target.value as '' | Position)} className="px-4 py-2 border rounded-lg">
            <option value=''>Todas las posiciones</option>
            <option value='HANDLER'>Handler</option>
            <option value='CUTTER'>Cutter</option>
            <option value='HYBRID'>Hybrid</option>
          </select>
          <select value={st} onChange={e => setSt(e.target.value as '' | Status)} className="px-4 py-2 border rounded-lg">
            <option value=''>Todos los estados</option>
            <option value='ACTIVE'>Activo</option>
            <option value='INJURED'>Lesionado</option>
            <option value='INACTIVE'>Inactivo</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(p => (
          <button key={p.id} onClick={() => setSelected(p)} className="text-left bg-white rounded-xl shadow-md overflow-hidden hover:-translate-y-0.5 transition-transform">
            <div className={`${posClass(p.position)} p-4 text-white text-center`}>
              <div className="text-lg font-bold">#{p.number}</div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-800 mb-1">{p.name}</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{p.position}</span>
                <span className={`text-xs font-semibold ${badgeColor[p.status]}`}>{p.status}</span>
              </div>
            </div>
          </button>
        ))}

        {loading && <div className="text-gray-600">Cargando...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-gray-600">No hay jugadores que coincidan con el filtro.</div>
        )}
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Modal (placeholder) */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
              <div className="text-lg font-bold">{selected.name} #{selected.number}</div>
              <div className="text-sm opacity-90">{selected.position}</div>
            </div>
            <div className="p-4 space-y-2">
              <div className="text-sm"><span className="text-gray-500">Estado:</span> <span className={`font-semibold ${badgeColor[selected.status]}`}>{selected.status}</span></div>
              {selected.experience && <div className="text-sm"><span className="text-gray-500">Experiencia:</span> {selected.experience}</div>}
              {selected.heightCm && <div className="text-sm"><span className="text-gray-500">Altura:</span> {selected.heightCm} cm</div>}
            </div>
            <div className="p-4 flex gap-2">
              {(user?.roles?.includes('admin') || user?.playerId === selected.id) && (
              <button
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                onClick={() => { setEditOpen(true) }}
              >Editar</button>
              )}
              {(user?.roles?.includes('admin')) && (
              <button
                className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg hover:bg-red-100"
                onClick={() => {
                  if (!selected) return
                  if (!confirm(`¿Eliminar a ${selected.name}?`)) return
                  deletePlayer(selected.id)
                }}
              >Eliminar</button>
              )}
              <button className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200" onClick={() => setSelected(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white p-4">
              <div className="text-lg font-bold">Agregar Jugador</div>
            </div>
            <div className="p-4">
              <PlayerForm
                mode="create"
                initial={null}
                onCancel={() => setCreateOpen(false)}
                onSubmit={(data) => createPlayer(data as any)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setEditOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
              <div className="text-lg font-bold">Editar Jugador</div>
            </div>
            <div className="p-4">
              <PlayerForm
                mode="edit"
                initial={selected}
                onCancel={() => setEditOpen(false)}
                onSubmit={(data) => selected && updatePlayer(selected.id, data as any)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
