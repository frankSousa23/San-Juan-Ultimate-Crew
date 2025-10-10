import { NavLink } from 'react-router-dom'
import React from 'react'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">San Juan Ultimate Crew</h1>
            <nav className="flex gap-2 flex-wrap">
              <NavLink to="/" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/roster" className={linkClass}>Roster</NavLink>
              <NavLink to="/eventos" className={linkClass}>Eventos</NavLink>
              <NavLink to="/comunicacion" className={linkClass}>Comunicaciones</NavLink>
              <NavLink to="/finanzas" className={linkClass}>Finanzas</NavLink>
              <NavLink to="/estadisticas" className={linkClass}>Estadísticas</NavLink>
              <NavLink to="/lesiones" className={linkClass}>Lesiones</NavLink>
              <NavLink to="/rivales" className={linkClass}>Rivales</NavLink>
              <NavLink to="/jugadas" className={linkClass}>Jugadas</NavLink>
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
