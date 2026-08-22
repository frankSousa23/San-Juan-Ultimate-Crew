import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from "../hooks/useTheme"
import { useAuth } from '../contexts/AuthContext'
import SystemManualModal from './SystemManualModal'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasRole } = useAuth()

  const navigation = [
    // Public/All authenticated users
    { name: 'Panel Principal', href: '/', icon: '🏠', roles: [] },
    { name: 'Portal Informativo', href: '/landing', icon: '🌐', roles: [] },
    { name: 'Mi Perfil', href: '/perfil', icon: '👤', roles: [] },
    
    { name: 'Roster', href: '/roster', icon: '👥', roles: ['player', 'captain', 'coach', 'admin', 'treasurer', 'marketing', 'directiva', 'annotator', 'guest'] },
    { name: 'Eventos', href: '/eventos', icon: '📅', roles: ['player', 'captain', 'coach', 'admin', 'treasurer', 'marketing', 'guest', 'directiva', 'annotator'] },
    
    // Communications: accessible to all authenticated users (guest can view)
    { name: 'Comunicación', href: '/comunicacion', icon: '💬', roles: [] },
    // Statistics: accessible to all authenticated users (including guest for demo/showcase)
    { name: 'Estadísticas', href: '/estadisticas', icon: '📊', roles: [] },
    
    { name: 'Lesiones', href: '/lesiones', icon: '🏥', roles: ['player', 'captain', 'coach', 'admin', 'directiva', 'guest'] },
    { name: 'Equipos Rivales', href: '/rivales', icon: '⚔️', roles: ['player', 'captain', 'admin', 'coach', 'directiva', 'annotator', 'guest'] },
    { name: 'Jugadas', href: '/jugadas', icon: '🎯', roles: ['player', 'captain', 'coach', 'admin', 'directiva', 'guest'] },
    { name: 'Roster Torneo', href: '/roster-torneo', icon: '🏆', roles: ['player', 'captain', 'coach', 'admin', 'directiva', 'annotator', 'guest'] },
    { name: 'Recursos', href: '/recursos', icon: '📁', roles: ['player', 'coach', 'admin', 'marketing', 'guest', 'directiva', 'captain'] },
    
    // Treasurer & Admin
    { name: 'Finanzas', href: '/finanzas', icon: '💰', roles: ['treasurer', 'admin', 'directiva', 'guest'] },
    
    // Admin & Directiva
    { name: 'Equipos / Divisiones', href: '/admin/equipos', icon: '🛡️', roles: ['admin', 'directiva'] },
    { name: 'Admin Usuarios', href: '/admin/usuarios', icon: '🔧', roles: ['admin', 'directiva'] },
    { name: 'Feedback Recibido', href: '/admin/feedback', icon: '📬', roles: ['admin'] },
    { name: 'Monitoreo', href: '/admin/monitoring', icon: '💻', roles: ['admin'] },
    { name: 'Acerca de / Feedback', href: '/about', icon: 'ℹ️', roles: [] },
  ]

  const isActive = (href: string) => {
    return location.pathname === href
  }

  const filteredNavigation = navigation.filter(item => {
    // Public items (no role required)
    if (item.roles.length === 0) return true
    // If user is not authenticated, only show public items
    if (!user) return false
    // Check if user has any of the required roles for this item
    return item.roles.some(role => hasRole(role))
  })

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 flex flex-col h-screen overflow-hidden`}>
        <div className="flex items-center justify-between h-16 px-4 border-b bg-gray-900 text-white">
          <h1 className="text-xl font-bold">SIGEDIVO</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-300 hover:text-white"
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
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md"
          >
            <span className="mr-2">⬅</span> Volver
          </button>
        </div>
        
        <nav className="flex-1 mt-4 px-2 overflow-y-auto overscroll-contain">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Profile / Logout Section */}
        <div className="p-4 border-t bg-gray-50">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{user.name || user.email}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {user.roles?.[0] === 'guest'
                    ? 'Refuerzo'
                    : user.roles?.[0] || 'Jugador'}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Salir
              </button>
            </div>
          ) : (
             <Link
              to="/login"
              className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
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
              className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100"
            >
              <span className="text-xl">☰</span>
            </button>
            <h2 className="text-lg font-semibold text-gray-800 truncate hidden sm:block">
              {navigation.find(n => isActive(n.href))?.name || 'SIGEDIVO'}
            </h2>
            
            {/* Contexto Multi-Equipo (Badge) */}
            {user && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-slate-800 to-slate-700 text-white text-xs sm:text-sm font-medium rounded-full shadow-sm border border-slate-600"
                title="Equipo actual de gestión"
              >
                <span className="text-blue-300">🛡️</span>
                <span className="truncate max-w-[100px] sm:max-w-[200px]">
                  {user.teamName || (user.roles?.includes('admin') ? 'Admin Global' : 'Sin Equipo')}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Cambiar tema"> {isDark ? "☀️" : "🌙"} </button>
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
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold rounded-lg border border-rose-200 transition active:scale-95"
                title="Cerrar sesión en el sistema"
              >
                <span>🚪</span>
                <span>Salir</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow transition active:scale-95"
              >
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-4 lg:p-6 pb-20 sm:pb-20 lg:pb-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Modal del Manual del Sistema */}
      <SystemManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white border-t flex justify-around items-center h-16 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className="text-xl mb-0.5">🏠</span>
            <span className="text-[10px] font-medium">Inicio</span>
          </Link>
          <Link to="/eventos" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/eventos') ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className="text-xl mb-0.5">📅</span>
            <span className="text-[10px] font-medium">Eventos</span>
          </Link>
          <Link to="/roster" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/roster') ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className="text-xl mb-0.5">👥</span>
            <span className="text-[10px] font-medium">Roster</span>
          </Link>
          <Link to="/anotaciones" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/anotaciones') ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className="text-xl mb-0.5">🎯</span>
            <span className="text-[10px] font-medium">Pizarra</span>
          </Link>
      </nav>
    </div>
  )
}
