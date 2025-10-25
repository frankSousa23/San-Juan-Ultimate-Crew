import React, { useState, useEffect, useCallback } from 'react'

// Servicio de monitoreo de rendimiento de CPU
export interface CPUPerformanceMetric {
  id: string
  type: 'cpu_usage' | 'cpu_frequency' | 'cpu_temperature' | 'cpu_cores' | 'cpu_load' | 'cpu_context_switches'
  name: string
  value: number
  unit: string
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  timestamp: Date
}

export interface CPUPerformanceEvent {
  id: string
  type: 'high_cpu_usage' | 'cpu_throttling' | 'thermal_throttling' | 'context_switch_spike' | 'cpu_frequency_drop' | 'cpu_overload'
  message: string
  cpuUsage: number
  cpuTemperature: number
  timestamp: Date
  context: Record<string, any>
}

export interface CPUPerformanceReport {
  id: string
  timestamp: Date
  summary: {
    overallScore: number
    averageCPUUsage: number
    peakCPUUsage: number
    cpuTemperature: number
    cpuFrequency: number
    contextSwitches: number
    cpuLoad: number
    thermalThrottling: number
  }
  metrics: CPUPerformanceMetric[]
  events: CPUPerformanceEvent[]
  recommendations: string[]
  trends: {
    last24h: number
    last7d: number
    last30d: number
  }
}

// Clase principal del servicio de monitoreo de rendimiento de CPU
export class CPUPerformanceService {
  private static instance: CPUPerformanceService
  private metrics: CPUPerformanceMetric[] = []
  private events: CPUPerformanceEvent[] = []
  private isInitialized = false

  private constructor() {
    this.initializeCPUPerformanceMonitoring()
  }

  static getInstance(): CPUPerformanceService {
    if (!CPUPerformanceService.instance) {
      CPUPerformanceService.instance = new CPUPerformanceService()
    }
    return CPUPerformanceService.instance
  }

  // Inicializar monitoreo de rendimiento de CPU
  private initializeCPUPerformanceMonitoring(): void {
    this.analyzeCPUUsage()
    this.analyzeCPUFrequency()
    this.analyzeCPUTemperature()
    this.analyzeCPUCores()
    this.analyzeCPULoad()
    this.analyzeCPUContextSwitches()
    this.detectCPUIssues()

    this.isInitialized = true
  }

  // Analizar uso de CPU
  private analyzeCPUUsage(): void {
    // Simular análisis de uso de CPU
    const cpuUsageMetrics = [
      {
        id: 'cpu-usage-1',
        type: 'cpu_usage' as const,
        name: 'CPU Usage',
        value: 45,
        unit: '%',
        threshold: 80,
        status: 'pass' as const,
        description: 'Overall CPU usage percentage',
        timestamp: new Date(),
      },
      {
        id: 'cpu-usage-2',
        type: 'cpu_usage' as const,
        name: 'User CPU Usage',
        value: 30,
        unit: '%',
        threshold: 70,
        status: 'pass' as const,
        description: 'CPU usage by user processes',
        timestamp: new Date(),
      },
      {
        id: 'cpu-usage-3',
        type: 'cpu_usage' as const,
        name: 'System CPU Usage',
        value: 15,
        unit: '%',
        threshold: 30,
        status: 'pass' as const,
        description: 'CPU usage by system processes',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...cpuUsageMetrics)
  }

  // Analizar frecuencia de CPU
  private analyzeCPUFrequency(): void {
    // Simular análisis de frecuencia de CPU
    const cpuFrequencyMetrics = [
      {
        id: 'cpu-frequency-1',
        type: 'cpu_frequency' as const,
        name: 'CPU Frequency',
        value: 3200,
        unit: 'MHz',
        threshold: 2000,
        status: 'pass' as const,
        description: 'Current CPU frequency',
        timestamp: new Date(),
      },
      {
        id: 'cpu-frequency-2',
        type: 'cpu_frequency' as const,
        name: 'Max CPU Frequency',
        value: 3600,
        unit: 'MHz',
        threshold: 3000,
        status: 'pass' as const,
        description: 'Maximum CPU frequency',
        timestamp: new Date(),
      },
      {
        id: 'cpu-frequency-3',
        type: 'cpu_frequency' as const,
        name: 'Min CPU Frequency',
        value: 800,
        unit: 'MHz',
        threshold: 1000,
        status: 'pass' as const,
        description: 'Minimum CPU frequency',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...cpuFrequencyMetrics)
  }

  // Analizar temperatura de CPU
  private analyzeCPUTemperature(): void {
    // Simular análisis de temperatura de CPU
    const cpuTemperatureMetrics = [
      {
        id: 'cpu-temperature-1',
        type: 'cpu_temperature' as const,
        name: 'CPU Temperature',
        value: 65,
        unit: '°C',
        threshold: 80,
        status: 'pass' as const,
        description: 'Current CPU temperature',
        timestamp: new Date(),
      },
      {
        id: 'cpu-temperature-2',
        type: 'cpu_temperature' as const,
        name: 'CPU Core 0 Temperature',
        value: 62,
        unit: '°C',
        threshold: 80,
        status: 'pass' as const,
        description: 'Temperature of CPU core 0',
        timestamp: new Date(),
      },
      {
        id: 'cpu-temperature-3',
        type: 'cpu_temperature' as const,
        name: 'CPU Core 1 Temperature',
        value: 68,
        unit: '°C',
        threshold: 80,
        status: 'pass' as const,
        description: 'Temperature of CPU core 1',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...cpuTemperatureMetrics)
  }

  // Analizar núcleos de CPU
  private analyzeCPUCores(): void {
    // Simular análisis de núcleos de CPU
    const cpuCoresMetrics = [
      {
        id: 'cpu-cores-1',
        type: 'cpu_cores' as const,
        name: 'Active CPU Cores',
        value: 4,
        unit: 'count',
        threshold: 8,
        status: 'pass' as const,
        description: 'Number of active CPU cores',
        timestamp: new Date(),
      },
      {
        id: 'cpu-cores-2',
        type: 'cpu_cores' as const,
        name: 'CPU Core Utilization',
        value: 75,
        unit: '%',
        threshold: 90,
        status: 'pass' as const,
        description: 'Average CPU core utilization',
        timestamp: new Date(),
      },
      {
        id: 'cpu-cores-3',
        type: 'cpu_cores' as const,
        name: 'CPU Core Load',
        value: 2.5,
        unit: 'load',
        threshold: 4.0,
        status: 'pass' as const,
        description: 'Average CPU core load',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...cpuCoresMetrics)
  }

  // Analizar carga de CPU
  private analyzeCPULoad(): void {
    // Simular análisis de carga de CPU
    const cpuLoadMetrics = [
      {
        id: 'cpu-load-1',
        type: 'cpu_load' as const,
        name: '1-Minute Load Average',
        value: 1.2,
        unit: 'load',
        threshold: 2.0,
        status: 'pass' as const,
        description: '1-minute load average',
        timestamp: new Date(),
      },
      {
        id: 'cpu-load-2',
        type: 'cpu_load' as const,
        name: '5-Minute Load Average',
        value: 1.5,
        unit: 'load',
        threshold: 2.0,
        status: 'pass' as const,
        description: '5-minute load average',
        timestamp: new Date(),
      },
      {
        id: 'cpu-load-3',
        type: 'cpu_load' as const,
        name: '15-Minute Load Average',
        value: 1.8,
        unit: 'load',
        threshold: 2.0,
        status: 'pass' as const,
        description: '15-minute load average',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...cpuLoadMetrics)
  }

  // Analizar context switches de CPU
  private analyzeCPUContextSwitches(): void {
    // Simular análisis de context switches de CPU
    const cpuContextSwitchesMetrics = [
      {
        id: 'cpu-context-switches-1',
        type: 'cpu_context_switches' as const,
        name: 'Context Switches',
        value: 1000,
        unit: 'switches/s',
        threshold: 2000,
        status: 'pass' as const,
        description: 'Number of context switches per second',
        timestamp: new Date(),
      },
      {
        id: 'cpu-context-switches-2',
        type: 'cpu_context_switches' as const,
        name: 'Voluntary Context Switches',
        value: 800,
        unit: 'switches/s',
        threshold: 1500,
        status: 'pass' as const,
        description: 'Number of voluntary context switches per second',
        timestamp: new Date(),
      },
      {
        id: 'cpu-context-switches-3',
        type: 'cpu_context_switches' as const,
        name: 'Involuntary Context Switches',
        value: 200,
        unit: 'switches/s',
        threshold: 500,
        status: 'pass' as const,
        description: 'Number of involuntary context switches per second',
        timestamp: new Date(),
      },
    ]

    this.metrics.push(...cpuContextSwitchesMetrics)
  }

  // Detectar problemas de CPU
  private detectCPUIssues(): void {
    // Simular detección de problemas de CPU
    const cpuIssues = [
      {
        id: 'cpu-issue-1',
        type: 'high_cpu_usage' as const,
        message: 'High CPU usage detected',
        cpuUsage: 85,
        cpuTemperature: 70,
        timestamp: new Date(),
        context: {
          process: 'node',
          pid: 1234,
          duration: 30,
        },
      },
      {
        id: 'cpu-issue-2',
        type: 'cpu_throttling' as const,
        message: 'CPU throttling detected',
        cpuUsage: 60,
        cpuTemperature: 75,
        timestamp: new Date(),
        context: {
          throttling: 20,
          frequency: 2400,
          maxFrequency: 3600,
        },
      },
      {
        id: 'cpu-issue-3',
        type: 'thermal_throttling' as const,
        message: 'Thermal throttling detected',
        cpuUsage: 50,
        cpuTemperature: 85,
        timestamp: new Date(),
        context: {
          temperature: 85,
          threshold: 80,
          frequency: 2000,
        },
      },
      {
        id: 'cpu-issue-4',
        type: 'context_switch_spike' as const,
        message: 'Context switch spike detected',
        cpuUsage: 40,
        cpuTemperature: 65,
        timestamp: new Date(),
        context: {
          contextSwitches: 3000,
          threshold: 2000,
          duration: 10,
        },
      },
      {
        id: 'cpu-issue-5',
        type: 'cpu_frequency_drop' as const,
        message: 'CPU frequency drop detected',
        cpuUsage: 30,
        cpuTemperature: 60,
        timestamp: new Date(),
        context: {
          currentFrequency: 1600,
          maxFrequency: 3600,
          drop: 55,
        },
      },
      {
        id: 'cpu-issue-6',
        type: 'cpu_overload' as const,
        message: 'CPU overload detected',
        cpuUsage: 95,
        cpuTemperature: 80,
        timestamp: new Date(),
        context: {
          load: 4.5,
          threshold: 4.0,
          processes: 50,
        },
      },
    ]

    this.events.push(...cpuIssues)
  }

  // Obtener eventos por tipo
  getEventsByType(type: CPUPerformanceEvent['type']): CPUPerformanceEvent[] {
    return this.events.filter(event => event.type === type)
  }

  // Obtener métricas por tipo
  getMetricsByType(type: CPUPerformanceMetric['type']): CPUPerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  // Obtener métricas por estado
  getMetricsByStatus(status: CPUPerformanceMetric['status']): CPUPerformanceMetric[] {
    return this.metrics.filter(metric => metric.status === status)
  }

  // Generar reporte de rendimiento de CPU
  generateCPUPerformanceReport(): CPUPerformanceReport {
    const summary = {
      overallScore: this.calculateOverallScore(),
      averageCPUUsage: this.getAverageCPUUsage(),
      peakCPUUsage: this.getPeakCPUUsage(),
      cpuTemperature: this.getAverageCPUTemperature(),
      cpuFrequency: this.getAverageCPUFrequency(),
      contextSwitches: this.getAverageContextSwitches(),
      cpuLoad: this.getAverageCPULoad(),
      thermalThrottling: this.events.filter(e => e.type === 'thermal_throttling').length,
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
      id: `cpu_performance_report_${Date.now()}`,
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

  // Obtener uso promedio de CPU
  private getAverageCPUUsage(): number {
    const cpuUsageMetrics = this.metrics.filter(m => m.type === 'cpu_usage')
    if (cpuUsageMetrics.length === 0) return 0

    const total = cpuUsageMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / cpuUsageMetrics.length)
  }

  // Obtener uso pico de CPU
  private getPeakCPUUsage(): number {
    const cpuUsageEvents = this.events.filter(e => e.type === 'high_cpu_usage')
    if (cpuUsageEvents.length === 0) return 0

    const peak = Math.max(...cpuUsageEvents.map(e => e.cpuUsage))
    return peak
  }

  // Obtener temperatura promedio de CPU
  private getAverageCPUTemperature(): number {
    const cpuTemperatureMetrics = this.metrics.filter(m => m.type === 'cpu_temperature')
    if (cpuTemperatureMetrics.length === 0) return 0

    const total = cpuTemperatureMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / cpuTemperatureMetrics.length)
  }

  // Obtener frecuencia promedio de CPU
  private getAverageCPUFrequency(): number {
    const cpuFrequencyMetrics = this.metrics.filter(m => m.type === 'cpu_frequency')
    if (cpuFrequencyMetrics.length === 0) return 0

    const total = cpuFrequencyMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / cpuFrequencyMetrics.length)
  }

  // Obtener context switches promedio
  private getAverageContextSwitches(): number {
    const contextSwitchesMetrics = this.metrics.filter(m => m.type === 'cpu_context_switches')
    if (contextSwitchesMetrics.length === 0) return 0

    const total = contextSwitchesMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / contextSwitchesMetrics.length)
  }

  // Obtener carga promedio de CPU
  private getAverageCPULoad(): number {
    const cpuLoadMetrics = this.metrics.filter(m => m.type === 'cpu_load')
    if (cpuLoadMetrics.length === 0) return 0

    const total = cpuLoadMetrics.reduce((sum, metric) => sum + metric.value, 0)
    return Math.round(total / cpuLoadMetrics.length * 100) / 100
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const warningMetrics = this.metrics.filter(m => m.status === 'warning')
    if (warningMetrics.length > 0) {
      recommendations.push(`${warningMetrics.length} métricas de CPU en advertencia`)
    }

    const failedMetrics = this.metrics.filter(m => m.status === 'fail')
    if (failedMetrics.length > 0) {
      recommendations.push(`${failedMetrics.length} métricas de CPU fallaron`)
    }

    const highCPUUsage = this.events.filter(e => e.type === 'high_cpu_usage')
    if (highCPUUsage.length > 0) {
      recommendations.push(`${highCPUUsage.length} casos de alto uso de CPU detectados`)
    }

    const cpuThrottling = this.events.filter(e => e.type === 'cpu_throttling')
    if (cpuThrottling.length > 0) {
      recommendations.push(`${cpuThrottling.length} casos de throttling de CPU detectados`)
    }

    const thermalThrottling = this.events.filter(e => e.type === 'thermal_throttling')
    if (thermalThrottling.length > 0) {
      recommendations.push(`${thermalThrottling.length} casos de throttling térmico detectados`)
    }

    const contextSwitchSpikes = this.events.filter(e => e.type === 'context_switch_spike')
    if (contextSwitchSpikes.length > 0) {
      recommendations.push(`${contextSwitchSpikes.length} picos de context switches detectados`)
    }

    const cpuFrequencyDrops = this.events.filter(e => e.type === 'cpu_frequency_drop')
    if (cpuFrequencyDrops.length > 0) {
      recommendations.push(`${cpuFrequencyDrops.length} caídas de frecuencia de CPU detectadas`)
    }

    const cpuOverloads = this.events.filter(e => e.type === 'cpu_overload')
    if (cpuOverloads.length > 0) {
      recommendations.push(`${cpuOverloads.length} sobrecargas de CPU detectadas`)
    }

    return recommendations
  }

  // Obtener todos los eventos
  getAllEvents(): CPUPerformanceEvent[] {
    return [...this.events]
  }

  // Obtener todas las métricas
  getAllMetrics(): CPUPerformanceMetric[] {
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
      report: this.generateCPUPerformanceReport(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const cpuPerformanceService = CPUPerformanceService.getInstance()

// Hook para usar el servicio de monitoreo de rendimiento de CPU
export function useCPUPerformance() {
  const [events, setEvents] = useState<CPUPerformanceEvent[]>([])
  const [metrics, setMetrics] = useState<CPUPerformanceMetric[]>([])
  const [report, setReport] = useState<CPUPerformanceReport | null>(null)

  useEffect(() => {
    setEvents(cpuPerformanceService.getAllEvents())
    setMetrics(cpuPerformanceService.getAllMetrics())
    setReport(cpuPerformanceService.generateCPUPerformanceReport())
  }, [])

  const getEventsByType = useCallback((type: CPUPerformanceEvent['type']) => {
    return cpuPerformanceService.getEventsByType(type)
  }, [])

  const getMetricsByType = useCallback((type: CPUPerformanceMetric['type']) => {
    return cpuPerformanceService.getMetricsByType(type)
  }, [])

  const getMetricsByStatus = useCallback((status: CPUPerformanceMetric['status']) => {
    return cpuPerformanceService.getMetricsByStatus(status)
  }, [])

  const generateCPUPerformanceReport = useCallback(() => {
    const newReport = cpuPerformanceService.generateCPUPerformanceReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    cpuPerformanceService.clearData()
    setEvents([])
    setMetrics([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return cpuPerformanceService.exportData()
  }, [])

  return {
    events,
    metrics,
    report,
    getEventsByType,
    getMetricsByType,
    getMetricsByStatus,
    generateCPUPerformanceReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de monitoreo de rendimiento de CPU
interface CPUPerformanceDashboardProps {
  className?: string
}

export const CPUPerformanceDashboard: React.FC<CPUPerformanceDashboardProps> = ({ className = '' }) => {
  const { events, metrics, report, generateCPUPerformanceReport, clearData, exportData } = useCPUPerformance()

  const getTypeColor = (type: CPUPerformanceEvent['type']) => {
    switch (type) {
      case 'high_cpu_usage': return 'text-red-600 bg-red-100'
      case 'cpu_throttling': return 'text-yellow-600 bg-yellow-100'
      case 'thermal_throttling': return 'text-orange-600 bg-orange-100'
      case 'context_switch_spike': return 'text-blue-600 bg-blue-100'
      case 'cpu_frequency_drop': return 'text-purple-600 bg-purple-100'
      case 'cpu_overload': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: CPUPerformanceMetric['status']) => {
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
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Rendimiento de CPU</h2>
        <div className="space-x-2">
          <button
            onClick={generateCPUPerformanceReport}
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
              a.download = 'cpu-performance-data.json'
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Rendimiento de CPU</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Puntuación General</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.overallScore}/100</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Uso de CPU</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.averageCPUUsage}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Temperatura</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.cpuTemperature}°C</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Frecuencia</h4>
              <p className="text-2xl font-bold text-orange-600">{report.summary.cpuFrequency}MHz</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Eventos de CPU Recientes</h3>
          <div className="space-y-2">
            {events.slice(-5).map(event => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{event.message}</h4>
                    <p className="text-xs text-gray-600">Uso: {event.cpuUsage}% / Temp: {event.cpuTemperature}°C</p>
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">Métricas de CPU</h3>
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
