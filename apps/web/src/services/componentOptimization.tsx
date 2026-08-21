/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react'

// Servicio de optimización de componentes
export interface ComponentOptimizationOptions {
  enableMemoization?: boolean
  enableLazyLoading?: boolean
  enableVirtualScrolling?: boolean
  enableCodeSplitting?: boolean
  maxRenderTime?: number
  enableProfiling?: boolean
}

export interface ComponentMetrics {
  name: string
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
  memoryUsage: number
  isOptimized: boolean
}

export interface OptimizationReport {
  componentName: string
  recommendations: string[]
  score: number
  metrics: ComponentMetrics
}

// Clase para optimización de componentes
export class ComponentOptimizationService {
  private static instance: ComponentOptimizationService
  private options: Required<ComponentOptimizationOptions>
  private componentMetrics = new Map<string, ComponentMetrics>()
  private renderTimes = new Map<string, number[]>()
  private optimizationReports = new Map<string, OptimizationReport>()

  constructor(options: ComponentOptimizationOptions = {}) {
    this.options = {
      enableMemoization: options.enableMemoization || true,
      enableLazyLoading: options.enableLazyLoading || true,
      enableVirtualScrolling: options.enableVirtualScrolling || true,
      enableCodeSplitting: options.enableCodeSplitting || true,
      maxRenderTime: options.maxRenderTime || 16, // 60fps
      enableProfiling: options.enableProfiling || true,
    }
  }

  static getInstance(options?: ComponentOptimizationOptions): ComponentOptimizationService {
    if (!ComponentOptimizationService.instance) {
      ComponentOptimizationService.instance = new ComponentOptimizationService(options)
    }
    return ComponentOptimizationService.instance
  }

  // Registrar renderizado de componente
  registerRender(componentName: string, renderTime: number): void {
    if (!this.options.enableProfiling) return

    const metrics = this.componentMetrics.get(componentName) || {
      name: componentName,
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      memoryUsage: 0,
      isOptimized: false,
    }

    metrics.renderCount++
    metrics.lastRenderTime = renderTime

    // Actualizar tiempo promedio
    const times = this.renderTimes.get(componentName) || []
    times.push(renderTime)
    if (times.length > 100) times.shift() // Mantener solo los últimos 100 renders
    this.renderTimes.set(componentName, times)

    metrics.averageRenderTime = times.reduce((sum, time) => sum + time, 0) / times.length

    // Actualizar uso de memoria
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
    }

    this.componentMetrics.set(componentName, metrics)

    // Generar reporte si es necesario
    if (metrics.renderCount % 10 === 0) {
      this.generateOptimizationReport(componentName)
    }
  }

  // Generar reporte de optimización
  generateOptimizationReport(componentName: string): OptimizationReport {
    const metrics = this.componentMetrics.get(componentName)
    if (!metrics) {
      throw new Error(`Component ${componentName} not found`)
    }

    const recommendations: string[] = []
    let score = 100

    // Evaluar métricas y generar recomendaciones
    if (metrics.averageRenderTime > this.options.maxRenderTime) {
      recommendations.push('Tiempo de renderizado alto. Considera usar React.memo()')
      score -= 20
    }

    if (metrics.renderCount > 100) {
      recommendations.push('Muchos re-renders. Considera optimizar dependencias de useEffect/useMemo')
      score -= 15
    }

    if (metrics.memoryUsage > 10) {
      recommendations.push('Uso de memoria alto. Considera lazy loading o virtual scrolling')
      score -= 10
    }

    if (metrics.renderCount > 50 && metrics.averageRenderTime > 10) {
      recommendations.push('Componente costoso. Considera code splitting')
      score -= 15
    }

    const report: OptimizationReport = {
      componentName,
      recommendations,
      score: Math.max(0, score),
      metrics: { ...metrics },
    }

    this.optimizationReports.set(componentName, report)
    return report
  }

  // Obtener métricas de componente
  getComponentMetrics(componentName: string): ComponentMetrics | null {
    return this.componentMetrics.get(componentName) || null
  }

  // Obtener todas las métricas
  getAllMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values())
  }

  // Obtener reportes de optimización
  getOptimizationReports(): OptimizationReport[] {
    return Array.from(this.optimizationReports.values())
  }

  // Obtener reporte de componente específico
  getOptimizationReport(componentName: string): OptimizationReport | null {
    return this.optimizationReports.get(componentName) || null
  }

  // Limpiar métricas
  clearMetrics(): void {
    this.componentMetrics.clear()
    this.renderTimes.clear()
    this.optimizationReports.clear()
  }

  // Exportar métricas
  exportMetrics(): string {
    return JSON.stringify({
      metrics: Array.from(this.componentMetrics.entries()),
      reports: Array.from(this.optimizationReports.entries()),
    }, null, 2)
  }

  // Importar métricas
  importMetrics(data: string): void {
    try {
      const parsed = JSON.parse(data)
      this.componentMetrics = new Map(parsed.metrics)
      this.optimizationReports = new Map(parsed.reports)
    } catch (error) {
      console.error('Error importing metrics:', error)
    }
  }
}

// Instancia global del servicio
export const componentOptimization = ComponentOptimizationService.getInstance()

// Hook para optimización de componentes
export function useComponentOptimization(componentName: string) {
  const [metrics, setMetrics] = useState<ComponentMetrics | null>(null)
  const [report, setReport] = useState<OptimizationReport | null>(null)
  const renderCount = useRef(0)
  const startTime = useRef(0)

  // Medir tiempo de renderizado
  useEffect(() => {
    startTime.current = performance.now()
  })

  useEffect(() => {
    const renderTime = performance.now() - startTime.current
    renderCount.current++

    componentOptimization.registerRender(componentName, renderTime)
    
    const currentMetrics = componentOptimization.getComponentMetrics(componentName)
    const currentReport = componentOptimization.getOptimizationReport(componentName)
    
    setMetrics(currentMetrics)
    setReport(currentReport)
  })

  const generateReport = useCallback(() => {
    return componentOptimization.generateOptimizationReport(componentName)
  }, [componentName])

  const clearMetrics = useCallback(() => {
    componentOptimization.clearMetrics()
    setMetrics(null)
    setReport(null)
  }, [])

  return {
    metrics,
    report,
    generateReport,
    clearMetrics,
    renderCount: renderCount.current,
  }
}

// HOC para optimización automática
export function withOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    memo?: boolean
    lazy?: boolean
    virtual?: boolean
    profiling?: boolean
  } = {}
) {
  const { memo = true, lazy = false, virtual = false, profiling = true } = options

  let OptimizedComponent = Component

  // Aplicar memoización
  if (memo) {
    OptimizedComponent = React.memo(OptimizedComponent) as unknown as React.ComponentType<P>
  }

  // Aplicar lazy loading
  if (lazy) {
    OptimizedComponent = React.lazy(() => Promise.resolve({ default: OptimizedComponent })) as unknown as React.ComponentType<P>
  }

  // Aplicar profiling
  if (profiling) {
    const ProfiledComponent = (props: P) => {
      const { metrics, report } = useComponentOptimization(Component.displayName || Component.name)
      
      if (process.env.NODE_ENV === 'development' && metrics) {
        console.log(`${Component.name} metrics:`, metrics)
        if (report && report.score < 80) {
          console.warn(`${Component.name} optimization recommendations:`, report.recommendations)
        }
      }

      return <OptimizedComponent {...props} />
    }

    ProfiledComponent.displayName = `withOptimization(${Component.displayName || Component.name})`
    return ProfiledComponent
  }

  return OptimizedComponent
}

// Hook para memoización inteligente
export function useSmartMemo<T>(value: T, deps: any[]): T {
  const [memoizedValue, setMemoizedValue] = useState<T>(value)
  const [lastDeps, setLastDeps] = useState<any[]>(deps)

  useEffect(() => {
    const hasChanged = deps.some((dep, index) => dep !== lastDeps[index])
    
    if (hasChanged) {
      setMemoizedValue(value)
      setLastDeps(deps)
    }
  }, [value, deps, lastDeps])

  return memoizedValue
}

// Hook para lazy loading inteligente
export function useSmartLazyLoad<T>(
  loadFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const loaded = useRef(false)

  const load = useCallback(async () => {
    if (loaded.current) return

    setLoading(true)
    setError(null)
    
    try {
      const result = await loadFn()
      setData(result)
      loaded.current = true
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  const reset = useCallback(() => {
    loaded.current = false
    setData(null)
    setError(null)
  }, [])

  return { data, loading, error, load, reset }
}

// Hook para virtual scrolling inteligente
export function useSmartVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)
  const [visibleItems, setVisibleItems] = useState<Array<{ item: T; index: number }>>([])

  useEffect(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )

    const visible = items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }))

    setVisibleItems(visible)
  }, [items, itemHeight, containerHeight, scrollTop, overscan])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight: items.length * itemHeight,
    handleScroll,
  }
}
