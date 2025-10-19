// Servicio de monitoreo de rendimiento de base de datos
export interface DatabasePerformanceMetric {
  id: string
  type: 'query_time' | 'connection_pool' | 'cache_hit_rate' | 'index_usage' | 'lock_wait' | 'deadlock'
  name: string
  value: number
  unit: string
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  timestamp: Date
}

export interface DatabasePerformanceEvent {
  id: string
  type: 'slow_query' | 'connection_error' | 'cache_miss' | 'index_missing' | 'lock_timeout' | 'deadlock_detected'
  message: string
  query?: string
  table?: string
  executionTime: number
  timestamp: Date
  context: Record<string, any>
}

export interface DatabasePerformanceReport {
  id: string
  timestamp: Date
  summary: {
    overallScore: number
    totalQueries: number
    slowQueries: number
    averageQueryTime: number
    connectionPoolUsage: number
    cacheHitRate: number
    indexUsageRate: number
    lockWaitTime: number
    deadlockCount: number
  }
  metrics: DatabasePerformanceMetric[]
  events: DatabasePerformanceEvent[]
  recommendations: string[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

// Clase principal del servicio de monitoreo de rendimiento de base de datos
export class DatabasePerformanceService {
  private static instance: DatabasePerformanceService
  private metrics: DatabasePerformanceMetric[] = []
  private events: DatabasePerformanceEvent[] = []
  private isInitialized = false

  private constructor() {
    this.initializeDatabasePerformanceMonitoring()
  }

  static getInstance(): DatabasePerformanceService {
    if (!DatabasePerformanceService.instance) {
      DatabasePerformanceService.instance = new DatabasePerformanceService()
    }
    return DatabasePerformanceService.instance
  }

  // Inicializar monitoreo de rendimiento de base de datos
  private initializeDatabasePerformanceMonitoring(): void {
    this.analyzeQueryTime()
    this.analyzeConnectionPool()
    this.analyzeCacheHitRate()
    this.analyzeIndexUsage()
    this.analyzeLockWait()
    this.analyzeDeadlocks()
    this.detectDatabaseIssues()

    this.isInitialized = true
  }

  // Analizar tiempo de consulta
  private analyzeQueryTime(): void {
    // Simular análisis de tiempo de consulta
    const queryTimeMetrics = [
      {
        id: 'query-time-1',
        type: 'query_time' as const,
        name: 'Average Query Time',
        value: 45,
        unit: 'ms',
        threshold: 50,
        status: 'pass' as const,
        description: 'Average query execution time',
        timestamp: new Date(),
      },
      {
        id: 'query-time-2',
        type: 'query_time' as const,
        name: 'P95 Query Time',
        value: 120,
        unit: 'ms',
        threshold: 100,
        status: 'warning' as const,
        description: '95th percentile query time',
        timestamp: new Date(),
      },
      {
        id: 'query-time-3',
        type: 'query_time' as const,
        name: 'P99 Query Time',
        value: 200,
        unit: 'ms',
        threshold: 150,
        status: 'warning' as const,
        description: '99th percentile query time',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...queryTimeMetrics)
  }

  // Analizar pool de conexiones
  private analyzeConnectionPool(): void {
    // Simular análisis de pool de conexiones
    const connectionPoolMetrics = [
      {
        id: 'connection-pool-1',
        type: 'connection_pool' as const,
        name: 'Connection Pool Usage',
        value: 75,
        unit: '%',
        threshold: 80,
        status: 'pass' as const,
        description: 'Percentage of connections in use',
        timestamp: new Date(),
      },
      {
        id: 'connection-pool-2',
        type: 'connection_pool' as const,
        name: 'Connection Wait Time',
        value: 25,
        unit: 'ms',
        threshold: 30,
        status: 'pass' as const,
        description: 'Average time to get a connection',
        timestamp: new Date(),
      },
      {
        id: 'connection-pool-3',
        type: 'connection_pool' as const,
        name: 'Connection Timeout Rate',
        value: 2,
        unit: '%',
        threshold: 1,
        status: 'warning' as const,
        description: 'Percentage of connection timeouts',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...connectionPoolMetrics)
  }

  // Analizar tasa de acierto de cache
  private analyzeCacheHitRate(): void {
    // Simular análisis de tasa de acierto de cache
    const cacheHitRateMetrics = [
      {
        id: 'cache-hit-rate-1',
        type: 'cache_hit_rate' as const,
        name: 'Query Cache Hit Rate',
        value: 85,
        unit: '%',
        threshold: 80,
        status: 'pass' as const,
        description: 'Percentage of queries served from cache',
        timestamp: new Date(),
      },
      {
        id: 'cache-hit-rate-2',
        type: 'cache_hit_rate' as const,
        name: 'Buffer Pool Hit Rate',
        value: 95,
        unit: '%',
        threshold: 90,
        status: 'pass' as const,
        description: 'Percentage of data served from buffer pool',
        timestamp: new Date(),
      },
      {
        id: 'cache-hit-rate-3',
        type: 'cache_hit_rate' as const,
        name: 'Index Cache Hit Rate',
        value: 90,
        unit: '%',
        threshold: 85,
        status: 'pass' as const,
        description: 'Percentage of index data served from cache',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...cacheHitRateMetrics)
  }

  // Analizar uso de índices
  private analyzeIndexUsage(): void {
    // Simular análisis de uso de índices
    const indexUsageMetrics = [
      {
        id: 'index-usage-1',
        type: 'index_usage' as const,
        name: 'Index Usage Rate',
        value: 80,
        unit: '%',
        threshold: 75,
        status: 'pass' as const,
        description: 'Percentage of queries using indexes',
        timestamp: new Date(),
      },
      {
        id: 'index-usage-2',
        type: 'index_usage' as const,
        name: 'Unused Indexes',
        value: 15,
        unit: '%',
        threshold: 10,
        status: 'warning' as const,
        description: 'Percentage of unused indexes',
        timestamp: new Date(),
      },
      {
        id: 'index-usage-3',
        type: 'index_usage' as const,
        name: 'Index Fragmentation',
        value: 25,
        unit: '%',
        threshold: 20,
        status: 'warning' as const,
        description: 'Average index fragmentation',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...indexUsageMetrics)
  }

  // Analizar tiempo de espera de bloqueos
  private analyzeLockWait(): void {
    // Simular análisis de tiempo de espera de bloqueos
    const lockWaitMetrics = [
      {
        id: 'lock-wait-1',
        type: 'lock_wait' as const,
        name: 'Average Lock Wait Time',
        value: 15,
        unit: 'ms',
        threshold: 20,
        status: 'pass' as const,
        description: 'Average time waiting for locks',
        timestamp: new Date(),
      },
      {
        id: 'lock-wait-2',
        type: 'lock_wait' as const,
        name: 'Lock Timeout Rate',
        value: 1,
        unit: '%',
        threshold: 0.5,
        status: 'warning' as const,
        description: 'Percentage of lock timeouts',
        timestamp: new Date(),
      },
      {
        id: 'lock-wait-3',
        type: 'lock_wait' as const,
        name: 'Deadlock Detection Rate',
        value: 0.1,
        unit: '%',
        threshold: 0.05,
        status: 'warning' as const,
        description: 'Percentage of deadlock detections',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...lockWaitMetrics)
  }

  // Analizar deadlocks
  private analyzeDeadlocks(): void {
    // Simular análisis de deadlocks
    const deadlockMetrics = [
      {
        id: 'deadlock-1',
        type: 'deadlock' as const,
        name: 'Deadlock Count',
        value: 2,
        unit: 'count',
        threshold: 1,
        status: 'warning' as const,
        description: 'Number of deadlocks detected',
        timestamp: new Date(),
      },
      {
        id: 'deadlock-2',
        type: 'deadlock' as const,
        name: 'Deadlock Resolution Time',
        value: 50,
        unit: 'ms',
        threshold: 30,
        status: 'warning' as const,
        description: 'Average time to resolve deadlocks',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...deadlockMetrics)
  }

  // Detectar problemas de base de datos
  private detectDatabaseIssues(): void {
    // Simular detección de problemas
    const databaseIssues = [
      {
        id: 'db-issue-1',
        type: 'slow_query' as const,
        message: 'Slow query detected',
        query: 'SELECT * FROM users WHERE email = ?',
        table: 'users',
        executionTime: 150,
        timestamp: new Date(),
        context: {
          queryTime: 150,
          rowsExamined: 1000,
          rowsReturned: 1,
        },
      },
      {
        id: 'db-issue-2',
        type: 'connection_error' as const,
        message: 'Connection pool exhausted',
        executionTime: 0,
        timestamp: new Date(),
        context: {
          activeConnections: 100,
          maxConnections: 100,
          waitingConnections: 5,
        },
      },
      {
        id: 'db-issue-3',
        type: 'cache_miss' as const,
        message: 'High cache miss rate',
        table: 'products',
        executionTime: 0,
        timestamp: new Date(),
        context: {
          cacheHitRate: 60,
          threshold: 80,
        },
      },
      {
        id: 'db-issue-4',
        type: 'index_missing' as const,
        message: 'Missing index on frequently queried column',
        query: 'SELECT * FROM orders WHERE status = ?',
        table: 'orders',
        executionTime: 0,
        timestamp: new Date(),
        context: {
          column: 'status',
          queryCount: 1000,
          avgQueryTime: 200,
        },
      },
      {
        id: 'db-issue-5',
        type: 'lock_timeout' as const,
        message: 'Lock timeout on table',
        table: 'inventory',
        executionTime: 0,
        timestamp: new Date(),
        context: {
          lockType: 'exclusive',
          timeout: 30,
          waitingQueries: 3,
        },
      },
      {
        id: 'db-issue-6',
        type: 'deadlock_detected' as const,
        message: 'Deadlock detected between transactions',
        executionTime: 0,
        timestamp: new Date(),
        context: {
          transaction1: 'UPDATE users SET last_login = NOW()',
          transaction2: 'UPDATE orders SET status = "completed"',
          tables: ['users', 'orders'],
        },
      },
    ]

    this.events.push(...databaseIssues)
  }

  // Obtener eventos por tipo
  getEventsByType(type: DatabasePerformanceEvent['type']): DatabasePerformanceEvent[] {
    return this.events.filter(event => event.type === type)
  }

  // Obtener eventos por tabla
  getEventsByTable(table: string): DatabasePerformanceEvent[] {
    return this.events.filter(event => event.table === table)
  }

  // Obtener métricas por tipo
  getMetricsByType(type: DatabasePerformanceMetric['type']): DatabasePerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  // Obtener métricas por estado
  getMetricsByStatus(status: DatabasePerformanceMetric['status']): DatabasePerformanceMetric[] {
    return this.metrics.filter(metric => metric.status === status)
  }

  // Generar reporte de rendimiento de base de datos
  generateDatabasePerformanceReport(): DatabasePerformanceReport {
    const summary = {
      overallScore: this.calculateOverallScore(),
      totalQueries: this.events.length,
      slowQueries: this.events.filter(e => e.type === 'slow_query').length,
      averageQueryTime: this.getAverageQueryTime(),
      connectionPoolUsage: this.getAverageConnectionPoolUsage(),
      cacheHitRate: this.getAverageCacheHitRate(),
      indexUsageRate: this.getAverageIndexUsage(),
      lockWaitTime: this.getAverageLockWaitTime(),
      deadlockCount: this.events.filter(e => e.type === 'deadlock_detected').length,
    }

    const recommendations = this.generateRecommendations()

    const trends = {
      last24h: this.events.filter(e => {
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000)
        return e.timestamp.getTime() > dayAgo
      }).length,
      last7d: this.events.filter(e => {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        return e.timestamp.getTime() > weekAgo
      }).length,
      last30d: this.events.filter(e => {
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
        return e.timestamp.getTime() > monthAgo
      }).length,
    }

    return {
      id: `database_performance_report_${Date.now()}`,
      timestamp: new Date(),
      summary,
      metrics: [...this.metrics],
      events: [...this.events],
      recommendations,
      trends,
    }
  }

  // Calcular puntuación general
  private calculateOverallScore(): number {
    const totalMetrics = this.metrics.length
    if (totalMetrics === 0) return 100

    const passedMetrics = this.metrics.filter(m => m.status === 'pass').length
    const warningMetrics = this.metrics.filter(m => m.status === 'warning').length
    const failedMetrics = this.metrics.filter(m => m.status === 'fail').length

    const score = (passedMetrics * 100 + warningMetrics * 50 + failedMetrics * 0) / totalMetrics
    return Math.round(score)
  }

  // Obtener tiempo de consulta promedio
  private getAverageQueryTime(): number {
    const queryTimeMetrics = this.metrics.filter(m => m.type === 'query_time')
    if (queryTimeMetrics.length === 0) return 0

    const total = queryTimeMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / queryTimeMetrics.length)
  }

  // Obtener uso de pool de conexiones promedio
  private getAverageConnectionPoolUsage(): number {
    const connectionPoolMetrics = this.metrics.filter(m => m.type === 'connection_pool')
    if (connectionPoolMetrics.length === 0) return 0

    const total = connectionPoolMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / connectionPoolMetrics.length)
  }

  // Obtener tasa de acierto de cache promedio
  private getAverageCacheHitRate(): number {
    const cacheHitRateMetrics = this.metrics.filter(m => m.type === 'cache_hit_rate')
    if (cacheHitRateMetrics.length === 0) return 0

    const total = cacheHitRateMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / cacheHitRateMetrics.length)
  }

  // Obtener uso de índices promedio
  private getAverageIndexUsage(): number {
    const indexUsageMetrics = this.metrics.filter(m => m.type === 'index_usage')
    if (indexUsageMetrics.length === 0) return 0

    const total = indexUsageMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / indexUsageMetrics.length)
  }

  // Obtener tiempo de espera de bloqueos promedio
  private getAverageLockWaitTime(): number {
    const lockWaitMetrics = this.metrics.filter(m => m.type === 'lock_wait')
    if (lockWaitMetrics.length === 0) return 0

    const total = lockWaitMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / lockWaitMetrics.length)
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const warningMetrics = this.metrics.filter(m => m.status === 'warning')
    if (warningMetrics.length > 0) {
      recommendations.push(`${warningMetrics.length} métricas de base de datos en advertencia`)
    }

    const failedMetrics = this.metrics.filter(m => m.status === 'fail')
    if (failedMetrics.length > 0) {
      recommendations.push(`${failedMetrics.length} métricas de base de datos fallaron`)
    }

    const slowQueries = this.events.filter(e => e.type === 'slow_query')
    if (slowQueries.length > 0) {
      recommendations.push(`${slowQueries.length} consultas lentas detectadas`)
    }

    const connectionErrors = this.events.filter(e => e.type === 'connection_error')
    if (connectionErrors.length > 0) {
      recommendations.push(`${connectionErrors.length} errores de conexión detectados`)
    }

    const cacheMisses = this.events.filter(e => e.type === 'cache_miss')
    if (cacheMisses.length > 0) {
      recommendations.push(`${cacheMisses.length} problemas de cache detectados`)
    }

    const missingIndexes = this.events.filter(e => e.type === 'index_missing')
    if (missingIndexes.length > 0) {
      recommendations.push(`${missingIndexes.length} índices faltantes detectados`)
    }

    const lockTimeouts = this.events.filter(e => e.type === 'lock_timeout')
    if (lockTimeouts.length > 0) {
      recommendations.push(`${lockTimeouts.length} timeouts de bloqueo detectados`)
    }

    const deadlocks = this.events.filter(e => e.type === 'deadlock_detected')
    if (deadlocks.length > 0) {
      recommendations.push(`${deadlocks.length} deadlocks detectados`)
    }

    return recommendations
  }

  // Obtener todos los eventos
  getAllEvents(): DatabasePerformanceEvent[] {
    return [...this.events]
  }

  // Obtener todas las métricas
  getAllMetrics(): DatabasePerformanceMetric[] {
    return [...this.metrics]
  }

  // Limpiar datos
  clearData(): void {
    this.events = []
    this.metrics = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      events: this.events,
      metrics: this.metrics,
      report: this.generateDatabasePerformanceReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const databasePerformanceService = DatabasePerformanceService.getInstance()

// Hook para usar el servicio de monitoreo de rendimiento de base de datos
export function useDatabasePerformance() {
  const [events, setEvents] = useState<DatabasePerformanceEvent[]>([])
  const [metrics, setMetrics] = useState<DatabasePerformanceMetric[]>([])
  const [report, setReport] = useState<DatabasePerformanceReport | null>(null)

  useEffect(() => {
    setEvents(databasePerformanceService.getAllEvents())
    setMetrics(databasePerformanceService.getAllMetrics())
    setReport(databasePerformanceService.generateDatabasePerformanceReport())
  }, [])

  const getEventsByType = useCallback((type: DatabasePerformanceEvent['type']) => {
    return databasePerformanceService.getEventsByType(type)
  }, [])

  const getEventsByTable = useCallback((table: string) => {
    return databasePerformanceService.getEventsByTable(table)
  }, [])

  const getMetricsByType = useCallback((type: DatabasePerformanceMetric['type']) => {
    return databasePerformanceService.getMetricsByType(type)
  }, [])

  const getMetricsByStatus = useCallback((status: DatabasePerformanceMetric['status']) => {
    return databasePerformanceService.getMetricsByStatus(status)
  }, [])

  const generateDatabasePerformanceReport = useCallback(() => {
    const newReport = databasePerformanceService.generateDatabasePerformanceReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    databasePerformanceService.clearData()
    setEvents([])
    setMetrics([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return databasePerformanceService.exportData()
  }, [])

  return {
    events,
    metrics,
    report,
    getEventsByType,
    getEventsByTable,
    getMetricsByType,
    getMetricsByStatus,
    generateDatabasePerformanceReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de monitoreo de rendimiento de base de datos
interface DatabasePerformanceDashboardProps {
  className?: string
}

export const DatabasePerformanceDashboard: React.FC<DatabasePerformanceDashboardProps> = ({ className = '' }) => {
  const { events, metrics, report, generateDatabasePerformanceReport, clearData, exportData } = useDatabasePerformance()

  const getTypeColor = (type: DatabasePerformanceEvent['type']) => {
    switch (type) {
      case 'slow_query': return 'text-yellow-600 bg-yellow-100'
      case 'connection_error': return 'text-red-600 bg-red-100'
      case 'cache_miss': return 'text-orange-600 bg-orange-100'
      case 'index_missing': return 'text-blue-600 bg-blue-100'
      case 'lock_timeout': return 'text-purple-600 bg-purple-100'
      case 'deadlock_detected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: DatabasePerformanceMetric['status']) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'fail': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Rendimiento de Base de Datos</h2>
        <div className="space-x-2">
          <button
            onClick={generateDatabasePerformanceReport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generar Reporte
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Limpiar Datos
          </button>
          <button
            onClick={() => {
              const data = exportData()
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'database-performance-data.json'
              a.click()
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Exportar Datos
          </button>
        </div>
      </div>

      {report && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Rendimiento de Base de Datos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación General</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.overallScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Tiempo de Consulta</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.averageQueryTime}ms</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Cache Hit Rate</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.cacheHitRate}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Uso de Pool</h4>
              <p className="text-2xl font-bold text-orange-600">{report.summary.connectionPoolUsage}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Eventos de Base de Datos Recientes</h3>
          <div className="space-y-2">
            {events.slice(-5).map(event => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{event.message}</h4>
                    {event.table && (
                      <p className="text-xs text-gray-600">Tabla: {event.table}</p>
                    )}
                    {event.query && (
                      <p className="text-xs text-gray-500 font-mono">{event.query}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                    {event.executionTime > 0 && (
                      <span className="text-xs text-gray-500">{event.executionTime}ms</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">{event.timestamp.toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de Base de Datos</h3>
          <div className="space-y-2">
            {metrics.slice(-5).map(metric => (
              <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{metric.name}</h4>
                    <p className="text-xs text-gray-600">{metric.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                      {metric.status}
                    </span>
                    <span className="text-sm text-gray-600">{metric.value}{metric.unit}/{metric.threshold}{metric.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}