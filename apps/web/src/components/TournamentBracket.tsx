import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventItem } from '../types/event'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import MesaTecnicaModal from './MesaTecnicaModal'

interface Props {
  tournament: EventItem
  matches: EventItem[]
  onEditMatch?: (match: EventItem) => void
  onAddMatch?: (tournament: EventItem) => void
  onRefresh?: () => void
  canManage?: boolean
}

export default function TournamentBracket({ tournament, matches, onEditMatch, onAddMatch, onRefresh, canManage }: Props) {
  const navigate = useNavigate()
  const [showMesaModal, setShowMesaModal] = useState(false)
  // Sort matches by date
  const sorted = [...matches].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 mb-5 gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">🏆 {tournament.title}</h3>
          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
            {sorted.length} {sorted.length === 1 ? 'Partido' : 'Partidos'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowMesaModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            title="Designar responsables de Mesa Técnica, planillero, cronometrista y relevos"
          >
            <span>📋</span>
            <span>Mesa Técnica & Turnos</span>
          </button>
          {canManage && onAddMatch && (
            <button
              onClick={() => onAddMatch(tournament)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>+ Planificar Partido / Horario</span>
            </button>
          )}
          {canManage && onEditMatch && (
            <button
              onClick={() => onEditMatch(tournament)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200 transition-colors"
            >
              ✏️ Modificar Torneo
            </button>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-6">{tournament.description || 'Planificación de fases y partidos del torneo.'}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center col-span-full">
            <p className="text-gray-500 text-sm mb-3">No hay partidos planificados aún para este torneo o full day.</p>
            {canManage && onAddMatch && (
              <button
                onClick={() => onAddMatch(tournament)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow"
              >
                + Planificar Primer Partido
              </button>
            )}
          </div>
        ) : (
          sorted.map((m, i) => (
            <div 
              key={m.id} 
              className="relative border border-gray-200 rounded-lg p-4 bg-gray-50/50 flex flex-col justify-between hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group shadow-sm hover:shadow-md"
            >
              
              {/* Connector line for visual tree effect on desktop */}
              {i > 0 && i % 2 !== 0 && (
                <div className="hidden lg:block absolute -left-6 top-1/2 w-6 border-t-2 border-gray-300 group-hover:border-indigo-300 transition-colors" />
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded shadow-sm">
                    {m.matchCategory ? (
                      m.matchCategory === 'GROUP_STAGE' ? 'Fase de Grupos' :
                      m.matchCategory === 'QUARTER_FINALS' ? 'Cuartos de Final' :
                      m.matchCategory === 'SEMI_FINALS' ? 'Semi-Final' :
                      m.matchCategory === 'FINALS' ? 'Gran Final' :
                      m.matchCategory === 'PLACEMENT' ? 'Posicionamiento' : m.matchCategory
                    ) : `Juego ${i + 1}`}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    m.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                    m.status === 'ONGOING' ? 'bg-red-100 text-red-700 animate-pulse' : 
                    m.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {m.status === 'COMPLETED' ? 'Finalizado' : 
                     m.status === 'ONGOING' ? 'En Vivo' : 
                     m.status === 'CANCELLED' ? 'Postergado / Cancelado' : 'Programado'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{m.title}</h4>
                {m.location && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    📍 {m.location}
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
                <span className="font-medium text-gray-700">
                  {format(new Date(m.startsAt), "d MMM, h:mm a", { locale: es })}
                </span>
                <div className="flex items-center gap-2">
                  {canManage && onEditMatch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditMatch(m)
                      }}
                      className="text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded text-[11px] font-semibold transition-colors"
                      title="Reprogramar o editar horario de este partido"
                    >
                      ✏️ Horario
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/anotaciones?eventId=${m.id}`)}
                    className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded text-[11px] font-bold transition-colors"
                  >
                    🥏 Anotar &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showMesaModal && (
        <MesaTecnicaModal
          event={tournament}
          isOpen={showMesaModal}
          onClose={() => setShowMesaModal(false)}
          onUpdated={() => {
            if (onRefresh) onRefresh()
          }}
        />
      )}
    </div>
  )
}
