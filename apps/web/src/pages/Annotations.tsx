import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { eventsApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import LiveAnnotationsTable from '../components/LiveAnnotationsTable'
import { EventItem } from '../types/event'

export default function Annotations() {
  const { user, hasPermission, hasRole } = useAuth()
  const toasts = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [availableEvents, setAvailableEvents] = useState<EventItem[]>([])
  
  const canManage = (() => {
    if (hasRole('admin') || hasRole('directiva') || hasPermission('events:manage') || hasPermission('annotations:manage')) return true;
    if (hasRole('coach') || hasRole('captain') || hasRole('annotator')) return true;
    if (hasRole('player')) {
      if (!selectedEvent) return true; // Defaults to true initially, table enforces it down the line
      const strictTypes = ['TOURNAMENT', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'MATCH'];
      return !strictTypes.includes(selectedEvent.type);
    }
    return false;
  })()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvent()
  }, [])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const evts = await eventsApi.list()
      setAvailableEvents(evts)

      const paramEventId = searchParams.get('eventId') ? Number(searchParams.get('eventId')) : null
      
      if (paramEventId) {
        const found = evts.find(e => e.id === paramEventId)
        if (found) {
          setSelectedEvent(found)
        } else {
          toasts.error('Evento no encontrado')
        }
      }
    } catch (err: any) {
      toasts.error('No se pudo cargar la lista de eventos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 font-bold text-lg animate-pulse">Cargando pizarra táctica...</div>
      </div>
    )
  }

  if (!selectedEvent) {
    const annotableEvents = availableEvents.filter(
      e => e.type === 'MATCH' || e.type === 'TOURNAMENT' || e.type === 'AMISTOSO' || e.isInternalScrimmage || e.type === 'TRAINING'
    )

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥏</span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Mesa de Anotaciones en Vivo</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Selecciona el partido o caimanera activa para registrar puntos, asistencias, defensas y faltas en tiempo real.
              </p>
            </div>
            <button
              id="goto-events-btn"
              onClick={() => navigate('/eventos')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition"
            >
              <span>📅 Ver Calendario Completo</span>
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Partidos y Encuentros Disponibles ({annotableEvents.length})
            </h2>

            {annotableEvents.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="text-4xl block mb-2">🏟️</span>
                <h3 className="text-base font-bold text-slate-700">No hay partidos planificados en este momento</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Crea un nuevo partido o caimanera desde la sección de eventos para abrir la mesa técnica.
                </p>
                <button
                  onClick={() => navigate('/eventos')}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Ir a Crear Evento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {annotableEvents.map((evt) => {
                  const isOngoing = evt.status === 'ONGOING'
                  return (
                    <div
                      key={evt.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isOngoing
                          ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isOngoing ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isOngoing ? '🔴 En Juego' : evt.type}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {evt.startsAt ? new Date(evt.startsAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-1">
                          {evt.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          📍 {evt.location || 'Cancha Principal'}
                          {evt.rival ? ` • vs ${evt.rival.name}` : ''}
                        </p>
                      </div>

                      <button
                        id={`select-event-${evt.id}`}
                        onClick={() => setSelectedEvent(evt)}
                        className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <span>🥏</span>
                        <span>Abrir Mesa de Anotación</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 touch-manipulation">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🥏</span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Anotaciones: {selectedEvent.title}</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            Pizarra táctica interactiva optimizada para el campo de juego. Las anotaciones alimentan las estadísticas automáticamente.
          </p>
        </div>
        <button
          onClick={() => navigate('/eventos')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-xl transition-all"
        >
          ← Volver a Eventos
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 sm:p-6 text-center space-y-4">
        <LiveAnnotationsTable
          event={selectedEvent}
          onClose={() => navigate('/eventos')}
          embedded={false}
        />
      </div>
    </div>
  )
}
