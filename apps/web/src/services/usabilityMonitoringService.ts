// Servicio de monitoreo de usabilidad
export interface UsabilityEvent {
  id: string
  type: 'click' | 'scroll' | 'hover' | 'focus' | 'input' | 'navigation' | 'error' | 'success'
  element: string
  selector: string
  value?: string
  timestamp: Date
  userId?: string
  sessionId: string
  page: string
  context: Record<string, any>
}

export interface UsabilityMetric {
  id: string
  type: 'task_completion' | 'time_on_task' | 'error_rate' | 'click_through_rate' | 'bounce_rate' | 'conversion_rate'
  name: string
  value: number
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  timestamp: Date
}

export interface UsabilityReport {
  id: string
  timestamp: Date
  summary: {
    overallScore: number
    totalEvents: number
    taskCompletionRate: number
    averageTimeOnTask: number
    errorRate: number
    clickThroughRate: number
    bounceRate: number
    conversionRate: number
  }
  events: UsabilityEvent[]
  metrics: UsabilityMetric[]
  recommendations: string[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

// Clase principal del servicio de monitoreo de usabilidad
export class UsabilityMonitoringService {
  private static instance: UsabilityMonitoringService
  private events: UsabilityEvent[] = []
  private metrics: UsabilityMetric[] = []
  private isInitialized = false
  private sessionId: string
  private userId?: string

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.userId = this.getUserId()
    this.initializeUsabilityMonitoring()
  }

  static getInstance(): UsabilityMonitoringService {
    if (!UsabilityMonitoringService.instance) {
      UsabilityMonitoringService.instance = new UsabilityMonitoringService()
    }
    return UsabilityMonitoringService.instance
  }

  // Inicializar monitoreo de usabilidad
  private initializeUsabilityMonitoring(): void {
    if (typeof window === 'undefined') return

    this.setupEventListeners()
    this.analyzeTaskCompletion()
    this.analyzeTimeOnTask()
    this.analyzeErrorRate()
    this.analyzeClickThroughRate()
    this.analyzeBounceRate()
    this.analyzeConversionRate()

    this.isInitialized = true
  }

  // Configurar listeners de eventos
  private setupEventListeners(): void {
    // Click tracking
    document.addEventListener('click', (event) => {
      this.trackEvent({
        type: 'click',
        element: (event.target as Element).tagName,
        selector: this.getElementSelector(event.target as Element),
        timestamp: new Date(),
        page: window.location.pathname,
        context: {
          x: event.clientX,
          y: event.clientY,
          button: event.button,
        },
      })
    })

    // Scroll tracking
    let scrollTimeout: NodeJS.Timeout
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.trackEvent({
          type: 'scroll',
          element: 'window',
          selector: 'window',
          timestamp: new Date(),
          page: window.location.pathname,
          context: {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
          },
        })
      }, 100)
    })

    // Hover tracking
    document.addEventListener('mouseover', (event) => {
      this.trackEvent({
        type: 'hover',
        element: (event.target as Element).tagName,
        selector: this.getElementSelector(event.target as Element),
        timestamp: new Date(),
        page: window.location.pathname,
        context: {
          x: event.clientX,
          y: event.clientY,
        },
      })
    })

    // Focus tracking
    document.addEventListener('focusin', (event) => {
      this.trackEvent({
        type: 'focus',
        element: (event.target as Element).tagName,
        selector: this.getElementSelector(event.target as Element),
        timestamp: new Date(),
        page: window.location.pathname,
        context: {
          elementType: (event.target as Element).tagName,
        },
      })
    })

    // Input tracking
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement
      this.trackEvent({
        type: 'input',
        element: target.tagName,
        selector: this.getElementSelector(target),
        value: target.value.substring(0, 100), // Limitar longitud
        timestamp: new Date(),
        page: window.location.pathname,
        context: {
          inputType: target.type,
          fieldName: target.name,
        },
      })
    })

    // Navigation tracking
    window.addEventListener('popstate', () => {
      this.trackEvent({
        type: 'navigation',
        element: 'window',
        selector: 'window',
        timestamp: new Date(),
        page: window.location.pathname,
        context: {
          action: 'popstate',
        },
      })
    })

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackEvent({
        type: 'error',
        element: 'window',
        selector: 'window',
        timestamp: new Date(),
        page: window.location.pathname,
        context: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
        },
      })
    })
  }

  // Rastrear evento de usabilidad
  trackEvent(eventData: {
    type: UsabilityEvent['type']
    element: string
    selector: string
    value?: string
    timestamp: Date
    page: string
    context: Record<string, any>
  }): void {
    const event: UsabilityEvent = {
      id: this.generateEventId(),
      type: eventData.type,
      element: eventData.element,
      selector: eventData.selector,
      value: eventData.value,
      timestamp: eventData.timestamp,
      userId: this.userId,
      sessionId: this.sessionId,
      page: eventData.page,
      context: eventData.context,
    }

    this.events.push(event)

    // Enviar a servidor (en producción)
    this.sendEventToServer(event)
  }

  // Analizar completación de tareas
  private analyzeTaskCompletion(): void {
    // Simular análisis de completación de tareas
    const taskCompletionMetrics = [
      {
        id: 'task-completion-1',
        type: 'task_completion' as const,
        name: 'Form Submission',
        value: 85,
        threshold: 80,
        status: 'pass' as const,
        description: 'Percentage of users who successfully submit forms',
        timestamp: new Date(),
      },
      {
        id: 'task-completion-2',
        type: 'task_completion' as const,
        name: 'User Registration',
        value: 75,
        threshold: 80,
        status: 'warning' as const,
        description: 'Percentage of users who complete registration',
        timestamp: new Date(),
      },
      {
        id: 'task-completion-3',
        type: 'task_completion' as const,
        name: 'Checkout Process',
        value: 70,
        threshold: 75,
        status: 'warning' as const,
        description: 'Percentage of users who complete checkout',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...taskCompletionMetrics)
  }

  // Analizar tiempo en tarea
  private analyzeTimeOnTask(): void {
    // Simular análisis de tiempo en tarea
    const timeOnTaskMetrics = [
      {
        id: 'time-on-task-1',
        type: 'time_on_task' as const,
        name: 'Average Time on Page',
        value: 120,
        threshold: 90,
        status: 'warning' as const,
        description: 'Average time users spend on each page (seconds)',
        timestamp: new Date(),
      },
      {
        id: 'time-on-task-2',
        type: 'time_on_task' as const,
        name: 'Form Completion Time',
        value: 180,
        threshold: 150,
        status: 'warning' as const,
        description: 'Average time to complete forms (seconds)',
        timestamp: new Date(),
      },
      {
        id: 'time-on-task-3',
        type: 'time_on_task' as const,
        name: 'Navigation Time',
        value: 60,
        threshold: 45,
        status: 'warning' as const,
        description: 'Average time to navigate between pages (seconds)',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...timeOnTaskMetrics)
  }

  // Analizar tasa de errores
  private analyzeErrorRate(): void {
    // Simular análisis de tasa de errores
    const errorRateMetrics = [
      {
        id: 'error-rate-1',
        type: 'error_rate' as const,
        name: 'Form Error Rate',
        value: 15,
        threshold: 10,
        status: 'warning' as const,
        description: 'Percentage of form submissions with errors',
        timestamp: new Date(),
      },
      {
        id: 'error-rate-2',
        type: 'error_rate' as const,
        name: 'Navigation Error Rate',
        value: 8,
        threshold: 5,
        status: 'warning' as const,
        description: 'Percentage of navigation attempts that fail',
        timestamp: new Date(),
      },
      {
        id: 'error-rate-3',
        type: 'error_rate' as const,
        name: 'User Error Rate',
        value: 12,
        threshold: 10,
        status: 'warning' as const,
        description: 'Percentage of user actions that result in errors',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...errorRateMetrics)
  }

  // Analizar tasa de clics
  private analyzeClickThroughRate(): void {
    // Simular análisis de tasa de clics
    const clickThroughRateMetrics = [
      {
        id: 'ctr-1',
        type: 'click_through_rate' as const,
        name: 'Button Click Rate',
        value: 25,
        threshold: 20,
        status: 'pass' as const,
        description: 'Percentage of users who click on buttons',
        timestamp: new Date(),
      },
      {
        id: 'ctr-2',
        type: 'click_through_rate' as const,
        name: 'Link Click Rate',
        value: 18,
        threshold: 15,
        status: 'pass' as const,
        description: 'Percentage of users who click on links',
        timestamp: new Date(),
      },
      {
        id: 'ctr-3',
        type: 'click_through_rate' as const,
        name: 'Call-to-Action Rate',
        value: 12,
        threshold: 15,
        status: 'warning' as const,
        description: 'Percentage of users who click on CTAs',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...clickThroughRateMetrics)
  }

  // Analizar tasa de rebote
  private analyzeBounceRate(): void {
    // Simular análisis de tasa de rebote
    const bounceRateMetrics = [
      {
        id: 'bounce-rate-1',
        type: 'bounce_rate' as const,
        name: 'Page Bounce Rate',
        value: 45,
        threshold: 40,
        status: 'warning' as const,
        description: 'Percentage of users who leave after viewing one page',
        timestamp: new Date(),
      },
      {
        id: 'bounce-rate-2',
        type: 'bounce_rate' as const,
        name: 'Session Bounce Rate',
        value: 35,
        threshold: 30,
        status: 'warning' as const,
        description: 'Percentage of users who leave after one session',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...bounceRateMetrics)
  }

  // Analizar tasa de conversión
  private analyzeConversionRate(): void {
    // Simular análisis de tasa de conversión
    const conversionRateMetrics = [
      {
        id: 'conversion-rate-1',
        type: 'conversion_rate' as const,
        name: 'Registration Conversion',
        value: 8,
        threshold: 10,
        status: 'warning' as const,
        description: 'Percentage of visitors who register',
        timestamp: new Date(),
      },
      {
        id: 'conversion-rate-2',
        type: 'conversion_rate' as const,
        name: 'Purchase Conversion',
        value: 3,
        threshold: 5,
        status: 'warning' as const,
        description: 'Percentage of visitors who make a purchase',
        timestamp: new Date(),
      },
      {
        id: 'conversion-rate-3',
        type: 'conversion_rate' as const,
        name: 'Newsletter Signup',
        value: 15,
        threshold: 12,
        status: 'pass' as const,
        description: 'Percentage of visitors who sign up for newsletter',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...conversionRateMetrics)
  }

  // Obtener selector del elemento
  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`
    if (element.className) return `.${element.className.split(' ')[0]}`
    return element.tagName.toLowerCase()
  }

  // Generar ID de evento
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generar ID de sesión
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Obtener ID de usuario
  private getUserId(): string | undefined {
    return localStorage.getItem('userId') || undefined
  }

  // Enviar evento al servidor
  private sendEventToServer(event: UsabilityEvent): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Usability event sent to server:', event)
    }
    // En producción, esto enviaría el evento a un servicio de analytics
  }

  // Obtener eventos por tipo
  getEventsByType(type: UsabilityEvent['type']): UsabilityEvent[] {
    return this.events.filter(event => event.type === type)
  }

  // Obtener eventos por página
  getEventsByPage(page: string): UsabilityEvent[] {
    return this.events.filter(event => event.page === page)
  }

  // Obtener métricas por tipo
  getMetricsByType(type: UsabilityMetric['type']): UsabilityMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  // Obtener métricas por estado
  getMetricsByStatus(status: UsabilityMetric['status']): UsabilityMetric[] {
    return this.metrics.filter(metric => metric.status === status)
  }

  // Generar reporte de usabilidad
  generateUsabilityReport(): UsabilityReport {
    const summary = {
      overallScore: this.calculateOverallScore(),
      totalEvents: this.events.length,
      taskCompletionRate: this.getAverageTaskCompletion(),
      averageTimeOnTask: this.getAverageTimeOnTask(),
      errorRate: this.getAverageErrorRate(),
      clickThroughRate: this.getAverageClickThroughRate(),
      bounceRate: this.getAverageBounceRate(),
      conversionRate: this.getAverageConversionRate(),
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
      id: `usability_report_${Date.now()}`,
      timestamp: new Date(),
      summary,
      events: [...this.events],
      metrics: [...this.metrics],
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

  // Obtener completación de tareas promedio
  private getAverageTaskCompletion(): number {
    const taskMetrics = this.metrics.filter(m => m.type === 'task_completion')
    if (taskMetrics.length === 0) return 0

    const total = taskMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / taskMetrics.length)
  }

  // Obtener tiempo en tarea promedio
  private getAverageTimeOnTask(): number {
    const timeMetrics = this.metrics.filter(m => m.type === 'time_on_task')
    if (timeMetrics.length === 0) return 0

    const total = timeMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / timeMetrics.length)
  }

  // Obtener tasa de errores promedio
  private getAverageErrorRate(): number {
    const errorMetrics = this.metrics.filter(m => m.type === 'error_rate')
    if (errorMetrics.length === 0) return 0

    const total = errorMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / errorMetrics.length)
  }

  // Obtener tasa de clics promedio
  private getAverageClickThroughRate(): number {
    const ctrMetrics = this.metrics.filter(m => m.type === 'click_through_rate')
    if (ctrMetrics.length === 0) return 0

    const total = ctrMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / ctrMetrics.length)
  }

  // Obtener tasa de rebote promedio
  private getAverageBounceRate(): number {
    const bounceMetrics = this.metrics.filter(m => m.type === 'bounce_rate')
    if (bounceMetrics.length === 0) return 0

    const total = bounceMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / bounceMetrics.length)
  }

  // Obtener tasa de conversión promedio
  private getAverageConversionRate(): number {
    const conversionMetrics = this.metrics.filter(m => m.type === 'conversion_rate')
    if (conversionMetrics.length === 0) return 0

    const total = conversionMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / conversionMetrics.length)
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const warningMetrics = this.metrics.filter(m => m.status === 'warning')
    if (warningMetrics.length > 0) {
      recommendations.push(`${warningMetrics.length} métricas de usabilidad en advertencia`)
    }

    const failedMetrics = this.metrics.filter(m => m.status === 'fail')
    if (failedMetrics.length > 0) {
      recommendations.push(`${failedMetrics.length} métricas de usabilidad fallaron`)
    }

    const taskCompletion = this.getAverageTaskCompletion()
    if (taskCompletion < 80) {
      recommendations.push('Tasa de completación de tareas por debajo del umbral recomendado')
    }

    const errorRate = this.getAverageErrorRate()
    if (errorRate > 10) {
      recommendations.push('Tasa de errores por encima del umbral recomendado')
    }

    const bounceRate = this.getAverageBounceRate()
    if (bounceRate > 40) {
      recommendations.push('Tasa de rebote por encima del umbral recomendado')
    }

    const conversionRate = this.getAverageConversionRate()
    if (conversionRate < 5) {
      recommendations.push('Tasa de conversión por debajo del umbral recomendado')
    }

    return recommendations
  }

  // Obtener todos los eventos
  getAllEvents(): UsabilityEvent[] {
    return [...this.events]
  }

  // Obtener todas las métricas
  getAllMetrics(): UsabilityMetric[] {
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
      report: this.generateUsabilityReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const usabilityMonitoringService = UsabilityMonitoringService.getInstance()

// Hook para usar el servicio de monitoreo de usabilidad
export function useUsabilityMonitoring() {
  const [events, setEvents] = useState<UsabilityEvent[]>([])
  const [metrics, setMetrics] = useState<UsabilityMetric[]>([])
  const [report, setReport] = useState<UsabilityReport | null>(null)

  useEffect(() => {
    setEvents(usabilityMonitoringService.getAllEvents())
    setMetrics(usabilityMonitoringService.getAllMetrics())
    setReport(usabilityMonitoringService.generateUsabilityReport())
  }, [])

  const trackEvent = useCallback((eventData: {
    type: UsabilityEvent['type']
    element: string
    selector: string
    value?: string
    timestamp: Date
    page: string
    context: Record<string, any>
  }) => {
    usabilityMonitoringService.trackEvent(eventData)
    setEvents(usabilityMonitoringService.getAllEvents())
    setReport(usabilityMonitoringService.generateUsabilityReport())
  }, [])

  const getEventsByType = useCallback((type: UsabilityEvent['type']) => {
    return usabilityMonitoringService.getEventsByType(type)
  }, [])

  const getEventsByPage = useCallback((page: string) => {
    return usabilityMonitoringService.getEventsByPage(page)
  }, [])

  const getMetricsByType = useCallback((type: UsabilityMetric['type']) => {
    return usabilityMonitoringService.getMetricsByType(type)
  }, [])

  const getMetricsByStatus = useCallback((status: UsabilityMetric['status']) => {
    return usabilityMonitoringService.getMetricsByStatus(status)
  }, [])

  const generateUsabilityReport = useCallback(() => {
    const newReport = usabilityMonitoringService.generateUsabilityReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    usabilityMonitoringService.clearData()
    setEvents([])
    setMetrics([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return usabilityMonitoringService.exportData()
  }, [])

  return {
    events,
    metrics,
    report,
    trackEvent,
    getEventsByType,
    getEventsByPage,
    getMetricsByType,
    getMetricsByStatus,
    generateUsabilityReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de monitoreo de usabilidad
interface UsabilityMonitoringDashboardProps {
  className?: string
}

export const UsabilityMonitoringDashboard: React.FC<UsabilityMonitoringDashboardProps> = ({ className = '' }) => {
  const { events, metrics, report, generateUsabilityReport, clearData, exportData } = useUsabilityMonitoring()

  const getTypeColor = (type: UsabilityEvent['type']) => {
    switch (type) {
      case 'click': return 'text-blue-600 bg-blue-100'
      case 'scroll': return 'text-green-600 bg-green-100'
      case 'hover': return 'text-purple-600 bg-purple-100'
      case 'focus': return 'text-orange-600 bg-orange-100'
      case 'input': return 'text-pink-600 bg-pink-100'
      case 'navigation': return 'text-indigo-600 bg-indigo-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'success': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: UsabilityMetric['status']) => {
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
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Monitoreo de Usabilidad</h2>
        <div className="space-x-2">
          <button
            onClick={generateUsabilityReport}
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
              a.download = 'usability-monitoring-data.json'
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Usabilidad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación General</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.overallScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Completación de Tareas</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.taskCompletionRate}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Tasa de Errores</h4>
              <p className="text-2xl font-bold text-red-600">{report.summary.errorRate}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Tasa de Conversión</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.conversionRate}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Eventos de Usabilidad Recientes</h3>
          <div className="space-y-2">
            {events.slice(-5).map(event => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{event.element}</h4>
                    <p className="text-xs text-gray-600">{event.page}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-500">{event.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
                {event.value && (
                  <p className="text-xs text-gray-500">Valor: {event.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de Usabilidad</h3>
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
                    <span className="text-sm text-gray-600">{metric.value}/{metric.threshold}</span>
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
