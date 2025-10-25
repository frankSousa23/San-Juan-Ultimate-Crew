import React, { useState, useEffect, useCallback } from 'react'

// Servicio de monitoreo de rendimiento de memoria
export interface MemoryPerformanceMetric {
  id: string
  type: 'heap_usage' | 'memory_leak' | 'garbage_collection' | 'memory_fragmentation' | 'cache_memory' | 'buffer_memory'
  name: string
  value: number
  unit: string
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  timestamp: Date
}

export interface MemoryPerformanceEvent {
  id: string
  type: 'memory_leak' | 'garbage_collection' | 'memory_spike' | 'cache_overflow' | 'buffer_overflow' | 'memory_fragmentation'
  message: string
  memoryUsage: number
  memoryLimit: number
  timestamp: Date
  context: Record<string, any>
}

export interface MemoryPerformanceReport {
  id: string
  timestamp: Date
  summary: {
    overallScore: number
    totalMemoryUsage: number
    memoryLeaks: number
    garbageCollections: number
    memoryFragmentation: number
    cacheHitRate: number
    bufferUsage: number
    heapUsage: number
  }
  metrics: MemoryPerformanceMetric[]
  events: MemoryPerformanceEvent[]
  recommendations: string[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

// Clase principal del servicio de monitoreo de rendimiento de memoria
export class MemoryPerformanceService {
  private static instance: MemoryPerformanceService
  private metrics: MemoryPerformanceMetric[] = []
  private events: MemoryPerformanceEvent[] = []
  private isInitialized = false

  private constructor() {
    this.initializeMemoryPerformanceMonitoring()
  }

  static getInstance(): MemoryPerformanceService {
    if (!MemoryPerformanceService.instance) {
      MemoryPerformanceService.instance = new MemoryPerformanceService()
    }
    return MemoryPerformanceService.instance
  }

  // Inicializar monitoreo de rendimiento de memoria
  private initializeMemoryPerformanceMonitoring(): void {
    this.analyzeHeapUsage()
    this.analyzeMemoryLeaks()
    this.analyzeGarbageCollection()
    this.analyzeMemoryFragmentation()
    this.analyzeCacheMemory()
    this.analyzeBufferMemory()
    this.detectMemoryIssues()

    this.isInitialized = true
  }

  // Analizar uso de heap
  private analyzeHeapUsage(): void {
    // Simular análisis de uso de heap
    const heapUsageMetrics = [
      {
        id: 'heap-usage-1',
        type: 'heap_usage' as const,
        name: 'Heap Used',
        value: 75,
        unit: '%',
        threshold: 80,
        status: 'pass' as const,
        description: 'Percentage of heap memory used',
        timestamp: new Date(),
      },
      {
        id: 'heap-usage-2',
        type: 'heap_usage' as const,
        name: 'Heap Size',
        value: 512,
        unit: 'MB',
        threshold: 1024,
        status: 'pass' as const,
        description: 'Total heap size',
        timestamp: new Date(),
      },
      {
        id: 'heap-usage-3',
        type: 'heap_usage' as const,
        name: 'Heap Growth Rate',
        value: 5,
        unit: '%/min',
        threshold: 10,
        status: 'pass' as const,
        description: 'Rate of heap growth',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...heapUsageMetrics)
  }

  // Analizar memory leaks
  private analyzeMemoryLeaks(): void {
    // Simular análisis de memory leaks
    const memoryLeakMetrics = [
      {
        id: 'memory-leak-1',
        type: 'memory_leak' as const,
        name: 'Memory Leak Rate',
        value: 2,
        unit: 'MB/h',
        threshold: 5,
        status: 'pass' as const,
        description: 'Rate of memory leak',
        timestamp: new Date(),
      },
      {
        id: 'memory-leak-2',
        type: 'memory_leak' as const,
        name: 'Unreachable Objects',
        value: 100,
        unit: 'count',
        threshold: 200,
        status: 'pass' as const,
        description: 'Number of unreachable objects',
        timestamp: new Date(),
      },
      {
        id: 'memory-leak-3',
        type: 'memory_leak' as const,
        name: 'Memory Retention',
        value: 85,
        unit: '%',
        threshold: 90,
        status: 'pass' as const,
        description: 'Percentage of memory retained',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...memoryLeakMetrics)
  }

  // Analizar garbage collection
  private analyzeGarbageCollection(): void {
    // Simular análisis de garbage collection
    const garbageCollectionMetrics = [
      {
        id: 'gc-1',
        type: 'garbage_collection' as const,
        name: 'GC Frequency',
        value: 10,
        unit: 'times/min',
        threshold: 15,
        status: 'pass' as const,
        description: 'Garbage collection frequency',
        timestamp: new Date(),
      },
      {
        id: 'gc-2',
        type: 'garbage_collection' as const,
        name: 'GC Duration',
        value: 25,
        unit: 'ms',
        threshold: 50,
        status: 'pass' as const,
        description: 'Average garbage collection duration',
        timestamp: new Date(),
      },
      {
        id: 'gc-3',
        type: 'garbage_collection' as const,
        name: 'GC Efficiency',
        value: 80,
        unit: '%',
        threshold: 75,
        status: 'pass' as const,
        description: 'Garbage collection efficiency',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...garbageCollectionMetrics)
  }

  // Analizar fragmentación de memoria
  private analyzeMemoryFragmentation(): void {
    // Simular análisis de fragmentación de memoria
    const memoryFragmentationMetrics = [
      {
        id: 'fragmentation-1',
        type: 'memory_fragmentation' as const,
        name: 'Memory Fragmentation',
        value: 15,
        unit: '%',
        threshold: 20,
        status: 'pass' as const,
        description: 'Percentage of fragmented memory',
        timestamp: new Date(),
      },
      {
        id: 'fragmentation-2',
        type: 'memory_fragmentation' as const,
        name: 'Free Memory Blocks',
        value: 50,
        unit: 'count',
        threshold: 100,
        status: 'pass' as const,
        description: 'Number of free memory blocks',
        timestamp: new Date(),
      },
      {
        id: 'fragmentation-3',
        type: 'memory_fragmentation' as const,
        name: 'Largest Free Block',
        value: 64,
        unit: 'MB',
        threshold: 32,
        status: 'pass' as const,
        description: 'Size of largest free memory block',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...memoryFragmentationMetrics)
  }

  // Analizar memoria de cache
  private analyzeCacheMemory(): void {
    // Simular análisis de memoria de cache
    const cacheMemoryMetrics = [
      {
        id: 'cache-memory-1',
        type: 'cache_memory' as const,
        name: 'Cache Memory Usage',
        value: 60,
        unit: '%',
        threshold: 80,
        status: 'pass' as const,
        description: 'Percentage of cache memory used',
        timestamp: new Date(),
      },
      {
        id: 'cache-memory-2',
        type: 'cache_memory' as const,
        name: 'Cache Hit Rate',
        value: 85,
        unit: '%',
        threshold: 80,
        status: 'pass' as const,
        description: 'Cache hit rate',
        timestamp: new Date(),
      },
      {
        id: 'cache-memory-3',
        type: 'cache_memory' as const,
        name: 'Cache Eviction Rate',
        value: 5,
        unit: '%',
        threshold: 10,
        status: 'pass' as const,
        description: 'Rate of cache evictions',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...cacheMemoryMetrics)
  }

  // Analizar memoria de buffer
  private analyzeBufferMemory(): void {
    // Simular análisis de memoria de buffer
    const bufferMemoryMetrics = [
      {
        id: 'buffer-memory-1',
        type: 'buffer_memory' as const,
        name: 'Buffer Memory Usage',
        value: 40,
        unit: '%',
        threshold: 70,
        status: 'pass' as const,
        description: 'Percentage of buffer memory used',
        timestamp: new Date(),
      },
      {
        id: 'buffer-memory-2',
        type: 'buffer_memory' as const,
        name: 'Buffer Overflow Rate',
        value: 1,
        unit: '%',
        threshold: 2,
        status: 'pass' as const,
        description: 'Rate of buffer overflows',
        timestamp: new Date(),
      },
      {
        id: 'buffer-memory-3',
        type: 'buffer_memory' as const,
        name: 'Buffer Allocation Rate',
        value: 20,
        unit: 'MB/s',
        threshold: 50,
        status: 'pass' as const,
        description: 'Rate of buffer allocations',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...bufferMemoryMetrics)
  }

  // Detectar problemas de memoria
  private detectMemoryIssues(): void {
    // Simular detección de problemas de memoria
    const memoryIssues = [
      {
        id: 'memory-issue-1',
        type: 'memory_leak' as const,
        message: 'Potential memory leak detected',
        memoryUsage: 85,
        memoryLimit: 100,
        timestamp: new Date(),
        context: {
          leakRate: 3,
          duration: 30,
          objects: 150,
        },
      },
      {
        id: 'memory-issue-2',
        type: 'garbage_collection' as const,
        message: 'Frequent garbage collection',
        memoryUsage: 70,
        memoryLimit: 100,
        timestamp: new Date(),
        context: {
          frequency: 20,
          duration: 40,
          efficiency: 60,
        },
      },
      {
        id: 'memory-issue-3',
        type: 'memory_spike' as const,
        message: 'Memory usage spike detected',
        memoryUsage: 95,
        memoryLimit: 100,
        timestamp: new Date(),
        context: {
          spike: 25,
          duration: 5,
          cause: 'Large data processing',
        },
      },
      {
        id: 'memory-issue-4',
        type: 'cache_overflow' as const,
        message: 'Cache memory overflow',
        memoryUsage: 90,
        memoryLimit: 100,
        timestamp: new Date(),
        context: {
          cacheSize: 200,
          maxCacheSize: 150,
          evictions: 50,
        },
      },
      {
        id: 'memory-issue-5',
        type: 'buffer_overflow' as const,
        message: 'Buffer overflow detected',
        memoryUsage: 80,
        memoryLimit: 100,
        timestamp: new Date(),
        context: {
          bufferSize: 10,
          maxBufferSize: 8,
          overflow: 2,
        },
      },
      {
        id: 'memory-issue-6',
        type: 'memory_fragmentation' as const,
        message: 'High memory fragmentation',
        memoryUsage: 75,
        memoryLimit: 100,
        timestamp: new Date(),
        context: {
          fragmentation: 30,
          freeBlocks: 200,
          largestBlock: 16,
        },
      },
    ]

    this.events.push(...memoryIssues)
  }

  // Obtener eventos por tipo
  getEventsByType(type: MemoryPerformanceEvent['type']): MemoryPerformanceEvent[] {
    return this.events.filter(event => event.type === type)
  }

  // Obtener métricas por tipo
  getMetricsByType(type: MemoryPerformanceMetric['type']): MemoryPerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  // Obtener métricas por estado
  getMetricsByStatus(status: MemoryPerformanceMetric['status']): MemoryPerformanceMetric[] {
    return this.metrics.filter(metric => metric.status === status)
  }

  // Generar reporte de rendimiento de memoria
  generateMemoryPerformanceReport(): MemoryPerformanceReport {
    const summary = {
      overallScore: this.calculateOverallScore(),
      totalMemoryUsage: this.getTotalMemoryUsage(),
      memoryLeaks: this.events.filter(e => e.type === 'memory_leak').length,
      garbageCollections: this.events.filter(e => e.type === 'garbage_collection').length,
      memoryFragmentation: this.getAverageMemoryFragmentation(),
      cacheHitRate: this.getAverageCacheHitRate(),
      bufferUsage: this.getAverageBufferUsage(),
      heapUsage: this.getAverageHeapUsage(),
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
      id: `memory_performance_report_${Date.now()}`,
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

  // Obtener uso total de memoria
  private getTotalMemoryUsage(): number {
    const memoryUsageEvents = this.events.filter(e => e.type === 'memory_spike')
    if (memoryUsageEvents.length === 0) return 0

    const total = memoryUsageEvents.reduce((sum, event) => sum + event.memoryUsage, 0)
    return Math.round(total / memoryUsageEvents.length)
  }

  // Obtener fragmentación de memoria promedio
  private getAverageMemoryFragmentation(): number {
    const fragmentationMetrics = this.metrics.filter(m => m.type === 'memory_fragmentation')
    if (fragmentationMetrics.length === 0) return 0

    const total = fragmentationMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / fragmentationMetrics.length)
  }

  // Obtener tasa de acierto de cache promedio
  private getAverageCacheHitRate(): number {
    const cacheHitRateMetrics = this.metrics.filter(m => m.type === 'cache_memory')
    if (cacheHitRateMetrics.length === 0) return 0

    const total = cacheHitRateMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / cacheHitRateMetrics.length)
  }

  // Obtener uso de buffer promedio
  private getAverageBufferUsage(): number {
    const bufferUsageMetrics = this.metrics.filter(m => m.type === 'buffer_memory')
    if (bufferUsageMetrics.length === 0) return 0

    const total = bufferUsageMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / bufferUsageMetrics.length)
  }

  // Obtener uso de heap promedio
  private getAverageHeapUsage(): number {
    const heapUsageMetrics = this.metrics.filter(m => m.type === 'heap_usage')
    if (heapUsageMetrics.length === 0) return 0

    const total = heapUsageMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / heapUsageMetrics.length)
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const warningMetrics = this.metrics.filter(m => m.status === 'warning')
    if (warningMetrics.length > 0) {
      recommendations.push(`${warningMetrics.length} métricas de memoria en advertencia`)
    }

    const failedMetrics = this.metrics.filter(m => m.status === 'fail')
    if (failedMetrics.length > 0) {
      recommendations.push(`${failedMetrics.length} métricas de memoria fallaron`)
    }

    const memoryLeaks = this.events.filter(e => e.type === 'memory_leak')
    if (memoryLeaks.length > 0) {
      recommendations.push(`${memoryLeaks.length} memory leaks detectados`)
    }

    const garbageCollections = this.events.filter(e => e.type === 'garbage_collection')
    if (garbageCollections.length > 0) {
      recommendations.push(`${garbageCollections.length} problemas de garbage collection detectados`)
    }

    const memorySpikes = this.events.filter(e => e.type === 'memory_spike')
    if (memorySpikes.length > 0) {
      recommendations.push(`${memorySpikes.length} picos de memoria detectados`)
    }

    const cacheOverflows = this.events.filter(e => e.type === 'cache_overflow')
    if (cacheOverflows.length > 0) {
      recommendations.push(`${cacheOverflows.length} overflows de cache detectados`)
    }

    const bufferOverflows = this.events.filter(e => e.type === 'buffer_overflow')
    if (bufferOverflows.length > 0) {
      recommendations.push(`${bufferOverflows.length} overflows de buffer detectados`)
    }

    const memoryFragmentation = this.events.filter(e => e.type === 'memory_fragmentation')
    if (memoryFragmentation.length > 0) {
      recommendations.push(`${memoryFragmentation.length} problemas de fragmentación de memoria detectados`)
    }

    return recommendations
  }

  // Obtener todos los eventos
  getAllEvents(): MemoryPerformanceEvent[] {
    return [...this.events]
  }

  // Obtener todas las métricas
  getAllMetrics(): MemoryPerformanceMetric[] {
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
      report: this.generateMemoryPerformanceReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const memoryPerformanceService = MemoryPerformanceService.getInstance()

// Hook para usar el servicio de monitoreo de rendimiento de memoria
export function useMemoryPerformance() {
  const [events, setEvents] = useState<MemoryPerformanceEvent[]>([])
  const [metrics, setMetrics] = useState<MemoryPerformanceMetric[]>([])
  const [report, setReport] = useState<MemoryPerformanceReport | null>(null)

  useEffect(() => {
    setEvents(memoryPerformanceService.getAllEvents())
    setMetrics(memoryPerformanceService.getAllMetrics())
    setReport(memoryPerformanceService.generateMemoryPerformanceReport())
  }, [])

  const getEventsByType = useCallback((type: MemoryPerformanceEvent['type']) => {
    return memoryPerformanceService.getEventsByType(type)
  }, [])

  const getMetricsByType = useCallback((type: MemoryPerformanceMetric['type']) => {
    return memoryPerformanceService.getMetricsByType(type)
  }, [])

  const getMetricsByStatus = useCallback((status: MemoryPerformanceMetric['status']) => {
    return memoryPerformanceService.getMetricsByStatus(status)
  }, [])

  const generateMemoryPerformanceReport = useCallback(() => {
    const newReport = memoryPerformanceService.generateMemoryPerformanceReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    memoryPerformanceService.clearData()
    setEvents([])
    setMetrics([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return memoryPerformanceService.exportData()
  }, [])

  return {
    events,
    metrics,
    report,
    getEventsByType,
    getMetricsByType,
    getMetricsByStatus,
    generateMemoryPerformanceReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de monitoreo de rendimiento de memoria
interface MemoryPerformanceDashboardProps {
  className?: string
}

export const MemoryPerformanceDashboard: React.FC<MemoryPerformanceDashboardProps> = ({ className = '' }) => {
  const { events, metrics, report, generateMemoryPerformanceReport, clearData, exportData } = useMemoryPerformance()

  const getTypeColor = (type: MemoryPerformanceEvent['type']) => {
    switch (type) {
      case 'memory_leak': return 'text-red-600 bg-red-100'
      case 'garbage_collection': return 'text-yellow-600 bg-yellow-100'
      case 'memory_spike': return 'text-orange-600 bg-orange-100'
      case 'cache_overflow': return 'text-blue-600 bg-blue-100'
      case 'buffer_overflow': return 'text-purple-600 bg-purple-100'
      case 'memory_fragmentation': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: MemoryPerformanceMetric['status']) => {
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
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Rendimiento de Memoria</h2>
        <div className="space-x-2">
          <button
            onClick={generateMemoryPerformanceReport}
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
              a.download = 'memory-performance-data.json'
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Rendimiento de Memoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación General</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.overallScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Uso de Memoria</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.totalMemoryUsage}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Cache Hit Rate</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.cacheHitRate}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Uso de Heap</h4>
              <p className="text-2xl font-bold text-orange-600">{report.summary.heapUsage}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Eventos de Memoria Recientes</h3>
          <div className="space-y-2">
            {events.slice(-5).map(event => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{event.message}</h4>
                    <p className="text-xs text-gray-600">Uso: {event.memoryUsage}% / Límite: {event.memoryLimit}%</p>
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de Memoria</h3>
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
