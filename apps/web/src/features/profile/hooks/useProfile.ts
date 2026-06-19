import { useEffect, useState } from 'react'
import { authApi, getAuthToken, myRoleRequestsApi, usersApi, eventsApi, attendanceApi, eventParticipantsApi, playersApi } from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../hooks/useToast'
import { useApi } from '../../../hooks/useApi'

export function useProfile() {
  const { user: authUser, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth()
  const toasts = useToast()
  
  const [authDisabled, setAuthDisabled] = useState<boolean>(false)
  const [user, setUser] = useState<{ id: number; email: string; name?: string; roles?: string[]; playerId?: number | null; status?: string } | null>(null)
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [requestNote, setRequestNote] = useState('')
  const [requestPlayerId, setRequestPlayerId] = useState('')
  const [showPlayerDataForm, setShowPlayerDataForm] = useState(false)
  const [playerData, setPlayerData] = useState({ number: '', position: 'CUTTER' as 'HANDLER' | 'CUTTER' | 'HYBRID', heightCm: '', experience: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'password' | 'activity' | 'stats' | 'events' | 'requests' | 'security'>('overview')
  
  // Edit profile state
  const [editName, setEditName] = useState('')
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Activity logs
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  
  // Player stats (if user is a player)
  const [playerStats, setPlayerStats] = useState<{
    totalEvents: number
    eventsAttended: number
    attendanceRate: number
    eventsParticipated: number
    completedEvents: number
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  
  // User events
  const [userEvents, setUserEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  
  // Player info (if linked)
  const [playerInfo, setPlayerInfo] = useState<any>(null)
  
  // Player role toggle
  const [togglingPlayerRole, setTogglingPlayerRole] = useState(false)

  const { execute: updateProfile } = useApi(usersApi.updateProfile, {
    onSuccess: async (data) => {
      setUser(data)
      toasts.success('Perfil actualizado exitosamente')
      try {
        const updatedUser = await refreshUser()
        if (updatedUser) {
          setUser(updatedUser)
          setEditName(updatedUser.name || '')
        }
      } catch (e) {
        console.error('Error refreshing user data:', e)
      }
    },
    showErrorToast: true
  })

  const { execute: changePassword } = useApi(usersApi.changePassword, {
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setChangingPassword(false)
      toasts.success('Contraseña cambiada exitosamente')
    },
    showErrorToast: true
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      setLoading(true)
      
      if (authUser) {
        setUser(authUser)
        setEditName(authUser.name || '')
        setLoading(false)
        
        if (isAuthenticated) {
          try {
            const mine = await myRoleRequestsApi.listMine()
            if (!cancelled) setMyRequests(mine)
          } catch (e: any) {
            if (!cancelled && e?.response?.status !== 401 && e?.response?.status !== 404) {
              console.error('Error loading role requests:', e)
            }
            if (!cancelled) setMyRequests([])
          }
        }
        return
      }
      
      const token = getAuthToken()
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      
      try {
        const me = await authApi.me()
        if (cancelled) return
        if (me.authDisabled) {
          setAuthDisabled(true)
        } else if (me.user) {
          setUser(me.user)
          setEditName(me.user.name || '')
        }
        const mine = await myRoleRequestsApi.listMine()
        if (!cancelled) setMyRequests(mine)
      } catch (e: any) {
        if (!cancelled) {
          if (e?.response?.status === 401) {
            setError(null)
          } else if (e?.response?.status === 404) {
            setMyRequests([])
            setError(null)
          } else {
            setError('No se pudo cargar el perfil')
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [authUser, isAuthenticated])

  useEffect(() => {
    if (user?.playerId) {
      playersApi.list().then(players => {
        const player = players.find(p => p.id === user.playerId)
        if (player) setPlayerInfo(player)
      }).catch(() => {})
    } else {
      setPlayerInfo(null)
    }
  }, [user?.playerId])

  useEffect(() => {
    if (isAuthenticated) {
      myRoleRequestsApi.listMine().then(requests => {
        setMyRequests(requests)
      }).catch((e: any) => {
        setMyRequests([])
        if (e?.response?.status !== 401 && e?.response?.status !== 404) {
          console.error('Error loading role requests:', e)
        }
      })
    }
  }, [isAuthenticated, activeTab])

  useEffect(() => {
    if (activeTab === 'activity' && isAuthenticated) {
      setLoadingActivity(true)
      usersApi.getActivity(50).then(logs => {
        setActivityLogs(logs)
      }).catch((e: any) => {
        setActivityLogs([])
        if (e?.response?.status !== 401 && e?.response?.status !== 404) {
          console.error('Error loading activity logs:', e)
        }
      }).finally(() => {
        setLoadingActivity(false)
      })
    }
  }, [activeTab, isAuthenticated])

  useEffect(() => {
    if (activeTab === 'stats' && user?.playerId && isAuthenticated) {
      setLoadingStats(true)
      const loadStats = async () => {
        try {
          const allEvents = await eventsApi.list()
          const completedEvents = allEvents.filter(e => e.status === 'COMPLETED')
          
          const allAttendances: any[] = []
          for (const event of completedEvents.slice(0, 15)) {
            try {
              const eventAttendances = await attendanceApi.listByEvent(event.id)
              const playerAttendance = eventAttendances.find(a => a.playerId === user.playerId)
              if (playerAttendance) allAttendances.push(playerAttendance)
            } catch {}
          }
          
          const allParticipants: any[] = []
          for (const event of allEvents.slice(0, 15)) {
            try {
              const eventParticipants = await eventParticipantsApi.listByEvent(event.id)
              const playerParticipant = eventParticipants.find(p => p.playerId === user.playerId)
              if (playerParticipant) allParticipants.push(playerParticipant)
            } catch {}
          }
          
          const eventsAttended = allAttendances.filter(a => a.status === 'present').length
          const totalCompleted = completedEvents.length
          const attendanceRate = totalCompleted > 0 ? Math.round((eventsAttended / totalCompleted) * 100) : 0
          
          setPlayerStats({
            totalEvents: allEvents.length,
            eventsAttended,
            attendanceRate,
            eventsParticipated: allParticipants.length,
            completedEvents: totalCompleted
          })
        } catch (error) {
          console.error('Error loading player stats:', error)
          setPlayerStats(null)
        } finally {
          setLoadingStats(false)
        }
      }
      loadStats()
    }
  }, [activeTab, user?.playerId, isAuthenticated])

  useEffect(() => {
    if (activeTab === 'events' && user?.playerId && isAuthenticated) {
      setLoadingEvents(true)
      eventsApi.list().then(events => {
        Promise.all(events.map(async (event) => {
          try {
            const participants = await eventParticipantsApi.listByEvent(event.id)
            const isParticipant = participants.some(p => p.playerId === user.playerId)
            if (isParticipant) {
              const attendances = await attendanceApi.listByEvent(event.id).catch(() => [])
              const attendance = attendances.find(a => a.playerId === user.playerId)
              return { ...event, attendance }
            }
            return null
          } catch {
            return null
          }
        })).then(results => {
          setUserEvents(results.filter(e => e !== null))
        }).finally(() => {
          setLoadingEvents(false)
        })
      }).catch(() => {
        setUserEvents([])
        setLoadingEvents(false)
      })
    }
  }, [activeTab, user?.playerId, isAuthenticated])

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toasts.error('El nombre no puede estar vacío')
      return
    }
    await updateProfile({ name: editName.trim() })
  }

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toasts.error('Todos los campos son requeridos')
      return
    }
    if (newPassword.length < 6) {
      toasts.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword.length > 128) {
      toasts.error('La contraseña es demasiado larga (máximo 128 caracteres)')
      return
    }
    if (newPassword !== confirmPassword) {
      toasts.error('Las contraseñas no coinciden')
      return
    }
    changePassword({ currentPassword, newPassword })
  }

  const handleRoleRequest = async () => {
    try {
      const payload: any = {
        role: 'player',
        note: requestNote.trim() || undefined
      }
      
      if (showPlayerDataForm) {
        payload.playerData = {
          number: Number(playerData.number),
          position: playerData.position,
          status: 'ACTIVE',
          heightCm: playerData.heightCm ? Number(playerData.heightCm) : undefined,
          experience: playerData.experience.trim() || undefined,
        }
      } else if (requestPlayerId) {
        payload.playerId = Number(requestPlayerId)
      }
      
      await myRoleRequestsApi.create(payload)
      setRequestNote('')
      setRequestPlayerId('')
      setShowPlayerDataForm(false)
      setPlayerData({ number: '', position: 'CUTTER', heightCm: '', experience: '' })
      const mine = await myRoleRequestsApi.listMine()
      setMyRequests(mine)
      toasts.success('Solicitud enviada exitosamente')
    } catch (e: any) {
      toasts.error(e?.response?.data?.error || 'No se pudo enviar la solicitud')
    }
  }

  const handleTogglePlayerRole = async () => {
    if (!user) return
    const newState = !user.roles?.includes('player')
    setTogglingPlayerRole(true)
    try {
      const updated = await usersApi.togglePlayerRole(newState)
      setUser(updated)
      await refreshUser()
      toasts.success(
        newState 
          ? 'Rol de jugador activado. Ahora puedes ver estadísticas y participar en eventos como jugador.' 
          : 'Rol de jugador desactivado. Ya no verás estadísticas de jugador.'
      )
    } catch (e: any) {
      toasts.error(e?.response?.data?.error || 'No se pudo cambiar el estado del rol de jugador')
    } finally {
      setTogglingPlayerRole(false)
    }
  }

  return {
    state: {
      authDisabled, user, myRequests, requestNote, requestPlayerId, showPlayerDataForm,
      playerData, error, loading, activeTab, editName, currentPassword, newPassword,
      confirmPassword, changingPassword, activityLogs, loadingActivity, playerStats,
      loadingStats, userEvents, loadingEvents, playerInfo, togglingPlayerRole, authLoading, isAuthenticated
    },
    actions: {
      setAuthDisabled, setUser, setMyRequests, setRequestNote, setRequestPlayerId, setShowPlayerDataForm,
      setPlayerData, setError, setLoading, setActiveTab, setEditName, setCurrentPassword, setNewPassword,
      setConfirmPassword, setChangingPassword, setActivityLogs, setLoadingActivity, setPlayerStats,
      setLoadingStats, setUserEvents, setLoadingEvents, setPlayerInfo, setTogglingPlayerRole,
      handleUpdateProfile, handleChangePassword, handleRoleRequest, handleTogglePlayerRole
    }
  }
}
