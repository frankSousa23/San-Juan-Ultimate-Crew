import React, { useEffect, useState } from 'react'
import { CreateEventInput, EventItem, EventStatus, EventType, UpdateEventInput, MatchCategory } from '../../../types/event'
import { rivalsApi, eventsApi, adminUsersApi, teamsApi, TeamItem } from '../../../lib/api'

type Mode = 'create' | 'edit'

interface Props {
  mode: Mode
  initial?: EventItem | null
  onCancel: () => void
  onSubmit: (data: CreateEventInput | UpdateEventInput) => Promise<void>
  onSubmitAndAnnotate?: (data: CreateEventInput | UpdateEventInput) => Promise<void>
}

const typeOptions: EventType[] = ['TOURNAMENT', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'MATCH', 'AMISTOSO', 'TRAINING', 'SOCIAL', 'WORKSHOP']
const statusOptions: EventStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']
const matchCategoryOptions: MatchCategory[] = ['GROUP_STAGE', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINALS', 'PLACEMENT']

interface CategoryPreset {
  label: string
  type: EventType
  titlePrefix: string
  isInternalScrimmage?: boolean
  description: string
  color: string
}

const OFFICIAL_PRESETS: CategoryPreset[] = [
  { label: '🏆 Torneo Open Masc', type: 'TOURNAMENT', titlePrefix: 'Torneo Open Masculino', description: 'Torneo oficial categoría Open Masculino con mesa técnica y fixture.', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { label: '🏆 Torneo Open Fem', type: 'TOURNAMENT', titlePrefix: 'Torneo Open Femenino', description: 'Torneo oficial categoría Open Femenino con mesa técnica y fixture.', color: 'bg-pink-50 text-pink-800 border-pink-200' },
  { label: '🏆 Torneo Mixto', type: 'TOURNAMENT', titlePrefix: 'Torneo Mixto', description: 'Torneo oficial categoría Mixta (Femenino + Masculino).', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { label: '⚡ Full Day Open Masc', type: 'FULL_DAY_OPEN', titlePrefix: 'Full Day Open Masculino', description: 'Jornada intensiva de partidos categoría Open Masculino.', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  { label: '⚡ Full Day Open Fem', type: 'FULL_DAY_OPEN', titlePrefix: 'Full Day Open Femenino', description: 'Jornada intensiva de partidos categoría Open Femenino.', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  { label: '⚡ Full Day Mixto', type: 'FULL_DAY_MIXTO', titlePrefix: 'Full Day Mixto', description: 'Jornada intensiva de partidos categoría Mixta.', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { label: '🤝 Amistoso Interclub', type: 'AMISTOSO', titlePrefix: 'Amistoso vs ', description: 'Partido amistoso de fogueo interclubes.', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { label: '🥏 Caimanera Interno', type: 'TRAINING', titlePrefix: 'Caimanera Interno', isInternalScrimmage: true, description: 'Partido de práctica entre escuadras internas (Claro vs Oscuro). Anotación rápida habilitada para cualquier jugador.', color: 'bg-amber-50 text-amber-800 border-amber-200' },
]

export default function EventForm({ mode, initial, onCancel, onSubmit, onSubmitAndAnnotate }: Props) {
  const [form, setForm] = useState<CreateEventInput | UpdateEventInput>({
    title: '', description: '', type: 'TRAINING', status: 'UPCOMING', location: '', startsAt: '', endsAt: '', isInternalScrimmage: false, rivalId: null, matchCategory: null, parentId: null, officialAnnotatorId: null, isAnnotatorLocked: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rivals, setRivals] = useState<any[]>([])
  const [tournaments, setTournaments] = useState<EventItem[]>([])
  const [users, setUsers] = useState<Array<{ id: number; email: string; name?: string; roles: string[] }>>([])
  const [teams, setTeams] = useState<TeamItem[]>([])

  useEffect(() => {
    rivalsApi.list().then(setRivals).catch(() => {})
    eventsApi.list().then(all => {
      setTournaments(all.filter(e => e.type === 'TOURNAMENT' || e.type === 'FULL_DAY_OPEN' || e.type === 'FULL_DAY_MIXTO'))
    }).catch(() => {})
    adminUsersApi.list().then(setUsers).catch(() => {})
    teamsApi.list().then(setTeams).catch(() => {})
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
        parentId: initial.parentId ?? null,
        officialAnnotatorId: initial.officialAnnotatorId ?? null,
        isAnnotatorLocked: initial.isAnnotatorLocked ?? false,
        teamId: initial.teamId ?? null,
        awayTeamId: initial.awayTeamId ?? null,
      })
    } else {
      setForm({ title: '', description: '', type: 'TRAINING', status: 'UPCOMING', location: '', startsAt: '', endsAt: '', isInternalScrimmage: false, rivalId: null, matchCategory: null, parentId: null, officialAnnotatorId: null, isAnnotatorLocked: false, teamId: null, awayTeamId: null })
    }
  }, [mode, initial])

  const handleChange = <K extends keyof (CreateEventInput & UpdateEventInput)>(
    k: K,
    v: (CreateEventInput & UpdateEventInput)[K]
  ) => setForm(prev => ({ ...prev, [k]: v }))

  const applyPreset = (preset: CategoryPreset) => {
    setForm(prev => ({
      ...prev,
      type: preset.type,
      title: prev.title ? prev.title : preset.titlePrefix,
      description: prev.description ? prev.description : preset.description,
      isInternalScrimmage: preset.isInternalScrimmage ?? false,
    }))
  }

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

  const isMajorEvent = form.type === 'TOURNAMENT' || form.type === 'FULL_DAY_OPEN' || form.type === 'FULL_DAY_MIXTO' || form.type === 'MATCH'

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
      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

      {mode === 'create' && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
            Plantillas Rápidas por Categoría / Evento:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {OFFICIAL_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition shadow-xs hover:opacity-90 ${p.color}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Título del Evento / Partido</label>
          <input 
            value={form.title || ''} 
            onChange={e => handleChange('title', e.target.value)} 
            required 
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 font-medium" 
            placeholder="Ej: Torneo Nacional Open Masculino - Fecha 1, Amistoso vs Caracas Ultimate" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
          <select value={form.type} onChange={e => handleChange('type', e.target.value as EventType)} className="w-full px-3 py-2 border rounded-lg font-medium">
            {typeOptions.map(t => (
              <option key={t} value={t}>
                {t === 'TOURNAMENT' ? '🏆 Torneo Oficial' :
                 t === 'FULL_DAY_OPEN' ? '⚡ Full Day Open' :
                 t === 'FULL_DAY_MIXTO' ? '⚡ Full Day Mixto' :
                 t === 'MATCH' ? '🎯 Partido Oficial' :
                 t === 'AMISTOSO' ? '🤝 Amistoso Interclub' :
                 t === 'TRAINING' ? '🏃 Entrenamiento / Caimanera' :
                 t === 'SOCIAL' ? '🎉 Evento Social' :
                 t === 'WORKSHOP' ? '📚 Taller / Clínica' : t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado / Horario</label>
          <select value={form.status} onChange={e => handleChange('status', e.target.value as EventStatus)} className="w-full px-3 py-2 border rounded-lg font-medium">
            <option value="UPCOMING">🕒 Próximo / Programado</option>
            <option value="ONGOING">🔴 En Curso / En Vivo</option>
            <option value="COMPLETED">✅ Completado / Finalizado</option>
            <option value="CANCELLED">⚠️ Postergado / Cancelado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Inicio</label>
          <input type="datetime-local" value={form.startsAt || ''} onChange={e => handleChange('startsAt', e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Fin (Estimado)</label>
          <input type="datetime-local" value={form.endsAt || ''} onChange={e => handleChange('endsAt', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cancha / Ubicación</label>
          <input value={form.location || ''} onChange={e => handleChange('location', e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Cancha Principal - Polideportivo Simón Bolívar" />
        </div>

        {/* Mesa Técnica Assignment for Important Events */}
        <div className="md:col-span-2 bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>📋 Mesa Técnica & Control Oficial</span>
                {isMajorEvent && (
                  <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    Recomendado para Torneo / Full Day
                  </span>
                )}
              </span>
              <p className="text-xs text-indigo-700 mt-0.5">
                {isMajorEvent 
                  ? 'En eventos importantes, la Mesa Técnica planifica horarios y lleva el control oficial del marcador.'
                  : 'En entrenamientos, amistosos y caimaneras, cualquier jugador o asistente puede anotar directamente.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Responsable de Mesa Técnica (Opcional)</label>
              <select
                value={form.officialAnnotatorId || ''}
                onChange={e => handleChange('officialAnnotatorId', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
              >
                <option value="">-- Sin mesa técnica exclusiva (Abierto) --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name ? `${u.name} (${u.email})` : u.email} [{u.roles.join(', ')}]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-4 sm:pt-0">
              <input
                type="checkbox"
                id="isAnnotatorLocked"
                checked={form.isAnnotatorLocked || false}
                onChange={e => handleChange('isAnnotatorLocked', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="isAnnotatorLocked" className="text-xs font-medium text-gray-700 cursor-pointer">
                Bloquear anotación exclusiva a la Mesa Técnica y Administradores
              </label>
            </div>
          </div>
        </div>

        {/* Selección de Equipos del Ecosistema Beta Multi-Equipo */}
        {(form.type === 'MATCH' || form.type === 'AMISTOSO' || form.type === 'TOURNAMENT') && teams.length > 0 && (
          <div className="md:col-span-2 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 p-4 rounded-xl border border-blue-200">
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              🛡️ Equipos Participantes (Beta Multi-Equipo)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Equipo Local / Principal
                </label>
                <select
                  value={form.teamId || ''}
                  onChange={e => handleChange('teamId', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 font-medium"
                >
                  <option value="">-- Todos / Sin Equipo Principal --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Equipo Visitante / Rival Registrado (Opcional)
                </label>
                <select
                  value={form.awayTeamId || ''}
                  onChange={e => handleChange('awayTeamId', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 font-medium"
                >
                  <option value="">-- Ninguno / Equipo Externo --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Permite a los capitanes y Mesa Técnica de Warao, Medusa, Motherflowers y jugadores libres preparar y filtrar sus nóminas correspondientes.
            </p>
          </div>
        )}

        {(form.type === 'MATCH' || form.type === 'AMISTOSO' || form.type === 'TOURNAMENT') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Fase del Torneo</label>
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
                     c === 'FINALS' ? 'Gran Final' :
                     c === 'PLACEMENT' ? 'Partido de Posicionamiento' : c}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {(form.type === 'MATCH' || form.type === 'AMISTOSO') && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pertenece a Torneo / Full Day (Opcional)</label>
            <select 
              value={form.parentId || ''} 
              onChange={e => handleChange('parentId', e.target.value ? Number(e.target.value) : null)} 
              className="w-full px-3 py-2 border rounded-lg bg-indigo-50/40 text-indigo-900 font-medium"
            >
              <option value="">-- Evento Independiente --</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>🏆 {t.title} ({t.type})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Al vincularlo a un Torneo, aparecerá en el fixture y sumará a la tabla de estadísticas acumuladas del evento.</p>
          </div>
        )}

        {(form.type === 'TRAINING' || form.type === 'MATCH' || form.type === 'AMISTOSO' || form.type === 'TOURNAMENT') && (
          <div className="md:col-span-2 flex items-center gap-3 bg-amber-50/60 p-3 rounded-lg border border-amber-200">
            <input 
              type="checkbox" 
              id="caimanera"
              checked={form.isInternalScrimmage || false} 
              onChange={e => handleChange('isInternalScrimmage', e.target.checked)} 
              className="w-5 h-5 text-amber-600 rounded cursor-pointer"
            />
            <label htmlFor="caimanera" className="text-sm font-semibold text-gray-800 cursor-pointer">
              Es un Caimanera Interno / Partido entre Escuadras (Claro vs Oscuro)
              <p className="text-xs text-gray-500 font-normal">Permitirá llevar el marcador y estadísticas entre dos alineaciones de nuestros propios jugadores en la Pizarra Rápida con acceso para cualquier jugador.</p>
            </label>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas de Contingencia u Horarios</label>
          <textarea 
            value={form.description || ''} 
            onChange={e => handleChange('description', e.target.value)} 
            rows={2}
            className="w-full px-3 py-2 border rounded-lg" 
            placeholder="Detalles del evento, directrices para jugadores, o motivos de reprogramación horaria si aplica..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
        <button disabled={submitting} type="submit" className="flex-1 bg-amber-600 text-white py-2.5 px-4 rounded-lg hover:bg-amber-700 font-bold text-sm disabled:opacity-60 transition shadow">
          {mode === 'create' ? 'Crear Evento' : 'Guardar Cambios'}
        </button>
        {mode === 'create' && onSubmitAndAnnotate && (
          <button 
            disabled={submitting} 
            type="button" 
            onClick={handleCreateAndAnnotate} 
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-bold text-sm disabled:opacity-60 shadow transition flex items-center justify-center gap-1.5"
          >
            <span>🥏</span>
            <span>Crear y Abrir Anotaciones</span>
          </button>
        )}
        <button type="button" onClick={onCancel} className="px-4 bg-gray-100 text-gray-800 py-2.5 rounded-lg hover:bg-gray-200 font-medium text-sm transition">
          Cancelar
        </button>
      </div>
    </form>
  )
}

