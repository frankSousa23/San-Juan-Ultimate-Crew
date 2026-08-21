import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useVirtualScroll } from '../hooks/useOptimization'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  onScroll?: (scrollTop: number) => void
  overscan?: number
  keyExtractor?: (item: T, index: number) => string | number
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  onScroll,
  overscan = 5,
  keyExtractor = (_, index) => index,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const { visibleItems, totalHeight, offsetY } = useVirtualScroll(
    items,
    itemHeight,
    containerHeight
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }, [onScroll])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={keyExtractor(item, index)}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente de lista virtualizada con búsqueda
interface SearchableVirtualListProps<T> extends Omit<VirtualListProps<T>, 'items'> {
  items: T[]
  searchTerm: string
  onSearchChange: (term: string) => void
  searchFields?: (keyof T)[]
  placeholder?: string
  className?: string
}

export function SearchableVirtualList<T>({
  items,
  searchTerm,
  onSearchChange,
  searchFields,
  placeholder = 'Buscar...',
  className = '',
  ...virtualListProps
}: SearchableVirtualListProps<T>) {
  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return items

    return items.filter(item => {
      if (searchFields) {
        return searchFields.some(field => {
          const value = item[field]
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      }

      return Object.values(item as any).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [items, searchTerm, searchFields])

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <VirtualList
        {...virtualListProps}
        items={filteredItems}
      />
    </div>
  )
}

// Componente de lista virtualizada con paginación
interface PaginatedVirtualListProps<T> extends Omit<VirtualListProps<T>, 'items'> {
  items: T[]
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginatedVirtualList<T>({
  items,
  pageSize,
  currentPage,
  onPageChange,
  className = '',
  ...virtualListProps
}: PaginatedVirtualListProps<T>) {
  const totalPages = Math.ceil(items.length / pageSize)
  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = items.slice(startIndex, endIndex)

  const goToPage = useCallback((page: number) => {
    onPageChange(Math.max(0, Math.min(page, totalPages - 1)))
  }, [onPageChange, totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  return (
    <div className={`space-y-4 ${className}`}>
      <VirtualList
        {...virtualListProps}
        items={paginatedItems}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Anterior
            </button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage + 1} de {totalPages}
            </span>
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Siguiente
            </button>
          </div>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-2 py-1 text-sm rounded ${
                    page === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de lista virtualizada con ordenamiento
interface SortableVirtualListProps<T> extends Omit<VirtualListProps<T>, 'items'> {
  items: T[]
  sortBy: keyof T | null
  sortOrder: 'asc' | 'desc'
  onSort: (field: keyof T) => void
  sortableFields: Array<{
    field: keyof T
    label: string
  }>
  className?: string
}

export function SortableVirtualList<T>({
  items,
  sortBy,
  sortOrder,
  onSort,
  sortableFields,
  className = '',
  ...virtualListProps
}: SortableVirtualListProps<T>) {
  const sortedItems = React.useMemo(() => {
    if (!sortBy) return items

    return [...items].sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortBy, sortOrder])

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {sortableFields.map(({ field, label }) => (
          <button
            key={String(field)}
            onClick={() => onSort(field)}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === field
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
            {sortBy === field && (
              <span className="ml-1">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ))}
      </div>

      <VirtualList
        {...virtualListProps}
        items={sortedItems}
      />
    </div>
  )
}

// Componente de lista virtualizada completa con todas las funcionalidades
interface AdvancedVirtualListProps<T> extends Omit<VirtualListProps<T>, 'items'> {
  items: T[]
  searchTerm: string
  onSearchChange: (term: string) => void
  searchFields?: (keyof T)[]
  searchPlaceholder?: string
  sortBy: keyof T | null
  sortOrder: 'asc' | 'desc'
  onSort: (field: keyof T) => void
  sortableFields: Array<{
    field: keyof T
    label: string
  }>
  pageSize?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  className?: string
}

export function AdvancedVirtualList<T>({
  items,
  searchTerm,
  onSearchChange,
  searchFields,
  searchPlaceholder = 'Buscar...',
  sortBy,
  sortOrder,
  onSort,
  sortableFields,
  pageSize,
  currentPage = 0,
  onPageChange,
  className = '',
  ...virtualListProps
}: AdvancedVirtualListProps<T>) {
  const filteredItems = React.useMemo(() => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item => {
        if (searchFields) {
          return searchFields.some(field => {
            const value = item[field]
            return String(value).toLowerCase().includes(searchTerm.toLowerCase())
          })
        }

        return Object.values(item as any).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [items, searchTerm, searchFields, sortBy, sortOrder])

  const paginatedItems = React.useMemo(() => {
    if (!pageSize || !onPageChange) return filteredItems
    
    const startIndex = currentPage * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, pageSize, currentPage, onPageChange])

  const totalPages = Math.ceil(filteredItems.length / (pageSize || filteredItems.length))

  const goToPage = useCallback((page: number) => {
    if (onPageChange) {
      onPageChange(Math.max(0, Math.min(page, totalPages - 1)))
    }
  }, [onPageChange, totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Sort */}
      <div className="flex flex-wrap gap-2">
        {sortableFields.map(({ field, label }) => (
          <button
            key={String(field)}
            onClick={() => onSort(field)}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === field
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
            {sortBy === field && (
              <span className="ml-1">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Virtual List */}
      <VirtualList
        {...virtualListProps}
        items={paginatedItems}
      />

      {/* Pagination */}
      {pageSize && onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Anterior
            </button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage + 1} de {totalPages}
            </span>
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Siguiente
            </button>
          </div>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-2 py-1 text-sm rounded ${
                    page === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
