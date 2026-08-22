import React, { useEffect, useState } from 'react'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import { http, adminUsersApi, usersApi } from '../lib/api'

interface UserItem { 
  id: number; 
  email: string; 
  name?: string; 
  roles: string[]; 
  playerId: number | null; 
  player?: {
    id: number;
    name?: string;
    number: number;
    position: 'HANDLER' | 'CUTTER' | 'HYBRID';
    heightCm?: number | null;
    experience?: string | null;
    status?: string;
    teamId?: number | null;
  } | null;
  teamId?: number | null; 
  teamName?: string | null; 
  status?: string; 
  createdAt?: string 
}

export const SYSTEM_ROLES = [
  { id: 'admin', label: 'Admin', description: 'Acceso total y configuración del sistema', badgeColor: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'directiva', label: 'Directiva', description: 'Gestión institucional, eventos, equipos y supervisión', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'coach', label: 'Entrenador', description: 'Tácticas, jugadas, convocatorias y estadísticas deportivas', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'captain', label: 'Capitán', description: 'Roster de partido, alineaciones O/D y mesa técnica', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'treasurer', label: 'Tesorero', description: 'Finanzas, cuentas, ingresos, egresos y balances', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'annotator', label: 'Anotador', description: 'Oficial de mesa técnica para actas de partido en vivo', badgeColor: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'player', label: 'Jugador', description: 'Atleta registrado con ficha deportiva y eventos', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'guest', label: 'Refuerzo', description: 'Invitado / Refuerzo temporal con acceso acotado', badgeColor: 'bg-gray-100 text-gray-800 border-gray-200' },
] as const

export function getRoleBadge(roleName: string) {
  const found = SYSTEM_ROLES.find(r => r.id === roleName)
  if (found) {
    return { label: found.label, badgeColor: found.badgeColor }
  }
  return { label: roleName, badgeColor: 'bg-gray-100 text-gray-700 border-gray-200' }
}

export default function AdminUsers() {
  const toast = useToast()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<Record<number, string>>({})
  const [roles, setRoles] = useState<Record<number, Set<string>>>({})
  const [requests, setRequests] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [teamSelection, setTeamSelection] = useState<Record<number, string>>({})
  const [requestStatus, setRequestStatus] = useState<'PENDING'|'APPROVED'|'DENIED'>('PENDING')
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestPlayerId, setRequestPlayerId] = useState<Record<number, string>>({})
  const [requestNote, setRequestNote] = useState<Record<number, string>>({})
  const [requestSaving, setRequestSaving] = useState<Record<number, boolean>>({})
  const [requestError, setRequestError] = useState<Record<number, string | null>>({})
  const [requestSaved, setRequestSaved] = useState<Record<number, boolean>>({})
  const [pendingUsers, setPendingUsers] = useState<UserItem[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [approveRole, setApproveRole] = useState<Record<number, string>>({})
  const [approvePlayerId, setApprovePlayerId] = useState<Record<number, string>>({})
  const [approving, setApproving] = useState<Record<number, boolean>>({})
  const [showPlayerForm, setShowPlayerForm] = useState<Record<number, boolean>>({})
  const [playerData, setPlayerData] = useState<Record<number, { number: string; position: 'HANDLER' | 'CUTTER' | 'HYBRID'; heightCm: string; experience: string }>>({})
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [deleting, setDeleting] = useState<Record<number, boolean>>({})
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; confirmText: string; onYes: () => void } | null>(null)

  // Multi-role edit modal state
  const [editingRolesUser, setEditingRolesUser] = useState<UserItem | null>(null)
  const [selectedRolesForEdit, setSelectedRolesForEdit] = useState<string[]>([])
  const [savingRoles, setSavingRoles] = useState(false)
  const [showRoleGuide, setShowRoleGuide] = useState(false)

  // Password reset modal state
  const [passwordModalUser, setPasswordModalUser] = useState<{ id: number; email: string; name?: string } | null>(null)
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null)
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleOpenPasswordModal = (user: { id: number; email: string; name?: string }) => {
    setPasswordModalUser(user)
    setNewPasswordInput('')
    setShowPassword(true)
    setGeneratedResetLink(null)
    setCopiedLink(false)
  }

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let result = ''
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPasswordInput(result)
    setShowPassword(true)
  }

  const handleSavePassword = async () => {
    if (!passwordModalUser) return
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      toast.showErrorToast('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setSavingPassword(true)
    try {
      await adminUsersApi.changePassword(passwordModalUser.id, newPasswordInput.trim())
      toast.showSuccessToast(`Contraseña actualizada para ${passwordModalUser.email}`)
      setPasswordModalUser(null)
    } catch (err: any) {
      toast.showErrorToast(err?.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleGenerateResetLink = async () => {
    if (!passwordModalUser) return
    setGeneratingLink(true)
    try {
      const res = await adminUsersApi.generateResetLink(passwordModalUser.id)
      setGeneratedResetLink(res.resetLink)
      toast.showSuccessToast('Enlace de restablecimiento generado con éxito')
    } catch (err: any) {
      toast.showErrorToast(err?.response?.data?.error || 'Error al generar enlace')
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleCopyResetLink = async () => {
    if (!generatedResetLink) return
    try {
      await navigator.clipboard.writeText(generatedResetLink)
      setCopiedLink(true)
      toast.showSuccessToast('¡Enlace copiado al portapapeles!')
      setTimeout(() => setCopiedLink(false), 3000)
    } catch {
      toast.showErrorToast('No se pudo copiar automáticamente')
    }
  }

  const loadPendingUsers = async () => {
    setPendingLoading(true)
    try {
      const data = await usersApi.list('PENDING')
      setPendingUsers(data)
      const initRole: Record<number, string> = {}
      const initPlayer: Record<number, string> = {}
      const initPlayerData: Record<number, { number: string; position: 'HANDLER' | 'CUTTER' | 'HYBRID'; heightCm: string; experience: string }> = {}
      for (const u of data) {
        initRole[u.id] = 'player'
        initPlayer[u.id] = u.playerId ? String(u.playerId) : ''
        if (u.player) {
          initPlayerData[u.id] = {
            number: String(u.player.number ?? ''),
            position: (u.player.position as any) || 'CUTTER',
            heightCm: u.player.heightCm ? String(u.player.heightCm) : '',
            experience: u.player.experience || ''
          }
        }
      }
      setApproveRole(initRole)
      setApprovePlayerId(initPlayer)
      setPlayerData(initPlayerData)
    } catch (e: any) {
      toast.showErrorToast(e?.response?.data?.error || 'No se pudieron cargar usuarios pendientes')
    } finally {
      setPendingLoading(false)
    }
  }

  const handleApproveUser = async (id: number) => {
    const user = pendingUsers.find(u => u.id === id)
    const role = approveRole[id] || 'player'
    const hasPlayerId = approvePlayerId[id] && approvePlayerId[id].trim() !== ''
    const currentPlayerData = playerData[id]
    const hasRegisteredPlayer = !!user?.player || !!user?.playerId
    
    // If role is 'player', user has NO registered player data, NO playerId, and form not open:
    if (role === 'player' && !hasRegisteredPlayer && !showPlayerForm[id]) {
      setShowPlayerForm(prev => ({ ...prev, [id]: true }))
      setPlayerData(prev => ({ ...prev, [id]: { number: '', position: 'CUTTER', heightCm: '', experience: '' } }))
      return
    }
    
    setApproving(prev => ({ ...prev, [id]: true }))
    try {
      const payload: any = { role }
      
      // If the admin modified/opened the player form
      if (showPlayerForm[id] && currentPlayerData) {
        if (!currentPlayerData.number || !currentPlayerData.position) {
          toast.showErrorToast('Número y posición son requeridos para la ficha deportiva')
          setApproving(prev => ({ ...prev, [id]: false }))
          return
        }
        payload.playerData = {
          number: Number(currentPlayerData.number),
          position: currentPlayerData.position,
          status: 'ACTIVE',
          heightCm: currentPlayerData.heightCm ? Number(currentPlayerData.heightCm) : undefined,
          experience: currentPlayerData.experience ? currentPlayerData.experience.trim() : undefined,
        }
        if (hasPlayerId) {
          payload.playerId = Number(approvePlayerId[id])
        }
      } else if (hasPlayerId) {
        payload.playerId = Number(approvePlayerId[id])
      }
      
      const result = await usersApi.approve(id, payload)
      toast.showSuccessToast(`Usuario ${user?.email || ''} aprobado con éxito (${result.roles?.join(', ') || role})`)
      setShowPlayerForm(prev => ({ ...prev, [id]: false }))
      await loadPendingUsers()
      await load()
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || 'No se pudo aprobar el usuario'
      toast.showErrorToast(errorMsg)
    } finally {
      setApproving(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleOpenRoleModal = (user: UserItem) => {
    setEditingRolesUser(user)
    setSelectedRolesForEdit(Array.from(new Set(user.roles || [])))
  }

  const handleToggleRoleForEdit = (roleId: string) => {
    setSelectedRolesForEdit(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(r => r !== roleId)
      } else {
        return [...prev, roleId]
      }
    })
  }

  const handleSaveUserRoles = async () => {
    if (!editingRolesUser) return
    setSavingRoles(true)
    try {
      await adminUsersApi.setRoles(editingRolesUser.id, selectedRolesForEdit)
      toast.showSuccessToast(`Roles actualizados para ${editingRolesUser.email}`)
      setEditingRolesUser(null)
      await load()
    } catch (err: any) {
      toast.showErrorToast(err?.response?.data?.error || 'No se pudieron actualizar los roles')
    } finally {
      setSavingRoles(false)
    }
  }

  const handleRejectUser = async (id: number) => {
    const user = pendingUsers.find(u => u.id === id)
    const email = user?.email || 'este usuario'
    setConfirmState({
      title: 'Rechazar Usuario',
      message: `¿Estás seguro de que deseas rechazar a ${email}? Esta acción no se puede deshacer.`,
      confirmText: 'Rechazar',
      onYes: async () => {
        setApproving(prev => ({ ...prev, [id]: true }))
        try {
          await usersApi.reject(id)
          toast.showSuccessToast(`Usuario ${email} rechazado`)
          await loadPendingUsers()
          await load()
        } catch (e: any) {
          toast.showErrorToast(e?.response?.data?.error || 'No se pudo rechazar el usuario')
        } finally {
          setApproving(prev => ({ ...prev, [id]: false }))
        }
      }
    })
  }

  const handleDeleteUser = async (id: number) => {
    const user = users.find(u => u.id === id) || pendingUsers.find(u => u.id === id)
    const email = user?.email || 'este usuario'
    const name = user?.name || email
    const isSelf = currentUser?.id === id

    if (isSelf) {
      // Si es self, pedimos validación estricta con un prompt para mayor seguridad
      if (!window.confirm(`⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEstás intentando eliminar TU PROPIA CUENTA.\n\nSi confirmas esta acción:\n- Perderás acceso inmediatamente\n- Todos tus datos serán eliminados permanentemente\n\n¿Estás ABSOLUTAMENTE SEGURO de que quieres continuar?\n\nEscribe "ELIMINAR" en el siguiente prompt para confirmar.`)) {
        return
      }
      
      const confirmation = prompt('Para confirmar la eliminación de tu propia cuenta, escribe exactamente: ELIMINAR')
      if (confirmation !== 'ELIMINAR') {
        toast.showErrorToast('Confirmación incorrecta. La eliminación ha sido cancelada.')
        return
      }
      
      if (!window.confirm(`ÚLTIMA OPORTUNIDAD\n\nEstás a punto de eliminar tu propia cuenta de forma permanente.\n\n¿Estás COMPLETAMENTE SEGURO de que quieres hacer esto?`)) {
        return
      }
      executeDelete(id, email)
      return
    }

    // Usuario regular, usamos confirm modal estandar
    setConfirmState({
      title: 'Eliminar permanentemente',
      message: `¿Estás seguro de que deseas ELIMINAR permanentemente a ${name} (${email})?\n\nEsta acción es IRREVERSIBLE y eliminará:\n- El usuario y todos sus roles\n- Todas sus solicitudes de rol\n- El vínculo con su jugador (si existe)`,
      confirmText: 'Sí, eliminar',
      onYes: () => executeDelete(id, email)
    })
  }

  const executeDelete = async (id: number, email: string) => {
    setDeleting(prev => ({ ...prev, [id]: true }))
    try {
      await usersApi.delete(id)
      toast.showSuccessToast(`Usuario ${email} eliminado permanentemente`)
      await loadPendingUsers()
      await load()
    } catch (e: any) {
      toast.showErrorToast(e?.response?.data?.error || 'No se pudo eliminar el usuario')
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }))
    }
  }

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const status = userStatusFilter !== 'ALL' ? userStatusFilter : undefined
      const data = await usersApi.list(status)
      setUsers(data)
      const dataTeams = await http.get('/api/teams')
      setTeams(dataTeams.data)
      const initRoles: Record<number, Set<string>> = {}
      const initPlayer: Record<number, string> = {}
      for (const u of data) {
        initRoles[u.id] = new Set(u.roles)
        initPlayer[u.id] = u.playerId ? String(u.playerId) : ''
      }
      setRoles(initRoles)
      setPlayerId(initPlayer)
      await loadRequests()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); loadPendingUsers() }, [])
  useEffect(() => { load() }, [userStatusFilter])

  const loadRequests = async () => {
    setRequestsLoading(true)
    try {
      const reqs = await adminUsersApi.listRoleRequests(requestStatus)
      setRequests(reqs)
      // seed editable fields
      const init: Record<number, string> = {}
      for (const r of reqs) init[r.id] = r.playerId ? String(r.playerId) : ''
      setRequestPlayerId(init)
  const initNote: Record<number, string> = {}
  for (const r of reqs) initNote[r.id] = r.note ?? ''
  setRequestNote(initNote)
    } catch (e) {
      // ignore error in isolated requests load; main error banner handled by load()
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => { loadRequests() }, [requestStatus])

  const saveLink = async (id: number) => {
    const pid = Number(playerId[id] || 0)
    if (!pid) return
    try {
      await adminUsersApi.linkPlayer(id, pid)
      await load()
      toast.showSuccessToast('Jugador vinculado')
    } catch (e: any) { alert('No se pudo vincular jugador') }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin: Usuarios & Roles</h2>
          <p className="text-sm text-gray-600">Gestión integral de roles, permisos, vinculación de atletas y control de acceso para Beta</p>
        </div>
        <button
          onClick={() => setShowRoleGuide(!showRoleGuide)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
        >
          <span>{showRoleGuide ? '📖 Ocultar Guía de Roles' : '📖 Ver Matriz de Roles y Categorías'}</span>
        </button>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-3 text-sm">{error}</div>}

      {/* Role & Category Architecture Guide for Beta */}
      {showRoleGuide && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <div>
                <h3 className="font-bold text-lg text-white">Matriz de Roles, Permisos y Categorías (Beta)</h3>
                <p className="text-xs text-indigo-200">Arquitectura de control de acceso, estados persistentes vs dinámicos</p>
              </div>
            </div>
            <button 
              onClick={() => setShowRoleGuide(false)}
              className="text-xs text-indigo-300 hover:text-white bg-indigo-800/50 px-2.5 py-1 rounded"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-lg p-3 space-y-2">
              <h4 className="font-semibold text-emerald-300 flex items-center gap-1.5 text-sm">
                <span>📌</span> Roles Estructurales (Persistentes)
              </h4>
              <ul className="space-y-1.5 text-gray-300">
                <li><strong className="text-white">👑 Admin:</strong> Control total, configuración, finanzas, borrado irreversible y monitoreo.</li>
                <li><strong className="text-white">🏛️ Directiva:</strong> Gestión institucional, eventos, equipos, supervisión de nóminas y aprobaciones.</li>
                <li><strong className="text-white">📋 Entrenador (Coach):</strong> Tácticas, jugadas, convocatorias, alineaciones y estadísticas.</li>
                <li><strong className="text-white">🎖️ Capitán:</strong> Roster de partido, alineaciones O/D, jugadas y apoyo a mesa técnica.</li>
                <li><strong className="text-white">💰 Tesorero:</strong> Módulo de finanzas, cuentas, ingresos, egresos y balances contables.</li>
                <li><strong className="text-white">📝 Anotador:</strong> Mesa técnica acreditada para actas y estadísticas en vivo.</li>
                <li><strong className="text-white">🏃 Jugador:</strong> Atleta registrado con ficha deportiva (número, posición) y eventos.</li>
                <li><strong className="text-white">🤝 Refuerzo (Guest):</strong> Invitado temporal con acceso acotado y vista de eventos convocados.</li>
              </ul>
            </div>

            <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-lg p-3 space-y-2">
              <h4 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-sm">
                <span>⚡</span> Funciones Dinámicas (Activar / Desactivar)
              </h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <strong className="text-white">Modo Jugador Activo:</strong> Cualquier usuario (coach, capitán, etc.) puede activar o desactivar su condición de atleta activo en <em className="text-indigo-200">Mi Perfil → Seguridad</em> para entrar o salir de las listas de convocatorias sin perder su ficha deportiva.
                </li>
                <li>
                  <strong className="text-white">Mesa Técnica por Evento:</strong> La responsabilidad de mesa técnica se asigna o releva dinámicamente por evento/partido sin requerir cambiar el rol base del usuario en la base de datos.
                </li>
                <li>
                  <strong className="text-white">Categorías Deportivas:</strong> OPEN, MIXTO, FEMENINO, JUVENIL y MASTER cuentan con aislamiento y estadísticas filtrables por equipo y división.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Pending Users Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-yellow-50 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-800">Usuarios Pendientes de Aprobación</div>
            <div className="text-xs text-gray-600">Usuarios registrados que esperan asignación de rol y confirmación de acceso</div>
          </div>
          {pendingUsers.length > 0 && (
            <span className="bg-yellow-500 text-white rounded-full px-2.5 py-0.5 text-xs font-bold">
              {pendingUsers.length} pendientes
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
              <tr>
                <th className="text-left px-4 py-2.5">Usuario / Email</th>
                <th className="text-left px-4 py-2.5">Equipo</th>
                <th className="text-left px-4 py-2.5">Ficha Deportiva Registrada</th>
                <th className="text-left px-4 py-2.5">Rol a Asignar</th>
                <th className="px-4 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingUsers.map(u => {
                const hasPlayer = !!u.player
                const currentFormOpen = !!showPlayerForm[u.id]
                return (
                  <React.Fragment key={u.id}>
                    <tr className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{u.name || u.email}</div>
                        {u.name && <div className="text-xs text-gray-500">{u.email}</div>}
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {u.createdAt ? `Registrado: ${new Date(u.createdAt).toLocaleDateString()}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.teamName ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            🛡️ {u.teamName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            🏃 Agente Libre
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasPlayer ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
                              <span className="font-bold text-indigo-700">#{u.player?.number}</span>
                              <span className="text-indigo-400">•</span>
                              <span>
                                {u.player?.position === 'CUTTER' ? 'Cortador' : u.player?.position === 'HANDLER' ? 'Manejador' : 'Híbrido'}
                              </span>
                              {u.player?.heightCm && (
                                <>
                                  <span className="text-indigo-400">•</span>
                                  <span>{u.player.heightCm} cm</span>
                                </>
                              )}
                              {u.player?.experience && (
                                <>
                                  <span className="text-indigo-400">•</span>
                                  <span className="text-gray-600 truncate max-w-[120px]">{u.player.experience}</span>
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPlayerForm(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                              className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
                            >
                              {currentFormOpen ? 'Cerrar edición' : '✏️ Editar ficha'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Sin ficha de jugador</span>
                            {approveRole[u.id] === 'player' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPlayerForm(prev => ({ ...prev, [u.id]: !prev[u.id] }))
                                  if (!playerData[u.id]) {
                                    setPlayerData(prev => ({ ...prev, [u.id]: { number: '', position: 'CUTTER', heightCm: '', experience: '' } }))
                                  }
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                              >
                                {currentFormOpen ? 'Cancelar' : '➕ Crear ficha'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="border rounded-md px-2.5 py-1.5 text-xs sm:text-sm bg-white font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500"
                          value={approveRole[u.id] || 'player'}
                          onChange={(e) => {
                            setApproveRole(prev => ({
                              ...prev,
                              [u.id]: e.target.value
                            }))
                            if (e.target.value !== 'player' && !hasPlayer) {
                              setShowPlayerForm(prev => ({ ...prev, [u.id]: false }))
                            }
                          }}
                        >
                          <option value="player">🏃 Jugador</option>
                          <option value="captain">🎖️ Capitán</option>
                          <option value="coach">📋 Entrenador</option>
                          <option value="directiva">🏛️ Directiva</option>
                          <option value="treasurer">💰 Tesorero</option>
                          <option value="annotator">📝 Anotador</option>
                          <option value="admin">👑 Admin</option>
                          <option value="guest">🤝 Refuerzo</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          <button
                            type="button"
                            className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-md text-xs sm:text-sm font-medium hover:bg-amber-100 transition-colors shadow-xs flex items-center gap-1"
                            onClick={() => handleOpenPasswordModal(u)}
                            title="Restablecer o cambiar contraseña de este usuario"
                          >
                            <span>🔑</span>
                            <span className="hidden sm:inline">Clave</span>
                          </button>
                          <button
                            className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-md text-xs sm:text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                            disabled={!!approving[u.id]}
                            onClick={() => handleApproveUser(u.id)}
                          >
                            {approving[u.id] ? 'Aprobando…' : currentFormOpen ? 'Guardar y Aprobar' : 'Aprobar'}
                          </button>
                          <button
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs sm:text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
                            disabled={!!approving[u.id]}
                            onClick={() => handleRejectUser(u.id)}
                          >
                            {approving[u.id] ? 'Rechazando…' : 'Rechazar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showPlayerForm[u.id] && (
                      <tr className="border-t bg-indigo-50/80">
                        <td colSpan={5} className="px-4 py-3.5">
                          <div className="space-y-3 bg-white p-3.5 rounded-lg border border-indigo-200 shadow-sm">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-indigo-900 text-sm flex items-center gap-1.5">
                                <span>🏃 Ficha Deportiva del Atleta</span>
                                <span className="text-xs font-normal text-indigo-700">
                                  ({hasPlayer ? 'Modificar datos registrados por el usuario' : 'Completar datos deportivos'})
                                </span>
                              </h4>
                              <button
                                type="button"
                                className="text-xs text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPlayerForm(prev => ({ ...prev, [u.id]: false }))}
                              >
                                ✕ Cerrar
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Camiseta # <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Ej: 10"
                                  required
                                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  value={playerData[u.id]?.number ?? ''}
                                  onChange={e => {
                                    const val = e.target.value
                                    setPlayerData(prev => ({
                                      ...prev,
                                      [u.id]: { ...(prev[u.id] || { number: '', position: 'CUTTER', heightCm: '', experience: '' }), number: val }
                                    }))
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Posición <span className="text-red-500">*</span>
                                </label>
                                <select
                                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  value={playerData[u.id]?.position || 'CUTTER'}
                                  onChange={e => setPlayerData(prev => ({
                                    ...prev,
                                    [u.id]: { ...(prev[u.id] || { number: '', position: 'CUTTER', heightCm: '', experience: '' }), position: e.target.value as any }
                                  }))}
                                >
                                  <option value="CUTTER">Cortador (Cutter)</option>
                                  <option value="HANDLER">Manejador (Handler)</option>
                                  <option value="HYBRID">Híbrido (Hybrid)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Altura (cm) <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Ej: 178"
                                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  value={playerData[u.id]?.heightCm ?? ''}
                                  onChange={e => {
                                    const val = e.target.value
                                    setPlayerData(prev => ({
                                      ...prev,
                                      [u.id]: { ...(prev[u.id] || { number: '', position: 'CUTTER', heightCm: '', experience: '' }), heightCm: val }
                                    }))
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Experiencia <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej: 3 años jugando mixto"
                                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                  value={playerData[u.id]?.experience ?? ''}
                                  onChange={e => setPlayerData(prev => ({
                                    ...prev,
                                    [u.id]: { ...(prev[u.id] || { number: '', position: 'CUTTER', heightCm: '', experience: '' }), experience: e.target.value }
                                  }))}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                                onClick={() => handleApproveUser(u.id)}
                                disabled={!!approving[u.id] || !playerData[u.id]?.number || !playerData[u.id]?.position}
                              >
                                {approving[u.id] ? 'Aprobando…' : '✓ Guardar Cambios y Aprobar'}
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                                onClick={() => setShowPlayerForm(prev => ({ ...prev, [u.id]: false }))}
                              >
                                Cerrar edición
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
              {pendingLoading && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={5}>Cargando pendientes…</td></tr>
              )}
              {!pendingLoading && pendingUsers.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={5}>No hay usuarios pendientes de aprobación</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Users Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="font-semibold text-gray-800">Todos los Usuarios Registrados</div>
            <div className="text-xs text-gray-500">Asignación de multi-roles, vinculación deportiva y control de equipo</div>
          </div>
          <select
            className="border rounded px-2.5 py-1 text-xs sm:text-sm bg-white"
            value={userStatusFilter}
            onChange={(e) => {
              setUserStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')
            }}
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobados</option>
            <option value="REJECTED">Rechazados</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-4 py-2.5">Usuario</th>
                <th className="text-left px-4 py-2.5">Estado</th>
                <th className="text-left px-4 py-2.5">Roles Asignados</th>
                <th className="text-left px-4 py-2.5">Equipo</th>
                <th className="text-left px-4 py-2.5">Ficha / PlayerId</th>
                <th className="px-4 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">{u.email}</div>
                    {u.name && <div className="text-xs text-gray-500">{u.name}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      u.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      u.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      u.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {u.status || 'APPROVED'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.roles.length === 0 && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">Sin rol</span>
                      )}
                      {Array.from(new Set(u.roles)).map((r, idx) => {
                        const badge = getRoleBadge(r)
                        return (
                          <span 
                            key={`${u.id}-${r}-${idx}`} 
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badge.badgeColor}`}
                          >
                            {badge.label}
                          </span>
                        )
                      })}
                      <button
                        onClick={() => handleOpenRoleModal(u)}
                        className="ml-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium inline-flex items-center gap-0.5"
                        title="Modificar roles de este usuario"
                      >
                        <span>✏️ Editar</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      className="border rounded px-2 py-1 text-xs bg-white w-full min-w-[120px]"
                      value={teamSelection[u.id] || (u.teamId ? String(u.teamId) : '')}
                      onChange={async (e) => {
                        const newTeamId = e.target.value ? Number(e.target.value) : null;
                        setTeamSelection(prev => ({ ...prev, [u.id]: e.target.value }));
                        try {
                          await http.put(`/api/users/${u.id}/team`, { teamId: newTeamId });
                          toast.showSuccessToast('Equipo asignado correctamente');
                          load();
                        } catch (err: any) {
                          toast.showErrorToast(err?.response?.data?.error || 'Error al asignar equipo');
                        }
                      }}
                    >
                      <option value="">Sin equipo</option>
                      {teams.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.player ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
                        <span className="font-bold text-indigo-700">#{u.player.number}</span>
                        <span className="text-indigo-400">•</span>
                        <span>{u.player.position === 'CUTTER' ? 'Cortador' : u.player.position === 'HANDLER' ? 'Manejador' : 'Híbrido'}</span>
                        {u.player.name && u.player.name !== u.name && <span className="text-gray-500 text-[11px]">({u.player.name})</span>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          className="border rounded px-2 py-1 w-16 text-xs bg-white"
                          value={playerId[u.id] || ''}
                          onChange={(e) => setPlayerId(prev => ({ ...prev, [u.id]: e.target.value }))}
                          placeholder="ID atleta"
                        />
                        <button
                          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                          onClick={() => saveLink(u.id)}
                          disabled={!playerId[u.id]}
                          title="Vincular a ficha de atleta existente"
                        >
                          Vincular
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded text-xs hover:bg-amber-100 transition-colors flex items-center gap-1"
                        onClick={() => handleOpenPasswordModal(u)}
                        title="Cambiar o restablecer contraseña de este usuario"
                      >
                        <span>🔑</span>
                        <span>Clave</span>
                      </button>
                      <button
                        className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs hover:bg-red-100 disabled:opacity-50 transition-colors"
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={!!deleting[u.id]}
                        title="Eliminar usuario"
                      >
                        {deleting[u.id] ? '…' : '🗑️ Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Sin usuarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Requests Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-800">Solicitudes de Rol</div>
            <div className="text-xs text-gray-500">Peticiones de atletas y miembros para ascensos o vinculaciones</div>
          </div>
          <div className="text-xs flex items-center gap-2">
            <span className="text-gray-600">Estado:</span>
            <select
              className="border rounded px-2 py-1 bg-white"
              value={requestStatus}
              onChange={(e) => setRequestStatus(e.target.value as 'PENDING'|'APPROVED'|'DENIED')}
            >
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="DENIED">Denegadas</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-4 py-2">ID</th>
                <th className="text-left px-4 py-2">Usuario</th>
                <th className="text-left px-4 py-2">Rol Solicitado</th>
                <th className="text-left px-4 py-2">Estado</th>
                <th className="text-left px-4 py-2">PlayerId</th>
                <th className="text-left px-4 py-2">Nota</th>
                <th className="px-4 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: any) => (
                <tr key={r.id} className="border-t" data-testid={`role-req-row-${r.id}`}>
                  <td className="px-4 py-2 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-2 font-medium">{r.user?.email}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs border border-indigo-100 font-medium">
                      {r.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {r.status === 'PENDING' ? (
                      <input
                        data-testid={`role-req-playerId-${r.id}`}
                        className="border rounded px-2 py-1 w-20 text-xs"
                        value={requestPlayerId[r.id] || ''}
                        onChange={(e) => setRequestPlayerId(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="id"
                      />
                    ) : (
                      <span className="text-xs text-gray-600">{r.playerId ?? '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {r.status === 'PENDING' ? (
                      <input
                        data-testid={`role-req-note-${r.id}`}
                        className="border rounded px-2 py-1 w-48 text-xs"
                        value={requestNote[r.id] || ''}
                        onChange={(e) => setRequestNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="nota administrativa"
                      />
                    ) : (
                      <span className="text-xs text-gray-600">{r.note ?? '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.status === 'PENDING' && (
                      <div className="flex gap-1.5 justify-end">
                        <button
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 transition-colors"
                          onClick={async () => { 
                            await adminUsersApi.approveRoleRequest(r.id); 
                            toast.showSuccessToast('Solicitud aprobada'); 
                            await loadRequests() 
                          }}
                        >
                          Aprobar
                        </button>
                        <button
                          className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs hover:bg-rose-700 transition-colors"
                          onClick={async () => { 
                            await adminUsersApi.denyRoleRequest(r.id); 
                            toast.showInfoToast('Solicitud denegada'); 
                            await loadRequests() 
                          }}
                        >
                          Denegar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {requestsLoading && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Cargando solicitudes…</td></tr>
              )}
              {!requestsLoading && requests.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>Sin solicitudes de rol</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Role Management Modal */}
      {editingRolesUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Asignación de Roles del Sistema</h3>
                <p className="text-xs text-indigo-200">{editingRolesUser.email} {editingRolesUser.name ? `(${editingRolesUser.name})` : ''}</p>
              </div>
              <button
                onClick={() => setEditingRolesUser(null)}
                className="text-indigo-300 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-gray-600">
                Selecciona uno o múltiples roles para este usuario. Cada rol otorga capacidades específicas que se combinan armónicamente:
              </p>

              <div className="space-y-2.5">
                {SYSTEM_ROLES.map(role => {
                  const isChecked = selectedRolesForEdit.includes(role.id)
                  return (
                    <label
                      key={role.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRoleForEdit(role.id)}
                        className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{role.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${role.badgeColor}`}>
                            {role.id}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingRolesUser(null)}
                disabled={savingRoles}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveUserRoles}
                disabled={savingRoles}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xs transition-colors"
              >
                {savingRoles ? 'Guardando Roles…' : 'Guardar Roles'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Password Management & Direct Reset Link Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔑</span>
                <div>
                  <h3 className="text-lg font-bold">Gestión de Contraseña</h3>
                  <p className="text-xs text-amber-200">{passwordModalUser.email} {passwordModalUser.name ? `(${passwordModalUser.name})` : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-amber-200 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Option 1: Direct Password Change */}
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Asignar Nueva Contraseña Directa
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1"
                  >
                    <span>🎲 Generar Segura</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Mínimo 6 caracteres..."
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white pr-20 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSavePassword}
                  disabled={savingPassword || !newPasswordInput || newPasswordInput.length < 6}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  {savingPassword ? 'Guardando...' : '💾 Guardar y Aplicar Nueva Contraseña'}
                </button>
              </div>

              {/* Option 2: Direct Reset Link Generation */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    🔗 Enlace Directo de Recuperación
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Genera un enlace único de 24h para que la usuaria ingrese su propia contraseña si no recibe el correo.
                  </p>
                </div>

                {!generatedResetLink ? (
                  <button
                    type="button"
                    onClick={handleGenerateResetLink}
                    disabled={generatingLink}
                    className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg shadow-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {generatingLink ? 'Generando Enlace...' : '⚡ Generar Enlace de Restablecimiento'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono break-all text-indigo-900 select-all">
                      {generatedResetLink}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyResetLink}
                      className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>{copiedLink ? '✓ ¡Copiado!' : '📋 Copiar Enlace para Compartir'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText="Cancelar"
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            await confirmState.onYes()
            setConfirmState(null)
          }}
        />
      )}
    </div>
  )
}
