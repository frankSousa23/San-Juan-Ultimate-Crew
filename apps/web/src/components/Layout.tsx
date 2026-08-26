import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from "../hooks/useTheme"
import { useAuth } from '../contexts/AuthContext'
import SystemManualModal from './SystemManualModal'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: string
  roles: string[]
  badge?: string
}

interface NavCategory {
  id: string
  name: string
  icon: string
  items: NavItem[]
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasRole } = useAuth()

  // Definición estructurada por módulos semánticos
  const navCategories: NavCategory[] = [
    {
      id: 'quick',
      name: 'General',
      icon: '⚡',
      items: [
        { name: 'Panel Principal', href: '/', icon: '🏠', roles: [] },
        { name: 'Portal Informativo', href: '/landing', icon: '🌐', roles: [] },
        { name: 'Mi Perfil', href: '/perfil', icon: '👤', roles: [] },
      ]
    },
    {
      id: 'sports',
      name: 'Operación Deportiva',
      icon: '🎯',
      items: [
        { name: 'Roster & Atletas', href: '/roster', icon: '👥', roles: ['player', 'captain', 'coach', 'admin', 'treasurer', 'marketing', 'directiva', 'annotator', 'guest'] },
        { name: 'Eventos & Calendario', href: '/eventos', icon: '📅', roles: ['player', 'captain', 'coach', 'admin', 'treasurer', 'marketing', 'guest', 'directiva', 'annotator'] },
        { name: 'Roster de Torneo', href: '/roster-torneo', icon: '🏆', roles: ['player', 'captain', 'coach', 'admin', 'directiva', 'annotator', 'treasurer', 'marketing', 'guest'] },
      ]
    },
    {
      id: 'tactics',
      name: 'Táctica & Rendimiento',
      icon: '🧠',
      items: [
        { name: 'Pizarra Táctica (Playbook)', href: '/jugadas', icon: '🎯', roles: ['player', 'captain', 'coach', 'admin', 'directiva', 'annotator', 'treasurer', 'marketing', 'guest'] },
        { name: 'Estadísticas & Rankings', href: '/estadisticas', icon: '📊', roles: [] },
        { name: 'Equipos Rivales (Scouting)', href: '/rivales', icon: '⚔️', roles: ['player', 'captain', 'admin', 'coach', 'directiva', 'annotator', 'treasurer', 'marketing', 'guest'] },
      ]
    },
    {
      id: 'club',
      name: 'Club & Salud',
      icon: '🏥',
      items: [
        { name: 'Control Médico & Lesiones', href: '/lesiones', icon: '🏥', roles: ['player', 'captain', 'coach', 'admin', 'directiva', 'annotator', 'treasurer', 'marketing', 'guest'] },
        { name: 'Comunicación & Noticias', href: '/comunicacion', icon: '💬', roles: [] },
        { name: 'Recursos & Manuales', href: '/recursos', icon: '📁', roles: ['player', 'coach', 'admin', 'marketing', 'guest', 'directiva', 'captain', 'treasurer', 'annotator'] },
      ]
    },
    {
      id: 'management',
      name: 'Gestión & Tesorería',
      icon: '💰',
      items: [
        { name: 'Finanzas del Club', href: '/finanzas', icon: '💰', roles: ['treasurer', 'admin', 'directiva', 'guest'] },
        { name: 'Equipos / Divisiones', href: '/admin/equipos', icon: '🛡️', roles: ['admin', 'directiva'] },
      ]
    },
    {
      id: 'admin',
      name: 'Administración',
      icon: '⚙️',
      items: [
        { name: 'Admin Usuarios', href: '/admin/usuarios', icon: '🔧', roles: ['admin', 'directiva'] },
        { name: 'Feedback Recibido', href: '/admin/feedback', icon: '📬', roles: ['admin'] },
        { name: 'Monitoreo de Sistema', href: '/admin/monitoring', icon: '💻', roles: ['admin'] },
        { name: 'Acerca de / Ayuda', href: '/about', icon: 'ℹ️', roles: [] },
      ]
    }
  ]

  // Estado de categorías colapsables con persistencia
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sigedivo_sidebar_collapsed')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => {
      const next = { ...prev, [catId]: !prev[catId] }
      try {
        localStorage.setItem('sigedivo_sidebar_collapsed', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const isActive = (href: string) => {
    return location.pathname === href
  }

  // Filtrar categorías e items según roles RBAC
  const visibleCategories = navCategories
    .map(category => ({
      ...category,
      items: category.items.filter(item => {
        if (item.roles.length === 0) return true
        if (!user) return false
        return item.roles.some(role => hasRole(role))
      })
    }))
    .filter(category => category.items.length > 0)

  // Abrir automáticamente la categoría que contiene la ruta activa
  useEffect(() => {
    visibleCategories.forEach(category => {
      const containsActive = category.items.some(i => isActive(i.href))
      if (containsActive && collapsedCategories[category.id]) {
        setCollapsedCategories(prev => ({ ...prev, [category.id]: false }))
      }
    })
  }, [location.pathname])

  const isLanding = location.pathname === '/landing' || location.pathname === '/inicio' || (!user && location.pathname === '/')

  if (isLanding) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🥏</span>
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">SIGEDIVO</span>
            </Link>
            <span className="hidden sm:inline-block text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              Disco Volador
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Cambiar tema">
              {isDark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setManualOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold rounded-lg border border-blue-200 transition active:scale-95"
              title="Ver manual y guía oficial del sistema"
            >
              <span>📘</span>
              <span className="hidden sm:inline">Manual del Sistema</span>
              <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-mono">PDF</span>
            </button>
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow transition active:scale-95"
              >
                <span>🏠 Mi Panel</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow transition active:scale-95"
                >
                  <span>Iniciar Sesión</span>
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-lg border border-slate-300 shadow-sm transition active:scale-95"
                >
                  <span>Registrarse</span>
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 w-full">
          {children}
        </main>

        <SystemManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} />
      </div>
    )
  }

  // Nombre de la página activa para el Header
  const activeItemName = visibleCategories.flatMap(c => c.items).find(i => isActive(i.href))?.name || 'SIGEDIVO'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 flex flex-col h-screen overflow-hidden border-r border-slate-200`}>
        
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🥏</span>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white">SIGEDIVO</span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Ultimate Frisbee</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-300 hover:text-white p-1 rounded-lg hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Mobile Back Button */}
        <div className="lg:hidden p-2 border-b bg-gray-100">
          <button 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/')
              }
            }}
            className="flex items-center w-full px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-md transition"
          >
            <span className="mr-2">⬅</span> Volver
          </button>
        </div>
        
        {/* Categorized Nav Scroll Container */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4 text-sm select-none">
          {visibleCategories.map((category) => {
            const isCollapsed = Boolean(collapsedCategories[category.id])
            const hasActiveItem = category.items.some(item => isActive(item.href))

            return (
              <div key={category.id} className="space-y-1">
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center justify-between px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${
                    hasActiveItem ? 'text-blue-700 dark:text-blue-400 font-extrabold' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </span>
                  <span className={`text-[10px] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                    ▼
                  </span>
                </button>

                {/* Category Items */}
                {!isCollapsed && (
                  <div className="pl-1 space-y-0.5">
                    {category.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all active:scale-[0.98] ${
                            active
                              ? 'bg-blue-600 text-white shadow-sm font-bold translate-x-1'
                              : 'text-gray-600 hover:bg-blue-50/70 hover:text-blue-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-base">{item.icon}</span>
                            <span className="truncate">{item.name}</span>
                          </div>
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Profile / Logout Section */}
        <div className="p-3 border-t bg-slate-50/90 border-slate-200">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-900 truncate">{user.name || user.email}</span>
                  <span className="text-[10px] text-blue-600 font-semibold capitalize truncate">
                    {user.roles?.[0] === 'guest'
                      ? 'Refuerzo / Demo'
                      : user.roles?.[0] || 'Jugador'}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-800 font-bold rounded-md transition"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
            >
              <span className="text-xl">☰</span>
            </button>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate hidden sm:block">
              {activeItemName}
            </h2>
            
            {/* Contexto Multi-Equipo (Badge) */}
            {user && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs font-semibold rounded-full shadow-sm border border-slate-700"
                title="Equipo actual de gestión"
              >
                <span className="text-blue-400">🛡️</span>
                <span className="truncate max-w-[100px] sm:max-w-[200px]">
                  {user.teamName || (user.roles?.includes('admin') ? 'Admin Global' : 'Sin Equipo')}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
              title="Cambiar tema"
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            <button
              onClick={() => setManualOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold rounded-lg border border-blue-200 transition active:scale-95 shadow-sm"
              title="Ver manual y guía oficial del sistema"
            >
              <span>📘</span>
              <span className="hidden sm:inline">Manual Oficial</span>
              <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-mono">PDF</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main View */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <SystemManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  )
}
