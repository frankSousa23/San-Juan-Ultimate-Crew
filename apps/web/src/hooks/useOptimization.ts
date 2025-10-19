import { useMemo, useCallback, useRef, useEffect, useState } from 'react'

// Hook para debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para throttle
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}

// Hook para memoización de objetos
export function useMemoizedObject<T extends Record<string, any>>(obj: T): T {
  return useMemo(() => obj, Object.values(obj))
}

// Hook para memoización de arrays
export function useMemoizedArray<T>(arr: T[]): T[] {
  return useMemo(() => arr, arr)
}

// Hook para memoización de funciones
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps)
}

// Hook para lazy loading
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const loaded = useRef(false)

  const load = useCallback(async () => {
    if (loaded.current) return

    setLoading(true)
    setError(null)
    try {
      const result = await loadFn()
      setData(result)
      loaded.current = true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, deps)

  const reset = useCallback(() => {
    loaded.current = false
    setData(null)
    setError(null)
  }, [])

  return { data, loading, error, load, reset }
}

// Hook para virtual scrolling
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }))
  }, [items, itemHeight, containerHeight, scrollTop])

  const totalHeight = items.length * itemHeight
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  }
}

// Hook para intersection observer
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      options
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options, hasIntersected])

  return { isIntersecting, hasIntersected }
}

// Hook para performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current += 1
    const renderTime = Date.now() - startTime.current

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times in ${renderTime}ms`)
    }
  })

  return {
    renderCount: renderCount.current,
  }
}

// Hook para memoización de selectors
export function useMemoizedSelector<T, R>(
  data: T,
  selector: (data: T) => R,
  deps: React.DependencyList = []
): R {
  return useMemo(() => selector(data), [data, ...deps])
}

// Hook para batch updates
export function useBatchUpdates() {
  const [updates, setUpdates] = useState<(() => void)[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()

  const batchUpdate = useCallback((update: () => void) => {
    setUpdates(prev => [...prev, update])

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      updates.forEach(update => update())
      setUpdates([])
    }, 0)
  }, [updates])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return batchUpdate
}

// Hook para cache de datos
export function useDataCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())

  const fetchData = useCallback(async () => {
    const cached = cacheRef.current.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < ttl) {
      setData(cached.data)
      return cached.data
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFn()
      cacheRef.current.set(key, { data: result, timestamp: now })
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [key, fetchFn, ttl])

  const clearCache = useCallback(() => {
    cacheRef.current.delete(key)
    setData(null)
  }, [key])

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear()
    setData(null)
  }, [])

  return {
    data,
    loading,
    error,
    fetchData,
    clearCache,
    clearAllCache,
  }
}

// Hook para optimización de listas
export function useOptimizedList<T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string | number,
  options: {
    pageSize?: number
    virtualScroll?: boolean
    itemHeight?: number
    containerHeight?: number
  } = {}
) {
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<keyof T | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const filteredItems = useMemo(() => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
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
  }, [items, searchTerm, sortBy, sortOrder])

  const paginatedItems = useMemo(() => {
    if (!options.pageSize) return filteredItems
    
    const startIndex = page * options.pageSize
    return filteredItems.slice(startIndex, startIndex + options.pageSize)
  }, [filteredItems, page, options.pageSize])

  const totalPages = Math.ceil(filteredItems.length / (options.pageSize || filteredItems.length))

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(0, Math.min(newPage, totalPages - 1)))
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(page + 1)
  }, [page, goToPage])

  const prevPage = useCallback(() => {
    goToPage(page - 1)
  }, [page, goToPage])

  const sort = useCallback((field: keyof T) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy])

  return {
    items: paginatedItems,
    filteredItems,
    page,
    totalPages,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    goToPage,
    nextPage,
    prevPage,
    sort,
    hasNextPage: page < totalPages - 1,
    hasPrevPage: page > 0,
  }
}
