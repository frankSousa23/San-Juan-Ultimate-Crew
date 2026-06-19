import React, { useState, useEffect, useCallback } from 'react';

// Sistema de optimización de bundle y code splitting
export interface BundleChunk {
  id: string
  name: string
  size: number
  modules: string[]
  dependencies: string[]
  isAsync: boolean
  isVendor: boolean
  isCommon: boolean
}

export interface BundleAnalysis {
  totalSize: number
  chunkCount: number
  vendorSize: number
  commonSize: number
  asyncSize: number
  duplicateModules: string[]
  unusedModules: string[]
  largeChunks: BundleChunk[]
  recommendations: string[]
}

export interface CodeSplittingConfig {
  maxChunkSize: number
  minChunkSize: number
  vendorChunkSize: number
  commonChunkSize: number
  asyncChunkSize: number
  enableTreeShaking: boolean
  enableMinification: boolean
  enableCompression: boolean
}

// Clase principal para optimización de bundle
export class BundleOptimizer {
  private static instance: BundleOptimizer
  private chunks: BundleChunk[] = []
  private config: CodeSplittingConfig

  private constructor() {
    this.config = {
      maxChunkSize: 500000, // 500KB
      minChunkSize: 10000,  // 10KB
      vendorChunkSize: 200000, // 200KB
      commonChunkSize: 100000, // 100KB
      asyncChunkSize: 50000, // 50KB
      enableTreeShaking: true,
      enableMinification: true,
      enableCompression: true,
    }
    this.initializeBundleOptimization()
  }

  static getInstance(): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer()
    }
    return BundleOptimizer.instance
  }

  // Inicializar optimización de bundle
  private initializeBundleOptimization(): void {
    this.analyzeBundleChunks()
    this.optimizeChunkSplitting()
    this.identifyDuplicateModules()
    this.identifyUnusedModules()
    this.generateOptimizationRecommendations()
  }

  // Analizar chunks del bundle
  private analyzeBundleChunks(): void {
    // Simular análisis de chunks
    this.chunks = [
      {
        id: 'vendor',
        name: 'vendor.js',
        size: 180000,
        modules: ['react', 'react-dom', 'lodash', 'axios'],
        dependencies: [],
        isAsync: false,
        isVendor: true,
        isCommon: false,
      },
      {
        id: 'common',
        name: 'common.js',
        size: 80000,
        modules: ['utils', 'constants', 'types'],
        dependencies: ['vendor'],
        isAsync: false,
        isVendor: false,
        isCommon: true,
      },
      {
        id: 'main',
        name: 'main.js',
        size: 120000,
        modules: ['App', 'Layout', 'Dashboard'],
        dependencies: ['vendor', 'common'],
        isAsync: false,
        isVendor: false,
        isCommon: false,
      },
      {
        id: 'roster',
        name: 'roster.js',
        size: 60000,
        modules: ['Roster', 'PlayerCard', 'PlayerForm'],
        dependencies: ['vendor', 'common'],
        isAsync: true,
        isVendor: false,
        isCommon: false,
      },
      {
        id: 'events',
        name: 'events.js',
        size: 70000,
        modules: ['Events', 'EventCard', 'EventForm'],
        dependencies: ['vendor', 'common'],
        isAsync: true,
        isVendor: false,
        isCommon: false,
      },
      {
        id: 'admin',
        name: 'admin.js',
        size: 90000,
        modules: ['AdminUsers', 'UserManagement', 'SystemMonitoring'],
        dependencies: ['vendor', 'common'],
        isAsync: true,
        isVendor: false,
        isCommon: false,
      },
    ]
  }

  // Optimizar división de chunks
  private optimizeChunkSplitting(): void {
    // Simular optimización de chunks
    this.chunks = this.chunks.map(chunk => {
      if (chunk.size > this.config.maxChunkSize) {
        // Dividir chunks grandes
        const newChunks = this.splitLargeChunk(chunk)
        return newChunks[0] // Retornar el primer chunk
      }
      return chunk
    })
  }

  // Dividir chunk grande
  private splitLargeChunk(chunk: BundleChunk): BundleChunk[] {
    const newChunks: BundleChunk[] = []
    const modulesPerChunk = Math.ceil(chunk.modules.length / 2)
    
    for (let i = 0; i < chunk.modules.length; i += modulesPerChunk) {
      const chunkModules = chunk.modules.slice(i, i + modulesPerChunk)
      const newChunk: BundleChunk = {
        id: `${chunk.id}_${i}`,
        name: `${chunk.name}_${i}`,
        size: Math.round(chunk.size / 2),
        modules: chunkModules,
        dependencies: chunk.dependencies,
        isAsync: chunk.isAsync,
        isVendor: chunk.isVendor,
        isCommon: chunk.isCommon,
      }
      newChunks.push(newChunk)
    }
    
    return newChunks
  }

  // Identificar módulos duplicados
  private identifyDuplicateModules(): string[] {
    const moduleCount = new Map<string, number>()
    
    this.chunks.forEach(chunk => {
      chunk.modules.forEach(module => {
        moduleCount.set(module, (moduleCount.get(module) || 0) + 1)
      })
    })
    
    return Array.from(moduleCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([module, _]) => module)
  }

  // Identificar módulos no utilizados
  private identifyUnusedModules(): string[] {
    // Simular identificación de módulos no utilizados
    return ['unused-module-1', 'unused-module-2', 'deprecated-util']
  }

  // Generar recomendaciones de optimización
  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    
    const largeChunks = this.chunks.filter(chunk => chunk.size > this.config.maxChunkSize)
    if (largeChunks.length > 0) {
      recommendations.push(`${largeChunks.length} chunks exceden el tamaño máximo recomendado`)
    }
    
    const duplicateModules = this.identifyDuplicateModules()
    if (duplicateModules.length > 0) {
      recommendations.push(`${duplicateModules.length} módulos están duplicados en múltiples chunks`)
    }
    
    const unusedModules = this.identifyUnusedModules()
    if (unusedModules.length > 0) {
      recommendations.push(`${unusedModules.length} módulos no están siendo utilizados`)
    }
    
    const vendorChunk = this.chunks.find(chunk => chunk.isVendor)
    if (vendorChunk && vendorChunk.size > this.config.vendorChunkSize) {
      recommendations.push('El chunk de vendor es demasiado grande, considerar dividirlo')
    }
    
    const asyncChunks = this.chunks.filter(chunk => chunk.isAsync)
    if (asyncChunks.length < 3) {
      recommendations.push('Considerar implementar más code splitting para mejorar el rendimiento inicial')
    }
    
    return recommendations
  }

  // Obtener análisis del bundle
  getBundleAnalysis(): BundleAnalysis {
    const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0)
    const vendorSize = this.chunks.filter(chunk => chunk.isVendor).reduce((sum, chunk) => sum + chunk.size, 0)
    const commonSize = this.chunks.filter(chunk => chunk.isCommon).reduce((sum, chunk) => sum + chunk.size, 0)
    const asyncSize = this.chunks.filter(chunk => chunk.isAsync).reduce((sum, chunk) => sum + chunk.size, 0)
    
    const largeChunks = this.chunks.filter(chunk => chunk.size > this.config.maxChunkSize)
    const duplicateModules = this.identifyDuplicateModules()
    const unusedModules = this.identifyUnusedModules()
    const recommendations = this.generateOptimizationRecommendations()
    
    return {
      totalSize,
      chunkCount: this.chunks.length,
      vendorSize,
      commonSize,
      asyncSize,
      duplicateModules,
      unusedModules,
      largeChunks,
      recommendations,
    }
  }

  // Optimizar configuración
  optimizeConfig(): void {
    // Simular optimización de configuración
    this.config.maxChunkSize = Math.min(this.config.maxChunkSize, 400000)
    this.config.vendorChunkSize = Math.min(this.config.vendorChunkSize, 150000)
    this.config.commonChunkSize = Math.min(this.config.commonChunkSize, 80000)
  }

  // Obtener chunks
  getChunks(): BundleChunk[] {
    return [...this.chunks]
  }

  // Obtener configuración
  getConfig(): CodeSplittingConfig {
    return { ...this.config }
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<CodeSplittingConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Exportar análisis
  exportAnalysis(): string {
    return JSON.stringify({
      analysis: this.getBundleAnalysis(),
      chunks: this.chunks,
      config: this.config,
    }, null, 2)
  }
}

// Instancia global del optimizador
export const bundleOptimizer = BundleOptimizer.getInstance()

// Hook para usar el optimizador de bundle
export function useBundleOptimization() {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null)
  const [chunks, setChunks] = useState<BundleChunk[]>([])
  const [config, setConfig] = useState<CodeSplittingConfig | null>(null)

  useEffect(() => {
    setAnalysis(bundleOptimizer.getBundleAnalysis())
    setChunks(bundleOptimizer.getChunks())
    setConfig(bundleOptimizer.getConfig())
  }, [])

  const optimizeConfig = useCallback(() => {
    bundleOptimizer.optimizeConfig()
    setConfig(bundleOptimizer.getConfig())
    setAnalysis(bundleOptimizer.getBundleAnalysis())
  }, [])

  const updateConfig = useCallback((newConfig: Partial<CodeSplittingConfig>) => {
    bundleOptimizer.updateConfig(newConfig)
    setConfig(bundleOptimizer.getConfig())
    setAnalysis(bundleOptimizer.getBundleAnalysis())
  }, [])

  const exportAnalysis = useCallback(() => {
    return bundleOptimizer.exportAnalysis()
  }, [])

  return {
    analysis,
    chunks,
    config,
    optimizeConfig,
    updateConfig,
    exportAnalysis,
  }
}

// Componente de dashboard de optimización de bundle
interface BundleOptimizationDashboardProps {
  className?: string
}

export const BundleOptimizationDashboard: React.FC<BundleOptimizationDashboardProps> = ({ className = '' }) => {
  const { analysis, chunks, config, optimizeConfig, updateConfig, exportAnalysis } = useBundleOptimization()

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const getChunkTypeColor = (chunk: BundleChunk) => {
    if (chunk.isVendor) return 'bg-blue-100 text-blue-800'
    if (chunk.isCommon) return 'bg-green-100 text-green-800'
    if (chunk.isAsync) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getChunkTypeLabel = (chunk: BundleChunk) => {
    if (chunk.isVendor) return 'Vendor'
    if (chunk.isCommon) return 'Common'
    if (chunk.isAsync) return 'Async'
    return 'Main'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Bundle Optimization Dashboard</h2>
        <div className="space-x-2">
          <button
            onClick={optimizeConfig}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Optimize Config
          </button>
          <button
            onClick={() => {
              const data = exportAnalysis()
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'bundle-analysis.json'
              a.click()
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Export Analysis
          </button>
        </div>
      </div>

      {analysis && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Bundle Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Size</h4>
              <p className="text-2xl font-bold text-gray-800">{formatSize(analysis.totalSize)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Chunk Count</h4>
              <p className="text-2xl font-bold text-blue-600">{analysis.chunkCount}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Vendor Size</h4>
              <p className="text-2xl font-bold text-green-600">{formatSize(analysis.vendorSize)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Async Size</h4>
              <p className="text-2xl font-bold text-orange-600">{formatSize(analysis.asyncSize)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Bundle Chunks</h3>
          <div className="space-y-2">
            {chunks.map(chunk => (
              <div key={chunk.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{chunk.name}</h4>
                    <p className="text-xs text-gray-600">Modules: {chunk.modules.length}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChunkTypeColor(chunk)}`}>
                      {getChunkTypeLabel(chunk)}
                    </span>
                    <span className="text-sm text-gray-600">{formatSize(chunk.size)}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Modules: {chunk.modules.slice(0, 3).join(', ')}
                  {chunk.modules.length > 3 && ` +${chunk.modules.length - 3} more`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {analysis && analysis.recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Optimization Recommendations</h3>
            <div className="space-y-2">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}