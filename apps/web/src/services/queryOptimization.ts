// Servicio de optimización de consultas
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  filters?: Record<string, any>
  include?: string[]
  select?: string[]
}

export interface OptimizedQuery {
  query: string
  params: any[]
  estimatedTime: number
  complexity: 'low' | 'medium' | 'high'
}

// Clase para optimización de consultas
export class QueryOptimizationService {
  private static instance: QueryOptimizationService
  private queryCache = new Map<string, OptimizedQuery>()
  private queryStats = new Map<string, { count: number; avgTime: number }>()

  static getInstance(): QueryOptimizationService {
    if (!QueryOptimizationService.instance) {
      QueryOptimizationService.instance = new QueryOptimizationService()
    }
    return QueryOptimizationService.instance
  }

  // Optimizar consulta de jugadores
  optimizePlayersQuery(options: QueryOptions = {}): OptimizedQuery {
    const cacheKey = this.generateCacheKey('players', options)
    
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!
    }

    const { limit = 50, offset = 0, orderBy = 'name', orderDirection = 'asc', filters = {} } = options
    
    let query = 'SELECT * FROM players'
    const params: any[] = []
    const conditions: string[] = []

    // Aplicar filtros
    if (filters.status) {
      conditions.push('status = ?')
      params.push(filters.status)
    }

    if (filters.position) {
      conditions.push('position = ?')
      params.push(filters.position)
    }

    if (filters.search) {
      conditions.push('(name LIKE ? OR number LIKE ?)')
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }

    // Agregar condiciones
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    // Ordenamiento
    query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`

    // Paginación
    query += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const optimizedQuery: OptimizedQuery = {
      query,
      params,
      estimatedTime: this.estimateQueryTime(query, params),
      complexity: this.assessComplexity(query, params),
    }

    this.queryCache.set(cacheKey, optimizedQuery)
    return optimizedQuery
  }

  // Optimizar consulta de eventos
  optimizeEventsQuery(options: QueryOptions = {}): OptimizedQuery {
    const cacheKey = this.generateCacheKey('events', options)
    
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!
    }

    const { limit = 50, offset = 0, orderBy = 'startsAt', orderDirection = 'desc', filters = {} } = options
    
    let query = 'SELECT * FROM events'
    const params: any[] = []
    const conditions: string[] = []

    // Aplicar filtros
    if (filters.type) {
      conditions.push('type = ?')
      params.push(filters.type)
    }

    if (filters.status) {
      conditions.push('status = ?')
      params.push(filters.status)
    }

    if (filters.dateFrom) {
      conditions.push('startsAt >= ?')
      params.push(filters.dateFrom)
    }

    if (filters.dateTo) {
      conditions.push('startsAt <= ?')
      params.push(filters.dateTo)
    }

    // Agregar condiciones
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    // Ordenamiento
    query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`

    // Paginación
    query += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const optimizedQuery: OptimizedQuery = {
      query,
      params,
      estimatedTime: this.estimateQueryTime(query, params),
      complexity: this.assessComplexity(query, params),
    }

    this.queryCache.set(cacheKey, optimizedQuery)
    return optimizedQuery
  }

  // Optimizar consulta de transacciones
  optimizeTransactionsQuery(options: QueryOptions = {}): OptimizedQuery {
    const cacheKey = this.generateCacheKey('transactions', options)
    
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!
    }

    const { limit = 50, offset = 0, orderBy = 'occurredAt', orderDirection = 'desc', filters = {} } = options
    
    let query = `
      SELECT t.*, a.name as account_name, c.name as category_name 
      FROM transactions t
      LEFT JOIN accounts a ON t.accountId = a.id
      LEFT JOIN categories c ON t.categoryId = c.id
    `
    const params: any[] = []
    const conditions: string[] = []

    // Aplicar filtros
    if (filters.type) {
      conditions.push('t.type = ?')
      params.push(filters.type)
    }

    if (filters.accountId) {
      conditions.push('t.accountId = ?')
      params.push(filters.accountId)
    }

    if (filters.categoryId) {
      conditions.push('t.categoryId = ?')
      params.push(filters.categoryId)
    }

    if (filters.dateFrom) {
      conditions.push('t.occurredAt >= ?')
      params.push(filters.dateFrom)
    }

    if (filters.dateTo) {
      conditions.push('t.occurredAt <= ?')
      params.push(filters.dateTo)
    }

    if (filters.amountMin) {
      conditions.push('t.amountCents >= ?')
      params.push(filters.amountMin)
    }

    if (filters.amountMax) {
      conditions.push('t.amountCents <= ?')
      params.push(filters.amountMax)
    }

    // Agregar condiciones
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    // Ordenamiento
    query += ` ORDER BY t.${orderBy} ${orderDirection.toUpperCase()}`

    // Paginación
    query += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const optimizedQuery: OptimizedQuery = {
      query,
      params,
      estimatedTime: this.estimateQueryTime(query, params),
      complexity: this.assessComplexity(query, params),
    }

    this.queryCache.set(cacheKey, optimizedQuery)
    return optimizedQuery
  }

  // Optimizar consulta de estadísticas
  optimizeStatsQuery(options: QueryOptions = {}): OptimizedQuery {
    const cacheKey = this.generateCacheKey('stats', options)
    
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!
    }

    const query = `
      SELECT 
        (SELECT COUNT(*) FROM players WHERE status = 'ACTIVE') as active_players,
        (SELECT COUNT(*) FROM events WHERE status = 'UPCOMING') as upcoming_events,
        (SELECT COUNT(*) FROM transactions WHERE type = 'INCOME') as income_transactions,
        (SELECT COUNT(*) FROM transactions WHERE type = 'EXPENSE') as expense_transactions,
        (SELECT SUM(amountCents) FROM transactions WHERE type = 'INCOME') as total_income,
        (SELECT SUM(amountCents) FROM transactions WHERE type = 'EXPENSE') as total_expenses
    `
    const params: any[] = []

    const optimizedQuery: OptimizedQuery = {
      query,
      params,
      estimatedTime: this.estimateQueryTime(query, params),
      complexity: this.assessComplexity(query, params),
    }

    this.queryCache.set(cacheKey, optimizedQuery)
    return optimizedQuery
  }

  // Generar clave de cache
  private generateCacheKey(table: string, options: QueryOptions): string {
    const key = `${table}:${JSON.stringify(options)}`
    return key
  }

  // Estimar tiempo de consulta
  private estimateQueryTime(query: string, params: any[]): number {
    let baseTime = 10 // ms base

    // Factores de complejidad
    if (query.includes('JOIN')) baseTime += 20
    if (query.includes('WHERE')) baseTime += 10
    if (query.includes('ORDER BY')) baseTime += 5
    if (query.includes('LIMIT')) baseTime += 2

    // Factor por número de parámetros
    baseTime += params.length * 2

    return baseTime
  }

  // Evaluar complejidad de consulta
  private assessComplexity(query: string, params: any[]): 'low' | 'medium' | 'high' {
    let score = 0

    if (query.includes('JOIN')) score += 3
    if (query.includes('WHERE')) score += 1
    if (query.includes('ORDER BY')) score += 1
    if (query.includes('GROUP BY')) score += 2
    if (query.includes('HAVING')) score += 2
    if (query.includes('DISTINCT')) score += 1
    if (params.length > 5) score += 2

    if (score <= 2) return 'low'
    if (score <= 5) return 'medium'
    return 'high'
  }

  // Obtener estadísticas de consultas
  getQueryStats(): Record<string, { count: number; avgTime: number }> {
    return Object.fromEntries(this.queryStats)
  }

  // Limpiar cache
  clearCache(): void {
    this.queryCache.clear()
  }

  // Limpiar estadísticas
  clearStats(): void {
    this.queryStats.clear()
  }
}

// Instancia global del servicio
export const queryOptimization = QueryOptimizationService.getInstance()

// Hook para usar optimización de consultas
export function useQueryOptimization() {
  const [queryStats, setQueryStats] = useState<Record<string, { count: number; avgTime: number }>>({})

  useEffect(() => {
    setQueryStats(queryOptimization.getQueryStats())
  }, [])

  const optimizePlayersQuery = useCallback((options: QueryOptions = {}) => {
    return queryOptimization.optimizePlayersQuery(options)
  }, [])

  const optimizeEventsQuery = useCallback((options: QueryOptions = {}) => {
    return queryOptimization.optimizeEventsQuery(options)
  }, [])

  const optimizeTransactionsQuery = useCallback((options: QueryOptions = {}) => {
    return queryOptimization.optimizeTransactionsQuery(options)
  }, [])

  const optimizeStatsQuery = useCallback((options: QueryOptions = {}) => {
    return queryOptimization.optimizeStatsQuery(options)
  }, [])

  const clearCache = useCallback(() => {
    queryOptimization.clearCache()
  }, [])

  const clearStats = useCallback(() => {
    queryOptimization.clearStats()
    setQueryStats({})
  }, [])

  return {
    queryStats,
    optimizePlayersQuery,
    optimizeEventsQuery,
    optimizeTransactionsQuery,
    optimizeStatsQuery,
    clearCache,
    clearStats,
  }
}
