import React, { useState, useEffect, useCallback } from 'react'

// Sistema de cache inteligente y persistencia
export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  size: number
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  isPersistent: boolean
  compression?: 'gzip' | 'brotli' | 'lz4'
  checksum: string
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  evictionCount: number
  compressionRatio: number
  averageAccessTime: number
  memoryUsage: number
  persistentEntries: number
  volatileEntries: number
}

export interface CacheConfig {
  maxSize: number
  maxEntries: number
  defaultTTL: number
  compressionEnabled: boolean
  persistenceEnabled: boolean
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl'
  compressionThreshold: number
  batchSize: number
  cleanupInterval: number
}

export interface CacheOperation {
  id: string
  type: 'get' | 'set' | 'delete' | 'clear' | 'evict'
  key: string
  timestamp: number
  duration: number
  success: boolean
  error?: string
  size?: number
}

// Clase principal del servicio de cache inteligente
export class IntelligentCacheService {
  private static instance: IntelligentCacheService
  private cache: Map<string, CacheEntry> = new Map()
  private operations: CacheOperation[] = []
  private config: CacheConfig
  private isInitialized = false
  private cleanupTimer?: NodeJS.Timeout

  private constructor() {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 10000,
      defaultTTL: 3600000, // 1 hour
      compressionEnabled: true,
      persistenceEnabled: true,
      evictionPolicy: 'lru',
      compressionThreshold: 1024, // 1KB
      batchSize: 100,
      cleanupInterval: 300000, // 5 minutes
    }
    this.initializeIntelligentCache()
  }

  static getInstance(): IntelligentCacheService {
    if (!IntelligentCacheService.instance) {
      IntelligentCacheService.instance = new IntelligentCacheService()
    }
    return IntelligentCacheService.instance
  }

  // Inicializar cache inteligente
  private initializeIntelligentCache(): void {
    this.loadPersistentCache()
    this.startCleanupTimer()
    this.initializeCompression()
    this.isInitialized = true
  }

  // Cargar cache persistente
  private loadPersistentCache(): void {
    try {
      const persistentData = localStorage.getItem('intelligent_cache')
      if (persistentData) {
        const entries = JSON.parse(persistentData)
        entries.forEach((entry: CacheEntry) => {
          if (entry.isPersistent && this.isValidEntry(entry)) {
            this.cache.set(entry.key, entry)
          }
        })
      }
    } catch (error) {
      console.error('Error loading persistent cache:', error)
    }
  }

  // Guardar cache persistente
  private savePersistentCache(): void {
    try {
      const persistentEntries = Array.from(this.cache.values())
        .filter(entry => entry.isPersistent)
      localStorage.setItem('intelligent_cache', JSON.stringify(persistentEntries))
    } catch (error) {
      console.error('Error saving persistent cache:', error)
    }
  }

  // Iniciar timer de limpieza
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries()
      this.evictIfNeeded()
      this.savePersistentCache()
    }, this.config.cleanupInterval)
  }

  // Inicializar compresión
  private initializeCompression(): void {
    // Simular inicialización de compresión
    console.log('Compression initialized')
  }

  // Verificar si una entrada es válida
  private isValidEntry(entry: CacheEntry): boolean {
    return entry.timestamp + entry.ttl > Date.now()
  }

  // Comprimir datos
  private compressData(data: any): { compressed: string, algorithm: string } {
    if (!this.config.compressionEnabled || JSON.stringify(data).length < this.config.compressionThreshold) {
      return { compressed: JSON.stringify(data), algorithm: 'none' }
    }
    
    // Simular compresión
    const compressed = btoa(JSON.stringify(data))
    return { compressed, algorithm: 'gzip' }
  }

  // Descomprimir datos
  private decompressData(compressed: string, algorithm: string): any {
    if (algorithm === 'none') {
      return JSON.parse(compressed)
    }
    
    // Simular descompresión
    return JSON.parse(atob(compressed))
  }

  // Calcular checksum
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  // Obtener entrada del cache
  get<T>(key: string): T | null {
    const startTime = Date.now()
    
    try {
      const entry = this.cache.get(key)
      
      if (!entry) {
        this.recordOperation('get', key, Date.now() - startTime, false, 'Entry not found')
        return null
      }

      if (!this.isValidEntry(entry)) {
        this.cache.delete(key)
        this.recordOperation('get', key, Date.now() - startTime, false, 'Entry expired')
        return null
      }

      // Actualizar estadísticas de acceso
      entry.accessCount++
      entry.lastAccessed = Date.now()

      // Descomprimir si es necesario
      const value = entry.compression 
        ? this.decompressData(entry.value as string, entry.compression)
        : entry.value

      this.recordOperation('get', key, Date.now() - startTime, true, undefined, entry.size)
      return value as T
    } catch (error) {
      this.recordOperation('get', key, Date.now() - startTime, false, error instanceof Error ? error.message : 'Unknown error')
      return null
    }
  }

  // Establecer entrada en el cache
  set<T>(key: string, value: T, options?: {
    ttl?: number
    tags?: string[]
    priority?: 'low' | 'medium' | 'high' | 'critical'
    isPersistent?: boolean
  }): boolean {
    const startTime = Date.now()
    
    try {
      const ttl = options?.ttl || this.config.defaultTTL
      const tags = options?.tags || []
      const priority = options?.priority || 'medium'
      const isPersistent = options?.isPersistent || false

      // Comprimir si es necesario
      const { compressed, algorithm } = this.compressData(value)
      const size = new Blob([compressed]).size
      const checksum = this.calculateChecksum(value)

        const entry: CacheEntry<T> = {
        key,
        value: compressed as T,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
        tags,
        priority,
        isPersistent,
        compression: algorithm !== 'none' ? algorithm as 'gzip' | 'brotli' | 'lz4' : undefined,
        checksum,
      }

      // Verificar si necesitamos evictar entradas
      if (this.shouldEvict(size)) {
        this.evictEntries(size)
      }

      this.cache.set(key, entry)
      this.recordOperation('set', key, Date.now() - startTime, true, undefined, size)
      
      if (isPersistent) {
        this.savePersistentCache()
      }

      return true
    } catch (error) {
      this.recordOperation('set', key, Date.now() - startTime, false, error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Eliminar entrada del cache
  delete(key: string): boolean {
    const startTime = Date.now()
    
    try {
      const entry = this.cache.get(key)
      const success = this.cache.delete(key)
      
      if (success && entry?.isPersistent) {
        this.savePersistentCache()
      }

      this.recordOperation('delete', key, Date.now() - startTime, success)
      return success
    } catch (error) {
      this.recordOperation('delete', key, Date.now() - startTime, false, error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Limpiar cache
  clear(): boolean {
    const startTime = Date.now()
    
    try {
      this.cache.clear()
      this.recordOperation('clear', 'all', Date.now() - startTime, true)
      return true
    } catch (error) {
      this.recordOperation('clear', 'all', Date.now() - startTime, false, error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Obtener múltiples entradas
  getMany<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>()
    
    keys.forEach(key => {
      results.set(key, this.get<T>(key))
    })
    
    return results
  }

  // Establecer múltiples entradas
  setMany<T>(entries: Array<{ key: string; value: T; options?: any }>): boolean {
    let allSuccess = true
    
    entries.forEach(({ key, value, options }) => {
      if (!this.set(key, value, options)) {
        allSuccess = false
      }
    })
    
    return allSuccess
  }

  // Obtener entradas por tags
  getByTags(tags: string[]): CacheEntry[] {
    return Array.from(this.cache.values())
      .filter(entry => tags.some(tag => entry.tags.includes(tag)))
  }

  // Eliminar entradas por tags
  deleteByTags(tags: string[]): number {
    let deletedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (tags.some(tag => entry.tags.includes(tag))) {
        this.cache.delete(key)
        deletedCount++
      }
    }
    
    return deletedCount
  }

  // Verificar si necesitamos evictar
  private shouldEvict(newEntrySize: number): boolean {
    const currentSize = this.getCurrentSize()
    return currentSize + newEntrySize > this.config.maxSize || this.cache.size >= this.config.maxEntries
  }

  // Obtener tamaño actual del cache
  private getCurrentSize(): number {
    return Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0)
  }

  // Evictar entradas si es necesario
  private evictIfNeeded(): void {
    if (this.shouldEvict(0)) {
      this.evictEntries(0)
    }
  }

  // Evictar entradas
  private evictEntries(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries())
    
    // Ordenar según la política de evicción
    entries.sort((a, b) => {
      switch (this.config.evictionPolicy) {
        case 'lru':
          return a[1].lastAccessed - b[1].lastAccessed
        case 'lfu':
          return a[1].accessCount - b[1].accessCount
        case 'fifo':
          return a[1].timestamp - b[1].timestamp
        case 'ttl':
          return (a[1].timestamp + a[1].ttl) - (b[1].timestamp + b[1].ttl)
        default:
          return 0
      }
    })

    let freedSpace = 0
    let evictedCount = 0

    for (const [key, entry] of entries) {
      if (entry.isPersistent) continue // No evictar entradas persistentes
      
      this.cache.delete(key)
      freedSpace += entry.size
      evictedCount++
      
      if (freedSpace >= requiredSpace) break
    }

    if (evictedCount > 0) {
      console.log(`Evicted ${evictedCount} entries, freed ${freedSpace} bytes`)
    }
  }

  // Limpiar entradas expiradas
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired entries`)
    }
  }

  // Registrar operación
  private recordOperation(
    type: CacheOperation['type'],
    key: string,
    duration: number,
    success: boolean,
    error?: string,
    size?: number
  ): void {
    const operation: CacheOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      key,
      timestamp: Date.now(),
      duration,
      success,
      error,
      size,
    }

    this.operations.push(operation)
    
    // Mantener solo las últimas 1000 operaciones
    if (this.operations.length > 1000) {
      this.operations = this.operations.slice(-1000)
    }
  }

  // Obtener estadísticas del cache
  getStats(): CacheStats {
    const totalEntries = this.cache.size
    const totalSize = this.getCurrentSize()
    const persistentEntries = Array.from(this.cache.values()).filter(e => e.isPersistent).length
    const volatileEntries = totalEntries - persistentEntries

    const operations = this.operations.slice(-100) // Últimas 100 operaciones
    const getOperations = operations.filter(op => op.type === 'get')
    const hitCount = getOperations.filter(op => op.success).length
    const missCount = getOperations.filter(op => !op.success).length
    const totalGets = hitCount + missCount

    const hitRate = totalGets > 0 ? (hitCount / totalGets) * 100 : 0
    const missRate = totalGets > 0 ? (missCount / totalGets) * 100 : 0

    const evictionCount = this.operations.filter(op => op.type === 'evict').length
    const averageAccessTime = operations.length > 0 
      ? operations.reduce((sum, op) => sum + op.duration, 0) / operations.length 
      : 0

    return {
      totalEntries,
      totalSize,
      hitRate,
      missRate,
      evictionCount,
      compressionRatio: 0.7, // Simulado
      averageAccessTime,
      memoryUsage: totalSize,
      persistentEntries,
      volatileEntries,
    }
  }

  // Obtener configuración
  getConfig(): CacheConfig {
    return { ...this.config }
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Obtener todas las entradas
  getAllEntries(): CacheEntry[] {
    return Array.from(this.cache.values())
  }

  // Obtener operaciones recientes
  getRecentOperations(limit: number = 50): CacheOperation[] {
    return this.operations.slice(-limit)
  }

  // Limpiar datos
  clearData(): void {
    this.cache.clear()
    this.operations = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      entries: this.getAllEntries(),
      operations: this.operations,
      stats: this.getStats(),
      config: this.config,
    }, null, 2)
  }

  // Destruir servicio
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.savePersistentCache()
  }
}

// Instancia global del servicio
export const intelligentCacheService = IntelligentCacheService.getInstance()

// Hook para usar el servicio de cache inteligente
export function useIntelligentCache() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [operations, setOperations] = useState<CacheOperation[]>([])

  useEffect(() => {
    setStats(intelligentCacheService.getStats())
    setEntries(intelligentCacheService.getAllEntries())
    setOperations(intelligentCacheService.getRecentOperations())
  }, [])

  const get = useCallback(<T,>(key: string): T | null => {
    const result = intelligentCacheService.get<T>(key)
    setStats(intelligentCacheService.getStats())
    setOperations(intelligentCacheService.getRecentOperations())
    return result
  }, [])

  const set = useCallback(<T,>(key: string, value: T, options?: any): boolean => {
    const result = intelligentCacheService.set(key, value, options)
    setStats(intelligentCacheService.getStats())
    setEntries(intelligentCacheService.getAllEntries())
    setOperations(intelligentCacheService.getRecentOperations())
    return result
  }, [])

  const remove = useCallback((key: string): boolean => {
    const result = intelligentCacheService.delete(key)
    setStats(intelligentCacheService.getStats())
    setEntries(intelligentCacheService.getAllEntries())
    setOperations(intelligentCacheService.getRecentOperations())
    return result
  }, [])

  const clear = useCallback((): boolean => {
    const result = intelligentCacheService.clear()
    setStats(intelligentCacheService.getStats())
    setEntries(intelligentCacheService.getAllEntries())
    setOperations(intelligentCacheService.getRecentOperations())
    return result
  }, [])

  const getStats = useCallback(() => {
    const newStats = intelligentCacheService.getStats()
    setStats(newStats)
    return newStats
  }, [])

  const clearData = useCallback(() => {
    intelligentCacheService.clearData()
    setStats(null)
    setEntries([])
    setOperations([])
  }, [])

  const exportData = useCallback(() => {
    return intelligentCacheService.exportData()
  }, [])

  return {
    stats,
    entries,
    operations,
    get,
    set,
    remove,
    clear,
    getStats,
    clearData,
    exportData,
  }
}

// Componente de dashboard de cache inteligente
interface IntelligentCacheDashboardProps {
  className?: string
}

export const IntelligentCacheDashboard: React.FC<IntelligentCacheDashboardProps> = ({ className = '' }) => {
  const { stats, entries, operations, getStats, clear, clearData, exportData } = useIntelligentCache()

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const getPriorityColor = (priority: CacheEntry['priority']) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Intelligent Cache Dashboard</h2>
        <div className="space-x-2">
          <button
            onClick={getStats}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Stats
          </button>
          <button
            onClick={clear}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Clear Cache
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
              a.download = 'intelligent-cache-data.json'
              a.click()
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Export Data
          </button>
        </div>
      </div>

      {stats && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Cache Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Entries</h4>
              <p className="text-2xl font-bold text-gray-800">{stats.totalEntries}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Size</h4>
              <p className="text-2xl font-bold text-blue-600">{formatSize(stats.totalSize)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Hit Rate</h4>
              <p className="text-2xl font-bold text-green-600">{stats.hitRate.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Miss Rate</h4>
              <p className="text-2xl font-bold text-red-600">{stats.missRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Cache Entries</h3>
          <div className="space-y-2">
            {entries.slice(-5).map(entry => (
              <div key={entry.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{entry.key}</h4>
                    <p className="text-xs text-gray-600">
                      Access Count: {entry.accessCount} | Size: {formatSize(entry.size)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                      {entry.priority}
                    </span>
                    {entry.isPersistent && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Persistent
                      </span>
                    )}
                    {entry.compression && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {entry.compression}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Tags: {entry.tags.join(', ') || 'None'} | 
                  Last Accessed: {new Date(entry.lastAccessed).toLocaleTimeString()}
                </div>
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
                      {operation.type.toUpperCase()} - {operation.key}
                    </h4>
                    <p className="text-xs text-gray-600">
                      Duration: {operation.duration}ms | Size: {operation.size ? formatSize(operation.size) : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      operation.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {operation.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>
                {operation.error && (
                  <p className="text-xs text-red-600">Error: {operation.error}</p>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(operation.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

