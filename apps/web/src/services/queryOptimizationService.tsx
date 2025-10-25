import React, { useState, useEffect, useCallback } from 'react'

// Sistema de optimización de consultas de base de datos
export interface QueryInfo {
  id: string
  sql: string
  table: string
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER'
  executionTime: number
  rowsExamined: number
  rowsReturned: number
  indexUsed?: string
  isOptimized: boolean
  optimizationScore: number
  timestamp: Date
  frequency: number
  averageExecutionTime: number
  slowQueryThreshold: number
  isSlowQuery: boolean
  recommendations: string[]
  metadata: Record<string, any>
}

export interface IndexInfo {
  id: string
  name: string
  table: string
  columns: string[]
  type: 'PRIMARY' | 'UNIQUE' | 'INDEX' | 'FULLTEXT'
  size: number
  usage: number
  efficiency: number
  isUsed: boolean
  isOptimal: boolean
  recommendations: string[]
}

export interface QueryOptimization {
  id: string
  originalQuery: string
  optimizedQuery: string
  improvements: string[]
  performanceGain: number
  executionTimeReduction: number
  indexSuggestions: string[]
  appliedAt: Date
  status: 'pending' | 'applied' | 'rejected' | 'testing'
}

export interface QueryAnalytics {
  id: string
  timestamp: Date
  summary: {
    totalQueries: number
    slowQueries: number
    optimizedQueries: number
    averageExecutionTime: number
    totalExecutionTime: number
    indexUsageRate: number
    queryEfficiency: number
    optimizationOpportunities: number
  }
  queries: QueryInfo[]
  indexes: IndexInfo[]
  optimizations: QueryOptimization[]
  recommendations: string[]
  performance: {
    queryThroughput: number
    averageResponseTime: number
    cacheHitRate: number
    connectionPoolUsage: number
    deadlockCount: number
  }
}

export interface QueryOperation {
  id: string
  queryId: string
  type: 'analyze' | 'optimize' | 'index_create' | 'index_drop' | 'query_rewrite'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  duration?: number
  result?: any
  error?: string
  progress: number
}

// Clase principal del servicio de optimización de consultas
export class QueryOptimizationService {
  private static instance: QueryOptimizationService
  private queries: QueryInfo[] = []
  private indexes: IndexInfo[] = []
  private optimizations: QueryOptimization[] = []
  private operations: QueryOperation[] = []
  private isInitialized = false

  private constructor() {
    this.initializeQueryOptimization()
  }

  static getInstance(): QueryOptimizationService {
    if (!QueryOptimizationService.instance) {
      QueryOptimizationService.instance = new QueryOptimizationService()
    }
    return QueryOptimizationService.instance
  }

  // Inicializar optimización de consultas
  private initializeQueryOptimization(): void {
    this.analyzeExistingQueries()
    this.analyzeIndexes()
    this.identifyOptimizationOpportunities()
    this.isInitialized = true
  }

  // Analizar consultas existentes
  private analyzeExistingQueries(): void {
    // Simular análisis de consultas existentes
    this.queries = [
      {
        id: 'query-1',
        sql: 'SELECT * FROM users WHERE email = ?',
        table: 'users',
        type: 'SELECT',
        executionTime: 45,
        rowsExamined: 1000,
        rowsReturned: 1,
        indexUsed: 'idx_users_email',
        isOptimized: true,
        optimizationScore: 85,
        timestamp: new Date(),
        frequency: 1000,
        averageExecutionTime: 42,
        slowQueryThreshold: 100,
        isSlowQuery: false,
        recommendations: ['Index is being used efficiently'],
        metadata: { complexity: 'simple', joins: 0 },
      },
      {
        id: 'query-2',
        sql: 'SELECT u.*, p.* FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.status = ?',
        table: 'users,profiles',
        type: 'SELECT',
        executionTime: 150,
        rowsExamined: 5000,
        rowsReturned: 100,
        indexUsed: 'idx_users_status',
        isOptimized: false,
        optimizationScore: 60,
        timestamp: new Date(),
        frequency: 500,
        averageExecutionTime: 180,
        slowQueryThreshold: 100,
        isSlowQuery: true,
        recommendations: [
          'Consider adding composite index on (status, id)',
          'Optimize JOIN condition',
          'Use SELECT specific columns instead of *'
        ],
        metadata: { complexity: 'medium', joins: 1 },
      },
      {
        id: 'query-3',
        sql: 'SELECT COUNT(*) FROM events WHERE date BETWEEN ? AND ?',
        table: 'events',
        type: 'SELECT',
        executionTime: 200,
        rowsExamined: 10000,
        rowsReturned: 1,
        isOptimized: false,
        optimizationScore: 40,
        timestamp: new Date(),
        frequency: 200,
        averageExecutionTime: 220,
        slowQueryThreshold: 100,
        isSlowQuery: true,
        recommendations: [
          'Add index on date column',
          'Consider partitioning by date',
          'Use approximate count for large datasets'
        ],
        metadata: { complexity: 'simple', joins: 0 },
      },
      {
        id: 'query-4',
        sql: 'INSERT INTO players (name, position, team_id) VALUES (?, ?, ?)',
        table: 'players',
        type: 'INSERT',
        executionTime: 25,
        rowsExamined: 0,
        rowsReturned: 1,
        isOptimized: true,
        optimizationScore: 90,
        timestamp: new Date(),
        frequency: 50,
        averageExecutionTime: 28,
        slowQueryThreshold: 100,
        isSlowQuery: false,
        recommendations: ['Query is well optimized'],
        metadata: { complexity: 'simple', joins: 0 },
      },
      {
        id: 'query-5',
        sql: 'UPDATE users SET last_login = NOW() WHERE id = ?',
        table: 'users',
        type: 'UPDATE',
        executionTime: 15,
        rowsExamined: 1,
        rowsReturned: 1,
        indexUsed: 'PRIMARY',
        isOptimized: true,
        optimizationScore: 95,
        timestamp: new Date(),
        frequency: 2000,
        averageExecutionTime: 18,
        slowQueryThreshold: 100,
        isSlowQuery: false,
        recommendations: ['Query is highly optimized'],
        metadata: { complexity: 'simple', joins: 0 },
      },
    ]
  }

  // Analizar índices
  private analyzeIndexes(): void {
    // Simular análisis de índices
    this.indexes = [
      {
        id: 'index-1',
        name: 'PRIMARY',
        table: 'users',
        columns: ['id'],
        type: 'PRIMARY',
        size: 1024,
        usage: 95,
        efficiency: 90,
        isUsed: true,
        isOptimal: true,
        recommendations: ['Primary key is optimal'],
      },
      {
        id: 'index-2',
        name: 'idx_users_email',
        table: 'users',
        columns: ['email'],
        type: 'UNIQUE',
        size: 2048,
        usage: 80,
        efficiency: 85,
        isUsed: true,
        isOptimal: true,
        recommendations: ['Email index is well used'],
      },
      {
        id: 'index-3',
        name: 'idx_users_status',
        table: 'users',
        columns: ['status'],
        type: 'INDEX',
        size: 512,
        usage: 60,
        efficiency: 70,
        isUsed: true,
        isOptimal: false,
        recommendations: ['Consider composite index with id'],
      },
      {
        id: 'index-4',
        name: 'idx_events_date',
        table: 'events',
        columns: ['date'],
        type: 'INDEX',
        size: 4096,
        usage: 30,
        efficiency: 40,
        isUsed: false,
        isOptimal: false,
        recommendations: ['Index is not being used effectively'],
      },
      {
        id: 'index-5',
        name: 'idx_players_team',
        table: 'players',
        columns: ['team_id'],
        type: 'INDEX',
        size: 1024,
        usage: 70,
        efficiency: 75,
        isUsed: true,
        isOptimal: true,
        recommendations: ['Team index is optimal'],
      },
    ]
  }

  // Identificar oportunidades de optimización
  private identifyOptimizationOpportunities(): void {
    // Simular identificación de oportunidades
    const slowQueries = this.queries.filter(q => q.isSlowQuery)
    const unusedIndexes = this.indexes.filter(i => !i.isUsed)
    const inefficientIndexes = this.indexes.filter(i => i.efficiency < 70)

    console.log(`Found ${slowQueries.length} slow queries`)
    console.log(`Found ${unusedIndexes.length} unused indexes`)
    console.log(`Found ${inefficientIndexes.length} inefficient indexes`)
  }

  // Analizar consulta
  async analyzeQuery(sql: string, table: string): Promise<QueryInfo> {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const operation: QueryOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queryId,
      type: 'analyze',
      status: 'processing',
      startTime: new Date(),
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular análisis de consulta
      for (let progress = 0; progress <= 100; progress += 20) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Simular métricas de consulta
      const executionTime = Math.random() * 300 + 10
      const rowsExamined = Math.floor(Math.random() * 10000) + 100
      const rowsReturned = Math.floor(Math.random() * 1000) + 1
      const optimizationScore = Math.floor(Math.random() * 40) + 60
      const isSlowQuery = executionTime > 100

      const query: QueryInfo = {
        id: queryId,
        sql,
        table,
        type: this.detectQueryType(sql),
        executionTime,
        rowsExamined,
        rowsReturned,
        isOptimized: optimizationScore > 80,
        optimizationScore,
        timestamp: new Date(),
        frequency: 1,
        averageExecutionTime: executionTime,
        slowQueryThreshold: 100,
        isSlowQuery,
        recommendations: this.generateQueryRecommendations(sql, executionTime, rowsExamined, rowsReturned),
        metadata: { complexity: this.analyzeQueryComplexity(sql) },
      }

      this.queries.push(query)

      // Completar operación
      operation.status = 'completed'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      operation.result = query

      return query
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      throw error
    }
  }

  // Detectar tipo de consulta
  private detectQueryType(sql: string): QueryInfo['type'] {
    const upperSql = sql.toUpperCase().trim()
    if (upperSql.startsWith('SELECT')) return 'SELECT'
    if (upperSql.startsWith('INSERT')) return 'INSERT'
    if (upperSql.startsWith('UPDATE')) return 'UPDATE'
    if (upperSql.startsWith('DELETE')) return 'DELETE'
    if (upperSql.startsWith('CREATE')) return 'CREATE'
    if (upperSql.startsWith('DROP')) return 'DROP'
    if (upperSql.startsWith('ALTER')) return 'ALTER'
    return 'SELECT'
  }

  // Analizar complejidad de consulta
  private analyzeQueryComplexity(sql: string): string {
    const upperSql = sql.toUpperCase()
    const joinCount = (upperSql.match(/JOIN/g) || []).length
    const subqueryCount = (upperSql.match(/\(SELECT/g) || []).length
    const functionCount = (upperSql.match(/\(/g) || []).length

    if (joinCount > 3 || subqueryCount > 2 || functionCount > 5) return 'complex'
    if (joinCount > 1 || subqueryCount > 0 || functionCount > 2) return 'medium'
    return 'simple'
  }

  // Generar recomendaciones de consulta
  private generateQueryRecommendations(sql: string, executionTime: number, rowsExamined: number, rowsReturned: number): string[] {
    const recommendations: string[] = []

    if (executionTime > 100) {
      recommendations.push('Query execution time exceeds threshold')
    }

    if (rowsExamined > rowsReturned * 10) {
      recommendations.push('Query examines too many rows relative to results')
    }

    if (sql.includes('SELECT *')) {
      recommendations.push('Avoid SELECT * - specify only needed columns')
    }

    if (sql.includes('WHERE') && !sql.includes('INDEX')) {
      recommendations.push('Consider adding indexes for WHERE conditions')
    }

    if (sql.includes('ORDER BY') && !sql.includes('INDEX')) {
      recommendations.push('Consider adding indexes for ORDER BY columns')
    }

    if (sql.includes('GROUP BY')) {
      recommendations.push('Consider adding indexes for GROUP BY columns')
    }

    if (sql.includes('JOIN')) {
      recommendations.push('Ensure JOIN columns are indexed')
    }

    if (sql.includes('LIKE') && sql.includes('%')) {
      recommendations.push('Avoid leading wildcards in LIKE queries')
    }

    return recommendations
  }

  // Optimizar consulta
  async optimizeQuery(queryId: string): Promise<QueryOptimization> {
    const query = this.queries.find(q => q.id === queryId)
    if (!query) {
      throw new Error(`Query ${queryId} not found`)
    }

    const operation: QueryOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queryId,
      type: 'optimize',
      status: 'processing',
      startTime: new Date(),
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular optimización de consulta
      for (let progress = 0; progress <= 100; progress += 25) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      const optimizedQuery = this.generateOptimizedQuery(query.sql)
      const improvements = this.generateOptimizationImprovements(query.sql, optimizedQuery)
      const performanceGain = Math.floor(Math.random() * 50) + 20
      const executionTimeReduction = query.executionTime * (performanceGain / 100)

      const optimization: QueryOptimization = {
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalQuery: query.sql,
        optimizedQuery,
        improvements,
        performanceGain,
        executionTimeReduction,
        indexSuggestions: this.generateIndexSuggestions(query),
        appliedAt: new Date(),
        status: 'pending',
      }

      this.optimizations.push(optimization)

      // Actualizar consulta
      query.isOptimized = true
      query.optimizationScore = Math.min(100, query.optimizationScore + performanceGain)
      query.recommendations = ['Query has been optimized']

      // Completar operación
      operation.status = 'completed'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      operation.result = optimization

      return optimization
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      throw error
    }
  }

  // Generar consulta optimizada
  private generateOptimizedQuery(originalSql: string): string {
    let optimized = originalSql

    // Simular optimizaciones comunes
    if (optimized.includes('SELECT *')) {
      optimized = optimized.replace('SELECT *', 'SELECT id, name, email')
    }

    if (optimized.includes('WHERE 1=1')) {
      optimized = optimized.replace('WHERE 1=1', 'WHERE id > 0')
    }

    if (optimized.includes('ORDER BY RAND()')) {
      optimized = optimized.replace('ORDER BY RAND()', 'ORDER BY id')
    }

    return optimized
  }

  // Generar mejoras de optimización
  private generateOptimizationImprovements(originalSql: string, optimizedSql: string): string[] {
    const improvements: string[] = []

    if (originalSql.includes('SELECT *') && !optimizedSql.includes('SELECT *')) {
      improvements.push('Replaced SELECT * with specific columns')
    }

    if (originalSql.includes('WHERE 1=1') && !optimizedSql.includes('WHERE 1=1')) {
      improvements.push('Removed unnecessary WHERE 1=1 condition')
    }

    if (originalSql.includes('ORDER BY RAND()') && !optimizedSql.includes('ORDER BY RAND()')) {
      improvements.push('Replaced ORDER BY RAND() with deterministic ordering')
    }

    improvements.push('Added appropriate indexes')
    improvements.push('Optimized JOIN conditions')

    return improvements
  }

  // Generar sugerencias de índice
  private generateIndexSuggestions(query: QueryInfo): string[] {
    const suggestions: string[] = []

    if (query.sql.includes('WHERE')) {
      suggestions.push('Add index for WHERE conditions')
    }

    if (query.sql.includes('ORDER BY')) {
      suggestions.push('Add index for ORDER BY columns')
    }

    if (query.sql.includes('GROUP BY')) {
      suggestions.push('Add index for GROUP BY columns')
    }

    if (query.sql.includes('JOIN')) {
      suggestions.push('Add index for JOIN columns')
    }

    return suggestions
  }

  // Crear índice
  async createIndex(table: string, columns: string[], type: IndexInfo['type'] = 'INDEX'): Promise<IndexInfo> {
    const indexId = `index_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const operation: QueryOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queryId: indexId,
      type: 'index_create',
      status: 'processing',
      startTime: new Date(),
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular creación de índice
      for (let progress = 0; progress <= 100; progress += 30) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const index: IndexInfo = {
        id: indexId,
        name: `idx_${table}_${columns.join('_')}`,
        table,
        columns,
        type,
        size: Math.floor(Math.random() * 5000) + 1000,
        usage: 0,
        efficiency: 0,
        isUsed: false,
        isOptimal: false,
        recommendations: ['New index created - monitor usage'],
      }

      this.indexes.push(index)

      // Completar operación
      operation.status = 'completed'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      operation.result = index

      return index
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      throw error
    }
  }

  // Obtener consultas lentas
  getSlowQueries(): QueryInfo[] {
    return this.queries.filter(query => query.isSlowQuery)
  }

  // Obtener consultas no optimizadas
  getUnoptimizedQueries(): QueryInfo[] {
    return this.queries.filter(query => !query.isOptimized)
  }

  // Obtener índices no utilizados
  getUnusedIndexes(): IndexInfo[] {
    return this.indexes.filter(index => !index.isUsed)
  }

  // Obtener índices ineficientes
  getInefficientIndexes(): IndexInfo[] {
    return this.indexes.filter(index => index.efficiency < 70)
  }

  // Obtener operaciones por estado
  getOperationsByStatus(status: QueryOperation['status']): QueryOperation[] {
    return this.operations.filter(operation => operation.status === status)
  }

  // Generar analytics de consultas
  generateQueryAnalytics(): QueryAnalytics {
    const totalQueries = this.queries.length
    const slowQueries = this.queries.filter(q => q.isSlowQuery).length
    const optimizedQueries = this.queries.filter(q => q.isOptimized).length
    const averageExecutionTime = this.queries.length > 0
      ? this.queries.reduce((sum, q) => sum + q.executionTime, 0) / this.queries.length
      : 0
    const totalExecutionTime = this.queries.reduce((sum, q) => sum + q.executionTime, 0)
    const indexUsageRate = this.indexes.length > 0
      ? (this.indexes.filter(i => i.isUsed).length / this.indexes.length) * 100
      : 0
    const queryEfficiency = this.queries.length > 0
      ? this.queries.reduce((sum, q) => sum + q.optimizationScore, 0) / this.queries.length
      : 0
    const optimizationOpportunities = this.queries.filter(q => !q.isOptimized).length

    const performance = {
      queryThroughput: this.queries.reduce((sum, q) => sum + q.frequency, 0),
      averageResponseTime: averageExecutionTime,
      cacheHitRate: 85, // Simulado
      connectionPoolUsage: 75, // Simulado
      deadlockCount: 2, // Simulado
    }

    const recommendations = this.generateRecommendations()

    return {
      id: `query_analytics_${Date.now()}`,
      timestamp: new Date(),
      summary: {
        totalQueries,
        slowQueries,
        optimizedQueries,
        averageExecutionTime,
        totalExecutionTime,
        indexUsageRate,
        queryEfficiency,
        optimizationOpportunities,
      },
      queries: [...this.queries],
      indexes: [...this.indexes],
      optimizations: [...this.optimizations],
      recommendations,
      performance,
    }
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const slowQueries = this.getSlowQueries()
    if (slowQueries.length > 0) {
      recommendations.push(`${slowQueries.length} consultas lentas necesitan optimización`)
    }

    const unoptimizedQueries = this.getUnoptimizedQueries()
    if (unoptimizedQueries.length > 0) {
      recommendations.push(`${unoptimizedQueries.length} consultas no están optimizadas`)
    }

    const unusedIndexes = this.getUnusedIndexes()
    if (unusedIndexes.length > 0) {
      recommendations.push(`${unusedIndexes.length} índices no están siendo utilizados`)
    }

    const inefficientIndexes = this.getInefficientIndexes()
    if (inefficientIndexes.length > 0) {
      recommendations.push(`${inefficientIndexes.length} índices son ineficientes`)
    }

    const pendingOptimizations = this.optimizations.filter(o => o.status === 'pending')
    if (pendingOptimizations.length > 0) {
      recommendations.push(`${pendingOptimizations.length} optimizaciones están pendientes`)
    }

    return recommendations
  }

  // Obtener todas las consultas
  getAllQueries(): QueryInfo[] {
    return [...this.queries]
  }

  // Obtener todos los índices
  getAllIndexes(): IndexInfo[] {
    return [...this.indexes]
  }

  // Obtener todas las optimizaciones
  getAllOptimizations(): QueryOptimization[] {
    return [...this.optimizations]
  }

  // Obtener todas las operaciones
  getAllOperations(): QueryOperation[] {
    return [...this.operations]
  }

  // Limpiar datos
  clearData(): void {
    this.queries = []
    this.indexes = []
    this.optimizations = []
    this.operations = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      queries: this.queries,
      indexes: this.indexes,
      optimizations: this.optimizations,
      operations: this.operations,
      analytics: this.generateQueryAnalytics(),
    }, null, 2)
  }
}

// Instancia global del servicio
export const queryOptimizationService = QueryOptimizationService.getInstance()

// Hook para usar el servicio de optimización de consultas
export function useQueryOptimization() {
  const [queries, setQueries] = useState<QueryInfo[]>([])
  const [indexes, setIndexes] = useState<IndexInfo[]>([])
  const [optimizations, setOptimizations] = useState<QueryOptimization[]>([])
  const [operations, setOperations] = useState<QueryOperation[]>([])
  const [analytics, setAnalytics] = useState<QueryAnalytics | null>(null)

  useEffect(() => {
    setQueries(queryOptimizationService.getAllQueries())
    setIndexes(queryOptimizationService.getAllIndexes())
    setOptimizations(queryOptimizationService.getAllOptimizations())
    setOperations(queryOptimizationService.getAllOperations())
    setAnalytics(queryOptimizationService.generateQueryAnalytics())
  }, [])

  const analyzeQuery = useCallback(async (sql: string, table: string) => {
    const query = await queryOptimizationService.analyzeQuery(sql, table)
    setQueries(queryOptimizationService.getAllQueries())
    setOperations(queryOptimizationService.getAllOperations())
    setAnalytics(queryOptimizationService.generateQueryAnalytics())
    return query
  }, [])

  const optimizeQuery = useCallback(async (queryId: string) => {
    const optimization = await queryOptimizationService.optimizeQuery(queryId)
    setQueries(queryOptimizationService.getAllQueries())
    setOptimizations(queryOptimizationService.getAllOptimizations())
    setOperations(queryOptimizationService.getAllOperations())
    setAnalytics(queryOptimizationService.generateQueryAnalytics())
    return optimization
  }, [])

  const createIndex = useCallback(async (table: string, columns: string[], type?: IndexInfo['type']) => {
    const index = await queryOptimizationService.createIndex(table, columns, type)
    setIndexes(queryOptimizationService.getAllIndexes())
    setOperations(queryOptimizationService.getAllOperations())
    setAnalytics(queryOptimizationService.generateQueryAnalytics())
    return index
  }, [])

  const generateQueryAnalytics = useCallback(() => {
    const newAnalytics = queryOptimizationService.generateQueryAnalytics()
    setAnalytics(newAnalytics)
    return newAnalytics
  }, [])

  const clearData = useCallback(() => {
    queryOptimizationService.clearData()
    setQueries([])
    setIndexes([])
    setOptimizations([])
    setOperations([])
    setAnalytics(null)
  }, [])

  const exportData = useCallback(() => {
    return queryOptimizationService.exportData()
  }, [])

  return {
    queries,
    indexes,
    optimizations,
    operations,
    analytics,
    analyzeQuery,
    optimizeQuery,
    createIndex,
    generateQueryAnalytics,
    clearData,
    exportData,
  }
}

// Componente de dashboard de optimización de consultas
interface QueryOptimizationDashboardProps {
  className?: string
}

export const QueryOptimizationDashboard: React.FC<QueryOptimizationDashboardProps> = ({ className = '' }) => {
  const { queries, indexes, optimizations, operations, analytics, analyzeQuery, optimizeQuery, createIndex, generateQueryAnalytics, clearData, exportData } = useQueryOptimization()

  const getTypeColor = (type: QueryInfo['type']) => {
    switch (type) {
      case 'SELECT': return 'text-blue-600 bg-blue-100'
      case 'INSERT': return 'text-green-600 bg-green-100'
      case 'UPDATE': return 'text-yellow-600 bg-yellow-100'
      case 'DELETE': return 'text-red-600 bg-red-100'
      case 'CREATE': return 'text-purple-600 bg-purple-100'
      case 'DROP': return 'text-orange-600 bg-orange-100'
      case 'ALTER': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getIndexTypeColor = (type: IndexInfo['type']) => {
    switch (type) {
      case 'PRIMARY': return 'text-red-600 bg-red-100'
      case 'UNIQUE': return 'text-blue-600 bg-blue-100'
      case 'INDEX': return 'text-green-600 bg-green-100'
      case 'FULLTEXT': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: QueryOperation['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Query Optimization Dashboard</h2>
        <div className="space-x-2">
          <button
            onClick={() => analyzeQuery('SELECT * FROM users WHERE status = ?', 'users')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Analyze Query
          </button>
          <button
            onClick={() => createIndex('users', ['status', 'id'])}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Index
          </button>
          <button
            onClick={generateQueryAnalytics}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Generate Analytics
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
              a.download = 'query-optimization-data.json'
              a.click()
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Export Data
          </button>
        </div>
      </div>

      {analytics && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Query Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Queries</h4>
              <p className="text-2xl font-bold text-gray-800">{analytics.summary.totalQueries}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Slow Queries</h4>
              <p className="text-2xl font-bold text-red-600">{analytics.summary.slowQueries}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Optimized</h4>
              <p className="text-2xl font-bold text-green-600">{analytics.summary.optimizedQueries}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Avg Execution</h4>
              <p className="text-2xl font-bold text-blue-600">{analytics.summary.averageExecutionTime.toFixed(0)}ms</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Queries</h3>
          <div className="space-y-2">
            {queries.slice(-5).map(query => (
              <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{query.table}</h4>
                    <p className="text-xs text-gray-600 font-mono">{query.sql}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(query.type)}`}>
                      {query.type}
                    </span>
                    {query.isSlowQuery ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Slow
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Fast
                      </span>
                    )}
                    {query.isOptimized ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Optimized
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Optimized
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Execution: {query.executionTime.toFixed(0)}ms | 
                    Rows: {query.rowsExamined}/{query.rowsReturned} | 
                    Score: {query.optimizationScore}/100
                  </p>
                  <button
                    onClick={() => optimizeQuery(query.id)}
                    disabled={query.isOptimized}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Optimize
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Database Indexes</h3>
          <div className="space-y-2">
            {indexes.slice(-5).map(index => (
              <div key={index.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{index.name}</h4>
                    <p className="text-xs text-gray-600">
                      Table: {index.table} | Columns: {index.columns.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIndexTypeColor(index.type)}`}>
                      {index.type}
                    </span>
                    {index.isUsed ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Used
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Unused
                      </span>
                    )}
                    {index.isOptimal ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Optimal
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Inefficient
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Size: {index.size}KB | Usage: {index.usage}% | Efficiency: {index.efficiency}%
                </p>
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
                      {operation.type.toUpperCase()} - {operation.queryId}
                    </h4>
                    <p className="text-xs text-gray-600">
                      Progress: {operation.progress}% | 
                      Duration: {operation.duration ? `${operation.duration}ms` : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(operation.status)}`}>
                      {operation.status}
                    </span>
                  </div>
                </div>
                {operation.error && (
                  <p className="text-xs text-red-600">Error: {operation.error}</p>
                )}
                <p className="text-xs text-gray-500">
                  {operation.startTime.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
