import React, { useEffect, useState } from 'react'
import { CreatePlayerInput, Player, Position, Status, UpdatePlayerInput } from '../types/player'

type Mode = 'create' | 'edit'

interface Props {
  mode: Mode
  initial?: Player | null
  onCancel: () => void
  onSubmit: (data: CreatePlayerInput | UpdatePlayerInput) => Promise<void>
}

const positionOptions: Position[] = ['HANDLER', 'CUTTER', 'HYBRID']
const statusOptions: Status[] = ['ACTIVE', 'INJURED', 'INACTIVE']

export default function PlayerForm({ mode, initial, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<CreatePlayerInput | UpdatePlayerInput>({
    name: '',
    number: 0,
    position: 'HYBRID',
    status: 'ACTIVE',
    heightCm: undefined,
    experience: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm({
        name: initial.name,
        number: initial.number,
        position: initial.position,
        status: initial.status,
        heightCm: initial.heightCm,
        experience: initial.experience ?? '',
      })
    } else {
      setForm({ name: '', number: 0, position: 'HYBRID', status: 'ACTIVE', heightCm: undefined, experience: '' })
    }
  }, [mode, initial])

  const handleChange = (key: keyof (CreatePlayerInput & UpdatePlayerInput), value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // sanitize numeric fields
      const payload: any = { ...form }
      if (payload.number !== undefined) payload.number = Number(payload.number)
      if (payload.heightCm !== undefined && payload.heightCm !== null && payload.heightCm !== '') payload.heightCm = Number(payload.heightCm)
      if (payload.heightCm === '') delete payload.heightCm
      if (mode === 'edit') {
        // Allow partial update: remove unchanged empty strings
        Object.keys(payload).forEach(k => {
          if (payload[k] === '' || payload[k] === undefined) delete payload[k]
        })
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
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nombre</label>
          <input
            required
            value={(form as any).name || ''}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Nombre completo"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Número</label>
          <input
            required
            type="number"
            min={0}
            value={(form as any).number ?? ''}
            onChange={e => handleChange('number', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="00"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Posición</label>
          <select
            value={(form as any).position || 'HYBRID'}
            onChange={e => handleChange('position', e.target.value as Position)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {positionOptions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Estado</label>
          <select
            value={(form as any).status || 'ACTIVE'}
            onChange={e => handleChange('status', e.target.value as Status)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {statusOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Altura (cm)</label>
          <input
            type="number"
            min={0}
            value={(form as any).heightCm ?? ''}
            onChange={e => handleChange('heightCm', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="175"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Experiencia</label>
          <input
            value={(form as any).experience ?? ''}
            onChange={e => handleChange('experience', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Años de juego, roles, etc."
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button disabled={submitting} type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60">
          {mode === 'create' ? 'Crear' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200">Cancelar</button>
      </div>
    </form>
  )
}
