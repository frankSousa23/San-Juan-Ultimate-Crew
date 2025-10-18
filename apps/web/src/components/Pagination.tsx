import React from 'react'

interface PaginationProps {
  current: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
  showQuickJumper?: boolean
  showTotal?: boolean
  simple?: boolean
  className?: string
}

export const Pagination: React.FC<PaginationProps> = ({
  current,
  total,
  pageSize,
  onPageChange,
  showSizeChanger = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  showQuickJumper = false,
  showTotal = false,
  simple = false,
  className = ''
}) => {
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (current - 1) * pageSize + 1
  const endItem = Math.min(current * pageSize, total)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (current >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== current) {
      onPageChange(page)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize)
    }
  }

  if (simple) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="text-sm text-gray-500">
          {showTotal && (
            <span>
              Mostrando {startItem} a {endItem} de {total} resultados
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(current - 1)}
            disabled={current === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-700">
            Página {current} de {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(current + 1)}
            disabled={current === totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-4">
        {showTotal && (
          <div className="text-sm text-gray-500">
            Mostrando {startItem} a {endItem} de {total} resultados
          </div>
        )}
        
        {showSizeChanger && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">por página</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {/* First page */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={current === 1}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          «
        </button>

        {/* Previous page */}
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ‹
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-sm text-gray-500">...</span>
            ) : (
              <button
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-2 text-sm border rounded-md ${
                  current === page
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next page */}
        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ›
        </button>

        {/* Last page */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={current === totalPages}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          »
        </button>
      </div>

      {showQuickJumper && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Ir a:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = Number((e.target as HTMLInputElement).value)
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

// Simple Pagination for basic use cases
interface SimplePaginationProps {
  current: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  showTotal?: boolean
  className?: string
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  current,
  total,
  pageSize,
  onPageChange,
  showTotal = false,
  className = ''
}) => {
  return (
    <Pagination
      current={current}
      total={total}
      pageSize={pageSize}
      onPageChange={onPageChange}
      showTotal={showTotal}
      simple={true}
      className={className}
    />
  )
}

// Compact Pagination for small spaces
interface CompactPaginationProps {
  current: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export const CompactPagination: React.FC<CompactPaginationProps> = ({
  current,
  total,
  pageSize,
  onPageChange,
  className = ''
}) => {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <button
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      
      <span className="px-3 py-1 text-sm text-gray-700">
        {current} / {totalPages}
      </span>
      
      <button
        onClick={() => onPageChange(current + 1)}
        disabled={current === totalPages}
        className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  )
}
