import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resourcesApi, exportResourcesCsvServer, http } from '../lib/api'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import type { ResourceItem } from '../types/resource'

export default function Resources() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<ResourceItem[]>([])
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
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [preview, setPreview] = useState<ResourceItem | null>(null)
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => Promise<void> } | null>(null)

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return ''
    const units = ['B','KB','MB','GB']
    let b = bytes
    let i = 0
    while (b >= 1024 && i < units.length - 1) { b /= 1024; i++ }
    return `${b.toFixed(1)} ${units[i]}`
  }

  async function load(reset = true, opts?: { q?: string; category?: string; order?: 'createdAtDesc'|'titleAsc'; limit?: number }) {
    setIsLoading(true)
    const qVal = opts?.q ?? q
    const catVal = opts?.category ?? category
    const ordVal = opts?.order ?? sortMode
    const limVal = opts?.limit ?? limit
    const nextOffset = reset ? 0 : offset
    try {
      const { items: page, total } = await resourcesApi.listPaged({ q: qVal, category: catVal || undefined, limit: limVal, offset: nextOffset, order: ordVal })
      setTotal(total)
      setOffset(nextOffset + page.length)
      setItems(prev => (reset ? page : [...prev, ...page]))
      setSelected([])
    } finally {
      setIsLoading(false)
    }
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
      try { setCatOptions(await resourcesApi.categories()) } catch {}
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
    (async () => {
      try {
        const cats = await resourcesApi.categories()
        setCatOptions(cats)
      } catch {}
    })()
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
      <div className="flex items-center gap-2 flex-wrap">
        <input
          className="border rounded px-2 py-1"
          placeholder="Buscar"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={async e => {
            if (e.key === 'Enter') { e.preventDefault(); await applyFilters() }
            if (e.key === 'Escape') { e.preventDefault(); clearFilters() }
          }}
        />
        <input
          list="resource-categories"
          className="border rounded px-2 py-1"
          placeholder="Categoría"
          value={category}
          onChange={e => setCategory(e.target.value)}
          onKeyDown={async e => {
            if (e.key === 'Enter') { e.preventDefault(); await applyFilters() }
            if (e.key === 'Escape') { e.preventDefault(); clearFilters() }
          }}
        />
        <select
          className="border rounded px-2 py-1"
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
          className="px-2 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
          disabled={isLoading}
          onClick={applyFilters}
        >Filtrar</button>
        <button className="px-2 py-1 rounded bg-slate-700 text-white" onClick={async () => {
          const blob = await exportResourcesCsvServer({ q, category: category || undefined, order: sortMode })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'recursos.csv'
          a.click()
          URL.revokeObjectURL(url)
        }}>Exportar CSV</button>
        <button
          className="px-2 py-1 rounded bg-gray-200 text-gray-800"
          onClick={clearFilters}
        >Limpiar filtros</button>
        <button
          className="px-2 py-1 rounded bg-rose-600 text-white disabled:opacity-50"
          disabled={selected.length === 0}
          onClick={async () => {
            const ids = [...selected]
            setConfirmState({
              message: `¿Eliminar ${ids.length} recurso(s)? Esta acción no se puede deshacer.`,
              onYes: async () => { await resourcesApi.bulkDelete(ids); await load() }
            })
          }}
        >Eliminar seleccionados ({selected.length})</button>
        <button
          className="px-2 py-1 rounded bg-gray-200 text-gray-800"
          onClick={() => setSelected(sortedItems.map(i => i.id))}
        >Seleccionar todos</button>
        <button
          className="px-2 py-1 rounded bg-gray-200 text-gray-800"
          onClick={() => setSelected([])}
        >Limpiar selección</button>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h3 className="font-medium mb-2">Nuevo recurso</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} />
          <input list="resource-categories" className="border rounded px-2 py-1" placeholder="Categoría" value={catNew} onChange={e => setCatNew(e.target.value)} />
        </div>
        <div className="mt-2">
          <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={async () => {
            if (!title || !url) return
            await resourcesApi.create({ title, url, description: desc || undefined, category: catNew || undefined })
            setTitle(''); setUrl(''); setDesc(''); setCatNew('');
            await load()
            try { setCatOptions(await resourcesApi.categories()) } catch {}
          }}>Crear</button>
        </div>
      </div>

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
              onUploadProgress: (evt) => {
                if (!evt.total) return
                setUploadPct(Math.round((evt.loaded * 100) / evt.total))
              }
            })
          } catch (err: any) {
            setUploadErr(err?.response?.data?.error || 'Error al subir el archivo')
            return
          }
          form.reset()
          await load()
        }}>
          <input name="title" className="border rounded px-2 py-1" placeholder="Título (opcional)" />
          <input name="description" className="border rounded px-2 py-1" placeholder="Descripción (opcional)" />
          <input name="category" className="border rounded px-2 py-1" placeholder="Categoría (opcional)" />
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
      <datalist id="resource-categories">
        {catOptions.map(c => <option key={c} value={c} />)}
      </datalist>

      {/* Summary + page size selector */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>Mostrando {Math.min(offset, total)} de {total}</div>
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
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded shadow divide-y">
        {sortedItems.map(it => (
          <div key={it.id} className="p-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" checked={selected.includes(it.id)} onChange={() => toggleSelected(it.id)} />
              {editingId === it.id ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
                  <input className="border rounded px-2 py-1" value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="Título" />
                  <input className="border rounded px-2 py-1" value={eUrl} onChange={e => setEUrl(e.target.value)} placeholder="URL" />
                  <input className="border rounded px-2 py-1" value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="Descripción" />
                  <input className="border rounded px-2 py-1" value={eCat} onChange={e => setECat(e.target.value)} placeholder="Categoría" />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    {it.storagePath && it.mimeType?.startsWith('image/') && (
                      <img src={`${http.defaults.baseURL}${it.storagePath}`} alt="thumb" className="w-10 h-10 object-cover rounded" />
                    )}
                    {it.storagePath ? (
                      <div className="font-medium"><a className="text-indigo-600 hover:underline" href={`${http.defaults.baseURL}${it.storagePath}`} target="_blank" rel="noreferrer">{it.title}</a></div>
                    ) : (
                      <div className="font-medium"><a className="text-indigo-600 hover:underline" href={it.url} target="_blank" rel="noreferrer">{it.title}</a></div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {it.category || '—'} · {it.description || ''}
                    {it.storagePath && (
                      <>
                        {' '}· {it.fileName || 'archivo'}{it.size ? ` (${formatBytes(it.size)})` : ''}{it.mimeType ? ` · ${it.mimeType}` : ''}
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
                  <button className="px-2 py-1 rounded bg-emerald-600 text-white" onClick={async () => {
                    await resourcesApi.update(it.id, { title: eTitle, url: eUrl, description: eDesc || undefined, category: eCat || undefined })
                    cancelEdit()
                    await load()
                  }}>Guardar</button>
                </>
              ) : (
                <>
                  {it.storagePath && (
                    <button className="px-2 py-1 rounded bg-gray-200" onClick={() => {
                      const isImg = it.mimeType?.startsWith('image/')
                      const isPdf = (it.mimeType || '').includes('pdf')
                      if (isImg || isPdf) setPreview(it)
                      else window.open(`${http.defaults.baseURL}${it.storagePath}`, '_blank')
                    }}>Vista previa</button>
                  )}
                  <button className="px-2 py-1 rounded bg-gray-200" onClick={async () => {
                    const link = it.storagePath ? `${http.defaults.baseURL}${it.storagePath}` : (it.url || '')
                    if (!link) return
                    try {
                      await navigator.clipboard.writeText(link)
                      setToast('Enlace copiado al portapapeles')
                      setTimeout(() => setToast(null), 1500)
                    } catch {}
                  }}>Copiar enlace</button>
                  <button className="px-2 py-1 rounded bg-gray-200" onClick={() => startEdit(it)}>Editar</button>
                  <button className="px-2 py-1 rounded bg-rose-600 text-white" onClick={async () => {
                    setConfirmState({
                      message: '¿Eliminar este recurso? Esta acción no se puede deshacer.',
                      onYes: async () => { await resourcesApi.remove(it.id); await load() }
                    })
                  }}>Eliminar</button>
                </>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="p-3 text-sm text-gray-500">Sin recursos</div>}
      </div>
      {offset < total && (
        <div className="mt-3">
          <button className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50" disabled={isLoading} onClick={() => load(false)}>Cargar más ({Math.max(total - offset, 0)})</button>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
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

      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setPreview(null)}>
          <div className="bg-white rounded shadow max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="font-medium truncate pr-2">{preview.title}</div>
              <button className="px-2 py-1 rounded bg-gray-200" onClick={() => setPreview(null)}>Cerrar</button>
            </div>
            <div className="p-3">
              {preview.mimeType?.startsWith('image/') ? (
                <img src={`${http.defaults.baseURL}${preview.storagePath}`} alt={preview.title} className="max-w-full h-auto" />
              ) : (preview.mimeType || '').includes('pdf') ? (
                <iframe title="pdf" src={`${http.defaults.baseURL}${preview.storagePath}`} className="w-full h-[70vh] border" />
              ) : (
                <div className="text-sm">
                  Tipo no previsualizable. <a className="text-indigo-600 underline" href={`${http.defaults.baseURL}${preview.storagePath}`} target="_blank" rel="noreferrer">Abrir archivo</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
