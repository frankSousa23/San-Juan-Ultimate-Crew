import React, { useState } from 'react'
import { EventItem, EventStatus, UpdateEventInput } from '../../../types/event'
import { newsApi } from '../../../lib/api'

interface Props {
  event: EventItem
  onClose: () => void
  onSave: (id: number, data: UpdateEventInput) => Promise<void>
}

export default function RescheduleModal({ event, onClose, onSave }: Props) {
  const [startsAt, setStartsAt] = useState(event.startsAt ? event.startsAt.slice(0, 16) : '')
  const [endsAt, setEndsAt] = useState(event.endsAt ? event.endsAt.slice(0, 16) : '')
  const [location, setLocation] = useState(event.location || '')
  const [status, setStatus] = useState<EventStatus>(event.status)
  const [note, setNote] = useState(event.description || '')
  const [notifyComms, setNotifyComms] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleQuickShift = (minutes: number) => {
    if (!startsAt) return
    const currentStart = new Date(startsAt)
    const newStart = new Date(currentStart.getTime() + minutes * 60000)
    // Convert to local YYYY-MM-DDTHH:mm
    const tzOffset = newStart.getTimezoneOffset() * 60000
    const localISOTime = new Date(newStart.getTime() - tzOffset).toISOString().slice(0, 16)
    setStartsAt(localISOTime)

    if (endsAt) {
      const currentEnd = new Date(endsAt)
      const newEnd = new Date(currentEnd.getTime() + minutes * 60000)
      const localISOEndTime = new Date(newEnd.getTime() - tzOffset).toISOString().slice(0, 16)
      setEndsAt(localISOEndTime)
    }
  }

  const handleQuickStatus = (newStatus: EventStatus, defaultReason?: string) => {
    setStatus(newStatus)
    if (defaultReason && !note.includes(defaultReason)) {
      setNote(prev => prev ? `${prev} | ${defaultReason}` : defaultReason)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload: UpdateEventInput = {
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        location: location || undefined,
        status,
        description: note || undefined,
      }
      await onSave(event.id, payload)

      if (notifyComms) {
        try {
          const statusText = status === 'CANCELLED' ? '⚠️ POSTERGADO / CANCELADO' : status === 'ONGOING' ? '🔴 EN JUEGO AHORA' : '🕒 REPROGRAMADO'
          const formattedDate = startsAt ? new Date(startsAt).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
          await newsApi.createEventNotice({
            eventId: event.id,
            title: `⏱️ Aviso de Mesa Técnica: [${statusText}] ${event.title}`,
            content: `Se ha registrado una actualización oficial en el evento **${event.title}** (${event.type}):\n\n- **Nuevo Estado**: ${statusText}\n- **Horario**: ${formattedDate || 'Por confirmar'}\n- **Cancha / Ubicación**: ${location || event.location || 'Principal'}\n- **Detalle de la Mesa**: ${note || 'Ajuste operativo programado por la mesa técnica.'}\n\n*Los jugadores pueden dejar dudas puntuales en los comentarios (límite de 3 comentarios por miembro).*`,
            category: '⏱️ Eventualidad de Mesa Técnica',
            isPinned: true,
          })
        } catch (commsErr) {
          console.warn('No se pudo publicar aviso automático en Comunicaciones:', commsErr)
        }
      }

      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la modificación')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-600 to-indigo-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold opacity-90">Mesa Técnica & Control de Eventualidades</span>
            <button onClick={onClose} className="text-white/80 hover:text-white text-lg font-bold">✕</button>
          </div>
          <h3 className="text-lg font-bold mt-1 truncate">⏱️ Reprogramar: {event.title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-sm">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Quick contingency buttons */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Acciones Rápidas por Eventualidad:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickShift(15)}
                className="text-xs px-2.5 py-1 rounded-lg border bg-white font-medium hover:bg-slate-100 text-slate-700 shadow-xs transition"
              >
                +15 Min Retraso
              </button>
              <button
                type="button"
                onClick={() => handleQuickShift(30)}
                className="text-xs px-2.5 py-1 rounded-lg border bg-white font-medium hover:bg-slate-100 text-slate-700 shadow-xs transition"
              >
                +30 Min Retraso
              </button>
              <button
                type="button"
                onClick={() => handleQuickShift(60)}
                className="text-xs px-2.5 py-1 rounded-lg border bg-white font-medium hover:bg-slate-100 text-slate-700 shadow-xs transition"
              >
                +1 Hora
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatus('CANCELLED', 'Postergado por lluvia/clima')}
                className="text-xs px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-800 border-blue-200 font-medium hover:bg-blue-100 shadow-xs transition"
              >
                🌧️ Lluvia / Clima
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatus('ONGOING')}
                className="text-xs px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200 font-medium hover:bg-emerald-100 shadow-xs transition"
              >
                🔴 En Curso Ahora
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nuevo Horario de Inicio</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 font-medium text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Horario Estimado de Fin</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 font-medium text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Estado del Partido</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as EventStatus)}
                className="w-full px-3 py-2 border rounded-lg font-medium text-xs sm:text-sm bg-white"
              >
                <option value="UPCOMING">🕒 Próximo / Reprogramado</option>
                <option value="ONGOING">🔴 En Curso (En Vivo)</option>
                <option value="COMPLETED">✅ Completado</option>
                <option value="CANCELLED">⚠️ Postergado / Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cancha / Ubicación Modificada</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Cancha 1, Cancha Techada..."
                className="w-full px-3 py-2 border rounded-lg font-medium text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Motivo o Notas de Eventualidad (Visible para la mesa y jugadores)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Ej: Retraso de 20 minutos por lluvia torrencial. Se reanuda en Cancha 2."
              className="w-full px-3 py-2 border rounded-lg text-xs sm:text-sm"
            />
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyComms}
                onChange={e => setNotifyComms(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  📢 Publicar aviso oficial automático en "Comunicaciones"
                </span>
                <span className="text-[11px] text-amber-700 leading-relaxed block mt-0.5">
                  Genera una publicación fijada en el tablón oficial de Comunicaciones para que todo el club esté al tanto y pueda interactuar bajo las reglas de comentarios anti-saturación.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow transition disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Aplicar Cambio de Horario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
