import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resourcesApi, exportResourcesCsvServer, http, getAuthToken } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import SystemManualModal from '../components/SystemManualModal'
import { downloadSystemManualPdf } from '../lib/generateManualPdf'
import { RESOURCE_DOCS, generateResourcePdf, downloadResourcePdf } from '../lib/generateResourcePdfs'
import type { ResourceItem } from '../types/resource'

export default function Resources() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<ResourceItem[]>([])
  const [showManualModal, setShowManualModal] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [sortMode, setSortMode] = useState<'createdAtDesc' | 'titleAsc'>('createdAtDesc')
  const [selected, setSelected] = useState<number[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [eTitle, setETitle] = useState('')
  const [eUrl, setEUrl] = useState('')
  const [eDesc, setEDesc] = useState('')
  const [eCat, setECat] = useState('')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [desc, setDesc] = useState('')
  const [catNew, setCatNew] = useState('')
  const [uploadPct, setUploadPct] = useState(0)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(20)
  const [catOptions, setCatOptions] = useState<string[]>([])
  const toasts = useToast()
  const [preview, setPreview] = useState<ResourceItem | null>(null)
  const [generatedPdfBlobUrl, setGeneratedPdfBlobUrl] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => Promise<void> } | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { hasPermission } = useAuth()
  const authed = !!getAuthToken()

  // API hooks
  const { execute: loadResources, loading: isLoading } = useApi(
    (params: any) => resourcesApi.listPaged(params),
    {
      onSuccess: (data) => {
        setTotal(data.total)
        setOffset(data.offset + data.items.length)
        setItems(prev => (data.offset === 0 ? data.items : [...prev, ...data.items]))
        if (data.offset === 0) setSelected([])
      },
      showErrorToast: true
    }
  )

  const { execute: loadCategories } = useApi(resourcesApi.categories, {
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        setCatOptions(Array.from(new Set(data.filter(Boolean))))
      }
    },
    showErrorToast: true
  })

  const { execute: createResource } = useApi(resourcesApi.create, {
    onSuccess: () => {
      setTitle(''); setUrl(''); setDesc(''); setCatNew('');
      load(true)
      loadCategories()
      toasts.success('Recurso creado exitosamente')
    },
    showErrorToast: true
  })

  const { execute: updateResource } = useApi(resourcesApi.update, {
    onSuccess: () => {
      cancelEdit()
      load(true)
      toasts.success('Recurso actualizado exitosamente')
    },
    showErrorToast: true
  })

  const { execute: deleteResource } = useApi(resourcesApi.remove, {
    onSuccess: () => {
      load(true)
      toasts.success('Recurso eliminado exitosamente')
    },
    showErrorToast: true
  })

  const { execute: bulkDeleteResources } = useApi(resourcesApi.bulkDelete, {
    onSuccess: () => {
      load(true)
      toasts.success('Recursos eliminados exitosamente')
    },
    showErrorToast: true
  })

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return ''
    const units = ['B','KB','MB','GB']
    let b = bytes
    let i = 0
    while (b >= 1024 && i < units.length - 1) { b /= 1024; i++ }
    return `${b.toFixed(1)} ${units[i]}`
  }

  async function load(reset = true, opts?: { q?: string; category?: string; order?: 'createdAtDesc'|'titleAsc'; limit?: number }) {
    const qVal = opts?.q ?? q
    const catVal = opts?.category ?? category
    const ordVal = opts?.order ?? sortMode
    const limVal = opts?.limit ?? limit
    const nextOffset = reset ? 0 : offset
    
    await loadResources({ q: qVal, category: catVal || undefined, limit: limVal, offset: nextOffset, order: ordVal })
  }
  const applyFilters = async () => {
    const current = {
      q: searchParams.get('q') ?? '',
      category: searchParams.get('category') ?? '',
      order: searchParams.get('order') ?? 'createdAtDesc',
      limit: searchParams.get('limit') ?? String(limit),
    }
    const next = {
      q: q.trim(),
      category: category.trim(),
      order: sortMode,
      limit: String(limit),
    }
    if (current.q === next.q && current.category === next.category && current.order === next.order && current.limit === next.limit) {
      await load(true)
      loadCategories()
    } else {
      const params: Record<string, string> = {}
      if (next.q) params.q = next.q
      if (next.category) params.category = next.category
      params.order = next.order
      params.limit = next.limit
      setSearchParams(params)
    }
  }
  // Load whenever URL params change, and sync local state from URL
  useEffect(() => {
    const qp = searchParams.get('q') ?? ''
    const cat = searchParams.get('category') ?? ''
    const ord = (searchParams.get('order') === 'titleAsc' ? 'titleAsc' : 'createdAtDesc') as 'createdAtDesc'|'titleAsc'
    const limRaw = searchParams.get('limit')
    const limParsed = limRaw ? parseInt(limRaw, 10) : 20
    const lim = [10, 20, 50].includes(limParsed) ? limParsed : 20
    // Sync UI state from URL
    if (q !== qp) setQ(qp)
    if (category !== cat) setCategory(cat)
    if (sortMode !== ord) setSortMode(ord)
    if (limit !== lim) setLimit(lim)
    // Load using URL values
    load(true, { q: qp, category: cat, order: ord, limit: lim })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Load category suggestions once (and refresh when list changes on filter apply)
  useEffect(() => {
    loadCategories()
  }, [])

  // If URL lacks limit but a saved preference exists, apply it once on mount
  useEffect(() => {
    const hasLimit = !!searchParams.get('limit')
    if (hasLimit) return
    try {
      const saved = localStorage.getItem('resources.limit')
      if (saved && ['10','20','50'].includes(saved)) {
        const params: Record<string, string> = {}
        searchParams.forEach((v, k) => { if (v) params[k] = v })
        params.order = (params.order === 'titleAsc' ? 'titleAsc' : 'createdAtDesc')
        params.limit = saved
        setSearchParams(params)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sortedItems = useMemo(() => items, [items])

  const toggleSelected = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.concat(id))
  }

  const startEdit = (it: ResourceItem) => {
    setEditingId(it.id)
    setETitle(it.title)
    setEUrl(it.url || '')
    setEDesc(it.description || '')
    setECat(it.category || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setETitle(''); setEUrl(''); setEDesc(''); setECat('')
  }

  const clearFilters = () => {
    setQ('')
    setCategory('')
    setSortMode('createdAtDesc')
    setSearchParams({ order: 'createdAtDesc', limit: String(limit) })
  }

  return (
    <div className="space-y-6">
      {/* Tarjeta Destacada: Manual del Usuario y Guía de Operaciones SIGEDIVO (PDF Oficial) */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-2xl shadow-xl border border-blue-900/50 p-5 sm:p-7 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">📘</span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Documento Oficial SIGEDIVO 2026
              </span>
              <span className="text-xs font-semibold text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                PDF Completo
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Manual del Usuario & Guía de Roles y Permisos
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Guía maestra detallada del sistema: matriz de roles (Admin, Capitán, Coach, Tesorero, Jugador, Invitado),
              flujo de aprobación de cuentas y explicación paso a paso de cada módulo con capturas de pantalla.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowManualModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 shadow transition flex items-center justify-center gap-2"
            >
              <span>👁️ Ver Manual Interactivo</span>
            </button>
            <button
              onClick={() => {
                setIsDownloadingPdf(true)
                try {
                  downloadSystemManualPdf()
                  toasts.success('Descargando Manual_Completo_SIGEDIVO_2026.pdf')
                } catch (err) {
                  console.error(err)
                } finally {
                  setTimeout(() => setIsDownloadingPdf(false), 800)
                }
              }}
              disabled={isDownloadingPdf}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>{isDownloadingPdf ? 'Generando PDF...' : '📥 Descargar PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded flex items-center justify-between">
          <div className="text-sm truncate pr-2">{error}</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 rounded bg-gray-200" onClick={() => load(true)}>Reintentar</button>
            <button className="px-2 py-1 rounded bg-gray-200" onClick={() => setError(null)}>Ocultar</button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
        <input
          className="border rounded px-2 py-1 flex-1 sm:flex-initial min-w-[150px]"
          placeholder="Buscar"
          value={q}
          onChange={e => {
            setQ(e.target.value)
            if (debounceTimer) window.clearTimeout(debounceTimer)
            const t = window.setTimeout(() => {
              const params: Record<string, string> = {}
              const qv = e.target.value.trim()
              if (qv) params.q = qv
              if (category.trim()) params.category = category.trim()
              params.order = sortMode
              params.limit = String(limit)
              setSearchParams(params)
            }, 500)
            setDebounceTimer(t)
          }}
          onKeyDown={async e => {
            if (e.key === 'Enter') { e.preventDefault(); await applyFilters() }
            if (e.key === 'Escape') { e.preventDefault(); clearFilters() }
          }}
        />
        <input
          list="resource-categories"
          className="border rounded px-2 py-1 flex-1 sm:flex-initial min-w-[150px]"
          placeholder="Categoría"
          value={category}
          onChange={e => {
            setCategory(e.target.value)
            if (debounceTimer) window.clearTimeout(debounceTimer)
            const t = window.setTimeout(() => {
              const params: Record<string, string> = {}
              if (q.trim()) params.q = q.trim()
              const catv = e.target.value.trim()
              if (catv) params.category = catv
              params.order = sortMode
              params.limit = String(limit)
              setSearchParams(params)
            }, 500)
            setDebounceTimer(t)
          }}
          onKeyDown={async e => {
            if (e.key === 'Enter') { e.preventDefault(); await applyFilters() }
            if (e.key === 'Escape') { e.preventDefault(); clearFilters() }
          }}
        />
        <select
          className="border rounded px-2 py-1 flex-1 sm:flex-initial"
          value={sortMode}
          onChange={e => {
            const nextOrder = (e.target.value as 'createdAtDesc'|'titleAsc')
            setSortMode(nextOrder)
            const params: Record<string, string> = {}
            if (q.trim()) params.q = q.trim()
            if (category.trim()) params.category = category.trim()
            params.order = nextOrder
            params.limit = String(limit)
            setSearchParams(params)
          }}
        >
          <option value="createdAtDesc">Recientes primero</option>
          <option value="titleAsc">Título (A→Z)</option>
        </select>
        <button
          className="px-2 py-1 rounded bg-indigo-600 text-white disabled:opacity-50 whitespace-nowrap"
          disabled={isLoading}
          onClick={applyFilters}
        >Aplicar</button>
        <button className="px-2 py-1 rounded bg-slate-700 text-white whitespace-nowrap" onClick={async () => {
          try {
            const blob = await exportResourcesCsvServer({ q, category: category || undefined, order: sortMode })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'recursos.csv'
            a.click()
            URL.revokeObjectURL(url)
          } catch (err: any) {
            setError(err?.response?.data?.error || 'Error al exportar CSV')
          }
        }}>Exportar CSV</button>
        <button
          className="px-2 py-1 rounded bg-gray-200 text-gray-800 whitespace-nowrap"
          onClick={clearFilters}
        >Limpiar filtros</button>
        <button
          className="px-2 py-1 rounded bg-rose-600 text-white disabled:opacity-50 whitespace-nowrap"
          disabled={selected.length === 0}
          onClick={async () => {
            const ids = [...selected]
            setConfirmState({
              message: `¿Eliminar ${ids.length} recurso(s)? Esta acción no se puede deshacer.`,
              onYes: async () => { await bulkDeleteResources(ids) }
            })
          }}
        >Eliminar seleccionados ({selected.length})</button>
        <button
          className="px-2 py-1 rounded bg-gray-200 text-gray-800 whitespace-nowrap"
          onClick={() => setSelected(sortedItems.map(i => i.id))}
        >Seleccionar todos</button>
        <button
          className="px-2 py-1 rounded bg-gray-200 text-gray-800 whitespace-nowrap"
          onClick={() => setSelected([])}
        >Limpiar selección</button>
      </div>

      {hasPermission('resources:manage') ? (
      <div className="bg-white rounded shadow p-4">
        <h3 className="font-medium mb-2">Nuevo recurso</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} />
          <input list="resource-categories" className="border rounded px-2 py-1" placeholder="Categoría" value={catNew} onChange={e => setCatNew(e.target.value)} />
        </div>
        <div className="mt-2">
          <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={() => {
            if (!title || !url) return
            createResource({ title, url, description: desc || undefined, category: catNew || undefined })
          }}>Crear</button>
        </div>
      </div>
      ) : (
        <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded p-3">
          Inicia sesión para crear recursos y subir archivos.
        </div>
      )}

      {hasPermission('resources:manage') && (
      <div className="bg-white rounded shadow p-4">
        <h3 className="font-medium mb-2">Subir archivo</h3>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-2" onSubmit={async (e) => {
          e.preventDefault()
          const form = e.target as HTMLFormElement
          const fileInput = form.elements.namedItem('file') as HTMLInputElement
          if (!fileInput?.files || fileInput.files.length === 0) return
          const fd = new FormData(form)
          setUploadErr(null)
          setUploadPct(0)
          try {
            await http.post('/api/resources/upload', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
                          })
          } catch (err: any) {
            setUploadErr(err?.response?.data?.error || 'Error al subir el archivo')
            return
          }
          form.reset()
          setUploadPct(0)
          await load()
          toasts.success('Archivo subido')
        }}>
          <input name="title" className="border rounded px-2 py-1" placeholder="Título (opcional)" />
          <input name="description" className="border rounded px-2 py-1" placeholder="Descripción (opcional)" />
          <input name="category" list="resource-categories" className="border rounded px-2 py-1" placeholder="Categoría (opcional)" />
          <input name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/gif,text/plain" className="border rounded px-2 py-1" />
          <div className="md:col-span-4">
            <button type="submit" className="px-3 py-1 rounded bg-indigo-600 text-white">Subir</button>
          </div>
        </form>
        {(uploadPct > 0 && uploadPct < 100) && (
          <div className="mt-2 text-sm text-gray-600">Subiendo… {uploadPct}%</div>
        )}
        {uploadErr && (
          <div className="mt-2 text-sm text-rose-700">{uploadErr}</div>
        )}
  </div>
  )}
      <datalist id="resource-categories">
        {Array.from(new Set(catOptions.filter(Boolean))).map((c, i) => (
          <option key={`cat-opt-${c}-${i}`} value={c} />
        ))}
      </datalist>

      {/* Summary + page size selector */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <div>Mostrando {Math.min(offset, total)} de {total}</div>
          <div className="text-gray-500">Seleccionados: {selected.length}</div>
        </div>
        <div className="flex items-center gap-2">
          <span>Tamaño página</span>
          <select
            className="border rounded px-2 py-1"
            value={limit}
            onChange={e => {
              const newLim = parseInt(e.target.value, 10) || 20
              setLimit(newLim)
              const params: Record<string, string> = {}
              if (q.trim()) params.q = q.trim()
              if (category.trim()) params.category = category.trim()
              params.order = sortMode
              params.limit = String(newLim)
              setSearchParams(params)
              try { localStorage.setItem('resources.limit', String(newLim)) } catch {}
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            type="button"
            className="px-2 py-1 rounded bg-gray-200"
            title="Restaurar tamaño de página por defecto"
            onClick={() => {
              setLimit(20)
              try { localStorage.removeItem('resources.limit') } catch {}
              const params: Record<string, string> = {}
              if (q.trim()) params.q = q.trim()
              if (category.trim()) params.category = category.trim()
              params.order = sortMode
              params.limit = '20'
              setSearchParams(params)
            }}
          >Reiniciar</button>
        </div>
      </div>

      <div className="bg-white rounded shadow divide-y">
        {sortedItems.map(it => {
          const hasBuiltinDoc = !!RESOURCE_DOCS[it.id] || (it.id >= 501 && it.id <= 505)
          const docKey = RESOURCE_DOCS[it.id] ? it.id : (it.id >= 501 && it.id <= 505 ? it.id - 500 : it)
          const hasUrl = Boolean(it.url && it.url !== '#' && it.url.startsWith('http'))

          const handleOpenOrDownload = () => {
            if (docKey) {
              downloadResourcePdf(docKey, it.fileName || `${it.title}.pdf`)
              toasts.success(`Descargando ${it.title}`)
            } else if (it.storagePath) {
              window.open(`${it.storagePath}`, '_blank')
            } else if (hasUrl) {
              window.open(it.url, '_blank')
            } else {
              toasts.info('Recurso informativo del sistema')
            }
          }

          return (
          <div key={it.id} className="p-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" checked={selected.includes(it.id)} onChange={() => toggleSelected(it.id)} />
              {editingId === it.id ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
                  <input className="border rounded px-2 py-1" value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="Título" />
                  <input className="border rounded px-2 py-1" value={eUrl} onChange={e => setEUrl(e.target.value)} placeholder="URL" />
                  <input className="border rounded px-2 py-1" value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="Descripción" />
                  <input list="resource-categories" className="border rounded px-2 py-1" value={eCat} onChange={e => setECat(e.target.value)} placeholder="Categoría" />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    {it.storagePath && it.mimeType?.startsWith('image/') && (
                      <img src={`${it.storagePath}`} alt="thumb" className="w-10 h-10 object-cover rounded" />
                    )}
                    <div className="font-medium">
                      {hasUrl ? (
                        <a className="text-indigo-600 hover:underline" href={it.url} target="_blank" rel="noreferrer">{it.title}</a>
                      ) : it.storagePath ? (
                        <a className="text-indigo-600 hover:underline" href={`${it.storagePath}`} target="_blank" rel="noreferrer">{it.title}</a>
                      ) : (
                        <button type="button" onClick={handleOpenOrDownload} className="text-indigo-600 hover:underline text-left font-medium">
                          {it.title}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {it.category || '—'} · {it.description || ''}
                    {it.fileName && (
                      <>
                        {' '}· <span className="font-mono text-slate-600">{it.fileName}</span>{it.size ? ` (${formatBytes(it.size)})` : ''}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editingId === it.id ? (
                <>
                  <button className="px-2 py-1 rounded bg-gray-200" onClick={cancelEdit}>Cancelar</button>
                  <button className="px-2 py-1 rounded bg-emerald-600 text-white" onClick={() => {
                    updateResource(it.id, { title: eTitle, url: eUrl, description: eDesc || undefined, category: eCat || undefined })
                  }}>Guardar</button>
                </>
              ) : (
                <>
                  {docKey ? (
                    <>
                      <button
                        className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs border border-indigo-200 flex items-center gap-1"
                        onClick={() => {
                          const doc = generateResourcePdf(docKey)
                          const blob = doc.output('blob')
                          const blobUrl = URL.createObjectURL(blob)
                          setGeneratedPdfBlobUrl(blobUrl)
                          setPreview(it)
                        }}
                      >
                        👁️ Ver Documento
                      </button>
                      <button
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm flex items-center gap-1"
                        onClick={() => {
                          downloadResourcePdf(docKey, it.fileName || `${it.title}.pdf`)
                          toasts.success(`Descargando ${it.title}`)
                        }}
                      >
                        📥 Descargar PDF
                      </button>
                    </>
                  ) : it.storagePath ? (
                    <button className="px-2 py-1 rounded bg-gray-200 text-xs" onClick={() => {
                      const isImg = it.mimeType?.startsWith('image/')
                      const isPdf = (it.mimeType || '').includes('pdf')
                      if (isImg || isPdf) setPreview(it)
                      else window.open(`${it.storagePath}`, '_blank')
                    }}>Vista previa</button>
                  ) : null}

                  {hasUrl && (
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1"
                    >
                      🔗 Abrir Enlace
                    </a>
                  )}

                  <button className="px-2 py-1 rounded bg-gray-200 text-xs" onClick={async () => {
                    const link = hasUrl ? it.url : (it.storagePath ? `${it.storagePath}` : window.location.href)
                    if (!link) return
                    try {
                      await navigator.clipboard.writeText(link)
                      toasts.info('Enlace copiado al portapapeles')
                    } catch {}
                  }}>Copiar enlace</button>

                  {hasPermission('resources:manage') && (
                  <>
                  <button className="px-2 py-1 rounded bg-gray-200 text-xs" onClick={() => startEdit(it)}>Editar</button>
                  <button className="px-2 py-1 rounded bg-rose-600 text-white text-xs" onClick={() => {
                    setConfirmState({
                      message: '¿Eliminar este recurso? Esta acción no se puede deshacer.',
                      onYes: async () => { await deleteResource(it.id) }
                    })
                  }}>Eliminar</button>
                  </>
                  )}
                </>
              )}
            </div>
          </div>
          )
        })}
        {items.length === 0 && <div className="p-3 text-sm text-gray-500">Sin recursos</div>}
      </div>
      {offset < total && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50" disabled={isLoading} onClick={() => load(false)}>
              {isLoading ? 'Cargando…' : `Cargar más (${Math.max(total - offset, 0)})`}
            </button>
            <button className="px-3 py-1 rounded bg-gray-200" onClick={() => {
              // Toggle selection for current page items, preserve others
              const pageIds = new Set(sortedItems.map(i => i.id))
              setSelected(prev => {
                const next = new Set(prev)
                pageIds.forEach(id => {
                  if (next.has(id)) next.delete(id); else next.add(id)
                })
                return Array.from(next)
              })
            }}>Invertir selección (página)</button>
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

      {/* Modal del Manual del Sistema Oficial */}
      <SystemManualModal isOpen={showManualModal} onClose={() => setShowManualModal(false)} />

      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => {
          if (generatedPdfBlobUrl) {
            URL.revokeObjectURL(generatedPdfBlobUrl)
            setGeneratedPdfBlobUrl(null)
          }
          setPreview(null)
        }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-900 text-white">
              <div className="font-bold truncate pr-2 flex items-center gap-2">
                <span>📄</span>
                <span>{preview.title}</span>
              </div>
              <button
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
                onClick={() => {
                  if (generatedPdfBlobUrl) {
                    URL.revokeObjectURL(generatedPdfBlobUrl)
                    setGeneratedPdfBlobUrl(null)
                  }
                  setPreview(null)
                }}
              >
                ✕ Cerrar
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-slate-50 flex flex-col items-center justify-center">
              {generatedPdfBlobUrl ? (
                <iframe title="pdf" src={generatedPdfBlobUrl} className="w-full h-[70vh] rounded-lg border shadow-inner bg-white" />
              ) : preview.mimeType?.startsWith('image/') ? (
                <img src={`${preview.storagePath}`} alt={preview.title} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow" />
              ) : (preview.mimeType || '').includes('pdf') ? (
                <iframe title="pdf" src={`${preview.storagePath}`} className="w-full h-[70vh] rounded-lg border shadow-inner bg-white" />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border">
                  <p className="text-base font-semibold text-slate-800 mb-2">Previsualización no disponible directamente</p>
                  <p className="text-sm text-slate-500 mb-4">Puedes abrir o descargar el documento oficial desde el enlace directo:</p>
                  <a
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow transition"
                    href={preview.storagePath ? `${preview.storagePath}` : preview.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    🔗 Abrir recurso externo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
