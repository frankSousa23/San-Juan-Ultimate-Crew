import React, { useState, useEffect, useCallback } from 'react'

// Servicio de monitoreo de errores y logging avanzado
export interface ErrorEvent {
  id: string
  type: 'javascript' | 'network' | 'promise' | 'custom'
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  timestamp: Date
  userId?: string
  sessionId: string
  url: string
  userAgent: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context: Record<string, any>
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface LogEvent {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  timestamp: Date
  userId?: string
  sessionId: string
  category: string
  context: Record<string, any>
  metadata?: Record<string, any>
}

export interface ErrorReport {
  id: string
  timestamp: Date
  summary: {
    totalErrors: number
    criticalErrors: number
    highErrors: number
    mediumErrors: number
    lowErrors: number
    resolvedErrors: number
    unresolvedErrors: number
    errorRate: number
  }
  errors: ErrorEvent[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
  recommendations: string[]
}

export interface LogReport {
  id: string
  timestamp: Date
  summary: {
    totalLogs: number
    debugLogs: number
    infoLogs: number
    warnLogs: number
    errorLogs: number
    fatalLogs: number
  }
  logs: LogEvent[]
  patterns: {
    mostCommonErrors: Array<{ message: string; count: number }>
    errorFrequency: Array<{ hour: number; count: number }>
  }
}

// Clase principal del servicio de monitoreo de errores
export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService
  private errors: ErrorEvent[] = []
  private logs: LogEvent[] = []
  private isInitialized = false
  private sessionId: string
  private userId?: string

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.userId = this.getUserId()
    this.initializeErrorHandling()
    this.initializeLogging()
  }

  static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService()
    }
    return ErrorMonitoringService.instance
  }

  // Inicializar manejo de errores
  private initializeErrorHandling(): void {
    if (typeof window === 'undefined') return

    // Capturar errores de JavaScript
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        severity: this.determineSeverity(event.error),
        context: {
          error: event.error,
          target: event.target,
        },
      })
    })

    // Capturar errores de promesas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        severity: 'high',
        context: {
          reason: event.reason,
          promise: event.promise,
        },
      })
    })

    // Capturar errores de red
    this.setupNetworkErrorHandling()

    this.isInitialized = true
  }

  // Configurar manejo de errores de red
  private setupNetworkErrorHandling(): void {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (!response.ok) {
          this.captureError({
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            severity: response.status >= 500 ? 'high' : 'medium',
            context: {
              url: args[0],
              status: response.status,
              statusText: response.statusText,
            },
          })
        }
        return response
      } catch (error) {
        this.captureError({
          type: 'network',
          message: error instanceof Error ? error.message : 'Network error',
          stack: error instanceof Error ? error.stack : undefined,
          severity: 'high',
          context: {
            url: args[0],
            error,
          },
        })
        throw error
      }
    }
  }

  // Inicializar sistema de logging
  private initializeLogging(): void {
    // Interceptar console methods
    const originalConsole = { ...console }
    
    console.debug = (...args) => {
      this.log('debug', args.join(' '), { originalArgs: args })
      originalConsole.debug(...args)
    }

    console.info = (...args) => {
      this.log('info', args.join(' '), { originalArgs: args })
      originalConsole.info(...args)
    }

    console.warn = (...args) => {
      this.log('warn', args.join(' '), { originalArgs: args })
      originalConsole.warn(...args)
    }

    console.error = (...args) => {
      this.log('error', args.join(' '), { originalArgs: args })
      originalConsole.error(...args)
    }
  }

  // Capturar error
  captureError(errorData: {
    type: ErrorEvent['type']
    message: string
    stack?: string
    filename?: string
    lineno?: number
    colno?: number
    severity: ErrorEvent['severity']
    context: Record<string, any>
  }): void {
    const error: ErrorEvent = {
      id: this.generateErrorId(),
      type: errorData.type,
      message: errorData.message,
      stack: errorData.stack,
      filename: errorData.filename,
      lineno: errorData.lineno,
      colno: errorData.colno,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity: errorData.severity,
      context: errorData.context,
      resolved: false,
    }

    this.errors.push(error)

    // Enviar a servidor (en producción)
    this.sendErrorToServer(error)

    // Log del error
    this.log('error', `Error captured: ${errorData.message}`, {
      errorId: error.id,
      severity: errorData.severity,
      type: errorData.type,
    })
  }

  // Registrar log
  log(level: LogEvent['level'], message: string, context: Record<string, any> = {}, category: string = 'general'): void {
    const logEvent: LogEvent = {
      id: this.generateLogId(),
      level,
      message,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      category,
      context,
    }

    this.logs.push(logEvent)

    // Enviar a servidor (en producción)
    this.sendLogToServer(logEvent)
  }

  // Determinar severidad del error
  private determineSeverity(error: Error): ErrorEvent['severity'] {
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high'
    }
    if (error.name === 'SyntaxError') {
      return 'critical'
    }
    return 'medium'
  }

  // Generar ID de sesión
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generar ID de error
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generar ID de log
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Obtener ID de usuario
  private getUserId(): string | undefined {
    return localStorage.getItem('userId') || undefined
  }

  // Enviar error al servidor
  private sendErrorToServer(error: ErrorEvent): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Error sent to server:', error)
    }
    // En producción, esto enviaría el error a un servicio como Sentry
  }

  // Enviar log al servidor
  private sendLogToServer(log: LogEvent): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Log sent to server:', log)
    }
    // En producción, esto enviaría el log a un servicio como LogRocket
  }

  // Obtener errores por severidad
  getErrorsBySeverity(severity: ErrorEvent['severity']): ErrorEvent[] {
    return this.errors.filter(error => error.severity === severity)
  }

  // Obtener errores no resueltos
  getUnresolvedErrors(): ErrorEvent[] {
    return this.errors.filter(error => !error.resolved)
  }

  // Resolver error
  resolveError(errorId: string, resolvedBy: string): void {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      error.resolvedAt = new Date()
      error.resolvedBy = resolvedBy
    }
  }

  // Obtener logs por nivel
  getLogsByLevel(level: LogEvent['level']): LogEvent[] {
    return this.logs.filter(log => log.level === level)
  }

  // Obtener logs por categoría
  getLogsByCategory(category: string): LogEvent[] {
    return this.logs.filter(log => log.category === category)
  }

  // Generar reporte de errores
  generateErrorReport(): ErrorReport {
    const now = Date.now()
    const last24h = now - (24 * 60 * 60 * 1000)
    const last7d = now - (7 * 24 * 60 * 60 * 1000)
    const last30d = now - (30 * 24 * 60 * 60 * 1000)

    const summary = {
      totalErrors: this.errors.length,
      criticalErrors: this.errors.filter(e => e.severity === 'critical').length,
      highErrors: this.errors.filter(e => e.severity === 'high').length,
      mediumErrors: this.errors.filter(e => e.severity === 'medium').length,
      lowErrors: this.errors.filter(e => e.severity === 'low').length,
      resolvedErrors: this.errors.filter(e => e.resolved).length,
      unresolvedErrors: this.errors.filter(e => !e.resolved).length,
      errorRate: this.calculateErrorRate(),
    }

    const trends = {
      last24h: this.errors.filter(e => e.timestamp.getTime() > last24h).length,
      last7d: this.errors.filter(e => e.timestamp.getTime() > last7d).length,
      last30d: this.errors.filter(e => e.timestamp.getTime() > last30d).length,
    }

    const recommendations = this.generateErrorRecommendations()

    return {
      id: `error_report_${Date.now()}`,
      timestamp: new Date(),
      summary,
      errors: [...this.errors],
      trends,
      recommendations,
    }
  }

  // Generar reporte de logs
  generateLogReport(): LogReport {
    const summary = {
      totalLogs: this.logs.length,
      debugLogs: this.logs.filter(l => l.level === 'debug').length,
      infoLogs: this.logs.filter(l => l.level === 'info').length,
      warnLogs: this.logs.filter(l => l.level === 'warn').length,
      errorLogs: this.logs.filter(l => l.level === 'error').length,
      fatalLogs: this.logs.filter(l => l.level === 'fatal').length,
    }

    const patterns = {
      mostCommonErrors: this.getMostCommonErrors(),
      errorFrequency: this.getErrorFrequencyByHour(),
    }

    return {
      id: `log_report_${Date.now()}`,
      timestamp: new Date(),
      summary,
      logs: [...this.logs],
      patterns,
    }
  }

  // Calcular tasa de errores
  private calculateErrorRate(): number {
    // Simular cálculo de tasa de errores
    return (this.errors.length / 1000) * 100 // Por cada 1000 acciones
  }

  // Generar recomendaciones de errores
  private generateErrorRecommendations(): string[] {
    const recommendations: string[] = []

    const criticalErrors = this.errors.filter(e => e.severity === 'critical')
    if (criticalErrors.length > 0) {
      recommendations.push(`${criticalErrors.length} errores críticos requieren atención inmediata`)
    }

    const highErrors = this.errors.filter(e => e.severity === 'high')
    if (highErrors.length > 5) {
      recommendations.push(`${highErrors.length} errores de alta severidad detectados`)
    }

    const unresolvedErrors = this.errors.filter(e => !e.resolved)
    if (unresolvedErrors.length > 10) {
      recommendations.push(`${unresolvedErrors.length} errores sin resolver`)
    }

    const networkErrors = this.errors.filter(e => e.type === 'network')
    if (networkErrors.length > 0) {
      recommendations.push(`${networkErrors.length} errores de red detectados`)
    }

    return recommendations
  }

  // Obtener errores más comunes
  private getMostCommonErrors(): Array<{ message: string; count: number }> {
    const errorCounts = new Map<string, number>()
    
    this.errors.forEach(error => {
      const count = errorCounts.get(error.message) || 0
      errorCounts.set(error.message, count + 1)
    })

    return Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  // Obtener frecuencia de errores por hora
  private getErrorFrequencyByHour(): Array<{ hour: number; count: number }> {
    const hourCounts = new Map<number, number>()
    
    this.errors.forEach(error => {
      const hour = error.timestamp.getHours()
      const count = hourCounts.get(hour) || 0
      hourCounts.set(hour, count + 1)
    })

    return Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour)
  }

  // Obtener todos los errores
  getAllErrors(): ErrorEvent[] {
    return [...this.errors]
  }

  // Obtener todos los logs
  getAllLogs(): LogEvent[] {
    return [...this.logs]
  }

  // Limpiar datos
  clearData(): void {
    this.errors = []
    this.logs = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      errors: this.errors,
      logs: this.logs,
      errorReport: this.generateErrorReport(),
      logReport: this.generateLogReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const errorMonitoringService = ErrorMonitoringService.getInstance()

// Hook para usar el servicio de monitoreo de errores
export function useErrorMonitoring() {
  const [errors, setErrors] = useState<ErrorEvent[]>([])
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [errorReport, setErrorReport] = useState<ErrorReport | null>(null)
  const [logReport, setLogReport] = useState<LogReport | null>(null)

  useEffect(() => {
    setErrors(errorMonitoringService.getAllErrors())
    setLogs(errorMonitoringService.getAllLogs())
    setErrorReport(errorMonitoringService.generateErrorReport())
    setLogReport(errorMonitoringService.generateLogReport())
  }, [])

  const captureError = useCallback((errorData: {
    type: ErrorEvent['type']
    message: string
    stack?: string
    filename?: string
    lineno?: number
    colno?: number
    severity: ErrorEvent['severity']
    context: Record<string, any>
  }) => {
    errorMonitoringService.captureError(errorData)
    setErrors(errorMonitoringService.getAllErrors())
    setErrorReport(errorMonitoringService.generateErrorReport())
  }, [])

  const log = useCallback((level: LogEvent['level'], message: string, context: Record<string, any> = {}, category: string = 'general') => {
    errorMonitoringService.log(level, message, context, category)
    setLogs(errorMonitoringService.getAllLogs())
    setLogReport(errorMonitoringService.generateLogReport())
  }, [])

  const resolveError = useCallback((errorId: string, resolvedBy: string) => {
    errorMonitoringService.resolveError(errorId, resolvedBy)
    setErrors(errorMonitoringService.getAllErrors())
    setErrorReport(errorMonitoringService.generateErrorReport())
  }, [])

  const getErrorsBySeverity = useCallback((severity: ErrorEvent['severity']) => {
    return errorMonitoringService.getErrorsBySeverity(severity)
  }, [])

  const getUnresolvedErrors = useCallback(() => {
    return errorMonitoringService.getUnresolvedErrors()
  }, [])

  const getLogsByLevel = useCallback((level: LogEvent['level']) => {
    return errorMonitoringService.getLogsByLevel(level)
  }, [])

  const getLogsByCategory = useCallback((category: string) => {
    return errorMonitoringService.getLogsByCategory(category)
  }, [])

  const generateErrorReport = useCallback(() => {
    const report = errorMonitoringService.generateErrorReport()
    setErrorReport(report)
    return report
  }, [])

  const generateLogReport = useCallback(() => {
    const report = errorMonitoringService.generateLogReport()
    setLogReport(report)
    return report
  }, [])

  const clearData = useCallback(() => {
    errorMonitoringService.clearData()
    setErrors([])
    setLogs([])
    setErrorReport(null)
    setLogReport(null)
  }, [])

  const exportData = useCallback(() => {
    return errorMonitoringService.exportData()
  }, [])

  return {
    errors,
    logs,
    errorReport,
    logReport,
    captureError,
    log,
    resolveError,
    getErrorsBySeverity,
    getUnresolvedErrors,
    getLogsByLevel,
    getLogsByCategory,
    generateErrorReport,
    generateLogReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de monitoreo de errores
interface ErrorMonitoringDashboardProps {
  className?: string
}

export const ErrorMonitoringDashboard: React.FC<ErrorMonitoringDashboardProps> = ({ className = '' }) => {
  const { errors, logs, errorReport, logReport, resolveError, generateErrorReport, generateLogReport, clearData, exportData } = useErrorMonitoring()

  const getSeverityColor = (severity: ErrorEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getLevelColor = (level: LogEvent['level']) => {
    switch (level) {
      case 'fatal': return 'text-red-600 bg-red-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'warn': return 'text-yellow-600 bg-yellow-100'
      case 'info': return 'text-blue-600 bg-blue-100'
      case 'debug': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Monitoreo de Errores</h2>
        <div className="space-x-2">
          <button
            onClick={generateErrorReport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generar Reporte de Errores
          </button>
          <button
            onClick={generateLogReport}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Generar Reporte de Logs
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
              a.download = 'error-monitoring-data.json'
              a.click()
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Exportar Datos
          </button>
        </div>
      </div>

      {errorReport && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Errores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total</h4>
              <p className="text-2xl font-bold text-gray-800">{errorReport.summary.totalErrors}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Críticos</h4>
              <p className="text-2xl font-bold text-red-600">{errorReport.summary.criticalErrors}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Alta Severidad</h4>
              <p className="text-2xl font-bold text-orange-600">{errorReport.summary.highErrors}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Sin Resolver</h4>
              <p className="text-2xl font-bold text-yellow-600">{errorReport.summary.unresolvedErrors}</p>
            </div>
          </div>
        </div>
      )}

      {logReport && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Logs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total</h4>
              <p className="text-2xl font-bold text-gray-800">{logReport.summary.totalLogs}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Errores</h4>
              <p className="text-2xl font-bold text-red-600">{logReport.summary.errorLogs}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Advertencias</h4>
              <p className="text-2xl font-bold text-yellow-600">{logReport.summary.warnLogs}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Errores Recientes</h3>
          <div className="space-y-2">
            {errors.slice(-5).map(error => (
              <div key={error.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{error.message}</h4>
                    <p className="text-xs text-gray-600">{error.timestamp.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                      {error.severity}
                    </span>
                    {!error.resolved && (
                      <button
                        onClick={() => resolveError(error.id, 'user')}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Resolver
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">{error.type} • {error.url}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Logs Recientes</h3>
          <div className="space-y-2">
            {logs.slice(-5).map(log => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{log.message}</h4>
                    <p className="text-xs text-gray-600">{log.timestamp.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {log.category}
                    </span>
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
