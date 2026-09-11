import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { branding } from '../config/branding'

interface NavbarProps {
  onOpenManual?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenManual }) => {
  const { user } = useAuth()

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🥏</span>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none">
              {branding.appName}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {branding.orgShortName}
            </span>
          </div>
        </Link>
        <span className="hidden sm:inline-block text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          {branding.orgType === 'ASSOCIATION' ? 'Asociación' : 'Club'}
        </span>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {onOpenManual && (
          <button
            onClick={onOpenManual}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold rounded-lg border border-blue-200 transition active:scale-95"
            title="Ver manual y guía oficial del sistema"
          >
            <span>📘</span>
            <span className="hidden sm:inline">Manual</span>
          </button>
        )}
        {user ? (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow transition active:scale-95"
          >
            <span>🏠 Mi Panel</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow transition active:scale-95"
            >
              <span>Iniciar Sesión</span>
            </Link>
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-lg border border-slate-300 shadow-sm transition active:scale-95"
            >
              <span>Registrarse</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
