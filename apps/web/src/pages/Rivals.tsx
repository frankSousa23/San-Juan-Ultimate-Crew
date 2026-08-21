import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { http, rivalsApi, exportRivalsCsv } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
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

interface RivalStats {
  rival: { id: number; name: string }
  totalAnnotations: number
  eventsCount: number
  statsByType: Record<string, number>
  playerStats: Array<{
    player: { id: number; name: string; number: number }
    goals: number
    assists: number
    interceptions: number
    total: number
  }>
  recentEvents: Array<{
    event: { id: number; title: string; type: string; startsAt: string | null }
    type: string
    timestamp: string
  }>
}

export default function Rivals() {
  const toasts = useToast()
  const { hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<RivalItem[]>([])
  const [q, setQ] = useState(() => localStorage.getItem('rivals.q') || '')
  const [edit, setEdit] = useState<RivalItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<any>({ name: '', strengths: '', weaknesses: '', lastPlayedAt: '', notes: '' })
  const [limit, setLimit] = useState<number>(() => Number(localStorage.getItem('rivals.limit') || 20))
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => Promise<void> } | null>(null)
  const [statsTarget, setStatsTarget] = useState<RivalItem | null>(null)
  const [detailRival, setDetailRival] = useState<RivalItem | null>(null)
  const [stats, setStats] = useState<RivalStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // API hooks
  const { execute: loadRivals, loading, error: apiError } = useApi(
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

  const openStats = async (item: RivalItem) => {
    setStatsTarget(item)
    setStats(null)
    setLoadingStats(true)
    try {
      const data = await rivalsApi.getStats(item.id)
      setStats(data)
    } catch (e: any) {
      toasts.error(e?.message || 'No se pudieron cargar las estadísticas del rival')
      setStatsTarget(null)
    } finally {
      setLoadingStats(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Rivales</h2>
        <button onClick={openCreate} className="bg-emerald-600 text-white px-4 py-2 rounded-lg whitespace-nowrap">+ Nuevo Rival</button>
      </div>

      {(error || apiError) && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 flex items-start justify-between">
          <div className="pr-3">{error || apiError}</div>
          <div className="flex gap-2 shrink-0">
            <button className="px-2 py-1 bg-rose-100 rounded" onClick={() => load()}>Reintentar</button>
            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => setError(null)}>Ocultar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
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
          className="flex-1 px-2 sm:px-3 py-2 border rounded-lg text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => {
            const params: Record<string, string> = { limit: String(limit), page: '1' }
            if (q.trim()) params.q = q.trim()
            setOffset(0)
            setSearchParams(params)
            load()
          }} disabled={loading} className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm whitespace-nowrap">{loading ? 'Cargando…' : 'Aplicar'}</button>
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
          }} className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm whitespace-nowrap">Exportar CSV</button>
          <button onClick={() => {
            setQ(''); setOffset(0); const params: Record<string, string> = { page: '1', limit: '20' }
            setLimit(20); localStorage.removeItem('rivals.limit')
            setSearchParams(params); load()
          }} className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm whitespace-nowrap">Limpiar</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle sm:px-0">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-2 sm:px-4 py-2">Rival</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden md:table-cell">Fortalezas</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden md:table-cell">Debilidades</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden sm:table-cell">Último encuentro</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden lg:table-cell">Notas</th>
                  <th className="px-2 sm:px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => (
                  <tr key={it.id} className="border-t hover:bg-gray-50/70 transition-colors">
                    <td className="px-2 sm:px-4 py-2 font-medium">
                      <button onClick={() => setDetailRival(it)} className="text-left text-indigo-900 hover:text-indigo-600 hover:underline">
                        {it.name}
                      </button>
                    </td>
                    <td className="px-2 sm:px-4 py-2 hidden md:table-cell text-gray-700 max-w-xs truncate">{it.strengths || '-'}</td>
                    <td className="px-2 sm:px-4 py-2 hidden md:table-cell text-gray-700 max-w-xs truncate">{it.weaknesses || '-'}</td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap hidden sm:table-cell text-xs text-gray-600">{it.lastPlayedAt ? new Date(it.lastPlayedAt).toLocaleDateString() : '-'}</td>
                    <td className="px-2 sm:px-4 py-2 hidden lg:table-cell text-gray-500 max-w-xs truncate">{it.notes || '-'}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-end">
                        <button
                          className="text-xs text-gray-600 hover:text-indigo-600 border border-gray-200 rounded px-1.5 py-0.5 whitespace-nowrap"
                          onClick={() => setDetailRival(it)}
                        >
                          Ficha
                        </button>
                        <button
                          className="text-xs text-slate-700 hover:text-indigo-700 border border-slate-200 rounded px-1.5 py-0.5 whitespace-nowrap bg-slate-50"
                          onClick={() => openStats(it)}
                        >
                          Estadísticas
                        </button>
                        {hasPermission('rivals:manage') && (
                          <>
                            <button className="text-indigo-700 hover:underline text-xs sm:text-sm whitespace-nowrap" onClick={() => openEdit(it)}>Editar</button>
                            <button className="text-red-700 hover:underline text-xs sm:text-sm whitespace-nowrap" onClick={() => remove(it.id)}>Eliminar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Sin rivales.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
        <div className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div>
            {total > 0 && (
              <span className="text-gray-600 whitespace-nowrap">Mostrando {Math.min(total, offset + 1)}–{Math.min(total, offset + items.length)} de {total}</span>
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
            }} className="px-2 py-1 border rounded text-sm">
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
            }} className="px-2 py-1 border rounded disabled:opacity-50 whitespace-nowrap text-sm">Anterior</button>
            <button disabled={offset + items.length >= total} onClick={() => {
              const newOffset = offset + limit
              const newPage = Math.floor(newOffset/limit)+1
              setOffset(newOffset)
              const params = new URLSearchParams(searchParams)
              params.set('page', String(newPage))
              params.set('limit', String(limit))
              if (q.trim()) params.set('q', q.trim()); else params.delete('q')
              setSearchParams(params)
            }} className="px-2 py-1 border rounded disabled:opacity-50 whitespace-nowrap text-sm">Siguiente</button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 text-white p-3 sm:p-4">
              <div className="text-base sm:text-lg font-bold">{edit ? 'Editar' : 'Nuevo'} Rival</div>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm text-gray-600 mb-1">Nombre</label>
                <input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1">Fortalezas</label>
                <input value={form.strengths} onChange={e => setForm((f: any) => ({ ...f, strengths: e.target.value }))} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1">Debilidades</label>
                <input value={form.weaknesses} onChange={e => setForm((f: any) => ({ ...f, weaknesses: e.target.value }))} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1">Último encuentro</label>
                <input type="date" value={form.lastPlayedAt} onChange={e => setForm((f: any) => ({ ...f, lastPlayedAt: e.target.value }))} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm text-gray-600 mb-1">Notas</label>
                <input value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
              <button onClick={save} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm sm:text-base">Guardar</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg text-sm sm:text-base">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de estadísticas de rival */}
      {statsTarget && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-2 sm:p-4" onClick={() => { setStatsTarget(null); setStats(null) }}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-base sm:text-lg font-bold">Estadísticas vs {statsTarget.name}</div>
                <div className="text-xs sm:text-sm opacity-80">
                  Resumen de anotaciones registradas en encuentros contra este rival
                </div>
              </div>
              <button
                onClick={() => { setStatsTarget(null); setStats(null) }}
                className="text-xs sm:text-sm px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20"
              >
                Cerrar
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-4">
              {loadingStats && (
                <div className="text-center py-8 text-gray-600 text-sm">
                  Cargando estadísticas...
                </div>
              )}

              {!loadingStats && stats && (
                <>
                  {/* KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-gray-600">Anotaciones totales</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats.totalAnnotations}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-gray-600">Encuentros registrados</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats.eventsCount}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-gray-600">Tipos de anotación</div>
                      <div className="mt-1 text-xs sm:text-sm text-gray-800 space-y-0.5">
                        {Object.keys(stats.statsByType).length === 0 && (
                          <div>Sin datos</div>
                        )}
                        {Object.entries(stats.statsByType).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span>{type}</span>
                            <span className="font-semibold">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tabla de jugadores del rival */}
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="px-3 sm:px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                        Jugadores del rival (según anotaciones registradas)
                      </h3>
                      <span className="text-xs text-gray-500">
                        Total: {stats.playerStats.length}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs sm:text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-2 sm:px-3 py-2">#</th>
                            <th className="text-left px-2 sm:px-3 py-2">Jugador</th>
                            <th className="text-right px-2 sm:px-3 py-2">Goles</th>
                            <th className="text-right px-2 sm:px-3 py-2">Asistencias</th>
                            <th className="text-right px-2 sm:px-3 py-2">Intercepciones</th>
                            <th className="text-right px-2 sm:px-3 py-2 hidden sm:table-cell">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.playerStats.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-4 text-center text-gray-500 text-xs sm:text-sm">
                                No hay jugadores con anotaciones registradas para este rival.
                              </td>
                            </tr>
                          )}
                          {stats.playerStats.map((ps) => (
                            <tr key={ps.player.id} className="border-t hover:bg-gray-50">
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-medium whitespace-nowrap">
                                {ps.player.number}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 truncate max-w-[120px] sm:max-w-none" title={ps.player.name}>
                                {ps.player.name}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right">{ps.goals}</td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right">{ps.assists}</td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right">{ps.interceptions}</td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right hidden sm:table-cell">{ps.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Últimos eventos */}
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="px-3 sm:px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                        Encuentros recientes
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {stats.recentEvents.length === 0 && (
                        <div className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500">
                          No hay encuentros registrados todavía.
                        </div>
                      )}
                      {stats.recentEvents.map((re, idx) => (
                        <div key={idx} className="px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                              {re.event.title}
                            </div>
                            <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-0.5">
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {re.event.type}
                              </span>
                              <span>
                                {new Date(re.timestamp).toLocaleString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            Tipo de anotación: <span className="font-semibold">{re.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rival Scouting Profile Modal */}
      {detailRival && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailRival(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-slate-800 to-indigo-900 p-4 text-white flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-90">Ficha Técnica de Rival</div>
                <div className="text-xl font-bold">{detailRival.name}</div>
              </div>
              <button onClick={() => setDetailRival(null)} className="text-white/80 hover:text-white text-xl font-bold p-1">✕</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block uppercase">Último Encuentro Registrado</span>
                  <span className="font-semibold text-gray-900">
                    {detailRival.lastPlayedAt ? new Date(detailRival.lastPlayedAt).toLocaleDateString() : 'Sin registros previos'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const r = detailRival
                    setDetailRival(null)
                    openStats(r)
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition"
                >
                  Ver Estadísticas
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">💪 Fortalezas Tácticas</span>
                  <p className="text-emerald-950 whitespace-pre-wrap">{detailRival.strengths || 'No se han especificado fortalezas para este rival.'}</p>
                </div>

                <div className="bg-rose-50/60 p-3.5 rounded-lg border border-rose-100">
                  <span className="text-xs font-bold text-rose-800 uppercase block mb-1">🎯 Debilidades a Explotar</span>
                  <p className="text-rose-950 whitespace-pre-wrap">{detailRival.weaknesses || 'No se han especificado debilidades para este rival.'}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase block mb-1">📝 Notas de Scouting / Observaciones</span>
                  <p className="text-slate-800 whitespace-pre-wrap">{detailRival.notes || 'Sin notas adicionales.'}</p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                {hasPermission('rivals:manage') && (
                  <button
                    onClick={() => {
                      const itemToEdit = detailRival
                      setDetailRival(null)
                      openEdit(itemToEdit)
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition"
                  >
                    Editar Rival
                  </button>
                )}
                <button
                  onClick={() => setDetailRival(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition"
                >
                  Cerrar
                </button>
              </div>
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
