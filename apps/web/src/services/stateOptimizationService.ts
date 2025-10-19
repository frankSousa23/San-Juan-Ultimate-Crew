// Sistema de optimización de estado global
export interface StateNode {
  id: string
  path: string
  type: 'object' | 'array' | 'primitive' | 'function' | 'component'
  value: any
  size: number
  isOptimized: boolean
  isMemoized: boolean
  isPersisted: boolean
  accessCount: number
  lastAccessed: Date
  dependencies: string[]
  subscribers: string[]
  metadata: Record<string, any>
}

export interface StateOptimization {
  id: string
  nodeId: string
  type: 'memoization' | 'normalization' | 'pagination' | 'lazy_loading' | 'selective_update' | 'state_splitting'
  description: string
  beforeSize: number
  afterSize: number
  performanceGain: number
  appliedAt: Date
  status: 'pending' | 'applied' | 'reverted' | 'testing'
  metrics: {
    renderTime: number
    memoryUsage: number
    updateFrequency: number
    subscriberCount: number
  }
}

export interface StateAnalytics {
  id: string
  timestamp: Date
  summary: {
    totalNodes: number
    optimizedNodes: number
    memoizedNodes: number
    persistedNodes: number
    totalSize: number
    optimizedSize: number
    averageAccessCount: number
    performanceScore: number
  }
  nodes: StateNode[]
  optimizations: StateOptimization[]
  recommendations: string[]
  performance: {
    averageRenderTime: number
    memoryUsage: number
    updateFrequency: number
    subscriberEfficiency: number
  }
}

export interface StateOperation {
  id: string
  nodeId: string
  type: 'optimize' | 'memoize' | 'normalize' | 'split' | 'merge' | 'persist'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  duration?: number
  result?: any
  error?: string
  progress: number
}

export interface StateConfig {
  memoization: {
    enabled: boolean
    maxCacheSize: number
    ttl: number
    strategies: string[]
  }
  normalization: {
    enabled: boolean
    maxDepth: number
    strategies: string[]
  }
  pagination: {
    enabled: boolean
    defaultPageSize: number
    maxPageSize: number
  }
  lazyLoading: {
    enabled: boolean
    threshold: number
    strategies: string[]
  }
  selectiveUpdate: {
    enabled: boolean
    strategies: string[]
  }
  stateSplitting: {
    enabled: boolean
    maxNodeSize: number
    strategies: string[]
  }
}

// Clase principal del servicio de optimización de estado
export class StateOptimizationService {
  private static instance: StateOptimizationService
  private nodes: StateNode[] = []
  private optimizations: StateOptimization[] = []
  private operations: StateOperation[] = []
  private config: StateConfig
  private isInitialized = false

  private constructor() {
    this.config = {
      memoization: {
        enabled: true,
        maxCacheSize: 1000,
        ttl: 300000, // 5 minutes
        strategies: ['shallow', 'deep', 'selective'],
      },
      normalization: {
        enabled: true,
        maxDepth: 10,
        strategies: ['flatten', 'normalize', 'denormalize'],
      },
      pagination: {
        enabled: true,
        defaultPageSize: 20,
        maxPageSize: 100,
      },
      lazyLoading: {
        enabled: true,
        threshold: 1000,
        strategies: ['virtual', 'infinite', 'progressive'],
      },
      selectiveUpdate: {
        enabled: true,
        strategies: ['shallow', 'deep', 'immutable'],
      },
      stateSplitting: {
        enabled: true,
        maxNodeSize: 10000,
        strategies: ['domain', 'feature', 'component'],
      },
    }
    this.initializeStateOptimization()
  }

  static getInstance(): StateOptimizationService {
    if (!StateOptimizationService.instance) {
      StateOptimizationService.instance = new StateOptimizationService()
    }
    return StateOptimizationService.instance
  }

  // Inicializar optimización de estado
  private initializeStateOptimization(): void {
    this.analyzeStateTree()
    this.identifyOptimizationOpportunities()
    this.isInitialized = true
  }

  // Analizar árbol de estado
  private analyzeStateTree(): void {
    // Simular análisis del árbol de estado
    this.nodes = [
      {
        id: 'node-1',
        path: 'user',
        type: 'object',
        value: { id: 1, name: 'John Doe', email: 'john@example.com' },
        size: 150,
        isOptimized: true,
        isMemoized: true,
        isPersisted: true,
        accessCount: 1000,
        lastAccessed: new Date(),
        dependencies: [],
        subscribers: ['UserProfile', 'UserMenu'],
        metadata: { depth: 1, complexity: 'low' },
      },
      {
        id: 'node-2',
        path: 'users',
        type: 'array',
        value: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `User ${i}` })),
        size: 5000,
        isOptimized: false,
        isMemoized: false,
        isPersisted: false,
        accessCount: 500,
        lastAccessed: new Date(),
        dependencies: ['user'],
        subscribers: ['UserList', 'UserSearch'],
        metadata: { depth: 1, complexity: 'high', itemCount: 100 },
      },
      {
        id: 'node-3',
        path: 'events',
        type: 'array',
        value: Array.from({ length: 50 }, (_, i) => ({ id: i, title: `Event ${i}`, date: new Date() })),
        size: 2500,
        isOptimized: true,
        isMemoized: true,
        isPersisted: false,
        accessCount: 300,
        lastAccessed: new Date(),
        dependencies: [],
        subscribers: ['EventList', 'EventCalendar'],
        metadata: { depth: 1, complexity: 'medium', itemCount: 50 },
      },
      {
        id: 'node-4',
        path: 'ui.loading',
        type: 'primitive',
        value: false,
        size: 10,
        isOptimized: true,
        isMemoized: true,
        isPersisted: false,
        accessCount: 2000,
        lastAccessed: new Date(),
        dependencies: [],
        subscribers: ['LoadingSpinner', 'Button'],
        metadata: { depth: 2, complexity: 'low' },
      },
      {
        id: 'node-5',
        path: 'ui.theme',
        type: 'object',
        value: { mode: 'dark', colors: { primary: '#000', secondary: '#fff' } },
        size: 100,
        isOptimized: true,
        isMemoized: true,
        isPersisted: true,
        accessCount: 100,
        lastAccessed: new Date(),
        dependencies: [],
        subscribers: ['ThemeProvider', 'Button', 'Card'],
        metadata: { depth: 2, complexity: 'low' },
      },
      {
        id: 'node-6',
        path: 'cache',
        type: 'object',
        value: { data: {}, timestamps: {}, ttl: 300000 },
        size: 2000,
        isOptimized: false,
        isMemoized: false,
        isPersisted: false,
        accessCount: 1500,
        lastAccessed: new Date(),
        dependencies: [],
        subscribers: ['CacheManager', 'DataProvider'],
        metadata: { depth: 1, complexity: 'medium' },
      },
    ]
  }

  // Identificar oportunidades de optimización
  private identifyOptimizationOpportunities(): void {
    // Simular identificación de oportunidades
    const unoptimizedNodes = this.nodes.filter(node => !node.isOptimized)
    const largeNodes = this.nodes.filter(node => node.size > this.config.stateSplitting.maxNodeSize)
    const frequentlyAccessedNodes = this.nodes.filter(node => node.accessCount > 1000)
    
    console.log(`Found ${unoptimizedNodes.length} unoptimized state nodes`)
    console.log(`Found ${largeNodes.length} large state nodes`)
    console.log(`Found ${frequentlyAccessedNodes.length} frequently accessed nodes`)
  }

  // Optimizar nodo de estado
  async optimizeNode(nodeId: string, optimizationType: StateOptimization['type']): Promise<StateOptimization> {
    const node = this.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    const operation: StateOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nodeId,
      type: 'optimize',
      status: 'processing',
      startTime: new Date(),
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular proceso de optimización
      for (let progress = 0; progress <= 100; progress += 25) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const beforeSize = node.size
      const afterSize = this.calculateOptimizedSize(node, optimizationType)
      const performanceGain = this.calculatePerformanceGain(node, optimizationType)

      const optimization: StateOptimization = {
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nodeId,
        type: optimizationType,
        description: this.getOptimizationDescription(optimizationType),
        beforeSize,
        afterSize,
        performanceGain,
        appliedAt: new Date(),
        status: 'pending',
        metrics: {
          renderTime: this.calculateRenderTime(node),
          memoryUsage: afterSize,
          updateFrequency: node.accessCount,
          subscriberCount: node.subscribers.length,
        },
      }

      this.optimizations.push(optimization)

      // Aplicar optimización
      this.applyOptimization(node, optimizationType)

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

  // Memoizar nodo
  async memoizeNode(nodeId: string): Promise<StateOptimization> {
    const node = this.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    const operation: StateOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nodeId,
      type: 'memoize',
      status: 'processing',
      startTime: new Date(),
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular proceso de memoización
      for (let progress = 0; progress <= 100; progress += 30) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 75))
      }

      const beforeSize = node.size
      const afterSize = Math.round(node.size * 0.8) // Memoización reduce el tamaño
      const performanceGain = 25 // 25% de mejora en rendimiento

      const optimization: StateOptimization = {
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nodeId,
        type: 'memoization',
        description: 'Applied memoization to reduce re-computations',
        beforeSize,
        afterSize,
        performanceGain,
        appliedAt: new Date(),
        status: 'applied',
        metrics: {
          renderTime: this.calculateRenderTime(node) * 0.75,
          memoryUsage: afterSize,
          updateFrequency: node.accessCount,
          subscriberCount: node.subscribers.length,
        },
      }

      this.optimizations.push(optimization)

      // Aplicar memoización
      node.isMemoized = true
      node.isOptimized = true
      node.size = afterSize

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

  // Normalizar nodo
  async normalizeNode(nodeId: string): Promise<StateOptimization> {
    const node = this.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    const operation: StateOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nodeId,
      type: 'normalize',
      status: 'processing',
      startTime: new Date(),
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular proceso de normalización
      for (let progress = 0; progress <= 100; progress += 20) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const beforeSize = node.size
      const afterSize = Math.round(node.size * 0.6) // Normalización reduce el tamaño
      const performanceGain = 40 // 40% de mejora en rendimiento

      const optimization: StateOptimization = {
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nodeId,
        type: 'normalization',
        description: 'Applied normalization to reduce data duplication',
        beforeSize,
        afterSize,
        performanceGain,
        appliedAt: new Date(),
        status: 'applied',
        metrics: {
          renderTime: this.calculateRenderTime(node) * 0.6,
          memoryUsage: afterSize,
          updateFrequency: node.accessCount,
          subscriberCount: node.subscribers.length,
        },
      }

      this.optimizations.push(optimization)

      // Aplicar normalización
      node.isOptimized = true
      node.size = afterSize

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

  // Dividir nodo de estado
  async splitNode(nodeId: string): Promise<StateOptimization> {
    const node = this.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    const operation: StateOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nodeId,
      type: 'split',
      status: 'processing',
      startTime: new Date(),
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular proceso de división
      for (let progress = 0; progress <= 100; progress += 25) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 120))
      }

      const beforeSize = node.size
      const afterSize = Math.round(node.size * 0.7) // División reduce el tamaño
      const performanceGain = 30 // 30% de mejora en rendimiento

      const optimization: StateOptimization = {
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nodeId,
        type: 'state_splitting',
        description: 'Split large state node into smaller, focused nodes',
        beforeSize,
        afterSize,
        performanceGain,
        appliedAt: new Date(),
        status: 'applied',
        metrics: {
          renderTime: this.calculateRenderTime(node) * 0.7,
          memoryUsage: afterSize,
          updateFrequency: node.accessCount,
          subscriberCount: node.subscribers.length,
        },
      }

      this.optimizations.push(optimization)

      // Aplicar división
      node.isOptimized = true
      node.size = afterSize

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

  // Calcular tamaño optimizado
  private calculateOptimizedSize(node: StateNode, optimizationType: StateOptimization['type']): number {
    const baseSize = node.size
    const optimizationRatios: Record<StateOptimization['type'], number> = {
      memoization: 0.8,
      normalization: 0.6,
      pagination: 0.5,
      lazy_loading: 0.4,
      selective_update: 0.7,
      state_splitting: 0.7,
    }

    return Math.round(baseSize * optimizationRatios[optimizationType])
  }

  // Calcular ganancia de rendimiento
  private calculatePerformanceGain(node: StateNode, optimizationType: StateOptimization['type']): number {
    const baseGain = 20
    const typeMultipliers: Record<StateOptimization['type'], number> = {
      memoization: 1.25,
      normalization: 2.0,
      pagination: 1.5,
      lazy_loading: 2.5,
      selective_update: 1.75,
      state_splitting: 1.5,
    }

    return Math.round(baseGain * typeMultipliers[optimizationType])
  }

  // Calcular tiempo de renderizado
  private calculateRenderTime(node: StateNode): number {
    const baseTime = 10 // 10ms base
    const sizeMultiplier = node.size / 1000
    const complexityMultiplier = node.metadata.complexity === 'high' ? 2 : node.metadata.complexity === 'medium' ? 1.5 : 1
    const subscriberMultiplier = node.subscribers.length / 10

    return Math.round(baseTime * sizeMultiplier * complexityMultiplier * subscriberMultiplier)
  }

  // Obtener descripción de optimización
  private getOptimizationDescription(optimizationType: StateOptimization['type']): string {
    const descriptions: Record<StateOptimization['type'], string> = {
      memoization: 'Applied memoization to cache computed values',
      normalization: 'Applied normalization to reduce data duplication',
      pagination: 'Applied pagination to handle large datasets',
      lazy_loading: 'Applied lazy loading to load data on demand',
      selective_update: 'Applied selective updates to minimize re-renders',
      state_splitting: 'Split large state node into smaller, focused nodes',
    }

    return descriptions[optimizationType]
  }

  // Aplicar optimización
  private applyOptimization(node: StateNode, optimizationType: StateOptimization['type']): void {
    node.isOptimized = true
    node.size = this.calculateOptimizedSize(node, optimizationType)

    switch (optimizationType) {
      case 'memoization':
        node.isMemoized = true
        break
      case 'normalization':
        // Aplicar normalización
        break
      case 'pagination':
        // Aplicar paginación
        break
      case 'lazy_loading':
        // Aplicar lazy loading
        break
      case 'selective_update':
        // Aplicar actualizaciones selectivas
        break
      case 'state_splitting':
        // Aplicar división de estado
        break
    }
  }

  // Obtener nodos no optimizados
  getUnoptimizedNodes(): StateNode[] {
    return this.nodes.filter(node => !node.isOptimized)
  }

  // Obtener nodos grandes
  getLargeNodes(): StateNode[] {
    return this.nodes.filter(node => node.size > this.config.stateSplitting.maxNodeSize)
  }

  // Obtener nodos frecuentemente accedidos
  getFrequentlyAccessedNodes(): StateNode[] {
    return this.nodes.filter(node => node.accessCount > 1000)
  }

  // Obtener nodos por tipo
  getNodesByType(type: StateNode['type']): StateNode[] {
    return this.nodes.filter(node => node.type === type)
  }

  // Obtener operaciones por estado
  getOperationsByStatus(status: StateOperation['status']): StateOperation[] {
    return this.operations.filter(operation => operation.status === status)
  }

  // Generar analytics de estado
  generateStateAnalytics(): StateAnalytics {
    const totalNodes = this.nodes.length
    const optimizedNodes = this.nodes.filter(n => n.isOptimized).length
    const memoizedNodes = this.nodes.filter(n => n.isMemoized).length
    const persistedNodes = this.nodes.filter(n => n.isPersisted).length
    const totalSize = this.nodes.reduce((sum, n) => sum + n.size, 0)
    const optimizedSize = this.nodes.filter(n => n.isOptimized).reduce((sum, n) => sum + n.size, 0)
    const averageAccessCount = this.nodes.length > 0
      ? this.nodes.reduce((sum, n) => sum + n.accessCount, 0) / this.nodes.length
      : 0
    const performanceScore = this.calculatePerformanceScore()

    const performance = {
      averageRenderTime: this.nodes.length > 0
        ? this.nodes.reduce((sum, n) => sum + this.calculateRenderTime(n), 0) / this.nodes.length
        : 0,
      memoryUsage: totalSize,
      updateFrequency: this.nodes.reduce((sum, n) => sum + n.accessCount, 0),
      subscriberEfficiency: this.nodes.length > 0
        ? this.nodes.reduce((sum, n) => sum + n.subscribers.length, 0) / this.nodes.length
        : 0,
    }

    const recommendations = this.generateRecommendations()

    return {
      id: `state_analytics_${Date.now()}`,
      timestamp: new Date(),
      summary: {
        totalNodes,
        optimizedNodes,
        memoizedNodes,
        persistedNodes,
        totalSize,
        optimizedSize,
        averageAccessCount,
        performanceScore,
      },
      nodes: [...this.nodes],
      optimizations: [...this.optimizations],
      recommendations,
      performance,
    }
  }

  // Calcular puntuación de rendimiento
  private calculatePerformanceScore(): number {
    const optimizedRatio = this.nodes.length > 0
      ? this.nodes.filter(n => n.isOptimized).length / this.nodes.length
      : 0
    const memoizedRatio = this.nodes.length > 0
      ? this.nodes.filter(n => n.isMemoized).length / this.nodes.length
      : 0
    const averageRenderTime = this.nodes.length > 0
      ? this.nodes.reduce((sum, n) => sum + this.calculateRenderTime(n), 0) / this.nodes.length
      : 0

    const renderTimeScore = Math.max(0, 100 - (averageRenderTime / 10))
    const optimizationScore = optimizedRatio * 50
    const memoizationScore = memoizedRatio * 30

    return Math.round(renderTimeScore + optimizationScore + memoizationScore)
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const unoptimizedNodes = this.getUnoptimizedNodes()
    if (unoptimizedNodes.length > 0) {
      recommendations.push(`${unoptimizedNodes.length} nodos de estado no están optimizados`)
    }

    const largeNodes = this.getLargeNodes()
    if (largeNodes.length > 0) {
      recommendations.push(`${largeNodes.length} nodos de estado son demasiado grandes`)
    }

    const frequentlyAccessedNodes = this.getFrequentlyAccessedNodes()
    if (frequentlyAccessedNodes.length > 0) {
      recommendations.push(`${frequentlyAccessedNodes.length} nodos son accedidos frecuentemente`)
    }

    const unmemoizedNodes = this.nodes.filter(n => !n.isMemoized && n.accessCount > 100)
    if (unmemoizedNodes.length > 0) {
      recommendations.push(`${unmemoizedNodes.length} nodos frecuentemente accedidos no están memoizados`)
    }

    const unpersistedNodes = this.nodes.filter(n => !n.isPersisted && n.type === 'object')
    if (unpersistedNodes.length > 0) {
      recommendations.push(`${unpersistedNodes.length} nodos de objeto no están persistidos`)
    }

    return recommendations
  }

  // Obtener todos los nodos
  getAllNodes(): StateNode[] {
    return [...this.nodes]
  }

  // Obtener todas las optimizaciones
  getAllOptimizations(): StateOptimization[] {
    return [...this.optimizations]
  }

  // Obtener todas las operaciones
  getAllOperations(): StateOperation[] {
    return [...this.operations]
  }

  // Obtener configuración
  getConfig(): StateConfig {
    return { ...this.config }
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<StateConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Limpiar datos
  clearData(): void {
    this.nodes = []
    this.optimizations = []
    this.operations = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      nodes: this.nodes,
      optimizations: this.optimizations,
      operations: this.operations,
      analytics: this.generateStateAnalytics(),
      config: this.config,
    }, null, 2)
  }
}

// Instancia global del servicio
export const stateOptimizationService = StateOptimizationService.getInstance()

// Hook para usar el servicio de optimización de estado
export function useStateOptimization() {
  const [nodes, setNodes] = useState<StateNode[]>([])
  const [optimizations, setOptimizations] = useState<StateOptimization[]>([])
  const [operations, setOperations] = useState<StateOperation[]>([])
  const [analytics, setAnalytics] = useState<StateAnalytics | null>(null)

  useEffect(() => {
    setNodes(stateOptimizationService.getAllNodes())
    setOptimizations(stateOptimizationService.getAllOptimizations())
    setOperations(stateOptimizationService.getAllOperations())
    setAnalytics(stateOptimizationService.generateStateAnalytics())
  }, [])

  const optimizeNode = useCallback(async (nodeId: string, optimizationType: StateOptimization['type']) => {
    const optimization = await stateOptimizationService.optimizeNode(nodeId, optimizationType)
    setNodes(stateOptimizationService.getAllNodes())
    setOptimizations(stateOptimizationService.getAllOptimizations())
    setOperations(stateOptimizationService.getAllOperations())
    setAnalytics(stateOptimizationService.generateStateAnalytics())
    return optimization
  }, [])

  const memoizeNode = useCallback(async (nodeId: string) => {
    const optimization = await stateOptimizationService.memoizeNode(nodeId)
    setNodes(stateOptimizationService.getAllNodes())
    setOptimizations(stateOptimizationService.getAllOptimizations())
    setOperations(stateOptimizationService.getAllOperations())
    setAnalytics(stateOptimizationService.generateStateAnalytics())
    return optimization
  }, [])

  const normalizeNode = useCallback(async (nodeId: string) => {
    const optimization = await stateOptimizationService.normalizeNode(nodeId)
    setNodes(stateOptimizationService.getAllNodes())
    setOptimizations(stateOptimizationService.getAllOptimizations())
    setOperations(stateOptimizationService.getAllOperations())
    setAnalytics(stateOptimizationService.generateStateAnalytics())
    return optimization
  }, [])

  const splitNode = useCallback(async (nodeId: string) => {
    const optimization = await stateOptimizationService.splitNode(nodeId)
    setNodes(stateOptimizationService.getAllNodes())
    setOptimizations(stateOptimizationService.getAllOptimizations())
    setOperations(stateOptimizationService.getAllOperations())
    setAnalytics(stateOptimizationService.generateStateAnalytics())
    return optimization
  }, [])

  const generateStateAnalytics = useCallback(() => {
    const newAnalytics = stateOptimizationService.generateStateAnalytics()
    setAnalytics(newAnalytics)
    return newAnalytics
  }, [])

  const clearData = useCallback(() => {
    stateOptimizationService.clearData()
    setNodes([])
    setOptimizations([])
    setOperations([])
    setAnalytics(null)
  }, [])

  const exportData = useCallback(() => {
    return stateOptimizationService.exportData()
  }, [])

  return {
    nodes,
    optimizations,
    operations,
    analytics,
    optimizeNode,
    memoizeNode,
    normalizeNode,
    splitNode,
    generateStateAnalytics,
    clearData,
    exportData,
  }
}

// Componente de dashboard de optimización de estado
interface StateOptimizationDashboardProps {
  className?: string
}

export const StateOptimizationDashboard: React.FC<StateOptimizationDashboardProps> = ({ className = '' }) => {
  const { nodes, optimizations, operations, analytics, optimizeNode, memoizeNode, normalizeNode, splitNode, generateStateAnalytics, clearData, exportData } = useStateOptimization()

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const getTypeColor = (type: StateNode['type']) => {
    switch (type) {
      case 'object': return 'text-blue-600 bg-blue-100'
      case 'array': return 'text-green-600 bg-green-100'
      case 'primitive': return 'text-purple-600 bg-purple-100'
      case 'function': return 'text-orange-600 bg-orange-100'
      case 'component': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getOptimizationTypeColor = (type: StateOptimization['type']) => {
    switch (type) {
      case 'memoization': return 'text-blue-600 bg-blue-100'
      case 'normalization': return 'text-green-600 bg-green-100'
      case 'pagination': return 'text-purple-600 bg-purple-100'
      case 'lazy_loading': return 'text-orange-600 bg-orange-100'
      case 'selective_update': return 'text-red-600 bg-red-100'
      case 'state_splitting': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: StateOperation['status']) => {
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
        <h2 className="text-xl font-semibold text-gray-800">State Optimization Dashboard</h2>
        <div className="space-x-2">
          <button
            onClick={() => memoizeNode('node-2')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Memoization
          </button>
          <button
            onClick={() => normalizeNode('node-2')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Normalization
          </button>
          <button
            onClick={() => splitNode('node-2')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Splitting
          </button>
          <button
            onClick={generateStateAnalytics}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
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
              a.download = 'state-optimization-data.json'
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
          <h3 className="text-lg font-medium text-gray-800 mb-3">State Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Nodes</h4>
              <p className="text-2xl font-bold text-gray-800">{analytics.summary.totalNodes}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Optimized</h4>
              <p className="text-2xl font-bold text-green-600">{analytics.summary.optimizedNodes}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Memoized</h4>
              <p className="text-2xl font-bold text-blue-600">{analytics.summary.memoizedNodes}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Performance Score</h4>
              <p className="text-2xl font-bold text-purple-600">{analytics.summary.performanceScore}/100</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">State Nodes</h3>
          <div className="space-y-2">
            {nodes.slice(-5).map(node => (
              <div key={node.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{node.path}</h4>
                    <p className="text-xs text-gray-600">
                      Size: {formatSize(node.size)} | 
                      Access Count: {node.accessCount} | 
                      Subscribers: {node.subscribers.length}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(node.type)}`}>
                      {node.type}
                    </span>
                    {node.isOptimized ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Optimized
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Optimized
                      </span>
                    )}
                    {node.isMemoized && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Memoized
                      </span>
                    )}
                    {node.isPersisted && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Persisted
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => memoizeNode(node.id)}
                    disabled={node.isMemoized}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Memoize
                  </button>
                  <button
                    onClick={() => normalizeNode(node.id)}
                    disabled={node.isOptimized}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Normalize
                  </button>
                  <button
                    onClick={() => splitNode(node.id)}
                    disabled={node.isOptimized}
                    className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                  >
                    Split
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Optimizations</h3>
          <div className="space-y-2">
            {optimizations.slice(-5).map(optimization => (
              <div key={optimization.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{optimization.description}</h4>
                    <p className="text-xs text-gray-600">
                      Before: {formatSize(optimization.beforeSize)} | 
                      After: {formatSize(optimization.afterSize)} | 
                      Gain: {optimization.performanceGain}%
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOptimizationTypeColor(optimization.type)}`}>
                      {optimization.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      optimization.status === 'applied' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {optimization.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Applied: {optimization.appliedAt.toLocaleTimeString()}
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
                      {operation.type.toUpperCase()} - {operation.nodeId}
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
