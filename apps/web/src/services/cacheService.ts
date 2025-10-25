import React, { useState, useEffect, useCallback } from 'react'

import { useDataCache } from '../hooks/useOptimization'

// Tipos para el sistema de cache
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

export interface CacheOptions {
  ttl?: number // Time to live en milisegundos
  maxSize?: number // Tamaño máximo del cache
  strategy?: 'lru' | 'fifo' | 'lfu' // Estrategia de eliminación
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

// Clase principal del sistema de cache
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>()
  private stats = {
    hits: 0,
    misses: 0,
  }
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutos por defecto
      maxSize: options.maxSize || 100, // 100 entradas por defecto
      strategy: options.strategy || 'lru',
    }
  }

  // Obtener datos del cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Verificar si la entrada ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data
  }

  // Guardar datos en el cache
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      key,
    }

    // Verificar si necesitamos hacer espacio
    if (this.cache.size >= this.options.maxSize) {
      this.evictEntry()
    }

    this.cache.set(key, entry)
  }

  // Eliminar entrada del cache
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }

  // Verificar si existe una clave
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // Obtener estadísticas del cache
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    }
  }

  // Obtener todas las claves
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Obtener tamaño del cache
  size(): number {
    return this.cache.size
  }

  // Eliminar entradas expiradas
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Eliminar entrada según la estrategia
  private evictEntry(): void {
    switch (this.options.strategy) {
      case 'lru':
        this.evictLRU()
        break
      case 'fifo':
        this.evictFIFO()
        break
      case 'lfu':
        this.evictLFU()
        break
    }
  }

  // Eliminar entrada menos recientemente usada
  private evictLRU(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // Eliminar entrada más antigua (FIFO)
  private evictFIFO(): void {
    const firstKey = this.cache.keys().next().value
    if (firstKey) {
      this.cache.delete(firstKey)
    }
  }

  // Eliminar entrada menos frecuentemente usada
  private evictLFU(): void {
    // Para simplificar, usamos LRU como fallback
    this.evictLRU()
  }
}

// Instancia global del cache
export const globalCache = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 100,
  strategy: 'lru',
})

// Hook para usar el cache en componentes
export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) {
  return useDataCache(key, fetchFn, options.ttl)
}

// Funciones de utilidad para el cache
export const cacheUtils = {
  // Generar clave de cache para consultas
  generateKey: (prefix: string, params: Record<string, any>): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  },

  // Generar clave para listas paginadas
  generatePaginatedKey: (prefix: string, page: number, limit: number, filters?: Record<string, any>): string => {
    const baseKey = `${prefix}:page:${page}:limit:${limit}`
    if (filters) {
      const filterKey = cacheUtils.generateKey('filters', filters)
      return `${baseKey}:${filterKey}`
    }
    return baseKey
  },

  // Generar clave para búsquedas
  generateSearchKey: (prefix: string, query: string, filters?: Record<string, any>): string => {
    const baseKey = `${prefix}:search:${query}`
    if (filters) {
      const filterKey = cacheUtils.generateKey('filters', filters)
      return `${baseKey}:${filterKey}`
    }
    return baseKey
  },

  // Limpiar cache por prefijo
  clearByPrefix: (prefix: string): void => {
    const keys = globalCache.keys()
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        globalCache.delete(key)
      }
    })
  },

  // Limpiar cache por patrón
  clearByPattern: (pattern: RegExp): void => {
    const keys = globalCache.keys()
    keys.forEach(key => {
      if (pattern.test(key)) {
        globalCache.delete(key)
      }
    })
  },
}

// Servicio de cache para datos específicos
export class DataCacheService {
  private cache: CacheService

  constructor(options: CacheOptions = {}) {
    this.cache = new CacheService(options)
  }

  // Cache para jugadores
  async getPlayers(forceRefresh = false): Promise<any[]> {
    const key = 'players:all'
    
    if (!forceRefresh) {
      const cached = this.cache.get<any[]>(key)
      if (cached) return cached
    }

    // Simular llamada a API
    const data = await this.fetchPlayers()
    this.cache.set(key, data, 10 * 60 * 1000) // 10 minutos
    return data
  }

  // Cache para eventos
  async getEvents(forceRefresh = false): Promise<any[]> {
    const key = 'events:all'
    
    if (!forceRefresh) {
      const cached = this.cache.get<any[]>(key)
      if (cached) return cached
    }

    const data = await this.fetchEvents()
    this.cache.set(key, data, 5 * 60 * 1000) // 5 minutos
    return data
  }

  // Cache para transacciones
  async getTransactions(forceRefresh = false): Promise<any[]> {
    const key = 'transactions:all'
    
    if (!forceRefresh) {
      const cached = this.cache.get<any[]>(key)
      if (cached) return cached
    }

    const data = await this.fetchTransactions()
    this.cache.set(key, data, 2 * 60 * 1000) // 2 minutos
    return data
  }

  // Cache para estadísticas
  async getStats(forceRefresh = false): Promise<any> {
    const key = 'stats:all'
    
    if (!forceRefresh) {
      const cached = this.cache.get<any>(key)
      if (cached) return cached
    }

    const data = await this.fetchStats()
    this.cache.set(key, data, 1 * 60 * 1000) // 1 minuto
    return data
  }

  // Invalidar cache después de operaciones CRUD
  invalidatePlayers(): void {
    cacheUtils.clearByPrefix('players:')
  }

  invalidateEvents(): void {
    cacheUtils.clearByPrefix('events:')
  }

  invalidateTransactions(): void {
    cacheUtils.clearByPrefix('transactions:')
  }

  invalidateStats(): void {
    cacheUtils.clearByPrefix('stats:')
  }

  // Métodos privados para simular llamadas a API
  private async fetchPlayers(): Promise<any[]> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 100))
    return []
  }

  private async fetchEvents(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return []
  }

  private async fetchTransactions(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return []
  }

  private async fetchStats(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return {}
  }
}

// Instancia global del servicio de cache de datos
export const dataCache = new DataCacheService({
  ttl: 5 * 60 * 1000,
  maxSize: 50,
  strategy: 'lru',
})

// Hook para usar el cache de datos
export function useDataCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
) {
  return useDataCache(key, fetchFn, ttl)
}
