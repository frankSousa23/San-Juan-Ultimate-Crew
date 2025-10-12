import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { authApi, getAuthToken, setAuthToken } from '../lib/api'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [authed, setAuthed] = useState<boolean>(!!getAuthToken())
  const [user, setUser] = useState<{ id: number; email: string; name?: string; roles?: string[]; playerId?: number | null } | null>(null)
  const [authDisabled, setAuthDisabled] = useState<boolean>(false)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  useEffect(() => {
    setAuthed(!!getAuthToken())
    setMenuOpen(false)
  }, [location.pathname])

  // Fetch user info when authenticated
  useEffect(() => {
    let cancelled = false
    async function loadMe() {
      setUser(null)
      setAuthDisabled(false)
      if (!authed) return
      try {
        const me = await authApi.me()
        if (cancelled) return
        if (me.authDisabled) {
          setAuthDisabled(true)
          // In this mode, backend is not enforcing auth; keep token for UI gating but no user data
        } else if (me.user) {
          setUser(me.user)
        }
      } catch {
        // Token invalid or server not ready: clear token and auth state
        setAuthToken(undefined)
        setAuthed(false)
        setUser(null)
      }
    }
    loadMe()
    return () => { cancelled = true }
  }, [authed])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function onDoc(e: MouseEvent) {
      const el = e.target as HTMLElement
      if (!el.closest?.('[data-auth-menu-root]')) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('click', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function onLogout() {
    try { await authApi.logout() } catch {}
    setAuthToken(undefined)
    setAuthed(false)
    const next = encodeURIComponent(location.pathname + location.search)
    navigate(`/login?next=${next}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">San Juan Ultimate Crew</h1>
            <nav className="flex gap-2 flex-wrap items-center">
              <NavLink to="/" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/roster" className={linkClass}>Roster</NavLink>
              <NavLink to="/roster-torneo" className={linkClass}>Roster Torneo</NavLink>
              <NavLink to="/eventos" className={linkClass}>Eventos</NavLink>
              {/* Hide privileged areas for guest role */}
              {(() => {
                const roles = user?.roles || []
                const isGuestOnly = roles.length === 1 && roles.includes('guest')
                return !isGuestOnly
              })() && (
                <>
                  <NavLink to="/comunicacion" className={linkClass}>Comunicaciones</NavLink>
                  <NavLink to="/finanzas" className={linkClass}>Finanzas</NavLink>
                  <NavLink to="/estadisticas" className={linkClass}>Estadísticas</NavLink>
                  <NavLink to="/lesiones" className={linkClass}>Lesiones</NavLink>
                  <NavLink to="/rivales" className={linkClass}>Rivales</NavLink>
                  <NavLink to="/jugadas" className={linkClass}>Jugadas</NavLink>
                  <NavLink to="/recursos" className={linkClass}>Recursos</NavLink>
                  {user?.roles?.includes('admin') && (
                    <NavLink to="/admin/usuarios" className={linkClass}>Admin</NavLink>
                  )}
                </>
              )}
              <div className="ml-4 flex items-center gap-2">
                {authed && (
                  <div className="relative" data-auth-menu-root>
                    <button
                      type="button"
                      onClick={() => setMenuOpen(v => !v)}
                      className="px-2 py-1 rounded bg-black/20 text-sm hover:bg-black/30"
                      title={user?.email || (authDisabled ? 'AUTH desactivada' : '')}
                    >
                      {user?.name || user?.email || (authDisabled ? 'Auth OFF' : 'Usuario')}
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-white text-gray-800 rounded shadow border z-50">
                        <div className="px-3 py-2 text-xs text-gray-500 border-b">Sesión</div>
                        {user && (
                          <div className="px-3 py-2 text-sm border-b">
                            <div className="font-medium truncate" title={user.name || user.email}>{user.name || user.email}</div>
                            {user.name && <div className="text-gray-500 truncate" title={user.email}>{user.email}</div>}
                            {user.roles && user.roles.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1 truncate" title={user.roles.join(', ')}>Roles: {user.roles.join(', ')}</div>
                            )}
                          </div>
                        )}
                        {authDisabled && (
                          <div className="px-3 py-2 text-xs text-yellow-700 bg-yellow-50 border-b">Auth desactivada</div>
                        )}
                        <NavLink to="/perfil" className={({ isActive }) => `block px-3 py-2 text-sm hover:bg-gray-100 ${isActive ? 'bg-gray-50' : ''}`}>Perfil</NavLink>
                        <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Salir</button>
                      </div>
                    )}
                  </div>
                )}
                {!authed && (
                  <NavLink to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} className={linkClass}>Login</NavLink>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        {children}
      </main>
    </div>
  )
}
