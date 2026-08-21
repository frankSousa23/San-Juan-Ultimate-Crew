/* eslint-disable */
import React, { useRef, useEffect, useState } from 'react'

// Utilidades de rendimiento
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()
  private observers: PerformanceObserver[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Medir tiempo de ejecución
  measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    this.metrics.set(name, end - start)
    return result
  }

  // Medir tiempo de ejecución asíncrono
  async measureTimeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    this.metrics.set(name, end - start)
    return result
  }

  // Obtener métricas
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  // Limpiar métricas
  clearMetrics(): void {
    this.metrics.clear()
  }
}

// Hook para medir rendimiento
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current += 1
    const renderTime = Date.now() - startTime.current

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times in ${renderTime}ms`)
    }
  })

  return { renderCount: renderCount.current }
}

// Optimización de bundle
export const bundleOptimization = {
  // Lazy load de componentes
  lazyLoad: (importFn: () => Promise<any>) => {
    return React.lazy(importFn)
  },

  // Code splitting por rutas
  routeSplitting: {
    Dashboard: () => import('../pages/Dashboard'),
    Roster: () => import('../pages/Roster'),
    Events: () => import('../pages/Events'),
    Communications: () => import('../pages/Communications'),
    Finances: () => import('../pages/Finances'),
    Statistics: () => import('../pages/Statistics'),
    Injuries: () => import('../pages/Injuries'),
    Rivals: () => import('../pages/Rivals'),
    Plays: () => import('../pages/Plays'),
    Resources: () => import('../pages/Resources'),
  },

  // Preload de rutas críticas
  preloadCriticalRoutes: () => {
    const criticalRoutes = ['Dashboard', 'Roster', 'Events']
    criticalRoutes.forEach(route => {
      (bundleOptimization.routeSplitting as any)[route]()
    })
  },
}

// Optimización de memoria
export const memoryOptimization = {
  // Limpiar referencias
  cleanup: (refs: React.MutableRefObject<any>[]) => {
    refs.forEach(ref => {
      if (ref.current) {
        ref.current = null
      }
    })
  },

  // Debounce para eventos
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T => {
    let timeout: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }) as T
  },

  // Throttle para eventos
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }) as T
  },
}

// Optimización de red
export const networkOptimization = {
  // Batch de requests
  batchRequests: async <T,>(
    requests: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> => {
    const results: T[] = []
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(req => req()))
      results.push(...batchResults)
    }
    
    return results
  },

  // Retry con backoff
  retryWithBackoff: async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError!
  },
}

// Optimización de DOM
export const domOptimization = {
  // Batch de actualizaciones DOM
  batchDOMUpdates: (updates: (() => void)[]) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update())
    })
  },

  // Virtual scrolling
  virtualScroll: (items: any[], containerHeight: number, itemHeight: number) => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const totalHeight = items.length * itemHeight
    
    return {
      visibleCount,
      totalHeight,
      getVisibleItems: (scrollTop: number) => {
        const startIndex = Math.floor(scrollTop / itemHeight)
        const endIndex = Math.min(startIndex + visibleCount, items.length)
        return items.slice(startIndex, endIndex)
      }
    }
  },
}

// Métricas de rendimiento
export const performanceMetrics = {
  // Tiempo de carga inicial
  measureInitialLoad: () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = performance.now()
        console.log(`Initial load time: ${loadTime}ms`)
      })
    }
  },

  // Tiempo de renderizado
  measureRenderTime: (componentName: string) => {
    const start = performance.now()
    return () => {
      const end = performance.now()
      console.log(`${componentName} render time: ${end - start}ms`)
    }
  },

  // Uso de memoria
  measureMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
    return null
  },
}

// Hook para optimización automática
export function usePerformanceOptimization() {
  const [isOptimized, setIsOptimized] = useState(false)

  useEffect(() => {
    // Aplicar optimizaciones
    const optimizations = [
      () => bundleOptimization.preloadCriticalRoutes(),
      () => performanceMetrics.measureInitialLoad(),
    ]

    optimizations.forEach(opt => {
      try {
        opt()
      } catch (error) {
        console.warn('Performance optimization failed:', error)
      }
    })

    setIsOptimized(true)
  }, [])

  return { isOptimized }
}
