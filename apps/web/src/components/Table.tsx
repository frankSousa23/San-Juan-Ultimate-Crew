import React from 'react'

interface Column<T> {
  key: keyof T
  title: string
  render?: (value: any, item: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  striped?: boolean
  hover?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onRowClick?: (item: T, index: number) => void
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void
  sortKey?: keyof T
  sortDirection?: 'asc' | 'desc'
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  striped = false,
  hover = false,
  size = 'md',
  className = '',
  onRowClick,
  onSort,
  sortKey,
  sortDirection
}: TableProps<T>) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const paddingClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4'
  }

  const handleSort = (key: keyof T) => {
    if (!onSort) return
    
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(key, newDirection)
  }

  const getSortIcon = (key: keyof T) => {
    if (sortKey !== key) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="animate-pulse">
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className={`${paddingClasses[size]} ${sizeClasses[size]}`}>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">📋</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`${paddingClasses[size]} text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                } ${column.className || ''}`}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={`flex items-center ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : ''}`}>
                  {column.title}
                  {column.sortable && (
                    <span className="ml-1 text-gray-400">
                      {getSortIcon(column.key)}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${striped ? 'divide-y-0' : ''}`}>
          {data.map((item, index) => (
            <tr
              key={index}
              className={`${striped && index % 2 === 1 ? 'bg-gray-50' : ''} ${
                hover ? 'hover:bg-gray-50' : ''
              } ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item, index)}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`${paddingClasses[size]} ${sizeClasses[size]} text-gray-900 ${
                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                  } ${column.className || ''}`}
                >
                  {column.render
                    ? column.render(item[column.key], item, index)
                    : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Simple Table for basic use cases
interface SimpleTableProps {
  data: Array<Record<string, any>>
  columns: Array<{
    key: string
    title: string
    render?: (value: any, item: any, index: number) => React.ReactNode
  }>
  loading?: boolean
  emptyMessage?: string
  className?: string
}

export const SimpleTable: React.FC<SimpleTableProps> = ({
  data,
  columns,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  className = ''
}) => {
  return (
    <Table
      data={data}
      columns={columns}
      loading={loading}
      emptyMessage={emptyMessage}
      className={className}
    />
  )
}

// Data Table with advanced features
interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  striped?: boolean
  hover?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onRowClick?: (item: T, index: number) => void
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void
  sortKey?: keyof T
  sortDirection?: 'asc' | 'desc'
  pagination?: {
    current: number
    total: number
    pageSize: number
    onPageChange: (page: number) => void
  }
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  actions?: {
    label: string
    onClick: (selectedItems: T[]) => void
    disabled?: boolean
  }[]
  selectable?: boolean
  selectedItems?: T[]
  onSelectionChange?: (selectedItems: T[]) => void
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  striped = false,
  hover = false,
  size = 'md',
  className = '',
  onRowClick,
  onSort,
  sortKey,
  sortDirection,
  pagination,
  search,
  actions,
  selectable = false,
  selectedItems = [],
  onSelectionChange
}: DataTableProps<T>) {
  const safeData = Array.isArray(data) ? data : []
  const [selected, setSelected] = React.useState<T[]>(selectedItems)

  React.useEffect(() => {
    setSelected(selectedItems)
  }, [selectedItems])

  const handleSelectAll = () => {
    const newSelected = selected.length === safeData.length ? [] : [...safeData]
    setSelected(newSelected)
    onSelectionChange?.(newSelected)
  }

  const handleSelectItem = (item: T) => {
    const newSelected = selected.includes(item)
      ? selected.filter(selectedItem => selectedItem !== item)
      : [...selected, item]
    setSelected(newSelected)
    onSelectionChange?.(newSelected)
  }

  const isSelected = (item: T) => selected.includes(item)
  const isAllSelected = selected.length === safeData.length && safeData.length > 0
  const isIndeterminate = selected.length > 0 && selected.length < safeData.length

  // Add selection column if selectable
  const tableColumns = selectable
    ? [
        {
          key: 'select' as keyof T,
          title: (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate
              }}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          ),
          render: (_: any, item: T) => (
            <input
              type="checkbox"
              checked={isSelected(item)}
              onChange={() => handleSelectItem(item)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          ),
          width: '50px',
          align: 'center' as const
        },
        ...columns
      ]
    : columns

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      {(search || actions) && (
        <div className="flex items-center justify-between">
          {search && (
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || 'Buscar...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
          
          {actions && selected.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
              </span>
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => action.onClick(selected)}
                  disabled={action.disabled}
                  className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <Table
        data={data}
        columns={tableColumns}
        loading={loading}
        emptyMessage={emptyMessage}
        striped={striped}
        hover={hover}
        size={size}
        className={className}
        onRowClick={onRowClick}
        onSort={onSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
      />

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {((pagination.current - 1) * pagination.pageSize) + 1} a{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} de{' '}
            {pagination.total} resultados
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700">
              Página {pagination.current} de {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            
            <button
              onClick={() => pagination.onPageChange(pagination.current + 1)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
