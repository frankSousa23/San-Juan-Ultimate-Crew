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
}

type LineFilter = 'ALL' | 'O-LINE' | 'D-LINE' | 'ACTIVE'

export default function LiveAnnotationsTable({ event, onClose, embedded = false }: LiveAnnotationsTableProps) {
  const { user, hasPermission, hasRole } = useAuth()
  const toasts = useToast()
  const isGuest = hasRole('guest') || user?.email === 'guest@sjuc.com'
  const canManage = hasPermission('annotations:manage') || hasPermission('events:manage') || hasRole('admin') || hasRole('captain') || hasRole('coach') || hasRole('directiva') || hasRole('annotator') || isGuest || event.id < 0
  
  const [annotations, setAnnotations] = useState<EventAnnotation[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<{ id: number; message: string; type: AnnotationType; onYes: () => Promise<void> } | null>(null)
  
  // Filtros rápidos táctiles
  const [lineFilter, setLineFilter] = useState<LineFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'HOME' | 'AWAY'>('HOME')

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
  const [opponentTeamName, setOpponentTeamName] = useState(isInternal ? 'Equipo Oscuro' : 'Equipo Rival')
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
    if (event.id > 0) {
      const interval = setInterval(loadData, 4000)
      return () => clearInterval(interval)
    }
  }, [event.id])

  const loadData = async () => {
    try {
      if (event.id < 0) {
        // Simulador de prueba / Modo Sandbox
        let pls: Player[] = []
        try {
          pls = await playersApi.list()
        } catch {
          pls = []
        }
        if (pls.length === 0) {
          pls = [
            { id: 101, name: 'Carlos Mendoza (Capitán)', number: 7, position: 'HANDLER', status: 'ACTIVE' } as any,
            { id: 102, name: 'Alejandro Ramos', number: 10, position: 'CUTTER', status: 'ACTIVE' } as any,
            { id: 103, name: 'Gabriela Silva', number: 14, position: 'HYBRID', status: 'ACTIVE' } as any,
            { id: 104, name: 'David Peña', number: 23, position: 'CUTTER', status: 'ACTIVE' } as any,
            { id: 105, name: 'Valeria Rivas', number: 88, position: 'HANDLER', status: 'ACTIVE' } as any,
          ]
        }
        setPlayers(pls)
        setLoading(false)
        return
      }

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
      const assists = annotations.filter(a => a.relatedPlayerId === player.id && a.type === 'GOAL').length

      statsMap.set(key, {
        playerId: player.id,
        playerName: player.name,
        playerNumber: player.number,
        teamName: homeTeamName,
        teamSide: 'HOME',
        goals: playerAnns.filter(a => a.type === 'GOAL').length,
        assists,
        interceptions: playerAnns.filter(a => a.type === 'DEFENSE' || a.type === 'CALLAHAN').length,
        turnovers: playerAnns.filter(a => a.type === 'TURNOVER').length,
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
          interceptions: playerAnns.filter(a => a.type === 'DEFENSE' || a.type === 'CALLAHAN').length,
          turnovers: playerAnns.filter(a => a.type === 'TURNOVER').length,
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
          assists: 0,
          interceptions: playerAnns.filter(a => a.type === 'DEFENSE' || a.type === 'CALLAHAN').length,
          turnovers: playerAnns.filter(a => a.type === 'TURNOVER').length,
        })
      })
    }
    
    return Array.from(statsMap.values())
  }, [annotations, players, opponentPlayers, isVersus, isInternal, homeTeamName, opponentTeamName])

  const addOpponentPlayer = () => {
    if (!newOpponentPlayerName.trim() || !newOpponentPlayerNumber.trim()) return toasts.error('Nombre y número son requeridos')
    const num = Number(newOpponentPlayerNumber)
    if (isNaN(num) || num <= 0) return toasts.error('Número inválido')
    if (opponentPlayers.some(p => p.number === num)) return toasts.error('Ese dorsal ya existe')
    setOpponentPlayers(prev => [...prev, { name: newOpponentPlayerName.trim(), number: num }])
    setNewOpponentPlayerName('')
    setNewOpponentPlayerNumber('')
    toasts.success(`Rival #${num} agregado`)
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
      const typeLabel = type === 'GOAL' ? '⚽ ¡GOL ANOTADO!' : type === 'DEFENSE' ? '🛡️ ¡DEFENSA (D) REGISTRADA!' : '❌ TURNOVER REGISTRADO'

      if (event.id < 0) {
        // En modo simulación / sandbox, manejamos el estado de manera reactiva local
        const pObj = playerId ? players.find(p => p.id === playerId) : undefined
        const newScoreHome = type === 'GOAL' && (teamSide === 'HOME' || !teamSide) ? scoreHome + 1 : scoreHome
        const newScoreAway = type === 'GOAL' && teamSide === 'AWAY' ? scoreAway + 1 : scoreAway

        const fakeAnn: EventAnnotation = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          eventId: event.id,
          type,
          playerId: playerId || null,
          player: pObj ? { id: pObj.id, name: pObj.name, number: pObj.number } : undefined,
          relatedPlayerId: relatedPlayerId || null,
          opponentPlayerName: playerName || null,
          opponentPlayerNumber: playerNumber || null,
          opponentTeamName: opponentTeamName || null,
          teamSide: teamSide || 'HOME',
          timestamp: new Date().toISOString(),
          scoreHome: newScoreHome,
          scoreAway: newScoreAway,
        }

        setAnnotations(prev => [fakeAnn, ...prev])
        if (type === 'GOAL') {
          if (teamSide === 'HOME' || !teamSide) setScoreHome(prev => prev + 1)
          else setScoreAway(prev => prev + 1)
        }
        toasts.success(typeLabel)
        return
      }

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
      
      toasts.success(typeLabel)
    } catch (err: any) {
      toasts.error(err?.response?.data?.error || 'No se pudo registrar la anotación')
      await loadData()
    }
  }

  const removeAnnotation = async (annotationId: number, type: AnnotationType) => {
    if (!canManage) return
    try {
      if (event.id < 0) {
        const ann = annotations.find(a => a.id === annotationId)
        setAnnotations(prev => prev.filter(a => a.id !== annotationId))
        if (type === 'GOAL') {
          if (ann?.teamSide === 'HOME' || (!ann?.teamSide && !ann?.opponentTeamName)) {
            setScoreHome(prev => Math.max(0, prev - 1))
          } else if (ann?.teamSide === 'AWAY') {
            setScoreAway(prev => Math.max(0, prev - 1))
          }
        }
        toasts.success('Anotación eliminada')
        return
      }

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

  // Filtrado de jugadores
  const filterStats = (list: PlayerStats[]) => {
    return list.filter(item => {
      // Filtro de búsqueda por dorsal o nombre
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchNum = item.playerNumber?.toString().includes(q)
        const matchName = item.playerName.toLowerCase().includes(q)
        if (!matchNum && !matchName) return false
      }
      // Filtro de línea
      if (lineFilter === 'ACTIVE') {
        return item.goals > 0 || item.assists > 0 || item.interceptions > 0 || item.turnovers > 0
      }
      return true
    })
  }

  const homeStats = filterStats(playerStats.filter(s => s.teamSide === 'HOME'))
  const awayStats = filterStats(playerStats.filter(s => s.teamSide === 'AWAY'))

  const renderAssistModal = () => {
    if (!assistModal) return null
    
    let options: PlayerStats[] = []
    if (assistModal.teamSide === 'HOME') {
      options = playerStats.filter(s => s.teamSide === 'HOME' && s.playerId !== assistModal.playerId)
    } else if (assistModal.teamSide === 'AWAY' && isInternal) {
      options = playerStats.filter(s => s.teamSide === 'AWAY' && s.playerId !== assistModal.playerId)
    }

    return (
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[80] flex items-center justify-center p-3 sm:p-4 touch-manipulation select-none" 
        onClick={() => setAssistModal(null)}
      >
        <div 
          className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header Modal */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4 sm:p-5 text-white flex justify-between items-center shadow-md">
            <div>
              <div className="text-xs uppercase tracking-widest font-black text-green-200">Registro de Gol</div>
              <h3 className="font-black text-xl sm:text-2xl flex items-center gap-2">
                <span>⚽ Anotador:</span>
                <span className="bg-white text-green-800 px-2.5 py-0.5 rounded-lg text-lg sm:text-xl font-black">
                  #{assistModal.playerNumber}
                </span>
                <span className="truncate max-w-[180px] sm:max-w-[240px]">{assistModal.playerName}</span>
              </h3>
            </div>
            <button 
              onClick={() => setAssistModal(null)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 flex items-center justify-center text-white text-2xl font-bold transition-all"
            >
              ×
            </button>
          </div>
          
          {/* Opciones Táctiles de Asistencia */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
            <div className="text-center font-bold text-gray-700 text-sm uppercase tracking-wide">
              Selecciona quién dio el pase de gol:
            </div>

            {/* Botón Gigante Sin Asistencia */}
            <button
              onClick={() => {
                quickAddAnnotation(assistModal.playerId, assistModal.playerName, assistModal.playerNumber, 'GOAL', assistModal.teamSide, null)
                setAssistModal(null)
              }}
              className="w-full py-4 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-lg sm:text-xl rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-amber-400"
            >
              <span className="text-2xl">⚡</span>
              <span>SIN ASISTENCIA / CALLAHAN / ERROR</span>
            </button>

            {/* Cuadrícula Táctil de Compañeros */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {options.map(opt => (
                <button
                  key={`assist-${opt.playerId}`}
                  onClick={() => {
                    quickAddAnnotation(assistModal.playerId, assistModal.playerName, assistModal.playerNumber, 'GOAL', assistModal.teamSide, opt.playerId)
                    setAssistModal(null)
                  }}
                  className="p-3 sm:p-4 bg-gray-50 hover:bg-green-50 active:bg-green-100 border-2 border-gray-200 hover:border-green-500 rounded-2xl text-left transition-all active:scale-95 flex flex-col justify-between h-24 sm:h-28 shadow-sm group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl sm:text-2xl font-black text-green-700 group-hover:scale-110 transition-transform">
                      #{opt.playerNumber}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 group-hover:bg-green-200 text-gray-700 rounded-full">
                      Ast: {opt.assists}
                    </span>
                  </div>
                  <div className="font-bold text-gray-900 text-sm sm:text-base truncate leading-tight">
                    {opt.playerName}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-3 sm:p-4 border-t bg-gray-50 flex justify-end">
            <button 
              onClick={() => setAssistModal(null)} 
              className="w-full sm:w-auto px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 active:bg-gray-300 rounded-xl transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const content = (
    <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-7xl max-h-[96vh] overflow-hidden flex flex-col shadow-2xl touch-manipulation" onClick={e => !embedded && e.stopPropagation()}>
      
      {/* 1. HEADER & MARCADOR STICKY */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl">
        
        {/* Barra superior con título y controles */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-indigo-700/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xl sm:text-2xl">🥏</span>
            <div className="truncate">
              <h2 className="text-base sm:text-xl font-black truncate leading-tight">{event.title}</h2>
              <p className="text-xs text-indigo-200 font-medium truncate">{isInternal ? 'Scrimmage Interno' : event.type} • {event.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManage && !isInternal && (
              <label className="hidden sm:flex items-center gap-2 bg-indigo-950/60 hover:bg-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-500/30 text-xs font-bold cursor-pointer transition-all">
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
                  className="rounded w-4 h-4 text-purple-500 focus:ring-purple-400 cursor-pointer"
                />
                <span>Modo Versus Rival</span>
              </label>
            )}
            <button 
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm transition-all"
            >
              {embedded ? 'Ocultar' : 'Cerrar ✕'}
            </button>
          </div>
        </div>

        {/* MARCADOR GIGANTE EN VIVO */}
        {(isVersus || isInternal) && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-black/20 to-black/40">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
              
              {/* Equipo Local */}
              <div className="flex-1 text-center bg-indigo-950/40 p-2 sm:p-3 rounded-2xl border border-indigo-400/20 backdrop-blur-sm">
                <div className="text-xs sm:text-sm font-black text-indigo-300 uppercase tracking-wider truncate mb-1">
                  {homeTeamName}
                </div>
                <div className="text-4xl sm:text-7xl font-black text-white tracking-tight drop-shadow-md">
                  {scoreHome}
                </div>
              </div>

              {/* Centro VS */}
              <div className="text-center px-2">
                <div className="text-xs font-black text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest mb-1">
                  EN VIVO
                </div>
                <div className="text-xl sm:text-3xl font-black text-indigo-300 opacity-60">
                  VS
                </div>
              </div>

              {/* Equipo Visitante */}
              <div className="flex-1 text-center bg-purple-950/40 p-2 sm:p-3 rounded-2xl border border-purple-400/20 backdrop-blur-sm">
                <div className="text-xs sm:text-sm font-black text-purple-300 uppercase tracking-wider truncate mb-1">
                  {opponentTeamName || 'Rival'}
                </div>
                <div className="text-4xl sm:text-7xl font-black text-white tracking-tight drop-shadow-md">
                  {scoreAway}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE FILTROS TÁCTILES RÁPIDOS */}
        <div className="px-3 sm:px-6 py-2 bg-indigo-950/80 border-t border-indigo-800/60 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          
          {/* Tabs Móvil Local/Visitante */}
          {(isVersus || isInternal) && (
            <div className="flex lg:hidden bg-indigo-900/80 p-1 rounded-xl border border-indigo-700/60 w-full sm:w-auto justify-stretch">
              <button
                onClick={() => setActiveTab('HOME')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg font-black transition-all ${
                  activeTab === 'HOME' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-200 hover:text-white'
                }`}
              >
                🔵 {homeTeamName} ({homeStats.length})
              </button>
              <button
                onClick={() => setActiveTab('AWAY')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg font-black transition-all ${
                  activeTab === 'AWAY' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-200 hover:text-white'
                }`}
              >
                🟣 {opponentTeamName || 'Rival'} ({awayStats.length})
              </button>
            </div>
          )}

          {/* Buscador Rápido de Dorsal */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <span className="text-indigo-300 font-bold">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por # dorsal o nombre..."
              className="w-full bg-indigo-900/60 border border-indigo-700 text-white placeholder-indigo-300/60 px-3 py-1.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-indigo-300 hover:text-white font-bold px-1.5">✕</button>
            )}
          </div>

          {/* Filtros de Línea */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setLineFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                lineFilter === 'ALL' ? 'bg-white text-indigo-950 shadow-sm' : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setLineFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                lineFilter === 'ACTIVE' ? 'bg-amber-400 text-amber-950 shadow-sm' : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-900'
              }`}
            >
              Con Puntos
            </button>
          </div>
        </div>
      </div>

      {/* 2. CUERPO SCROLLABLE DE ANOTACIONES */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-gray-100 space-y-6">
        {loading && <div className="text-gray-600 text-center py-12 font-bold text-lg animate-pulse">Cargando pizarra de juego en tiempo real...</div>}
        {error && <div className="text-red-600 text-center py-4 bg-red-50 rounded-xl font-bold border border-red-200">{error}</div>}
        
        {/* Panel de Configuración Rápida de Rival en Versus */}
        {!loading && canManage && isVersus && !isInternal && (
          <div className="p-3 sm:p-4 bg-white shadow-sm border border-purple-100 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-black text-gray-600 uppercase mb-1">Nombre Equipo Local</label>
                <input 
                  type="text" 
                  value={homeTeamName} 
                  onChange={(e) => setHomeTeamName(e.target.value)} 
                  className="w-full px-3 py-2 text-sm sm:text-base border-2 border-gray-200 focus:border-indigo-500 rounded-xl font-bold" 
                  placeholder="Local" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-black text-gray-600 uppercase mb-1">Nombre Equipo Visitante</label>
                <input 
                  type="text" 
                  value={opponentTeamName} 
                  onChange={(e) => setOpponentTeamName(e.target.value)} 
                  className="w-full px-3 py-2 text-sm sm:text-base border-2 border-gray-200 focus:border-purple-500 rounded-xl font-bold" 
                  placeholder="Oponente" 
                />
              </div>
            </div>
            
            {opponentTeamName && (
              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs font-black text-gray-600 uppercase mb-2">Agregar Jugadores Rivales para Scouting:</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {opponentPlayers.map(opp => (
                    <div key={`${opp.number}-${opp.name}`} className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs font-bold text-purple-900">
                      <span>#{opp.number} {opp.name}</span>
                      <button onClick={() => removeOpponentPlayer(opp.number)} className="text-purple-400 hover:text-red-600 font-bold ml-1">✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={newOpponentPlayerNumber} 
                    onChange={(e) => setNewOpponentPlayerNumber(e.target.value)} 
                    placeholder="#" 
                    className="w-16 px-2.5 py-2 text-center text-sm font-bold rounded-xl border-2 border-gray-200" 
                    min="1" 
                  />
                  <input 
                    type="text" 
                    value={newOpponentPlayerName} 
                    onChange={(e) => setNewOpponentPlayerName(e.target.value)} 
                    placeholder="Nombre rival..." 
                    className="flex-1 px-3 py-2 text-sm font-bold rounded-xl border-2 border-gray-200" 
                  />
                  <button 
                    onClick={addOpponentPlayer} 
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all"
                  >
                    + AGREGAR
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LISTAS TÁCTILES DE JUGADORES */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* VISTA LOCAL (San Juan UC) */}
            <div className={`${(isVersus || isInternal) && activeTab !== 'HOME' ? 'hidden lg:block' : 'block'}`}>
              {renderTacticalPlayerList(
                homeStats, 
                homeTeamName, 
                'HOME', 
                'indigo', 
                canManage, 
                handleGoalClick, 
                quickAddAnnotation
              )}
            </div>

            {/* VISTA VISITANTE (Rival u Oscuro) */}
            {(isVersus || isInternal) && (
              <div className={`${activeTab !== 'AWAY' ? 'hidden lg:block' : 'block'}`}>
                {renderTacticalPlayerList(
                  awayStats, 
                  opponentTeamName || 'Visitante', 
                  'AWAY', 
                  'purple', 
                  canManage, 
                  handleGoalClick, 
                  quickAddAnnotation
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. HISTORIAL DE ANOTACIONES EN VIVO */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base sm:text-lg font-black text-gray-800 flex items-center gap-2">
                <span className="text-xl">⏱️</span> Línea de Tiempo del Partido ({annotations.length} jugadas)
              </div>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {annotations.slice(0, 20).map(ann => {
                const isGoal = ann.type === 'GOAL'
                const assister = isGoal && ann.relatedPlayerId ? players.find(p => p.id === ann.relatedPlayerId) : null
                
                return (
                  <div 
                    key={ann.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      ann.type === 'GOAL' ? 'bg-green-50/60 border-green-200' :
                      ann.type === 'DEFENSE' ? 'bg-purple-50/60 border-purple-200' :
                      ann.type === 'TURNOVER' ? 'bg-red-50/60 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shadow-sm ${
                        ann.type === 'GOAL' ? 'bg-green-500 text-white' :
                        ann.type === 'DEFENSE' ? 'bg-purple-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {ann.type === 'GOAL' ? '⚽' : ann.type === 'DEFENSE' ? '🛡️' : '❌'}
                      </span>
                      <div>
                        <div className="font-black text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          <span>
                            {ann.player ? `#${ann.player.number} ${ann.player.name}` : 
                             ann.opponentPlayerName ? `#${ann.opponentPlayerNumber} ${ann.opponentPlayerName} (${ann.opponentTeamName || 'Rival'})` : 
                             'Jugador no especificado'}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            ann.type === 'GOAL' ? 'bg-green-200 text-green-800' :
                            ann.type === 'DEFENSE' ? 'bg-purple-200 text-purple-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {ann.type}
                          </span>
                        </div>
                        {assister && (
                          <div className="text-xs text-green-700 font-bold mt-0.5">
                            🎯 Asistencia de: #{assister.number} {assister.name}
                          </div>
                        )}
                        {ann.note && <div className="text-xs text-gray-500 mt-0.5">{ann.note}</div>}
                      </div>
                    </div>

                    {canManage && (
                      <button 
                        onClick={() => setConfirmState({ 
                          id: ann.id, 
                          type: ann.type, 
                          message: `¿Eliminar esta anotación de ${ann.type}?`, 
                          onYes: () => removeAnnotation(ann.id, ann.type) 
                        })} 
                        className="w-9 h-9 flex items-center justify-center bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-600 rounded-xl font-black text-lg transition-all"
                        title="Eliminar anotación"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
              {annotations.length === 0 && (
                <div className="text-center py-8 text-gray-400 font-medium">
                  Aún no hay anotaciones en este partido. ¡Presiona GOL, DEF o TURNOVER en los jugadores arriba para comenzar!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. FOOTER */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200 flex justify-between items-center z-10">
        <div className="text-xs text-gray-500 font-medium hidden sm:block">
          Modo Torneo y Pizarra Táctil activa • San Juan Ultimate Crew
        </div>
        <button 
          onClick={onClose} 
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gray-900 hover:bg-black active:scale-95 text-white font-black text-sm sm:text-base transition-all shadow-md"
        >
          {embedded ? 'Ocultar Pizarra' : 'Salir de la Pizarra'}
        </button>
      </div>
    </div>
  )

  if (embedded) return <>{content}{renderAssistModal()}</>

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-0 sm:p-4 lg:p-6" onClick={onClose}>
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

/**
 * Renderizador de lista táctil de jugadores con botones táctiles ultra-optimizados
 */
function renderTacticalPlayerList(
  stats: PlayerStats[], 
  teamName: string, 
  side: 'HOME' | 'AWAY', 
  theme: 'indigo' | 'purple', 
  canManage: boolean, 
  handleGoalClick: any, 
  quickAddAnnotation: any
) {
  const bgColor = theme === 'indigo' ? 'bg-gradient-to-r from-indigo-700 to-indigo-800' : 'bg-gradient-to-r from-purple-700 to-purple-800'
  const borderColor = theme === 'indigo' ? 'border-indigo-200' : 'border-purple-200'
  
  return (
    <div className={`bg-white border-2 ${borderColor} rounded-2xl overflow-hidden shadow-sm flex flex-col h-full select-none touch-manipulation`}>
      {/* Header Equipo */}
      <div className={`${bgColor} text-white px-4 py-3 text-center flex items-center justify-between shadow-sm`}>
        <span className="font-black text-base sm:text-lg uppercase tracking-wide truncate">
          {teamName}
        </span>
        <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
          {stats.length} Jugadores
        </span>
      </div>
      
      {/* Lista de Tarjetas Táctiles de Jugador */}
      <div className="divide-y divide-gray-100 overflow-y-auto max-h-[520px]">
        {stats.map(stat => (
          <div 
            key={`${side}-${stat.playerId || stat.playerNumber}`} 
            className="p-3 sm:p-4 hover:bg-gray-50/80 transition-colors"
          >
            {/* Fila 1: Datos del Jugador y Estadísticas Resumidas */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5 truncate">
                <span className="w-9 h-9 rounded-xl bg-gray-900 text-white font-black text-base flex items-center justify-center shadow-sm">
                  #{stat.playerNumber}
                </span>
                <span className="font-black text-gray-900 text-base sm:text-lg truncate">
                  {stat.playerName}
                </span>
              </div>
              
              {/* Badges de Estadísticas */}
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span className={`px-2 py-0.5 rounded-md ${stat.goals > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`} title="Goles anotados">
                  G:{stat.goals}
                </span>
                <span className={`px-2 py-0.5 rounded-md ${stat.assists > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`} title="Asistencias de gol">
                  A:{stat.assists}
                </span>
                <span className={`px-2 py-0.5 rounded-md ${stat.interceptions > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'}`} title="Intercepciones / Defensas">
                  D:{stat.interceptions}
                </span>
                <span className={`px-2 py-0.5 rounded-md ${stat.turnovers > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`} title="Turnovers (Pérdidas / Caídas)">
                  T:{stat.turnovers}
                </span>
              </div>
            </div>

            {/* Fila 2: Botones Táctiles de Acción Rápida (Gol, Intercepción/Defensa, Turnover) */}
            {canManage && (
              <div className="grid grid-cols-3 gap-2">
                {/* Botón GOL */}
                <button 
                  onClick={() => handleGoalClick(stat.playerId, stat.playerName, stat.playerNumber, side)} 
                  className="h-12 sm:h-14 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl font-black text-sm sm:text-base shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 border-b-4 border-green-800 active:border-b-0"
                  title="Anotar Gol y seleccionar asistente"
                >
                  <span className="text-lg">⚽</span>
                  <span>GOL</span>
                </button>

                {/* Botón DEF (Intercepción / Recuperación) */}
                <button 
                  onClick={() => quickAddAnnotation(stat.playerId, stat.playerName, stat.playerNumber, 'DEFENSE', side)} 
                  className="h-12 sm:h-14 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-black text-sm sm:text-base shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 border-b-4 border-purple-800 active:border-b-0"
                  title="Registrar Intercepción / Defensa ganada"
                >
                  <span className="text-lg">🛡️</span>
                  <span>DEF</span>
                </button>

                {/* Botón TURNOVER (Pérdida / Caída / Mal pase) */}
                <button 
                  onClick={() => quickAddAnnotation(stat.playerId, stat.playerName, stat.playerNumber, 'TURNOVER', side)} 
                  className="h-12 sm:h-14 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-black text-sm sm:text-base shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 border-b-4 border-red-800 active:border-b-0"
                  title="Registrar Turnover (Pérdida de disco, caída o mal pase)"
                >
                  <span className="text-lg">❌</span>
                  <span>TURNOVER</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {stats.length === 0 && (
          <div className="p-8 text-center text-gray-400 font-medium text-sm">
            No hay jugadores que coincidan con la búsqueda o filtro.
          </div>
        )}
      </div>
    </div>
  )
}
