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
      
      // Actualizar marcador si es gol
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
      toasts.success('Anotación agregada')
    } catch (err: any) {
      toasts.error(err?.response?.data?.error || 'No se pudo agregar la anotación')
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

  // Hook para detectar tamaño de pantalla
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Abreviaciones para móviles
  const getAbbreviation = (text: string) => {
    if (isMobile) {
      if (text === 'Goles') return 'G'
      if (text === 'Asistencias') return 'A'
      if (text === 'Intercepciones') return 'I'
      if (text.length > 8) return text.substring(0, 6) + '..'
    }
    return text
  }

  // Si está embebido, solo retornar el contenido sin el modal wrapper
  if (embedded) {
    return (
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-base sm:text-lg font-bold">Anotaciones en Tiempo Real — {event.title}</div>
              <div className="text-xs sm:text-sm opacity-90">{event.type}</div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
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
                    className="rounded"
                  />
                  <span>Modo Versus</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {loading && <div className="text-gray-600 text-center py-8">Cargando...</div>}
          {error && <div className="text-red-600 text-center py-4">{error}</div>}
          
          {!loading && canManage && isVersus && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Equipo Local</label>
                  <input
                    type="text"
                    value={homeTeamName}
                    onChange={(e) => setHomeTeamName(e.target.value)}
                    className="w-full px-2 py-1 text-xs sm:text-sm border rounded"
                    placeholder="Nombre del equipo local"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Equipo Visitante</label>
                  <input
                    type="text"
                    value={opponentTeamName}
                    onChange={(e) => setOpponentTeamName(e.target.value)}
                    className="w-full px-2 py-1 text-xs sm:text-sm border rounded"
                    placeholder="Nombre del equipo oponente"
                  />
                </div>
              </div>
              
              {opponentTeamName && (
                <div className="border-t pt-3">
                  <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Jugadores Oponentes</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {opponentPlayers.map(opp => (
                      <div key={`${opp.number}-${opp.name}`} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                        <span>#{opp.number} {opp.name}</span>
                        <button
                          onClick={() => removeOpponentPlayer(opp.number)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOpponentPlayerName}
                      onChange={(e) => setNewOpponentPlayerName(e.target.value)}
                      placeholder="Nombre"
                      className="flex-1 px-2 py-1 text-xs sm:text-sm border rounded"
                      onKeyDown={(e) => e.key === 'Enter' && addOpponentPlayer()}
                    />
                    <input
                      type="number"
                      value={newOpponentPlayerNumber}
                      onChange={(e) => setNewOpponentPlayerNumber(e.target.value)}
                      placeholder="#"
                      className="w-16 px-2 py-1 text-xs sm:text-sm border rounded"
                      min="1"
                      onKeyDown={(e) => e.key === 'Enter' && addOpponentPlayer()}
                    />
                    <button
                      onClick={addOpponentPlayer}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Marcador (solo para versus) */}
          {isVersus && (
            <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Marcador</div>
                <div className="flex items-center justify-center gap-3 sm:gap-6">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-indigo-700">{homeTeamName}</div>
                    <div className="text-3xl sm:text-5xl font-bold text-indigo-900">{scoreHome}</div>
                  </div>
                  <div className="text-2xl sm:text-4xl font-bold text-gray-500">-</div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-purple-700">{opponentTeamName || 'Visitante'}</div>
                    <div className="text-3xl sm:text-5xl font-bold text-purple-900">{scoreAway}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla doble para versus o tabla simple para entrenamiento */}
          {isVersus ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Equipo Local */}
              <div className="bg-white border-2 border-indigo-200 rounded-lg overflow-hidden">
                <div className="bg-indigo-600 text-white p-2 text-center font-semibold text-sm sm:text-base">
                  {homeTeamName}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-indigo-50">
                      <tr>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">#</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">Jugador</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Goles')}</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Asistencias')}</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Intercepciones')}</th>
                        {canManage && <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {homeStats.map(stat => (
                        <tr key={`home-${stat.playerId}`} className="border-t hover:bg-gray-50">
                          <td className="px-1 sm:px-2 py-1 sm:py-2 font-medium">{stat.playerNumber}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 truncate max-w-[100px] sm:max-w-none" title={stat.playerName}>
                            {stat.playerName}
                          </td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.goals}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.assists}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.interceptions}</td>
                          {canManage && (
                            <td className="px-1 sm:px-2 py-1 sm:py-2">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => quickAddAnnotation(stat.playerId, null, null, 'GOAL', 'HOME')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  title="Gol"
                                >
                                  G
                                </button>
                                <button
                                  onClick={() => quickAddAnnotation(stat.playerId, null, null, 'ASSIST', 'HOME')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  title="Asistencia"
                                >
                                  A
                                </button>
                                <button
                                  onClick={() => quickAddAnnotation(stat.playerId, null, null, 'DEFENSE', 'HOME')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                                  title="Intercepción"
                                >
                                  I
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {homeStats.length === 0 && (
                        <tr>
                          <td colSpan={canManage ? 6 : 5} className="px-2 py-4 text-center text-gray-500 text-xs sm:text-sm">
                            No hay jugadores
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Equipo Visitante */}
              <div className="bg-white border-2 border-purple-200 rounded-lg overflow-hidden">
                <div className="bg-purple-600 text-white p-2 text-center font-semibold text-sm sm:text-base">
                  {opponentTeamName || 'Visitante'}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">#</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">Jugador</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Goles')}</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Asistencias')}</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Intercepciones')}</th>
                        {canManage && <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {awayStats.map(stat => (
                        <tr key={`away-${stat.playerNumber}-${stat.playerName}`} className="border-t hover:bg-gray-50">
                          <td className="px-1 sm:px-2 py-1 sm:py-2 font-medium">{stat.playerNumber}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 truncate max-w-[100px] sm:max-w-none" title={stat.playerName}>
                            {stat.playerName}
                          </td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.goals}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.assists}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.interceptions}</td>
                          {canManage && (
                            <td className="px-1 sm:px-2 py-1 sm:py-2">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => quickAddAnnotation(null, stat.playerName, stat.playerNumber, 'GOAL', 'AWAY')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  title="Gol"
                                >
                                  G
                                </button>
                                <button
                                  onClick={() => quickAddAnnotation(null, stat.playerName, stat.playerNumber, 'ASSIST', 'AWAY')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  title="Asistencia"
                                >
                                  A
                                </button>
                                <button
                                  onClick={() => quickAddAnnotation(null, stat.playerName, stat.playerNumber, 'DEFENSE', 'AWAY')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                                  title="Intercepción"
                                >
                                  I
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {awayStats.length === 0 && (
                        <tr>
                          <td colSpan={canManage ? 6 : 5} className="px-2 py-4 text-center text-gray-500 text-xs sm:text-sm">
                            {canManage ? 'Agrega jugadores oponentes arriba' : 'No hay jugadores'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Tabla simple para entrenamiento */
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-indigo-600 text-white p-2 text-center font-semibold text-sm sm:text-base">
                {homeTeamName}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">#</th>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">Jugador</th>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Goles')}</th>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Asistencias')}</th>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Intercepciones')}</th>
                      {canManage && <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {homeStats.map(stat => (
                      <tr key={`home-${stat.playerId}`} className="border-t hover:bg-gray-50">
                        <td className="px-1 sm:px-2 py-1 sm:py-2 font-medium">{stat.playerNumber}</td>
                        <td className="px-1 sm:px-2 py-1 sm:py-2 truncate max-w-[100px] sm:max-w-none" title={stat.playerName}>
                          {stat.playerName}
                        </td>
                        <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.goals}</td>
                        <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.assists}</td>
                        <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.interceptions}</td>
                        {canManage && (
                          <td className="px-1 sm:px-2 py-1 sm:py-2">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => quickAddAnnotation(stat.playerId, null, null, 'GOAL', 'HOME')}
                                className="px-1 sm:px-2 py-0.5 sm:py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                title="Gol"
                              >
                                G
                              </button>
                              <button
                                onClick={() => quickAddAnnotation(stat.playerId, null, null, 'ASSIST', 'HOME')}
                                className="px-1 sm:px-2 py-0.5 sm:py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                title="Asistencia"
                              >
                                A
                              </button>
                              <button
                                onClick={() => quickAddAnnotation(stat.playerId, null, null, 'DEFENSE', 'HOME')}
                                className="px-1 sm:px-2 py-0.5 sm:py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                                title="Intercepción"
                              >
                                I
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {homeStats.length === 0 && (
                      <tr>
                        <td colSpan={canManage ? 6 : 5} className="px-2 py-4 text-center text-gray-500 text-xs sm:text-sm">
                          No hay jugadores
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lista de anotaciones recientes */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Anotaciones Recientes</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {annotations.slice(0, 10).map(ann => (
                <div key={ann.id} className="flex items-center justify-between text-xs bg-white p-1 rounded">
                  <span>
                    {ann.player ? `#${ann.player.number} ${ann.player.name}` : 
                     ann.opponentPlayerName ? `#${ann.opponentPlayerNumber} ${ann.opponentPlayerName} (${ann.opponentTeamName})` : 
                     'Jugador desconocido'}
                    {' - '}
                    {ann.type === 'GOAL' ? '⚽ Gol' :
                     ann.type === 'ASSIST' ? '🎯 Asistencia' :
                     ann.type === 'DEFENSE' ? '🛡️ Intercepción' : ann.type}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => removeAnnotation(ann.id, ann.type)}
                      className="text-red-600 hover:text-red-800 text-xs px-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {annotations.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-2">No hay anotaciones aún</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex justify-end border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors text-sm sm:text-base"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  // De lo contrario, crear el modal completo
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-base sm:text-lg font-bold">Anotaciones en Tiempo Real — {event.title}</div>
              <div className="text-xs sm:text-sm opacity-90">{event.type}</div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
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
                    className="rounded"
                  />
                  <span>Modo Versus</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {loading && <div className="text-gray-600 text-center py-8">Cargando...</div>}
          {error && <div className="text-red-600 text-center py-4">{error}</div>}
          
          {!loading && canManage && isVersus && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Equipo Local</label>
                  <input
                    type="text"
                    value={homeTeamName}
                    onChange={(e) => setHomeTeamName(e.target.value)}
                    className="w-full px-2 py-1 text-xs sm:text-sm border rounded"
                    placeholder="Nombre del equipo local"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Equipo Visitante</label>
                  <input
                    type="text"
                    value={opponentTeamName}
                    onChange={(e) => setOpponentTeamName(e.target.value)}
                    className="w-full px-2 py-1 text-xs sm:text-sm border rounded"
                    placeholder="Nombre del equipo oponente"
                  />
                </div>
              </div>
              
              {opponentTeamName && (
                <div className="border-t pt-3">
                  <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Jugadores Oponentes</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {opponentPlayers.map(opp => (
                      <div key={`${opp.number}-${opp.name}`} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                        <span>#{opp.number} {opp.name}</span>
                        <button
                          onClick={() => removeOpponentPlayer(opp.number)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOpponentPlayerName}
                      onChange={(e) => setNewOpponentPlayerName(e.target.value)}
                      placeholder="Nombre"
                      className="flex-1 px-2 py-1 text-xs sm:text-sm border rounded"
                      onKeyDown={(e) => e.key === 'Enter' && addOpponentPlayer()}
                    />
                    <input
                      type="number"
                      value={newOpponentPlayerNumber}
                      onChange={(e) => setNewOpponentPlayerNumber(e.target.value)}
                      placeholder="#"
                      className="w-16 px-2 py-1 text-xs sm:text-sm border rounded"
                      min="1"
                      onKeyDown={(e) => e.key === 'Enter' && addOpponentPlayer()}
                    />
                    <button
                      onClick={addOpponentPlayer}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Marcador (solo para versus) */}
          {isVersus && (
            <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Marcador</div>
                <div className="flex items-center justify-center gap-3 sm:gap-6">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-indigo-700">{homeTeamName}</div>
                    <div className="text-3xl sm:text-5xl font-bold text-indigo-900">{scoreHome}</div>
                  </div>
                  <div className="text-2xl sm:text-4xl font-bold text-gray-500">-</div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-purple-700">{opponentTeamName || 'Visitante'}</div>
                    <div className="text-3xl sm:text-5xl font-bold text-purple-900">{scoreAway}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla doble para versus o tabla simple para entrenamiento */}
          {isVersus ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Equipo Local */}
              <div className="bg-white border-2 border-indigo-200 rounded-lg overflow-hidden">
                <div className="bg-indigo-600 text-white p-2 text-center font-semibold text-sm sm:text-base">
                  {homeTeamName}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-indigo-50">
                      <tr>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">#</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">Jugador</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Goles')}</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Asistencias')}</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Intercepciones')}</th>
                        {canManage && <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {homeStats.map(stat => (
                        <tr key={`home-${stat.playerId}`} className="border-t hover:bg-gray-50">
                          <td className="px-1 sm:px-2 py-1 sm:py-2 font-medium">{stat.playerNumber}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 truncate max-w-[100px] sm:max-w-none" title={stat.playerName}>
                            {stat.playerName}
                          </td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.goals}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.assists}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.interceptions}</td>
                          {canManage && (
                            <td className="px-1 sm:px-2 py-1 sm:py-2">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => quickAddAnnotation(stat.playerId, null, null, 'GOAL', 'HOME')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  title="Gol"
                                >
                                  G
                                </button>
                                <button
                                  onClick={() => quickAddAnnotation(stat.playerId, null, null, 'ASSIST', 'HOME')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  title="Asistencia"
                                >
                                  A
                                </button>
                                <button
                                  onClick={() => quickAddAnnotation(stat.playerId, null, null, 'DEFENSE', 'HOME')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                                  title="Intercepción"
                                >
                                  I
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {homeStats.length === 0 && (
                        <tr>
                          <td colSpan={canManage ? 6 : 5} className="px-2 py-4 text-center text-gray-500 text-xs sm:text-sm">
                            No hay jugadores
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Equipo Visitante */}
              <div className="bg-white border-2 border-purple-200 rounded-lg overflow-hidden">
                <div className="bg-purple-600 text-white p-2 text-center font-semibold text-sm sm:text-base">
                  {opponentTeamName || 'Visitante'}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">#</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">Jugador</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Goles')}</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Asistencias')}</th>
                        <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Intercepciones')}</th>
                        {canManage && <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {awayStats.map(stat => (
                        <tr key={`away-${stat.playerNumber}-${stat.playerName}`} className="border-t hover:bg-gray-50">
                          <td className="px-1 sm:px-2 py-1 sm:py-2 font-medium">{stat.playerNumber}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 truncate max-w-[100px] sm:max-w-none" title={stat.playerName}>
                            {stat.playerName}
                          </td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.goals}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.assists}</td>
                          <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.interceptions}</td>
                          {canManage && (
                            <td className="px-1 sm:px-2 py-1 sm:py-2">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => quickAddAnnotation(null, stat.playerName, stat.playerNumber, 'GOAL', 'AWAY')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  title="Gol"
                                >
                                  G
                                </button>
                                <button
                                  onClick={() => quickAddAnnotation(null, stat.playerName, stat.playerNumber, 'ASSIST', 'AWAY')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  title="Asistencia"
                                >
                                  A
                                </button>
                                <button
                                  onClick={() => quickAddAnnotation(null, stat.playerName, stat.playerNumber, 'DEFENSE', 'AWAY')}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                                  title="Intercepción"
                                >
                                  I
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {awayStats.length === 0 && (
                        <tr>
                          <td colSpan={canManage ? 6 : 5} className="px-2 py-4 text-center text-gray-500 text-xs sm:text-sm">
                            {canManage ? 'Agrega jugadores oponentes arriba' : 'No hay jugadores'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Tabla simple para entrenamiento */
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-indigo-600 text-white p-2 text-center font-semibold text-sm sm:text-base">
                {homeTeamName}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">#</th>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-left">Jugador</th>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Goles')}</th>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Asistencias')}</th>
                      <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">{getAbbreviation('Intercepciones')}</th>
                      {canManage && <th className="px-1 sm:px-2 py-1 sm:py-2 text-center">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {homeStats.map(stat => (
                      <tr key={`home-${stat.playerId}`} className="border-t hover:bg-gray-50">
                        <td className="px-1 sm:px-2 py-1 sm:py-2 font-medium">{stat.playerNumber}</td>
                        <td className="px-1 sm:px-2 py-1 sm:py-2 truncate max-w-[100px] sm:max-w-none" title={stat.playerName}>
                          {stat.playerName}
                        </td>
                        <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.goals}</td>
                        <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.assists}</td>
                        <td className="px-1 sm:px-2 py-1 sm:py-2 text-center">{stat.interceptions}</td>
                        {canManage && (
                          <td className="px-1 sm:px-2 py-1 sm:py-2">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => quickAddAnnotation(stat.playerId, null, null, 'GOAL', 'HOME')}
                                className="px-1 sm:px-2 py-0.5 sm:py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                title="Gol"
                              >
                                G
                              </button>
                              <button
                                onClick={() => quickAddAnnotation(stat.playerId, null, null, 'ASSIST', 'HOME')}
                                className="px-1 sm:px-2 py-0.5 sm:py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                title="Asistencia"
                              >
                                A
                              </button>
                              <button
                                onClick={() => quickAddAnnotation(stat.playerId, null, null, 'DEFENSE', 'HOME')}
                                className="px-1 sm:px-2 py-0.5 sm:py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                                title="Intercepción"
                              >
                                I
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {homeStats.length === 0 && (
                      <tr>
                        <td colSpan={canManage ? 6 : 5} className="px-2 py-4 text-center text-gray-500 text-xs sm:text-sm">
                          No hay jugadores
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lista de anotaciones recientes */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Anotaciones Recientes</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {annotations.slice(0, 10).map(ann => (
                <div key={ann.id} className="flex items-center justify-between text-xs bg-white p-1 rounded">
                  <span>
                    {ann.player ? `#${ann.player.number} ${ann.player.name}` : 
                     ann.opponentPlayerName ? `#${ann.opponentPlayerNumber} ${ann.opponentPlayerName} (${ann.opponentTeamName})` : 
                     'Jugador desconocido'}
                    {' - '}
                    {ann.type === 'GOAL' ? '⚽ Gol' :
                     ann.type === 'ASSIST' ? '🎯 Asistencia' :
                     ann.type === 'DEFENSE' ? '🛡️ Intercepción' : ann.type}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => removeAnnotation(ann.id, ann.type)}
                      className="text-red-600 hover:text-red-800 text-xs px-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {annotations.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-2">No hay anotaciones aún</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex justify-end border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors text-sm sm:text-base"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

