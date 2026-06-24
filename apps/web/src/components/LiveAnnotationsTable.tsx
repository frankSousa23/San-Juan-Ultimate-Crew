import React, { useState, useEffect, useMemo } from 'react'
import { annotationsApi, playersApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import { EventAnnotation, CreateAnnotationInput, AnnotationType } from '../types/annotation'
import { Player } from '../types/player'
import { EventItem } from '../types/event'
import ConfirmModal from '../components/ConfirmModal'

interface LiveAnnotationsTableProps {
  event: EventItem
  onClose: () => void
  embedded?: boolean
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
  turnovers: number
  drops: number
}

export default function LiveAnnotationsTable({ event, onClose, embedded = false }: LiveAnnotationsTableProps) {
  const { user, hasPermission } = useAuth()
  const toasts = useToast()
  const canManage = hasPermission('events:manage')
  
  const [annotations, setAnnotations] = useState<EventAnnotation[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<{ id: number; message: string; type: AnnotationType; onYes: () => Promise<void> } | null>(null)
  
  // Asistencia Modal State
  const [assistModal, setAssistModal] = useState<{
    playerId: number | null
    playerName: string | null
    playerNumber: number | null
    teamSide: 'HOME' | 'AWAY' | null
  } | null>(null)

  // Configuración del evento
  const isInternal = event.isInternalScrimmage || false
  const [isVersus, setIsVersus] = useState(!!event.rivalId || isInternal)
  const [opponentTeamName, setOpponentTeamName] = useState(isInternal ? 'Equipo Oscuro' : '')
  const [homeTeamName, setHomeTeamName] = useState(isInternal ? 'Equipo Claro' : 'San Juan Ultimate Crew')
  
  // Jugadores oponentes (para versus externo)
  const [opponentPlayers, setOpponentPlayers] = useState<Array<{ name: string; number: number }>>([])
  const [newOpponentPlayerName, setNewOpponentPlayerName] = useState('')
  const [newOpponentPlayerNumber, setNewOpponentPlayerNumber] = useState('')
  
  // Marcador
  const [scoreHome, setScoreHome] = useState(0)
  const [scoreAway, setScoreAway] = useState(0)

  useEffect(() => {
    loadData()
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
      
      const hasOpponent = anns.some(a => a.opponentTeamName || a.opponentPlayerName)
      if (hasOpponent && !isVersus && !isInternal) {
        setIsVersus(true)
        const firstOpponent = anns.find(a => a.opponentTeamName)
        if (firstOpponent?.opponentTeamName) setOpponentTeamName(firstOpponent.opponentTeamName)
      }
      
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

  const playerStats = useMemo(() => {
    const statsMap = new Map<string, PlayerStats>()
    
    // HOME: San Juan UC (o Equipo Claro)
    players.forEach(player => {
      const key = `home-${player.id}`
      const playerAnns = annotations.filter(a => a.playerId === player.id && (!a.teamSide || a.teamSide === 'HOME'))
      // Calcular asistencias basadas en relatedPlayerId
      const assists = annotations.filter(a => a.relatedPlayerId === player.id && a.type === 'GOAL').length

      statsMap.set(key, {
        playerId: player.id,
        playerName: player.name,
        playerNumber: player.number,
        teamName: homeTeamName,
        teamSide: 'HOME',
        goals: playerAnns.filter(a => a.type === 'GOAL').length,
        assists,
        interceptions: playerAnns.filter(a => a.type === 'DEFENSE').length,
        turnovers: playerAnns.filter(a => a.type === 'TURNOVER').length,
        drops: playerAnns.filter(a => a.type === 'DROP').length,
      })
    })

    // AWAY: Equipo Oscuro (nuestros jugadores si es interno)
    if (isInternal) {
      players.forEach(player => {
        const key = `away-${player.id}`
        const playerAnns = annotations.filter(a => a.playerId === player.id && a.teamSide === 'AWAY')
        const assists = annotations.filter(a => a.relatedPlayerId === player.id && a.type === 'GOAL').length

        statsMap.set(key, {
          playerId: player.id,
          playerName: player.name,
          playerNumber: player.number,
          teamName: opponentTeamName,
          teamSide: 'AWAY',
          goals: playerAnns.filter(a => a.type === 'GOAL').length,
          assists,
          interceptions: playerAnns.filter(a => a.type === 'DEFENSE').length,
          turnovers: playerAnns.filter(a => a.type === 'TURNOVER').length,
          drops: playerAnns.filter(a => a.type === 'DROP').length,
        })
      })
    } else if (isVersus) {
      // AWAY: Rivales externos
      opponentPlayers.forEach(opp => {
        const key = `away-${opp.number}-${opp.name}`
        const playerAnns = annotations.filter(a => a.opponentPlayerName === opp.name && a.opponentPlayerNumber === opp.number)
        statsMap.set(key, {
          playerId: null,
          playerName: opp.name,
          playerNumber: opp.number,
          teamName: opponentTeamName,
          teamSide: 'AWAY',
          goals: playerAnns.filter(a => a.type === 'GOAL').length,
          assists: 0, // Simplificación para oponentes
          interceptions: playerAnns.filter(a => a.type === 'DEFENSE').length,
          turnovers: playerAnns.filter(a => a.type === 'TURNOVER').length,
          drops: playerAnns.filter(a => a.type === 'DROP').length,
        })
      })
    }
    
    return Array.from(statsMap.values())
  }, [annotations, players, opponentPlayers, isVersus, isInternal, homeTeamName, opponentTeamName])

  const addOpponentPlayer = () => {
    if (!newOpponentPlayerName.trim() || !newOpponentPlayerNumber.trim()) return toasts.error('Nombre y número son requeridos')
    const num = Number(newOpponentPlayerNumber)
    if (isNaN(num) || num <= 0) return toasts.error('Número inválido')
    if (opponentPlayers.some(p => p.number === num)) return toasts.error('Ya existe')
    setOpponentPlayers(prev => [...prev, { name: newOpponentPlayerName.trim(), number: num }])
    setNewOpponentPlayerName('')
    setNewOpponentPlayerNumber('')
  }

  const removeOpponentPlayer = (number: number) => {
    setOpponentPlayers(prev => prev.filter(p => p.number !== number))
  }

  const handleGoalClick = (playerId: number | null, playerName: string | null, playerNumber: number | null, teamSide: 'HOME' | 'AWAY' | null) => {
    setAssistModal({ playerId, playerName, playerNumber, teamSide })
  }

  const quickAddAnnotation = async (
    playerId: number | null,
    playerName: string | null,
    playerNumber: number | null,
    type: AnnotationType,
    teamSide: 'HOME' | 'AWAY' | null,
    relatedPlayerId: number | null = null
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
        if (relatedPlayerId) payload.relatedPlayerId = relatedPlayerId
      } else if (playerName && playerNumber) {
        payload.opponentPlayerName = playerName
        payload.opponentPlayerNumber = playerNumber
        payload.opponentTeamName = opponentTeamName
        payload.teamSide = teamSide || 'AWAY'
      }
      
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
      toasts.success('¡Anotado! ✅')
    } catch (err: any) {
      toasts.error(err?.response?.data?.error || 'No se pudo agregar')
      await loadData()
    }
  }

  const removeAnnotation = async (annotationId: number, type: AnnotationType) => {
    if (!canManage) return
    try {
      await annotationsApi.remove(annotationId)
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
      toasts.error('No se pudo eliminar')
    }
  }

  const homeStats = playerStats.filter(s => s.teamSide === 'HOME')
  const awayStats = playerStats.filter(s => s.teamSide === 'AWAY')

  const renderAssistModal = () => {
    if (!assistModal) return null
    
    // Buscar opciones de asistencia del MISMO equipo
    let options: PlayerStats[] = []
    if (assistModal.teamSide === 'HOME') {
      options = homeStats.filter(s => s.playerId !== assistModal.playerId)
    } else if (assistModal.teamSide === 'AWAY' && isInternal) {
      options = awayStats.filter(s => s.playerId !== assistModal.playerId)
    }

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setAssistModal(null)}>
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
          <div className="bg-green-600 p-4 rounded-t-2xl text-white">
            <h3 className="font-black text-xl">¿Quién Asistió?</h3>
            <p className="text-sm opacity-90">Anotador: #{assistModal.playerNumber} {assistModal.playerName}</p>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <button
              onClick={() => {
                quickAddAnnotation(assistModal.playerId, assistModal.playerName, assistModal.playerNumber, 'GOAL', assistModal.teamSide, null)
                setAssistModal(null)
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-xl mb-4 shadow-sm"
            >
              SIN ASISTENCIA (Callahan, Error rival, etc)
            </button>

            <div className="grid grid-cols-2 gap-2">
              {options.map(opt => (
                <button
                  key={opt.playerId}
                  onClick={() => {
                    quickAddAnnotation(assistModal.playerId, assistModal.playerName, assistModal.playerNumber, 'GOAL', assistModal.teamSide, opt.playerId)
                    setAssistModal(null)
                  }}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold py-3 px-2 rounded-xl text-center shadow-sm"
                >
                  #{opt.playerNumber} {opt.playerName}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t">
            <button onClick={() => setAssistModal(null)} className="w-full text-gray-500 font-bold py-3 hover:bg-gray-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      </div>
    )
  }

  const content = (
    <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => !embedded && e.stopPropagation()}>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-lg sm:text-2xl font-bold">Anotaciones — {event.title}</div>
            <div className="text-sm opacity-90">{isInternal ? 'Scrimmage Interno' : event.type}</div>
          </div>
          {canManage && !isInternal && (
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
                <span>Modo Versus Externo</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50">
        {loading && <div className="text-gray-600 text-center py-8 font-medium">Cargando datos...</div>}
        {error && <div className="text-red-600 text-center py-4 bg-red-50 rounded-lg font-medium border border-red-200">{error}</div>}
        
        {!loading && canManage && isVersus && !isInternal && (
          <div className="mb-6 p-4 bg-white shadow-sm border border-blue-100 rounded-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1">Equipo Local</label>
                <input type="text" value={homeTeamName} onChange={(e) => setHomeTeamName(e.target.value)} className="w-full px-4 py-3 text-base sm:text-lg border-2 border-gray-300 focus:border-indigo-500 rounded-lg" placeholder="Local" />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-700 mb-1">Equipo Visitante</label>
                <input type="text" value={opponentTeamName} onChange={(e) => setOpponentTeamName(e.target.value)} className="w-full px-4 py-3 text-base sm:text-lg border-2 border-gray-300 focus:border-purple-500 rounded-lg" placeholder="Oponente" />
              </div>
            </div>
            
            {opponentTeamName && (
              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm font-bold text-gray-700 mb-3">Roster Oponente</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {opponentPlayers.map(opp => (
                    <div key={`${opp.number}-${opp.name}`} className="flex items-center gap-2 px-3 py-2 bg-purple-50 border-2 border-purple-200 rounded-full text-sm sm:text-base font-bold text-purple-900 shadow-sm">
                      <span>#{opp.number} {opp.name}</span>
                      <button onClick={() => removeOpponentPlayer(opp.number)} className="text-purple-400 hover:text-red-600 text-xl leading-none">×</button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 bg-gray-100 p-3 rounded-lg border border-gray-200">
                  <input type="text" value={newOpponentPlayerName} onChange={(e) => setNewOpponentPlayerName(e.target.value)} placeholder="Nombre" className="flex-1 min-w-[120px] px-3 py-3 text-base sm:text-lg rounded-lg border-2" />
                  <input type="number" value={newOpponentPlayerNumber} onChange={(e) => setNewOpponentPlayerNumber(e.target.value)} placeholder="#" className="w-20 px-3 py-3 text-center text-base sm:text-lg rounded-lg border-2" min="1" />
                  <button onClick={addOpponentPlayer} className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold shadow hover:bg-purple-700">+ ADD</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marcador Masivo */}
        {!loading && (isVersus || isInternal) && (
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

        {/* Listas de Jugadores */}
        {!loading && (
          <div className={`grid grid-cols-1 ${isVersus || isInternal ? 'lg:grid-cols-2' : ''} gap-6`}>
            {renderPlayerList(homeStats, homeTeamName, 'HOME', 'indigo', canManage, handleGoalClick, quickAddAnnotation)}
            {(isVersus || isInternal) && renderPlayerList(awayStats, opponentTeamName || 'Visitante', 'AWAY', 'purple', canManage, handleGoalClick, quickAddAnnotation)}
          </div>
        )}

        {/* Anotaciones Recientes */}
        {!loading && (
          <div className="mt-8 p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">⏱️</span> Anotaciones Recientes
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {annotations.slice(0, 15).map(ann => {
                const isGoal = ann.type === 'GOAL';
                const assister = isGoal && ann.relatedPlayerId ? players.find(p => p.id === ann.relatedPlayerId) : null;
                
                return (
                  <div key={ann.id} className="flex items-center justify-between text-sm sm:text-lg bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-800 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span>
                        {ann.player ? `#${ann.player.number} ${ann.player.name}` : 
                         ann.opponentPlayerName ? `#${ann.opponentPlayerNumber} ${ann.opponentPlayerName} (${ann.opponentTeamName})` : 
                         'Jugador desconocido'}
                      </span>
                      {assister && <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded border">Ast: #{assister.number} {assister.name}</span>}
                      <span className="hidden sm:inline mx-2 text-gray-300">|</span>
                      <span className={`font-black uppercase ${
                        ann.type === 'GOAL' ? 'text-green-600' :
                        ann.type === 'DEFENSE' ? 'text-purple-600' : 
                        ann.type === 'TURNOVER' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {ann.type === 'GOAL' ? '⚽ GOL' :
                         ann.type === 'DEFENSE' ? '🛡️ DEF' :
                         ann.type === 'TURNOVER' ? '❌ TURN' :
                         ann.type === 'DROP' ? '⏬ DROP' : ann.type}
                      </span>
                    </span>
                    {canManage && (
                      <button onClick={() => setConfirmState({ id: ann.id, type: ann.type, message: '¿Eliminar anotación?', onYes: () => removeAnnotation(ann.id, ann.type) })} className="ml-4 w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 active:bg-red-300 font-bold text-xl shadow-sm" title="Eliminar">×</button>
                    )}
                  </div>
                )
              })}
              {annotations.length === 0 && <div className="text-center py-6 text-gray-500 font-medium">No hay anotaciones aún.</div>}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex justify-end border-t bg-white z-10">
        <button onClick={onClose} className="w-full sm:w-auto px-8 py-4 rounded-lg bg-gray-900 text-white font-bold text-lg hover:bg-black transition-all shadow-md">
          {embedded ? 'Ocultar Vista' : 'Cerrar Panel'}
        </button>
      </div>
    </div>
  )

  if (embedded) return <>{content}{renderAssistModal()}</>

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-0 sm:p-6" onClick={onClose}>
      {content}
      {renderAssistModal()}
      {confirmState && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={confirmState.message}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => { await confirmState.onYes(); setConfirmState(null) }}
        />
      )}
    </div>
  )
}

function renderPlayerList(
  stats: PlayerStats[], teamName: string, side: 'HOME' | 'AWAY', theme: 'indigo' | 'purple', 
  canManage: boolean, handleGoalClick: any, quickAddAnnotation: any
) {
  const isHome = side === 'HOME';
  const bgColor = theme === 'indigo' ? 'bg-indigo-600' : 'bg-purple-600';
  const headerBgColor = theme === 'indigo' ? 'bg-indigo-50' : 'bg-purple-50';
  const borderColor = theme === 'indigo' ? 'border-indigo-200' : 'border-purple-200';
  
  return (
    <div className={`bg-white border-2 ${borderColor} rounded-xl overflow-hidden shadow-sm`}>
      <div className={`${bgColor} text-white p-3 sm:p-4 text-center font-black text-lg sm:text-2xl uppercase tracking-wide`}>{teamName}</div>
      
      {/* MÓVIL */}
      <div className="sm:hidden divide-y-4 divide-gray-100">
        {stats.map(stat => (
          <div key={`${side}-${stat.playerId || stat.playerNumber}`} className="p-4 bg-white active:bg-gray-50 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <div className="font-black text-2xl text-gray-900">
                <span className="text-gray-400 mr-1">#</span>{stat.playerNumber} <span className="ml-1 truncate">{stat.playerName}</span>
              </div>
              <div className="flex gap-2 text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className={stat.goals > 0 ? 'text-green-600' : ''}>G:{stat.goals}</span>
                <span className={stat.assists > 0 ? 'text-blue-600' : ''}>A:{stat.assists}</span>
                <span className={stat.interceptions > 0 ? 'text-purple-600' : ''}>D:{stat.interceptions}</span>
              </div>
            </div>
            {canManage && (
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleGoalClick(stat.playerId, stat.playerName, stat.playerNumber, side)} className="col-span-2 h-16 bg-green-500 text-white rounded-xl text-xl font-black shadow-[0_6px_0_0_#166534] active:shadow-none active:translate-y-[6px]">GOL</button>
                <button onClick={() => quickAddAnnotation(stat.playerId, stat.playerName, stat.playerNumber, 'DEFENSE', side)} className="col-span-2 h-16 bg-purple-500 text-white rounded-xl text-xl font-black shadow-[0_6px_0_0_#581c87] active:shadow-none active:translate-y-[6px]">DEF</button>
                <button onClick={() => quickAddAnnotation(stat.playerId, stat.playerName, stat.playerNumber, 'TURNOVER', side)} className="col-span-2 h-12 bg-red-500 text-white rounded-xl text-lg font-black shadow-[0_4px_0_0_#991b1b] active:shadow-none active:translate-y-[4px]">TURN</button>
                <button onClick={() => quickAddAnnotation(stat.playerId, stat.playerName, stat.playerNumber, 'DROP', side)} className="col-span-2 h-12 bg-orange-500 text-white rounded-xl text-lg font-black shadow-[0_4px_0_0_#9a3412] active:shadow-none active:translate-y-[4px]">DROP</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* DESKTOP */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-base">
          <thead className={headerBgColor}>
            <tr>
              <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase">#</th>
              <th className="px-4 py-4 text-left font-bold text-gray-700 uppercase">Jugador</th>
              <th className="px-4 py-4 text-center font-bold text-gray-700 uppercase">Goles</th>
              <th className="px-4 py-4 text-center font-bold text-gray-700 uppercase">Asist</th>
              <th className="px-4 py-4 text-center font-bold text-gray-700 uppercase">Def</th>
              {canManage && <th className="px-4 py-4 text-center font-bold text-gray-700 uppercase">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.map(stat => (
              <tr key={`desktop-${side}-${stat.playerId || stat.playerNumber}`} className="hover:bg-gray-50">
                <td className="px-4 py-4 font-black text-2xl text-gray-400">{stat.playerNumber}</td>
                <td className="px-4 py-4 font-bold text-xl text-gray-900">{stat.playerName}</td>
                <td className="px-4 py-4 text-center text-2xl font-black text-green-700 bg-green-50/30">{stat.goals}</td>
                <td className="px-4 py-4 text-center text-2xl font-black text-blue-700 bg-blue-50/30">{stat.assists}</td>
                <td className="px-4 py-4 text-center text-2xl font-black text-purple-700 bg-purple-50/30">{stat.interceptions}</td>
                {canManage && (
                  <td className="px-4 py-4">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleGoalClick(stat.playerId, stat.playerName, stat.playerNumber, side)} className="w-12 h-12 bg-green-500 text-white rounded-xl font-black text-xl hover:bg-green-600 shadow-sm transition-transform active:scale-90" title="GOL">G</button>
                      <button onClick={() => quickAddAnnotation(stat.playerId, stat.playerName, stat.playerNumber, 'DEFENSE', side)} className="w-12 h-12 bg-purple-500 text-white rounded-xl font-black text-xl hover:bg-purple-600 shadow-sm transition-transform active:scale-90" title="DEFENSE">D</button>
                      <button onClick={() => quickAddAnnotation(stat.playerId, stat.playerName, stat.playerNumber, 'TURNOVER', side)} className="w-12 h-12 bg-red-500 text-white rounded-xl font-black text-xl hover:bg-red-600 shadow-sm transition-transform active:scale-90" title="TURNOVER">T</button>
                      <button onClick={() => quickAddAnnotation(stat.playerId, stat.playerName, stat.playerNumber, 'DROP', side)} className="w-12 h-12 bg-orange-500 text-white rounded-xl font-black text-xl hover:bg-orange-600 shadow-sm transition-transform active:scale-90" title="DROP">Dr</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

