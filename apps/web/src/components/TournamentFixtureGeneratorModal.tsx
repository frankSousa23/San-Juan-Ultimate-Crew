import React, { useEffect, useState } from 'react'
import { EventItem, MatchCategory } from '../types/event'
import { teamsApi, rivalsApi, TeamItem, eventsApi } from '../lib/api'
import { useToast } from '../hooks/useToast'

interface Props {
  tournament: EventItem
  isOpen: boolean
  onClose: () => void
  onGenerated: () => void
}

interface MatchCandidate {
  id: string
  homeTeamId?: number | null
  homeTeamName: string
  awayTeamId?: number | null
  awayRivalId?: number | null
  awayTeamName: string
  title: string
  matchCategory: MatchCategory
  location: string
  startsAt: string
  endsAt: string
}

type FixtureSystem = 'ROUND_ROBIN' | 'KNOCKOUT_SEMIS' | 'KNOCKOUT_QUARTERS' | 'DOUBLE_ROUND_ROBIN'

export default function TournamentFixtureGeneratorModal({
  tournament,
  isOpen,
  onClose,
  onGenerated,
}: Props) {
  const toasts = useToast()
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [rivals, setRivals] = useState<any[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([])
  const [selectedRivalIds, setSelectedRivalIds] = useState<number[]>([])
  const [system, setSystem] = useState<FixtureSystem>('ROUND_ROBIN')
  const [matchIntervalMinutes, setMatchIntervalMinutes] = useState<number>(75)
  const [courts, setCourts] = useState<string>('Cancha 1, Cancha 2')
  const [startDate, setStartDate] = useState<string>('')
  const [previewMatches, setPreviewMatches] = useState<MatchCandidate[]>([])
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTeamsAndRivals()
      const defDate = tournament.startsAt ? new Date(tournament.startsAt) : new Date()
      const tzOffset = defDate.getTimezoneOffset() * 60000
      setStartDate(new Date(defDate.getTime() - tzOffset).toISOString().slice(0, 16))
    }
  }, [isOpen, tournament.id])

  const loadTeamsAndRivals = async () => {
    try {
      const [tRes, rRes] = await Promise.allSettled([teamsApi.list(), rivalsApi.list()])
      if (tRes.status === 'fulfilled' && Array.isArray(tRes.value)) {
        setTeams(tRes.value)
        // Select all teams by default
        setSelectedTeamIds(tRes.value.map(t => t.id))
      }
      if (rRes.status === 'fulfilled' && Array.isArray(rRes.value)) {
        setRivals(rRes.value)
      }
    } catch {
      // ignore
    }
  }

  // Toggle selection
  const handleToggleTeam = (id: number) => {
    setSelectedTeamIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleToggleRival = (id: number) => {
    setSelectedRivalIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Build generated matches based on system
  const handleGeneratePreview = () => {
    const activeParticipants: Array<{ id: number; name: string; isRival?: boolean }> = [
      ...teams.filter(t => selectedTeamIds.includes(t.id)).map(t => ({ id: t.id, name: t.name })),
      ...rivals.filter(r => selectedRivalIds.includes(r.id)).map(r => ({ id: r.id, name: `${r.name} (Rival)`, isRival: true })),
    ]

    if (activeParticipants.length < 2) {
      toasts.error('Debes seleccionar al menos 2 equipos para generar los cruces')
      return
    }

    const courtList = courts
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0)
    const activeCourts = courtList.length > 0 ? courtList : ['Cancha 1']

    const baseTime = startDate ? new Date(startDate).getTime() : Date.now()
    const intervalMs = matchIntervalMinutes * 60 * 1000
    const durationMs = Math.max(50, matchIntervalMinutes - 15) * 60 * 1000

    const candidates: MatchCandidate[] = []
    let matchIdx = 0

    const getMatchTime = (index: number) => {
      // If multiple courts, matches can happen simultaneously across courts
      const timeSlot = Math.floor(index / activeCourts.length)
      const courtIdx = index % activeCourts.length
      const start = new Date(baseTime + timeSlot * intervalMs)
      const end = new Date(start.getTime() + durationMs)
      const tzOffset = start.getTimezoneOffset() * 60000
      return {
        startsAt: new Date(start.getTime() - tzOffset).toISOString(),
        endsAt: new Date(end.getTime() - tzOffset).toISOString(),
        location: activeCourts[courtIdx],
      }
    }

    if (system === 'ROUND_ROBIN' || system === 'DOUBLE_ROUND_ROBIN') {
      // Round Robin (all vs all)
      const n = activeParticipants.length
      const rounds = system === 'DOUBLE_ROUND_ROBIN' ? 2 : 1

      for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const home = r === 1 ? activeParticipants[j] : activeParticipants[i]
            const away = r === 1 ? activeParticipants[i] : activeParticipants[j]
            const timeInfo = getMatchTime(matchIdx)
            matchIdx++

            candidates.push({
              id: `match_${r}_${i}_${j}`,
              homeTeamId: home.isRival ? null : home.id,
              homeTeamName: home.name,
              awayTeamId: away.isRival ? null : away.id,
              awayRivalId: away.isRival ? away.id : null,
              awayTeamName: away.name,
              title: `${home.name} vs ${away.name} (Fase de Grupos)`,
              matchCategory: 'GROUP_STAGE',
              location: timeInfo.location,
              startsAt: timeInfo.startsAt,
              endsAt: timeInfo.endsAt,
            })
          }
        }
      }
    } else if (system === 'KNOCKOUT_SEMIS') {
      // 4 teams: 2 Semifinals + Final + 3rd place
      const p = [...activeParticipants]
      while (p.length < 4) {
        p.push({ id: -1, name: `Equipo ${p.length + 1}` })
      }

      // Semi 1
      let timeInfo = getMatchTime(0)
      candidates.push({
        id: 'semi_1',
        homeTeamId: p[0].isRival ? null : p[0].id > 0 ? p[0].id : null,
        homeTeamName: p[0].name,
        awayTeamId: p[3].isRival ? null : p[3].id > 0 ? p[3].id : null,
        awayRivalId: p[3].isRival ? p[3].id : null,
        awayTeamName: p[3].name,
        title: `${p[0].name} vs ${p[3].name} (Semi-Final 1)`,
        matchCategory: 'SEMI_FINALS',
        location: timeInfo.location,
        startsAt: timeInfo.startsAt,
        endsAt: timeInfo.endsAt,
      })

      // Semi 2
      timeInfo = getMatchTime(1)
      candidates.push({
        id: 'semi_2',
        homeTeamId: p[1].isRival ? null : p[1].id > 0 ? p[1].id : null,
        homeTeamName: p[1].name,
        awayTeamId: p[2].isRival ? null : p[2].id > 0 ? p[2].id : null,
        awayRivalId: p[2].isRival ? p[2].id : null,
        awayTeamName: p[2].name,
        title: `${p[1].name} vs ${p[2].name} (Semi-Final 2)`,
        matchCategory: 'SEMI_FINALS',
        location: timeInfo.location,
        startsAt: timeInfo.startsAt,
        endsAt: timeInfo.endsAt,
      })

      // 3er Lugar
      timeInfo = getMatchTime(2)
      candidates.push({
        id: 'placement_3rd',
        homeTeamId: null,
        homeTeamName: 'Perdedor SF1',
        awayTeamId: null,
        awayRivalId: null,
        awayTeamName: 'Perdedor SF2',
        title: 'Perdedor SF1 vs Perdedor SF2 (3er Lugar)',
        matchCategory: 'PLACEMENT',
        location: timeInfo.location,
        startsAt: timeInfo.startsAt,
        endsAt: timeInfo.endsAt,
      })

      // Gran Final
      timeInfo = getMatchTime(3)
      candidates.push({
        id: 'final_1',
        homeTeamId: null,
        homeTeamName: 'Ganador SF1',
        awayTeamId: null,
        awayRivalId: null,
        awayTeamName: 'Ganador SF2',
        title: 'Ganador SF1 vs Ganador SF2 (Gran Final)',
        matchCategory: 'FINALS',
        location: timeInfo.location,
        startsAt: timeInfo.startsAt,
        endsAt: timeInfo.endsAt,
      })
    } else if (system === 'KNOCKOUT_QUARTERS') {
      // 8 teams: 4 Quarters, 2 Semis, Final
      const p = [...activeParticipants]
      while (p.length < 8) {
        p.push({ id: -1, name: `Clasificado ${p.length + 1}` })
      }

      // 4 Quarters
      const pairs = [
        [0, 7],
        [1, 6],
        [2, 5],
        [3, 4],
      ]
      pairs.forEach((pair, idx) => {
        const home = p[pair[0]]
        const away = p[pair[1]]
        const timeInfo = getMatchTime(idx)
        candidates.push({
          id: `quarter_${idx + 1}`,
          homeTeamId: home.isRival ? null : home.id > 0 ? home.id : null,
          homeTeamName: home.name,
          awayTeamId: away.isRival ? null : away.id > 0 ? away.id : null,
          awayRivalId: away.isRival ? away.id : null,
          awayTeamName: away.name,
          title: `${home.name} vs ${away.name} (Cuartos ${idx + 1})`,
          matchCategory: 'QUARTER_FINALS',
          location: timeInfo.location,
          startsAt: timeInfo.startsAt,
          endsAt: timeInfo.endsAt,
        })
      })

      // Semis
      ;[1, 2].forEach(sIdx => {
        const timeInfo = getMatchTime(4 + sIdx - 1)
        candidates.push({
          id: `semi_${sIdx}`,
          homeTeamId: null,
          homeTeamName: `Ganador QF${sIdx * 2 - 1}`,
          awayTeamId: null,
          awayRivalId: null,
          awayTeamName: `Ganador QF${sIdx * 2}`,
          title: `Ganador QF${sIdx * 2 - 1} vs Ganador QF${sIdx * 2} (Semi-Final ${sIdx})`,
          matchCategory: 'SEMI_FINALS',
          location: timeInfo.location,
          startsAt: timeInfo.startsAt,
          endsAt: timeInfo.endsAt,
        })
      })

      // Gran Final
      const finalTime = getMatchTime(6)
      candidates.push({
        id: 'final_1',
        homeTeamId: null,
        homeTeamName: 'Ganador SF1',
        awayTeamId: null,
        awayRivalId: null,
        awayTeamName: 'Ganador SF2',
        title: 'Ganador SF1 vs Ganador SF2 (Gran Final)',
        matchCategory: 'FINALS',
        location: finalTime.location,
        startsAt: finalTime.startsAt,
        endsAt: finalTime.endsAt,
      })
    }

    setPreviewMatches(candidates)
  }

  // Remove candidate
  const handleRemoveCandidate = (id: string) => {
    setPreviewMatches(prev => prev.filter(m => m.id !== id))
  }

  // Update candidate time/court
  const handleUpdateCandidate = (id: string, field: keyof MatchCandidate, val: any) => {
    setPreviewMatches(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: val } : m))
    )
  }

  // Commit all fixtures to API
  const handleSaveFixtures = async () => {
    if (previewMatches.length === 0) {
      toasts.error('Primero genera la vista previa de cruces')
      return
    }

    setSaving(true)
    try {
      const payload = previewMatches.map(m => ({
        title: m.title,
        description: `Partido de ${m.matchCategory} del torneo ${tournament.title}`,
        type: 'MATCH',
        status: 'UPCOMING',
        location: m.location,
        startsAt: new Date(m.startsAt).toISOString(),
        endsAt: new Date(m.endsAt).toISOString(),
        teamId: m.homeTeamId || null,
        awayTeamId: m.awayTeamId || null,
        rivalId: m.awayRivalId || null,
        matchCategory: m.matchCategory,
        officialAnnotatorId: tournament.officialAnnotatorId || null,
        isAnnotatorLocked: tournament.isAnnotatorLocked || false,
      }))

      await eventsApi.createFixtures(tournament.id, payload)
      toasts.success(`¡${previewMatches.length} partidos y cruces programados con éxito!`)
      onGenerated()
      onClose()
    } catch (err: any) {
      toasts.error(err?.message || 'Error al guardar los cruces')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚔️</span>
            <div>
              <h3 className="text-lg font-bold">Generador Automático de Cruces & Fixtures</h3>
              <p className="text-xs text-amber-200">
                Torneo: <span className="font-semibold text-white">{tournament.title}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-200 hover:text-white text-lg font-bold p-1 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Format & Teams Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  1. Formato / Sistema de Competición
                </label>
                <div className="space-y-2">
                  {[
                    {
                      k: 'ROUND_ROBIN',
                      title: '🔄 Todos contra Todos (Round Robin / Grupos)',
                      desc: 'Cada equipo juega contra todos los demás. Ideal para Fase de Grupos y Full Days.',
                    },
                    {
                      k: 'KNOCKOUT_SEMIS',
                      title: '🏆 Cuadro Eliminatorio 4 Equipos (Semis + Final)',
                      desc: 'Genera 2 Semifinales, partido de 3er lugar y Gran Final.',
                    },
                    {
                      k: 'KNOCKOUT_QUARTERS',
                      title: '⚡ Cuadro Eliminatorio 8 Equipos (Cuartos + Semis + Final)',
                      desc: '4 Cuartos de final, 2 Semifinales y Gran Final.',
                    },
                    {
                      k: 'DOUBLE_ROUND_ROBIN',
                      title: '🔁 Todos contra Todos - Ida y Vuelta',
                      desc: 'Doble enfrentamiento entre cada pareja de equipos.',
                    },
                  ].map(sys => (
                    <label
                      key={sys.k}
                      className={`block p-3 rounded-xl border cursor-pointer transition ${
                        system === sys.k
                          ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="fixtureSystem"
                          value={sys.k}
                          checked={system === sys.k}
                          onChange={() => setSystem(sys.k as FixtureSystem)}
                          className="mt-1 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-gray-900">{sys.title}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{sys.desc}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule Parameters */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  2. Configuración de Horarios & Canchas
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      🕒 Fecha/Hora de Inicio
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      ⏱️ Intervalo por Partido
                    </label>
                    <select
                      value={matchIntervalMinutes}
                      onChange={e => setMatchIntervalMinutes(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white font-medium"
                    >
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos (1 hora)</option>
                      <option value={75}>75 minutos (Estándar)</option>
                      <option value={90}>90 minutos (1h 30m)</option>
                      <option value={120}>120 minutos (2 horas)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    📍 Canchas / Campos Disponibles (Separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={courts}
                    onChange={e => setCourts(e.target.value)}
                    placeholder="Cancha 1, Cancha 2"
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white font-medium"
                  />
                  <span className="text-[10px] text-gray-500">
                    Si indicas varias canchas, los partidos se programarán en paralelo.
                  </span>
                </div>
              </div>
            </div>

            {/* Participating Teams Selection */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                    3. Equipos Participantes
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTeamIds.length === teams.length) {
                        setSelectedTeamIds([])
                      } else {
                        setSelectedTeamIds(teams.map(t => t.id))
                      }
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold underline"
                  >
                    {selectedTeamIds.length === teams.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase px-1">Equipos Registrados</div>
                  {teams.map(t => (
                    <label
                      key={t.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                        selectedTeamIds.includes(t.id)
                          ? 'bg-amber-100/70 border-amber-300 text-amber-950'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(t.id)}
                        onChange={() => handleToggleTeam(t.id)}
                        className="rounded text-amber-600"
                      />
                      <span
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: t.color || '#3B82F6' }}
                      />
                      <span>{t.name}</span>
                    </label>
                  ))}

                  {rivals.length > 0 && (
                    <>
                      <div className="text-[10px] font-bold text-slate-500 uppercase px-1 pt-2">Clubes Rivales</div>
                      {rivals.map(r => (
                        <label
                          key={r.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                            selectedRivalIds.includes(r.id)
                              ? 'bg-purple-100/70 border-purple-300 text-purple-950'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRivalIds.includes(r.id)}
                            onChange={() => handleToggleRival(r.id)}
                            className="rounded text-purple-600"
                          />
                          <span>🛡️ {r.name} (Rival)</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGeneratePreview}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <span>⚡ Generar Vista Previa de Cruces</span>
              </button>
            </div>
          </div>

          {/* Step 2: Interactive Fixture Preview Table */}
          {previewMatches.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span>📋 Vista Previa del Fixture Generado</span>
                    <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {previewMatches.length} Partidos
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500">
                    Puedes ajustar horarios o canchas individualmente antes de confirmar.
                  </p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden shadow-xs">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-slate-100 font-bold text-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Fase / Cruce</th>
                      <th className="px-3 py-2 text-left">Partido / Enfrentamiento</th>
                      <th className="px-3 py-2 text-left">Cancha</th>
                      <th className="px-3 py-2 text-left">Inicio</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {previewMatches.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-amber-50/40 transition">
                        <td className="px-3 py-2 font-bold text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                            {m.matchCategory}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-900">{m.title}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={m.location}
                            onChange={e => handleUpdateCandidate(m.id, 'location', e.target.value)}
                            className="px-2 py-1 border rounded text-xs w-28 bg-white"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="datetime-local"
                            value={m.startsAt.slice(0, 16)}
                            onChange={e => handleUpdateCandidate(m.id, 'startsAt', new Date(e.target.value).toISOString())}
                            className="px-2 py-1 border rounded text-xs bg-white"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidate(m.id)}
                            className="text-red-600 hover:text-red-800 p-1 font-bold text-xs"
                            title="Quitar este partido del fixture"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition"
          >
            Cerrar
          </button>

          <button
            type="button"
            disabled={saving || previewMatches.length === 0}
            onClick={handleSaveFixtures}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
          >
            {saving ? (
              <span>Guardando Partidos...</span>
            ) : (
              <span>💾 Confirmar y Guardar Todos los Cruces ({previewMatches.length})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
