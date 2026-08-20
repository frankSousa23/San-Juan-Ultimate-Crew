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
  const isGuest = hasRole('guest') || user?.email === 'guest@sigedivo.com'
  
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
  
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvent()
  }, [])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const paramEventId = searchParams.get('eventId') ? Number(searchParams.get('eventId')) : null
      
      if (!paramEventId) {
        setLoading(false)
        return
      }

      // Fetch specific event (we fetch all and find it for simplicity, 
      // since the API list might already cache or return everything quickly in this demo)
      const evts = await eventsApi.list()
      const found = evts.find(e => e.id === paramEventId)
      
      if (found) {
        setSelectedEvent(found)
      } else {
        toasts.error('Evento no encontrado')
      }
    } catch (err: any) {
      toasts.error('No se pudo cargar el evento')
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
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h3 className="text-lg sm:text-xl font-black text-gray-800">No se ha seleccionado ningún evento</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Para registrar anotaciones y estadísticas, debes iniciar la pizarra táctica desde la pantalla de Eventos y Calendario.
          </p>
          <button
            onClick={() => navigate('/eventos')}
            className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl"
          >
            Ir a Eventos
          </button>
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
