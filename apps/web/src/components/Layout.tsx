import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasRole } = useAuth()

  const navigation = [
    // Public/All authenticated users
    { name: 'Dashboard', href: '/', icon: '🏠', roles: [] },
    { name: 'Mi Perfil', href: '/perfil', icon: '👤', roles: [] },
    
    // Player, Captain, Coach & Admin
    { name: 'Roster', href: '/roster', icon: '👥', roles: ['player', 'captain', 'coach', 'admin'] },
    { name: 'Eventos', href: '/eventos', icon: '📅', roles: ['player', 'captain', 'coach', 'admin'] },
    // Communications: accessible to all authenticated users (guest can view)
    { name: 'Comunicación', href: '/comunicacion', icon: '💬', roles: [] },
    // Statistics: accessible to all authenticated users (including guest for demo/showcase)
    { name: 'Estadísticas', href: '/estadisticas', icon: '📊', roles: [] },
    { name: 'Lesiones', href: '/lesiones', icon: '🏥', roles: ['player', 'captain', 'coach', 'admin'] },
    { name: 'Rivales', href: '/rivales', icon: '⚔️', roles: ['player', 'captain', 'admin']},
    { name: 'Jugadas', href: '/jugadas', icon: '🎯', roles: ['player', 'captain', 'coach', 'admin'] },
    { name: 'Roster Torneo', href: '/roster-torneo', icon: '🏆', roles: ['player', 'captain', 'coach', 'admin'] },
    { name: 'Recursos', href: '/recursos', icon: '📁', roles: ['player', 'coach', 'admin'] },
    
    // Treasurer & Admin
    { name: 'Finanzas', href: '/finanzas', icon: '💰', roles: ['treasurer', 'admin'] },
    
    // Admin Only
    { name: 'Admin Usuarios', href: '/admin/usuarios', icon: '🔧', roles: ['admin'] },
    { name: 'Monitoreo', href: '/admin/monitoring', icon: '💻', roles: ['admin'] },
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 flex flex-col h-screen overflow-hidden`}>
        <div className="flex items-center justify-between h-16 px-4 border-b bg-gray-900 text-white">
          <h1 className="text-xl font-bold">San Juan Ultimate</h1>
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
                <span className="text-xs text-gray-500 capitalize">{user.roles?.[0] || 'Guest'}</span>
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
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 mr-4 p-2 rounded-md hover:bg-gray-100"
            >
              <span className="text-xl">☰</span>
            </button>
            <h2 className="text-lg font-semibold text-gray-800 truncate">
              {navigation.find(n => isActive(n.href))?.name || 'San Juan Ultimate Crew'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
             {/* Header actions can go here */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-4 lg:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}