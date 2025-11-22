import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
    try {
      await login(email, password)
      const next = params.get('next') || '/'
      navigate(next)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-md shadow p-6 mt-10">
      <h2 className="text-xl font-semibold mb-4">Iniciar sesión</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="login-email"
            aria-label="Email"
            className="w-full border rounded px-3 py-2"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            id="login-password"
            aria-label="Password"
            className="w-full border rounded px-3 py-2"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2">
          {isLoading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
export default Login
