import React, { useState, useEffect } from 'react'
import { eventsApi, annotationsApi, playersApi, rivalsApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import LiveAnnotationsTable from '../components/LiveAnnotationsTable'
import { EventItem } from '../types/event'

export default function Annotations() {
  const { hasPermission } = useAuth()
  const toasts = useToast()
  const canManage = hasPermission('events:manage')
  
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [testMode, setTestMode] = useState(false)
  const [testEvent, setTestEvent] = useState<EventItem | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const evts = await eventsApi.list()
      setEvents(evts)
      
      // Si hay eventos activos (ONGOING), seleccionar el primero automáticamente
      const ongoingEvent = evts.find(e => e.status === 'ONGOING')
      if (ongoingEvent) {
        setSelectedEvent(ongoingEvent)
      }
    } catch (err: any) {
      toasts.error('No se pudieron cargar los eventos')
    } finally {
      setLoading(false)
    }
  }

  const createTestEvent = () => {
    const test: EventItem = {
      id: -1, // ID temporal para modo prueba
      title: 'Evento de Prueba - Anotaciones',
      description: 'Este es un evento de prueba para probar el sistema de anotaciones',
      type: 'TRAINING',
      status: 'ONGOING',
      location: 'Campo de Prueba',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas después
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTestEvent(test)
    setSelectedEvent(test)
    setTestMode(true)
    toasts.success('Modo de prueba activado. Las anotaciones se guardarán normalmente.')
  }

  const handleEventSelect = (event: EventItem) => {
    setSelectedEvent(event)
    setTestMode(false)
    setTestEvent(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando eventos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Anotaciones en Tiempo Real</h2>
          <p className="text-sm text-gray-600 mt-1">
            Sistema de anotaciones interactivo para eventos y entrenamientos
          </p>
        </div>
        {canManage && (
          <button
            onClick={createTestEvent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            🧪 Modo de Prueba
          </button>
        )}
      </div>

      {testMode && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1 text-sm sm:text-base">⚠️ Modo de Prueba Activo</h3>
              <p className="text-xs sm:text-sm text-yellow-800">
                Estás usando el sistema de anotaciones en modo de prueba. Las anotaciones se guardarán normalmente en la base de datos.
                Puedes probar todas las funcionalidades sin necesidad de tener un evento activo.
              </p>
            </div>
            <button
              onClick={() => {
                setTestMode(false)
                setTestEvent(null)
                setSelectedEvent(null)
              }}
              className="text-yellow-800 hover:text-yellow-900 font-medium text-xs sm:text-sm whitespace-nowrap px-3 py-1 sm:px-4 sm:py-2 bg-yellow-100 rounded hover:bg-yellow-200 transition-colors"
            >
              Salir del Modo Prueba
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Lista de Eventos */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Seleccionar Evento</h3>
            
            {events.length === 0 && !testMode && (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No hay eventos disponibles</p>
                {canManage && (
                  <button
                    onClick={createTestEvent}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Crear Evento de Prueba
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testEvent && (
                <button
                  onClick={() => handleEventSelect(testEvent)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedEvent?.id === testEvent.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-medium text-gray-800">{testEvent.title}</div>
                  <div className="text-xs text-gray-500 mt-1">🧪 Modo Prueba</div>
                  <div className="text-xs text-gray-500">{testEvent.type}</div>
                </button>
              )}

              {events.map(event => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedEvent?.id === event.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-medium text-gray-800">{event.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      event.status === 'ONGOING' ? 'bg-green-100 text-green-700' :
                      event.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                      event.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {event.status}
                    </span>
                    <span className="text-xs text-gray-500">{event.type}</span>
                  </div>
                  {event.startsAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(event.startsAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla de Anotaciones */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          {selectedEvent ? (
            <LiveAnnotationsTable
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              embedded={false}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6 sm:p-12 text-center">
              <div className="text-4xl sm:text-6xl mb-4">📝</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                Selecciona un Evento
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Elige un evento de la lista para comenzar a anotar estadísticas en tiempo real
              </p>
              {canManage && (
                <button
                  onClick={createTestEvent}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm sm:text-base"
                >
                  🧪 Activar Modo de Prueba
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

