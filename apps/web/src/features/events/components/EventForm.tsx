import React, { useEffect, useState } from 'react'
import { CreateEventInput, EventItem, EventStatus, EventType, UpdateEventInput, MatchCategory } from '../../../types/event'
import { rivalsApi } from '../../../lib/api'

type Mode = 'create' | 'edit'

interface Props {
  mode: Mode
  initial?: EventItem | null
  onCancel: () => void
  onSubmit: (data: CreateEventInput | UpdateEventInput) => Promise<void>
  onSubmitAndAnnotate?: (data: CreateEventInput | UpdateEventInput) => Promise<void>
}

const typeOptions: EventType[] = ['TRAINING', 'TOURNAMENT', 'SOCIAL', 'WORKSHOP', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'AMISTOSO', 'MATCH']
const statusOptions: EventStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']
const matchCategoryOptions: MatchCategory[] = ['GROUP_STAGE', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINALS', 'PLACEMENT']

export default function EventForm({ mode, initial, onCancel, onSubmit, onSubmitAndAnnotate }: Props) {
  const [form, setForm] = useState<CreateEventInput | UpdateEventInput>({
    title: '', description: '', type: 'TRAINING', status: 'UPCOMING', location: '', startsAt: '', endsAt: '', isInternalScrimmage: false, rivalId: null, matchCategory: null
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rivals, setRivals] = useState<any[]>([])

  useEffect(() => {
    rivalsApi.list().then(setRivals).catch(() => {})
  }, [])

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm({
        title: initial.title,
        description: initial.description ?? '',
        type: initial.type,
        status: initial.status,
        location: initial.location ?? '',
        startsAt: initial.startsAt ? initial.startsAt.slice(0,16) : '',
        endsAt: initial.endsAt ? initial.endsAt.slice(0,16) : '',
        isInternalScrimmage: initial.isInternalScrimmage ?? false,
        rivalId: initial.rivalId ?? null,
        matchCategory: initial.matchCategory ?? null,
      })
    } else {
      setForm({ title: '', description: '', type: 'TRAINING', status: 'UPCOMING', location: '', startsAt: '', endsAt: '', isInternalScrimmage: false, rivalId: null, matchCategory: null })
    }
  }, [mode, initial])

  const handleChange = <K extends keyof (CreateEventInput & UpdateEventInput)>(
    k: K,
    v: (CreateEventInput & UpdateEventInput)[K]
  ) => setForm(prev => ({ ...prev, [k]: v }))

  const buildPayload = (): CreateEventInput | UpdateEventInput => {
    const payload: CreateEventInput | UpdateEventInput = { ...form }
    if (payload.startsAt) {
      payload.startsAt = new Date(payload.startsAt as string).toISOString()
    }
    if (payload.endsAt) {
      payload.endsAt = new Date(payload.endsAt as string).toISOString()
    }
    if (mode === 'edit') {
      Object.keys(payload).forEach(k => {
        const key = k as keyof typeof payload
        if (payload[key] === '' || payload[key] === undefined) {
          delete (payload as Record<string, unknown>)[key]
        }
      })
    }
    
    // Limpiar campos irrelevantes
    if (payload.type !== 'MATCH' && payload.type !== 'AMISTOSO' && payload.type !== 'TOURNAMENT') {
      payload.rivalId = null
      payload.matchCategory = null
    }
    if (payload.type !== 'TRAINING' && payload.type !== 'MATCH' && payload.type !== 'AMISTOSO' && payload.type !== 'TOURNAMENT') {
      payload.isInternalScrimmage = false
    }

    return payload
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = buildPayload()
      await onSubmit(payload)
    } catch (err) {
      const error = err as Error
      setError(error?.message || 'Error al enviar el formulario')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateAndAnnotate = async () => {
    if (!onSubmitAndAnnotate) return
    setError(null)
    setSubmitting(true)
    try {
      const payload = buildPayload()
      await onSubmitAndAnnotate(payload)
    } catch (err) {
      const error = err as Error
      setError(error?.message || 'Error al enviar el formulario')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Título</label>
          <input value={form.title || ''} onChange={e => handleChange('title', e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="Nombre del evento" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tipo</label>
          <select value={form.type} onChange={e => handleChange('type', e.target.value as EventType)} className="w-full px-3 py-2 border rounded-lg">
            {typeOptions.map(t => (
              <option key={t} value={t}>
                {t === 'TRAINING' ? 'Entrenamiento' :
                 t === 'TOURNAMENT' ? 'Torneo' :
                 t === 'SOCIAL' ? 'Social' :
                 t === 'WORKSHOP' ? 'Taller' :
                 t === 'FULL_DAY_OPEN' ? 'Full Day Open' :
                 t === 'FULL_DAY_MIXTO' ? 'Full Day Mixto' :
                 t === 'AMISTOSO' ? 'Amistoso' :
                 t === 'MATCH' ? 'Partido Oficial' : t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Estado</label>
          <select value={form.status} onChange={e => handleChange('status', e.target.value as EventStatus)} className="w-full px-3 py-2 border rounded-lg">
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Inicio</label>
          <input type="datetime-local" value={form.startsAt || ''} onChange={e => handleChange('startsAt', e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Fin</label>
          <input type="datetime-local" value={form.endsAt || ''} onChange={e => handleChange('endsAt', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Lugar</label>
          <input value={form.location || ''} onChange={e => handleChange('location', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Ubicación" />
        </div>

        {(form.type === 'MATCH' || form.type === 'AMISTOSO' || form.type === 'TOURNAMENT') && (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {form.type === 'AMISTOSO' ? 'Equipo Rival o Amigo (Opcional)' : 'Rival / Oponente'}
              </label>
              <select 
                value={form.rivalId || ''} 
                onChange={e => handleChange('rivalId', e.target.value ? Number(e.target.value) : null)} 
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">{form.type === 'AMISTOSO' ? 'Sin Rival Oficial (o Partido Dividido)' : 'Selecciona un Rival (Opcional)'}</option>
                {rivals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fase / Categoría</label>
              <select 
                value={form.matchCategory || ''} 
                onChange={e => handleChange('matchCategory', e.target.value as MatchCategory)} 
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Ninguna / Partido Regular</option>
                {matchCategoryOptions.map(c => (
                  <option key={c} value={c}>
                    {c === 'GROUP_STAGE' ? 'Fase de Grupos' :
                     c === 'QUARTER_FINALS' ? 'Cuartos de Final' :
                     c === 'SEMI_FINALS' ? 'Semi-Final' :
                     c === 'FINALS' ? 'Final' :
                     c === 'PLACEMENT' ? 'Partido de Posicionamiento' : c}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {(form.type === 'TRAINING' || form.type === 'MATCH' || form.type === 'AMISTOSO' || form.type === 'TOURNAMENT') && (
          <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
            <input 
              type="checkbox" 
              id="scrimmage"
              checked={form.isInternalScrimmage || false} 
              onChange={e => handleChange('isInternalScrimmage', e.target.checked)} 
              className="w-5 h-5 text-amber-600 rounded cursor-pointer"
            />
            <label htmlFor="scrimmage" className="text-sm font-semibold text-gray-800 cursor-pointer">
              Es un Scrimmage Interno / Partido entre Escuadras (Claro vs Oscuro)
              <p className="text-xs text-gray-500 font-normal">Permitirá llevar el marcador y estadísticas entre dos alineaciones de nuestros propios jugadores o equipos divididos en la Pizarra de Anotaciones.</p>
            </label>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Descripción</label>
          <textarea value={form.description || ''} onChange={e => handleChange('description', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Detalles"></textarea>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button disabled={submitting} type="submit" className="flex-1 bg-amber-600 text-white py-2 px-3 rounded-lg hover:bg-amber-700 font-bold text-sm disabled:opacity-60 transition">
          {mode === 'create' ? 'Crear Evento' : 'Guardar Cambios'}
        </button>
        {mode === 'create' && onSubmitAndAnnotate && (
          <button 
            disabled={submitting} 
            type="button" 
            onClick={handleCreateAndAnnotate} 
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-bold text-sm disabled:opacity-60 shadow transition flex items-center justify-center gap-1.5"
          >
            <span>🥏</span>
            <span>Crear y Anotar</span>
          </button>
        )}
        <button type="button" onClick={onCancel} className="px-4 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm transition">
          Cancelar
        </button>
      </div>
    </form>
  )
}
