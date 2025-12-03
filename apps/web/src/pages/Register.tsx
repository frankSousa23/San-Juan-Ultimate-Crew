import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useToast } from '../hooks/useToast'

export const Register: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { showSuccessToast, showErrorToast } = useToast()
  const navigate = useNavigate()
  
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
    if (!email || !password) {
      setError('Email y contraseña son requeridos')
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
    
    // Normalize name if provided
    const normalizedName = name ? name.trim() : ''
    if (normalizedName && normalizedName.length > 100) {
      setError('El nombre es demasiado largo (máximo 100 caracteres)')
      return
    }
    
    setIsLoading(true)
    
    try {
      const normalizedName = name ? name.trim() : undefined
      const result = await authApi.register(email.trim().toLowerCase(), password, normalizedName)
      setSuccess(true)
      showSuccessToast(result.message || 'Registration successful. Please wait for admin approval.')
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
          <label htmlFor="register-name" className="block text-sm font-medium mb-1">Nombre (opcional)</label>
          <input
            id="register-name"
            aria-label="Name"
            className="w-full border rounded px-3 py-2"
            type="text"
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

