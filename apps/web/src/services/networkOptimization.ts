import React, { useState, useEffect, useCallback } from 'react'

// Servicio de optimización de red
export interface NetworkOptimizationOptions {
  maxConcurrentRequests?: number
  requestTimeout?: number
  retryAttempts?: number
  retryDelay?: number
  enableCompression?: boolean
  enableCaching?: boolean
  cacheTimeout?: number
}

export interface RequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
  cache?: boolean
  priority?: 'low' | 'normal' | 'high'
}

export interface NetworkStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  cacheHitRate: number
  bandwidthUsed: number
}

// Clase para optimización de red
export class NetworkOptimizationService {
  private static instance: NetworkOptimizationService
  private options: Required<NetworkOptimizationOptions>
  private requestQueue: any[] = []
  private activeRequests = new Set<string>()
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private stats: NetworkStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    bandwidthUsed: 0,
  }

  constructor(options: NetworkOptimizationOptions = {}) {
    this.options = {
      maxConcurrentRequests: options.maxConcurrentRequests || 6,
      requestTimeout: options.requestTimeout || 10000,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      enableCompression: options.enableCompression || true,
      enableCaching: options.enableCaching || true,
      cacheTimeout: options.cacheTimeout || 300000, // 5 minutos
    }
  }

  static getInstance(options?: NetworkOptimizationOptions): NetworkOptimizationService {
    if (!NetworkOptimizationService.instance) {
      NetworkOptimizationService.instance = new NetworkOptimizationService(options)
    }
    return NetworkOptimizationService.instance
  }

  // Realizar request optimizado
  async request<T>(config: RequestConfig): Promise<T> {
    const requestId = this.generateRequestId(config)
    
    // Verificar cache
    if (config.cache !== false && this.options.enableCaching) {
      const cached = this.getFromCache(requestId)
      if (cached) {
        this.stats.cacheHitRate = (this.stats.cacheHitRate + 1) / 2
        return cached as T
      }
    }

    // Agregar a cola si hay demasiadas requests activas
    if (this.activeRequests.size >= this.options.maxConcurrentRequests) {
      return this.queueRequest(config) as Promise<T>
    }

    return this.executeRequest(config, requestId)
  }

  // Ejecutar request
  private async executeRequest<T>(config: RequestConfig, requestId: string): Promise<T> {
    const startTime = Date.now()
    this.activeRequests.add(requestId)
    this.stats.totalRequests++

    try {
      const response = await this.performRequest(config)
      const responseTime = Date.now() - startTime
      
      this.updateStats(true, responseTime)
      
      // Guardar en cache
      if (config.cache !== false && this.options.enableCaching) {
        this.setCache(requestId, response, this.options.cacheTimeout)
      }

      return response as T
    } catch (error) {
      const responseTime = Date.now() - startTime
      this.updateStats(false, responseTime)
      
      // Reintentar si es necesario
      if (config.retries !== 0) {
        return this.retryRequest(config, requestId)
      }
      
      throw error
    } finally {
      this.activeRequests.delete(requestId)
      this.processQueue()
    }
  }

  // Realizar request HTTP
  private async performRequest<T>(config: RequestConfig): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.options.requestTimeout)

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.options.enableCompression && { 'Accept-Encoding': 'gzip, deflate, br' }),
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Reintentar request
  private async retryRequest<T>(config: RequestConfig, requestId: string): Promise<T> {
    const retries = config.retries || this.options.retryAttempts
    let lastError: Error

    for (let i = 0; i < retries; i++) {
      try {
        await this.delay(this.options.retryDelay * Math.pow(2, i)) // Exponential backoff
        return await this.executeRequest(config, requestId)
      } catch (error) {
        lastError = error as Error
      }
    }

    throw lastError!
  }

  // Cola de requests
  private async queueRequest<T>(config: RequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        ...config,
        resolve,
        reject,
      } as any)
    })
  }

  // Procesar cola
  private processQueue(): void {
    if (this.requestQueue.length > 0 && this.activeRequests.size < this.options.maxConcurrentRequests) {
      const request = this.requestQueue.shift()!
      this.executeRequest(request, this.generateRequestId(request))
        .then(request.resolve)
        .catch(request.reject)
    }
  }

  // Generar ID de request
  private generateRequestId(config: RequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.body || {})}`
  }

  // Cache
  private getFromCache<T>(key: string): T | null {
    const cached = this.requestCache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T
    }
    this.requestCache.delete(key)
    return null
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  // Actualizar estadísticas
  private updateStats(success: boolean, responseTime: number): void {
    if (success) {
      this.stats.successfulRequests++
    } else {
      this.stats.failedRequests++
    }

    // Actualizar tiempo promedio de respuesta
    const total = this.stats.successfulRequests + this.stats.failedRequests
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (total - 1) + responseTime) / total
  }

  // Delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Batch de requests
  async batchRequests<T>(requests: RequestConfig[]): Promise<T[]> {
    const promises = requests.map(request => this.request<T>(request))
    return Promise.all(promises)
  }

  // Obtener estadísticas
  getStats(): NetworkStats {
    return { ...this.stats }
  }

  // Limpiar cache
  clearCache(): void {
    this.requestCache.clear()
  }

  // Limpiar estadísticas
  clearStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      bandwidthUsed: 0,
    }
  }

  // Limpiar cola
  clearQueue(): void {
    this.requestQueue = []
  }
}

// Instancia global del servicio
export const networkOptimization = NetworkOptimizationService.getInstance()

// Hook para usar optimización de red
export function useNetworkOptimization() {
  const [stats, setStats] = useState<NetworkStats>(networkOptimization.getStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(networkOptimization.getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const request = useCallback(<T>(config: RequestConfig) => {
    return networkOptimization.request<T>(config)
  }, [])

  const batchRequests = useCallback(<T>(requests: RequestConfig[]) => {
    return networkOptimization.batchRequests<T>(requests)
  }, [])

  const clearCache = useCallback(() => {
    networkOptimization.clearCache()
  }, [])

  const clearStats = useCallback(() => {
    networkOptimization.clearStats()
    setStats(networkOptimization.getStats())
  }, [])

  const clearQueue = useCallback(() => {
    networkOptimization.clearQueue()
  }, [])

  return {
    stats,
    request,
    batchRequests,
    clearCache,
    clearStats,
    clearQueue,
  }
}

// Hook para request con optimizaciones
export function useOptimizedRequest<T>(
  config: RequestConfig,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { request } = useNetworkOptimization()

  const executeRequest = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await request<T>(config)
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [config, request])

  useEffect(() => {
    executeRequest()
  }, deps)

  return { data, loading, error, refetch: executeRequest }
}

// Hook para batch de requests
export function useOptimizedBatchRequests<T>(
  requests: RequestConfig[],
  deps: any[] = []
) {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { batchRequests } = useNetworkOptimization()

  const executeBatch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const results = await batchRequests<T>(requests)
      setData(results)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [requests, batchRequests])

  useEffect(() => {
    executeBatch()
  }, deps)

  return { data, loading, error, refetch: executeBatch }
}
