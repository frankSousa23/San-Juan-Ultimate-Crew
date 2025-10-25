import React, { useState, useEffect, useCallback } from 'react'

// Sistema de optimización de imágenes y assets
export interface AssetInfo {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'font' | 'document' | 'other'
  originalSize: number
  optimizedSize: number
  format: string
  dimensions?: { width: number; height: number }
  quality: number
  compressionRatio: number
  url: string
  optimizedUrl?: string
  isOptimized: boolean
  optimizationDate?: Date
  metadata: Record<string, any>
}

export interface OptimizationConfig {
  imageFormats: string[]
  videoFormats: string[]
  audioFormats: string[]
  fontFormats: string[]
  maxImageSize: number
  maxVideoSize: number
  maxAudioSize: number
  maxFontSize: number
  qualitySettings: {
    high: number
    medium: number
    low: number
  }
  enableWebP: boolean
  enableAVIF: boolean
  enableCompression: boolean
  enableLazyLoading: boolean
  enableResponsiveImages: boolean
  enableProgressiveLoading: boolean
}

export interface OptimizationReport {
  id: string
  timestamp: Date
  summary: {
    totalAssets: number
    optimizedAssets: number
    totalOriginalSize: number
    totalOptimizedSize: number
    totalSavings: number
    averageCompressionRatio: number
    optimizationTime: number
  }
  assets: AssetInfo[]
  recommendations: string[]
  errors: string[]
}

export interface OptimizationOperation {
  id: string
  assetId: string
  type: 'compress' | 'resize' | 'format_convert' | 'quality_adjust'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  duration?: number
  originalSize: number
  optimizedSize?: number
  error?: string
  progress: number
}

// Clase principal del servicio de optimización de assets
export class AssetOptimizationService {
  private static instance: AssetOptimizationService
  private assets: AssetInfo[] = []
  private operations: OptimizationOperation[] = []
  private config: OptimizationConfig
  private isInitialized = false

  private constructor() {
    this.config = {
      imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'],
      videoFormats: ['mp4', 'webm', 'ogg'],
      audioFormats: ['mp3', 'wav', 'ogg', 'aac'],
      fontFormats: ['woff', 'woff2', 'ttf', 'otf'],
      maxImageSize: 5 * 1024 * 1024, // 5MB
      maxVideoSize: 50 * 1024 * 1024, // 50MB
      maxAudioSize: 10 * 1024 * 1024, // 10MB
      maxFontSize: 2 * 1024 * 1024, // 2MB
      qualitySettings: {
        high: 90,
        medium: 75,
        low: 60,
      },
      enableWebP: true,
      enableAVIF: true,
      enableCompression: true,
      enableLazyLoading: true,
      enableResponsiveImages: true,
      enableProgressiveLoading: true,
    }
    this.initializeAssetOptimization()
  }

  static getInstance(): AssetOptimizationService {
    if (!AssetOptimizationService.instance) {
      AssetOptimizationService.instance = new AssetOptimizationService()
    }
    return AssetOptimizationService.instance
  }

  // Inicializar optimización de assets
  private initializeAssetOptimization(): void {
    this.analyzeExistingAssets()
    this.identifyOptimizationOpportunities()
    this.isInitialized = true
  }

  // Analizar assets existentes
  private analyzeExistingAssets(): void {
    // Simular análisis de assets existentes
    this.assets = [
      {
        id: 'asset-1',
        name: 'hero-image.jpg',
        type: 'image',
        originalSize: 2048000, // 2MB
        optimizedSize: 512000, // 512KB
        format: 'jpg',
        dimensions: { width: 1920, height: 1080 },
        quality: 85,
        compressionRatio: 0.75,
        url: '/images/hero-image.jpg',
        optimizedUrl: '/images/optimized/hero-image.webp',
        isOptimized: true,
        optimizationDate: new Date(),
        metadata: {
          colorSpace: 'sRGB',
          bitDepth: 8,
          hasAlpha: false,
        },
      },
      {
        id: 'asset-2',
        name: 'product-video.mp4',
        type: 'video',
        originalSize: 15728640, // 15MB
        optimizedSize: 8388608, // 8MB
        format: 'mp4',
        quality: 80,
        compressionRatio: 0.47,
        url: '/videos/product-video.mp4',
        optimizedUrl: '/videos/optimized/product-video.mp4',
        isOptimized: true,
        optimizationDate: new Date(),
        metadata: {
          duration: 30,
          bitrate: 2000,
          resolution: '1920x1080',
        },
      },
      {
        id: 'asset-3',
        name: 'background-music.mp3',
        type: 'audio',
        originalSize: 3145728, // 3MB
        optimizedSize: 1572864, // 1.5MB
        format: 'mp3',
        quality: 128,
        compressionRatio: 0.5,
        url: '/audio/background-music.mp3',
        optimizedUrl: '/audio/optimized/background-music.mp3',
        isOptimized: true,
        optimizationDate: new Date(),
        metadata: {
          duration: 120,
          bitrate: 128,
          sampleRate: 44100,
        },
      },
      {
        id: 'asset-4',
        name: 'custom-font.woff2',
        type: 'font',
        originalSize: 1048576, // 1MB
        optimizedSize: 524288, // 512KB
        format: 'woff2',
        quality: 100,
        compressionRatio: 0.5,
        url: '/fonts/custom-font.woff2',
        isOptimized: true,
        optimizationDate: new Date(),
        metadata: {
          fontFamily: 'CustomFont',
          fontWeight: 400,
          fontStyle: 'normal',
        },
      },
      {
        id: 'asset-5',
        name: 'large-banner.png',
        type: 'image',
        originalSize: 8388608, // 8MB
        optimizedSize: 0, // Not optimized yet
        format: 'png',
        dimensions: { width: 2560, height: 1440 },
        quality: 100,
        compressionRatio: 0,
        url: '/images/large-banner.png',
        isOptimized: false,
        metadata: {
          colorSpace: 'sRGB',
          bitDepth: 8,
          hasAlpha: true,
        },
      },
    ]
  }

  // Identificar oportunidades de optimización
  private identifyOptimizationOpportunities(): void {
    // Simular identificación de oportunidades
    const unoptimizedAssets = this.assets.filter(asset => !asset.isOptimized)
    console.log(`Found ${unoptimizedAssets.length} assets that need optimization`)
  }

  // Optimizar asset
  async optimizeAsset(assetId: string, options?: {
    quality?: number
    format?: string
    dimensions?: { width: number; height: number }
  }): Promise<AssetInfo | null> {
    const asset = this.assets.find(a => a.id === assetId)
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`)
    }

    const operation: OptimizationOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      type: 'compress',
      status: 'processing',
      startTime: new Date(),
      originalSize: asset.originalSize,
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular proceso de optimización
      for (let progress = 0; progress <= 100; progress += 10) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Calcular tamaño optimizado
      const compressionRatio = options?.quality ? options.quality / 100 : 0.7
      const optimizedSize = Math.round(asset.originalSize * compressionRatio)

      // Actualizar asset
      asset.optimizedSize = optimizedSize
      asset.isOptimized = true
      asset.optimizationDate = new Date()
      asset.compressionRatio = 1 - (optimizedSize / asset.originalSize)
      
      if (options?.quality) {
        asset.quality = options.quality
      }
      
      if (options?.format) {
        asset.format = options.format
        asset.optimizedUrl = asset.url.replace(/\.[^/.]+$/, `.${options.format}`)
      }

      // Completar operación
      operation.status = 'completed'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      operation.optimizedSize = optimizedSize

      return asset
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      throw error
    }
  }

  // Optimizar múltiples assets
  async optimizeAssets(assetIds: string[], options?: any): Promise<AssetInfo[]> {
    const results: AssetInfo[] = []
    
    for (const assetId of assetIds) {
      try {
        const optimizedAsset = await this.optimizeAsset(assetId, options)
        if (optimizedAsset) {
          results.push(optimizedAsset)
        }
      } catch (error) {
        console.error(`Failed to optimize asset ${assetId}:`, error)
      }
    }
    
    return results
  }

  // Redimensionar imagen
  async resizeImage(assetId: string, dimensions: { width: number; height: number }): Promise<AssetInfo | null> {
    const asset = this.assets.find(a => a.id === assetId)
    if (!asset || asset.type !== 'image') {
      throw new Error(`Image asset ${assetId} not found`)
    }

    const operation: OptimizationOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      type: 'resize',
      status: 'processing',
      startTime: new Date(),
      originalSize: asset.originalSize,
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular redimensionamiento
      for (let progress = 0; progress <= 100; progress += 20) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Actualizar dimensiones
      asset.dimensions = dimensions
      
      // Calcular nuevo tamaño (aproximado)
      const sizeRatio = (dimensions.width * dimensions.height) / (asset.dimensions!.width * asset.dimensions!.height)
      asset.optimizedSize = Math.round(asset.originalSize * sizeRatio)

      // Completar operación
      operation.status = 'completed'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      operation.optimizedSize = asset.optimizedSize

      return asset
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      throw error
    }
  }

  // Convertir formato
  async convertFormat(assetId: string, targetFormat: string): Promise<AssetInfo | null> {
    const asset = this.assets.find(a => a.id === assetId)
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`)
    }

    const operation: OptimizationOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      type: 'format_convert',
      status: 'processing',
      startTime: new Date(),
      originalSize: asset.originalSize,
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular conversión de formato
      for (let progress = 0; progress <= 100; progress += 25) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 75))
      }

      // Actualizar formato
      const oldFormat = asset.format
      asset.format = targetFormat
      asset.optimizedUrl = asset.url.replace(`.${oldFormat}`, `.${targetFormat}`)
      
      // Calcular nuevo tamaño (aproximado)
      const formatCompressionRatios: Record<string, number> = {
        'webp': 0.7,
        'avif': 0.6,
        'jpg': 0.8,
        'png': 1.0,
        'gif': 0.9,
      }
      
      const compressionRatio = formatCompressionRatios[targetFormat] || 1.0
      asset.optimizedSize = Math.round(asset.originalSize * compressionRatio)
      asset.compressionRatio = 1 - (asset.optimizedSize / asset.originalSize)

      // Completar operación
      operation.status = 'completed'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      operation.optimizedSize = asset.optimizedSize

      return asset
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      throw error
    }
  }

  // Obtener assets por tipo
  getAssetsByType(type: AssetInfo['type']): AssetInfo[] {
    return this.assets.filter(asset => asset.type === type)
  }

  // Obtener assets no optimizados
  getUnoptimizedAssets(): AssetInfo[] {
    return this.assets.filter(asset => !asset.isOptimized)
  }

  // Obtener assets grandes
  getLargeAssets(): AssetInfo[] {
    return this.assets.filter(asset => {
      const maxSize = this.getMaxSizeForType(asset.type)
      return asset.originalSize > maxSize
    })
  }

  // Obtener tamaño máximo para tipo
  private getMaxSizeForType(type: AssetInfo['type']): number {
    switch (type) {
      case 'image': return this.config.maxImageSize
      case 'video': return this.config.maxVideoSize
      case 'audio': return this.config.maxAudioSize
      case 'font': return this.config.maxFontSize
      default: return 1024 * 1024 // 1MB
    }
  }

  // Obtener operaciones por estado
  getOperationsByStatus(status: OptimizationOperation['status']): OptimizationOperation[] {
    return this.operations.filter(operation => operation.status === status)
  }

  // Generar reporte de optimización
  generateOptimizationReport(): OptimizationReport {
    const totalAssets = this.assets.length
    const optimizedAssets = this.assets.filter(asset => asset.isOptimized).length
    const totalOriginalSize = this.assets.reduce((sum, asset) => sum + asset.originalSize, 0)
    const totalOptimizedSize = this.assets.reduce((sum, asset) => sum + asset.optimizedSize, 0)
    const totalSavings = totalOriginalSize - totalOptimizedSize
    const averageCompressionRatio = this.assets.length > 0 
      ? this.assets.reduce((sum, asset) => sum + asset.compressionRatio, 0) / this.assets.length 
      : 0

    const optimizationTime = this.operations
      .filter(op => op.duration)
      .reduce((sum, op) => sum + (op.duration || 0), 0)

    const recommendations = this.generateRecommendations()
    const errors = this.operations
      .filter(op => op.error)
      .map(op => op.error!)

    return {
      id: `optimization_report_${Date.now()}`,
      timestamp: new Date(),
      summary: {
        totalAssets,
        optimizedAssets,
        totalOriginalSize,
        totalOptimizedSize,
        totalSavings,
        averageCompressionRatio,
        optimizationTime,
      },
      assets: [...this.assets],
      recommendations,
      errors,
    }
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const unoptimizedAssets = this.getUnoptimizedAssets()
    if (unoptimizedAssets.length > 0) {
      recommendations.push(`${unoptimizedAssets.length} assets need optimization`)
    }

    const largeAssets = this.getLargeAssets()
    if (largeAssets.length > 0) {
      recommendations.push(`${largeAssets.length} assets exceed recommended size limits`)
    }

    const pngImages = this.assets.filter(asset => asset.type === 'image' && asset.format === 'png')
    if (pngImages.length > 0) {
      recommendations.push(`${pngImages.length} PNG images could be converted to WebP for better compression`)
    }

    const jpgImages = this.assets.filter(asset => asset.type === 'image' && asset.format === 'jpg')
    if (jpgImages.length > 0) {
      recommendations.push(`${jpgImages.length} JPG images could be converted to AVIF for better compression`)
    }

    const failedOperations = this.operations.filter(op => op.status === 'failed')
    if (failedOperations.length > 0) {
      recommendations.push(`${failedOperations.length} optimization operations failed and need attention`)
    }

    return recommendations
  }

  // Obtener todos los assets
  getAllAssets(): AssetInfo[] {
    return [...this.assets]
  }

  // Obtener todas las operaciones
  getAllOperations(): OptimizationOperation[] {
    return [...this.operations]
  }

  // Obtener configuración
  getConfig(): OptimizationConfig {
    return { ...this.config }
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Limpiar datos
  clearData(): void {
    this.assets = []
    this.operations = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      assets: this.assets,
      operations: this.operations,
      report: this.generateOptimizationReport(),
      config: this.config,
    }, null, 2)
  }
}

// Instancia global del servicio
export const assetOptimizationService = AssetOptimizationService.getInstance()

// Hook para usar el servicio de optimización de assets
export function useAssetOptimization() {
  const [assets, setAssets] = useState<AssetInfo[]>([])
  const [operations, setOperations] = useState<OptimizationOperation[]>([])
  const [report, setReport] = useState<OptimizationReport | null>(null)

  useEffect(() => {
    setAssets(assetOptimizationService.getAllAssets())
    setOperations(assetOptimizationService.getAllOperations())
    setReport(assetOptimizationService.generateOptimizationReport())
  }, [])

  const optimizeAsset = useCallback(async (assetId: string, options?: any) => {
    const asset = await assetOptimizationService.optimizeAsset(assetId, options)
    setAssets(assetOptimizationService.getAllAssets())
    setOperations(assetOptimizationService.getAllOperations())
    setReport(assetOptimizationService.generateOptimizationReport())
    return asset
  }, [])

  const resizeImage = useCallback(async (assetId: string, dimensions: { width: number; height: number }) => {
    const asset = await assetOptimizationService.resizeImage(assetId, dimensions)
    setAssets(assetOptimizationService.getAllAssets())
    setOperations(assetOptimizationService.getAllOperations())
    setReport(assetOptimizationService.generateOptimizationReport())
    return asset
  }, [])

  const convertFormat = useCallback(async (assetId: string, targetFormat: string) => {
    const asset = await assetOptimizationService.convertFormat(assetId, targetFormat)
    setAssets(assetOptimizationService.getAllAssets())
    setOperations(assetOptimizationService.getAllOperations())
    setReport(assetOptimizationService.generateOptimizationReport())
    return asset
  }, [])

  const generateOptimizationReport = useCallback(() => {
    const newReport = assetOptimizationService.generateOptimizationReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    assetOptimizationService.clearData()
    setAssets([])
    setOperations([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return assetOptimizationService.exportData()
  }, [])

  return {
    assets,
    operations,
    report,
    optimizeAsset,
    resizeImage,
    convertFormat,
    generateOptimizationReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de optimización de assets
interface AssetOptimizationDashboardProps {
  className?: string
}

export const AssetOptimizationDashboard: React.FC<AssetOptimizationDashboardProps> = ({ className = '' }) => {
  const { assets, operations, report, optimizeAsset, resizeImage, convertFormat, generateOptimizationReport, clearData, exportData } = useAssetOptimization()

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const getTypeColor = (type: AssetInfo['type']) => {
    switch (type) {
      case 'image': return 'text-blue-600 bg-blue-100'
      case 'video': return 'text-purple-600 bg-purple-100'
      case 'audio': return 'text-green-600 bg-green-100'
      case 'font': return 'text-orange-600 bg-orange-100'
      case 'document': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: OptimizationOperation['status']) => {
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
        <h2 className="text-xl font-semibold text-gray-800">Asset Optimization Dashboard</h2>
        <div className="space-x-2">
          <button
            onClick={generateOptimizationReport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate Report
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
              a.download = 'asset-optimization-data.json'
              a.click()
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Export Data
          </button>
        </div>
      </div>

      {report && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Optimization Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Assets</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.totalAssets}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Optimized</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.optimizedAssets}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Savings</h4>
              <p className="text-2xl font-bold text-blue-600">{formatSize(report.summary.totalSavings)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Compression Ratio</h4>
              <p className="text-2xl font-bold text-orange-600">{(report.summary.averageCompressionRatio * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Assets</h3>
          <div className="space-y-2">
            {assets.slice(-5).map(asset => (
              <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{asset.name}</h4>
                    <p className="text-xs text-gray-600">
                      Original: {formatSize(asset.originalSize)} | 
                      Optimized: {formatSize(asset.optimizedSize)} | 
                      Quality: {asset.quality}%
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(asset.type)}`}>
                      {asset.type}
                    </span>
                    {asset.isOptimized ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Optimized
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Optimized
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => optimizeAsset(asset.id)}
                    disabled={asset.isOptimized}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Optimize
                  </button>
                  {asset.type === 'image' && (
                    <button
                      onClick={() => resizeImage(asset.id, { width: 800, height: 600 })}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Resize
                    </button>
                  )}
                  <button
                    onClick={() => convertFormat(asset.id, 'webp')}
                    className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Convert to WebP
                  </button>
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
                      {operation.type.toUpperCase()} - {operation.assetId}
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

