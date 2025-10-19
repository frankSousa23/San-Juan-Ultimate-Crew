import React, { memo, useMemo, useCallback, ReactNode } from 'react'

// Componente memoizado genérico
interface MemoizedProps {
  children: ReactNode
  dependencies?: any[]
  className?: string
  style?: React.CSSProperties
}

export const Memoized = memo<MemoizedProps>(({ children, className = '', style = {} }) => {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
})

// Componente memoizado con dependencias personalizadas
interface MemoizedWithDepsProps {
  children: ReactNode
  dependencies: any[]
  className?: string
  style?: React.CSSProperties
}

export const MemoizedWithDeps = memo<MemoizedWithDepsProps>(({ 
  children, 
  dependencies, 
  className = '', 
  style = {} 
}) => {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparación personalizada de dependencias
  return prevProps.dependencies.every((dep, index) => dep === nextProps.dependencies[index])
})

// Componente memoizado para listas
interface MemoizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor: (item: T, index: number) => string | number
  className?: string
  style?: React.CSSProperties
}

export const MemoizedList = memo<MemoizedListProps<any>>(({ 
  items, 
  renderItem, 
  keyExtractor, 
  className = '', 
  style = {} 
}) => {
  const memoizedItems = useMemo(() => 
    items.map((item, index) => ({
      item,
      index,
      key: keyExtractor(item, index),
    }))
  , [items, keyExtractor])

  return (
    <div className={className} style={style}>
      {memoizedItems.map(({ item, index, key }) => (
        <div key={key}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
})

// Componente memoizado para formularios
interface MemoizedFormProps {
  children: ReactNode
  values: Record<string, any>
  errors: Record<string, string | undefined>
  touched: Record<string, boolean>
  className?: string
  style?: React.CSSProperties
}

export const MemoizedForm = memo<MemoizedFormProps>(({ 
  children, 
  values, 
  errors, 
  touched, 
  className = '', 
  style = {} 
}) => {
  const memoizedValues = useMemo(() => values, [JSON.stringify(values)])
  const memoizedErrors = useMemo(() => errors, [JSON.stringify(errors)])
  const memoizedTouched = useMemo(() => touched, [JSON.stringify(touched)])

  return (
    <form className={className} style={style}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            values: memoizedValues,
            errors: memoizedErrors,
            touched: memoizedTouched,
          })
        }
        return child
      })}
    </form>
  )
})

// Componente memoizado para tablas
interface MemoizedTableProps<T> {
  data: T[]
  columns: Array<{
    key: keyof T
    label: string
    render?: (value: any, item: T, index: number) => ReactNode
  }>
  className?: string
  style?: React.CSSProperties
  onRowClick?: (item: T, index: number) => void
}

export const MemoizedTable = memo<MemoizedTableProps<any>>(({ 
  data, 
  columns, 
  className = '', 
  style = {}, 
  onRowClick 
}) => {
  const memoizedData = useMemo(() => data, [JSON.stringify(data)])
  const memoizedColumns = useMemo(() => columns, [JSON.stringify(columns)])

  const handleRowClick = useCallback((item: any, index: number) => {
    onRowClick?.(item, index)
  }, [onRowClick])

  return (
    <table className={className} style={style}>
      <thead>
        <tr>
          {memoizedColumns.map((column) => (
            <th key={String(column.key)} className="px-4 py-2 text-left">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {memoizedData.map((item, index) => (
          <tr
            key={index}
            onClick={() => handleRowClick(item, index)}
            className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
          >
            {memoizedColumns.map((column) => (
              <td key={String(column.key)} className="px-4 py-2">
                {column.render 
                  ? column.render(item[column.key], item, index)
                  : item[column.key]
                }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
})

// Componente memoizado para gráficos
interface MemoizedChartProps {
  data: any[]
  type: 'line' | 'bar' | 'pie' | 'doughnut'
  options?: any
  className?: string
  style?: React.CSSProperties
}

export const MemoizedChart = memo<MemoizedChartProps>(({ 
  data, 
  type, 
  options = {}, 
  className = '', 
  style = {} 
}) => {
  const memoizedData = useMemo(() => data, [JSON.stringify(data)])
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)])

  // Aquí se integraría con una librería de gráficos como Chart.js
  // Por ahora, mostramos un placeholder
  return (
    <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={style}>
      <div className="text-center">
        <div className="text-2xl mb-2">📊</div>
        <div className="text-sm text-gray-600">
          Gráfico {type} con {memoizedData.length} puntos de datos
        </div>
      </div>
    </div>
  )
})

// Componente memoizado para cards
interface MemoizedCardProps {
  title: string
  content: ReactNode
  actions?: ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export const MemoizedCard = memo<MemoizedCardProps>(({ 
  title, 
  content, 
  actions, 
  className = '', 
  style = {}, 
  onClick 
}) => {
  const handleClick = useCallback(() => {
    onClick?.()
  }, [onClick])

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
      style={style}
      onClick={handleClick}
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="mb-4">{content}</div>
      {actions && <div className="flex justify-end">{actions}</div>}
    </div>
  )
})

// Componente memoizado para botones
interface MemoizedButtonProps {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  style?: React.CSSProperties
}

export const MemoizedButton = memo<MemoizedButtonProps>(({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false, 
  className = '', 
  style = {} 
}) => {
  const handleClick = useCallback(() => {
    if (!disabled && !loading) {
      onClick()
    }
  }, [onClick, disabled, loading])

  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors'
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  }
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      style={style}
    >
      {loading ? 'Cargando...' : children}
    </button>
  )
})

// Componente memoizado para inputs
interface MemoizedInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number'
  error?: string
  touched?: boolean
  className?: string
  style?: React.CSSProperties
}

export const MemoizedInput = memo<MemoizedInputProps>(({ 
  value, 
  onChange, 
  placeholder, 
  type = 'text', 
  error, 
  touched, 
  className = '', 
  style = {} 
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const inputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error && touched ? 'border-red-500' : 'border-gray-300'
  } ${className}`

  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={inputClasses}
        style={style}
      />
      {error && touched && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

// Hook para crear componentes memoizados dinámicamente
export function useMemoizedComponent<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  dependencies: (keyof T)[]
) {
  return memo(Component, (prevProps, nextProps) => {
    return dependencies.every(dep => prevProps[dep] === nextProps[dep])
  })
}

// Hook para memoizar props
export function useMemoizedProps<T extends Record<string, any>>(
  props: T,
  dependencies: (keyof T)[]
): T {
  return useMemo(() => props, dependencies.map(dep => props[dep]))
}

// Hook para memoizar callbacks
export function useMemoizedCallbacks<T extends Record<string, (...args: any[]) => any>>(
  callbacks: T,
  dependencies: any[]
): T {
  return useMemo(() => {
    const memoizedCallbacks = {} as T
    Object.keys(callbacks).forEach(key => {
      memoizedCallbacks[key as keyof T] = useCallback(
        callbacks[key as keyof T],
        dependencies
      ) as T[keyof T]
    })
    return memoizedCallbacks
  }, dependencies)
}
