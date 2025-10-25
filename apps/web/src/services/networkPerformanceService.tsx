import React, { useState, useEffect, useCallback } from 'react'

// Servicio de monitoreo de rendimiento de red
export interface NetworkPerformanceMetric {
  id: string
  type: 'bandwidth' | 'latency' | 'packet_loss' | 'throughput' | 'connection_count' | 'network_errors'
  name: string
  value: number
  unit: string
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  timestamp: Date
}

export interface NetworkPerformanceEvent {
  id: string
  type: 'high_latency' | 'packet_loss' | 'bandwidth_saturation' | 'connection_timeout' | 'network_error' | 'dns_failure'
  message: string
  latency: number
  bandwidth: number
  timestamp: Date
  context: Record<string, any>
}

export interface NetworkPerformanceReport {
  id: string
  timestamp: Date
  summary: {
    overallScore: number
    averageLatency: number
    bandwidthUtilization: number
    packetLossRate: number
    networkThroughput: number
    activeConnections: number
    networkErrors: number
    connectionTimeouts: number
    dnsFailures: number
  }
  metrics: NetworkPerformanceMetric[]
  events: NetworkPerformanceEvent[]
  recommendations: string[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

// Clase principal del servicio de monitoreo de rendimiento de red
export class NetworkPerformanceService {
  private static instance: NetworkPerformanceService
  private metrics: NetworkPerformanceMetric[] = []
  private events: NetworkPerformanceEvent[] = []
  private isInitialized = false

  private constructor() {
    this.initializeNetworkPerformanceMonitoring()
  }

  static getInstance(): NetworkPerformanceService {
    if (!NetworkPerformanceService.instance) {
      NetworkPerformanceService.instance = new NetworkPerformanceService()
    }
    return NetworkPerformanceService.instance
  }

  // Inicializar monitoreo de rendimiento de red
  private initializeNetworkPerformanceMonitoring(): void {
    this.analyzeBandwidth()
    this.analyzeLatency()
    this.analyzePacketLoss()
    this.analyzeThroughput()
    this.analyzeConnectionCount()
    this.analyzeNetworkErrors()
    this.detectNetworkIssues()

    this.isInitialized = true
  }

  // Analizar ancho de banda
  private analyzeBandwidth(): void {
    // Simular análisis de ancho de banda
    const bandwidthMetrics = [
      {
        id: 'bandwidth-1',
        type: 'bandwidth' as const,
        name: 'Bandwidth Utilization',
        value: 65,
        unit: '%',
        threshold: 80,
        status: 'pass' as const,
        description: 'Percentage of available bandwidth used',
        timestamp: new Date(),
      },
      {
        id: 'bandwidth-2',
        type: 'bandwidth' as const,
        name: 'Download Speed',
        value: 45,
        unit: 'Mbps',
        threshold: 50,
        status: 'pass' as const,
        description: 'Current download speed',
        timestamp: new Date(),
      },
      {
        id: 'bandwidth-3',
        type: 'bandwidth' as const,
        name: 'Upload Speed',
        value: 25,
        unit: 'Mbps',
        threshold: 30,
        status: 'pass' as const,
        description: 'Current upload speed',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...bandwidthMetrics)
  }

  // Analizar latencia
  private analyzeLatency(): void {
    // Simular análisis de latencia
    const latencyMetrics = [
      {
        id: 'latency-1',
        type: 'latency' as const,
        name: 'Network Latency',
        value: 25,
        unit: 'ms',
        threshold: 50,
        status: 'pass' as const,
        description: 'Average network latency',
        timestamp: new Date(),
      },
      {
        id: 'latency-2',
        type: 'latency' as const,
        name: 'DNS Lookup Time',
        value: 15,
        unit: 'ms',
        threshold: 30,
        status: 'pass' as const,
        description: 'Average DNS lookup time',
        timestamp: new Date(),
      },
      {
        id: 'latency-3',
        type: 'latency' as const,
        name: 'Connection Time',
        value: 100,
        unit: 'ms',
        threshold: 200,
        status: 'pass' as const,
        description: 'Average connection establishment time',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...latencyMetrics)
  }

  // Analizar pérdida de paquetes
  private analyzePacketLoss(): void {
    // Simular análisis de pérdida de paquetes
    const packetLossMetrics = [
      {
        id: 'packet-loss-1',
        type: 'packet_loss' as const,
        name: 'Packet Loss Rate',
        value: 0.5,
        unit: '%',
        threshold: 1.0,
        status: 'pass' as const,
        description: 'Percentage of packets lost',
        timestamp: new Date(),
      },
      {
        id: 'packet-loss-2',
        type: 'packet_loss' as const,
        name: 'Retransmission Rate',
        value: 2,
        unit: '%',
        threshold: 5,
        status: 'pass' as const,
        description: 'Percentage of packets retransmitted',
        timestamp: new Date(),
      },
      {
        id: 'packet-loss-3',
        type: 'packet_loss' as const,
        name: 'Out of Order Packets',
        value: 1,
        unit: '%',
        threshold: 2,
        status: 'pass' as const,
        description: 'Percentage of out of order packets',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...packetLossMetrics)
  }

  // Analizar throughput
  private analyzeThroughput(): void {
    // Simular análisis de throughput
    const throughputMetrics = [
      {
        id: 'throughput-1',
        type: 'throughput' as const,
        name: 'Network Throughput',
        value: 35,
        unit: 'Mbps',
        threshold: 40,
        status: 'pass' as const,
        description: 'Current network throughput',
        timestamp: new Date(),
      },
      {
        id: 'throughput-2',
        type: 'throughput' as const,
        name: 'Data Transfer Rate',
        value: 4.5,
        unit: 'MB/s',
        threshold: 5.0,
        status: 'pass' as const,
        description: 'Data transfer rate',
        timestamp: new Date(),
      },
      {
        id: 'throughput-3',
        type: 'throughput' as const,
        name: 'Peak Throughput',
        value: 50,
        unit: 'Mbps',
        threshold: 60,
        status: 'pass' as const,
        description: 'Peak network throughput',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...throughputMetrics)
  }

  // Analizar número de conexiones
  private analyzeConnectionCount(): void {
    // Simular análisis de número de conexiones
    const connectionCountMetrics = [
      {
        id: 'connection-count-1',
        type: 'connection_count' as const,
        name: 'Active Connections',
        value: 150,
        unit: 'count',
        threshold: 200,
        status: 'pass' as const,
        description: 'Number of active network connections',
        timestamp: new Date(),
      },
      {
        id: 'connection-count-2',
        type: 'connection_count' as const,
        name: 'Connection Pool Usage',
        value: 75,
        unit: '%',
        threshold: 80,
        status: 'pass' as const,
        description: 'Percentage of connection pool used',
        timestamp: new Date(),
      },
      {
        id: 'connection-count-3',
        type: 'connection_count' as const,
        name: 'New Connections/sec',
        value: 25,
        unit: 'count/s',
        threshold: 50,
        status: 'pass' as const,
        description: 'Number of new connections per second',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...connectionCountMetrics)
  }

  // Analizar errores de red
  private analyzeNetworkErrors(): void {
    // Simular análisis de errores de red
    const networkErrorsMetrics = [
      {
        id: 'network-errors-1',
        type: 'network_errors' as const,
        name: 'Network Error Rate',
        value: 0.1,
        unit: '%',
        threshold: 0.5,
        status: 'pass' as const,
        description: 'Percentage of network errors',
        timestamp: new Date(),
      },
      {
        id: 'network-errors-2',
        type: 'network_errors' as const,
        name: 'Timeout Rate',
        value: 0.2,
        unit: '%',
        threshold: 1.0,
        status: 'pass' as const,
        description: 'Percentage of connection timeouts',
        timestamp: new Date(),
      },
      {
        id: 'network-errors-3',
        type: 'network_errors' as const,
        name: 'DNS Error Rate',
        value: 0.05,
        unit: '%',
        threshold: 0.1,
        status: 'pass' as const,
        description: 'Percentage of DNS errors',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...networkErrorsMetrics)
  }

  // Detectar problemas de red
  private detectNetworkIssues(): void {
    // Simular detección de problemas de red
    const networkIssues = [
      {
        id: 'network-issue-1',
        type: 'high_latency' as const,
        message: 'High network latency detected',
        latency: 75,
        bandwidth: 40,
        timestamp: new Date(),
        context: {
          latency: 75,
          threshold: 50,
          duration: 30,
        },
      },
      {
        id: 'network-issue-2',
        type: 'packet_loss' as const,
        message: 'Packet loss detected',
        latency: 30,
        bandwidth: 35,
        timestamp: new Date(),
        context: {
          packetLoss: 2.5,
          threshold: 1.0,
          duration: 60,
        },
      },
      {
        id: 'network-issue-3',
        type: 'bandwidth_saturation' as const,
        message: 'Bandwidth saturation detected',
        latency: 40,
        bandwidth: 85,
        timestamp: new Date(),
        context: {
          utilization: 85,
          threshold: 80,
          duration: 45,
        },
      },
      {
        id: 'network-issue-4',
        type: 'connection_timeout' as const,
        message: 'Connection timeout detected',
        latency: 0,
        bandwidth: 0,
        timestamp: new Date(),
        context: {
          timeout: 30,
          threshold: 20,
          retries: 3,
        },
      },
      {
        id: 'network-issue-5',
        type: 'network_error' as const,
        message: 'Network error detected',
        latency: 0,
        bandwidth: 0,
        timestamp: new Date(),
        context: {
          error: 'Connection refused',
          errorCode: 'ECONNREFUSED',
          retries: 2,
        },
      },
      {
        id: 'network-issue-6',
        type: 'dns_failure' as const,
        message: 'DNS resolution failure',
        latency: 0,
        bandwidth: 0,
        timestamp: new Date(),
        context: {
          domain: 'api.example.com',
          error: 'NXDOMAIN',
          retries: 3,
        },
      },
    ]

    this.events.push(...networkIssues)
  }

  // Obtener eventos por tipo
  getEventsByType(type: NetworkPerformanceEvent['type']): NetworkPerformanceEvent[] {
    return this.events.filter(event => event.type === type)
  }

  // Obtener métricas por tipo
  getMetricsByType(type: NetworkPerformanceMetric['type']): NetworkPerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  // Obtener métricas por estado
  getMetricsByStatus(status: NetworkPerformanceMetric['status']): NetworkPerformanceMetric[] {
    return this.metrics.filter(metric => metric.status === status)
  }

  // Generar reporte de rendimiento de red
  generateNetworkPerformanceReport(): NetworkPerformanceReport {
    const summary = {
      overallScore: this.calculateOverallScore(),
      averageLatency: this.getAverageLatency(),
      bandwidthUtilization: this.getAverageBandwidthUtilization(),
      packetLossRate: this.getAveragePacketLossRate(),
      networkThroughput: this.getAverageNetworkThroughput(),
      activeConnections: this.getActiveConnections(),
      networkErrors: this.events.filter(e => e.type === 'network_error').length,
      connectionTimeouts: this.events.filter(e => e.type === 'connection_timeout').length,
      dnsFailures: this.events.filter(e => e.type === 'dns_failure').length,
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
      id: `network_performance_report_${Date.now()}`,
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

  // Obtener latencia promedio
  private getAverageLatency(): number {
    const latencyMetrics = this.metrics.filter(m => m.type === 'latency')
    if (latencyMetrics.length === 0) return 0

    const total = latencyMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / latencyMetrics.length)
  }

  // Obtener utilización de ancho de banda promedio
  private getAverageBandwidthUtilization(): number {
    const bandwidthMetrics = this.metrics.filter(m => m.type === 'bandwidth')
    if (bandwidthMetrics.length === 0) return 0

    const total = bandwidthMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / bandwidthMetrics.length)
  }

  // Obtener tasa de pérdida de paquetes promedio
  private getAveragePacketLossRate(): number {
    const packetLossMetrics = this.metrics.filter(m => m.type === 'packet_loss')
    if (packetLossMetrics.length === 0) return 0

    const total = packetLossMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round((total / packetLossMetrics.length) * 100) / 100
  }

  // Obtener throughput de red promedio
  private getAverageNetworkThroughput(): number {
    const throughputMetrics = this.metrics.filter(m => m.type === 'throughput')
    if (throughputMetrics.length === 0) return 0

    const total = throughputMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / throughputMetrics.length)
  }

  // Obtener conexiones activas
  private getActiveConnections(): number {
    const connectionCountMetrics = this.metrics.filter(m => m.type === 'connection_count')
    if (connectionCountMetrics.length === 0) return 0

    const activeConnectionsMetric = connectionCountMetrics.find(m => m.name === 'Active Connections')
    return activeConnectionsMetric ? activeConnectionsMetric.value : 0
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const warningMetrics = this.metrics.filter(m => m.status === 'warning')
    if (warningMetrics.length > 0) {
      recommendations.push(`${warningMetrics.length} métricas de red en advertencia`)
    }

    const failedMetrics = this.metrics.filter(m => m.status === 'fail')
    if (failedMetrics.length > 0) {
      recommendations.push(`${failedMetrics.length} métricas de red fallaron`)
    }

    const highLatency = this.events.filter(e => e.type === 'high_latency')
    if (highLatency.length > 0) {
      recommendations.push(`${highLatency.length} eventos de alta latencia detectados`)
    }

    const packetLoss = this.events.filter(e => e.type === 'packet_loss')
    if (packetLoss.length > 0) {
      recommendations.push(`${packetLoss.length} eventos de pérdida de paquetes detectados`)
    }

    const bandwidthSaturation = this.events.filter(e => e.type === 'bandwidth_saturation')
    if (bandwidthSaturation.length > 0) {
      recommendations.push(`${bandwidthSaturation.length} eventos de saturación de ancho de banda detectados`)
    }

    const connectionTimeouts = this.events.filter(e => e.type === 'connection_timeout')
    if (connectionTimeouts.length > 0) {
      recommendations.push(`${connectionTimeouts.length} timeouts de conexión detectados`)
    }

    const networkErrors = this.events.filter(e => e.type === 'network_error')
    if (networkErrors.length > 0) {
      recommendations.push(`${networkErrors.length} errores de red detectados`)
    }

    const dnsFailures = this.events.filter(e => e.type === 'dns_failure')
    if (dnsFailures.length > 0) {
      recommendations.push(`${dnsFailures.length} fallos de DNS detectados`)
    }

    return recommendations
  }

  // Obtener todos los eventos
  getAllEvents(): NetworkPerformanceEvent[] {
    return [...this.events]
  }

  // Obtener todas las métricas
  getAllMetrics(): NetworkPerformanceMetric[] {
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
      report: this.generateNetworkPerformanceReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const networkPerformanceService = NetworkPerformanceService.getInstance()

// Hook para usar el servicio de monitoreo de rendimiento de red
export function useNetworkPerformance() {
  const [events, setEvents] = useState<NetworkPerformanceEvent[]>([])
  const [metrics, setMetrics] = useState<NetworkPerformanceMetric[]>([])
  const [report, setReport] = useState<NetworkPerformanceReport | null>(null)

  useEffect(() => {
    setEvents(networkPerformanceService.getAllEvents())
    setMetrics(networkPerformanceService.getAllMetrics())
    setReport(networkPerformanceService.generateNetworkPerformanceReport())
  }, [])

  const getEventsByType = useCallback((type: NetworkPerformanceEvent['type']) => {
    return networkPerformanceService.getEventsByType(type)
  }, [])

  const getMetricsByType = useCallback((type: NetworkPerformanceMetric['type']) => {
    return networkPerformanceService.getMetricsByType(type)
  }, [])

  const getMetricsByStatus = useCallback((status: NetworkPerformanceMetric['status']) => {
    return networkPerformanceService.getMetricsByStatus(status)
  }, [])

  const generateNetworkPerformanceReport = useCallback(() => {
    const newReport = networkPerformanceService.generateNetworkPerformanceReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    networkPerformanceService.clearData()
    setEvents([])
    setMetrics([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return networkPerformanceService.exportData()
  }, [])

  return {
    events,
    metrics,
    report,
    getEventsByType,
    getMetricsByType,
    getMetricsByStatus,
    generateNetworkPerformanceReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de monitoreo de rendimiento de red
interface NetworkPerformanceDashboardProps {
  className?: string
}

export const NetworkPerformanceDashboard: React.FC<NetworkPerformanceDashboardProps> = ({ className = '' }) => {
  const { events, metrics, report, generateNetworkPerformanceReport, clearData, exportData } = useNetworkPerformance()

  const getTypeColor = (type: NetworkPerformanceEvent['type']) => {
    switch (type) {
      case 'high_latency': return 'text-yellow-600 bg-yellow-100'
      case 'packet_loss': return 'text-red-600 bg-red-100'
      case 'bandwidth_saturation': return 'text-orange-600 bg-orange-100'
      case 'connection_timeout': return 'text-red-600 bg-red-100'
      case 'network_error': return 'text-red-600 bg-red-100'
      case 'dns_failure': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: NetworkPerformanceMetric['status']) => {
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
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Rendimiento de Red</h2>
        <div className="space-x-2">
          <button
            onClick={generateNetworkPerformanceReport}
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
              a.download = 'network-performance-data.json'
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Rendimiento de Red</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación General</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.overallScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Latencia Promedio</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.averageLatency}ms</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Utilización de Ancho de Banda</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.bandwidthUtilization}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Throughput de Red</h4>
              <p className="text-2xl font-bold text-purple-600">{report.summary.networkThroughput}Mbps</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Eventos de Red Recientes</h3>
          <div className="space-y-2">
            {events.slice(-5).map(event => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{event.message}</h4>
                    <p className="text-xs text-gray-600">
                      Latencia: {event.latency}ms / Ancho de Banda: {event.bandwidth}Mbps
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{event.timestamp.toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de Red</h3>
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
