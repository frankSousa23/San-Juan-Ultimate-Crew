import React, { useState, useEffect, useCallback } from 'react'

// Servicio de monitoreo de calidad de código
export interface CodeQualityMetric {
  id: string
  type: 'complexity' | 'coverage' | 'duplication' | 'maintainability' | 'security' | 'performance'
  name: string
  value: number
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  filePath?: string
  lineNumber?: number
  timestamp: Date
}

export interface CodeQualityReport {
  id: string
  timestamp: Date
  summary: {
    overallScore: number
    totalMetrics: number
    passedMetrics: number
    warningMetrics: number
    failedMetrics: number
    coverage: number
    complexity: number
    maintainability: number
    security: number
    performance: number
  }
  metrics: CodeQualityMetric[]
  recommendations: string[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

export interface CodeIssue {
  id: string
  type: 'bug' | 'vulnerability' | 'code_smell' | 'security_hotspot' | 'duplication'
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker'
  message: string
  filePath: string
  lineNumber: number
  rule: string
  description: string
  effort: string
  status: 'open' | 'confirmed' | 'resolved' | 'false_positive'
  createdAt: Date
  resolvedAt?: Date
  resolvedBy?: string
}

// Clase principal del servicio de calidad de código
export class CodeQualityService {
  private static instance: CodeQualityService
  private metrics: CodeQualityMetric[] = []
  private issues: CodeIssue[] = []
  private isInitialized = false

  private constructor() {
    this.initializeCodeQualityMonitoring()
  }

  static getInstance(): CodeQualityService {
    if (!CodeQualityService.instance) {
      CodeQualityService.instance = new CodeQualityService()
    }
    return CodeQualityService.instance
  }

  // Inicializar monitoreo de calidad de código
  private initializeCodeQualityMonitoring(): void {
    this.analyzeCodeComplexity()
    this.analyzeCodeCoverage()
    this.analyzeCodeDuplication()
    this.analyzeMaintainability()
    this.analyzeSecurityIssues()
    this.analyzePerformanceIssues()
    this.detectCodeIssues()

    this.isInitialized = true
  }

  // Analizar complejidad del código
  private analyzeCodeComplexity(): void {
    // Simular análisis de complejidad ciclomática
    const complexityMetrics = [
      {
        id: 'complexity-1',
        type: 'complexity' as const,
        name: 'Cyclomatic Complexity',
        value: 15,
        threshold: 10,
        status: 'warning' as const,
        description: 'High cyclomatic complexity detected',
        filePath: 'src/components/ComplexComponent.tsx',
        lineNumber: 45,
        timestamp: new Date(),
      },
      {
        id: 'complexity-2',
        type: 'complexity' as const,
        name: 'Cognitive Complexity',
        value: 8,
        threshold: 15,
        status: 'pass' as const,
        description: 'Cognitive complexity within acceptable limits',
        filePath: 'src/utils/helper.ts',
        lineNumber: 23,
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...complexityMetrics)
  }

  // Analizar cobertura de código
  private analyzeCodeCoverage(): void {
    // Simular análisis de cobertura
    const coverageMetrics = [
      {
        id: 'coverage-1',
        type: 'coverage' as const,
        name: 'Line Coverage',
        value: 85,
        threshold: 80,
        status: 'pass' as const,
        description: 'Line coverage meets minimum threshold',
        timestamp: new Date(),
      },
      {
        id: 'coverage-2',
        type: 'coverage' as const,
        name: 'Branch Coverage',
        value: 75,
        threshold: 80,
        status: 'warning' as const,
        description: 'Branch coverage below recommended threshold',
        timestamp: new Date(),
      },
      {
        id: 'coverage-3',
        type: 'coverage' as const,
        name: 'Function Coverage',
        value: 90,
        threshold: 85,
        status: 'pass' as const,
        description: 'Function coverage exceeds threshold',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...coverageMetrics)
  }

  // Analizar duplicación de código
  private analyzeCodeDuplication(): void {
    // Simular análisis de duplicación
    const duplicationMetrics = [
      {
        id: 'duplication-1',
        type: 'duplication' as const,
        name: 'Code Duplication',
        value: 5,
        threshold: 3,
        status: 'warning' as const,
        description: 'Code duplication detected above threshold',
        filePath: 'src/components/Button.tsx',
        lineNumber: 12,
        timestamp: new Date(),
      },
      {
        id: 'duplication-2',
        type: 'duplication' as const,
        name: 'Block Duplication',
        value: 2,
        threshold: 3,
        status: 'pass' as const,
        description: 'Block duplication within acceptable limits',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...duplicationMetrics)
  }

  // Analizar mantenibilidad
  private analyzeMaintainability(): void {
    // Simular análisis de mantenibilidad
    const maintainabilityMetrics = [
      {
        id: 'maintainability-1',
        type: 'maintainability' as const,
        name: 'Maintainability Index',
        value: 75,
        threshold: 70,
        status: 'pass' as const,
        description: 'Maintainability index within acceptable range',
        timestamp: new Date(),
      },
      {
        id: 'maintainability-2',
        type: 'maintainability' as const,
        name: 'Technical Debt',
        value: 120,
        threshold: 100,
        status: 'warning' as const,
        description: 'Technical debt exceeds recommended threshold',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...maintainabilityMetrics)
  }

  // Analizar problemas de seguridad
  private analyzeSecurityIssues(): void {
    // Simular análisis de seguridad
    const securityMetrics = [
      {
        id: 'security-1',
        type: 'security' as const,
        name: 'Security Vulnerabilities',
        value: 2,
        threshold: 0,
        status: 'fail' as const,
        description: 'Security vulnerabilities detected',
        filePath: 'src/utils/auth.ts',
        lineNumber: 34,
        timestamp: new Date(),
      },
      {
        id: 'security-2',
        type: 'security' as const,
        name: 'Security Hotspots',
        value: 5,
        threshold: 3,
        status: 'warning' as const,
        description: 'Security hotspots require attention',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...securityMetrics)
  }

  // Analizar problemas de rendimiento
  private analyzePerformanceIssues(): void {
    // Simular análisis de rendimiento
    const performanceMetrics = [
      {
        id: 'performance-1',
        type: 'performance' as const,
        name: 'Performance Issues',
        value: 3,
        threshold: 2,
        status: 'warning' as const,
        description: 'Performance issues detected',
        filePath: 'src/components/HeavyComponent.tsx',
        lineNumber: 67,
        timestamp: new Date(),
      },
      {
        id: 'performance-2',
        type: 'performance' as const,
        name: 'Memory Leaks',
        value: 1,
        threshold: 0,
        status: 'fail' as const,
        description: 'Potential memory leak detected',
        filePath: 'src/hooks/useData.ts',
        lineNumber: 89,
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...performanceMetrics)
  }

  // Detectar problemas de código
  private detectCodeIssues(): void {
    // Simular detección de problemas
    const codeIssues = [
      {
        id: 'issue-1',
        type: 'bug' as const,
        severity: 'major' as const,
        message: 'Unused variable',
        filePath: 'src/components/Button.tsx',
        lineNumber: 15,
        rule: 'no-unused-vars',
        description: 'Variable declared but never used',
        effort: '5min',
        status: 'open' as const,
        createdAt: new Date(),
      },
      {
        id: 'issue-2',
        type: 'vulnerability' as const,
        severity: 'critical' as const,
        message: 'SQL injection vulnerability',
        filePath: 'src/utils/database.ts',
        lineNumber: 42,
        rule: 'sql-injection',
        description: 'Potential SQL injection vulnerability',
        effort: '30min',
        status: 'open' as const,
        createdAt: new Date(),
      },
      {
        id: 'issue-3',
        type: 'code_smell' as const,
        severity: 'minor' as const,
        message: 'Long method',
        filePath: 'src/utils/helper.ts',
        lineNumber: 78,
        rule: 'method-length',
        description: 'Method is too long and should be refactored',
        effort: '15min',
        status: 'open' as const,
        createdAt: new Date(),
      },
      {
        id: 'issue-4',
        type: 'security_hotspot' as const,
        severity: 'major' as const,
        message: 'Hardcoded password',
        filePath: 'src/config/database.ts',
        lineNumber: 12,
        rule: 'hardcoded-password',
        description: 'Password should not be hardcoded',
        effort: '10min',
        status: 'open' as const,
        createdAt: new Date(),
      },
      {
        id: 'issue-5',
        type: 'duplication' as const,
        severity: 'minor' as const,
        message: 'Duplicated code',
        filePath: 'src/components/Modal.tsx',
        lineNumber: 25,
        rule: 'duplicated-code',
        description: 'Code is duplicated in multiple places',
        effort: '20min',
        status: 'open' as const,
        createdAt: new Date(),
      },
    ]

    this.issues.push(...codeIssues)
  }

  // Obtener métricas por tipo
  getMetricsByType(type: CodeQualityMetric['type']): CodeQualityMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  // Obtener métricas por estado
  getMetricsByStatus(status: CodeQualityMetric['status']): CodeQualityMetric[] {
    return this.metrics.filter(metric => metric.status === status)
  }

  // Obtener problemas por tipo
  getIssuesByType(type: CodeIssue['type']): CodeIssue[] {
    return this.issues.filter(issue => issue.type === type)
  }

  // Obtener problemas por severidad
  getIssuesBySeverity(severity: CodeIssue['severity']): CodeIssue[] {
    return this.issues.filter(issue => issue.severity === severity)
  }

  // Obtener problemas abiertos
  getOpenIssues(): CodeIssue[] {
    return this.issues.filter(issue => issue.status === 'open')
  }

  // Resolver problema
  resolveIssue(issueId: string, resolvedBy: string): void {
    const issue = this.issues.find(i => i.id === issueId)
    if (issue) {
      issue.status = 'resolved'
      issue.resolvedAt = new Date()
      issue.resolvedBy = resolvedBy
    }
  }

  // Marcar como falso positivo
  markAsFalsePositive(issueId: string, resolvedBy: string): void {
    const issue = this.issues.find(i => i.id === issueId)
    if (issue) {
      issue.status = 'false_positive'
      issue.resolvedAt = new Date()
      issue.resolvedBy = resolvedBy
    }
  }

  // Generar reporte de calidad de código
  generateCodeQualityReport(): CodeQualityReport {
    const summary = {
      overallScore: this.calculateOverallScore(),
      totalMetrics: this.metrics.length,
      passedMetrics: this.metrics.filter(m => m.status === 'pass').length,
      warningMetrics: this.metrics.filter(m => m.status === 'warning').length,
      failedMetrics: this.metrics.filter(m => m.status === 'fail').length,
      coverage: this.getAverageCoverage(),
      complexity: this.getAverageComplexity(),
      maintainability: this.getAverageMaintainability(),
      security: this.getAverageSecurity(),
      performance: this.getAveragePerformance(),
    }

    const recommendations = this.generateRecommendations()

    const trends = {
      last24h: this.metrics.filter(m => {
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000)
        return m.timestamp.getTime() > dayAgo
      }).length,
      last7d: this.metrics.filter(m => {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        return m.timestamp.getTime() > weekAgo
      }).length,
      last30d: this.metrics.filter(m => {
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
        return m.timestamp.getTime() > monthAgo
      }).length,
    }

    return {
      id: `code_quality_report_${Date.now()}`,
      timestamp: new Date(),
      summary,
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

  // Obtener cobertura promedio
  private getAverageCoverage(): number {
    const coverageMetrics = this.metrics.filter(m => m.type === 'coverage')
    if (coverageMetrics.length === 0) return 0

    const total = coverageMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / coverageMetrics.length)
  }

  // Obtener complejidad promedio
  private getAverageComplexity(): number {
    const complexityMetrics = this.metrics.filter(m => m.type === 'complexity')
    if (complexityMetrics.length === 0) return 0

    const total = complexityMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / complexityMetrics.length)
  }

  // Obtener mantenibilidad promedio
  private getAverageMaintainability(): number {
    const maintainabilityMetrics = this.metrics.filter(m => m.type === 'maintainability')
    if (maintainabilityMetrics.length === 0) return 0

    const total = maintainabilityMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / maintainabilityMetrics.length)
  }

  // Obtener seguridad promedio
  private getAverageSecurity(): number {
    const securityMetrics = this.metrics.filter(m => m.type === 'security')
    if (securityMetrics.length === 0) return 100

    const total = securityMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(100 - (total / securityMetrics.length) * 10) // Invertir para que menor sea mejor
  }

  // Obtener rendimiento promedio
  private getAveragePerformance(): number {
    const performanceMetrics = this.metrics.filter(m => m.type === 'performance')
    if (performanceMetrics.length === 0) return 100

    const total = performanceMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(100 - (total / performanceMetrics.length) * 20) // Invertir para que menor sea mejor
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const failedMetrics = this.metrics.filter(m => m.status === 'fail')
    if (failedMetrics.length > 0) {
      recommendations.push(`${failedMetrics.length} métricas fallaron - requiere atención inmediata`)
    }

    const warningMetrics = this.metrics.filter(m => m.status === 'warning')
    if (warningMetrics.length > 0) {
      recommendations.push(`${warningMetrics.length} métricas en advertencia - considerar mejoras`)
    }

    const openIssues = this.issues.filter(i => i.status === 'open')
    if (openIssues.length > 0) {
      recommendations.push(`${openIssues.length} problemas de código abiertos`)
    }

    const criticalIssues = this.issues.filter(i => i.severity === 'critical')
    if (criticalIssues.length > 0) {
      recommendations.push(`${criticalIssues.length} problemas críticos requieren resolución inmediata`)
    }

    const securityIssues = this.issues.filter(i => i.type === 'vulnerability' || i.type === 'security_hotspot')
    if (securityIssues.length > 0) {
      recommendations.push(`${securityIssues.length} problemas de seguridad detectados`)
    }

    return recommendations
  }

  // Obtener todas las métricas
  getAllMetrics(): CodeQualityMetric[] {
    return [...this.metrics]
  }

  // Obtener todos los problemas
  getAllIssues(): CodeIssue[] {
    return [...this.issues]
  }

  // Limpiar datos
  clearData(): void {
    this.metrics = []
    this.issues = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      metrics: this.metrics,
      issues: this.issues,
      report: this.generateCodeQualityReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const codeQualityService = CodeQualityService.getInstance()

// Hook para usar el servicio de calidad de código
export function useCodeQuality() {
  const [metrics, setMetrics] = useState<CodeQualityMetric[]>([])
  const [issues, setIssues] = useState<CodeIssue[]>([])
  const [report, setReport] = useState<CodeQualityReport | null>(null)

  useEffect(() => {
    setMetrics(codeQualityService.getAllMetrics())
    setIssues(codeQualityService.getAllIssues())
    setReport(codeQualityService.generateCodeQualityReport())
  }, [])

  const getMetricsByType = useCallback((type: CodeQualityMetric['type']) => {
    return codeQualityService.getMetricsByType(type)
  }, [])

  const getMetricsByStatus = useCallback((status: CodeQualityMetric['status']) => {
    return codeQualityService.getMetricsByStatus(status)
  }, [])

  const getIssuesByType = useCallback((type: CodeIssue['type']) => {
    return codeQualityService.getIssuesByType(type)
  }, [])

  const getIssuesBySeverity = useCallback((severity: CodeIssue['severity']) => {
    return codeQualityService.getIssuesBySeverity(severity)
  }, [])

  const getOpenIssues = useCallback(() => {
    return codeQualityService.getOpenIssues()
  }, [])

  const resolveIssue = useCallback((issueId: string, resolvedBy: string) => {
    codeQualityService.resolveIssue(issueId, resolvedBy)
    setIssues(codeQualityService.getAllIssues())
    setReport(codeQualityService.generateCodeQualityReport())
  }, [])

  const markAsFalsePositive = useCallback((issueId: string, resolvedBy: string) => {
    codeQualityService.markAsFalsePositive(issueId, resolvedBy)
    setIssues(codeQualityService.getAllIssues())
    setReport(codeQualityService.generateCodeQualityReport())
  }, [])

  const generateCodeQualityReport = useCallback(() => {
    const newReport = codeQualityService.generateCodeQualityReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    codeQualityService.clearData()
    setMetrics([])
    setIssues([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return codeQualityService.exportData()
  }, [])

  return {
    metrics,
    issues,
    report,
    getMetricsByType,
    getMetricsByStatus,
    getIssuesByType,
    getIssuesBySeverity,
    getOpenIssues,
    resolveIssue,
    markAsFalsePositive,
    generateCodeQualityReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de calidad de código
interface CodeQualityDashboardProps {
  className?: string
}

export const CodeQualityDashboard: React.FC<CodeQualityDashboardProps> = ({ className = '' }) => {
  const { metrics, issues, report, resolveIssue, markAsFalsePositive, generateCodeQualityReport, clearData, exportData } = useCodeQuality()

  const getStatusColor = (status: CodeQualityMetric['status']) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'fail': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: CodeIssue['severity']) => {
    switch (severity) {
      case 'blocker': return 'text-red-600 bg-red-100'
      case 'critical': return 'text-red-600 bg-red-100'
      case 'major': return 'text-orange-600 bg-orange-100'
      case 'minor': return 'text-yellow-600 bg-yellow-100'
      case 'info': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: CodeIssue['type']) => {
    switch (type) {
      case 'bug': return 'text-red-600 bg-red-100'
      case 'vulnerability': return 'text-red-600 bg-red-100'
      case 'security_hotspot': return 'text-orange-600 bg-orange-100'
      case 'code_smell': return 'text-yellow-600 bg-yellow-100'
      case 'duplication': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Calidad de Código</h2>
        <div className="space-x-2">
          <button
            onClick={generateCodeQualityReport}
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
              a.download = 'code-quality-data.json'
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Calidad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación General</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.overallScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Cobertura</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.coverage}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Mantenibilidad</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.maintainability}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Seguridad</h4>
              <p className="text-2xl font-bold text-purple-600">{report.summary.security}/100</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de Calidad</h3>
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
                {metric.filePath && (
                  <p className="text-xs text-gray-500">{metric.filePath}:{metric.lineNumber}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Problemas de Código</h3>
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
                  <p className="text-xs text-gray-500">{issue.filePath}:{issue.lineNumber} • {issue.effort}</p>
                  {issue.status === 'open' && (
                    <div className="space-x-2">
                      <button
                        onClick={() => resolveIssue(issue.id, 'user')}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Resolver
                      </button>
                      <button
                        onClick={() => markAsFalsePositive(issue.id, 'user')}
                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Falso Positivo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
