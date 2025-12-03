import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useToast } from '../hooks/useToast'

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const { showSuccessToast, showErrorToast } = useToast()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    // Client-side validation
    if (!email) {
      setError('Email es requerido')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Formato de email inválido')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await authApi.forgotPassword(email.trim().toLowerCase())
      setSuccess(true)
      if (result.token) {
        // In development, show the token
        setToken(result.token)
      }
      showSuccessToast(result.message || 'If an account with that email exists, a password reset link has been sent.')
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Error al solicitar recuperación de contraseña'
      setError(message)
      showErrorToast(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-md shadow p-4 sm:p-6 mt-4 sm:mt-10">
        <h2 className="text-xl font-semibold mb-4 text-green-600">Email Enviado</h2>
        <p className="text-gray-700 mb-4">
          Si existe una cuenta con ese email, se ha enviado un enlace para restablecer tu contraseña.
          Revisa tu bandeja de entrada.
        </p>
        {token && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-gray-600 mb-2">Modo desarrollo - Token de prueba:</p>
            <p className="text-xs font-mono break-all">{token}</p>
            <p className="text-xs text-gray-600 mt-2">
              En producción, este token se enviaría por email.
            </p>
          </div>
        )}
        <Link to="/login" className="text-blue-600 hover:underline">
          Volver a login
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-md shadow p-4 sm:p-6 mt-4 sm:mt-10">
      <h2 className="text-xl font-semibold mb-4">Recuperar Contraseña</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="forgot-email"
            aria-label="Email"
            className="w-full border rounded px-3 py-2"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button 
          disabled={isLoading} 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2 disabled:opacity-50"
        >
          {isLoading ? 'Enviando…' : 'Enviar enlace de recuperación'}
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

export default ForgotPassword

