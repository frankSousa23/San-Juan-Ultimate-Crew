import React, { useEffect, useState } from 'react'
import { CreateEventInput, EventItem, EventStatus, EventType, UpdateEventInput } from '../types/event'

type Mode = 'create' | 'edit'

interface Props {
  mode: Mode
  initial?: EventItem | null
  onCancel: () => void
  onSubmit: (data: CreateEventInput | UpdateEventInput) => Promise<void>
}

const typeOptions: EventType[] = ['TRAINING', 'TOURNAMENT', 'SOCIAL', 'WORKSHOP']
const statusOptions: EventStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']

export default function EventForm({ mode, initial, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<CreateEventInput | UpdateEventInput>({
    title: '', description: '', type: 'TRAINING', status: 'UPCOMING', location: '', startsAt: '', endsAt: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      })
    } else {
      setForm({ title: '', description: '', type: 'TRAINING', status: 'UPCOMING', location: '', startsAt: '', endsAt: '' })
    }
  }, [mode, initial])

  const handleChange = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload: any = { ...form }
      // Convert datetime-local to ISO for API
      if (payload.startsAt) payload.startsAt = new Date(payload.startsAt).toISOString()
      if (payload.endsAt) payload.endsAt = new Date(payload.endsAt).toISOString()
      if (mode === 'edit') {
        Object.keys(payload).forEach(k => { if (payload[k] === '' || payload[k] === undefined) delete payload[k] })
      }
      await onSubmit(payload)
    } catch (err: any) {
      setError(err?.message || 'Error al enviar el formulario')
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
          <input value={(form as any).title || ''} onChange={e => handleChange('title', e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="Nombre del evento" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tipo</label>
          <select value={(form as any).type} onChange={e => handleChange('type', e.target.value as EventType)} className="w-full px-3 py-2 border rounded-lg">
            {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Estado</label>
          <select value={(form as any).status} onChange={e => handleChange('status', e.target.value as EventStatus)} className="w-full px-3 py-2 border rounded-lg">
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Inicio</label>
          <input type="datetime-local" value={(form as any).startsAt || ''} onChange={e => handleChange('startsAt', e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Fin</label>
          <input type="datetime-local" value={(form as any).endsAt || ''} onChange={e => handleChange('endsAt', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Lugar</label>
          <input value={(form as any).location || ''} onChange={e => handleChange('location', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Ubicación" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Descripción</label>
          <textarea value={(form as any).description || ''} onChange={e => handleChange('description', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Detalles"></textarea>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button disabled={submitting} type="submit" className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 disabled:opacity-60">{mode === 'create' ? 'Crear' : 'Guardar'}</button>
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200">Cancelar</button>
      </div>
    </form>
  )
}
