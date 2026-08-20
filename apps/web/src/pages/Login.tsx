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

  async function handleGuestLogin() {
    setEmail('guest@sigedivo.com')
    setPassword('123456')
    setError(null)
    try {
      await login('guest@sigedivo.com', '123456')
      const next = params.get('next') || '/'
      navigate(next, { replace: true })
    } catch (err: any) {
      console.error('[GuestLogin Error]', err)
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al iniciar sesión como invitado'
      setError(errorMessage)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
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
      const next = params.get('next') || '/'
      navigate(next, { replace: true })
    } catch (err: any) {
      console.error('[Login Submit Error]', err)
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al iniciar sesión'
      setError(errorMessage)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 sm:py-10">
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 sm:p-8">
        <div className="text-center mb-6 px-2">
          <div className="text-4xl mb-2">🥏</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 break-words leading-tight">SIGEDIVO</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2 font-medium break-words">Sistema de Gestión para el Disco Volador</p>
        </div>

        {/* Acceso Demostrativo Exclusivo: Modo Invitado (Guest) */}
        <div className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
              🌟
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-emerald-950">Acceso de Demostración (Modo Invitado)</h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  1 Clic
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                ¿Quieres explorar el sistema sin registrarte? Ingresa con el rol <strong>Invitado (guest@sigedivo.com)</strong> para ver el Roster, Calendario, Estadísticas, Pizarrón Táctico y el Manual Oficial en PDF.
              </p>
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="mt-3 w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <span>🚀 Entrar como Invitado (Modo Muestra)</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
            <input
              id="login-email"
              aria-label="Email"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700">Contraseña</label>
              <Link to="/forgot-password" className="text-xs font-medium text-indigo-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              id="login-password"
              aria-label="Contraseña"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-sm">
              <div className="font-semibold flex items-center gap-1.5">
                <span>⚠️</span> {error}
              </div>
              {error.includes('pending admin approval') && (
                <div className="mt-2 text-xs text-red-600">
                  Tu cuenta está pendiente de aprobación por el Administrador del equipo antes de tu primer acceso.
                </div>
              )}
              {error.includes('rejected') && (
                <div className="mt-2 text-xs text-red-600">
                  Tu solicitud ha sido rechazada. Contacta al administrador.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-base rounded-xl py-3 shadow transition flex items-center justify-center min-h-[48px]"
          >
            {isLoading ? 'Ingresando…' : 'Iniciar Sesión'}
          </button>

          <div className="text-center text-sm text-gray-600 pt-3 border-t border-gray-100 space-y-2">
            <div>
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:underline">
                Regístrate aquí
              </Link>
            </div>
            <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-left">
              🔒 <strong>Nota de Seguridad:</strong> Todos los nuevos registros entran en estado <em>Pendiente</em> y deben ser aprobados por el Administrador del club para activar su cuenta.
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
export default Login
