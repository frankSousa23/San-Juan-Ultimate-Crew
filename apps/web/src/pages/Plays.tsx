import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { playsApi, exportPlaysCsv } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import TacticalBoard, { getTacticalSchemaForPlay } from '../components/TacticalBoard'
import type { PlayItem, PlayCategory } from '../types/plays'

export default function Plays() {
  const toasts = useToast()
  const { hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<PlayItem[]>([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<'' | PlayCategory>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  
  // Selected Play for Interactive Tactical Board
  const [selectedPlay, setSelectedPlay] = useState<PlayItem | null>(null)
  const [viewMode, setViewMode] = useState<'interactive' | 'table'>('interactive')
  const [fullscreenBoard, setFullscreenBoard] = useState(false)

  // Edit / Create modal states
  const [edit, setEdit] = useState<PlayItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<any>({ name: '', category: 'OFFENSE', description: '', diagramUrl: '', content: '' })
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => Promise<void> } | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await playsApi.listPaged({ q: q || undefined, category: category || undefined, limit, offset })
      setItems(page.items)
      setTotal(page.total)

      // Auto-select first play if none selected
      if (page.items.length > 0 && !selectedPlay) {
        setSelectedPlay(page.items[0])
      } else if (page.items.length > 0 && selectedPlay) {
        const stillExists = page.items.find(p => p.id === selectedPlay.id)
        if (stillExists) setSelectedPlay(stillExists)
        else setSelectedPlay(page.items[0])
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo cargar jugadas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [limit, offset])
  useEffect(() => { localStorage.setItem('plays.q', q) }, [q])
  useEffect(() => {
    if (category) localStorage.setItem('plays.category', category)
    else localStorage.removeItem('plays.category')
  }, [category])

  // Sync from URL params
  useEffect(() => {
    const qp = searchParams.get('q') ?? ''
    const cat = (searchParams.get('category') as PlayCategory | null) ?? ''
    const limRaw = searchParams.get('limit')
    const limParsed = limRaw ? parseInt(limRaw, 10) : 20
    const allowed = [10, 20, 50, 100, 200]
    const lim = allowed.includes(limParsed) ? limParsed : 20
    if (q !== qp) setQ(qp)
    if (category !== (cat || '')) setCategory((cat || '') as any)
    if (limit !== lim) setLimit(lim)
    setOffset(0)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    const hasAny = searchParams.get('q') || searchParams.get('category') || searchParams.get('limit')
    if (hasAny) return
    try {
      const params: Record<string, string> = {}
      const savedQ = localStorage.getItem('plays.q') || ''
      const savedCat = (localStorage.getItem('plays.category') as PlayCategory | null) || ''
      const savedLim = localStorage.getItem('plays.limit')
      if (savedQ) params.q = savedQ
      if (savedCat) params.category = savedCat
      if (savedLim && ['10','20','50','100','200'].includes(savedLim)) params.limit = savedLim
      if (Object.keys(params).length > 0) setSearchParams(params)
      else setSearchParams({ limit: String(limit) })
    } catch {
      setSearchParams({ limit: String(limit) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => items, [items])

  const openCreate = () => {
    setEdit(null)
    setForm({ name: '', category: 'OFFENSE', description: '', diagramUrl: '', content: '' })
    setShowPreview(false)
    setPreviewHtml('')
    setModalOpen(true)
  }

  const openEdit = (it: PlayItem) => {
    setEdit(it)
    setForm({
      name: it.name || '',
      category: it.category || 'OFFENSE',
      description: it.description || '',
      diagramUrl: it.diagramUrl || '',
      content: it.content || '',
    })
    setShowPreview(false)
    setPreviewHtml('')
    setModalOpen(true)
  }

  const save = async () => {
    const payload: any = { ...form }
    if (!payload.diagramUrl) payload.diagramUrl = null
    if (!payload.description) payload.description = null
    if (!payload.content) payload.content = null
    try {
      if (edit) {
        await playsApi.update(edit.id, payload)
        toasts.success('Jugada actualizada exitosamente')
      } else {
        await playsApi.create(payload)
        toasts.success('Nueva jugada creada exitosamente')
      }
      setModalOpen(false)
      await load()
    } catch (e: any) {
      setError('Error al guardar: ' + (e?.response?.data?.error || ''))
    }
  }

  const remove = async (id: number) => {
    setConfirmState({
      message: '¿Eliminar jugada? Esta acción no se puede deshacer.',
      onYes: async () => {
        try {
          await playsApi.remove(id)
          await load()
          toasts.success('Jugada eliminada')
          if (selectedPlay?.id === id) {
            setSelectedPlay(items.find(i => i.id !== id) || null)
          }
        } catch {
          setError('No se pudo eliminar')
        }
      }
    })
  }

  const selectCategoryFilter = (cat: '' | PlayCategory) => {
    setCategory(cat)
    setOffset(0)
    const params: Record<string, string> = {}
    if (q.trim()) params.q = q.trim()
    if (cat) params.category = cat
    params.limit = String(limit)
    setSearchParams(params)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Libro de Jugadas & Pizarra Táctica</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Simulador interactivo con animaciones tácticas sincronizadas, transiciones de cortes, desahogos y esquemas defensivos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'interactive' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🥏 Vista Interactiva
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📑 Tabla Detallada
            </button>
          </div>
          {hasPermission('plays:manage') && (
            <button
              onClick={openCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              + Nueva Jugada
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 flex items-start justify-between">
          <div className="pr-3 text-sm">{error}</div>
          <div className="flex gap-2 shrink-0">
            <button className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold" onClick={() => load()}>Reintentar</button>
            <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold" onClick={() => setError(null)}>Ocultar</button>
          </div>
        </div>
      )}

      {/* Quick Category Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => selectCategoryFilter('')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                category === ''
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({total})
            </button>
            <button
              onClick={() => selectCategoryFilter('OFFENSE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                category === 'OFFENSE'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              ⚡ Ofensivas
            </button>
            <button
              onClick={() => selectCategoryFilter('DEFENSE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                category === 'DEFENSE'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              🛡️ Defensivas
            </button>
            <button
              onClick={() => selectCategoryFilter('DRILL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                category === 'DRILL'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              🎯 Drills / Prácticas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const blob = await exportPlaysCsv({ q: q || undefined, category: category || undefined })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'jugadas_tacticas.csv'
                  a.click()
                  URL.revokeObjectURL(url)
                  toasts.success('Archivo CSV exportado exitosamente')
                } catch (e: any) {
                  setError(e?.message || 'No se pudo exportar CSV')
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors border border-gray-200 flex items-center gap-1"
            >
              📥 Exportar CSV
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setOffset(0)
                const params: Record<string, string> = {}
                if (q.trim()) params.q = q.trim()
                if (category) params.category = category
                params.limit = String(limit)
                setSearchParams(params)
              }
            }}
            placeholder="Buscar jugada por nombre (ej: Vertical Stack, Cup, Iso...)"
            className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            onClick={() => {
              setOffset(0)
              const params: Record<string, string> = {}
              if (q.trim()) params.q = q.trim()
              if (category) params.category = category
              params.limit = String(limit)
              setSearchParams(params)
            }}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
          {q && (
            <button
              onClick={() => {
                setQ('')
                setOffset(0)
                const params: Record<string, string> = {}
                if (category) params.category = category
                params.limit = String(limit)
                setSearchParams(params)
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive View Mode */}
      {viewMode === 'interactive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Play Selection Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                Selecciona una Jugada ({filtered.length})
              </h4>
              <span className="text-xs text-gray-400">Click para simular</span>
            </div>

            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filtered.map(it => {
                const isSelected = selectedPlay?.id === it.id
                return (
                  <div
                    key={it.id}
                    onClick={() => setSelectedPlay(it)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white hover:bg-gray-50/80 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              it.category === 'OFFENSE'
                                ? 'bg-amber-100 text-amber-800'
                                : it.category === 'DEFENSE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {it.category === 'OFFENSE' ? '⚡ Ofensiva' : it.category === 'DEFENSE' ? '🛡️ Defensiva' : '🎯 Drill'}
                          </span>
                          {isSelected && (
                            <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                              ACTIVA
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-gray-900 text-sm sm:text-base leading-snug">
                          {it.name}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {it.description || 'Esquema táctico de juego con simulación por fases.'}
                        </p>
                      </div>

                      {hasPermission('plays:manage') && (
                        <div className="flex flex-col gap-1 items-end shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => openEdit(it)}
                            className="text-xs text-indigo-700 hover:text-indigo-900 font-bold px-2 py-1 hover:bg-indigo-100/60 rounded"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => remove(it.id)}
                            className="text-xs text-rose-700 hover:text-rose-900 font-bold px-2 py-1 hover:bg-rose-100/60 rounded"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200">
                  <div className="text-3xl mb-2">🥏</div>
                  <div className="font-bold text-gray-700">No se encontraron jugadas</div>
                  <p className="text-xs text-gray-500 mt-1">Prueba con otro término de búsqueda o categoría.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Tactical Board & Simulation (7 Cols) */}
          <div className="lg:col-span-7">
            {selectedPlay ? (
              <div className="space-y-4">
                <TacticalBoard play={selectedPlay} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200 flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-4xl mb-3">🥏</div>
                <div className="text-lg font-bold text-gray-800">Selecciona una jugada para ver la simulación</div>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Podrás ver la animación interactiva del disco, los cortes de los jugadores y el desglose táctico paso a paso.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table View Mode */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-gray-700">Nombre</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700">Categoría</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-700 hidden md:table-cell">Descripción</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-700">Pizarra Táctica</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(it => (
                  <tr key={it.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">{it.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          it.category === 'OFFENSE'
                            ? 'bg-amber-100 text-amber-800'
                            : it.category === 'DEFENSE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {it.category === 'OFFENSE' ? 'Ofensiva' : it.category === 'DEFENSE' ? 'Defensiva' : 'Drill'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell max-w-md truncate">
                      {it.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedPlay(it)
                          setViewMode('interactive')
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors inline-flex items-center gap-1"
                      >
                        🥏 Ver Simulación
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission('plays:manage') && (
                          <>
                            <button
                              className="text-indigo-700 hover:text-indigo-900 font-bold text-xs px-2.5 py-1 rounded hover:bg-indigo-50"
                              onClick={() => openEdit(it)}
                            >
                              Editar
                            </button>
                            <button
                              className="text-rose-700 hover:text-rose-900 font-bold text-xs px-2.5 py-1 rounded hover:bg-rose-50"
                              onClick={() => remove(it.id)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Sin jugadas disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
            <div>
              {total > 0 && (
                <span className="text-gray-600 font-medium">
                  Mostrando {Math.min(total, offset + 1)}–{Math.min(total, offset + items.length)} de {total} jugadas
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={limit}
                onChange={e => {
                  const newLim = Number(e.target.value)
                  setLimit(newLim)
                  setOffset(0)
                  const params: Record<string, string> = {}
                  if (q.trim()) params.q = q.trim()
                  if (category) params.category = category
                  params.limit = String(newLim)
                  setSearchParams(params)
                  try { localStorage.setItem('plays.limit', String(newLim)) } catch {}
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white"
              >
                {[10, 20, 50, 100, 200].map(n => (
                  <option key={n} value={n}>{n} por página</option>
                ))}
              </select>
              <button
                disabled={offset === 0}
                onClick={() => setOffset(o => Math.max(0, o - limit))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 text-xs font-bold bg-white hover:bg-gray-100 transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={offset + items.length >= total}
                onClick={() => setOffset(o => o + limit)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 text-xs font-bold bg-white hover:bg-gray-100 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Play Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-700 to-blue-800 text-white p-5 flex items-center justify-between">
              <div className="text-lg font-black">{edit ? 'Editar' : 'Nueva'} Jugada Táctica</div>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white text-lg font-bold">✕</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1">Nombre de la Jugada</label>
                <input
                  value={form.name || ''}
                  onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Vertical Stack con Desahogo Rápido"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1">Categoría</label>
                  <select
                    value={form.category || 'OFFENSE'}
                    onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="OFFENSE">⚡ Ofensiva</option>
                    <option value="DEFENSE">🛡️ Defensiva</option>
                    <option value="DRILL">🎯 Drill / Entrenamiento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1">Diagrama URL (Opcional)</label>
                  <input
                    value={form.diagramUrl || ''}
                    onChange={e => setForm((f: any) => ({ ...f, diagramUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1">Descripción Breve</label>
                <textarea
                  rows={2}
                  value={form.description || ''}
                  onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
                  placeholder="Resumen del objetivo táctico y cuándo utilizar la jugada..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1">Contenido / Guía Detallada (Markdown)</label>
                <textarea
                  rows={4}
                  value={form.content || ''}
                  onChange={e => setForm((f: any) => ({ ...f, content: e.target.value }))}
                  placeholder="### Fases de corte&#10;- Handler con disco amaga al break...&#10;- Cutter del fondo explota al open side..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={async () => {
                      setShowPreview(p => !p)
                      if (!showPreview && form.content) {
                        try {
                          const [{ marked }, { default: DOMPurify }] = await Promise.all([
                            import('marked'),
                            import('dompurify')
                          ])
                          const html = marked.parse(form.content)
                          setPreviewHtml(DOMPurify.sanitize(html as string))
                        } catch {
                          setPreviewHtml(form.content)
                        }
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold"
                  >
                    {showPreview ? 'Ocultar vista previa' : '👁️ Vista previa Markdown'}
                  </button>
                </div>
                {showPreview && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl prose max-w-none text-xs" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={save}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm shadow-sm transition-colors"
              >
                Guardar Jugada
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Interactive Modal if triggered */}
      {fullscreenBoard && selectedPlay && (
        <div className="fixed inset-0 bg-black/80 z-50 p-4 sm:p-6 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            <TacticalBoard play={selectedPlay} onClose={() => setFullscreenBoard(false)} isModal={true} />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmState && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={confirmState.message}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            await confirmState.onYes()
            setConfirmState(null)
          }}
        />
      )}
    </div>
  )
}
