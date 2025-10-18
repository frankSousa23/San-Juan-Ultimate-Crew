import React, { useState, useEffect } from 'react'

interface LayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'sidebar' | 'centered' | 'fullscreen'
  className?: string
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  sidebar,
  header,
  footer,
  variant = 'default',
  className = ''
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const variantClasses = {
    default: 'min-h-screen bg-gray-50',
    sidebar: 'min-h-screen bg-gray-50',
    centered: 'min-h-screen bg-gray-50 flex items-center justify-center',
    fullscreen: 'min-h-screen bg-gray-50'
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (variant === 'centered') {
    return (
      <div className={`${variantClasses[variant]} ${className}`}>
        <div className="w-full max-w-md mx-auto p-6">
          {children}
        </div>
      </div>
    )
  }

  if (variant === 'fullscreen') {
    return (
      <div className={`${variantClasses[variant]} ${className}`}>
        {children}
      </div>
    )
  }

  if (variant === 'sidebar' && sidebar) {
    return (
      <div className={`${variantClasses[variant]} ${className}`}>
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0">
          {sidebar}
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Header */}
          {header && (
            <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSidebarToggle}
                  className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                >
                  <span className="text-gray-500">☰</span>
                </button>
                {header}
              </div>
            </header>
          )}

          {/* Content */}
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>

          {/* Footer */}
          {footer && (
            <footer className="bg-white border-t border-gray-200 px-4 py-3 lg:px-6">
              {footer}
            </footer>
          )}
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {/* Header */}
      {header && (
        <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
          {header}
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-6">
        {children}
      </main>

      {/* Footer */}
      {footer && (
        <footer className="bg-white border-t border-gray-200 px-4 py-3 lg:px-6">
          {footer}
        </footer>
      )}
    </div>
  )
}

// Dashboard Layout
interface DashboardLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  className?: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  header,
  className = ''
}) => {
  return (
    <Layout
      variant="sidebar"
      sidebar={sidebar}
      header={header}
      className={className}
    >
      {children}
    </Layout>
  )
}

// Auth Layout
interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  className = ''
}) => {
  return (
    <Layout variant="centered" className={className}>
      <div className="w-full max-w-md mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            )}
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </Layout>
  )
}

// Page Layout
interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumbs?: React.ReactNode
  className?: string
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = ''
}) => {
  return (
    <Layout className={className}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <nav className="mb-4">
          {breadcrumbs}
        </nav>
      )}

      {/* Page Header */}
      {(title || subtitle || actions) && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              )}
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      {children}
    </Layout>
  )
}

// Card Layout
interface CardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export const CardLayout: React.FC<CardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Card Header */}
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  )
}

// Grid Layout
interface GridLayoutProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = ''
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

// Flex Layout
interface FlexLayoutProps {
  children: React.ReactNode
  direction?: 'row' | 'column'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const FlexLayout: React.FC<FlexLayoutProps> = ({
  children,
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
  className = ''
}) => {
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div
      className={`flex ${directionClasses[direction]} ${alignClasses[align]} ${justifyClasses[justify]} ${
        wrap ? 'flex-wrap' : ''
      } ${gapClasses[gap]} ${className}`}
    >
      {children}
    </div>
  )
}