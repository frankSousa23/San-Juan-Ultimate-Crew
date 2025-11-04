import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authApi, getAuthToken } from '../lib/api'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRoles?: string[]
}

export function ProtectedRoute({ children, requireRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let mounted = true
    async function check() {
      const token = getAuthToken()
      if (!token) {
        if (mounted) { setAuthorized(false); setChecking(false) }
        return
      }
      // Optimistic allow when token exists to avoid blocking UI (tests/dev)
      if (mounted) { setAuthorized(true) }
      if (!requireRoles || requireRoles.length === 0) {
        if (mounted) setChecking(false)
        return
      }
      try {
        const me = await authApi.me()
        if (me.authDisabled) {
          if (mounted) setAuthorized(true)
          return
        }
        const roles = me.user?.roles || []
        const ok = !requireRoles || requireRoles.some(r => roles.includes(r))
        if (mounted) setAuthorized(ok)
      } catch {
        if (mounted) setAuthorized(false)
      } finally {
        if (mounted) setChecking(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [requireRoles])

  if (checking) {
    return (
      <div className="p-6 text-sm text-gray-600">Verificando acceso…</div>
    )
  }

  if (!authorized) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <>{children}</>
}


