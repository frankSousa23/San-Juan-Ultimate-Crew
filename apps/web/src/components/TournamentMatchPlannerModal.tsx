import React, { useEffect, useState } from 'react'
import { EventItem, MatchCategory } from '../types/event'
import { teamsApi, rivalsApi, adminUsersApi, TeamItem } from '../lib/api'
import { useToast } from '../hooks/useToast'

interface Props {
  tournament: EventItem
  isOpen: boolean
  editMatch?: EventItem | null
  onClose: () => void
  onSaved: (createdMatch?: EventItem) => void
  onSaveAndAnnotate?: (createdMatch?: EventItem) => void
}

export default function TournamentMatchPlannerModal({
  tournament,
  isOpen,
  editMatch,
  onClose,
  onSaved,
  onSaveAndAnnotate,
}: Props) {
  const toasts = useToast()
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [rivals, setRivals] = useState<any[]>([])
  const [users, setUsers] = useState<Array<{ id: number; email: string; name?: string; roles: string[] }>>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [teamId, setTeamId] = useState<number | null>(null)
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null)
  const [rivalId, setRivalId] = useState<number | null>(null)
  const [matchCategory, setMatchCategory] = useState<MatchCategory>('GROUP_STAGE')
  const [title, setTitle] = useState('')
  const [customTitle, setCustomTitle] = useState(false)
  const [location, setLocation] = useState(tournament.location || 'Cancha 1')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [officialAnnotatorId, setOfficialAnnotatorId] = useState<number | null>(tournament.officialAnnotatorId || null)
  const [isAnnotatorLocked, setIsAnnotatorLocked] = useState(tournament.isAnnotatorLocked || false)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadDependencies()
      initForm()
    }
  }, [isOpen, editMatch, tournament.id])

  const loadDependencies = async () => {
    try {
      const [teamsRes, rivalsRes, usersRes] = await Promise.allSettled([
        teamsApi.list(),
        rivalsApi.list(),
        adminUsersApi.list(),
      ])
      if (teamsRes.status === 'fulfilled' && Array.isArray(teamsRes.value)) setTeams(teamsRes.value)
      if (rivalsRes.status === 'fulfilled' && Array.isArray(rivalsRes.value)) setRivals(rivalsRes.value)
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) setUsers(usersRes.value)
    } catch {
      // ignore
    }
  }

  const initForm = () => {
    if (editMatch) {
      setTeamId(editMatch.teamId || null)
      setAwayTeamId(editMatch.awayTeamId || null)
      setRivalId(editMatch.rivalId || null)
      setMatchCategory(editMatch.matchCategory || 'GROUP_STAGE')
      setTitle(editMatch.title)
      setCustomTitle(true)
      setLocation(editMatch.location || tournament.location || 'Cancha 1')
      setStartsAt(editMatch.startsAt ? editMatch.startsAt.slice(0, 16) : '')
      setEndsAt(editMatch.endsAt ? editMatch.endsAt.slice(0, 16) : '')
      setOfficialAnnotatorId(editMatch.officialAnnotatorId || null)
      setIsAnnotatorLocked(editMatch.isAnnotatorLocked || false)
      setDescription(editMatch.description || '')
    } else {
      // Default: Suggest starting at tournament date
      const defaultDate = tournament.startsAt ? new Date(tournament.startsAt) : new Date()
      // format to YYYY-MM-DDTHH:mm
      const tzOffset = defaultDate.getTimezoneOffset() * 60000
      const localISOTime = new Date(defaultDate.getTime() - tzOffset).toISOString().slice(0, 16)
      const endISOTime = new Date(defaultDate.getTime() - tzOffset + 75 * 60 * 1000).toISOString().slice(0, 16)

      setTeamId(tournament.teamId || null)
      setAwayTeamId(tournament.awayTeamId || null)
      setRivalId(tournament.rivalId || null)
      setMatchCategory('GROUP_STAGE')
      setTitle('')
      setCustomTitle(false)
      setLocation(tournament.location || 'Cancha 1')
      setStartsAt(localISOTime)
      setEndsAt(endISOTime)
      setOfficialAnnotatorId(tournament.officialAnnotatorId || null)
      setIsAnnotatorLocked(tournament.isAnnotatorLocked || false)
      setDescription(`Partido de ${tournament.title}`)
    }
  }

  // Auto-generate title when teams or category change unless customTitle is true
  useEffect(() => {
    if (customTitle && title.trim()) return

    const homeTeam = teams.find(t => t.id === teamId)
    const awayTeam = teams.find(t => t.id === awayTeamId)
    const rival = rivals.find(r => r.id === rivalId)

    const homeName = homeTeam?.name || 'Equipo Local'
    const awayName = awayTeam?.name || rival?.name || 'Equipo Rival'

    const catLabel =
      matchCategory === 'GROUP_STAGE' ? 'Fase de Grupos' :
      matchCategory === 'QUARTER_FINALS' ? 'Cuartos de Final' :
      matchCategory === 'SEMI_FINALS' ? 'Semi-Final' :
      matchCategory === 'FINALS' ? 'Gran Final' :
      matchCategory === 'PLACEMENT' ? 'Posicionamiento' : ''

    const gen = `${homeName} vs ${awayName}${catLabel ? ` (${catLabel})` : ''}`
    setTitle(gen)
  }, [teamId, awayTeamId, rivalId, matchCategory, teams, rivals, customTitle])

  if (!isOpen) return null

  const handleSave = async (andAnnotate = false, keepOpen = false) => {
    if (!title.trim()) {
      toasts.error('Debes indicar un título para el partido')
      return
    }
    if (!startsAt) {
      toasts.error('Debes indicar la fecha y hora de inicio')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: 'MATCH',
        status: editMatch ? editMatch.status : 'UPCOMING',
        location: location.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : new Date(new Date(startsAt).getTime() + 75 * 60 * 1000).toISOString(),
        parentId: tournament.id,
        teamId: teamId ? Number(teamId) : null,
        awayTeamId: awayTeamId ? Number(awayTeamId) : null,
        rivalId: rivalId ? Number(rivalId) : null,
        matchCategory,
        officialAnnotatorId: officialAnnotatorId ? Number(officialAnnotatorId) : null,
        isAnnotatorLocked: Boolean(isAnnotatorLocked),
      }

      let resultMatch: EventItem | undefined

      if (editMatch) {
        const { http } = await import('../lib/api')
        const res = await http.put(`/api/events/${editMatch.id}`, payload)
        resultMatch = res.data?.data || res.data
        toasts.success('Partido actualizado correctamente')
      } else {
        const { http } = await import('../lib/api')
        const res = await http.post('/api/events', payload)
        resultMatch = res.data?.data || res.data
        toasts.success('Partido programado en el torneo con éxito')
      }

      if (andAnnotate && onSaveAndAnnotate && resultMatch) {
        onSaveAndAnnotate(resultMatch)
        onClose()
      } else if (keepOpen) {
        onSaved(resultMatch)
        // Advance starting time by 75 min for next match
        const nextStart = new Date(new Date(startsAt).getTime() + 75 * 60 * 1000)
        const tzOffset = nextStart.getTimezoneOffset() * 60000
        setStartsAt(new Date(nextStart.getTime() - tzOffset).toISOString().slice(0, 16))
        setEndsAt(new Date(nextStart.getTime() - tzOffset + 75 * 60 * 1000).toISOString().slice(0, 16))
        setCustomTitle(false)
      } else {
        onSaved(resultMatch)
        onClose()
      }
    } catch (err: any) {
      toasts.error(err?.message || 'Error al guardar el partido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚔️</span>
            <div>
              <h3 className="text-lg font-bold">
                {editMatch ? 'Editar Partido / Cruce' : 'Planificar Nuevo Partido'}
              </h3>
              <p className="text-xs text-indigo-200">
                Torneo: <span className="font-semibold text-white">{tournament.title}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-indigo-200 hover:text-white text-lg font-bold p-1 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Phase / Match Category Banner */}
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
            <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
              🏆 Etapa / Fase del Cruce:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { k: 'GROUP_STAGE', label: 'Fase Grupos', icon: '🟡' },
                { k: 'QUARTER_FINALS', label: 'Cuartos', icon: '🔵' },
                { k: 'SEMI_FINALS', label: 'Semi-Final', icon: '🟣' },
                { k: 'FINALS', label: 'Gran Final', icon: '🏆' },
                { k: 'PLACEMENT', label: '3er/4to Lugar', icon: '🥉' },
              ].map(cat => (
                <button
                  key={cat.k}
                  type="button"
                  onClick={() => setMatchCategory(cat.k as MatchCategory)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition ${
                    matchCategory === cat.k
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Teams Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                <span>🛡️ Equipo Local (Home)</span>
              </label>
              <select
                value={teamId || ''}
                onChange={e => setTeamId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border rounded-lg bg-white text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="">-- Seleccionar Equipo Local --</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                <span>🛡️ Equipo Visitante / Rival (Away)</span>
              </label>
              <select
                value={awayTeamId || (rivalId ? `rival_${rivalId}` : '')}
                onChange={e => {
                  const val = e.target.value
                  if (val.startsWith('rival_')) {
                    setRivalId(Number(val.replace('rival_', '')))
                    setAwayTeamId(null)
                  } else {
                    setAwayTeamId(val ? Number(val) : null)
                    setRivalId(null)
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg bg-white text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="">-- Seleccionar Equipo Visitante --</option>
                <optgroup label="Equipos del Sistema">
                  {teams.filter(t => t.id !== teamId).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
                {rivals.length > 0 && (
                  <optgroup label="Clubes Rivales Registrados">
                    {rivals.map(r => (
                      <option key={`rival_${r.id}`} value={`rival_${r.id}`}>
                        {r.name} (Rival)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Title and Court */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Título del Partido / Cruce</label>
                <button
                  type="button"
                  onClick={() => setCustomTitle(!customTitle)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 underline"
                >
                  {customTitle ? 'Auto-generar' : 'Personalizar'}
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value)
                  setCustomTitle(true)
                }}
                placeholder="Ej. Warao vs Medusa (Cuartos de Final)"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">📍 Cancha / Campo</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Cancha 1"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
            <div>
              <label className="block text-xs font-bold text-amber-950 mb-1">🕒 Inicio del Partido</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-950 mb-1">⏱️ Fin Estimado</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Mesa Técnica Assignment for this match */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-800">
                📋 Mesa Técnica / Anotador Designado (Opcional)
              </label>
              <span className="text-[10px] text-gray-500">Hereda o especifica para este cruce</span>
            </div>
            <select
              value={officialAnnotatorId || ''}
              onChange={e => setOfficialAnnotatorId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">-- Sin Anotador Exclusivo (Abierto) --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} (${u.email})` : u.email} [{u.roles.join(', ')}]
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="lockMatchAnnotator"
                checked={isAnnotatorLocked}
                onChange={e => setIsAnnotatorLocked(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="lockMatchAnnotator" className="text-xs text-gray-700 cursor-pointer">
                Bloquear anotación de este partido exclusivamente a la Mesa Técnica y Administradores
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Notas / Directrices (Opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Instrucciones para capitanes, reloj de 75 min, límite de puntos a 15, etc..."
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition"
          >
            Cancelar
          </button>

          {!editMatch && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(false, true)}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1"
            >
              <span>➕ Guardar y Planificar Siguiente</span>
            </button>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(true, false)}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <span>🥏 Guardar e Ir a Mesa / Pizarra</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(false, false)}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
          >
            {submitting ? 'Guardando...' : editMatch ? 'Actualizar Partido' : 'Guardar Partido'}
          </button>
        </div>
      </div>
    </div>
  )
}
