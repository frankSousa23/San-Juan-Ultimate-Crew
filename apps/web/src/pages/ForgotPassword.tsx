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
      <div className="w-full max-w-md mx-auto px-4 py-6 sm:py-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-5">
            <span className="text-4xl">📬</span>
            <h2 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">Solicitud Procesada</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
            Si existe una cuenta asociada a <strong className="text-slate-900 dark:text-white">{email}</strong>, se ha procesado la solicitud de recuperación.
          </p>

          {token && (
            <div className="mb-5 p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">Acceso Directo de Restablecimiento:</p>
              <Link
                to={`/reset-password?token=${token}`}
                className="block w-full text-center py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                👉 Restablecer mi Contraseña Ahora
              </Link>
            </div>
          )}

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1 mb-6">
            <p className="font-bold flex items-center gap-1">
              <span>💡</span> ¿No recibiste el correo?
            </p>
            <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
              Puedes solicitarle directamente al <strong>Administrador</strong> del sistema o de tu equipo que te asigne una nueva contraseña o te comparta un enlace de restablecimiento directo desde el panel de control.
            </p>
          </div>

          <Link
            to="/login"
            className="block w-full text-center py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-sm transition"
          >
            ← Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 sm:py-10">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-200 dark:border-slate-800 p-5 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔑</div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Recuperar Contraseña</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1">
            Ingresa tu correo para recibir las instrucciones de recuperación
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-1">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <input
              id="forgot-email"
              aria-label="Email"
              className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-sm">
              <span className="font-semibold">⚠️ {error}</span>
            </div>
          )}
          <button 
            type="submit"
            disabled={isLoading} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-base rounded-xl py-3 shadow transition flex items-center justify-center min-h-[48px] disabled:opacity-50"
          >
            {isLoading ? 'Enviando…' : 'Enviar enlace de recuperación'}
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

export default ForgotPassword

