import React, { useState, useEffect, useMemo } from 'react'
import { annotationsApi, playersApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import { EventAnnotation, CreateAnnotationInput, AnnotationType } from '../types/annotation'
import { Player } from '../types/player'
import { EventItem } from '../types/event'

interface LiveAnnotationsTableProps {
  event: EventItem
  onClose: () => void
  embedded?: boolean // Si es true, no renderiza el modal wrapper
}

interface PlayerStats {
  playerId: number | null
  playerName: string
  playerNumber: number | null
  teamName: string
  teamSide: 'HOME' | 'AWAY' | null
  goals: number
  assists: number
  interceptions: number
}

export default function LiveAnnotationsTable({ event, onClose, embedded = false }: LiveAnnotationsTableProps) {
  const { user, hasPermission } = useAuth()
  const toasts = useToast()
  const canManage = hasPermission('events:manage')
  
  const [annotations, setAnnotations] = useState<EventAnnotation[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Configuración del evento
  const [isVersus, setIsVersus] = useState(false)
  const [opponentTeamName, setOpponentTeamName] = useState('')
  const [homeTeamName, setHomeTeamName] = useState('San Juan Ultimate Crew')
  
  // Jugadores oponentes (para versus)
  const [opponentPlayers, setOpponentPlayers] = useState<Array<{ name: string; number: number }>>([])
  const [newOpponentPlayerName, setNewOpponentPlayerName] = useState('')
  const [newOpponentPlayerNumber, setNewOpponentPlayerNumber] = useState('')
  
  // Marcador
  const [scoreHome, setScoreHome] = useState(0)
  const [scoreAway, setScoreAway] = useState(0)

  useEffect(() => {
    loadData()
    // Polling cada 5 segundos para actualizar en tiempo real
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [event.id])

  const loadData = async () => {
    try {
      const [anns, pls] = await Promise.all([
        annotationsApi.list({ eventId: event.id }),
        playersApi.list(),
      ])
      setAnnotations(anns)
      setPlayers(pls)
      
      // Determinar si es versus basado en anotaciones existentes
      const hasOpponent = anns.some(a => a.opponentTeamName || a.opponentPlayerName)
      if (hasOpponent && !isVersus) {
        setIsVersus(true)
        const firstOpponent = anns.find(a => a.opponentTeamName)
        if (firstOpponent?.opponentTeamName) {
          setOpponentTeamName(firstOpponent.opponentTeamName)
        }
      }
      
      // Calcular marcador desde anotaciones
      const homeGoals = anns.filter(a => a.type === 'GOAL' && (a.teamSide === 'HOME' || (!a.teamSide && !a.opponentTeamName))).length
      const awayGoals = anns.filter(a => a.type === 'GOAL' && a.teamSide === 'AWAY').length
      setScoreHome(homeGoals)
      setScoreAway(awayGoals)
      
      setLoading(false)
    } catch (err: any) {
      setError('No se pudo cargar las anotaciones')
      setLoading(false)
    }
  }

  // Calcular estadísticas por jugador
  const playerStats = useMemo(() => {
    const statsMap = new Map<string, PlayerStats>()
    
    // Estadísticas de nuestro equipo
    players.forEach(player => {
      const key = `home-${player.id}`
      const playerAnns = annotations.filter(a => a.playerId === player.id && !a.opponentTeamName)
      statsMap.set(key, {
        playerId: player.id,
        playerName: player.name,
        playerNumber: player.number,
        teamName: homeTeamName,
        teamSide: 'HOME',
        goals: playerAnns.filter(a => a.type === 'GOAL').length,
        assists: playerAnns.filter(a => a.type === 'ASSIST').length,
        interceptions: playerAnns.filter(a => a.type === 'DEFENSE').length,
      })
    })
    
    // Estadísticas de equipo oponente (si es versus)
    if (isVersus) {
      opponentPlayers.forEach(opp => {
        const key = `away-${opp.number}-${opp.name}`
        const playerAnns = annotations.filter(
          a => a.opponentPlayerName === opp.name && a.opponentPlayerNumber === opp.number
        )
        statsMap.set(key, {
          playerId: null,
          playerName: opp.name,
          playerNumber: opp.number,
          teamName: opponentTeamName,
          teamSide: 'AWAY',
          goals: playerAnns.filter(a => a.type === 'GOAL').length,
          assists: playerAnns.filter(a => a.type === 'ASSIST').length,
          interceptions: playerAnns.filter(a => a.type === 'DEFENSE').length,
        })
      })
    }
    
    return Array.from(statsMap.values())
  }, [annotations, players, opponentPlayers, isVersus, homeTeamName, opponentTeamName])

  const addOpponentPlayer = () => {
    if (!newOpponentPlayerName.trim() || !newOpponentPlayerNumber.trim()) {
      toasts.error('Nombre y número son requeridos')
      return
    }
    const num = Number(newOpponentPlayerNumber)
    if (isNaN(num) || num <= 0) {
      toasts.error('Número debe ser mayor a 0')
      return
    }
    if (opponentPlayers.some(p => p.number === num)) {
      toasts.error('Ya existe un jugador con ese número')
      return
    }
    setOpponentPlayers(prev => [...prev, { name: newOpponentPlayerName.trim(), number: num }])
    setNewOpponentPlayerName('')
    setNewOpponentPlayerNumber('')
  }

  const removeOpponentPlayer = (number: number) => {
    setOpponentPlayers(prev => prev.filter(p => p.number !== number))
  }

  const quickAddAnnotation = async (
    playerId: number | null,
    playerName: string | null,
    playerNumber: number | null,
    type: AnnotationType,
    teamSide: 'HOME' | 'AWAY' | null
  ) => {
    if (!canManage) return
    
    try {
      const payload: CreateAnnotationInput = {
        eventId: event.id,
        type,
        timestamp: new Date().toISOString(),
      }
      
      if (playerId) {
        payload.playerId = playerId
        payload.teamSide = teamSide || 'HOME'
      } else if (playerName && playerNumber) {
        payload.opponentPlayerName = playerName
        payload.opponentPlayerNumber = playerNumber
        payload.opponentTeamName = opponentTeamName
        payload.teamSide = teamSide || 'AWAY'
      }
      
      // Actualizar marcador si es gol de manera optimista
      if (type === 'GOAL') {
        if (teamSide === 'HOME' || !teamSide) {
          payload.scoreHome = scoreHome + 1
          payload.scoreAway = scoreAway
          setScoreHome(prev => prev + 1)
        } else {
          payload.scoreHome = scoreHome
          payload.scoreAway = scoreAway + 1
          setScoreAway(prev => prev + 1)
        }
      } else {
        payload.scoreHome = scoreHome
        payload.scoreAway = scoreAway
      }
      
      await annotationsApi.create(payload)
      await loadData()
      
      // Feedback táctico para el sol (Toast breve y visual)
      toasts.success('¡Anotado! ✅')
    } catch (err: any) {
      toasts.error(err?.response?.data?.error || 'No se pudo agregar la anotación')
      // Revertir estado optimista
      await loadData()
    }
  }

  const removeAnnotation = async (annotationId: number, type: AnnotationType) => {
    if (!canManage || !confirm('¿Eliminar esta anotación?')) return
    
    try {
      await annotationsApi.remove(annotationId)
      // Ajustar marcador si era un gol
      if (type === 'GOAL') {
        const ann = annotations.find(a => a.id === annotationId)
        if (ann?.teamSide === 'HOME' || (!ann?.teamSide && !ann?.opponentTeamName)) {
          setScoreHome(prev => Math.max(0, prev - 1))
        } else if (ann?.teamSide === 'AWAY') {
          setScoreAway(prev => Math.max(0, prev - 1))
        }
      }
      await loadData()
      toasts.success('Anotación eliminada')
    } catch (err: any) {
      toasts.error('No se pudo eliminar la anotación')
    }
  }

  const homeStats = playerStats.filter(s => s.teamSide === 'HOME')
  const awayStats = playerStats.filter(s => s.teamSide === 'AWAY')

  const content = (
    <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => !embedded && e.stopPropagation()}>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-lg sm:text-2xl font-bold">Anotaciones — {event.title}</div>
            <div className="text-sm opacity-90">{event.type}</div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
              <label className="flex items-center gap-2 text-sm sm:text-base font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVersus}
                  onChange={(e) => {
                    setIsVersus(e.target.checked)
                    if (!e.target.checked) {
                      setOpponentTeamName('')
                      setOpponentPlayers([])
                    }
                  }}
                  className="rounded w-5 h-5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>Modo Versus</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50">
        {loading && <div className="text-gray-600 text-center py-8 font-medium">Cargando datos...</div>}
        {error && <div className="text-red-600 text-center py-4 bg-red-50 rounded-lg font-medium border border-red-200">{error}</div>}
        
        {!loading && canManage && isVersus && (
          <div className="mb-6 p-4 bg-white shadow-sm border border-blue-100 rounded-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1">Equipo Local</label>
                <input
                  type="text"
                  value={homeTeamName}
                  onChange={(e) => setHomeTeamName(e.target.value)}
                  className="w-full px-4 py-3 text-base sm:text-lg border-2 border-gray-300 focus:border-indigo-500 rounded-lg"
                  placeholder="Nombre del equipo local"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1">Equipo Visitante</label>
                <input
                  type="text"
                  value={opponentTeamName}
                  onChange={(e) => setOpponentTeamName(e.target.value)}
                  className="w-full px-4 py-3 text-base sm:text-lg border-2 border-gray-300 focus:border-purple-500 rounded-lg"
                  placeholder="Nombre del equipo oponente"
                />
              </div>
            </div>
            
            {opponentTeamName && (
              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm font-bold text-gray-700 mb-3">Jugadores Oponentes</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {opponentPlayers.map(opp => (
                    <div key={`${opp.number}-${opp.name}`} className="flex items-center gap-2 px-3 py-2 bg-purple-50 border-2 border-purple-200 rounded-full text-sm sm:text-base font-bold text-purple-900 shadow-sm">
                      <span>#{opp.number} {opp.name}</span>
                      <button
                        onClick={() => removeOpponentPlayer(opp.number)}
                        className="text-purple-400 hover:text-red-600 text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 bg-gray-100 p-3 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    value={newOpponentPlayerName}
                    onChange={(e) => setNewOpponentPlayerName(e.target.value)}
                    placeholder="Nombre del jugador"
                    className="flex-1 min-w-[120px] px-3 py-3 text-base sm:text-lg border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-lg bg-white"
                    onKeyDown={(e) => e.key === 'Enter' && addOpponentPlayer()}
                  />
                  <input
                    type="number"
                    value={newOpponentPlayerNumber}
                    onChange={(e) => setNewOpponentPlayerNumber(e.target.value)}
                    placeholder="#"
                    className="w-20 px-3 py-3 text-base sm:text-lg border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-lg bg-white text-center"
                    min="1"
                    onKeyDown={(e) => e.key === 'Enter' && addOpponentPlayer()}
                  />
                  <button
                    onClick={addOpponentPlayer}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold text-sm sm:text-base shadow hover:bg-purple-700 active:scale-95 transition-transform"
                  >
                    + AGREGAR
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marcador Masivo */}
        {!loading && isVersus && (
          <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-md">
            <div className="text-center">
              <div className="text-sm sm:text-base font-black text-gray-500 uppercase tracking-widest mb-2">Marcador En Vivo</div>
              <div className="flex items-center justify-center gap-4 sm:gap-12">
                <div className="text-center flex-1">
                  <div className="text-xl sm:text-3xl font-black text-indigo-700 truncate mb-1">{homeTeamName}</div>
                  <div className="text-7xl sm:text-9xl font-black text-indigo-900 drop-shadow-lg leading-none">{scoreHome}</div>
                </div>
                <div className="text-5xl sm:text-7xl font-bold text-gray-300">-</div>
                <div className="text-center flex-1">
                  <div className="text-xl sm:text-3xl font-black text-purple-700 truncate mb-1">{opponentTeamName || 'Visitante'}</div>
                  <div className="text-7xl sm:text-9xl font-black text-purple-900 drop-shadow-lg leading-none">{scoreAway}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Renderizador de Listas de Jugadores */}
        {!loading && (
          <div className={`grid grid-cols-1 ${isVersus ? 'lg:grid-cols-2' : ''} gap-6`}>
            {/* Equipo Local */}
            {renderPlayerList(homeStats, homeTeamName, 'HOME', 'indigo', canManage, quickAddAnnotation)}
            
            {/* Equipo Visitante */}
            {isVersus && renderPlayerList(awayStats, opponentTeamName || 'Visitante', 'AWAY', 'purple', canManage, quickAddAnnotation)}
          </div>
        )}

        {/* Lista de anotaciones recientes */}
        {!loading && (
          <div className="mt-8 p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">⏱️</span> Anotaciones Recientes
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {annotations.slice(0, 15).map(ann => (
                <div key={ann.id} className="flex items-center justify-between text-sm sm:text-lg bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <span className="font-medium text-gray-800">
                    {ann.player ? `#${ann.player.number} ${ann.player.name}` : 
                     ann.opponentPlayerName ? `#${ann.opponentPlayerNumber} ${ann.opponentPlayerName} (${ann.opponentTeamName})` : 
                     'Jugador desconocido'}
                    <span className="mx-2 text-gray-300">|</span>
                    <span className={`font-black ${
                      ann.type === 'GOAL' ? 'text-green-600' :
                      ann.type === 'ASSIST' ? 'text-blue-600' :
                      ann.type === 'DEFENSE' ? 'text-purple-600' : 'text-gray-600'
                    }`}>
                      {ann.type === 'GOAL' ? '⚽ GOL' :
                       ann.type === 'ASSIST' ? '🎯 ASISTENCIA' :
                       ann.type === 'DEFENSE' ? '🛡️ INTERCEPCIÓN' : ann.type}
                    </span>
                  </span>
                  {canManage && (
                    <button
                      onClick={() => removeAnnotation(ann.id, ann.type)}
                      className="ml-4 w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 active:bg-red-300 font-bold text-xl transition-colors shadow-sm"
                      title="Eliminar anotación"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {annotations.length === 0 && (
                <div className="text-base text-gray-500 text-center py-6 font-medium">No hay anotaciones registradas aún en este evento.</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex justify-end border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-8 py-4 rounded-lg bg-gray-900 text-white font-bold text-lg hover:bg-black active:scale-95 transition-all shadow-md"
        >
          {embedded ? 'Ocultar Vista' : 'Cerrar Panel'}
        </button>
      </div>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-0 sm:p-6" onClick={onClose}>
      {content}
    </div>
  )
}

// Helper externo para renderizar las listas responsive (Sunlight & Field Mode)
function renderPlayerList(
  stats: PlayerStats[], 
  teamName: string, 
  side: 'HOME' | 'AWAY', 
  theme: 'indigo' | 'purple', 
  canManage: boolean, 
  quickAddAnnotation: any
) {
  const isHome = side === 'HOME';
  const bgColor = theme === 'indigo' ? 'bg-indigo-600' : 'bg-purple-600';
  const headerBgColor = theme === 'indigo' ? 'bg-indigo-50' : 'bg-purple-50';
  const borderColor = theme === 'indigo' ? 'border-indigo-200' : 'border-purple-200';
  
  return (
    <div className={`bg-white border-2 ${borderColor} rounded-xl overflow-hidden shadow-sm`}>
      <div className={`${bgColor} text-white p-3 sm:p-4 text-center font-black text-lg sm:text-2xl uppercase tracking-wide`}>
        {teamName}
      </div>
      
      {/* Vista Móvil (Tarjetas masivas con botones grandes) */}
      <div className="sm:hidden divide-y-4 divide-gray-100">
        {stats.map(stat => (
          <div key={`${side}-${stat.playerId || stat.playerNumber}-${stat.playerName}`} className="p-4 bg-white active:bg-gray-50 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <div className="font-black text-2xl text-gray-900">
                <span className="text-gray-400 mr-1">#</span>{stat.playerNumber} <span className="ml-1 truncate">{stat.playerName}</span>
              </div>
              <div className="flex gap-2 text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className={stat.goals > 0 ? 'text-green-600' : ''}>G:{stat.goals}</span>
                <span className={stat.assists > 0 ? 'text-blue-600' : ''}>A:{stat.assists}</span>
                <span className={stat.interceptions > 0 ? 'text-purple-600' : ''}>I:{stat.interceptions}</span>
              </div>
            </div>
            {canManage && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => quickAddAnnotation(isHome ? stat.playerId : null, isHome ? null : stat.playerName, isHome ? null : stat.playerNumber, 'GOAL', side)}
                  className="h-16 bg-green-500 text-white rounded-xl text-xl font-black shadow-[0_6px_0_0_#166534] active:shadow-none active:translate-y-[6px] flex items-center justify-center transition-all"
                >
                  GOL
                </button>
                <button
                  onClick={() => quickAddAnnotation(isHome ? stat.playerId : null, isHome ? null : stat.playerName, isHome ? null : stat.playerNumber, 'ASSIST', side)}
                  className="h-16 bg-blue-500 text-white rounded-xl text-xl font-black shadow-[0_6px_0_0_#1e40af] active:shadow-none active:translate-y-[6px] flex items-center justify-center transition-all"
                >
                  AST
                </button>
                <button
                  onClick={() => quickAddAnnotation(isHome ? stat.playerId : null, isHome ? null : stat.playerName, isHome ? null : stat.playerNumber, 'DEFENSE', side)}
                  className="h-16 bg-purple-500 text-white rounded-xl text-xl font-black shadow-[0_6px_0_0_#581c87] active:shadow-none active:translate-y-[6px] flex items-center justify-center transition-all"
                >
                  INT
                </button>
              </div>
            )}
          </div>
        ))}
        {stats.length === 0 && (
          <div className="p-8 text-center text-gray-500 font-medium text-lg">
            {canManage && !isHome ? 'Agrega jugadores oponentes arriba para empezar a anotar.' : 'No hay jugadores registrados.'}
          </div>
        )}
      </div>

      {/* Vista Escritorio (Tabla grande y espaciada) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-base">
          <thead className={headerBgColor}>
            <tr>
              <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wide text-sm">#</th>
              <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase tracking-wide text-sm">Jugador</th>
              <th className="px-4 py-4 text-center font-bold text-gray-700 uppercase tracking-wide text-sm">Goles</th>
              <th className="px-4 py-4 text-center font-bold text-gray-700 uppercase tracking-wide text-sm">Asist</th>
              <th className="px-4 py-4 text-center font-bold text-gray-700 uppercase tracking-wide text-sm">Intercep</th>
              {canManage && <th className="px-4 py-4 text-center font-bold text-gray-700 uppercase tracking-wide text-sm">Anotar (Touch Target)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.map(stat => (
              <tr key={`desktop-${side}-${stat.playerId || stat.playerNumber}-${stat.playerName}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 font-black text-2xl text-gray-400">{stat.playerNumber}</td>
                <td className="px-4 py-4 font-bold text-xl text-gray-900">{stat.playerName}</td>
                <td className="px-4 py-4 text-center text-2xl font-black text-green-700 bg-green-50/30">{stat.goals}</td>
                <td className="px-4 py-4 text-center text-2xl font-black text-blue-700 bg-blue-50/30">{stat.assists}</td>
                <td className="px-4 py-4 text-center text-2xl font-black text-purple-700 bg-purple-50/30">{stat.interceptions}</td>
                {canManage && (
                  <td className="px-4 py-4">
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => quickAddAnnotation(isHome ? stat.playerId : null, isHome ? null : stat.playerName, isHome ? null : stat.playerNumber, 'GOAL', side)}
                        className="w-14 h-14 bg-green-500 text-white rounded-xl font-black text-2xl hover:bg-green-600 active:bg-green-700 shadow-md flex items-center justify-center transition-transform active:scale-90"
                        title="Anotar Gol"
                      >
                        G
                      </button>
                      <button
                        onClick={() => quickAddAnnotation(isHome ? stat.playerId : null, isHome ? null : stat.playerName, isHome ? null : stat.playerNumber, 'ASSIST', side)}
                        className="w-14 h-14 bg-blue-500 text-white rounded-xl font-black text-2xl hover:bg-blue-600 active:bg-blue-700 shadow-md flex items-center justify-center transition-transform active:scale-90"
                        title="Anotar Asistencia"
                      >
                        A
                      </button>
                      <button
                        onClick={() => quickAddAnnotation(isHome ? stat.playerId : null, isHome ? null : stat.playerName, isHome ? null : stat.playerNumber, 'DEFENSE', side)}
                        className="w-14 h-14 bg-purple-500 text-white rounded-xl font-black text-2xl hover:bg-purple-600 active:bg-purple-700 shadow-md flex items-center justify-center transition-transform active:scale-90"
                        title="Anotar Intercepción"
                      >
                        I
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="px-4 py-12 text-center text-gray-500 font-medium text-lg">
                  {canManage && !isHome ? 'Agrega jugadores oponentes arriba' : 'No hay jugadores'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
