import React from 'react'
import { Link } from 'react-router-dom'

export function ProfileEvents({ loadingEvents, userEvents }: { loadingEvents: boolean, userEvents: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Mis Eventos</h3>
        <Link
          to="/eventos"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Ver todos los eventos →
        </Link>
      </div>
      {loadingEvents ? (
        <div className="text-gray-500">Cargando eventos...</div>
      ) : userEvents.length > 0 ? (
        <div className="space-y-3">
          {userEvents.map((event: any) => (
            <Link
              key={event.id}
              to={`/eventos?eventId=${event.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{event.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {new Date(event.startsAt).toLocaleString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {event.location && (
                    <div className="text-xs text-gray-500 mt-1">📍 {event.location}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      event.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                      event.status === 'ONGOING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {event.status === 'COMPLETED' ? 'Completado' :
                       event.status === 'UPCOMING' ? 'Próximo' :
                       event.status === 'ONGOING' ? 'En Curso' : 'Cancelado'}
                    </span>
                    <span className="text-xs text-gray-500">{event.type}</span>
                    {event.attendance && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.attendance.status === 'present' ? 'bg-green-100 text-green-700' :
                        event.attendance.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {event.attendance.status === 'present' ? '✓ Presente' :
                         event.attendance.status === 'late' ? '⏰ Tarde' : '✗ Ausente'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-2">No has participado en ningún evento aún</div>
          <Link
            to="/eventos"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver eventos disponibles →
          </Link>
        </div>
      )}
    </div>
  )
}
