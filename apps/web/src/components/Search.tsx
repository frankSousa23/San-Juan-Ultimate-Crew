import React, { useState, useRef, useEffect } from 'react'

interface SearchResult {
  id: string
  title: string
  description?: string
  category?: string
  icon?: string
  data?: any
}

interface SearchProps {
  onSearch: (query: string) => void
  onResultSelect?: (result: SearchResult) => void
  results?: SearchResult[]
  loading?: boolean
  placeholder?: string
  debounceMs?: number
  minQueryLength?: number
  showResults?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'filled'
}

export const Search: React.FC<SearchProps> = ({
  onSearch,
  onResultSelect,
  results = [],
  loading = false,
  placeholder = 'Buscar...',
  debounceMs = 300,
  minQueryLength = 1,
  showResults = true,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const variantClasses = {
    default: 'border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
    minimal: 'border-0 border-b border-gray-300 rounded-none focus:ring-0 focus:border-indigo-500',
    filled: 'border-0 bg-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:bg-white'
  }

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length >= minQueryLength) {
      timeoutRef.current = setTimeout(() => {
        onSearch(query)
        setIsOpen(true)
      }, debounceMs)
    } else {
      setIsOpen(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, debounceMs, minQueryLength, onSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result)
    setIsOpen(false)
    setSelectedIndex(-1)
    setQuery('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    if (query.length >= minQueryLength && results.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`w-full ${sizeClasses[size]} ${variantClasses[variant]} focus:outline-none transition-colors`}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          ) : (
            <span className="text-gray-400">🔍</span>
          )}
        </div>
      </div>

      {/* Search Results */}
      {showResults && isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleResultSelect(result)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                index === selectedIndex ? 'bg-gray-50' : ''
              } ${index === results.length - 1 ? '' : 'border-b border-gray-100'}`}
            >
              <div className="flex items-start space-x-3">
                {result.icon && (
                  <span className="text-lg mt-0.5">{result.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </p>
                  {result.description && (
                    <p className="text-sm text-gray-500 truncate">
                      {result.description}
                    </p>
                  )}
                  {result.category && (
                    <p className="text-xs text-gray-400 mt-1">
                      {result.category}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && isOpen && query.length >= minQueryLength && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-4 py-3 text-center text-gray-500">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-sm">No se encontraron resultados</p>
            <p className="text-xs text-gray-400 mt-1">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Global Search component
interface GlobalSearchProps {
  onSearch: (query: string) => void
  onResultSelect?: (result: SearchResult) => void
  results?: SearchResult[]
  loading?: boolean
  placeholder?: string
  className?: string
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSearch,
  onResultSelect,
  results = [],
  loading = false,
  placeholder = 'Buscar en toda la aplicación...',
  className = ''
}) => {
  return (
    <Search
      onSearch={onSearch}
      onResultSelect={onResultSelect}
      results={results}
      loading={loading}
      placeholder={placeholder}
      debounceMs={300}
      minQueryLength={2}
      showResults={true}
      className={className}
      size="md"
      variant="default"
    />
  )
}

// Quick Search component
interface QuickSearchProps {
  onSearch: (query: string) => void
  onResultSelect?: (result: SearchResult) => void
  results?: SearchResult[]
  loading?: boolean
  placeholder?: string
  className?: string
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  onSearch,
  onResultSelect,
  results = [],
  loading = false,
  placeholder = 'Búsqueda rápida...',
  className = ''
}) => {
  return (
    <Search
      onSearch={onSearch}
      onResultSelect={onResultSelect}
      results={results}
      loading={loading}
      placeholder={placeholder}
      debounceMs={150}
      minQueryLength={1}
      showResults={true}
      className={className}
      size="sm"
      variant="minimal"
    />
  )
}

// Filter Search component
interface FilterSearchProps {
  onSearch: (query: string) => void
  onResultSelect?: (result: SearchResult) => void
  results?: SearchResult[]
  loading?: boolean
  placeholder?: string
  className?: string
}

export const FilterSearch: React.FC<FilterSearchProps> = ({
  onSearch,
  onResultSelect,
  results = [],
  loading = false,
  placeholder = 'Filtrar...',
  className = ''
}) => {
  return (
    <Search
      onSearch={onSearch}
      onResultSelect={onResultSelect}
      results={results}
      loading={loading}
      placeholder={placeholder}
      debounceMs={200}
      minQueryLength={0}
      showResults={true}
      className={className}
      size="sm"
      variant="filled"
    />
  )
}

// Search with categories
interface CategorizedSearchProps {
  onSearch: (query: string) => void
  onResultSelect?: (result: SearchResult) => void
  results?: SearchResult[]
  loading?: boolean
  placeholder?: string
  className?: string
}

export const CategorizedSearch: React.FC<CategorizedSearchProps> = ({
  onSearch,
  onResultSelect,
  results = [],
  loading = false,
  placeholder = 'Buscar...',
  className = ''
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    const category = result.category || 'Otros'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length >= 1) {
      timeoutRef.current = setTimeout(() => {
        onSearch(query)
        setIsOpen(true)
      }, 300)
    } else {
      setIsOpen(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, onSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result)
    setIsOpen(false)
    setSelectedIndex(-1)
    setQuery('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    if (query.length >= 1 && results.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          ) : (
            <span className="text-gray-400">🔍</span>
          )}
        </div>
      </div>

      {/* Categorized Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {Object.entries(groupedResults).map(([category, categoryResults]) => (
            <div key={category}>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {category}
                </h4>
              </div>
              {categoryResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                >
                  <div className="flex items-start space-x-3">
                    {result.icon && (
                      <span className="text-lg mt-0.5">{result.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      {result.description && (
                        <p className="text-sm text-gray-500 truncate">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query.length >= 1 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-4 py-3 text-center text-gray-500">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-sm">No se encontraron resultados</p>
            <p className="text-xs text-gray-400 mt-1">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
