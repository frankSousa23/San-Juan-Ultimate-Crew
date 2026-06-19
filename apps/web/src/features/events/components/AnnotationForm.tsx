import React, { useState } from 'react'
import { Player } from '../../../types/player'
import { EventAnnotation, AnnotationType, CreateAnnotationInput } from '../../../types/annotation'

export function AnnotationForm({
  eventId,
  players,
  isFullDay,
  initial,
  onSubmit,
  onCancel,
}: {
  eventId: number
  players: Player[]
  isFullDay: boolean
  initial?: EventAnnotation | null
  onSubmit: (data: CreateAnnotationInput) => void
  onCancel: () => void
}) {
  const [playerId, setPlayerId] = useState<number>(initial?.playerId || players[0]?.id || 0)
  const [type, setType] = useState<AnnotationType>(initial?.type || 'GENERAL')
  const [note, setNote] = useState<string>(initial?.note || '')
  const [timestamp, setTimestamp] = useState<string>(
    initial?.timestamp 
      ? new Date(initial.timestamp).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )
  const [category, setCategory] = useState<string>(initial?.category || '')

  const annotationTypes: AnnotationType[] = [
    'GOAL', 'ASSIST', 'DEFENSE', 'TURNOVER', 'DROP', 'CALLAHAN', 'MVP', 'FOUL',
    'TIMEOUT', 'SUBSTITUTION', 'INJURY', 'GENERAL', 'STRATEGY', 'PERFORMANCE'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      playerId,
      type,
      note: note.trim() || undefined,
      timestamp: new Date(timestamp).toISOString(),
      category: isFullDay && category ? category : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
      <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{initial ? 'Editar' : 'Nueva'} Anotación</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Jugador</label>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(Number(e.target.value))}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            required
          >
            {players.map(p => (
              <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AnnotationType)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            required
          >
            {annotationTypes.map(t => (
              <option key={t} value={t}>
                {t === 'GOAL' ? 'GOL' :
                 t === 'ASSIST' ? 'AST' :
                 t === 'DEFENSE' ? 'INT' :
                 t === 'TURNOVER' ? 'TURN' :
                 t === 'DROP' ? 'DROP' :
                 t === 'CALLAHAN' ? 'CALL' :
                 t === 'MVP' ? 'MVP' :
                 t === 'FOUL' ? 'Falta' :
                 t === 'TIMEOUT' ? 'Tiempo muerto' :
                 t === 'SUBSTITUTION' ? 'Sustitución' :
                 t === 'INJURY' ? 'Lesión' :
                 t === 'GENERAL' ? 'General' :
                 t === 'STRATEGY' ? 'Estrategia' :
                 t === 'PERFORMANCE' ? 'Rendimiento' : t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Momento</label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            required
          />
        </div>
        {isFullDay && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            >
              <option value="">Sin categoría</option>
              <option value="OPEN">Open</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>
        )}
        <div className={isFullDay ? 'md:col-span-2' : ''}>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nota/Descripción</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-sm"
            rows={3}
            placeholder="Descripción detallada de la anotación..."
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3 sm:mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm"
        >
          {initial ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
