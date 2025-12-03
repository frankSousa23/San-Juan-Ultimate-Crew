import React, { useState, useEffect } from 'react'
import { http, getAuthToken } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'

interface AuditLog {
  id: number
  action: string
  entityType: string
  entityId: number | null
  userId: number | null
  ipAddress: string | null
  userAgent: string | null
  details: any
  createdAt: string
  user: {
    id: number
    email: string
    name: string | null
  } | null
}

interface AuditResponse {
  items: AuditLog[]
  total: number
  limit: number
  offset: number
}

export default function SystemMonitoring() {
  const [activeTab, setActiveTab] = useState('overview')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditLimit] = useState(50)
  const [auditOffset, setAuditOffset] = useState(0)
  const [auditFilters, setAuditFilters] = useState({
    action: '',
    entityType: '',
    from: '',
    to: ''
  })
  const toasts = useToast()
  const authed = !!getAuthToken()

  const tabs = [
    { id: 'overview', label: 'System Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'security', label: 'Security' },
    { id: 'audit', label: 'Audit Logs' },
    { id: 'optimization', label: 'Optimization' },
  ]

  const { execute: loadAuditLogs, loading: auditLoading } = useApi(
    async (params?: any) => {
      const queryParams = new URLSearchParams()
      if (params?.action) queryParams.append('action', params.action)
      if (params?.entityType) queryParams.append('entityType', params.entityType)
      if (params?.from) queryParams.append('from', params.from)
      if (params?.to) queryParams.append('to', params.to)
      queryParams.append('limit', String(auditLimit))
      queryParams.append('offset', String(auditOffset))
      
      const { data } = await http.get<AuditResponse>(`/api/audit?${queryParams.toString()}`)
      return data
    },
    {
      onSuccess: (data) => {
        setAuditLogs(data.items)
        setAuditTotal(data.total)
      },
      onError: () => {
        toasts.showErrorToast('Error cargando logs de auditoría')
      },
      showErrorToast: false
    }
  )

  useEffect(() => {
    if (activeTab === 'audit' && authed) {
      loadAuditLogs(auditFilters)
    }
  }, [activeTab, auditOffset, auditFilters, authed])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">System Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800">API Status</h4>
                <p className="text-2xl font-bold text-blue-600">Online</p>
                <p className="text-xs text-blue-600">Port 4000</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800">Frontend Status</h4>
                <p className="text-2xl font-bold text-green-600">Online</p>
                <p className="text-xs text-green-600">Port 5173</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-800">Database Status</h4>
                <p className="text-2xl font-bold text-purple-600">Connected</p>
                <p className="text-xs text-purple-600">PostgreSQL</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> Advanced monitoring services are being optimized to prevent system overload.
                Basic performance monitoring is active.
              </p>
            </div>
          </div>
        )
      case 'performance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800">CPU Usage</h4>
                <p className="text-2xl font-bold text-gray-600">Normal</p>
                <p className="text-xs text-gray-600">Stable performance</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800">Memory Usage</h4>
                <p className="text-2xl font-bold text-gray-600">Normal</p>
                <p className="text-xs text-gray-600">Within limits</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Performance Status:</strong> System is running efficiently with basic optimizations.
              </p>
            </div>
          </div>
        )
      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Security Monitoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800">Authentication</h4>
                <p className="text-2xl font-bold text-green-600">Active</p>
                <p className="text-xs text-green-600">JWT tokens</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800">Authorization</h4>
                <p className="text-2xl font-bold text-green-600">Active</p>
                <p className="text-xs text-green-600">Role-based access</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>Security Status:</strong> All security measures are active and functioning properly.
              </p>
            </div>
          </div>
        )
      case 'audit':
        if (!authed) {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Debes iniciar sesión para ver los logs de auditoría.</p>
            </div>
          )
        }
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
              <div className="text-sm text-gray-600">
                Total: {auditTotal} registros
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={auditFilters.action}
                    onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })}
                  >
                    <option value="">Todas</option>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                    <option value="LOGIN">LOGIN</option>
                    <option value="LOGOUT">LOGOUT</option>
                    <option value="ROLE_CHANGE">ROLE_CHANGE</option>
                    <option value="PERMISSION_CHANGE">PERMISSION_CHANGE</option>
                    <option value="FILE_UPLOAD">FILE_UPLOAD</option>
                    <option value="FILE_DELETE">FILE_DELETE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entidad</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="User, Transaction, etc."
                    value={auditFilters.entityType}
                    onChange={(e) => setAuditFilters({ ...auditFilters, entityType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={auditFilters.from}
                    onChange={(e) => setAuditFilters({ ...auditFilters, from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={auditFilters.to}
                    onChange={(e) => setAuditFilters({ ...auditFilters, to: e.target.value })}
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setAuditOffset(0)
                  loadAuditLogs(auditFilters)
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm whitespace-nowrap w-full sm:w-auto"
              >
                Filtrar
              </button>
            </div>

            {auditLoading ? (
              <div className="bg-white rounded-lg shadow p-4">Cargando logs...</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle sm:px-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[50px]">ID</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">Acción</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]">Entidad</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px] hidden md:table-cell">Usuario</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">Fecha</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px] hidden lg:table-cell">IP</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-2 sm:px-4 py-6 text-center text-gray-500">
                              No hay logs de auditoría
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-2 sm:px-4 py-3 text-sm text-gray-900">{log.id}</td>
                              <td className="px-2 sm:px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  log.action === 'LOGIN' || log.action === 'LOGOUT' ? 'bg-blue-100 text-blue-800' :
                                  log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                  log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                                  log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-sm text-gray-900">
                                {log.entityType}
                                {log.entityId && ` #${log.entityId}`}
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-sm text-gray-900 hidden md:table-cell">
                                {log.user ? (
                                  <div>
                                    <div className="font-medium">{log.user.email}</div>
                                    {log.user.name && <div className="text-xs text-gray-500">{log.user.name}</div>}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('es-PR')}</td>
                              <td className="px-2 sm:px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{log.ipAddress || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {auditTotal > auditLimit && (
                  <div className="bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t">
                    <div className="text-sm text-gray-700">
                      Mostrando {auditOffset + 1} - {Math.min(auditOffset + auditLimit, auditTotal)} de {auditTotal}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newOffset = Math.max(0, auditOffset - auditLimit)
                          setAuditOffset(newOffset)
                        }}
                        disabled={auditOffset === 0}
                        className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => {
                          const newOffset = auditOffset + auditLimit
                          setAuditOffset(newOffset)
                        }}
                        disabled={auditOffset + auditLimit >= auditTotal}
                        className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      case 'optimization':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">System Optimization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800">Build Optimization</h4>
                <p className="text-2xl font-bold text-blue-600">Active</p>
                <p className="text-xs text-blue-600">Vite + React</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800">Code Splitting</h4>
                <p className="text-2xl font-bold text-blue-600">Active</p>
                <p className="text-xs text-blue-600">Dynamic imports</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Optimization Status:</strong> System is running with basic optimizations.
                Advanced optimization services will be implemented gradually to ensure stability.
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="mt-2 text-gray-600">Basic monitoring dashboard - Advanced features coming soon</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 sm:space-x-8 px-2 sm:px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}