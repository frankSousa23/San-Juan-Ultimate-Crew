import React, { useState, useEffect, useCallback } from 'react'

// Servicio de monitoreo de accesibilidad
export interface AccessibilityIssue {
  id: string
  type: 'error' | 'warning' | 'info'
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

export interface AccessibilityMetric {
  id: string
  type: 'wcag' | 'aria' | 'keyboard' | 'color' | 'text' | 'structure'
  name: string
  value: number
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  timestamp: Date
}

export interface AccessibilityReport {
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
    wcagCompliance: number
    ariaCompliance: number
    keyboardCompliance: number
    colorCompliance: number
    textCompliance: number
    structureCompliance: number
  }
  issues: AccessibilityIssue[]
  metrics: AccessibilityMetric[]
  recommendations: string[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

// Clase principal del servicio de monitoreo de accesibilidad
export class AccessibilityService {
  private static instance: AccessibilityService
  private issues: AccessibilityIssue[] = []
  private metrics: AccessibilityMetric[] = []
  private isInitialized = false

  private constructor() {
    this.initializeAccessibilityMonitoring()
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService()
    }
    return AccessibilityService.instance
  }

  // Inicializar monitoreo de accesibilidad
  private initializeAccessibilityMonitoring(): void {
    this.analyzeWCAGCompliance()
    this.analyzeARIACompliance()
    this.analyzeKeyboardAccessibility()
    this.analyzeColorAccessibility()
    this.analyzeTextAccessibility()
    this.analyzeStructureAccessibility()
    this.detectAccessibilityIssues()

    this.isInitialized = true
  }

  // Analizar cumplimiento WCAG
  private analyzeWCAGCompliance(): void {
    // Simular análisis WCAG
    const wcagMetrics = [
      {
        id: 'wcag-1',
        type: 'wcag' as const,
        name: 'WCAG 2.1 AA Compliance',
        value: 85,
        threshold: 90,
        status: 'warning' as const,
        description: 'WCAG 2.1 AA compliance below recommended threshold',
        timestamp: new Date(),
      },
      {
        id: 'wcag-2',
        type: 'wcag' as const,
        name: 'WCAG 2.1 AAA Compliance',
        value: 70,
        threshold: 80,
        status: 'fail' as const,
        description: 'WCAG 2.1 AAA compliance below threshold',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...wcagMetrics)
  }

  // Analizar cumplimiento ARIA
  private analyzeARIACompliance(): void {
    // Simular análisis ARIA
    const ariaMetrics = [
      {
        id: 'aria-1',
        type: 'aria' as const,
        name: 'ARIA Labels',
        value: 90,
        threshold: 95,
        status: 'warning' as const,
        description: 'ARIA labels coverage below recommended threshold',
        timestamp: new Date(),
      },
      {
        id: 'aria-2',
        type: 'aria' as const,
        name: 'ARIA Roles',
        value: 85,
        threshold: 90,
        status: 'warning' as const,
        description: 'ARIA roles implementation below threshold',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...ariaMetrics)
  }

  // Analizar accesibilidad de teclado
  private analyzeKeyboardAccessibility(): void {
    // Simular análisis de teclado
    const keyboardMetrics = [
      {
        id: 'keyboard-1',
        type: 'keyboard' as const,
        name: 'Keyboard Navigation',
        value: 80,
        threshold: 85,
        status: 'warning' as const,
        description: 'Keyboard navigation coverage below threshold',
        timestamp: new Date(),
      },
      {
        id: 'keyboard-2',
        type: 'keyboard' as const,
        name: 'Focus Management',
        value: 75,
        threshold: 80,
        status: 'warning' as const,
        description: 'Focus management implementation below threshold',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...keyboardMetrics)
  }

  // Analizar accesibilidad de color
  private analyzeColorAccessibility(): void {
    // Simular análisis de color
    const colorMetrics = [
      {
        id: 'color-1',
        type: 'color' as const,
        name: 'Color Contrast',
        value: 88,
        threshold: 90,
        status: 'warning' as const,
        description: 'Color contrast ratio below recommended threshold',
        timestamp: new Date(),
      },
      {
        id: 'color-2',
        type: 'color' as const,
        name: 'Color Independence',
        value: 95,
        threshold: 90,
        status: 'pass' as const,
        description: 'Color independence meets threshold',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...colorMetrics)
  }

  // Analizar accesibilidad de texto
  private analyzeTextAccessibility(): void {
    // Simular análisis de texto
    const textMetrics = [
      {
        id: 'text-1',
        type: 'text' as const,
        name: 'Text Scaling',
        value: 85,
        threshold: 90,
        status: 'warning' as const,
        description: 'Text scaling support below threshold',
        timestamp: new Date(),
      },
      {
        id: 'text-2',
        type: 'text' as const,
        name: 'Text Alternatives',
        value: 90,
        threshold: 95,
        status: 'warning' as const,
        description: 'Text alternatives coverage below threshold',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...textMetrics)
  }

  // Analizar accesibilidad de estructura
  private analyzeStructureAccessibility(): void {
    // Simular análisis de estructura
    const structureMetrics = [
      {
        id: 'structure-1',
        type: 'structure' as const,
        name: 'Heading Structure',
        value: 80,
        threshold: 85,
        status: 'warning' as const,
        description: 'Heading structure implementation below threshold',
        timestamp: new Date(),
      },
      {
        id: 'structure-2',
        type: 'structure' as const,
        name: 'Landmark Navigation',
        value: 75,
        threshold: 80,
        status: 'warning' as const,
        description: 'Landmark navigation below threshold',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...structureMetrics)
  }

  // Detectar problemas de accesibilidad
  private detectAccessibilityIssues(): void {
    // Simular detección de problemas
    const accessibilityIssues = [
      {
        id: 'a11y-1',
        type: 'error' as const,
        severity: 'high' as const,
        rule: 'color-contrast',
        message: 'Insufficient color contrast',
        description: 'Text color does not provide sufficient contrast with background',
        element: 'button',
        selector: '.btn-primary',
        html: '<button class="btn-primary">Click me</button>',
        impact: 'serious',
        help: 'Ensure text has a contrast ratio of at least 4.5:1',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'a11y-2',
        type: 'error' as const,
        severity: 'critical' as const,
        rule: 'missing-alt-text',
        message: 'Image missing alt text',
        description: 'Images must have alt text for screen readers',
        element: 'img',
        selector: '.hero-image',
        html: '<img src="hero.jpg" class="hero-image">',
        impact: 'critical',
        help: 'Add alt text to describe the image content',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'a11y-3',
        type: 'warning' as const,
        severity: 'medium' as const,
        rule: 'missing-heading',
        message: 'Missing heading structure',
        description: 'Page should have proper heading hierarchy',
        element: 'h1',
        selector: 'h1',
        html: '<h1>Page Title</h1>',
        impact: 'moderate',
        help: 'Ensure proper heading hierarchy (h1, h2, h3, etc.)',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'a11y-4',
        type: 'error' as const,
        severity: 'high' as const,
        rule: 'missing-label',
        message: 'Form input missing label',
        description: 'Form inputs must have associated labels',
        element: 'input',
        selector: '#email',
        html: '<input type="email" id="email">',
        impact: 'serious',
        help: 'Add a label element or aria-label attribute',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'a11y-5',
        type: 'warning' as const,
        severity: 'medium' as const,
        rule: 'missing-focus-indicator',
        message: 'Missing focus indicator',
        description: 'Interactive elements should have visible focus indicators',
        element: 'button',
        selector: '.btn-secondary',
        html: '<button class="btn-secondary">Submit</button>',
        impact: 'moderate',
        help: 'Add visible focus indicators for keyboard navigation',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
        timestamp: new Date(),
        resolved: false,
      },
      {
        id: 'a11y-6',
        type: 'error' as const,
        severity: 'high' as const,
        rule: 'missing-aria-label',
        message: 'Missing ARIA label',
        description: 'Interactive elements should have ARIA labels',
        element: 'button',
        selector: '.icon-button',
        html: '<button class="icon-button">×</button>',
        impact: 'serious',
        help: 'Add aria-label or aria-labelledby attribute',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
        timestamp: new Date(),
        resolved: false,
      },
    ]

    this.issues.push(...accessibilityIssues)
  }

  // Obtener problemas por tipo
  getIssuesByType(type: AccessibilityIssue['type']): AccessibilityIssue[] {
    return this.issues.filter(issue => issue.type === type)
  }

  // Obtener problemas por severidad
  getIssuesBySeverity(severity: AccessibilityIssue['severity']): AccessibilityIssue[] {
    return this.issues.filter(issue => issue.severity === severity)
  }

  // Obtener problemas no resueltos
  getUnresolvedIssues(): AccessibilityIssue[] {
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
  getMetricsByType(type: AccessibilityMetric['type']): AccessibilityMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  // Obtener métricas por estado
  getMetricsByStatus(status: AccessibilityMetric['status']): AccessibilityMetric[] {
    return this.metrics.filter(metric => metric.status === status)
  }

  // Generar reporte de accesibilidad
  generateAccessibilityReport(): AccessibilityReport {
    const summary = {
      overallScore: this.calculateOverallScore(),
      totalIssues: this.issues.length,
      criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
      highIssues: this.issues.filter(i => i.severity === 'high').length,
      mediumIssues: this.issues.filter(i => i.severity === 'medium').length,
      lowIssues: this.issues.filter(i => i.severity === 'low').length,
      resolvedIssues: this.issues.filter(i => i.resolved).length,
      wcagCompliance: this.getAverageWCAGCompliance(),
      ariaCompliance: this.getAverageARIACompliance(),
      keyboardCompliance: this.getAverageKeyboardCompliance(),
      colorCompliance: this.getAverageColorCompliance(),
      textCompliance: this.getAverageTextCompliance(),
      structureCompliance: this.getAverageStructureCompliance(),
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
      id: `accessibility_report_${Date.now()}`,
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

  // Obtener cumplimiento WCAG promedio
  private getAverageWCAGCompliance(): number {
    const wcagMetrics = this.metrics.filter(m => m.type === 'wcag')
    if (wcagMetrics.length === 0) return 0

    const total = wcagMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / wcagMetrics.length)
  }

  // Obtener cumplimiento ARIA promedio
  private getAverageARIACompliance(): number {
    const ariaMetrics = this.metrics.filter(m => m.type === 'aria')
    if (ariaMetrics.length === 0) return 0

    const total = ariaMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / ariaMetrics.length)
  }

  // Obtener cumplimiento de teclado promedio
  private getAverageKeyboardCompliance(): number {
    const keyboardMetrics = this.metrics.filter(m => m.type === 'keyboard')
    if (keyboardMetrics.length === 0) return 0

    const total = keyboardMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / keyboardMetrics.length)
  }

  // Obtener cumplimiento de color promedio
  private getAverageColorCompliance(): number {
    const colorMetrics = this.metrics.filter(m => m.type === 'color')
    if (colorMetrics.length === 0) return 0

    const total = colorMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / colorMetrics.length)
  }

  // Obtener cumplimiento de texto promedio
  private getAverageTextCompliance(): number {
    const textMetrics = this.metrics.filter(m => m.type === 'text')
    if (textMetrics.length === 0) return 0

    const total = textMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / textMetrics.length)
  }

  // Obtener cumplimiento de estructura promedio
  private getAverageStructureCompliance(): number {
    const structureMetrics = this.metrics.filter(m => m.type === 'structure')
    if (structureMetrics.length === 0) return 0

    const total = structureMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / structureMetrics.length)
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const criticalIssues = this.issues.filter(i => i.severity === 'critical')
    if (criticalIssues.length > 0) {
      recommendations.push(`${criticalIssues.length} problemas críticos de accesibilidad requieren atención inmediata`)
    }

    const highIssues = this.issues.filter(i => i.severity === 'high')
    if (highIssues.length > 0) {
      recommendations.push(`${highIssues.length} problemas de alta severidad detectados`)
    }

    const unresolvedIssues = this.issues.filter(i => !i.resolved)
    if (unresolvedIssues.length > 0) {
      recommendations.push(`${unresolvedIssues.length} problemas de accesibilidad sin resolver`)
    }

    const wcagCompliance = this.getAverageWCAGCompliance()
    if (wcagCompliance < 90) {
      recommendations.push('Cumplimiento WCAG por debajo del umbral recomendado')
    }

    const ariaCompliance = this.getAverageARIACompliance()
    if (ariaCompliance < 90) {
      recommendations.push('Cumplimiento ARIA por debajo del umbral recomendado')
    }

    const keyboardCompliance = this.getAverageKeyboardCompliance()
    if (keyboardCompliance < 85) {
      recommendations.push('Accesibilidad de teclado por debajo del umbral recomendado')
    }

    return recommendations
  }

  // Obtener todos los problemas
  getAllIssues(): AccessibilityIssue[] {
    return [...this.issues]
  }

  // Obtener todas las métricas
  getAllMetrics(): AccessibilityMetric[] {
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
      report: this.generateAccessibilityReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const accessibilityService = AccessibilityService.getInstance()

// Hook para usar el servicio de accesibilidad
export function useAccessibility() {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([])
  const [metrics, setMetrics] = useState<AccessibilityMetric[]>([])
  const [report, setReport] = useState<AccessibilityReport | null>(null)

  useEffect(() => {
    setIssues(accessibilityService.getAllIssues())
    setMetrics(accessibilityService.getAllMetrics())
    setReport(accessibilityService.generateAccessibilityReport())
  }, [])

  const getIssuesByType = useCallback((type: AccessibilityIssue['type']) => {
    return accessibilityService.getIssuesByType(type)
  }, [])

  const getIssuesBySeverity = useCallback((severity: AccessibilityIssue['severity']) => {
    return accessibilityService.getIssuesBySeverity(severity)
  }, [])

  const getUnresolvedIssues = useCallback(() => {
    return accessibilityService.getUnresolvedIssues()
  }, [])

  const resolveIssue = useCallback((issueId: string, resolvedBy: string) => {
    accessibilityService.resolveIssue(issueId, resolvedBy)
    setIssues(accessibilityService.getAllIssues())
    setReport(accessibilityService.generateAccessibilityReport())
  }, [])

  const getMetricsByType = useCallback((type: AccessibilityMetric['type']) => {
    return accessibilityService.getMetricsByType(type)
  }, [])

  const getMetricsByStatus = useCallback((status: AccessibilityMetric['status']) => {
    return accessibilityService.getMetricsByStatus(status)
  }, [])

  const generateAccessibilityReport = useCallback(() => {
    const newReport = accessibilityService.generateAccessibilityReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    accessibilityService.clearData()
    setIssues([])
    setMetrics([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return accessibilityService.exportData()
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
    generateAccessibilityReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de accesibilidad
interface AccessibilityDashboardProps {
  className?: string
}

export const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({ className = '' }) => {
  const { issues, metrics, report, resolveIssue, generateAccessibilityReport, clearData, exportData } = useAccessibility()

  const getSeverityColor = (severity: AccessibilityIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'info': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: AccessibilityMetric['status']) => {
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
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Accesibilidad</h2>
        <div className="space-x-2">
          <button
            onClick={generateAccessibilityReport}
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
              a.download = 'accessibility-data.json'
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Accesibilidad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación General</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.overallScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">WCAG Compliance</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.wcagCompliance}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">ARIA Compliance</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.ariaCompliance}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Problemas Críticos</h4>
              <p className="text-2xl font-bold text-red-600">{report.summary.criticalIssues}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Problemas de Accesibilidad</h3>
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de Accesibilidad</h3>
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
