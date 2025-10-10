import React, { useEffect, useMemo, useState } from 'react'
import { http, playersApi, injuriesApi, exportInjuriesCsv } from '../lib/api'

type InjurySeverity = 'MILD' | 'MODERATE' | 'SEVERE'
type InjuryStatus = 'ACTIVE' | 'RECOVERING' | 'RESOLVED'

interface InjuryItem {
  id: number
  playerId: number
  type: string
  severity: InjurySeverity
  status: InjuryStatus
  startDate: string
  endDate?: string | null
  description?: string | null
  player?: { id: number; name: string; number: number }
}

export default function Injuries() {
  const [items, setItems] = useState<InjuryItem[]>([])
  const [players, setPlayers] = useState<{ id: number; name: string; number: number }[]>([])
  const [severity, setSeverity] = useState<'' | InjurySeverity>(() => (localStorage.getItem('injuries.severity') as InjurySeverity) || '')
  const [status, setStatus] = useState<'' | InjuryStatus>(() => (localStorage.getItem('injuries.status') as InjuryStatus) || '')
  const [playerId, setPlayerId] = useState<number | ''>(() => {
    const v = localStorage.getItem('injuries.playerId')
    return v ? Number(v) : ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState<number>(() => Number(localStorage.getItem('injuries.limit') || 20))
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [edit, setEdit] = useState<InjuryItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<any>({ playerId: '', type: '', severity: 'MILD', status: 'ACTIVE', startDate: '', endDate: '', description: '' })

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const page = await injuriesApi.listPaged({
        playerId: playerId ? Number(playerId) : undefined,
        severity: severity || undefined,
        status: status || undefined,
        limit, offset,
      })
      setItems(page.items); setTotal(page.total)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo cargar lesiones')
    } finally { setLoading(false) }
  }

  useEffect(() => { load(); playersApi.list().then(setPlayers) }, [])
  useEffect(() => { if (severity) localStorage.setItem('injuries.severity', severity); else localStorage.removeItem('injuries.severity') }, [severity])
  useEffect(() => { if (status) localStorage.setItem('injuries.status', status); else localStorage.removeItem('injuries.status') }, [status])
  useEffect(() => { if (playerId) localStorage.setItem('injuries.playerId', String(playerId)); else localStorage.removeItem('injuries.playerId') }, [playerId])
  useEffect(() => { localStorage.setItem('injuries.limit', String(limit)) }, [limit])

  const filtered = useMemo(() => items, [items])

  const openCreate = () => { setEdit(null); setForm({ playerId: '', type: '', severity: 'MILD', status: 'ACTIVE', startDate: '', endDate: '', description: '' }); setModalOpen(true) }
  const openEdit = (it: InjuryItem) => { setEdit(it); setForm({ ...it, startDate: it.startDate.slice(0,10), endDate: it.endDate ? it.endDate.slice(0,10) : '' }); setModalOpen(true) }

  const save = async () => {
    const payload: any = { ...form }
    payload.playerId = Number(payload.playerId)
    payload.startDate = new Date(payload.startDate).toISOString()
    if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString(); else payload.endDate = null
    try {
      if (edit) await http.put(`/api/injuries/${edit.id}`, payload)
      else await http.post('/api/injuries', payload)
      setModalOpen(false); await load()
    } catch (e: any) { alert('Error al guardar: ' + (e?.response?.data?.error || '')) }
  }

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar lesión?')) return
    try { await http.delete(`/api/injuries/${id}`); await load() } catch { alert('No se pudo eliminar') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Lesiones</h2>
        <button onClick={openCreate} className="bg-rose-600 text-white px-4 py-2 rounded-lg">+ Nueva Lesión</button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Jugador</label>
          <select value={playerId} onChange={e => setPlayerId(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border rounded-lg">
            <option value="">Todos</option>
            {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Gravedad</label>
          <select value={severity} onChange={e => setSeverity(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
            <option value="">Todas</option>
            <option value="MILD">Leve</option>
            <option value="MODERATE">Moderada</option>
            <option value="SEVERE">Severa</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Estado</label>
          <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
            <option value="">Todos</option>
            <option value="ACTIVE">Activa</option>
            <option value="RECOVERING">Recuperación</option>
            <option value="RESOLVED">Resuelta</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button onClick={() => { setOffset(0); load() }} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg">Aplicar</button>
          <button onClick={async () => {
            const blob = await exportInjuriesCsv({
              playerId: playerId ? Number(playerId) : undefined,
              severity: severity || undefined,
              status: status || undefined,
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'lesiones.csv'
            a.click()
            URL.revokeObjectURL(url)
          }} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800">Exportar CSV</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Jugador</th>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Gravedad</th>
                <th className="text-left px-4 py-2">Estado</th>
                <th className="text-left px-4 py-2">Inicio</th>
                <th className="text-left px-4 py-2">Fin</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">{it.player ? `#${it.player.number} ${it.player.name}` : it.playerId}</td>
                  <td className="px-4 py-2">{it.type}</td>
                  <td className="px-4 py-2">{it.severity}</td>
                  <td className="px-4 py-2">{it.status}</td>
                  <td className="px-4 py-2">{new Date(it.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{it.endDate ? new Date(it.endDate).toLocaleDateString() : ''}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button className="text-indigo-700 hover:underline" onClick={() => openEdit(it)}>Editar</button>
                    <button className="text-red-700 hover:underline" onClick={() => remove(it.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Sin registros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 flex items-center justify-between text-sm">
          <div>
            {total > 0 && (
              <span className="text-gray-600">Mostrando {Math.min(total, offset + 1)}–{Math.min(total, offset + items.length)} de {total}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setOffset(0); }} className="px-2 py-1 border rounded">
              {[10,20,50,100,200].map(n => <option key={n} value={n}>{n}/página</option>)}
            </select>
            <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - limit))} className="px-2 py-1 border rounded disabled:opacity-50">Anterior</button>
            <button disabled={offset + items.length >= total} onClick={() => setOffset(o => o + limit)} className="px-2 py-1 border rounded disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-rose-600 to-indigo-600 text-white p-4">
              <div className="text-lg font-bold">{edit ? 'Editar' : 'Nueva'} Lesión</div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Jugador</label>
                <select value={form.playerId} onChange={e => setForm((f: any) => ({ ...f, playerId: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Selecciona</option>
                  {players.map(p => <option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo de lesión</label>
                <input value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gravedad</label>
                <select value={form.severity} onChange={e => setForm((f: any) => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="MILD">Leve</option>
                  <option value="MODERATE">Moderada</option>
                  <option value="SEVERE">Severa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Estado</label>
                <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="ACTIVE">Activa</option>
                  <option value="RECOVERING">Recuperación</option>
                  <option value="RESOLVED">Resuelta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Inicio</label>
                <input type="date" value={form.startDate} onChange={e => setForm((f: any) => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fin</label>
                <input type="date" value={form.endDate} onChange={e => setForm((f: any) => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Descripción</label>
                <input value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="p-4 flex gap-2">
              <button onClick={save} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg">Guardar</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}