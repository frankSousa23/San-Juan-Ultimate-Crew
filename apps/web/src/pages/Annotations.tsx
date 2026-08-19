import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eventsApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import LiveAnnotationsTable from '../components/LiveAnnotationsTable'
import { EventItem } from '../types/event'

export default function Annotations() {
  const { user, hasPermission, hasRole } = useAuth()
  const toasts = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const isGuest = hasRole('guest') || user?.email === 'guest@sjuc.com'
  const canManage = hasPermission('annotations:manage') || hasPermission('events:manage') || hasRole('admin') || hasRole('captain') || hasRole('coach') || hasRole('directiva') || hasRole('annotator') || isGuest
  
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [testMode, setTestMode] = useState(false)
  const [testEvent, setTestEvent] = useState<EventItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'TOURNAMENT'>('ONGOING')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const evts = await eventsApi.list()
      setEvents(evts)
      
      // Auto-seleccionar según query param eventId si viene en la URL
      const paramEventId = searchParams.get('eventId') ? Number(searchParams.get('eventId')) : null
      if (paramEventId) {
        const found = evts.find(e => e.id === paramEventId)
        if (found) {
          setSelectedEvent(found)
          return
        }
      }

      // Auto-seleccionar evento en vivo prioritario si existe
      const ongoingEvent = evts.find(e => e.status === 'ONGOING')
      if (ongoingEvent) {
        setSelectedEvent(ongoingEvent)
      } else if (evts.length > 0) {
        setSelectedEvent(evts[0])
      }
    } catch (err: any) {
      toasts.error('No se pudieron cargar los eventos')
    } finally {
      setLoading(false)
    }
  }

  const createTestEvent = () => {
    const test: EventItem = {
      id: -1,
      title: 'Partido de Prueba - Anotaciones en Vivo',
      description: 'Evento de prueba para validación de pizarra táctica y estadísticas.',
      type: 'AMISTOSO',
      status: 'ONGOING',
      location: 'Cancha de Prueba',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 2 * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTestEvent(test)
    setSelectedEvent(test)
    setTestMode(true)
    toasts.success('Modo de prueba activado')
  }

  const handleEventSelect = (event: EventItem) => {
    setSelectedEvent(event)
    setTestMode(false)
    setTestEvent(null)
  }

  const filteredEvents = useMemo(() => {
    if (statusFilter === 'ONGOING') {
      const ongoing = events.filter(e => e.status === 'ONGOING')
      return ongoing.length > 0 ? ongoing : events.slice(0, 15)
    }
    if (statusFilter === 'TOURNAMENT') {
      return events.filter(e => e.type === 'TOURNAMENT' || !!e.parentId)
    }
    return events.slice(0, 30)
  }, [events, statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 font-bold text-lg animate-pulse">Cargando eventos de anotación...</div>
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
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Anotaciones en Tiempo Real</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            Pizarra táctica interactiva optimizada para tablets, móviles y campo de juego en torneos
          </p>
        </div>
        {canManage && (
          <button
            onClick={createTestEvent}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>🧪</span>
            <span>Simulador de Partido</span>
          </button>
        )}
      </div>

      {testMode && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-black text-amber-900 text-sm sm:text-base flex items-center gap-2">
                <span>⚠️</span> Simulador de Partido de Prueba Activo
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Puedes probar libremente todas las acciones de Goles, Asistencias, Defensas y Turnovers.
              </p>
            </div>
            <button
              onClick={() => {
                setTestMode(false)
                setTestEvent(null)
                setSelectedEvent(null)
              }}
              className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 font-black rounded-xl text-xs transition-all"
            >
              Salir de Prueba
            </button>
          </div>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Selector de Evento */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-base">Seleccionar Partido</h3>
              <span className="text-xs font-bold text-gray-500">{filteredEvents.length} listados</span>
            </div>

            {/* Filtros de estado */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter('ONGOING')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                  statusFilter === 'ONGOING' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔴 En Vivo
              </button>
              <button
                onClick={() => setStatusFilter('TOURNAMENT')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                  statusFilter === 'TOURNAMENT' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏆 Torneo
              </button>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                  statusFilter === 'ALL' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos
              </button>
            </div>

            {/* Lista de Partidos */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {testEvent && (
                <button
                  onClick={() => handleEventSelect(testEvent)}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all active:scale-98 ${
                    selectedEvent?.id === testEvent.id
                      ? 'border-purple-600 bg-purple-50/80 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-black text-gray-900 text-sm">{testEvent.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">🧪 Simulación</span>
                    <span className="text-xs text-gray-500 font-medium">{testEvent.location}</span>
                  </div>
                </button>
              )}

              {filteredEvents.map(ev => {
                const isSelected = selectedEvent?.id === ev.id
                return (
                  <button
                    key={ev.id}
                    onClick={() => handleEventSelect(ev)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all active:scale-98 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-300'
                        : 'border-gray-200 hover:border-indigo-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-black text-gray-900 text-sm sm:text-base leading-snug">{ev.title}</div>
                    
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        ev.status === 'ONGOING' ? 'bg-red-100 text-red-700 animate-pulse' :
                        ev.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                        ev.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ev.status === 'ONGOING' ? '🔴 EN VIVO' : ev.status}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {ev.type}
                      </span>
                      {ev.matchCategory && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {ev.matchCategory}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}

              {filteredEvents.length === 0 && !testEvent && (
                <div className="text-center py-8 text-gray-400 text-sm font-medium">
                  No hay partidos para el filtro seleccionado.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Vista Previa o Pizarra */}
        <div className="lg:col-span-2">
          {selectedEvent ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center space-y-4">
              <div className="text-5xl">📋</div>
              <div>
                <h3 className="text-xl font-black text-gray-900">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedEvent.description || 'Pizarra táctica lista para el partido.'}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(selectedEvent)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-black text-lg rounded-2xl shadow-lg transition-all"
              >
                ⚡ ABRIR PIZARRA TÁCTIL EN PANTALLA COMPLETA
              </button>

              <LiveAnnotationsTable
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                embedded={false}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center space-y-4">
              <div className="text-5xl">🥏</div>
              <h3 className="text-lg sm:text-xl font-black text-gray-800">Selecciona un Partido para Anotar</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Elige un partido en vivo de la lista de la izquierda o inicia el simulador de prueba para comenzar a registrar puntos y estadísticas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
