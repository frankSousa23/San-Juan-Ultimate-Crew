import React, { useState, useEffect, useCallback } from 'react'

// Servicio de monitoreo de rendimiento de disco
export interface DiskPerformanceMetric {
  id: string
  type: 'disk_usage' | 'disk_io' | 'disk_latency' | 'disk_throughput' | 'disk_queue' | 'disk_fragmentation'
  name: string
  value: number
  unit: string
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  timestamp: Date
}

export interface DiskPerformanceEvent {
  id: string
  type: 'disk_full' | 'high_io_wait' | 'disk_latency_spike' | 'disk_failure' | 'disk_fragmentation' | 'disk_queue_overflow'
  message: string
  diskUsage: number
  diskLatency: number
  timestamp: Date
  context: Record<string, any>
}

export interface DiskPerformanceReport {
  id: string
  timestamp: Date
  summary: {
    overallScore: number
    totalDiskUsage: number
    averageDiskLatency: number
    diskThroughput: number
    diskQueueLength: number
    diskFragmentation: number
    diskIOPS: number
    diskErrors: number
  }
  metrics: DiskPerformanceMetric[]
  events: DiskPerformanceEvent[]
  recommendations: string[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

// Clase principal del servicio de monitoreo de rendimiento de disco
export class DiskPerformanceService {
  private static instance: DiskPerformanceService
  private metrics: DiskPerformanceMetric[] = []
  private events: DiskPerformanceEvent[] = []
  private isInitialized = false

  private constructor() {
    this.initializeDiskPerformanceMonitoring()
  }

  static getInstance(): DiskPerformanceService {
    if (!DiskPerformanceService.instance) {
      DiskPerformanceService.instance = new DiskPerformanceService()
    }
    return DiskPerformanceService.instance
  }

  // Inicializar monitoreo de rendimiento de disco
  private initializeDiskPerformanceMonitoring(): void {
    this.analyzeDiskUsage()
    this.analyzeDiskIO()
    this.analyzeDiskLatency()
    this.analyzeDiskThroughput()
    this.analyzeDiskQueue()
    this.analyzeDiskFragmentation()
    this.detectDiskIssues()

    this.isInitialized = true
  }

  // Analizar uso de disco
  private analyzeDiskUsage(): void {
    // Simular análisis de uso de disco
    const diskUsageMetrics = [
      {
        id: 'disk-usage-1',
        type: 'disk_usage' as const,
        name: 'Disk Usage',
        value: 75,
        unit: '%',
        threshold: 85,
        status: 'pass' as const,
        description: 'Percentage of disk space used',
        timestamp: new Date(),
      },
      {
        id: 'disk-usage-2',
        type: 'disk_usage' as const,
        name: 'Free Disk Space',
        value: 25,
        unit: '%',
        threshold: 15,
        status: 'pass' as const,
        description: 'Percentage of free disk space',
        timestamp: new Date(),
      },
      {
        id: 'disk-usage-3',
        type: 'disk_usage' as const,
        name: 'Disk Growth Rate',
        value: 5,
        unit: '%/day',
        threshold: 10,
        status: 'pass' as const,
        description: 'Rate of disk space growth',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...diskUsageMetrics)
  }

  // Analizar I/O de disco
  private analyzeDiskIO(): void {
    // Simular análisis de I/O de disco
    const diskIOMetrics = [
      {
        id: 'disk-io-1',
        type: 'disk_io' as const,
        name: 'Read IOPS',
        value: 1000,
        unit: 'IOPS',
        threshold: 2000,
        status: 'pass' as const,
        description: 'Read operations per second',
        timestamp: new Date(),
      },
      {
        id: 'disk-io-2',
        type: 'disk_io' as const,
        name: 'Write IOPS',
        value: 800,
        unit: 'IOPS',
        threshold: 1500,
        status: 'pass' as const,
        description: 'Write operations per second',
        timestamp: new Date(),
      },
      {
        id: 'disk-io-3',
        type: 'disk_io' as const,
        name: 'Total IOPS',
        value: 1800,
        unit: 'IOPS',
        threshold: 3000,
        status: 'pass' as const,
        description: 'Total operations per second',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...diskIOMetrics)
  }

  // Analizar latencia de disco
  private analyzeDiskLatency(): void {
    // Simular análisis de latencia de disco
    const diskLatencyMetrics = [
      {
        id: 'disk-latency-1',
        type: 'disk_latency' as const,
        name: 'Read Latency',
        value: 5,
        unit: 'ms',
        threshold: 10,
        status: 'pass' as const,
        description: 'Average read latency',
        timestamp: new Date(),
      },
      {
        id: 'disk-latency-2',
        type: 'disk_latency' as const,
        name: 'Write Latency',
        value: 8,
        unit: 'ms',
        threshold: 15,
        status: 'pass' as const,
        description: 'Average write latency',
        timestamp: new Date(),
      },
      {
        id: 'disk-latency-3',
        type: 'disk_latency' as const,
        name: 'Average Latency',
        value: 6.5,
        unit: 'ms',
        threshold: 12,
        status: 'pass' as const,
        description: 'Average disk latency',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...diskLatencyMetrics)
  }

  // Analizar throughput de disco
  private analyzeDiskThroughput(): void {
    // Simular análisis de throughput de disco
    const diskThroughputMetrics = [
      {
        id: 'disk-throughput-1',
        type: 'disk_throughput' as const,
        name: 'Read Throughput',
        value: 100,
        unit: 'MB/s',
        threshold: 200,
        status: 'pass' as const,
        description: 'Read throughput in MB/s',
        timestamp: new Date(),
      },
      {
        id: 'disk-throughput-2',
        type: 'disk_throughput' as const,
        name: 'Write Throughput',
        value: 80,
        unit: 'MB/s',
        threshold: 150,
        status: 'pass' as const,
        description: 'Write throughput in MB/s',
        timestamp: new Date(),
      },
      {
        id: 'disk-throughput-3',
        type: 'disk_throughput' as const,
        name: 'Total Throughput',
        value: 180,
        unit: 'MB/s',
        threshold: 300,
        status: 'pass' as const,
        description: 'Total disk throughput',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...diskThroughputMetrics)
  }

  // Analizar cola de disco
  private analyzeDiskQueue(): void {
    // Simular análisis de cola de disco
    const diskQueueMetrics = [
      {
        id: 'disk-queue-1',
        type: 'disk_queue' as const,
        name: 'Queue Length',
        value: 2,
        unit: 'requests',
        threshold: 5,
        status: 'pass' as const,
        description: 'Number of requests in queue',
        timestamp: new Date(),
      },
      {
        id: 'disk-queue-2',
        type: 'disk_queue' as const,
        name: 'Queue Wait Time',
        value: 1,
        unit: 'ms',
        threshold: 3,
        status: 'pass' as const,
        description: 'Average queue wait time',
        timestamp: new Date(),
      },
      {
        id: 'disk-queue-3',
        type: 'disk_queue' as const,
        name: 'Queue Utilization',
        value: 40,
        unit: '%',
        threshold: 80,
        status: 'pass' as const,
        description: 'Queue utilization percentage',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...diskQueueMetrics)
  }

  // Analizar fragmentación de disco
  private analyzeDiskFragmentation(): void {
    // Simular análisis de fragmentación de disco
    const diskFragmentationMetrics = [
      {
        id: 'disk-fragmentation-1',
        type: 'disk_fragmentation' as const,
        name: 'File Fragmentation',
        value: 15,
        unit: '%',
        threshold: 25,
        status: 'pass' as const,
        description: 'Percentage of fragmented files',
        timestamp: new Date(),
      },
      {
        id: 'disk-fragmentation-2',
        type: 'disk_fragmentation' as const,
        name: 'Free Space Fragmentation',
        value: 20,
        unit: '%',
        threshold: 30,
        status: 'pass' as const,
        description: 'Percentage of fragmented free space',
        timestamp: new Date(),
      },
      {
        id: 'disk-fragmentation-3',
        type: 'disk_fragmentation' as const,
        name: 'Average Fragment Size',
        value: 64,
        unit: 'KB',
        threshold: 32,
        status: 'pass' as const,
        description: 'Average fragment size',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...diskFragmentationMetrics)
  }

  // Detectar problemas de disco
  private detectDiskIssues(): void {
    // Simular detección de problemas de disco
    const diskIssues = [
      {
        id: 'disk-issue-1',
        type: 'disk_full' as const,
        message: 'Disk space running low',
        diskUsage: 90,
        diskLatency: 10,
        timestamp: new Date(),
        context: {
          freeSpace: 10,
          totalSpace: 100,
          growthRate: 5,
        },
      },
      {
        id: 'disk-issue-2',
        type: 'high_io_wait' as const,
        message: 'High I/O wait time detected',
        diskUsage: 80,
        diskLatency: 20,
        timestamp: new Date(),
        context: {
          ioWait: 25,
          threshold: 20,
          duration: 30,
        },
      },
      {
        id: 'disk-issue-3',
        type: 'disk_latency_spike' as const,
        message: 'Disk latency spike detected',
        diskUsage: 70,
        diskLatency: 50,
        timestamp: new Date(),
        context: {
          latency: 50,
          threshold: 20,
          duration: 10,
        },
      },
      {
        id: 'disk-issue-4',
        type: 'disk_failure' as const,
        message: 'Disk failure detected',
        diskUsage: 0,
        diskLatency: 0,
        timestamp: new Date(),
        context: {
          error: 'Sector read error',
          sector: 12345,
          attempts: 3,
        },
      },
      {
        id: 'disk-issue-5',
        type: 'disk_fragmentation' as const,
        message: 'High disk fragmentation',
        diskUsage: 75,
        diskLatency: 15,
        timestamp: new Date(),
        context: {
          fragmentation: 35,
          threshold: 25,
          files: 1000,
        },
      },
      {
        id: 'disk-issue-6',
        type: 'disk_queue_overflow' as const,
        message: 'Disk queue overflow',
        diskUsage: 85,
        diskLatency: 30,
        timestamp: new Date(),
        context: {
          queueLength: 10,
          threshold: 5,
          waitTime: 5,
        },
      },
    ]

    this.events.push(...diskIssues)
  }

  // Obtener eventos por tipo
  getEventsByType(type: DiskPerformanceEvent['type']): DiskPerformanceEvent[] {
    return this.events.filter(event => event.type === type)
  }

  // Obtener métricas por tipo
  getMetricsByType(type: DiskPerformanceMetric['type']): DiskPerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  // Obtener métricas por estado
  getMetricsByStatus(status: DiskPerformanceMetric['status']): DiskPerformanceMetric[] {
    return this.metrics.filter(metric => metric.status === status)
  }

  // Generar reporte de rendimiento de disco
  generateDiskPerformanceReport(): DiskPerformanceReport {
    const summary = {
      overallScore: this.calculateOverallScore(),
      totalDiskUsage: this.getTotalDiskUsage(),
      averageDiskLatency: this.getAverageDiskLatency(),
      diskThroughput: this.getAverageDiskThroughput(),
      diskQueueLength: this.getAverageDiskQueueLength(),
      diskFragmentation: this.getAverageDiskFragmentation(),
      diskIOPS: this.getAverageDiskIOPS(),
      diskErrors: this.events.filter(e => e.type === 'disk_failure').length,
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
      id: `disk_performance_report_${Date.now()}`,
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

  // Obtener uso total de disco
  private getTotalDiskUsage(): number {
    const diskUsageMetrics = this.metrics.filter(m => m.type === 'disk_usage')
    if (diskUsageMetrics.length === 0) return 0

    const total = diskUsageMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / diskUsageMetrics.length)
  }

  // Obtener latencia promedio de disco
  private getAverageDiskLatency(): number {
    const diskLatencyMetrics = this.metrics.filter(m => m.type === 'disk_latency')
    if (diskLatencyMetrics.length === 0) return 0

    const total = diskLatencyMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / diskLatencyMetrics.length * 100) / 100
  }

  // Obtener throughput promedio de disco
  private getAverageDiskThroughput(): number {
    const diskThroughputMetrics = this.metrics.filter(m => m.type === 'disk_throughput')
    if (diskThroughputMetrics.length === 0) return 0

    const total = diskThroughputMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / diskThroughputMetrics.length)
  }

  // Obtener longitud promedio de cola de disco
  private getAverageDiskQueueLength(): number {
    const diskQueueMetrics = this.metrics.filter(m => m.type === 'disk_queue')
    if (diskQueueMetrics.length === 0) return 0

    const total = diskQueueMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / diskQueueMetrics.length * 100) / 100
  }

  // Obtener fragmentación promedio de disco
  private getAverageDiskFragmentation(): number {
    const diskFragmentationMetrics = this.metrics.filter(m => m.type === 'disk_fragmentation')
    if (diskFragmentationMetrics.length === 0) return 0

    const total = diskFragmentationMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / diskFragmentationMetrics.length)
  }

  // Obtener IOPS promedio de disco
  private getAverageDiskIOPS(): number {
    const diskIOMetrics = this.metrics.filter(m => m.type === 'disk_io')
    if (diskIOMetrics.length === 0) return 0

    const total = diskIOMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / diskIOMetrics.length)
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const warningMetrics = this.metrics.filter(m => m.status === 'warning')
    if (warningMetrics.length > 0) {
      recommendations.push(`${warningMetrics.length} métricas de disco en advertencia`)
    }

    const failedMetrics = this.metrics.filter(m => m.status === 'fail')
    if (failedMetrics.length > 0) {
      recommendations.push(`${failedMetrics.length} métricas de disco fallaron`)
    }

    const diskFull = this.events.filter(e => e.type === 'disk_full')
    if (diskFull.length > 0) {
      recommendations.push(`${diskFull.length} casos de disco lleno detectados`)
    }

    const highIOWait = this.events.filter(e => e.type === 'high_io_wait')
    if (highIOWait.length > 0) {
      recommendations.push(`${highIOWait.length} casos de alto I/O wait detectados`)
    }

    const diskLatencySpikes = this.events.filter(e => e.type === 'disk_latency_spike')
    if (diskLatencySpikes.length > 0) {
      recommendations.push(`${diskLatencySpikes.length} picos de latencia de disco detectados`)
    }

    const diskFailures = this.events.filter(e => e.type === 'disk_failure')
    if (diskFailures.length > 0) {
      recommendations.push(`${diskFailures.length} fallos de disco detectados`)
    }

    const diskFragmentation = this.events.filter(e => e.type === 'disk_fragmentation')
    if (diskFragmentation.length > 0) {
      recommendations.push(`${diskFragmentation.length} problemas de fragmentación de disco detectados`)
    }

    const diskQueueOverflows = this.events.filter(e => e.type === 'disk_queue_overflow')
    if (diskQueueOverflows.length > 0) {
      recommendations.push(`${diskQueueOverflows.length} overflows de cola de disco detectados`)
    }

    return recommendations
  }

  // Obtener todos los eventos
  getAllEvents(): DiskPerformanceEvent[] {
    return [...this.events]
  }

  // Obtener todas las métricas
  getAllMetrics(): DiskPerformanceMetric[] {
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
      report: this.generateDiskPerformanceReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const diskPerformanceService = DiskPerformanceService.getInstance()

// Hook para usar el servicio de monitoreo de rendimiento de disco
export function useDiskPerformance() {
  const [events, setEvents] = useState<DiskPerformanceEvent[]>([])
  const [metrics, setMetrics] = useState<DiskPerformanceMetric[]>([])
  const [report, setReport] = useState<DiskPerformanceReport | null>(null)

  useEffect(() => {
    setEvents(diskPerformanceService.getAllEvents())
    setMetrics(diskPerformanceService.getAllMetrics())
    setReport(diskPerformanceService.generateDiskPerformanceReport())
  }, [])

  const getEventsByType = useCallback((type: DiskPerformanceEvent['type']) => {
    return diskPerformanceService.getEventsByType(type)
  }, [])

  const getMetricsByType = useCallback((type: DiskPerformanceMetric['type']) => {
    return diskPerformanceService.getMetricsByType(type)
  }, [])

  const getMetricsByStatus = useCallback((status: DiskPerformanceMetric['status']) => {
    return diskPerformanceService.getMetricsByStatus(status)
  }, [])

  const generateDiskPerformanceReport = useCallback(() => {
    const newReport = diskPerformanceService.generateDiskPerformanceReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    diskPerformanceService.clearData()
    setEvents([])
    setMetrics([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return diskPerformanceService.exportData()
  }, [])

  return {
    events,
    metrics,
    report,
    getEventsByType,
    getMetricsByType,
    getMetricsByStatus,
    generateDiskPerformanceReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de monitoreo de rendimiento de disco
interface DiskPerformanceDashboardProps {
  className?: string
}

export const DiskPerformanceDashboard: React.FC<DiskPerformanceDashboardProps> = ({ className = '' }) => {
  const { events, metrics, report, generateDiskPerformanceReport, clearData, exportData } = useDiskPerformance()

  const getTypeColor = (type: DiskPerformanceEvent['type']) => {
    switch (type) {
      case 'disk_full': return 'text-red-600 bg-red-100'
      case 'high_io_wait': return 'text-yellow-600 bg-yellow-100'
      case 'disk_latency_spike': return 'text-orange-600 bg-orange-100'
      case 'disk_failure': return 'text-red-600 bg-red-100'
      case 'disk_fragmentation': return 'text-blue-600 bg-blue-100'
      case 'disk_queue_overflow': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: DiskPerformanceMetric['status']) => {
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
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Rendimiento de Disco</h2>
        <div className="space-x-2">
          <button
            onClick={generateDiskPerformanceReport}
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
              a.download = 'disk-performance-data.json'
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Rendimiento de Disco</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación General</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.overallScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Uso de Disco</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.totalDiskUsage}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Latencia</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.averageDiskLatency}ms</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Throughput</h4>
              <p className="text-2xl font-bold text-orange-600">{report.summary.diskThroughput}MB/s</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Eventos de Disco Recientes</h3>
          <div className="space-y-2">
            {events.slice(-5).map(event => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{event.message}</h4>
                    <p className="text-xs text-gray-600">Uso: {event.diskUsage}% / Latencia: {event.diskLatency}ms</p>
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de Disco</h3>
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
