import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../hooks/useData'
import { transactionsApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface FinanceSummary {
  income: number
  expense: number
  balance: number
}

export default function Dashboard() {
  const { user, isAuthenticated, hasRole } = useAuth()
  const { stats, loading: statsLoading } = useStats()
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [financeLoading, setFinanceLoading] = useState(true)

  useEffect(() => {
    async function loadFinanceSummary() {
      // Only load finance summary if user is admin
      if (!hasRole('admin')) {
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
  }, [hasRole])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bienvenido al sistema de gestión de San Juan Ultimate</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Jugadores</h3>
          {statsLoading ? (
            <p className="text-3xl font-bold text-gray-400">...</p>
          ) : (
            <p className="text-3xl font-bold text-blue-600">{stats?.players || 0}</p>
          )}
          <p className="text-sm text-gray-500">Jugadores activos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Eventos</h3>
          {statsLoading ? (
            <p className="text-3xl font-bold text-gray-400">...</p>
          ) : (
            <p className="text-3xl font-bold text-green-600">{stats?.events || 0}</p>
          )}
          <p className="text-sm text-gray-500">Total de eventos</p>
        </div>

        {hasRole('admin') && (
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
        {!hasRole('admin') && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Mi Estado</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {user?.roles?.includes('player') ? 'Jugador' : 'Invitado'}
            </p>
            <p className="text-sm text-gray-500">Rol actual</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Mensajes</h3>
          {statsLoading ? (
            <p className="text-3xl font-bold text-gray-400">...</p>
          ) : (
            <p className="text-3xl font-bold text-indigo-600">{stats?.messages || 0}</p>
          )}
          <p className="text-sm text-gray-500">Total de mensajes</p>
        </div>
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

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(hasRole('player') || hasRole('admin')) && (
            <>
              <Link to="/roster" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm font-medium">Roster</div>
              </Link>
              <Link to="/eventos" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">📅</div>
                <div className="text-sm font-medium">Eventos</div>
              </Link>
            </>
          )}
          {hasRole('admin') && (
            <>
              <Link to="/finanzas" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm font-medium">Finanzas</div>
              </Link>
              <Link to="/admin/monitoring" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-medium">Monitoreo</div>
              </Link>
            </>
          )}
          {!hasRole('player') && !hasRole('admin') && (
            <>
              <Link to="/perfil" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">👤</div>
                <div className="text-sm font-medium">Mi Perfil</div>
              </Link>
              <div className="p-4 border rounded-lg bg-gray-50 text-center opacity-60">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm font-medium text-gray-500">Roster</div>
                <div className="text-xs text-gray-400 mt-1">Solicita acceso</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}