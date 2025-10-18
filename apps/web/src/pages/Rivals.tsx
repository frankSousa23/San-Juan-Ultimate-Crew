import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { http, rivalsApi, exportRivalsCsv } from '../lib/api'
import { useToast } from '../components/Toast'
import { useApi } from '../hooks/useApi'
import ConfirmModal from '../components/ConfirmModal'

interface RivalItem {
  id: number
  name: string
  strengths?: string | null
  weaknesses?: string | null
  lastPlayedAt?: string | null
  notes?: string | null
  createdAt: string
}

export default function Rivals() {
  const toasts = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<RivalItem[]>([])
  const [q, setQ] = useState(() => localStorage.getItem('rivals.q') || '')
  const [edit, setEdit] = useState<RivalItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<any>({ name: '', strengths: '', weaknesses: '', lastPlayedAt: '', notes: '' })
  const [limit, setLimit] = useState<number>(() => Number(localStorage.getItem('rivals.limit') || 20))
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => Promise<void> } | null>(null)

  // API hooks
  const { execute: loadRivals, loading, error } = useApi(
    (params: any) => rivalsApi.listPaged(params),
    {
      onSuccess: (data) => {
        setItems(data.items)
        setTotal(data.total)
      },
      showErrorToast: true
    }
  )

  const { execute: createRival } = useApi(
    (payload: any) => http.post('/api/rivals', payload),
    {
      onSuccess: () => {
        setModalOpen(false)
        load()
        toasts.success('Rival creado exitosamente')
      },
      showErrorToast: true
    }
  )

  const { execute: updateRival } = useApi(
    (id: number, payload: any) => http.put(`/api/rivals/${id}`, payload),
    {
      onSuccess: () => {
        setModalOpen(false)
        load()
        toasts.success('Rival actualizado exitosamente')
      },
      showErrorToast: true
    }
  )

  const { execute: deleteRival } = useApi(
    (id: number) => http.delete(`/api/rivals/${id}`),
    {
      onSuccess: () => {
        load()
        toasts.success('Rival eliminado exitosamente')
      },
      showErrorToast: true
    }
  )

  const load = async () => {
    await loadRivals({ q: q || undefined, limit, offset })
  }

  useEffect(() => { load() }, [])
  useEffect(() => { localStorage.setItem('rivals.q', q) }, [q])
  useEffect(() => { localStorage.setItem('rivals.limit', String(limit)) }, [limit])

  // Sync from URL
  useEffect(() => {
    const sq = searchParams.get('q') || ''
    const slimit = parseInt(searchParams.get('limit') || '')
    const spage = parseInt(searchParams.get('page') || '')
    if (sq !== q) setQ(sq)
    if (!Number.isNaN(slimit) && slimit >= 5 && slimit <= 200 && slimit !== limit) setLimit(slimit)
    if (!Number.isNaN(spage) && spage >= 1) {
      const newOffset = (spage - 1) * (Number.isNaN(slimit) ? limit : slimit)
      if (newOffset !== offset) setOffset(newOffset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Seed limit from localStorage if URL lacks it
  useEffect(() => {
    if (!searchParams.get('limit')) {
      const saved = localStorage.getItem('rivals.limit')
      if (saved) {
        const n = parseInt(saved)
        if (!Number.isNaN(n) && n >= 5 && n <= 200) {
          const params = new URLSearchParams(searchParams)
          params.set('limit', String(n))
          params.set('page', '1')
          setSearchParams(params)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload when page size or offset change
  useEffect(() => { load() }, [limit, offset])

  const filtered = useMemo(() => items, [items])

  const openCreate = () => { setEdit(null); setForm({ name: '', strengths: '', weaknesses: '', lastPlayedAt: '', notes: '' }); setModalOpen(true) }
  const openEdit = (it: RivalItem) => { setEdit(it); setForm({ ...it, lastPlayedAt: it.lastPlayedAt ? it.lastPlayedAt.slice(0,10) : '' }); setModalOpen(true) }

  const save = async () => {
    const payload: any = { ...form }
    if (payload.lastPlayedAt) payload.lastPlayedAt = new Date(payload.lastPlayedAt).toISOString(); else payload.lastPlayedAt = null
    
    if (edit) {
      await updateRival(edit.id, payload)
    } else {
      await createRival(payload)
    }
  }

  const remove = async (id: number) => {
    setConfirmState({
      message: '¿Eliminar rival? Esta acción no se puede deshacer.',
      onYes: async () => {
        await deleteRival(id)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Rivales</h2>
        <button onClick={openCreate} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">+ Nuevo Rival</button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 flex items-start justify-between">
          <div className="pr-3">{error}</div>
          <div className="flex gap-2 shrink-0">
            <button className="px-2 py-1 bg-rose-100 rounded" onClick={() => load()}>Reintentar</button>
            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => setError(null)}>Ocultar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 flex gap-3 items-center">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const params: Record<string, string> = {}
              if (q.trim()) params.q = q.trim()
              params.limit = String(limit)
              params.page = '1'
              setOffset(0)
              setSearchParams(params)
            } else if (e.key === 'Escape') {
              setQ('')
              const params: Record<string, string> = { limit: String(limit), page: '1' }
              setOffset(0)
              setSearchParams(params)
            }
          }}
          placeholder="Buscar por nombre"
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <div className="flex gap-2">
          <button onClick={() => {
            const params: Record<string, string> = { limit: String(limit), page: '1' }
            if (q.trim()) params.q = q.trim()
            setOffset(0)
            setSearchParams(params)
            load()
          }} disabled={loading} className="px-3 py-2 rounded-lg bg-indigo-600 text-white">{loading ? 'Cargando…' : 'Aplicar'}</button>
          <button onClick={async () => {
            try {
              const blob = await exportRivalsCsv({ q: q || undefined })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'rivales.csv'
              a.click()
              URL.revokeObjectURL(url)
            } catch (e: any) {
              setError(e?.message || 'No se pudo exportar CSV')
            }
          }} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800">Exportar CSV</button>
          <button onClick={() => {
            setQ(''); setOffset(0); const params: Record<string, string> = { page: '1', limit: '20' }
            setLimit(20); localStorage.removeItem('rivals.limit')
            setSearchParams(params); load()
          }} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800">Limpiar</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-left px-4 py-2">Fortalezas</th>
                <th className="text-left px-4 py-2">Debilidades</th>
                <th className="text-left px-4 py-2">Último encuentro</th>
                <th className="text-left px-4 py-2">Notas</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">{it.name}</td>
                  <td className="px-4 py-2">{it.strengths || ''}</td>
                  <td className="px-4 py-2">{it.weaknesses || ''}</td>
                  <td className="px-4 py-2">{it.lastPlayedAt ? new Date(it.lastPlayedAt).toLocaleDateString() : ''}</td>
                  <td className="px-4 py-2">{it.notes || ''}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button className="text-indigo-700 hover:underline" onClick={() => openEdit(it)}>Editar</button>
                    <button className="text-red-700 hover:underline" onClick={() => remove(it.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Sin rivales.</td></tr>
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
            <select value={limit} onChange={e => {
              const n = Number(e.target.value)
              setLimit(n); setOffset(0)
              localStorage.setItem('rivals.limit', String(n))
              const params = new URLSearchParams(searchParams)
              params.set('limit', String(n))
              params.set('page', '1')
              if (q.trim()) params.set('q', q.trim()); else params.delete('q')
              setSearchParams(params)
            }} className="px-2 py-1 border rounded">
              {[10,20,50,100,200].map(n => <option key={n} value={n}>{n}/página</option>)}
            </select>
            <button disabled={offset === 0} onClick={() => {
              const newOffset = Math.max(0, offset - limit)
              const newPage = Math.floor(newOffset/limit)+1
              setOffset(newOffset)
              const params = new URLSearchParams(searchParams)
              params.set('page', String(newPage))
              params.set('limit', String(limit))
              if (q.trim()) params.set('q', q.trim()); else params.delete('q')
              setSearchParams(params)
            }} className="px-2 py-1 border rounded disabled:opacity-50">Anterior</button>
            <button disabled={offset + items.length >= total} onClick={() => {
              const newOffset = offset + limit
              const newPage = Math.floor(newOffset/limit)+1
              setOffset(newOffset)
              const params = new URLSearchParams(searchParams)
              params.set('page', String(newPage))
              params.set('limit', String(limit))
              if (q.trim()) params.set('q', q.trim()); else params.delete('q')
              setSearchParams(params)
            }} className="px-2 py-1 border rounded disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 text-white p-4">
              <div className="text-lg font-bold">{edit ? 'Editar' : 'Nuevo'} Rival</div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fortalezas</label>
                <input value={form.strengths} onChange={e => setForm((f: any) => ({ ...f, strengths: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Debilidades</label>
                <input value={form.weaknesses} onChange={e => setForm((f: any) => ({ ...f, weaknesses: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Último encuentro</label>
                <input type="date" value={form.lastPlayedAt} onChange={e => setForm((f: any) => ({ ...f, lastPlayedAt: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Notas</label>
                <input value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="p-4 flex gap-2">
              <button onClick={save} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg">Guardar</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

  {/* global toasts via ToastProvider */}
      {confirmState && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={confirmState.message}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => { await confirmState.onYes(); setConfirmState(null) }}
        />
      )}
    </div>
  )
}