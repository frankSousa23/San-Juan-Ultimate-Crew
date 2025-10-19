// Servicio de monitoreo de SEO
export interface SEOIssue {
  id: string
  type: 'meta' | 'content' | 'structure' | 'performance' | 'mobile' | 'security'
  severity: 'low' | 'medium' | 'high' | 'critical'
  rule: string
  message: string
  description: string
  element: string
  selector: string
  html: string
  impact: string
  help: string
  helpUrl?: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface SEOMetric {
  id: string
  type: 'meta' | 'content' | 'structure' | 'performance' | 'mobile' | 'security'
  name: string
  value: number
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  timestamp: Date
}

export interface SEOReport {
  id: string
  timestamp: Date
  summary: {
    overallScore: number
    totalIssues: number
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
    resolvedIssues: number
    metaScore: number
    contentScore: number
    structureScore: number
    performanceScore: number
    mobileScore: number
    securityScore: number
  }
  issues: SEOIssue[]
  metrics: SEOMetric[]
  recommendations: string[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

// Clase principal del servicio de monitoreo de SEO
export class SEOMonitoringService {
  private static instance: SEOMonitoringService
  private issues: SEOIssue[] = []
  private metrics: SEOMetric[] = []
  private isInitialized = false

  private constructor() {
    this.initializeSEOMonitoring()
  }

  static getInstance(): SEOMonitoringService {
    if (!SEOMonitoringService.instance) {
      SEOMonitoringService.instance = new SEOMonitoringService()
    }
    return SEOMonitoringService.instance
  }

  // Inicializar monitoreo de SEO
  private initializeSEOMonitoring(): void {
    this.analyzeMetaTags()
    this.analyzeContentStructure()
    this.analyzePageStructure()
    this.analyzePerformance()
    this.analyzeMobileOptimization()
    this.analyzeSecurity()
    this.detectSEOIssues()

    this.isInitialized = true
  }

  // Analizar meta tags
  private analyzeMetaTags(): void {
    // Simular análisis de meta tags
    const metaMetrics = [
      {
        id: 'meta-1',
        type: 'meta' as const,
        name: 'Title Tag',
        value: 85,
        threshold: 90,
        status: 'warning' as const,
        description: 'Title tag length and content optimization',
        timestamp: new Date(),
      },
      {
        id: 'meta-2',
        type: 'meta' as const,
        name: 'Meta Description',
        value: 80,
        threshold: 85,
        status: 'warning' as const,
        description: 'Meta description length and content optimization',
        timestamp: new Date(),
      },
      {
        id: 'meta-3',
        type: 'meta' as const,
        name: 'Meta Keywords',
        value: 70,
        threshold: 75,
        status: 'warning' as const,
        description: 'Meta keywords optimization',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...metaMetrics)
  }

  // Analizar estructura de contenido
  private analyzeContentStructure(): void {
    // Simular análisis de estructura de contenido
    const contentMetrics = [
      {
        id: 'content-1',
        type: 'content' as const,
        name: 'Heading Structure',
        value: 90,
        threshold: 85,
        status: 'pass' as const,
        description: 'Proper heading hierarchy (H1, H2, H3, etc.)',
        timestamp: new Date(),
      },
      {
        id: 'content-2',
        type: 'content' as const,
        name: 'Content Length',
        value: 75,
        threshold: 80,
        status: 'warning' as const,
        description: 'Content length optimization',
        timestamp: new Date(),
      },
      {
        id: 'content-3',
        type: 'content' as const,
        name: 'Keyword Density',
        value: 85,
        threshold: 80,
        status: 'pass' as const,
        description: 'Keyword density optimization',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...contentMetrics)
  }

  // Analizar estructura de página
  private analyzePageStructure(): void {
    // Simular análisis de estructura de página
    const structureMetrics = [
      {
        id: 'structure-1',
        type: 'structure' as const,
        name: 'URL Structure',
        value: 80,
        threshold: 85,
        status: 'warning' as const,
        description: 'URL structure optimization',
        timestamp: new Date(),
      },
      {
        id: 'structure-2',
        type: 'structure' as const,
        name: 'Internal Linking',
        value: 75,
        threshold: 80,
        status: 'warning' as const,
        description: 'Internal linking optimization',
        timestamp: new Date(),
      },
      {
        id: 'structure-3',
        type: 'structure' as const,
        name: 'Sitemap',
        value: 90,
        threshold: 85,
        status: 'pass' as const,
        description: 'Sitemap implementation',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...structureMetrics)
  }

  // Analizar rendimiento
  private analyzePerformance(): void {
    // Simular análisis de rendimiento
    const performanceMetrics = [
      {
        id: 'performance-1',
        type: 'performance' as const,
        name: 'Page Speed',
        value: 85,
        threshold: 90,
        status: 'warning' as const,
        description: 'Page loading speed optimization',
        timestamp: new Date(),
      },
      {
        id: 'performance-2',
        type: 'performance' as const,
        name: 'Image Optimization',
        value: 80,
        threshold: 85,
        status: 'warning' as const,
        description: 'Image optimization for SEO',
        timestamp: new Date(),
      },
      {
        id: 'performance-3',
        type: 'performance' as const,
        name: 'Core Web Vitals',
        value: 75,
        threshold: 80,
        status: 'warning' as const,
        description: 'Core Web Vitals optimization',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...performanceMetrics)
  }

  // Analizar optimización móvil
  private analyzeMobileOptimization(): void {
    // Simular análisis de optimización móvil
    const mobileMetrics = [
      {
        id: 'mobile-1',
        type: 'mobile' as const,
        name: 'Mobile Responsiveness',
        value: 90,
        threshold: 85,
        status: 'pass' as const,
        description: 'Mobile responsiveness optimization',
        timestamp: new Date(),
      },
      {
        id: 'mobile-2',
        type: 'mobile' as const,
        name: 'Mobile Page Speed',
        value: 80,
        threshold: 85,
        status: 'warning' as const,
        description: 'Mobile page speed optimization',
        timestamp: new Date(),
      },
      {
        id: 'mobile-3',
        type: 'mobile' as const,
        name: 'Touch Elements',
        value: 85,
        threshold: 80,
        status: 'pass' as const,
        description: 'Touch elements optimization',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...mobileMetrics)
  }

  // Analizar seguridad
  private analyzeSecurity(): void {
    // Simular análisis de seguridad
    const securityMetrics = [
      {
        id: 'security-1',
        type: 'security' as const,
        name: 'HTTPS Implementation',
        value: 95,
        threshold: 90,
        status: 'pass' as const,
        description: 'HTTPS implementation for SEO',
        timestamp: new Date(),
      },
      {
        id: 'security-2',
        type: 'security' as const,
        name: 'SSL Certificate',
        value: 90,
        threshold: 85,
        status: 'pass' as const,
        description: 'SSL certificate implementation',
        timestamp: new Date(),
      },
      {
        id: 'security-3',
        type: 'security' as const,
        name: 'Security Headers',
        value: 80,
        threshold: 85,
        status: 'warning' as const,
        description: 'Security headers implementation',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...securityMetrics)
  }

  // Detectar problemas de SEO
  private detectSEOIssues(): void {
    // Simular detección de problemas
    const seoIssues = [
      {
        id: 'seo-1',
        type: 'meta' as const,
        severity: 'high' as const,
        rule: 'missing-title-tag',
        message: 'Missing or empty title tag',
        description: 'Page should have a unique and descriptive title tag',
        element: 'title',
        selector: 'title',
        html: '<title></title>',
        impact: 'high',
        help: 'Add a unique and descriptive title tag for each page',
        helpUrl: 'https://developers.google.com/search/docs/appearance/title-link',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'seo-2',
        type: 'meta' as const,
        severity: 'medium' as const,
        rule: 'missing-meta-description',
        message: 'Missing meta description',
        description: 'Page should have a meta description for search results',
        element: 'meta',
        selector: 'meta[name="description"]',
        html: '<meta name="description" content="">',
        impact: 'medium',
        help: 'Add a compelling meta description for each page',
        helpUrl: 'https://developers.google.com/search/docs/appearance/snippet',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'seo-3',
        type: 'content' as const,
        severity: 'high' as const,
        rule: 'missing-h1-tag',
        message: 'Missing H1 tag',
        description: 'Page should have exactly one H1 tag',
        element: 'h1',
        selector: 'h1',
        html: '<h1>Page Title</h1>',
        impact: 'high',
        help: 'Add a single H1 tag to each page',
        helpUrl: 'https://developers.google.com/search/docs/appearance/structured-data',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'seo-4',
        type: 'content' as const,
        severity: 'medium' as const,
        rule: 'duplicate-content',
        message: 'Duplicate content detected',
        description: 'Content appears to be duplicated across multiple pages',
        element: 'body',
        selector: 'body',
        html: '<body>...</body>',
        impact: 'medium',
        help: 'Ensure each page has unique content',
        helpUrl: 'https://developers.google.com/search/docs/crawling-indexing/duplicate-content',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'seo-5',
        type: 'structure' as const,
        severity: 'low' as const,
        rule: 'missing-alt-text',
        message: 'Images missing alt text',
        description: 'Images should have descriptive alt text for SEO',
        element: 'img',
        selector: 'img',
        html: '<img src="image.jpg" alt="">',
        impact: 'low',
        help: 'Add descriptive alt text to all images',
        helpUrl: 'https://developers.google.com/search/docs/crawling-indexing/images',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'seo-6',
        type: 'performance' as const,
        severity: 'medium' as const,
        rule: 'slow-loading',
        message: 'Page loading too slowly',
        description: 'Page loading speed affects SEO rankings',
        element: 'body',
        selector: 'body',
        html: '<body>...</body>',
        impact: 'medium',
        help: 'Optimize page loading speed',
        helpUrl: 'https://developers.google.com/search/docs/crawling-indexing/page-speed',
        timestamp: new Date(),
        resolved: false,
      },
    ]

    this.issues.push(...seoIssues)
  }

  // Obtener problemas por tipo
  getIssuesByType(type: SEOIssue['type']): SEOIssue[] {
    return this.issues.filter(issue => issue.type === type)
  }

  // Obtener problemas por severidad
  getIssuesBySeverity(severity: SEOIssue['severity']): SEOIssue[] {
    return this.issues.filter(issue => issue.severity === severity)
  }

  // Obtener problemas no resueltos
  getUnresolvedIssues(): SEOIssue[] {
    return this.issues.filter(issue => !issue.resolved)
  }

  // Resolver problema
  resolveIssue(issueId: string, resolvedBy: string): void {
    const issue = this.issues.find(i => i.id === issueId)
    if (issue) {
      issue.resolved = true
      issue.resolvedAt = new Date()
      issue.resolvedBy = resolvedBy
    }
  }

  // Obtener métricas por tipo
  getMetricsByType(type: SEOMetric['type']): SEOMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  // Obtener métricas por estado
  getMetricsByStatus(status: SEOMetric['status']): SEOMetric[] {
    return this.metrics.filter(metric => metric.status === status)
  }

  // Generar reporte de SEO
  generateSEOReport(): SEOReport {
    const summary = {
      overallScore: this.calculateOverallScore(),
      totalIssues: this.issues.length,
      criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
      highIssues: this.issues.filter(i => i.severity === 'high').length,
      mediumIssues: this.issues.filter(i => i.severity === 'medium').length,
      lowIssues: this.issues.filter(i => i.severity === 'low').length,
      resolvedIssues: this.issues.filter(i => i.resolved).length,
      metaScore: this.getAverageMetaScore(),
      contentScore: this.getAverageContentScore(),
      structureScore: this.getAverageStructureScore(),
      performanceScore: this.getAveragePerformanceScore(),
      mobileScore: this.getAverageMobileScore(),
      securityScore: this.getAverageSecurityScore(),
    }

    const recommendations = this.generateRecommendations()

    const trends = {
      last24h: this.issues.filter(i => {
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000)
        return i.timestamp.getTime() > dayAgo
      }).length,
      last7d: this.issues.filter(i => {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        return i.timestamp.getTime() > weekAgo
      }).length,
      last30d: this.issues.filter(i => {
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
        return i.timestamp.getTime() > monthAgo
      }).length,
    }

    return {
      id: `seo_report_${Date.now()}`,
      timestamp: new Date(),
      summary,
      issues: [...this.issues],
      metrics: [...this.metrics],
      recommendations,
      trends,
    }
  }

  // Calcular puntuación general
  private calculateOverallScore(): number {
    const totalIssues = this.issues.length
    if (totalIssues === 0) return 100

    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length
    const highIssues = this.issues.filter(i => i.severity === 'high').length
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length
    const lowIssues = this.issues.filter(i => i.severity === 'low').length

    const score = 100 - (criticalIssues * 20) - (highIssues * 10) - (mediumIssues * 5) - (lowIssues * 1)
    return Math.max(0, score)
  }

  // Obtener puntuación meta promedio
  private getAverageMetaScore(): number {
    const metaMetrics = this.metrics.filter(m => m.type === 'meta')
    if (metaMetrics.length === 0) return 0

    const total = metaMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / metaMetrics.length)
  }

  // Obtener puntuación de contenido promedio
  private getAverageContentScore(): number {
    const contentMetrics = this.metrics.filter(m => m.type === 'content')
    if (contentMetrics.length === 0) return 0

    const total = contentMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / contentMetrics.length)
  }

  // Obtener puntuación de estructura promedio
  private getAverageStructureScore(): number {
    const structureMetrics = this.metrics.filter(m => m.type === 'structure')
    if (structureMetrics.length === 0) return 0

    const total = structureMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / structureMetrics.length)
  }

  // Obtener puntuación de rendimiento promedio
  private getAveragePerformanceScore(): number {
    const performanceMetrics = this.metrics.filter(m => m.type === 'performance')
    if (performanceMetrics.length === 0) return 0

    const total = performanceMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / performanceMetrics.length)
  }

  // Obtener puntuación móvil promedio
  private getAverageMobileScore(): number {
    const mobileMetrics = this.metrics.filter(m => m.type === 'mobile')
    if (mobileMetrics.length === 0) return 0

    const total = mobileMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / mobileMetrics.length)
  }

  // Obtener puntuación de seguridad promedio
  private getAverageSecurityScore(): number {
    const securityMetrics = this.metrics.filter(m => m.type === 'security')
    if (securityMetrics.length === 0) return 0

    const total = securityMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / securityMetrics.length)
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const criticalIssues = this.issues.filter(i => i.severity === 'critical')
    if (criticalIssues.length > 0) {
      recommendations.push(`${criticalIssues.length} problemas críticos de SEO requieren atención inmediata`)
    }

    const highIssues = this.issues.filter(i => i.severity === 'high')
    if (highIssues.length > 0) {
      recommendations.push(`${highIssues.length} problemas de alta severidad detectados`)
    }

    const unresolvedIssues = this.issues.filter(i => !i.resolved)
    if (unresolvedIssues.length > 0) {
      recommendations.push(`${unresolvedIssues.length} problemas de SEO sin resolver`)
    }

    const metaScore = this.getAverageMetaScore()
    if (metaScore < 85) {
      recommendations.push('Optimización de meta tags por debajo del umbral recomendado')
    }

    const contentScore = this.getAverageContentScore()
    if (contentScore < 80) {
      recommendations.push('Optimización de contenido por debajo del umbral recomendado')
    }

    const performanceScore = this.getAveragePerformanceScore()
    if (performanceScore < 85) {
      recommendations.push('Rendimiento de página por debajo del umbral recomendado')
    }

    return recommendations
  }

  // Obtener todos los problemas
  getAllIssues(): SEOIssue[] {
    return [...this.issues]
  }

  // Obtener todas las métricas
  getAllMetrics(): SEOMetric[] {
    return [...this.metrics]
  }

  // Limpiar datos
  clearData(): void {
    this.issues = []
    this.metrics = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      issues: this.issues,
      metrics: this.metrics,
      report: this.generateSEOReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const seoMonitoringService = SEOMonitoringService.getInstance()

// Hook para usar el servicio de monitoreo de SEO
export function useSEOMonitoring() {
  const [issues, setIssues] = useState<SEOIssue[]>([])
  const [metrics, setMetrics] = useState<SEOMetric[]>([])
  const [report, setReport] = useState<SEOReport | null>(null)

  useEffect(() => {
    setIssues(seoMonitoringService.getAllIssues())
    setMetrics(seoMonitoringService.getAllMetrics())
    setReport(seoMonitoringService.generateSEOReport())
  }, [])

  const getIssuesByType = useCallback((type: SEOIssue['type']) => {
    return seoMonitoringService.getIssuesByType(type)
  }, [])

  const getIssuesBySeverity = useCallback((severity: SEOIssue['severity']) => {
    return seoMonitoringService.getIssuesBySeverity(severity)
  }, [])

  const getUnresolvedIssues = useCallback(() => {
    return seoMonitoringService.getUnresolvedIssues()
  }, [])

  const resolveIssue = useCallback((issueId: string, resolvedBy: string) => {
    seoMonitoringService.resolveIssue(issueId, resolvedBy)
    setIssues(seoMonitoringService.getAllIssues())
    setReport(seoMonitoringService.generateSEOReport())
  }, [])

  const getMetricsByType = useCallback((type: SEOMetric['type']) => {
    return seoMonitoringService.getMetricsByType(type)
  }, [])

  const getMetricsByStatus = useCallback((status: SEOMetric['status']) => {
    return seoMonitoringService.getMetricsByStatus(status)
  }, [])

  const generateSEOReport = useCallback(() => {
    const newReport = seoMonitoringService.generateSEOReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    seoMonitoringService.clearData()
    setIssues([])
    setMetrics([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return seoMonitoringService.exportData()
  }, [])

  return {
    issues,
    metrics,
    report,
    getIssuesByType,
    getIssuesBySeverity,
    getUnresolvedIssues,
    resolveIssue,
    getMetricsByType,
    getMetricsByStatus,
    generateSEOReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de monitoreo de SEO
interface SEOMonitoringDashboardProps {
  className?: string
}

export const SEOMonitoringDashboard: React.FC<SEOMonitoringDashboardProps> = ({ className = '' }) => {
  const { issues, metrics, report, resolveIssue, generateSEOReport, clearData, exportData } = useSEOMonitoring()

  const getSeverityColor = (severity: SEOIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: SEOIssue['type']) => {
    switch (type) {
      case 'meta': return 'text-blue-600 bg-blue-100'
      case 'content': return 'text-green-600 bg-green-100'
      case 'structure': return 'text-purple-600 bg-purple-100'
      case 'performance': return 'text-orange-600 bg-orange-100'
      case 'mobile': return 'text-pink-600 bg-pink-100'
      case 'security': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: SEOMetric['status']) => {
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
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Monitoreo de SEO</h2>
        <div className="space-x-2">
          <button
            onClick={generateSEOReport}
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
              a.download = 'seo-monitoring-data.json'
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de SEO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación General</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.overallScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Meta Tags</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.metaScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Contenido</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.contentScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Rendimiento</h4>
              <p className="text-2xl font-bold text-orange-600">{report.summary.performanceScore}/100</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Problemas de SEO</h3>
          <div className="space-y-2">
            {issues.slice(-5).map(issue => (
              <div key={issue.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{issue.message}</h4>
                    <p className="text-xs text-gray-600">{issue.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(issue.type)}`}>
                      {issue.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{issue.element} • {issue.impact}</p>
                  {!issue.resolved && (
                    <button
                      onClick={() => resolveIssue(issue.id, 'user')}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de SEO</h3>
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
