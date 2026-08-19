import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const { user, isAuthenticated, hasRole, hasPermission } = useAuth()
  const { stats, loading: statsLoading } = useStats()
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [financeLoading, setFinanceLoading] = useState(true)
  const [showManualModal, setShowManualModal] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  useEffect(() => {
    async function loadFinanceSummary() {
      // Only load finance summary if user has finance permission
      if (!hasPermission('finance:view') && !hasRole('admin')) {
        setFinanceLoading(false)
        return
      }
      try {
        const summary = await transactionsApi.summary()
        setFinanceSummary(summary)
      } catch (error: any) {
        const status = error?.response?.status
        // Silently handle 401 (handled by interceptor), 403 (no permission), or 404 (endpoint doesn't exist)
        if (status !== 401 && status !== 403 && status !== 404) {
          console.error('Error loading finance summary:', error)
        }
        // Set default values for 404/401/403 to prevent UI issues
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
  const isGuest = !isAdmin && !isPlayer
  const isCaptain = hasRole('captain')
  const isCoach = hasRole('coach')
  const isTreasurer = hasRole('treasurer')
  const canViewFinance = hasPermission('finance:view') || isAdmin
  const canViewMessages = hasPermission('communications:view') || isAdmin || isPlayer

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {isAdmin ? 'Panel Principal Administrativo' :
           isCaptain ? 'Panel Principal de Capitán' :
           isCoach ? 'Panel Principal de Entrenador' :
           isTreasurer ? 'Panel Principal de Tesorero' :
           isPlayer ? 'Mi Panel Principal' :
           'Panel Principal'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {isAdmin ? 'Vista general del sistema completo' :
           isCaptain ? 'Gestión del equipo y eventos' :
           isCoach ? 'Gestión de entrenamientos y recursos' :
           isTreasurer ? 'Gestión financiera del equipo' :
           isPlayer ? 'Bienvenido al sistema de gestión deportiva' :
           'Vista pública del sistema'}
        </p>
      </div>

      {/* Banner de Modo Invitado */}
      {isGuest && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl shadow-lg p-5 sm:p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌟</span>
                <span className="text-xs font-bold uppercase bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  Modo Invitado / Demostración
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold">¡Bienvenido a SIGEDIVO (Sistema de Gestión para el Disco Volador)!</h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                Estás navegando en modo de muestra (solo lectura). Puedes consultar el <strong>Roster</strong> de jugadores,
                revisar el <strong>Calendario de Eventos</strong>, ver <strong>Estadísticas</strong>, estudiar el <strong>Playbook de Jugadas</strong> y leer o descargar el <strong>Manual Oficial en PDF</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 font-bold text-xs sm:text-sm rounded-xl shadow transition"
              >
                📘 Ver Manual Interactivo
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
                {isDownloadingPdf ? 'Generando...' : '📥 PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Jugadores - Visible para todos excepto guest sin permisos */}
        {(hasPermission('roster:view') || isAdmin || isPlayer || isGuest) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Jugadores</h3>
            {statsLoading ? (
              <p className="text-3xl font-bold text-gray-400">...</p>
            ) : (
              <p className="text-3xl font-bold text-blue-600">{stats?.players || stats?.activePlayers || 0}</p>
            )}
            <p className="text-sm text-gray-500">
              {isAdmin ? 'Total de jugadores' : 'Jugadores activos'}
            </p>
          </div>
        )}

        {/* Eventos - Visible para todos */}
        {(hasPermission('events:view') || isAdmin || isPlayer || isGuest) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Eventos</h3>
            {statsLoading ? (
              <p className="text-3xl font-bold text-gray-400">...</p>
            ) : (
              <p className="text-3xl font-bold text-green-600">{stats?.events || 0}</p>
            )}
            <p className="text-sm text-gray-500">
              {isAdmin ? 'Total de eventos' : 'Eventos programados'}
            </p>
          </div>
        )}

        {/* Finanzas - Solo para admin y treasurer */}
        {canViewFinance && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Finanzas</h3>
            {financeLoading ? (
              <p className="text-3xl font-bold text-gray-400">...</p>
            ) : (
              <p className={`text-3xl font-bold ${(financeSummary?.balance || 0) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {financeSummary ? formatCurrency(financeSummary.balance) : '$0'}
              </p>
            )}
            <p className="text-sm text-gray-500">Balance actual</p>
          </div>
        )}

        {/* Mensajes - Solo para usuarios con permisos de comunicación */}
        {canViewMessages && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Mensajes</h3>
            {statsLoading ? (
              <p className="text-3xl font-bold text-gray-400">...</p>
            ) : (
              <p className="text-3xl font-bold text-indigo-600">{stats?.messages || 0}</p>
            )}
            <p className="text-sm text-gray-500">Total de mensajes</p>
          </div>
        )}

        {/* Estadísticas personales para players */}
        {isPlayer && stats?.personalStats && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Mi Asistencia</h3>
            <p className="text-3xl font-bold text-amber-600">{stats.personalStats.attendanceRate || 0}%</p>
            <p className="text-sm text-gray-500">Tasa de asistencia</p>
          </div>
        )}

        {/* Estado del rol para usuarios sin métricas específicas */}
        {!isAdmin && !canViewFinance && !canViewMessages && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Mi Estado</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {isPlayer ? 'Jugador' : 
               isCaptain ? 'Capitán' :
               isCoach ? 'Entrenador' :
               isTreasurer ? 'Tesorero' :
               'Invitado'}
            </p>
            <p className="text-sm text-gray-500">Rol actual</p>
          </div>
        )}
      </div>

      {stats?.upcomingEvents && stats.upcomingEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Próximos Eventos</h3>
          <div className="space-y-2">
            {stats.upcomingEvents.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.startsAt).toLocaleDateString('es-PR', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Roster - Visible para players, captains, coaches, admin, guest */}
          {(hasPermission('roster:view') || isAdmin || isPlayer || isGuest) && (
            <Link to="/roster" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">👥</div>
              <div className="text-xs sm:text-sm font-medium">Roster</div>
            </Link>
          )}

          {/* Eventos - Visible para todos con permisos */}
          {(hasPermission('events:view') || isAdmin || isPlayer || isGuest) && (
            <Link to="/eventos" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📅</div>
              <div className="text-xs sm:text-sm font-medium">Eventos</div>
            </Link>
          )}

          {/* Comunicación - Visible para players, captains, coaches, admin */}
          {(hasPermission('communications:view') || isAdmin || isPlayer) && (
            <Link to="/comunicacion" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">💬</div>
              <div className="text-xs sm:text-sm font-medium">Comunicación</div>
            </Link>
          )}

          {/* Estadísticas - Visible para todos */}
          {(hasPermission('statistics:view') || isAdmin || isPlayer || isGuest) && (
            <Link to="/estadisticas" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📊</div>
              <div className="text-xs sm:text-sm font-medium">Estadísticas</div>
            </Link>
          )}

          {/* Finanzas - Solo para admin y treasurer */}
          {canViewFinance && (
            <Link to="/finanzas" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">💰</div>
              <div className="text-xs sm:text-sm font-medium">Finanzas</div>
            </Link>
          )}

          {/* Lesiones - Visible para players, captains, coaches, admin */}
          {(hasPermission('injuries:view') || isAdmin || isPlayer) && (
            <Link to="/lesiones" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🏥</div>
              <div className="text-xs sm:text-sm font-medium">Lesiones</div>
            </Link>
          )}

          {/* Rivales - Visible para players, captains, admin, guest (coach NO tiene acceso) */}
          {(hasPermission('rivals:view') || isAdmin || isPlayer || isGuest) && !isCoach && (
            <Link to="/rivales" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">⚔️</div>
              <div className="text-xs sm:text-sm font-medium">Equipos Rivales</div>
            </Link>
          )}

          {/* Jugadas - Visible para players, captains, coaches, admin, guest */}
          {(hasPermission('plays:view') || isAdmin || isPlayer || isGuest) && (
            <Link to="/jugadas" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🎯</div>
              <div className="text-xs sm:text-sm font-medium">Jugadas</div>
            </Link>
          )}

          {/* Recursos - Visible para players, coaches, admin, guest */}
          {(hasPermission('resources:view') || isAdmin || isPlayer || isGuest) && (
            <Link to="/recursos" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📁</div>
              <div className="text-xs sm:text-sm font-medium">Recursos</div>
            </Link>
          )}

          {/* Admin Only */}
          {isAdmin && (
            <>
              <Link to="/admin/usuarios" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🔧</div>
                <div className="text-xs sm:text-sm font-medium">Usuarios</div>
              </Link>
              <Link to="/admin/monitoring" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">💻</div>
                <div className="text-xs sm:text-sm font-medium">Monitoreo</div>
              </Link>
            </>
          )}

          {/* Perfil - Visible para todos */}
          <Link to="/perfil" className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2">👤</div>
            <div className="text-xs sm:text-sm font-medium">Mi Perfil</div>
          </Link>
        </div>
      </div>

      {/* Modal del Manual del Sistema */}
      <SystemManualModal isOpen={showManualModal} onClose={() => setShowManualModal(false)} />
    </div>
  )
}