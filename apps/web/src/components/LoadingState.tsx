import React from 'react'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Cargando...',
  size = 'md',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50'
    : 'flex items-center justify-center py-8'

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4`}></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Skeleton components for different content types
export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
)

export const SkeletonPlayerCard: React.FC = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
    <div className="h-20 bg-gradient-to-br from-gray-300 to-gray-400"></div>
    <div className="p-4">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
)

export const SkeletonEventCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="h-5 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="flex items-center gap-2">
      <div className="h-3 bg-gray-200 rounded w-20"></div>
      <div className="h-3 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
)

export const SkeletonMessage: React.FC = () => (
  <div className="flex animate-pulse">
    <div className="bg-gray-200 rounded-lg px-3 py-2 max-w-[80%]">
      <div className="h-4 bg-gray-300 rounded w-48"></div>
    </div>
  </div>
)

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
    <div className="px-6 py-3 border-b border-gray-200">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded w-20"></div>
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-6 py-4 border-b border-gray-100">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-3 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

// Loading states for specific pages
export const LoadingPlayers: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <SkeletonPlayerCard key={i} />
    ))}
  </div>
)

export const LoadingEvents: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonEventCard key={i} />
    ))}
  </div>
)

export const LoadingMessages: React.FC = () => (
  <div className="space-y-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <SkeletonMessage key={i} />
    ))}
  </div>
)

export const LoadingTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => <SkeletonTable rows={rows} columns={columns} />
