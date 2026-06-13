import React from 'react'
import { EventItem } from '../types/event'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  tournament: EventItem
  matches: EventItem[]
}

export default function TournamentBracket({ tournament, matches }: Props) {
  // Sort matches by date
  const sorted = [...matches].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between border-b pb-3 mb-5">
        <h3 className="text-2xl font-bold text-gray-800">🏆 {tournament.title}</h3>
        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
          {sorted.length} Partidos
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-6">{tournament.description || 'Sin descripción.'}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.length === 0 ? (
          <p className="text-gray-500 italic col-span-full">No hay partidos registrados para este torneo todavía.</p>
        ) : (
          sorted.map((m, i) => (
            <div key={m.id} className="relative border border-gray-200 rounded-lg p-4 bg-gray-50/50 flex flex-col justify-between hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
              
              {/* Connector line for visual tree effect on desktop */}
              {i > 0 && i % 2 !== 0 && (
                <div className="hidden lg:block absolute -left-6 top-1/2 w-6 border-t-2 border-gray-300 group-hover:border-blue-300 transition-colors" />
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded shadow-sm">Partido {i + 1}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    m.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {m.status === 'COMPLETED' ? 'Finalizado' : 'Pendiente'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 leading-tight">{m.title}</h4>
              </div>

              <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span>{format(new Date(m.startsAt), "d MMM, h:mm a", { locale: es })}</span>
                <span className="text-blue-500 group-hover:underline">Ver detalles &rarr;</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
