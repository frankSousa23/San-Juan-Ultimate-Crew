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
      <div className="w-full max-w-md mx-auto px-4 py-6 sm:py-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">¡Contraseña Restablecida!</h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
            Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link 
            to="/login" 
            className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-sm transition shadow"
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-6 sm:py-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Enlace no válido</h2>
          <p className="text-gray-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
            El token de recuperación no es válido o ha expirado.
          </p>
          <Link 
            to="/forgot-password" 
            className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-sm transition shadow"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 sm:py-10">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-200 dark:border-slate-800 p-5 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Restablecer Contraseña</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1">
            Ingresa tu nueva contraseña para acceder a SIGEDIVO
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-password" className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-1">
              Nueva Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              id="reset-password"
              aria-label="Password"
              className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <div className="mt-1">
              <p className="text-xs text-gray-500 dark:text-slate-400">Mínimo 6 caracteres</p>
              {password.length > 0 && (
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <div className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </div>
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          passwordStrength.strength === 'weak' ? 'bg-red-500 w-1/3' :
                          passwordStrength.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                          'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="reset-confirm-password" className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-1">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              id="reset-confirm-password"
              aria-label="Confirm Password"
              className={`w-full border rounded-xl px-3.5 py-2.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                confirmPassword && password !== confirmPassword ? 'border-red-500' : 
                confirmPassword && password === confirmPassword ? 'border-green-500' : 'border-gray-300 dark:border-slate-700'
              }`}
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">Las contraseñas no coinciden</p>
            )}
            {confirmPassword && password === confirmPassword && password.length >= 6 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">✓ Las contraseñas coinciden</p>
            )}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-sm">
              <div className="font-semibold">⚠️ {error}</div>
              {(error.includes('expired') || error.includes('Invalid')) && (
                <div className="mt-2">
                  <p className="text-xs mb-1.5">El enlace de recuperación ha expirado o no es válido.</p>
                  <Link to="/forgot-password" className="text-blue-600 hover:underline text-xs font-semibold">
                    Solicitar nuevo enlace de recuperación
                  </Link>
                </div>
              )}
            </div>
          )}
          <button 
            type="submit"
            disabled={isLoading} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-base rounded-xl py-3 shadow transition flex items-center justify-center min-h-[48px] disabled:opacity-50"
          >
            {isLoading ? 'Restableciendo…' : 'Restablecer Contraseña'}
          </button>
          <div className="text-center text-sm text-gray-600 dark:text-slate-400 pt-3 border-t border-gray-100 dark:border-slate-800">
            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword

