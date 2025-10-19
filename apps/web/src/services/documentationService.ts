// Servicio de documentación automática
export interface DocumentationItem {
  id: string
  type: 'component' | 'hook' | 'service' | 'utility' | 'api' | 'page'
  name: string
  description: string
  filePath: string
  examples: CodeExample[]
  props?: PropDefinition[]
  methods?: MethodDefinition[]
  dependencies: string[]
  tags: string[]
  lastUpdated: Date
  version: string
}

export interface CodeExample {
  id: string
  title: string
  description: string
  code: string
  language: 'typescript' | 'javascript' | 'jsx' | 'tsx' | 'css' | 'html'
  isInteractive: boolean
}

export interface PropDefinition {
  name: string
  type: string
  required: boolean
  defaultValue?: any
  description: string
  examples: string[]
}

export interface MethodDefinition {
  name: string
  description: string
  parameters: ParameterDefinition[]
  returnType: string
  examples: string[]
}

export interface ParameterDefinition {
  name: string
  type: string
  required: boolean
  description: string
  defaultValue?: any
}

export interface DocumentationReport {
  id: string
  timestamp: Date
  summary: {
    totalItems: number
    components: number
    hooks: number
    services: number
    utilities: number
    apis: number
    pages: number
    coverage: number
    lastUpdated: Date
  }
  items: DocumentationItem[]
  recommendations: string[]
}

// Clase principal del servicio de documentación
export class DocumentationService {
  private static instance: DocumentationService
  private documentation: DocumentationItem[] = []
  private isInitialized = false

  private constructor() {
    this.initializeDocumentation()
  }

  static getInstance(): DocumentationService {
    if (!DocumentationService.instance) {
      DocumentationService.instance = new DocumentationService()
    }
    return DocumentationService.instance
  }

  // Inicializar documentación
  private initializeDocumentation(): void {
    this.documentation = [
      // Componentes
      {
        id: 'button-component',
        type: 'component',
        name: 'Button',
        description: 'Componente de botón reutilizable con múltiples variantes y estados',
        filePath: 'src/components/Button.tsx',
        examples: [
          {
            id: 'basic-button',
            title: 'Botón Básico',
            description: 'Ejemplo básico de uso del componente Button',
            code: `<Button onClick={() => console.log('Clicked')}>
  Hacer clic
</Button>`,
            language: 'tsx',
            isInteractive: true,
          },
          {
            id: 'button-variants',
            title: 'Variantes de Botón',
            description: 'Diferentes variantes del componente Button',
            code: `<Button variant="primary">Primario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="danger">Peligro</Button>`,
            language: 'tsx',
            isInteractive: false,
          },
        ],
        props: [
          {
            name: 'variant',
            type: "'primary' | 'secondary' | 'danger' | 'outline'",
            required: false,
            defaultValue: "'primary'",
            description: 'Variante visual del botón',
            examples: ["'primary'", "'secondary'", "'danger'"],
          },
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg'",
            required: false,
            defaultValue: "'md'",
            description: 'Tamaño del botón',
            examples: ["'sm'", "'md'", "'lg'"],
          },
          {
            name: 'disabled',
            type: 'boolean',
            required: false,
            defaultValue: 'false',
            description: 'Si el botón está deshabilitado',
            examples: ['true', 'false'],
          },
          {
            name: 'loading',
            type: 'boolean',
            required: false,
            defaultValue: 'false',
            description: 'Si el botón está en estado de carga',
            examples: ['true', 'false'],
          },
        ],
        methods: [],
        dependencies: ['react'],
        tags: ['ui', 'button', 'interactive'],
        lastUpdated: new Date(),
        version: '1.0.0',
      },
      {
        id: 'input-component',
        type: 'component',
        name: 'Input',
        description: 'Componente de entrada de texto con validación',
        filePath: 'src/components/Input.tsx',
        examples: [
          {
            id: 'basic-input',
            title: 'Input Básico',
            description: 'Ejemplo básico de uso del componente Input',
            code: `<Input
  value={value}
  onChange={setValue}
  placeholder="Ingresa tu texto"
/>`,
            language: 'tsx',
            isInteractive: true,
          },
        ],
        props: [
          {
            name: 'value',
            type: 'string',
            required: true,
            description: 'Valor del input',
            examples: ['"texto"', '""'],
          },
          {
            name: 'onChange',
            type: '(value: string) => void',
            required: true,
            description: 'Función llamada cuando cambia el valor',
            examples: ['(value) => setValue(value)'],
          },
          {
            name: 'placeholder',
            type: 'string',
            required: false,
            description: 'Texto de placeholder',
            examples: ['"Ingresa tu texto"'],
          },
          {
            name: 'error',
            type: 'string',
            required: false,
            description: 'Mensaje de error',
            examples: ['"Campo requerido"'],
          },
        ],
        methods: [],
        dependencies: ['react'],
        tags: ['ui', 'input', 'form'],
        lastUpdated: new Date(),
        version: '1.0.0',
      },
      // Hooks
      {
        id: 'use-api-hook',
        type: 'hook',
        name: 'useApi',
        description: 'Hook personalizado para manejar llamadas a API con estados de carga y error',
        filePath: 'src/hooks/useApi.ts',
        examples: [
          {
            id: 'basic-api-hook',
            title: 'Uso Básico',
            description: 'Ejemplo básico de uso del hook useApi',
            code: `const { data, loading, error, execute } = useApi('/api/users');

useEffect(() => {
  execute();
}, []);`,
            language: 'tsx',
            isInteractive: false,
          },
        ],
        props: [],
        methods: [
          {
            name: 'execute',
            description: 'Ejecuta la llamada a la API',
            parameters: [],
            returnType: 'Promise<void>',
            examples: ['execute()'],
          },
        ],
        dependencies: ['react', 'axios'],
        tags: ['hook', 'api', 'async'],
        lastUpdated: new Date(),
        version: '1.0.0',
      },
      // Servicios
      {
        id: 'cache-service',
        type: 'service',
        name: 'CacheService',
        description: 'Servicio para manejo de cache con estrategias LRU, FIFO y LFU',
        filePath: 'src/services/cacheService.ts',
        examples: [
          {
            id: 'basic-cache',
            title: 'Uso Básico',
            description: 'Ejemplo básico de uso del CacheService',
            code: `const cache = new CacheService();

// Guardar en cache
cache.set('key', data, 300000); // 5 minutos

// Obtener del cache
const cachedData = cache.get('key');`,
            language: 'typescript',
            isInteractive: false,
          },
        ],
        props: [],
        methods: [
          {
            name: 'set',
            description: 'Guarda datos en el cache',
            parameters: [
              {
                name: 'key',
                type: 'string',
                required: true,
                description: 'Clave del cache',
              },
              {
                name: 'data',
                type: 'any',
                required: true,
                description: 'Datos a guardar',
              },
              {
                name: 'ttl',
                type: 'number',
                required: false,
                description: 'Tiempo de vida en milisegundos',
              },
            ],
            returnType: 'void',
            examples: ["cache.set('key', data, 300000)"],
          },
          {
            name: 'get',
            description: 'Obtiene datos del cache',
            parameters: [
              {
                name: 'key',
                type: 'string',
                required: true,
                description: 'Clave del cache',
              },
            ],
            returnType: 'T | null',
            examples: ["const data = cache.get('key')"],
          },
        ],
        dependencies: [],
        tags: ['service', 'cache', 'performance'],
        lastUpdated: new Date(),
        version: '1.0.0',
      },
      // Páginas
      {
        id: 'dashboard-page',
        type: 'page',
        name: 'Dashboard',
        description: 'Página principal del dashboard con métricas y resumen',
        filePath: 'src/pages/Dashboard.tsx',
        examples: [
          {
            id: 'dashboard-usage',
            title: 'Uso del Dashboard',
            description: 'Ejemplo de cómo se usa la página Dashboard',
            code: `import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}`,
            language: 'tsx',
            isInteractive: false,
          },
        ],
        props: [],
        methods: [],
        dependencies: ['react', 'react-router-dom'],
        tags: ['page', 'dashboard', 'main'],
        lastUpdated: new Date(),
        version: '1.0.0',
      },
    ]

    this.isInitialized = true
  }

  // Obtener documentación por tipo
  getDocumentationByType(type: DocumentationItem['type']): DocumentationItem[] {
    return this.documentation.filter(item => item.type === type)
  }

  // Obtener documentación por ID
  getDocumentationById(id: string): DocumentationItem | null {
    return this.documentation.find(item => item.id === id) || null
  }

  // Buscar documentación
  searchDocumentation(query: string): DocumentationItem[] {
    const lowercaseQuery = query.toLowerCase()
    return this.documentation.filter(item =>
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  // Obtener documentación por tag
  getDocumentationByTag(tag: string): DocumentationItem[] {
    return this.documentation.filter(item => item.tags.includes(tag))
  }

  // Obtener todos los tags
  getAllTags(): string[] {
    const tags = new Set<string>()
    this.documentation.forEach(item => {
      item.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }

  // Generar reporte de documentación
  generateReport(): DocumentationReport {
    const summary = {
      totalItems: this.documentation.length,
      components: this.documentation.filter(item => item.type === 'component').length,
      hooks: this.documentation.filter(item => item.type === 'hook').length,
      services: this.documentation.filter(item => item.type === 'service').length,
      utilities: this.documentation.filter(item => item.type === 'utility').length,
      apis: this.documentation.filter(item => item.type === 'api').length,
      pages: this.documentation.filter(item => item.type === 'page').length,
      coverage: this.calculateCoverage(),
      lastUpdated: new Date(),
    }

    const recommendations = this.generateRecommendations()

    return {
      id: `doc_report_${Date.now()}`,
      timestamp: new Date(),
      summary,
      items: [...this.documentation],
      recommendations,
    }
  }

  // Calcular cobertura de documentación
  private calculateCoverage(): number {
    // En producción, esto calcularía la cobertura real basada en archivos del proyecto
    return 85 // 85% de cobertura simulada
  }

  // Generar recomendaciones
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    // Verificar componentes sin documentación
    const undocumentedComponents = this.documentation.filter(item => 
      item.type === 'component' && item.examples.length === 0
    )

    if (undocumentedComponents.length > 0) {
      recommendations.push(`${undocumentedComponents.length} componentes necesitan ejemplos de uso`)
    }

    // Verificar hooks sin documentación
    const undocumentedHooks = this.documentation.filter(item => 
      item.type === 'hook' && item.examples.length === 0
    )

    if (undocumentedHooks.length > 0) {
      recommendations.push(`${undocumentedHooks.length} hooks necesitan ejemplos de uso`)
    }

    // Verificar servicios sin documentación
    const undocumentedServices = this.documentation.filter(item => 
      item.type === 'service' && item.examples.length === 0
    )

    if (undocumentedServices.length > 0) {
      recommendations.push(`${undocumentedServices.length} servicios necesitan ejemplos de uso`)
    }

    // Verificar documentación desactualizada
    const outdatedDocs = this.documentation.filter(item => {
      const daysSinceUpdate = (Date.now() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceUpdate > 30
    })

    if (outdatedDocs.length > 0) {
      recommendations.push(`${outdatedDocs.length} elementos de documentación están desactualizados`)
    }

    return recommendations
  }

  // Obtener toda la documentación
  getAllDocumentation(): DocumentationItem[] {
    return [...this.documentation]
  }

  // Exportar documentación
  exportDocumentation(): string {
    return JSON.stringify(this.documentation, null, 2)
  }

  // Importar documentación
  importDocumentation(data: string): void {
    try {
      this.documentation = JSON.parse(data)
    } catch (error) {
      console.error('Error importing documentation:', error)
    }
  }

  // Limpiar documentación
  clearDocumentation(): void {
    this.documentation = []
    this.initializeDocumentation()
  }
}

// Instancia global del servicio
export const documentationService = DocumentationService.getInstance()

// Hook para usar el servicio de documentación
export function useDocumentation() {
  const [documentation, setDocumentation] = useState<DocumentationItem[]>([])
  const [report, setReport] = useState<DocumentationReport | null>(null)

  useEffect(() => {
    setDocumentation(documentationService.getAllDocumentation())
    setReport(documentationService.generateReport())
  }, [])

  const getDocumentationByType = useCallback((type: DocumentationItem['type']) => {
    return documentationService.getDocumentationByType(type)
  }, [])

  const getDocumentationById = useCallback((id: string) => {
    return documentationService.getDocumentationById(id)
  }, [])

  const searchDocumentation = useCallback((query: string) => {
    return documentationService.searchDocumentation(query)
  }, [])

  const getDocumentationByTag = useCallback((tag: string) => {
    return documentationService.getDocumentationByTag(tag)
  }, [])

  const getAllTags = useCallback(() => {
    return documentationService.getAllTags()
  }, [])

  const generateReport = useCallback(() => {
    const newReport = documentationService.generateReport()
    setReport(newReport)
    return newReport
  }, [])

  const exportDocumentation = useCallback(() => {
    return documentationService.exportDocumentation()
  }, [])

  const clearDocumentation = useCallback(() => {
    documentationService.clearDocumentation()
    setDocumentation(documentationService.getAllDocumentation())
    setReport(documentationService.generateReport())
  }, [])

  return {
    documentation,
    report,
    getDocumentationByType,
    getDocumentationById,
    searchDocumentation,
    getDocumentationByTag,
    getAllTags,
    generateReport,
    exportDocumentation,
    clearDocumentation,
  }
}

// Componente de dashboard de documentación
interface DocumentationDashboardProps {
  className?: string
}

export const DocumentationDashboard: React.FC<DocumentationDashboardProps> = ({ className = '' }) => {
  const { documentation, report, getDocumentationByType, getAllTags, generateReport, exportDocumentation } = useDocumentation()
  const [selectedType, setSelectedType] = useState<DocumentationItem['type'] | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDocumentation = useMemo(() => {
    let filtered = documentation

    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [documentation, selectedType, searchQuery])

  const types: Array<{ value: DocumentationItem['type'] | 'all'; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'component', label: 'Componentes' },
    { value: 'hook', label: 'Hooks' },
    { value: 'service', label: 'Servicios' },
    { value: 'utility', label: 'Utilidades' },
    { value: 'api', label: 'APIs' },
    { value: 'page', label: 'Páginas' },
  ]

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard de Documentación</h2>
        <div className="space-x-2">
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generar Reporte
          </button>
          <button
            onClick={() => {
              const data = exportDocumentation()
              const blob = new Blob([data], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'documentation.json'
              a.click()
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Exportar
          </button>
        </div>
      </div>

      {report && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resumen de Documentación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total</h4>
              <p className="text-2xl font-bold text-gray-800">{report.summary.totalItems}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Componentes</h4>
              <p className="text-2xl font-bold text-blue-600">{report.summary.components}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Hooks</h4>
              <p className="text-2xl font-bold text-green-600">{report.summary.hooks}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Cobertura</h4>
              <p className="text-2xl font-bold text-purple-600">{report.summary.coverage}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar documentación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentationItem['type'] | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {types.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredDocumentation.map(item => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-medium text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-xs text-gray-500 mt-1">{item.filePath}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {item.type}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                  v{item.version}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {item.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  #{tag}
                </span>
              ))}
            </div>

            {item.examples.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ejemplos:</h4>
                <div className="space-y-2">
                  {item.examples.map(example => (
                    <div key={example.id} className="bg-gray-50 rounded p-3">
                      <h5 className="text-sm font-medium text-gray-800">{example.title}</h5>
                      <p className="text-xs text-gray-600 mb-2">{example.description}</p>
                      <pre className="text-xs bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto">
                        <code>{example.code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
