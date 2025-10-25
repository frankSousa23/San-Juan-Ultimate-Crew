import React, { useState, useEffect, useCallback } from 'react'

// Servicio de optimización de memoria
export interface MemoryOptimizationOptions {
  enableGarbageCollection?: boolean
  enableMemoryMonitoring?: boolean
  maxMemoryUsage?: number
  enableLeakDetection?: boolean
  enableCompression?: boolean
  enableCaching?: boolean
}

export interface MemoryMetrics {
  used: number
  total: number
  limit: number
  usage: number
  timestamp: Date
}

export interface MemoryReport {
  timestamp: Date
  metrics: MemoryMetrics
  recommendations: string[]
  score: number
  leaks: string[]
}

// Clase para optimización de memoria
export class MemoryOptimizationService {
  private static instance: MemoryOptimizationService
  private options: Required<MemoryOptimizationOptions>
  private metrics: MemoryMetrics[] = []
  private observers: ((report: MemoryReport) => void)[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private leakDetectionInterval: NodeJS.Timeout | null = null

  constructor(options: MemoryOptimizationOptions = {}) {
    this.options = {
      enableGarbageCollection: options.enableGarbageCollection || true,
      enableMemoryMonitoring: options.enableMemoryMonitoring || true,
      maxMemoryUsage: options.maxMemoryUsage || 100, // MB
      enableLeakDetection: options.enableLeakDetection || true,
      enableCompression: options.enableCompression || true,
      enableCaching: options.enableCaching || true,
    }
  }

  static getInstance(options?: MemoryOptimizationOptions): MemoryOptimizationService {
    if (!MemoryOptimizationService.instance) {
      MemoryOptimizationService.instance = new MemoryOptimizationService(options)
    }
    return MemoryOptimizationService.instance
  }

  // Iniciar monitoreo de memoria
  startMonitoring(): void {
    if (!this.options.enableMemoryMonitoring) return

    this.monitoringInterval = setInterval(() => {
      this.collectMemoryMetrics()
    }, 5000) // Cada 5 segundos

    if (this.options.enableLeakDetection) {
      this.leakDetectionInterval = setInterval(() => {
        this.detectMemoryLeaks()
      }, 30000) // Cada 30 segundos
    }
  }

  // Detener monitoreo de memoria
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval)
      this.leakDetectionInterval = null
    }
  }

  // Recopilar métricas de memoria
  collectMemoryMetrics(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) return

    const memory = (performance as any).memory
    const metrics: MemoryMetrics = {
      used: memory.usedJSHeapSize / 1024 / 1024, // MB
      total: memory.totalJSHeapSize / 1024 / 1024, // MB
      limit: memory.jsHeapSizeLimit / 1024 / 1024, // MB
      usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100, // %
      timestamp: new Date(),
    }

    this.metrics.push(metrics)

    // Limitar tamaño del historial
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }

    // Generar reporte si es necesario
    if (this.metrics.length % 10 === 0) {
      this.generateMemoryReport()
    }
  }

  // Detectar memory leaks
  detectMemoryLeaks(): void {
    if (this.metrics.length < 10) return

    const recent = this.metrics.slice(-10)
    const trend = this.calculateTrend(recent.map(m => m.used))

    if (trend > 0.1) { // 10% de crecimiento
      console.warn('Potential memory leak detected:', {
        trend: `${(trend * 100).toFixed(2)}%`,
        currentUsage: recent[recent.length - 1].used,
      })
    }
  }

  // Calcular tendencia
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    const first = values[0]
    const last = values[values.length - 1]
    return (last - first) / first
  }

  // Generar reporte de memoria
  generateMemoryReport(): MemoryReport {
    const latest = this.metrics[this.metrics.length - 1]
    if (!latest) {
      throw new Error('No memory metrics available')
    }

    const recommendations: string[] = []
    const leaks: string[] = []
    let score = 100

    // Evaluar uso de memoria
    if (latest.usage > 80) {
      recommendations.push('Uso de memoria alto. Considera limpiar referencias no utilizadas.')
      score -= 20
    }

    if (latest.usage > 90) {
      recommendations.push('Uso de memoria crítico. Considera garbage collection forzado.')
      score -= 30
    }

    // Evaluar tendencia
    if (this.metrics.length >= 10) {
      const trend = this.calculateTrend(this.metrics.slice(-10).map(m => m.used))
      if (trend > 0.1) {
        recommendations.push('Tendencia de crecimiento de memoria detectada.')
        leaks.push('Potential memory leak')
        score -= 25
      }
    }

    // Evaluar fragmentación
    const fragmentation = (latest.total - latest.used) / latest.total
    if (fragmentation > 0.5) {
      recommendations.push('Alta fragmentación de memoria detectada.')
      score -= 15
    }

    const report: MemoryReport = {
      timestamp: new Date(),
      metrics: latest,
      recommendations,
      score: Math.max(0, score),
      leaks,
    }

    this.notifyObservers(report)
    return report
  }

  // Forzar garbage collection
  forceGarbageCollection(): void {
    if (!this.options.enableGarbageCollection) return

    if ('gc' in window) {
      (window as any).gc()
    } else {
      // Fallback: crear y destruir objetos grandes
      const largeArray = new Array(1000000).fill(0)
      largeArray.length = 0
    }
  }

  // Limpiar referencias
  cleanupReferences(refs: React.RefObject<any>[]): void {
    refs.forEach(ref => {
      if (ref.current) {
        ref.current = null
      }
    })
  }

  // Comprimir datos
  compressData(data: any): string {
    if (!this.options.enableCompression) return JSON.stringify(data)

    // Simular compresión (en producción se usaría una librería real)
    const json = JSON.stringify(data)
    return btoa(json) // Base64 encoding como ejemplo
  }

  // Descomprimir datos
  decompressData(compressed: string): any {
    if (!this.options.enableCompression) return JSON.parse(compressed)

    try {
      const json = atob(compressed) // Base64 decoding
      return JSON.parse(json)
    } catch (error) {
      console.error('Error decompressing data:', error)
      return null
    }
  }

  // Obtener métricas actuales
  getCurrentMetrics(): MemoryMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  // Obtener historial de métricas
  getMetricsHistory(): MemoryMetrics[] {
    return [...this.metrics]
  }

  // Suscribirse a reportes
  subscribe(callback: (report: MemoryReport) => void): () => void {
    this.observers.push(callback)
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  // Notificar observadores
  private notifyObservers(report: MemoryReport): void {
    this.observers.forEach(callback => callback(report))
  }

  // Limpiar métricas
  clearMetrics(): void {
    this.metrics = []
  }

  // Exportar métricas
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2)
  }

  // Importar métricas
  importMetrics(data: string): void {
    try {
      this.metrics = JSON.parse(data)
    } catch (error) {
      console.error('Error importing metrics:', error)
    }
  }
}

// Instancia global del servicio
export const memoryOptimization = MemoryOptimizationService.getInstance()

// Hook para usar optimización de memoria
export function useMemoryOptimization() {
  const [metrics, setMetrics] = useState<MemoryMetrics | null>(null)
  const [report, setReport] = useState<MemoryReport | null>(null)

  useEffect(() => {
    const unsubscribe = memoryOptimization.subscribe((newReport) => {
      setMetrics(newReport.metrics)
      setReport(newReport)
    })

    // Iniciar monitoreo
    memoryOptimization.startMonitoring()

    return () => {
      unsubscribe()
      memoryOptimization.stopMonitoring()
    }
  }, [])

  const forceGarbageCollection = useCallback(() => {
    memoryOptimization.forceGarbageCollection()
  }, [])

  const cleanupReferences = useCallback((refs: React.RefObject<any>[]) => {
    memoryOptimization.cleanupReferences(refs)
  }, [])

  const compressData = useCallback((data: any) => {
    return memoryOptimization.compressData(data)
  }, [])

  const decompressData = useCallback((compressed: string) => {
    return memoryOptimization.decompressData(compressed)
  }, [])

  const generateReport = useCallback(() => {
    return memoryOptimization.generateMemoryReport()
  }, [])

  const clearMetrics = useCallback(() => {
    memoryOptimization.clearMetrics()
  }, [])

  return {
    metrics,
    report,
    forceGarbageCollection,
    cleanupReferences,
    compressData,
    decompressData,
    generateReport,
    clearMetrics,
  }
}

// Hook para limpieza automática de memoria
export function useMemoryCleanup() {
  const { forceGarbageCollection, cleanupReferences } = useMemoryOptimization()

  useEffect(() => {
    const interval = setInterval(() => {
      forceGarbageCollection()
    }, 60000) // Cada minuto

    return () => clearInterval(interval)
  }, [forceGarbageCollection])

  const cleanup = useCallback((refs: React.RefObject<any>[]) => {
    cleanupReferences(refs)
    forceGarbageCollection()
  }, [cleanupReferences, forceGarbageCollection])

  return { cleanup }
}

// Componente de dashboard de memoria
interface MemoryDashboardProps {
  className?: string
}

export const MemoryDashboard: React.FC<MemoryDashboardProps> = ({ className = '' }) => {
  const { metrics, report, forceGarbageCollection, generateReport } = useMemoryOptimization()

  const getUsageColor = (usage: number) => {
    if (usage < 50) return 'text-green-600'
    if (usage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getUsageBg = (usage: number) => {
    if (usage < 50) return 'bg-green-100'
    if (usage < 80) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Memoria</h2>
        <div className="space-x-2">
          <button
            onClick={forceGarbageCollection}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Forzar GC
          </button>
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Generar Reporte
          </button>
        </div>
      </div>

      {metrics && (
        <div className="mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUsageBg(metrics.usage)} ${getUsageColor(metrics.usage)}`}>
            Uso: {metrics.usage.toFixed(1)}%
          </div>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Memoria Usada</h3>
            <p className="text-2xl font-bold text-gray-800">{metrics.used.toFixed(1)} MB</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Memoria Total</h3>
            <p className="text-2xl font-bold text-gray-800">{metrics.total.toFixed(1)} MB</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Límite</h3>
            <p className="text-2xl font-bold text-gray-800">{metrics.limit.toFixed(1)} MB</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Uso</h3>
            <p className={`text-2xl font-bold ${getUsageColor(metrics.usage)}`}>
              {metrics.usage.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {report && report.recommendations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recomendaciones</h3>
          <ul className="space-y-2">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">⚠️</span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report && report.leaks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-red-800 mb-3">Memory Leaks Detectados</h3>
          <ul className="space-y-2">
            {report.leaks.map((leak, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">🚨</span>
                <span className="text-red-700">{leak}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
