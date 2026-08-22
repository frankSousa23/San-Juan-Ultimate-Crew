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
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 mt-6 sm:mt-12 border border-slate-200">
        <div className="text-center mb-5">
          <span className="text-4xl">📬</span>
          <h2 className="text-2xl font-bold mt-2 text-slate-900">Solicitud Procesada</h2>
        </div>
        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
          Si existe una cuenta asociada a <strong>{email}</strong>, se ha procesado la solicitud de recuperación.
        </p>

        {token && (
          <div className="mb-5 p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-indigo-900">Acceso Directo de Restablecimiento:</p>
            <Link
              to={`/reset-password?token=${token}`}
              className="block w-full text-center py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              👉 Restablecer mi Contraseña Ahora
            </Link>
          </div>
        )}

        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1 mb-6">
          <p className="font-bold flex items-center gap-1">
            <span>💡</span> ¿No recibiste el correo?
          </p>
          <p>
            Puedes solicitarle directamente al <strong>Administrador</strong> del sistema o de tu equipo que te asigne una nueva contraseña o te comparta un enlace de restablecimiento directo desde el panel de control.
          </p>
        </div>

        <Link
          to="/login"
          className="block w-full text-center py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition"
        >
          ← Volver a Iniciar Sesión
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

