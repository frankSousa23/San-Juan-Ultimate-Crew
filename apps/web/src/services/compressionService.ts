// Sistema de compresión y minificación avanzado
export interface CompressionInfo {
  id: string
  name: string
  type: 'javascript' | 'css' | 'html' | 'json' | 'image' | 'font' | 'video' | 'audio'
  originalSize: number
  compressedSize: number
  compressionRatio: number
  algorithm: 'gzip' | 'brotli' | 'deflate' | 'lz4' | 'zstd' | 'webp' | 'avif' | 'jpeg' | 'png'
  quality: number
  isCompressed: boolean
  compressionTime: number
  decompressionTime: number
  timestamp: Date
  metadata: Record<string, any>
}

export interface MinificationInfo {
  id: string
  name: string
  type: 'javascript' | 'css' | 'html' | 'json'
  originalSize: number
  minifiedSize: number
  minificationRatio: number
  techniques: string[]
  isMinified: boolean
  minificationTime: number
  timestamp: Date
  metadata: Record<string, any>
}

export interface CompressionConfig {
  algorithms: {
    gzip: { enabled: boolean; level: number; threshold: number }
    brotli: { enabled: boolean; level: number; threshold: number }
    deflate: { enabled: boolean; level: number; threshold: number }
    lz4: { enabled: boolean; level: number; threshold: number }
    zstd: { enabled: boolean; level: number; threshold: number }
  }
  imageFormats: {
    webp: { enabled: boolean; quality: number }
    avif: { enabled: boolean; quality: number }
    jpeg: { enabled: boolean; quality: number }
    png: { enabled: boolean; optimization: boolean }
  }
  minification: {
    javascript: { enabled: boolean; mangle: boolean; compress: boolean }
    css: { enabled: boolean; removeComments: boolean; removeWhitespace: boolean }
    html: { enabled: boolean; removeComments: boolean; collapseWhitespace: boolean }
    json: { enabled: boolean; removeWhitespace: boolean }
  }
  thresholds: {
    minSize: number
    maxSize: number
    compressionRatio: number
  }
}

export interface CompressionReport {
  id: string
  timestamp: Date
  summary: {
    totalFiles: number
    compressedFiles: number
    minifiedFiles: number
    totalOriginalSize: number
    totalCompressedSize: number
    totalMinifiedSize: number
    totalSavings: number
    averageCompressionRatio: number
    averageMinificationRatio: number
    processingTime: number
  }
  compressions: CompressionInfo[]
  minifications: MinificationInfo[]
  recommendations: string[]
  performance: {
    compressionThroughput: number
    averageCompressionTime: number
    averageDecompressionTime: number
    memoryUsage: number
    cpuUsage: number
  }
}

export interface CompressionOperation {
  id: string
  fileId: string
  type: 'compress' | 'decompress' | 'minify' | 'optimize'
  algorithm?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
  originalSize?: number
  compressedSize?: number
  error?: string
  progress: number
}

// Clase principal del servicio de compresión
export class CompressionService {
  private static instance: CompressionService
  private compressions: CompressionInfo[] = []
  private minifications: MinificationInfo[] = []
  private operations: CompressionOperation[] = []
  private config: CompressionConfig
  private isInitialized = false

  private constructor() {
    this.config = {
      algorithms: {
        gzip: { enabled: true, level: 6, threshold: 1024 },
        brotli: { enabled: true, level: 4, threshold: 1024 },
        deflate: { enabled: false, level: 6, threshold: 1024 },
        lz4: { enabled: false, level: 1, threshold: 1024 },
        zstd: { enabled: false, level: 3, threshold: 1024 },
      },
      imageFormats: {
        webp: { enabled: true, quality: 80 },
        avif: { enabled: true, quality: 75 },
        jpeg: { enabled: true, quality: 85 },
        png: { enabled: true, optimization: true },
      },
      minification: {
        javascript: { enabled: true, mangle: true, compress: true },
        css: { enabled: true, removeComments: true, removeWhitespace: true },
        html: { enabled: true, removeComments: true, collapseWhitespace: true },
        json: { enabled: true, removeWhitespace: true },
      },
      thresholds: {
        minSize: 1024, // 1KB
        maxSize: 10 * 1024 * 1024, // 10MB
        compressionRatio: 0.1, // 10% minimum compression
      },
    }
    this.initializeCompressionService()
  }

  static getInstance(): CompressionService {
    if (!CompressionService.instance) {
      CompressionService.instance = new CompressionService()
    }
    return CompressionService.instance
  }

  // Inicializar servicio de compresión
  private initializeCompressionService(): void {
    this.analyzeExistingFiles()
    this.identifyCompressionOpportunities()
    this.isInitialized = true
  }

  // Analizar archivos existentes
  private analyzeExistingFiles(): void {
    // Simular análisis de archivos existentes
    this.compressions = [
      {
        id: 'compression-1',
        name: 'main.js',
        type: 'javascript',
        originalSize: 512000, // 512KB
        compressedSize: 128000, // 128KB
        compressionRatio: 0.75,
        algorithm: 'gzip',
        quality: 6,
        isCompressed: true,
        compressionTime: 150,
        decompressionTime: 25,
        timestamp: new Date(),
        metadata: { lines: 1500, functions: 200 },
      },
      {
        id: 'compression-2',
        name: 'styles.css',
        type: 'css',
        originalSize: 256000, // 256KB
        compressedSize: 64000, // 64KB
        compressionRatio: 0.75,
        algorithm: 'brotli',
        quality: 4,
        isCompressed: true,
        compressionTime: 100,
        decompressionTime: 15,
        timestamp: new Date(),
        metadata: { rules: 500, selectors: 800 },
      },
      {
        id: 'compression-3',
        name: 'hero-image.jpg',
        type: 'image',
        originalSize: 2048000, // 2MB
        compressedSize: 512000, // 512KB
        compressionRatio: 0.75,
        algorithm: 'jpeg',
        quality: 85,
        isCompressed: true,
        compressionTime: 500,
        decompressionTime: 50,
        timestamp: new Date(),
        metadata: { width: 1920, height: 1080, format: 'JPEG' },
      },
      {
        id: 'compression-4',
        name: 'data.json',
        type: 'json',
        originalSize: 1024000, // 1MB
        compressedSize: 256000, // 256KB
        compressionRatio: 0.75,
        algorithm: 'gzip',
        quality: 6,
        isCompressed: true,
        compressionTime: 200,
        decompressionTime: 30,
        timestamp: new Date(),
        metadata: { records: 1000, fields: 10 },
      },
      {
        id: 'compression-5',
        name: 'large-video.mp4',
        type: 'video',
        originalSize: 52428800, // 50MB
        compressedSize: 26214400, // 25MB
        compressionRatio: 0.5,
        algorithm: 'zstd',
        quality: 3,
        isCompressed: false,
        compressionTime: 0,
        decompressionTime: 0,
        timestamp: new Date(),
        metadata: { duration: 120, resolution: '1920x1080' },
      },
    ]

    this.minifications = [
      {
        id: 'minification-1',
        name: 'app.js',
        type: 'javascript',
        originalSize: 1024000, // 1MB
        minifiedSize: 512000, // 512KB
        minificationRatio: 0.5,
        techniques: ['remove-comments', 'remove-whitespace', 'mangle-names', 'compress-code'],
        isMinified: true,
        minificationTime: 300,
        timestamp: new Date(),
        metadata: { lines: 3000, functions: 400 },
      },
      {
        id: 'minification-2',
        name: 'components.css',
        type: 'css',
        originalSize: 512000, // 512KB
        minifiedSize: 256000, // 256KB
        minificationRatio: 0.5,
        techniques: ['remove-comments', 'remove-whitespace', 'optimize-selectors'],
        isMinified: true,
        minificationTime: 150,
        timestamp: new Date(),
        metadata: { rules: 1000, selectors: 1500 },
      },
      {
        id: 'minification-3',
        name: 'index.html',
        type: 'html',
        originalSize: 128000, // 128KB
        minifiedSize: 64000, // 64KB
        minificationRatio: 0.5,
        techniques: ['remove-comments', 'collapse-whitespace', 'remove-attributes'],
        isMinified: true,
        minificationTime: 75,
        timestamp: new Date(),
        metadata: { elements: 200, attributes: 500 },
      },
      {
        id: 'minification-4',
        name: 'config.json',
        type: 'json',
        originalSize: 64000, // 64KB
        minifiedSize: 32000, // 32KB
        minificationRatio: 0.5,
        techniques: ['remove-whitespace', 'remove-comments'],
        isMinified: true,
        minificationTime: 25,
        timestamp: new Date(),
        metadata: { properties: 50, nested: 10 },
      },
    ]
  }

  // Identificar oportunidades de compresión
  private identifyCompressionOpportunities(): void {
    // Simular identificación de oportunidades
    const uncompressedFiles = this.compressions.filter(c => !c.isCompressed)
    const unminifiedFiles = this.minifications.filter(m => !m.isMinified)
    
    console.log(`Found ${uncompressedFiles.length} files that need compression`)
    console.log(`Found ${unminifiedFiles.length} files that need minification`)
  }

  // Comprimir archivo
  async compressFile(
    name: string,
    type: CompressionInfo['type'],
    originalSize: number,
    algorithm: CompressionInfo['algorithm'] = 'gzip'
  ): Promise<CompressionInfo> {
    const compressionId = `compression_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const operation: CompressionOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileId: compressionId,
      type: 'compress',
      algorithm,
      status: 'processing',
      startTime: new Date(),
      originalSize,
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular proceso de compresión
      for (let progress = 0; progress <= 100; progress += 20) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Calcular tamaño comprimido basado en algoritmo
      const compressionRatio = this.getCompressionRatio(algorithm, type)
      const compressedSize = Math.round(originalSize * compressionRatio)
      const compressionTime = this.calculateCompressionTime(originalSize, algorithm)
      const decompressionTime = this.calculateDecompressionTime(compressedSize, algorithm)

      const compression: CompressionInfo = {
        id: compressionId,
        name,
        type,
        originalSize,
        compressedSize,
        compressionRatio: 1 - compressionRatio,
        algorithm,
        quality: this.getQualityForAlgorithm(algorithm),
        isCompressed: true,
        compressionTime,
        decompressionTime,
        timestamp: new Date(),
        metadata: this.generateMetadata(type, originalSize),
      }

      this.compressions.push(compression)

      // Completar operación
      operation.status = 'completed'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      operation.compressedSize = compressedSize

      return compression
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      throw error
    }
  }

  // Minificar archivo
  async minifyFile(
    name: string,
    type: MinificationInfo['type'],
    originalSize: number
  ): Promise<MinificationInfo> {
    const minificationId = `minification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const operation: CompressionOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileId: minificationId,
      type: 'minify',
      status: 'processing',
      startTime: new Date(),
      originalSize,
      progress: 0,
    }

    this.operations.push(operation)

    try {
      // Simular proceso de minificación
      for (let progress = 0; progress <= 100; progress += 25) {
        operation.progress = progress
        await new Promise(resolve => setTimeout(resolve, 75))
      }

      // Calcular tamaño minificado
      const minificationRatio = this.getMinificationRatio(type)
      const minifiedSize = Math.round(originalSize * minificationRatio)
      const minificationTime = this.calculateMinificationTime(originalSize, type)
      const techniques = this.getMinificationTechniques(type)

      const minification: MinificationInfo = {
        id: minificationId,
        name,
        type,
        originalSize,
        minifiedSize,
        minificationRatio: 1 - minificationRatio,
        techniques,
        isMinified: true,
        minificationTime,
        timestamp: new Date(),
        metadata: this.generateMinificationMetadata(type, originalSize),
      }

      this.minifications.push(minification)

      // Completar operación
      operation.status = 'completed'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      operation.compressedSize = minifiedSize

      return minification
    } catch (error) {
      operation.status = 'failed'
      operation.error = error instanceof Error ? error.message : 'Unknown error'
      operation.endTime = new Date()
      operation.duration = operation.endTime.getTime() - operation.startTime.getTime()
      throw error
    }
  }

  // Obtener ratio de compresión
  private getCompressionRatio(algorithm: CompressionInfo['algorithm'], type: CompressionInfo['type']): number {
    const baseRatios: Record<CompressionInfo['algorithm'], number> = {
      gzip: 0.3,
      brotli: 0.25,
      deflate: 0.35,
      lz4: 0.4,
      zstd: 0.2,
      webp: 0.3,
      avif: 0.2,
      jpeg: 0.4,
      png: 0.1,
    }

    const typeMultipliers: Record<CompressionInfo['type'], number> = {
      javascript: 0.8,
      css: 0.7,
      html: 0.6,
      json: 0.5,
      image: 1.0,
      font: 0.9,
      video: 0.3,
      audio: 0.4,
    }

    return baseRatios[algorithm] * typeMultipliers[type]
  }

  // Obtener ratio de minificación
  private getMinificationRatio(type: MinificationInfo['type']): number {
    const ratios: Record<MinificationInfo['type'], number> = {
      javascript: 0.5,
      css: 0.6,
      html: 0.7,
      json: 0.8,
    }

    return ratios[type]
  }

  // Calcular tiempo de compresión
  private calculateCompressionTime(size: number, algorithm: CompressionInfo['algorithm']): number {
    const baseTime = size / 1024 // 1ms per KB
    const algorithmMultipliers: Record<CompressionInfo['algorithm'], number> = {
      gzip: 1.0,
      brotli: 1.5,
      deflate: 0.8,
      lz4: 0.3,
      zstd: 1.2,
      webp: 2.0,
      avif: 3.0,
      jpeg: 1.5,
      png: 2.5,
    }

    return Math.round(baseTime * algorithmMultipliers[algorithm])
  }

  // Calcular tiempo de descompresión
  private calculateDecompressionTime(size: number, algorithm: CompressionInfo['algorithm']): number {
    const baseTime = size / 2048 // 0.5ms per KB
    const algorithmMultipliers: Record<CompressionInfo['algorithm'], number> = {
      gzip: 1.0,
      brotli: 1.2,
      deflate: 0.9,
      lz4: 0.2,
      zstd: 1.1,
      webp: 1.5,
      avif: 2.0,
      jpeg: 1.0,
      png: 1.2,
    }

    return Math.round(baseTime * algorithmMultipliers[algorithm])
  }

  // Calcular tiempo de minificación
  private calculateMinificationTime(size: number, type: MinificationInfo['type']): number {
    const baseTime = size / 2048 // 0.5ms per KB
    const typeMultipliers: Record<MinificationInfo['type'], number> = {
      javascript: 2.0,
      css: 1.5,
      html: 1.0,
      json: 0.5,
    }

    return Math.round(baseTime * typeMultipliers[type])
  }

  // Obtener calidad para algoritmo
  private getQualityForAlgorithm(algorithm: CompressionInfo['algorithm']): number {
    const qualities: Record<CompressionInfo['algorithm'], number> = {
      gzip: 6,
      brotli: 4,
      deflate: 6,
      lz4: 1,
      zstd: 3,
      webp: 80,
      avif: 75,
      jpeg: 85,
      png: 100,
    }

    return qualities[algorithm]
  }

  // Obtener técnicas de minificación
  private getMinificationTechniques(type: MinificationInfo['type']): string[] {
    const techniques: Record<MinificationInfo['type'], string[]> = {
      javascript: ['remove-comments', 'remove-whitespace', 'mangle-names', 'compress-code', 'remove-dead-code'],
      css: ['remove-comments', 'remove-whitespace', 'optimize-selectors', 'merge-rules'],
      html: ['remove-comments', 'collapse-whitespace', 'remove-attributes', 'minify-inline-css'],
      json: ['remove-whitespace', 'remove-comments'],
    }

    return techniques[type]
  }

  // Generar metadata
  private generateMetadata(type: CompressionInfo['type'], size: number): Record<string, any> {
    const metadata: Record<string, any> = { size }

    switch (type) {
      case 'javascript':
        metadata.lines = Math.floor(size / 50)
        metadata.functions = Math.floor(size / 200)
        break
      case 'css':
        metadata.rules = Math.floor(size / 100)
        metadata.selectors = Math.floor(size / 80)
        break
      case 'image':
        metadata.width = 1920
        metadata.height = 1080
        metadata.format = 'JPEG'
        break
      case 'json':
        metadata.records = Math.floor(size / 1000)
        metadata.fields = 10
        break
    }

    return metadata
  }

  // Generar metadata de minificación
  private generateMinificationMetadata(type: MinificationInfo['type'], size: number): Record<string, any> {
    const metadata: Record<string, any> = { size }

    switch (type) {
      case 'javascript':
        metadata.lines = Math.floor(size / 50)
        metadata.functions = Math.floor(size / 200)
        break
      case 'css':
        metadata.rules = Math.floor(size / 100)
        metadata.selectors = Math.floor(size / 80)
        break
      case 'html':
        metadata.elements = Math.floor(size / 200)
        metadata.attributes = Math.floor(size / 100)
        break
      case 'json':
        metadata.properties = Math.floor(size / 100)
        metadata.nested = Math.floor(size / 1000)
        break
    }

    return metadata
  }

  // Obtener archivos no comprimidos
  getUncompressedFiles(): CompressionInfo[] {
    return this.compressions.filter(compression => !compression.isCompressed)
  }

  // Obtener archivos no minificados
  getUnminifiedFiles(): MinificationInfo[] {
    return this.minifications.filter(minification => !minification.isMinified)
  }

  // Obtener archivos por tipo
  getFilesByType(type: CompressionInfo['type']): CompressionInfo[] {
    return this.compressions.filter(compression => compression.type === type)
  }

  // Obtener operaciones por estado
  getOperationsByStatus(status: CompressionOperation['status']): CompressionOperation[] {
    return this.operations.filter(operation => operation.status === status)
  }

  // Generar reporte de compresión
  generateCompressionReport(): CompressionReport {
    const totalFiles = this.compressions.length + this.minifications.length
    const compressedFiles = this.compressions.filter(c => c.isCompressed).length
    const minifiedFiles = this.minifications.filter(m => m.isMinified).length
    const totalOriginalSize = this.compressions.reduce((sum, c) => sum + c.originalSize, 0) +
                             this.minifications.reduce((sum, m) => sum + m.originalSize, 0)
    const totalCompressedSize = this.compressions.reduce((sum, c) => sum + c.compressedSize, 0)
    const totalMinifiedSize = this.minifications.reduce((sum, m) => sum + m.minifiedSize, 0)
    const totalSavings = totalOriginalSize - totalCompressedSize - totalMinifiedSize
    const averageCompressionRatio = this.compressions.length > 0
      ? this.compressions.reduce((sum, c) => sum + c.compressionRatio, 0) / this.compressions.length
      : 0
    const averageMinificationRatio = this.minifications.length > 0
      ? this.minifications.reduce((sum, m) => sum + m.minificationRatio, 0) / this.minifications.length
      : 0
    const processingTime = this.operations
      .filter(op => op.duration)
      .reduce((sum, op) => sum + (op.duration || 0), 0)

    const performance = {
      compressionThroughput: this.compressions.reduce((sum, c) => sum + c.originalSize, 0) / 1000,
      averageCompressionTime: this.compressions.length > 0
        ? this.compressions.reduce((sum, c) => sum + c.compressionTime, 0) / this.compressions.length
        : 0,
      averageDecompressionTime: this.compressions.length > 0
        ? this.compressions.reduce((sum, c) => sum + c.decompressionTime, 0) / this.compressions.length
        : 0,
      memoryUsage: 512, // Simulado
      cpuUsage: 75, // Simulado
    }

    const recommendations = this.generateRecommendations()

    return {
      id: `compression_report_${Date.now()}`,
      timestamp: new Date(),
      summary: {
        totalFiles,
        compressedFiles,
        minifiedFiles,
        totalOriginalSize,
        totalCompressedSize,
        totalMinifiedSize,
        totalSavings,
        averageCompressionRatio,
        averageMinificationRatio,
        processingTime,
      },
      compressions: [...this.compressions],
      minifications: [...this.minifications],
      recommendations,
      performance,
    }
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const uncompressedFiles = this.getUncompressedFiles()
    if (uncompressedFiles.length > 0) {
      recommendations.push(`${uncompressedFiles.length} archivos necesitan compresión`)
    }

    const unminifiedFiles = this.getUnminifiedFiles()
    if (unminifiedFiles.length > 0) {
      recommendations.push(`${unminifiedFiles.length} archivos necesitan minificación`)
    }

    const largeFiles = this.compressions.filter(c => c.originalSize > this.config.thresholds.maxSize)
    if (largeFiles.length > 0) {
      recommendations.push(`${largeFiles.length} archivos exceden el tamaño máximo recomendado`)
    }

    const inefficientCompressions = this.compressions.filter(c => c.compressionRatio < this.config.thresholds.compressionRatio)
    if (inefficientCompressions.length > 0) {
      recommendations.push(`${inefficientCompressions.length} compresiones son ineficientes`)
    }

    const slowCompressions = this.compressions.filter(c => c.compressionTime > 1000)
    if (slowCompressions.length > 0) {
      recommendations.push(`${slowCompressions.length} compresiones tardan más de 1 segundo`)
    }

    return recommendations
  }

  // Obtener todas las compresiones
  getAllCompressions(): CompressionInfo[] {
    return [...this.compressions]
  }

  // Obtener todas las minificaciones
  getAllMinifications(): MinificationInfo[] {
    return [...this.minifications]
  }

  // Obtener todas las operaciones
  getAllOperations(): CompressionOperation[] {
    return [...this.operations]
  }

  // Obtener configuración
  getConfig(): CompressionConfig {
    return { ...this.config }
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Limpiar datos
  clearData(): void {
    this.compressions = []
    this.minifications = []
    this.operations = []
  }

  // Exportar datos
  exportData(): string {
    return JSON.stringify({
      compressions: this.compressions,
      minifications: this.minifications,
      operations: this.operations,
      report: this.generateCompressionReport(),
      config: this.config,
    }, null, 2)
  }
}

// Instancia global del servicio
export const compressionService = CompressionService.getInstance()

// Hook para usar el servicio de compresión
export function useCompression() {
  const [compressions, setCompressions] = useState<CompressionInfo[]>([])
  const [minifications, setMinifications] = useState<MinificationInfo[]>([])
  const [operations, setOperations] = useState<CompressionOperation[]>([])
  const [report, setReport] = useState<CompressionReport | null>(null)

  useEffect(() => {
    setCompressions(compressionService.getAllCompressions())
    setMinifications(compressionService.getAllMinifications())
    setOperations(compressionService.getAllOperations())
    setReport(compressionService.generateCompressionReport())
  }, [])

  const compressFile = useCallback(async (name: string, type: CompressionInfo['type'], originalSize: number, algorithm?: CompressionInfo['algorithm']) => {
    const compression = await compressionService.compressFile(name, type, originalSize, algorithm)
    setCompressions(compressionService.getAllCompressions())
    setOperations(compressionService.getAllOperations())
    setReport(compressionService.generateCompressionReport())
    return compression
  }, [])

  const minifyFile = useCallback(async (name: string, type: MinificationInfo['type'], originalSize: number) => {
    const minification = await compressionService.minifyFile(name, type, originalSize)
    setMinifications(compressionService.getAllMinifications())
    setOperations(compressionService.getAllOperations())
    setReport(compressionService.generateCompressionReport())
    return minification
  }, [])

  const generateCompressionReport = useCallback(() => {
    const newReport = compressionService.generateCompressionReport()
    setReport(newReport)
    return newReport
  }, [])

  const clearData = useCallback(() => {
    compressionService.clearData()
    setCompressions([])
    setMinifications([])
    setOperations([])
    setReport(null)
  }, [])

  const exportData = useCallback(() => {
    return compressionService.exportData()
  }, [])

  return {
    compressions,
    minifications,
    operations,
    report,
    compressFile,
    minifyFile,
    generateCompressionReport,
    clearData,
    exportData,
  }
}

// Componente de dashboard de compresión
interface CompressionDashboardProps {
  className?: string
}

export const CompressionDashboard: React.FC<CompressionDashboardProps> = ({ className = '' }) => {
  const { compressions, minifications, operations, report, compressFile, minifyFile, generateCompressionReport, clearData, exportData } = useCompression()

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const getTypeColor = (type: CompressionInfo['type']) => {
    switch (type) {
      case 'javascript': return 'text-blue-600 bg-blue-100'
      case 'css': return 'text-green-600 bg-green-100'
      case 'html': return 'text-purple-600 bg-purple-100'
      case 'json': return 'text-orange-600 bg-orange-100'
      case 'image': return 'text-red-600 bg-red-100'
      case 'font': return 'text-indigo-600 bg-indigo-100'
      case 'video': return 'text-pink-600 bg-pink-100'
      case 'audio': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getAlgorithmColor = (algorithm: CompressionInfo['algorithm']) => {
    switch (algorithm) {
      case 'gzip': return 'text-blue-600 bg-blue-100'
      case 'brotli': return 'text-green-600 bg-green-100'
      case 'deflate': return 'text-purple-600 bg-purple-100'
      case 'lz4': return 'text-orange-600 bg-orange-100'
      case 'zstd': return 'text-red-600 bg-red-100'
      case 'webp': return 'text-indigo-600 bg-indigo-100'
      case 'avif': return 'text-pink-600 bg-pink-100'
      case 'jpeg': return 'text-yellow-600 bg-yellow-100'
      case 'png': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: CompressionOperation['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Compression Dashboard</h2>
        <div className="space-x-2">
          <button
            onClick={() => compressFile('test.js', 'javascript', 1024000, 'gzip')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Compression
          </button>
          <button
            onClick={() => minifyFile('test.css', 'css', 512000)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Minification
          </button>
          <button
            onClick={generateCompressionReport}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
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
              a.download = 'compression-data.json'
              a.click()
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Export Data
          </button>
        </div>
      </div>

      {report && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Compression Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Files</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.totalFiles}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Compressed</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.compressedFiles}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Minified</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.minifiedFiles}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total Savings</h4>
              <p className="text-2xl font-bold text-purple-600">{formatSize(report.summary.totalSavings)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Compressions</h3>
          <div className="space-y-2">
            {compressions.slice(-5).map(compression => (
              <div key={compression.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{compression.name}</h4>
                    <p className="text-xs text-gray-600">
                      Original: {formatSize(compression.originalSize)} | 
                      Compressed: {formatSize(compression.compressedSize)} | 
                      Ratio: {(compression.compressionRatio * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(compression.type)}`}>
                      {compression.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlgorithmColor(compression.algorithm)}`}>
                      {compression.algorithm}
                    </span>
                    {compression.isCompressed ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Compressed
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Compressed
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Compression Time: {compression.compressionTime}ms | 
                  Decompression Time: {compression.decompressionTime}ms
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Minifications</h3>
          <div className="space-y-2">
            {minifications.slice(-5).map(minification => (
              <div key={minification.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{minification.name}</h4>
                    <p className="text-xs text-gray-600">
                      Original: {formatSize(minification.originalSize)} | 
                      Minified: {formatSize(minification.minifiedSize)} | 
                      Ratio: {(minification.minificationRatio * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(minification.type)}`}>
                      {minification.type}
                    </span>
                    {minification.isMinified ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Minified
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Minified
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Techniques: {minification.techniques.join(', ')} | 
                  Time: {minification.minificationTime}ms
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
                      {operation.type.toUpperCase()} - {operation.fileId}
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
                    {operation.algorithm && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlgorithmColor(operation.algorithm)}`}>
                        {operation.algorithm}
                      </span>
                    )}
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
