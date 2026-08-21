import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { http, playersApi, injuriesApi, exportInjuriesCsv } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from '../components/ConfirmModal'

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
  const toasts = useToast()
  const { hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<InjuryItem[]>([])
  const [players, setPlayers] = useState<{ id: number; name: string; number: number }[]>([])
  const [severity, setSeverity] = useState<'' | InjurySeverity>('')
  const [status, setStatus] = useState<'' | InjuryStatus>('')
  const [playerId, setPlayerId] = useState<number | ''>('')
  const [limit, setLimit] = useState<number>(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [edit, setEdit] = useState<InjuryItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<any>({ playerId: '', type: '', severity: 'MILD', status: 'ACTIVE', startDate: '', endDate: '', description: '' })
  const [detailInjury, setDetailInjury] = useState<InjuryItem | null>(null)
  
  const [confirmState, setConfirmState] = useState<{ message: string; onYes: () => Promise<void> } | null>(null)

  // API hooks
  const { execute: loadInjuries, loading, error: apiError } = useApi(
    (params: any) => injuriesApi.listPaged(params),
    {
      onSuccess: (data) => {
        setItems(data.items)
        setTotal(data.total)
      },
      showErrorToast: true
    }
  )

  const { execute: loadPlayers } = useApi(playersApi.list, {
    onSuccess: (data) => setPlayers(data),
    showErrorToast: true
  })

  const { execute: createInjury } = useApi(
    (payload: any) => http.post('/api/injuries', payload),
    {
      onSuccess: () => {
        setModalOpen(false)
        load()
        toasts.success('Lesión creada exitosamente')
      },
      showErrorToast: true
    }
  )

  const { execute: updateInjury } = useApi(
    (id: number, payload: any) => http.put(`/api/injuries/${id}`, payload),
    {
      onSuccess: () => {
        setModalOpen(false)
        load()
        toasts.success('Lesión actualizada exitosamente')
      },
      showErrorToast: true
    }
  )

  const { execute: deleteInjury } = useApi(
    (id: number) => http.delete(`/api/injuries/${id}`),
    {
      onSuccess: () => {
        load()
        toasts.success('Lesión eliminada exitosamente')
      },
      showErrorToast: true
    }
  )

  const load = async () => {
    await loadInjuries({
      playerId: playerId ? Number(playerId) : undefined,
      severity: severity || undefined,
      status: status || undefined,
      limit, offset,
    })
  }

  useEffect(() => { loadPlayers() }, [])
  useEffect(() => { load() }, [limit, offset])
  useEffect(() => { if (severity) localStorage.setItem('injuries.severity', severity); else localStorage.removeItem('injuries.severity') }, [severity])
  useEffect(() => { if (status) localStorage.setItem('injuries.status', status); else localStorage.removeItem('injuries.status') }, [status])
  useEffect(() => { if (playerId) localStorage.setItem('injuries.playerId', String(playerId)); else localStorage.removeItem('injuries.playerId') }, [playerId])
  useEffect(() => { localStorage.setItem('injuries.limit', String(limit)) }, [limit])

  // Sync state from URL and load when URL params change
  useEffect(() => {
    const pidRaw = searchParams.get('playerId')
    const pid = pidRaw ? Number(pidRaw) : ''
    const sev = (searchParams.get('severity') as InjurySeverity | null) || ''
    const sts = (searchParams.get('status') as InjuryStatus | null) || ''
    const limRaw = searchParams.get('limit')
    const limParsed = limRaw ? parseInt(limRaw, 10) : 20
    const allowed = [10, 20, 50, 100, 200]
    const lim = allowed.includes(limParsed) ? limParsed : 20
    if (playerId !== pid) setPlayerId(pid)
    if (severity !== (sev || '')) setSeverity((sev || '') as any)
    if (status !== (sts || '')) setStatus((sts || '') as any)
    if (limit !== lim) setLimit(lim)
    setOffset(0)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Seed URL from saved preferences on first mount when missing
  useEffect(() => {
    const hasAny = searchParams.get('playerId') || searchParams.get('severity') || searchParams.get('status') || searchParams.get('limit')
    if (hasAny) return
    try {
      const params: Record<string, string> = {}
      const sPid = localStorage.getItem('injuries.playerId')
      const sSev = localStorage.getItem('injuries.severity') as InjurySeverity | null
      const sSts = localStorage.getItem('injuries.status') as InjuryStatus | null
      const sLim = localStorage.getItem('injuries.limit')
      if (sPid) params.playerId = sPid
      if (sSev) params.severity = sSev
      if (sSts) params.status = sSts
      if (sLim && ['10','20','50','100','200'].includes(sLim)) params.limit = sLim
      if (Object.keys(params).length > 0) setSearchParams(params)
      else setSearchParams({ limit: String(limit) })
    } catch {
      setSearchParams({ limit: String(limit) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => items, [items])

  const openCreate = () => { setEdit(null); setForm({ playerId: '', type: '', severity: 'MILD', status: 'ACTIVE', startDate: '', endDate: '', description: '' }); setModalOpen(true) }
  const openEdit = (it: InjuryItem) => { setEdit(it); setForm({ ...it, startDate: it.startDate.slice(0,10), endDate: it.endDate ? it.endDate.slice(0,10) : '' }); setModalOpen(true) }

  const save = async () => {
    const payload: any = { ...form }
    payload.playerId = Number(payload.playerId)
    payload.startDate = new Date(payload.startDate).toISOString()
    if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString(); else payload.endDate = null
    
    if (edit) {
      await updateInjury(edit.id, payload)
    } else {
      await createInjury(payload)
    }
  }

  const remove = async (id: number) => {
    setConfirmState({
      message: '¿Eliminar lesión? Esta acción no se puede deshacer.',
      onYes: async () => {
        await deleteInjury(id)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Lesiones</h2>
        <button onClick={openCreate} className="bg-rose-600 text-white px-4 py-2 rounded-lg whitespace-nowrap">+ Nueva Lesión</button>
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
          <button onClick={() => { 
            setOffset(0); 
            const params: Record<string, string> = {}
            if (playerId) params.playerId = String(playerId)
            if (severity) params.severity = severity
            if (status) params.status = status
            params.limit = String(limit)
            setSearchParams(params)
          }} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg" disabled={loading}>{loading ? 'Cargando…' : 'Aplicar'}</button>
          <button onClick={async () => {
            try {
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
            } catch (e: any) {
              setError(e?.message || 'No se pudo exportar CSV')
            }
          }} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800">Exportar CSV</button>
          <button onClick={() => { 
            setPlayerId(''); setSeverity(''); setStatus(''); setOffset(0); 
            setSearchParams({ limit: String(limit) })
          }} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800">Limpiar</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle sm:px-0">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-2 sm:px-4 py-2">Jugador</th>
                  <th className="text-left px-2 sm:px-4 py-2">Tipo</th>
                  <th className="text-left px-2 sm:px-4 py-2">Gravedad</th>
                  <th className="text-left px-2 sm:px-4 py-2">Estado</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden sm:table-cell">Inicio</th>
                  <th className="text-left px-2 sm:px-4 py-2 hidden md:table-cell">Fin</th>
                  <th className="px-2 sm:px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => (
                  <tr key={it.id} className="border-t hover:bg-gray-50/70 transition-colors">
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                      <button onClick={() => setDetailInjury(it)} className="text-left font-medium text-rose-900 hover:text-rose-600 hover:underline">
                        {it.player ? `#${it.player.number} ${it.player.name}` : `ID: ${it.playerId}`}
                      </button>
                    </td>
                    <td className="px-2 sm:px-4 py-2">{it.type}</td>
                    <td className="px-2 sm:px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        it.severity === 'MILD' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        it.severity === 'MODERATE' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {it.severity === 'MILD' ? 'Leve' : it.severity === 'MODERATE' ? 'Moderada' : 'Grave'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        it.status === 'ACTIVE' ? 'bg-rose-100 text-rose-800' :
                        it.status === 'RECOVERING' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {it.status === 'ACTIVE' ? 'Activa' : it.status === 'RECOVERING' ? 'Recuperación' : 'Resuelta'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap hidden sm:table-cell text-xs text-gray-600">{new Date(it.startDate).toLocaleDateString()}</td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap hidden md:table-cell text-xs text-gray-600">{it.endDate ? new Date(it.endDate).toLocaleDateString() : '-'}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-end">
                        <button onClick={() => setDetailInjury(it)} className="text-xs text-gray-600 hover:text-rose-600 border border-gray-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                          Ver
                        </button>
                        {hasPermission('injuries:manage') && (
                          <>
                            <button className="text-indigo-700 hover:underline text-xs sm:text-sm whitespace-nowrap" onClick={() => openEdit(it)}>Editar</button>
                            <button className="text-red-700 hover:underline text-xs sm:text-sm whitespace-nowrap" onClick={() => remove(it.id)}>Eliminar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Sin registros.</td></tr>
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
              const newLim = Number(e.target.value)
              setLimit(newLim); setOffset(0); 
              const params: Record<string, string> = {}
              if (playerId) params.playerId = String(playerId)
              if (severity) params.severity = severity
              if (status) params.status = status
              params.limit = String(newLim)
              setSearchParams(params)
              try { localStorage.setItem('injuries.limit', String(newLim)) } catch {}
            }} className="px-2 py-1 border rounded text-sm">
              {[10,20,50,100,200].map(n => <option key={n} value={n}>{n}/página</option>)}
            </select>
            <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - limit))} className="px-2 py-1 border rounded disabled:opacity-50 whitespace-nowrap text-sm">Anterior</button>
            <button disabled={offset + items.length >= total} onClick={() => setOffset(o => o + limit)} className="px-2 py-1 border rounded disabled:opacity-50 whitespace-nowrap text-sm">Siguiente</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
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

      {/* Detail Modal */}
      {detailInjury && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailInjury(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-rose-600 to-indigo-700 p-4 text-white flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-90">Reporte de Lesión</div>
                <div className="text-xl font-bold">
                  {detailInjury.type}
                </div>
              </div>
              <button onClick={() => setDetailInjury(null)} className="text-white/80 hover:text-white text-xl font-bold p-1">✕</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="bg-rose-50/50 p-4 rounded-xl flex items-center justify-between border border-rose-100">
                <div>
                  <span className="text-xs text-rose-800/70 block uppercase font-medium">Atleta Afectado</span>
                  <span className="text-lg font-bold text-gray-900">
                    {detailInjury.player ? `#${detailInjury.player.number} ${detailInjury.player.name}` : `ID Atleta: ${detailInjury.playerId}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    detailInjury.status === 'ACTIVE' ? 'bg-rose-100 text-rose-800' :
                    detailInjury.status === 'RECOVERING' ? 'bg-blue-100 text-blue-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {detailInjury.status === 'ACTIVE' ? 'Lesión Activa' : detailInjury.status === 'RECOVERING' ? 'En Recuperación' : 'Resuelta / Alta'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs text-gray-500 block mb-1">Nivel de Gravedad</span>
                  <span className={`font-semibold ${
                    detailInjury.severity === 'SEVERE' ? 'text-rose-600' :
                    detailInjury.severity === 'MODERATE' ? 'text-orange-600' : 'text-amber-600'
                  }`}>
                    {detailInjury.severity === 'MILD' ? 'Leve (Bajo Impacto)' :
                     detailInjury.severity === 'MODERATE' ? 'Moderada (Reposo Parcial)' :
                     'Severa / Grave (Baja Total)'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs text-gray-500 block mb-1">Fecha de Inicio</span>
                  <span className="font-medium text-gray-800">{new Date(detailInjury.startDate).toLocaleDateString()}</span>
                  {detailInjury.endDate && (
                    <span className="text-xs text-gray-500 block mt-0.5">Fin / Alta: {new Date(detailInjury.endDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <span className="text-xs text-gray-500 block mb-1 font-medium">Diagnóstico / Observaciones Clínicas</span>
                <p className="text-gray-800 whitespace-pre-wrap">{detailInjury.description || 'Sin descripción o indicaciones adicionales registradas.'}</p>
              </div>

              <div className="pt-2 flex gap-2">
                {hasPermission('injuries:manage') && (
                  <button
                    onClick={() => {
                      const itemToEdit = detailInjury
                      setDetailInjury(null)
                      openEdit(itemToEdit)
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg font-medium transition"
                  >
                    Editar Lesión
                  </button>
                )}
                <button
                  onClick={() => setDetailInjury(null)}
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
