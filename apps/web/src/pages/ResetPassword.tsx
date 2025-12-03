import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useToast } from '../hooks/useToast'

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { showSuccessToast, showErrorToast } = useToast()
  
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

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError('Token de recuperación no válido')
    }
  }, [searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
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
    
    if (!token) {
      setError('Token de recuperación no válido')
      return
    }
    
    setIsLoading(true)
    
    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
      showSuccessToast('Contraseña restablecida exitosamente')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Error al restablecer contraseña'
      setError(message)
      showErrorToast(message)
      
      // If token expired or invalid, suggest requesting a new one
      if (message.includes('expired') || message.includes('Invalid')) {
        setTimeout(() => {
          navigate('/forgot-password')
        }, 3000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-md shadow p-4 sm:p-6 mt-4 sm:mt-10">
        <h2 className="text-xl font-semibold mb-4 text-green-600">¡Contraseña Restablecida!</h2>
        <p className="text-gray-700 mb-4">
          Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
        </p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Ir a login
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-md shadow p-4 sm:p-6 mt-4 sm:mt-10">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
        <p className="text-gray-700 mb-4">
          Token de recuperación no válido o faltante.
        </p>
        <Link to="/forgot-password" className="text-blue-600 hover:underline">
          Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-md shadow p-4 sm:p-6 mt-4 sm:mt-10">
      <h2 className="text-xl font-semibold mb-4">Restablecer Contraseña</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium mb-1">Nueva Contraseña</label>
          <input
            id="reset-password"
            aria-label="Password"
            className="w-full border rounded px-3 py-2"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
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
          <label htmlFor="reset-confirm-password" className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
          <input
            id="reset-confirm-password"
            aria-label="Confirm Password"
            className={`w-full border rounded px-3 py-2 ${
              confirmPassword && password !== confirmPassword ? 'border-red-500' : 
              confirmPassword && password === confirmPassword ? 'border-green-500' : ''
            }`}
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
          )}
          {confirmPassword && password === confirmPassword && password.length >= 6 && (
            <p className="text-xs text-green-600 mt-1">✓ Las contraseñas coinciden</p>
          )}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
            {error}
            {(error.includes('expired') || error.includes('Invalid')) && (
              <div className="mt-2">
                <p className="text-xs mb-2">El enlace de recuperación ha expirado o no es válido.</p>
                <Link to="/forgot-password" className="text-blue-600 hover:underline text-xs">
                  Solicitar nuevo enlace de recuperación
                </Link>
              </div>
            )}
          </div>
        )}
        <button 
          disabled={isLoading} 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2 disabled:opacity-50"
        >
          {isLoading ? 'Restableciendo…' : 'Restablecer Contraseña'}
        </button>
        <div className="text-center text-sm text-gray-600">
          <Link to="/login" className="text-indigo-600 hover:underline">
            Volver a login
          </Link>
        </div>
      </form>
    </div>
  )
}

export default ResetPassword

