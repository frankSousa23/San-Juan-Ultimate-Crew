import React, { useEffect, useMemo, useState } from 'react'
import { playsApi, exportPlaysCsv } from '../lib/api'
import type { PlayItem, PlayCategory } from '../types/plays'

export default function Plays() {
  const [items, setItems] = useState<PlayItem[]>([])
  const [q, setQ] = useState(() => localStorage.getItem('plays.q') || '')
  const [category, setCategory] = useState<'' | PlayCategory>(() => (localStorage.getItem('plays.category') as PlayCategory) || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [edit, setEdit] = useState<PlayItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<any>({ name: '', category: 'OFFENSE', description: '', diagramUrl: '', content: '' })
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string>('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const page = await playsApi.listPaged({ q: q || undefined, category: category || undefined, limit, offset })
      setItems(page.items)
      setTotal(page.total)
    } catch (e: any) { setError(e?.response?.data?.error || 'No se pudo cargar jugadas') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { localStorage.setItem('plays.q', q) }, [q])
  useEffect(() => { if (category) localStorage.setItem('plays.category', category); else localStorage.removeItem('plays.category') }, [category])
  const filtered = useMemo(() => items, [items])

  const openCreate = () => { setEdit(null); setForm({ name: '', category: 'OFFENSE', description: '', diagramUrl: '', content: '' }); setModalOpen(true) }
  const openEdit = (it: PlayItem) => { setEdit(it); setForm({ ...it }); setModalOpen(true) }

  const save = async () => {
    const payload: any = { ...form }
    if (!payload.diagramUrl) payload.diagramUrl = null
    if (!payload.description) payload.description = null
    if (!payload.content) payload.content = null
    try {
      if (edit) await playsApi.update(edit.id, payload)
      else await playsApi.create(payload)
      setModalOpen(false); await load()
    } catch (e: any) { alert('Error al guardar: ' + (e?.response?.data?.error || '')) }
  }

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar jugada?')) return
    try { await playsApi.remove(id); await load() } catch { alert('No se pudo eliminar') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Jugadas</h2>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">+ Nueva Jugada</button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre" className="px-3 py-2 border rounded-lg" />
        <select value={category} onChange={e => setCategory(e.target.value as any)} className="px-3 py-2 border rounded-lg">
          <option value="">Todas</option>
          <option value="OFFENSE">Ofensiva</option>
          <option value="DEFENSE">Defensiva</option>
          <option value="DRILL">Drill</option>
        </select>
        <div className="flex gap-2">
          <button onClick={() => { setOffset(0); load() }} className="px-3 py-2 rounded-lg bg-indigo-600 text-white">Aplicar</button>
          <button onClick={async () => {
            const blob = await exportPlaysCsv({ q: q || undefined, category: category || undefined })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'jugadas.csv'
            a.click()
            URL.revokeObjectURL(url)
          }} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800">Exportar CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-left px-4 py-2">Categoría</th>
                <th className="text-left px-4 py-2">Descripción</th>
                <th className="text-left px-4 py-2">Diagrama</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">{it.name}</td>
                  <td className="px-4 py-2">{it.category}</td>
                  <td className="px-4 py-2">{it.description || ''}</td>
                  <td className="px-4 py-2">
                    {it.diagramUrl ? (
                      /\.(png|jpe?g|gif|svg)$/i.test(it.diagramUrl) ? (
                        <a href={it.diagramUrl} target="_blank" rel="noreferrer">
                          <img src={it.diagramUrl} alt={it.name + ' diagrama'} className="h-10 w-auto rounded border" />
                        </a>
                      ) : (
                        <a className="text-indigo-600 underline" href={it.diagramUrl} target="_blank" rel="noreferrer">Ver</a>
                      )
                    ) : ''}
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button className="text-indigo-700 hover:underline" onClick={() => openEdit(it)}>Editar</button>
                    <button className="text-red-700 hover:underline" onClick={() => remove(it.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Sin jugadas.</td></tr>}
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

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white p-4">
              <div className="text-lg font-bold">{edit ? 'Editar' : 'Nueva'} Jugada</div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Categoría</label>
                <select value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="OFFENSE">Ofensiva</option>
                  <option value="DEFENSE">Defensiva</option>
                  <option value="DRILL">Drill</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Diagrama (URL)</label>
                <input value={form.diagramUrl} onChange={e => setForm((f: any) => ({ ...f, diagramUrl: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Descripción</label>
                <input value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Contenido</label>
                <textarea rows={6} value={form.content} onChange={e => setForm((f: any) => ({ ...f, content: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={async () => {
                    setShowPreview(p => !p)
                    if (!showPreview && form.content) {
                      // Lazy import marked and dompurify if available; otherwise show raw content
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
                  }} className="text-indigo-700 hover:underline text-sm">{showPreview ? 'Ocultar vista previa' : 'Vista previa'}</button>
                </div>
                {showPreview && (
                  <div className="mt-2 p-3 border rounded-lg prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                )}
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