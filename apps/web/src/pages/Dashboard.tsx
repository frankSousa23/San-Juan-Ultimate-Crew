import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStats } from '../hooks/useData'
import { transactionsApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import SystemManualModal from '../components/SystemManualModal'
import { downloadSystemManualPdf } from '../lib/generateManualPdf'

interface FinanceSummary {
  income: number
  expense: number
  balance: number
}

export default function Dashboard() {
  const { user, hasRole, hasPermission } = useAuth()
  const { stats, loading: statsLoading } = useStats()
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [financeLoading, setFinanceLoading] = useState(true)
  const [showManualModal, setShowManualModal] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadFinanceSummary() {
      if (!hasPermission('finance:view') && !hasRole('admin') && !hasRole('guest')) {
        setFinanceLoading(false)
        return
      }
      try {
        const summary = await transactionsApi.summary()
        setFinanceSummary(summary)
      } catch (error: any) {
        const status = error?.response?.status
        if (status !== 401 && status !== 403 && status !== 404) {
          console.error('Error loading finance summary:', error)
        }
        if (status === 404 || status === 401 || status === 403) {
          setFinanceSummary({ income: 0, expense: 0, balance: 0 })
        }
      } finally {
        setFinanceLoading(false)
      }
    }
    loadFinanceSummary()
  }, [hasRole, hasPermission])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const isAdmin = hasRole('admin')
  const isPlayer = hasRole('player') || !!user?.playerId
  const isGuest = hasRole('guest') || user?.email === 'guest@sigedivo.com'
  const isCaptain = hasRole('captain')
  const isCoach = hasRole('coach')
  const isTreasurer = hasRole('treasurer')
  const canViewFinance = hasPermission('finance:view') || isAdmin || isGuest
  const canViewMessages = hasPermission('communications:view') || isAdmin || isPlayer

  // Identificar el partido más próximo o en curso para la Live Hero Card
  const nextMatch = stats?.upcomingEvents?.find((e: any) => e.type === 'MATCH' || e.type === 'TOURNAMENT') || stats?.upcomingEvents?.[0]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header con Bienvenida y Rol */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {isAdmin ? 'Panel Principal Administrativo' :
             isCaptain ? 'Panel Principal de Capitán' :
             isCoach ? 'Panel Principal de Entrenador' :
             isTreasurer ? 'Panel Principal de Tesorería' :
             isPlayer ? `¡Hola, ${user?.name?.split(' ')[0] || 'Atleta'}! 👋` :
             'Panel Principal'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {isAdmin ? 'Centro de mando y auditoría global de SIGEDIVO' :
             isCaptain ? 'Gestión táctica, convocatorias y supervisión de líneas' :
             isCoach ? 'Planificación de entrenamientos, drills y jugadas' :
             isTreasurer ? 'Control de ingresos, egresos y balances del club' :
             isPlayer ? 'Tu rendimiento deportivo y próximos encuentros' :
             'Portal de gestión deportiva de Disco Volador'}
          </p>
        </div>

        {/* Badge de Equipo Contextual */}
        {user?.teamName && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold shadow-sm self-start sm:self-auto">
            <span>🛡️</span>
            <span>{user.teamName}</span>
          </div>
        )}
      </div>

      {/* 🌟 Banner de Modo Invitado */}
      {isGuest && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl shadow-md p-5 sm:p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌟</span>
                <span className="text-xs font-extrabold uppercase bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  Modo Invitado / Demostración 1-Clic
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold">¡Explora el ecosistema completo de SIGEDIVO!</h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                Estás navegando con datos de muestra en vivo. Consulta el <strong>Roster</strong>, revisa el <strong>Calendario</strong>, simula jugadas en el <strong>Playbook</strong> o descarga el <strong>Manual Oficial en PDF</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowManualModal(true)}
                className="px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 font-bold text-xs sm:text-sm rounded-xl shadow transition"
              >
                📘 Ver Manual
              </button>
              <button
                onClick={() => {
                  setIsDownloadingPdf(true)
                  try {
                    downloadSystemManualPdf()
                  } finally {
                    setTimeout(() => setIsDownloadingPdf(false), 800)
                  }
                }}
                disabled={isDownloadingPdf}
                className="px-3.5 py-2 bg-emerald-950/40 hover:bg-emerald-950/60 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl border border-emerald-400/30 transition"
              >
                {isDownloadingPdf ? 'Generando...' : '📥 Descargar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ Barra de Acciones Rápidas (Quick Action Bar) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span>⚡</span>
            <span>Acciones Rápidas</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <Link
            to="/eventos"
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-900 rounded-xl border border-slate-200 hover:border-blue-300 font-bold text-xs transition active:scale-95 shadow-sm"
          >
            <span className="text-lg">📅</span>
            <span>Nuevo Evento</span>
          </Link>
          <Link
            to="/eventos"
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 rounded-xl border border-slate-200 hover:border-emerald-300 font-bold text-xs transition active:scale-95 shadow-sm"
          >
            <span className="text-lg">⏱️</span>
            <span>Mesa Técnica</span>
          </Link>
          <Link
            to="/jugadas"
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-purple-50 text-slate-800 hover:text-purple-900 rounded-xl border border-slate-200 hover:border-purple-300 font-bold text-xs transition active:scale-95 shadow-sm"
          >
            <span className="text-lg">🎯</span>
            <span>Playbook Táctico</span>
          </Link>
          <Link
            to="/lesiones"
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-rose-50 text-slate-800 hover:text-rose-900 rounded-xl border border-slate-200 hover:border-rose-300 font-bold text-xs transition active:scale-95 shadow-sm"
          >
            <span className="text-lg">🏥</span>
            <span>Parte Médico</span>
          </Link>
          <Link
            to="/finanzas"
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-900 rounded-xl border border-slate-200 hover:border-amber-300 font-bold text-xs transition active:scale-95 shadow-sm"
          >
            <span className="text-lg">💰</span>
            <span>Tesorería</span>
          </Link>
        </div>
      </div>

      {/* 🎯 Live Hero Card: Partido Destacado / Próximo Encuentro */}
      {nextMatch && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl shadow-md p-5 text-white border border-blue-800/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-700/50">
                  {nextMatch.status === 'ONGOING' ? 'En Vivo Ahora' : 'Próximo Encuentro'}
                </span>
                <span className="text-xs text-slate-300">
                  {new Date(nextMatch.startsAt).toLocaleDateString('es-PR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {nextMatch.title}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <span>📍</span>
                <span>{nextMatch.location || 'Polideportivo San Juan - Cancha Principal'}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate(`/eventos`)}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>⏱️</span>
                <span>Ir a Mesa Técnica en Vivo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 Métricas y Widgets Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Jugadores */}
        {(hasPermission('roster:view') || isAdmin || isPlayer || isGuest) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Atletas en Roster</h3>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl text-base">👥</span>
            </div>
            {statsLoading ? (
              <p className="text-3xl font-black text-gray-300 animate-pulse">---</p>
            ) : (
              <p className="text-3xl font-black text-slate-900">{stats?.players || stats?.activePlayers || 0}</p>
            )}
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {isAdmin ? 'Total registrados en sistema' : 'Atletas activos en plantilla'}
            </p>
          </div>
        )}

        {/* Eventos */}
        {(hasPermission('events:view') || isAdmin || isPlayer || isGuest) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Calendario & Eventos</h3>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl text-base">📅</span>
            </div>
            {statsLoading ? (
              <p className="text-3xl font-black text-gray-300 animate-pulse">---</p>
            ) : (
              <p className="text-3xl font-black text-emerald-600">{stats?.events || 0}</p>
            )}
            <p className="text-xs text-slate-500 mt-1 font-medium">Torneos y prácticas programadas</p>
          </div>
        )}

        {/* Finanzas */}
        {canViewFinance && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Balance de Tesorería</h3>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl text-base">💰</span>
            </div>
            {financeLoading ? (
              <p className="text-3xl font-black text-gray-300 animate-pulse">---</p>
            ) : (
              <p className={`text-3xl font-black ${(financeSummary?.balance || 0) >= 0 ? 'text-purple-600' : 'text-rose-600'}`}>
                {financeSummary ? formatCurrency(financeSummary.balance) : '$0'}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1 font-medium">Saldo neto disponible</p>
          </div>
        )}

        {/* Mensajes & Comunidad */}
        {canViewMessages && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Foro & Comunidad</h3>
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-base">💬</span>
            </div>
            {statsLoading ? (
              <p className="text-3xl font-black text-gray-300 animate-pulse">---</p>
            ) : (
              <p className="text-3xl font-black text-indigo-600">{stats?.messages || 0}</p>
            )}
            <p className="text-xs text-slate-500 mt-1 font-medium">Mensajes e interacciones</p>
          </div>
        )}
      </div>

      {/* Próximos Eventos */}
      {stats?.upcomingEvents && stats.upcomingEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>📅</span>
              <span>Próximos Encuentros y Entrenamientos</span>
            </h3>
            <Link to="/eventos" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.upcomingEvents.slice(0, 4).map((event: any) => (
              <div key={event.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-blue-300 transition">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 text-sm">{event.title}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(event.startsAt).toLocaleDateString('es-PR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-lg">
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SystemManualModal isOpen={showManualModal} onClose={() => setShowManualModal(false)} />
    </div>
  )
}