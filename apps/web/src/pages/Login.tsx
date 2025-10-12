import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi, setAuthToken } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token } = await authApi.login(email, password)
      setAuthToken(token)
      const next = params.get('next') || '/'
      navigate(next)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
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
        <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
