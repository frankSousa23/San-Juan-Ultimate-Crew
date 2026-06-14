import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

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
    
    try {
      await login(email.trim().toLowerCase(), password)
      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        const next = params.get('next') || '/'
        navigate(next)
      }, 100)
    } catch (err: any) {
      // Only show error if it's not already handled by AuthContext
      const errorMessage = err?.response?.data?.error || 'Error al iniciar sesión'
      setError(errorMessage)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-md shadow p-4 sm:p-6 mt-4 sm:mt-10">
      <h2 className="text-xl font-semibold mb-4">Iniciar sesión</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="login-email"
            aria-label="Email"
            className="w-full border rounded px-3 py-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            id="login-password"
            aria-label="Contraseña"
            className="w-full border rounded px-3 py-2"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Tu contraseña"
          />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
            {error}
            {error.includes('pending admin approval') && (
              <div className="mt-2 text-xs">
                Tu cuenta está pendiente de aprobación. Contacta a un administrador.
              </div>
            )}
            {error.includes('rejected') && (
              <div className="mt-2 text-xs">
                Tu cuenta ha sido rechazada. Contacta a un administrador para más información.
              </div>
            )}
          </div>
        )}
        <button disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2">
          {isLoading ? 'Ingresando…' : 'Ingresar'}
        </button>
        <div className="text-center text-sm text-gray-600 space-y-2">
          <div>
            <Link to="/forgot-password" className="text-indigo-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div>
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Regístrate
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
export default Login
