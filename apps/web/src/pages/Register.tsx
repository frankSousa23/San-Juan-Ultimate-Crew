import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, teamsApi } from '../lib/api'
import { useToast } from '../hooks/useToast'

export const Register: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: number; name: string; tag?: string | null; categories?: string | null; color?: string | null; logoUrl?: string | null }>>([])
  const [willBePlayer, setWillBePlayer] = useState(false)
  const [playerNumber, setPlayerNumber] = useState('')
  const [playerPosition, setPlayerPosition] = useState<'HANDLER' | 'CUTTER' | 'HYBRID'>('CUTTER')
  const [playerHeight, setPlayerHeight] = useState('')
  const [playerExperience, setPlayerExperience] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { showSuccessToast, showErrorToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    teamsApi.listPublic()
      .then(teams => setAvailableTeams(teams))
      .catch(() => {})
  }, [])
  
  // Password strength indicator
  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; label: string; color: string } => {
    if (pwd.length === 0) return { strength: 'weak', label: '', color: '' }
    if (pwd.length < 6) return { strength: 'weak', label: 'Muy débil', color: 'text-red-600' }
    if (pwd.length < 10) return { strength: 'medium', label: 'Media', color: 'text-yellow-600' }
    if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { strength: 'strong', label: 'Fuerte', color: 'text-green-600' }
    }
    return { strength: 'medium', label: 'Media', color: 'text-yellow-600' }
  }
  
  const passwordStrength = getPasswordStrength(password)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    // Client-side validation
    if (!name.trim() || !email || !password) {
      setError('Nombre, email y contraseña son requeridos')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Formato de email inválido')
      return
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password.length > 128) {
      setError('La contraseña es demasiado larga (máximo 128 caracteres)')
      return
    }
    
    // Normalize name (obligatorio)
    const normalizedName = name.trim()
    if (normalizedName.length > 100) {
      setError('El nombre es demasiado largo (máximo 100 caracteres)')
      return
    }
    
    // Validate player data if willBePlayer is true
    if (willBePlayer) {
      if (playerNumber === '' || !playerPosition) {
        setError('Si te registrarás como jugador, el número dorsal y la posición son requeridos')
        return
      }
      const num = Number(playerNumber)
      if (!Number.isInteger(num) || num < 0 || num > 999) {
        setError('El número de dorsal debe ser un número entero entre 0 y 999')
        return
      }
    }
    
    setIsLoading(true)
    
    try {
      const normalizedName = name.trim()
      const playerData = willBePlayer ? {
        number: Number(playerNumber),
        position: playerPosition,
        status: 'ACTIVE' as const,
        heightCm: playerHeight ? Number(playerHeight) : undefined,
        experience: playerExperience.trim() || undefined,
      } : undefined
      
      const result = await authApi.register(
        email.trim().toLowerCase(), 
        password, 
        normalizedName,
        willBePlayer,
        playerData,
        selectedTeamId ? Number(selectedTeamId) : null
      )
      setSuccess(true)
      showSuccessToast(result.message || 'Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Error al registrar usuario'
      setError(message)
      showErrorToast(message)
    } finally {
      setIsLoading(false)
    }
  }

  const activeSelectedTeam = availableTeams.find(t => String(t.id) === selectedTeamId)

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-md shadow p-4 sm:p-6 mt-4 sm:mt-10">
        <h2 className="text-xl font-semibold mb-4 text-green-600">¡Registro Exitoso!</h2>
        <p className="text-gray-700 mb-4">
          Tu cuenta ha sido creada y está pendiente de aprobación por un administrador.
          Recibirás una notificación cuando tu cuenta sea aprobada.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Serás redirigido a la página de login en unos segundos...
        </p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Ir a login ahora
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-md shadow p-4 sm:p-6 mt-4 sm:mt-10">
      <h2 className="text-xl font-semibold mb-4">Registrarse</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="register-name" className="block text-sm font-medium mb-1">Nombre</label>
          <input
            id="register-name"
            aria-label="Name"
            className="w-full border rounded px-3 py-2"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="register-email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="register-email"
            aria-label="Email"
            className="w-full border rounded px-3 py-2"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label htmlFor="register-password" className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            id="register-password"
            aria-label="Password"
            className="w-full border rounded px-3 py-2"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <div className="mt-1">
            <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
            {password.length > 0 && (
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <div className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </div>
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        passwordStrength.strength === 'weak' ? 'bg-red-500 w-1/3' :
                        passwordStrength.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                        'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                </div>
                {password.length >= 6 && passwordStrength.strength !== 'strong' && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Sugerencia: Usa mayúsculas, minúsculas y números para mayor seguridad
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="register-team" className="block text-sm font-medium mb-1">
            Equipo / Club <span className="text-gray-500 text-xs font-normal">(Opcional)</span>
          </label>
          <select
            id="register-team"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            value={selectedTeamId}
            onChange={e => setSelectedTeamId(e.target.value)}
          >
            <option value="">🏃 Agente Libre / Sin equipo fijo (Refuerzo / Pruebas)</option>
            {availableTeams.map(t => (
              <option key={t.id} value={t.id}>
                🛡️ {t.name} {t.categories ? `(${t.categories})` : ''} {t.tag ? `[${t.tag}]` : ''}
              </option>
            ))}
          </select>
          
          {activeSelectedTeam ? (
            <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs">
              <div 
                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" 
                style={{ backgroundColor: activeSelectedTeam.color || '#4f46e5' }}
              />
              <span className="font-semibold text-gray-800">{activeSelectedTeam.name}</span>
              {activeSelectedTeam.tag && (
                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded font-mono text-[10px]">
                  {activeSelectedTeam.tag}
                </span>
              )}
              {activeSelectedTeam.categories && (
                <span className="text-gray-500 truncate">
                  • {activeSelectedTeam.categories}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Los agentes libres pueden elegir cualquier dorsal y llevar sus estadísticas personales o actuar como refuerzo en eventos.
            </p>
          )}
        </div>
        
        <div className="border-t pt-3 mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={willBePlayer}
              onChange={e => setWillBePlayer(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-medium">¿Te registrarás como jugador?</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Si marcas esta opción, se te pedirá información adicional para crear tu perfil de jugador
          </p>
        </div>
        
        {willBePlayer && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-indigo-900">Información de Jugador</h3>
            
            <div>
              <label htmlFor="player-number" className="block text-sm font-medium mb-1">
                Número Dorsal <span className="text-red-500">*</span>
              </label>
              <input
                id="player-number"
                type="number"
                min="0"
                max="999"
                required={willBePlayer}
                className="w-full border rounded px-3 py-2 text-sm bg-white"
                value={playerNumber}
                onChange={e => {
                  const val = e.target.value
                  if (val === '' || (Number(val) >= 0 && Number.isInteger(Number(val)) && Number(val) <= 999)) {
                    setPlayerNumber(val)
                  }
                }}
                placeholder="Ej: 0, 7, 23, 99"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Dorsal asignado al jugador (0 al 999).
              </p>
            </div>
            
            <div>
              <label htmlFor="player-position" className="block text-sm font-medium mb-1">
                Posición <span className="text-red-500">*</span>
              </label>
              <select
                id="player-position"
                required={willBePlayer}
                className="w-full border rounded px-3 py-2"
                value={playerPosition}
                onChange={e => setPlayerPosition(e.target.value as 'HANDLER' | 'CUTTER' | 'HYBRID')}
              >
                <option value="CUTTER">Cortador</option>
                <option value="HANDLER">Manejador</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="player-height" className="block text-sm font-medium mb-1">
                Altura (cm) <span className="text-gray-500 text-xs">(opcional)</span>
              </label>
              <input
                id="player-height"
                type="number"
                min="1"
                className="w-full border rounded px-3 py-2"
                value={playerHeight}
                onChange={e => {
                  const val = e.target.value
                  if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                    setPlayerHeight(val)
                  }
                }}
                placeholder="Ej: 180"
              />
            </div>
            
            <div>
              <label htmlFor="player-experience" className="block text-sm font-medium mb-1">
                Experiencia <span className="text-gray-500 text-xs">(opcional)</span>
              </label>
              <textarea
                id="player-experience"
                className="w-full border rounded px-3 py-2"
                value={playerExperience}
                onChange={e => setPlayerExperience(e.target.value)}
                placeholder="Describe tu experiencia en Ultimate Frisbee"
                rows={3}
              />
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
            {error}
            {error.includes('already exists') && (
              <div className="mt-2 text-xs">
                Si ya tienes una cuenta, intenta{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
                  iniciar sesión
                </Link>
                {' '}o{' '}
                <Link to="/forgot-password" className="text-blue-600 hover:underline">
                  recuperar tu contraseña
                </Link>
              </div>
            )}
            {error.includes('rejected') && (
              <div className="mt-2 text-xs">
                Contacta a un administrador para más información sobre tu cuenta.
              </div>
            )}
          </div>
        )}
        <button 
          disabled={isLoading} 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2 disabled:opacity-50"
        >
          {isLoading ? 'Registrando…' : 'Registrarse'}
        </button>
        <div className="text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Inicia sesión
          </Link>
        </div>
      </form>
    </div>
  )
}

export default Register

