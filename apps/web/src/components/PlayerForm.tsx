import React, { useEffect, useState } from 'react'
import { CreatePlayerInput, Player, Position, Status, UpdatePlayerInput } from '../types/player'
import { teamsApi, TeamItem } from '../lib/api'

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
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [form, setForm] = useState<any>({
    name: '',
    number: '',
    position: 'HYBRID',
    status: 'ACTIVE',
    heightCm: undefined,
    experience: '',
    category: '',
    teamId: undefined,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    teamsApi.list().then(t => setTeams(t)).catch(() => {})
  }, [])

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm({
        name: initial.name,
        number: initial.number !== undefined && initial.number !== null ? initial.number : '',
        position: initial.position,
        status: initial.status,
        heightCm: initial.heightCm,
        experience: initial.experience ?? '',
        category: initial.category ?? '',
        teamId: initial.teamId ?? undefined,
      })
    } else {
      setForm({ name: '', number: '', position: 'HYBRID', status: 'ACTIVE', heightCm: undefined, experience: '', category: '', teamId: undefined })
    }
  }, [mode, initial])

  const handleChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (form.number === '' || form.number === undefined || form.number === null || isNaN(Number(form.number))) {
        throw new Error('El número dorsal es obligatorio y debe ser un número entero (ej. 0 a 99)')
      }
      const numVal = Number(form.number)
      if (numVal < 0 || numVal > 999) {
        throw new Error('El número dorsal debe estar entre 0 y 999')
      }

      // sanitize numeric fields
      const payload: any = { ...form }
      payload.number = numVal
      if (payload.teamId !== undefined && payload.teamId !== null && payload.teamId !== '') {
        payload.teamId = Number(payload.teamId)
      } else {
        payload.teamId = null
      }
      if (payload.heightCm !== undefined && payload.heightCm !== null && payload.heightCm !== '') {
        payload.heightCm = Number(payload.heightCm)
      }
      if (payload.heightCm === '' || payload.heightCm === null) {
        delete payload.heightCm
      }
      if (mode === 'edit') {
        // Allow partial update: remove unchanged empty strings
        Object.keys(payload).forEach(k => {
          if (payload[k] === '' || payload[k] === undefined) {
            delete payload[k]
          }
        })
      }
      await onSubmit(payload)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al procesar los datos del jugador'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg flex items-start gap-2">
          <span className="text-base leading-none">⚠️</span>
          <span className="flex-1">{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
          <input
            required
            value={form.name || ''}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="Ej. Frank Sousa"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número Dorsal * <span className="text-xs text-gray-500 font-normal">(0 a 99)</span>
          </label>
          <input
            required
            type="number"
            min={0}
            max={999}
            value={form.number ?? ''}
            onChange={e => {
              const val = e.target.value
              handleChange('number', val === '' ? '' : Number(val))
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-semibold"
            placeholder="Ej. 7, 23, 00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Posición Principal</label>
          <select
            value={form.position || 'HYBRID'}
            onChange={e => handleChange('position', e.target.value as Position)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {positionOptions.map(p => (
              <option key={p} value={p}>
                {p === 'HANDLER' ? 'Manejador (Handler)' : p === 'CUTTER' ? 'Cortador (Cutter)' : 'Híbrido (Hybrid)'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado Físico</label>
          <select
            value={form.status || 'ACTIVE'}
            onChange={e => handleChange('status', e.target.value as Status)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {statusOptions.map(s => (
              <option key={s} value={s}>
                {s === 'ACTIVE' ? '🟢 Activo' : s === 'INACTIVE' ? '⚪ Inactivo' : '🔴 Lesionado'}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipo / División Asignada</label>
          <select
            value={form.teamId ?? ''}
            onChange={e => handleChange('teamId', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">-- Agente Libre / Sin equipo fijo --</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-500 mt-1">
            📌 La unicidad de dorsal se aplica por equipo. Varios equipos pueden tener jugadores con el mismo número sin conflicto.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
          <input
            type="number"
            min={0}
            value={form.heightCm ?? ''}
            onChange={e => {
              const val = e.target.value
              handleChange('heightCm', val === '' ? undefined : Number(val) || undefined)
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="175"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <input
            value={form.category ?? ''}
            onChange={e => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="Ej. Open Masculino, Femenino, Mixto"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia / Observaciones</label>
          <input
            value={form.experience ?? ''}
            onChange={e => handleChange('experience', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="Años de juego, logros, roles tácticos..."
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button disabled={submitting} type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 font-medium">
          {mode === 'create' ? 'Crear Jugador' : 'Guardar Cambios'}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
      </div>
    </form>
  )
}
