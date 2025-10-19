// Sistema de preloading y prefetching avanzado
export interface PreloadResource {
  id: string
  url: string
  type: 'script' | 'style' | 'image' | 'font' | 'video' | 'audio' | 'document' | 'api'
  priority: 'high' | 'medium' | 'low'
  strategy: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch'
  condition?: string
  crossorigin?: 'anonymous' | 'use-credentials'
  as?: string
  media?: string
  sizes?: string
  importance?: 'high' | 'low' | 'auto'
  fetchpriority?: 'high' | 'low' | 'auto'
  isLoaded: boolean
  loadTime?: number
  error?: string
  metadata: Record<string, any>
}

export interface PreloadStrategy {
  id: string
  name: string
  description: string
  rules: PreloadRule[]
  isActive: boolean
  priority: number
  conditions: string[]
}

export interface PreloadRule {
  id: string
  pattern: string
  type: PreloadResource['type']
  priority: PreloadResource['priority']
  strategy: PreloadResource['strategy']
  condition?: string
  delay?: number
  timeout?: number
}

export interface PreloadAnalytics {
  id: string
  timestamp: Date
  summary: {
    totalResources: number
    preloadedResources: number
    prefetchedResources: number
    failedResources: number
    averageLoadTime: number
    cacheHitRate: number
    bandwidthSaved: number
    userExperienceScore: number
  }
  resources: PreloadResource[]
  strategies: PreloadStrategy[]
  recommendations: string[]
  performance: {
    pageLoadTime: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    cumulativeLayoutShift: number
    firstInputDelay: number
  }
}

export interface PreloadOperation {
  id: string
  resourceId: string
  type: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch'
  status: 'pending' | 'loading' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
  size?: number
  error?: string
  progress: number
}

// Clase principal del servicio de preloading
export class PreloadingService {
  private static instance: PreloadingService
  private resources: PreloadResource[] = []
  private strategies: PreloadStrategy[] = []
  private operations: PreloadOperation[] = []
  private isInitialized = false
  private observer?: IntersectionObserver
  private performanceObserver?: PerformanceObserver

  private constructor() {
    this.initializePreloadingService()
  }

  static getInstance(): PreloadingService {
    if (!PreloadingService.instance) {
      PreloadingService.instance = new PreloadingService()
    }
    return PreloadingService.instance
  }

  // Inicializar servicio de preloading
  private initializePreloadingService(): void {
    this.setupDefaultStrategies()
    this.setupIntersectionObserver()
    this.setupPerformanceObserver()
    this.analyzePageResources()
    this.isInitialized = true
  }

  // Configurar estrategias por defecto
  private setupDefaultStrategies(): void {
    this.strategies = [
      {
        id: 'critical-resources',
        name: 'Critical Resources',
        description: 'Preload critical resources for immediate page load',
        priority: 1,
        isActive: true,
        conditions: ['page-load'],
        rules: [
          {
            id: 'critical-css',
            pattern: '*.css',
            type: 'style',
            priority: 'high',
            strategy: 'preload',
            condition: 'critical',
          },
          {
            id: 'critical-js',
            pattern: '*.js',
            type: 'script',
            priority: 'high',
            strategy: 'preload',
            condition: 'critical',
          },
          {
            id: 'critical-fonts',
            pattern: '*.woff2',
            type: 'font',
            priority: 'high',
            strategy: 'preload',
            condition: 'critical',
          },
        ],
      },
      {
        id: 'navigation-prefetch',
        name: 'Navigation Prefetch',
        description: 'Prefetch resources for likely navigation paths',
        priority: 2,
        isActive: true,
        conditions: ['user-interaction', 'hover'],
        rules: [
          {
            id: 'link-prefetch',
            pattern: '/roster*',
            type: 'document',
            priority: 'medium',
            strategy: 'prefetch',
            delay: 100,
          },
          {
            id: 'api-prefetch',
            pattern: '/api/*',
            type: 'api',
            priority: 'low',
            strategy: 'prefetch',
            delay: 500,
          },
        ],
      },
      {
        id: 'image-preloading',
        name: 'Image Preloading',
        description: 'Preload images based on viewport and user behavior',
        priority: 3,
        isActive: true,
        conditions: ['viewport-visible', 'user-scroll'],
        rules: [
          {
            id: 'hero-images',
            pattern: 'hero-*',
            type: 'image',
            priority: 'high',
            strategy: 'preload',
            condition: 'above-fold',
          },
          {
            id: 'lazy-images',
            pattern: '*.jpg,*.png,*.webp',
            type: 'image',
            priority: 'medium',
            strategy: 'prefetch',
            condition: 'near-viewport',
          },
        ],
      },
      {
        id: 'api-preloading',
        name: 'API Preloading',
        description: 'Preload API responses for better user experience',
        priority: 4,
        isActive: true,
        conditions: ['user-interaction', 'page-load'],
        rules: [
          {
            id: 'user-data',
            pattern: '/api/users/*',
            type: 'api',
            priority: 'high',
            strategy: 'preload',
            condition: 'authenticated',
          },
          {
            id: 'content-data',
            pattern: '/api/content/*',
            type: 'api',
            priority: 'medium',
            strategy: 'prefetch',
            delay: 200,
          },
        ],
      },
    ]
  }

  // Configurar Intersection Observer
  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.handleElementInViewport(entry.target)
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    )
  }

  // Configurar Performance Observer
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.handlePerformanceEntry(entry)
        })
      })
      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource', 'paint'] })
    }
  }

  // Analizar recursos de la página
  private analyzePageResources(): void {
    // Simular análisis de recursos de la página
    this.resources = [
      {
        id: 'main-css',
        url: '/css/main.css',
        type: 'style',
        priority: 'high',
        strategy: 'preload',
        isLoaded: true,
        loadTime: 45,
        metadata: { size: 25600, critical: true },
      },
      {
        id: 'main-js',
        url: '/js/main.js',
        type: 'script',
        priority: 'high',
        strategy: 'preload',
        isLoaded: true,
        loadTime: 120,
        metadata: { size: 128000, critical: true },
      },
      {
        id: 'hero-image',
        url: '/images/hero-banner.jpg',
        type: 'image',
        priority: 'high',
        strategy: 'preload',
        isLoaded: false,
        metadata: { size: 512000, dimensions: '1920x1080' },
      },
      {
        id: 'roster-page',
        url: '/roster',
        type: 'document',
        priority: 'medium',
        strategy: 'prefetch',
        isLoaded: false,
        metadata: { size: 64000, likely: true },
      },
      {
        id: 'api-users',
        url: '/api/users',
        type: 'api',
        priority: 'medium',
        strategy: 'prefetch',
        isLoaded: false,
        metadata: { size: 32000, authenticated: true },
      },
    ]
  }

  // Manejar elemento en viewport
  private handleElementInViewport(element: Element): void {
    const src = element.getAttribute('src') || element.getAttribute('href')
    if (src) {
      this.prefetchResource(src, 'medium')
    }
  }

  // Manejar entrada de rendimiento
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming
      this.updateResourceLoadTime(resourceEntry.name, resourceEntry.duration)
    }
  }

  // Actualizar tiempo de carga del recurso
  private updateResourceLoadTime(url: string, loadTime: number): void {
    const resource = this.resources.find(r => r.url === url)
    if (resource) {
      resource.loadTime = loadTime
      resource.isLoaded = true
    }
  }

  // Precargar recurso
  async preloadResource(url: string, options?: {
    type?: PreloadResource['type']
    priority?: PreloadResource['priority']
    strategy?: PreloadResource['strategy']
    condition?: string
  }): Promise<PreloadResource> {
    const resourceId = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const resource: PreloadResource = {
      id: resourceId,
      url,
      type: options?.type || 'document',
      priority: options?.priority || 'medium',
      strategy: options?.strategy || 'preload',
      condition: options?.condition,
      isLoaded: false,
      metadata: {},
    }

    const operation: PreloadOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resourceId,
      type: resource.strategy,
      status: 'loading',
      startTime: new Date(),
      progress: 0,
    }

    this.resources.push(resource)
    this.operations.push(operation)

    try {
      // Simular precarga
      for (let progress = 0; progress <= 100; progress += 20) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      resource.isLoaded = true
      resource.loadTime = Math.random() * 200 + 50 // Simular tiempo de carga
      operation.status = 'completed'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()

      // Crear elemento de precarga
      this.createPreloadElement(resource)

      return resource
    } catch (error) {
      resource.error = error instanceof Error ? error.message : 'Unknown error'
      operation.status = 'failed'
      operation.error = resource.error
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      throw error
    }
  }

  // Prefetch recurso
  async prefetchResource(url: string, priority: PreloadResource['priority'] = 'low'): Promise<PreloadResource> {
    return this.preloadResource(url, {
      strategy: 'prefetch',
      priority,
    })
  }

  // Crear elemento de precarga
  private createPreloadElement(resource: PreloadResource): void {
    const link = document.createElement('link')
    link.rel = resource.strategy
    link.href = resource.url

    if (resource.type === 'style') {
      link.as = 'style'
    } else if (resource.type === 'script') {
      link.as = 'script'
    } else if (resource.type === 'image') {
      link.as = 'image'
    } else if (resource.type === 'font') {
      link.as = 'font'
      link.crossOrigin = 'anonymous'
    }

    if (resource.priority === 'high') {
      link.setAttribute('fetchpriority', 'high')
    }

    document.head.appendChild(link)
  }

  // Preload basado en estrategia
  async preloadByStrategy(strategyId: string): Promise<PreloadResource[]> {
    const strategy = this.strategies.find(s => s.id === strategyId)
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`)
    }

    const results: PreloadResource[] = []

    for (const rule of strategy.rules) {
      try {
        const resource = await this.preloadResource(rule.pattern, {
          type: rule.type,
          priority: rule.priority,
          strategy: rule.strategy,
          condition: rule.condition,
        })
        results.push(resource)
      } catch (error) {
        console.error(`Failed to preload resource for rule ${rule.id}:`, error)
      }
    }

    return results
  }

  // Preload inteligente basado en comportamiento del usuario
  async intelligentPreload(userBehavior: {
    currentPage: string
    mousePosition?: { x: number; y: number }
    scrollPosition?: number
    timeOnPage?: number
    clickHistory?: string[]
  }): Promise<PreloadResource[]> {
    const results: PreloadResource[] = []

    // Preload basado en página actual
    if (userBehavior.currentPage === '/') {
      results.push(await this.prefetchResource('/roster', 'medium'))
      results.push(await this.prefetchResource('/eventos', 'medium'))
    }

    // Preload basado en historial de clicks
    if (userBehavior.clickHistory) {
      const mostClicked = this.getMostClickedPage(userBehavior.clickHistory)
      if (mostClicked) {
        results.push(await this.prefetchResource(mostClicked, 'high'))
      }
    }

    // Preload basado en tiempo en página
    if (userBehavior.timeOnPage && userBehavior.timeOnPage > 5000) {
      results.push(await this.prefetchResource('/api/users', 'low'))
    }

    return results
  }

  // Obtener página más clickeada
  private getMostClickedPage(clickHistory: string[]): string | null {
    const counts = clickHistory.reduce((acc, page) => {
      acc[page] = (acc[page] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostClicked = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return mostClicked ? mostClicked[0] : null
  }

  // Obtener recursos por tipo
  getResourcesByType(type: PreloadResource['type']): PreloadResource[] {
    return this.resources.filter(resource => resource.type === type)
  }

  // Obtener recursos por prioridad
  getResourcesByPriority(priority: PreloadResource['priority']): PreloadResource[] {
    return this.resources.filter(resource => resource.priority === priority)
  }

  // Obtener recursos cargados
  getLoadedResources(): PreloadResource[] {
    return this.resources.filter(resource => resource.isLoaded)
  }

  // Obtener recursos fallidos
  getFailedResources(): PreloadResource[] {
    return this.resources.filter(resource => resource.error)
  }

  // Obtener operaciones por estado
  getOperationsByStatus(status: PreloadOperation['status']): PreloadOperation[] {
    return this.operations.filter(operation => operation.status === status)
  }

  // Generar analytics de preloading
  generatePreloadAnalytics(): PreloadAnalytics {
    const totalResources = this.resources.length
    const preloadedResources = this.resources.filter(r => r.strategy === 'preload').length
    const prefetchedResources = this.resources.filter(r => r.strategy === 'prefetch').length
    const failedResources = this.resources.filter(r => r.error).length
    const loadedResources = this.resources.filter(r => r.isLoaded && !r.error)

    const averageLoadTime = loadedResources.length > 0
      ? loadedResources.reduce((sum, r) => sum + (r.loadTime || 0), 0) / loadedResources.length
      : 0

    const cacheHitRate = this.calculateCacheHitRate()
    const bandwidthSaved = this.calculateBandwidthSaved()
    const userExperienceScore = this.calculateUserExperienceScore()

    const performance = this.getPerformanceMetrics()

    const recommendations = this.generateRecommendations()

    return {
      id: `preload_analytics_${Date.now()}`,
      timestamp: new Date(),
      summary: {
        totalResources,
        preloadedResources,
        prefetchedResources,
        failedResources,
        averageLoadTime,
        cacheHitRate,
        bandwidthSaved,
        userExperienceScore,
      },
      resources: [...this.resources],
      strategies: [...this.strategies],
      recommendations,
      performance,
    }
  }

  // Calcular tasa de acierto de cache
  private calculateCacheHitRate(): number {
    const cachedResources = this.resources.filter(r => r.isLoaded && r.loadTime && r.loadTime < 50)
    return this.resources.length > 0 ? (cachedResources.length / this.resources.length) * 100 : 0
  }

  // Calcular ancho de banda ahorrado
  private calculateBandwidthSaved(): number {
    return this.resources
      .filter(r => r.isLoaded)
      .reduce((sum, r) => sum + (r.metadata.size || 0), 0)
  }

  // Calcular puntuación de experiencia de usuario
  private calculateUserExperienceScore(): number {
    const loadedResources = this.resources.filter(r => r.isLoaded && !r.error)
    const totalResources = this.resources.length
    const loadTimeScore = this.resources.length > 0 
      ? Math.max(0, 100 - (this.getAverageLoadTime() / 10))
      : 100

    return Math.round((loadedResources.length / totalResources) * 50 + loadTimeScore * 0.5)
  }

  // Obtener tiempo de carga promedio
  private getAverageLoadTime(): number {
    const loadedResources = this.resources.filter(r => r.loadTime)
    return loadedResources.length > 0
      ? loadedResources.reduce((sum, r) => sum + (r.loadTime || 0), 0) / loadedResources.length
      : 0
  }

  // Obtener métricas de rendimiento
  private getPerformanceMetrics(): PreloadAnalytics['performance'] {
    // Simular métricas de rendimiento
    return {
      pageLoadTime: 1200,
      firstContentfulPaint: 800,
      largestContentfulPaint: 1500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 50,
    }
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const failedResources = this.getFailedResources()
    if (failedResources.length > 0) {
      recommendations.push(`${failedResources.length} recursos fallaron al precargar`)
    }

    const slowResources = this.resources.filter(r => r.loadTime && r.loadTime > 1000)
    if (slowResources.length > 0) {
      recommendations.push(`${slowResources.length} recursos tardan más de 1 segundo en cargar`)
    }

    const highPriorityResources = this.resources.filter(r => r.priority === 'high' && !r.isLoaded)
    if (highPriorityResources.length > 0) {
      recommendations.push(`${highPriorityResources.length} recursos de alta prioridad no están cargados`)
    }

    const unusedStrategies = this.strategies.filter(s => !s.isActive)
    if (unusedStrategies.length > 0) {
      recommendations.push(`${unusedStrategies.length} estrategias de precarga están inactivas`)
    }

    return recommendations
  }

  // Obtener todos los recursos
  getAllResources(): PreloadResource[] {
    return [...this.resources]
  }

  // Obtener todas las estrategias
  getAllStrategies(): PreloadStrategy[] {
    return [...this.strategies]
  }

  // Obtener todas las operaciones
  getAllOperations(): PreloadOperation[] {
    return [...this.operations]
  }

  // Limpiar datos
  clearData(): void {
    this.resources = []
    this.operations = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      resources: this.resources,
      strategies: this.strategies,
      operations: this.operations,
      analytics: this.generatePreloadAnalytics(),
    }, null, 2)
  }

  // Destruir servicio
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
  }
}

// Instancia global del servicio
export const preloadingService = PreloadingService.getInstance()

// Hook para usar el servicio de preloading
export function usePreloading() {
  const [resources, setResources] = useState<PreloadResource[]>([])
  const [strategies, setStrategies] = useState<PreloadStrategy[]>([])
  const [operations, setOperations] = useState<PreloadOperation[]>([])
  const [analytics, setAnalytics] = useState<PreloadAnalytics | null>(null)

  useEffect(() => {
    setResources(preloadingService.getAllResources())
    setStrategies(preloadingService.getAllStrategies())
    setOperations(preloadingService.getAllOperations())
    setAnalytics(preloadingService.generatePreloadAnalytics())
  }, [])

  const preloadResource = useCallback(async (url: string, options?: any) => {
    const resource = await preloadingService.preloadResource(url, options)
    setResources(preloadingService.getAllResources())
    setOperations(preloadingService.getAllOperations())
    setAnalytics(preloadingService.generatePreloadAnalytics())
    return resource
  }, [])

  const prefetchResource = useCallback(async (url: string, priority?: PreloadResource['priority']) => {
    const resource = await preloadingService.prefetchResource(url, priority)
    setResources(preloadingService.getAllResources())
    setOperations(preloadingService.getAllOperations())
    setAnalytics(preloadingService.generatePreloadAnalytics())
    return resource
  }, [])

  const preloadByStrategy = useCallback(async (strategyId: string) => {
    const resources = await preloadingService.preloadByStrategy(strategyId)
    setResources(preloadingService.getAllResources())
    setOperations(preloadingService.getAllOperations())
    setAnalytics(preloadingService.generatePreloadAnalytics())
    return resources
  }, [])

  const intelligentPreload = useCallback(async (userBehavior: any) => {
    const resources = await preloadingService.intelligentPreload(userBehavior)
    setResources(preloadingService.getAllResources())
    setOperations(preloadingService.getAllOperations())
    setAnalytics(preloadingService.generatePreloadAnalytics())
    return resources
  }, [])

  const generatePreloadAnalytics = useCallback(() => {
    const newAnalytics = preloadingService.generatePreloadAnalytics()
    setAnalytics(newAnalytics)
    return newAnalytics
  }, [])

  const clearData = useCallback(() => {
    preloadingService.clearData()
    setResources([])
    setOperations([])
    setAnalytics(null)
  }, [])

  const exportData = useCallback(() => {
    return preloadingService.exportData()
  }, [])

  return {
    resources,
    strategies,
    operations,
    analytics,
    preloadResource,
    prefetchResource,
    preloadByStrategy,
    intelligentPreload,
    generatePreloadAnalytics,
    clearData,
    exportData,
  }
}

// Componente de dashboard de preloading
interface PreloadingDashboardProps {
  className?: string
}

export const PreloadingDashboard: React.FC<PreloadingDashboardProps> = ({ className = '' }) => {
  const { resources, strategies, operations, analytics, preloadResource, prefetchResource, generatePreloadAnalytics, clearData, exportData } = usePreloading()

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const getTypeColor = (type: PreloadResource['type']) => {
    switch (type) {
      case 'script': return 'text-blue-600 bg-blue-100'
      case 'style': return 'text-green-600 bg-green-100'
      case 'image': return 'text-purple-600 bg-purple-100'
      case 'font': return 'text-orange-600 bg-orange-100'
      case 'video': return 'text-red-600 bg-red-100'
      case 'audio': return 'text-yellow-600 bg-yellow-100'
      case 'document': return 'text-indigo-600 bg-indigo-100'
      case 'api': return 'text-pink-600 bg-pink-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: PreloadResource['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStrategyColor = (strategy: PreloadResource['strategy']) => {
    switch (strategy) {
      case 'preload': return 'text-blue-600 bg-blue-100'
      case 'prefetch': return 'text-green-600 bg-green-100'
      case 'preconnect': return 'text-purple-600 bg-purple-100'
      case 'dns-prefetch': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: PreloadOperation['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100'
      case 'loading': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Preloading Dashboard</h2>
        <div className="space-x-2">
          <button
            onClick={() => preloadResource('/test-resource', { type: 'document', priority: 'high' })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Preload
          </button>
          <button
            onClick={() => prefetchResource('/test-prefetch', 'medium')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Prefetch
          </button>
          <button
            onClick={generatePreloadAnalytics}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Generate Analytics
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Data
          </button>
          <button
            onClick={() => {
              const data = exportData()
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'preloading-data.json'
              a.click()
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Export Data
          </button>
        </div>
      </div>

      {analytics && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Preloading Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Resources</h4>
              <p className="text-2xl font-bold text-gray-800">{analytics.summary.totalResources}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Preloaded</h4>
              <p className="text-2xl font-bold text-blue-600">{analytics.summary.preloadedResources}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Prefetched</h4>
              <p className="text-2xl font-bold text-green-600">{analytics.summary.prefetchedResources}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">UX Score</h4>
              <p className="text-2xl font-bold text-purple-600">{analytics.summary.userExperienceScore}/100</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Resources</h3>
          <div className="space-y-2">
            {resources.slice(-5).map(resource => (
              <div key={resource.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{resource.url}</h4>
                    <p className="text-xs text-gray-600">
                      Load Time: {resource.loadTime ? `${resource.loadTime.toFixed(0)}ms` : 'N/A'} | 
                      Size: {resource.metadata.size ? formatSize(resource.metadata.size) : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(resource.priority)}`}>
                      {resource.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrategyColor(resource.strategy)}`}>
                      {resource.strategy}
                    </span>
                    {resource.isLoaded ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Loaded
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                {resource.error && (
                  <p className="text-xs text-red-600">Error: {resource.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Active Strategies</h3>
          <div className="space-y-2">
            {strategies.filter(s => s.isActive).map(strategy => (
              <div key={strategy.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{strategy.name}</h4>
                    <p className="text-xs text-gray-600">{strategy.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Priority: {strategy.priority}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Rules: {strategy.rules.length} | Conditions: {strategy.conditions.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Operations</h3>
          <div className="space-y-2">
            {operations.slice(-5).map(operation => (
              <div key={operation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">
                      {operation.type.toUpperCase()} - {operation.resourceId}
                    </h4>
                    <p className="text-xs text-gray-600">
                      Progress: {operation.progress}% | 
                      Duration: {operation.duration ? `${operation.duration}ms` : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(operation.status)}`}>
                      {operation.status}
                    </span>
                  </div>
                </div>
                {operation.error && (
                  <p className="text-xs text-red-600">Error: {operation.error}</p>
                )}
                <p className="text-xs text-gray-500">
                  {operation.startTime.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
