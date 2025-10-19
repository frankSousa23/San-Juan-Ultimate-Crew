import { PerformanceMonitor } from '../utils/performance'

// Servicio de métricas de rendimiento
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  cacheHitRate: number
  apiResponseTime: number
  bundleSize: number
  componentRenderCount: number
}

export interface PerformanceReport {
  timestamp: Date
  metrics: PerformanceMetrics
  recommendations: string[]
  score: number
}

// Clase principal del servicio de rendimiento
export class PerformanceService {
  private static instance: PerformanceService
  private metrics: PerformanceMetrics
  private reports: PerformanceReport[] = []
  private observers: ((report: PerformanceReport) => void)[] = []

  private constructor() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      apiResponseTime: 0,
      bundleSize: 0,
      componentRenderCount: 0,
    }
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService()
    }
    return PerformanceService.instance
  }

  // Medir tiempo de carga
  measureLoadTime(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.metrics.loadTime = performance.now()
        this.generateReport()
      })
    }
  }

  // Medir tiempo de renderizado
  measureRenderTime(componentName: string, renderTime: number): void {
    this.metrics.renderTime = renderTime
    this.metrics.componentRenderCount++
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered in ${renderTime}ms`)
    }
  }

  // Medir uso de memoria
  measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
    }
  }

  // Medir tiempo de respuesta de API
  measureApiResponseTime(responseTime: number): void {
    this.metrics.apiResponseTime = responseTime
  }

  // Medir tamaño del bundle
  measureBundleSize(): void {
    if (typeof window !== 'undefined') {
      const scripts = document.querySelectorAll('script[src]')
      let totalSize = 0
      
      scripts.forEach(script => {
        const src = script.getAttribute('src')
        if (src && src.includes('assets')) {
          // Simular cálculo de tamaño (en producción se usaría una API real)
          totalSize += 100 // KB por script
        }
      })
      
      this.metrics.bundleSize = totalSize
    }
  }

  // Generar reporte de rendimiento
  generateReport(): PerformanceReport {
    const recommendations: string[] = []
    let score = 100

    // Evaluar métricas y generar recomendaciones
    if (this.metrics.loadTime > 3000) {
      recommendations.push('Tiempo de carga lento. Considera optimizar el bundle.')
      score -= 20
    }

    if (this.metrics.renderTime > 100) {
      recommendations.push('Tiempo de renderizado alto. Considera memoización.')
      score -= 15
    }

    if (this.metrics.memoryUsage > 50) {
      recommendations.push('Uso de memoria alto. Considera lazy loading.')
      score -= 10
    }

    if (this.metrics.cacheHitRate < 0.8) {
      recommendations.push('Cache hit rate bajo. Considera optimizar el cache.')
      score -= 10
    }

    if (this.metrics.apiResponseTime > 1000) {
      recommendations.push('Tiempo de respuesta de API lento.')
      score -= 15
    }

    if (this.metrics.bundleSize > 500) {
      recommendations.push('Bundle size grande. Considera code splitting.')
      score -= 10
    }

    const report: PerformanceReport = {
      timestamp: new Date(),
      metrics: { ...this.metrics },
      recommendations,
      score: Math.max(0, score),
    }

    this.reports.push(report)
    this.notifyObservers(report)

    return report
  }

  // Obtener métricas actuales
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Obtener reportes
  getReports(): PerformanceReport[] {
    return [...this.reports]
  }

  // Obtener último reporte
  getLatestReport(): PerformanceReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null
  }

  // Suscribirse a reportes
  subscribe(callback: (report: PerformanceReport) => void): () => void {
    this.observers.push(callback)
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  // Notificar observadores
  private notifyObservers(report: PerformanceReport): void {
    this.observers.forEach(callback => callback(report))
  }

  // Limpiar reportes antiguos
  cleanup(maxReports: number = 100): void {
    if (this.reports.length > maxReports) {
      this.reports = this.reports.slice(-maxReports)
    }
  }

  // Exportar reportes
  exportReports(): string {
    return JSON.stringify(this.reports, null, 2)
  }

  // Importar reportes
  importReports(data: string): void {
    try {
      const reports = JSON.parse(data)
      this.reports = reports
    } catch (error) {
      console.error('Error importing reports:', error)
    }
  }
}

// Instancia global del servicio
export const performanceService = PerformanceService.getInstance()

// Hook para usar el servicio de rendimiento
export function usePerformanceService() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceService.getMetrics())
  const [latestReport, setLatestReport] = useState<PerformanceReport | null>(null)

  useEffect(() => {
    const unsubscribe = performanceService.subscribe((report) => {
      setMetrics(report.metrics)
      setLatestReport(report)
    })

    return unsubscribe
  }, [])

  const measureRenderTime = useCallback((componentName: string, renderTime: number) => {
    performanceService.measureRenderTime(componentName, renderTime)
  }, [])

  const measureApiResponseTime = useCallback((responseTime: number) => {
    performanceService.measureApiResponseTime(responseTime)
  }, [])

  const generateReport = useCallback(() => {
    return performanceService.generateReport()
  }, [])

  const getReports = useCallback(() => {
    return performanceService.getReports()
  }, [])

  const exportReports = useCallback(() => {
    return performanceService.exportReports()
  }, [])

  return {
    metrics,
    latestReport,
    measureRenderTime,
    measureApiResponseTime,
    generateReport,
    getReports,
    exportReports,
  }
}

// Componente de dashboard de rendimiento
interface PerformanceDashboardProps {
  className?: string
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ className = '' }) => {
  const { metrics, latestReport, generateReport } = usePerformanceService()

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Rendimiento</h2>
        <button
          onClick={generateReport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Generar Reporte
        </button>
      </div>

      {latestReport && (
        <div className="mb-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(latestReport.score)} ${getScoreColor(latestReport.score)}`}>
            Score: {latestReport.score}/100
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Tiempo de Carga</h3>
          <p className="text-2xl font-bold text-gray-800">{metrics.loadTime.toFixed(0)}ms</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Tiempo de Renderizado</h3>
          <p className="text-2xl font-bold text-gray-800">{metrics.renderTime.toFixed(0)}ms</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Uso de Memoria</h3>
          <p className="text-2xl font-bold text-gray-800">{metrics.memoryUsage.toFixed(1)}MB</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Cache Hit Rate</h3>
          <p className="text-2xl font-bold text-gray-800">{(metrics.cacheHitRate * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">API Response Time</h3>
          <p className="text-2xl font-bold text-gray-800">{metrics.apiResponseTime.toFixed(0)}ms</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Bundle Size</h3>
          <p className="text-2xl font-bold text-gray-800">{metrics.bundleSize.toFixed(0)}KB</p>
        </div>
      </div>

      {latestReport && latestReport.recommendations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recomendaciones</h3>
          <ul className="space-y-2">
            {latestReport.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">⚠️</span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
