import React from 'react'

interface BreadcrumbItem {
  id: string
  label: string
  href?: string
  icon?: React.ReactNode
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  showHome?: boolean
  homeIcon?: React.ReactNode
  homeHref?: string
  onItemClick?: (item: BreadcrumbItem, index: number) => void
  className?: string
  style?: React.CSSProperties
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator,
  showHome = true,
  homeIcon,
  homeHref = '/',
  onItemClick,
  className = '',
  style = {}
}) => {
  const defaultSeparator = (
    <svg
      className="w-4 h-4 text-gray-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )

  const defaultHomeIcon = (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  )

  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    if (onItemClick) {
      onItemClick(item, index)
    }
  }

  const allItems = showHome
    ? [
        {
          id: 'home',
          label: 'Home',
          href: homeHref,
          icon: homeIcon || defaultHomeIcon,
          current: false
        },
        ...items
      ]
    : items

  return (
    <nav className={`flex ${className}`} style={style} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => (
          <li key={item.id} className="flex items-center">
            {index > 0 && (
              <div className="mx-2">
                {separator || defaultSeparator}
              </div>
            )}
            
            <div className="flex items-center">
              {item.icon && (
                <div className="mr-2 text-gray-500">
                  {item.icon}
                </div>
              )}
              
              {item.current ? (
                <span className="text-sm font-medium text-gray-900">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    handleItemClick(item, index)
                  }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  onClick={() => handleItemClick(item, index)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {item.label}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Simple Breadcrumb component
interface SimpleBreadcrumbProps {
  items: string[]
  separator?: string
  onItemClick?: (item: string, index: number) => void
  className?: string
  style?: React.CSSProperties
}

export const SimpleBreadcrumb: React.FC<SimpleBreadcrumbProps> = ({
  items,
  separator = '>',
  onItemClick,
  className = '',
  style = {}
}) => {
  const handleItemClick = (item: string, index: number) => {
    if (onItemClick) {
      onItemClick(item, index)
    }
  }

  return (
    <nav className={`flex ${className}`} style={style} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400">
                {separator}
              </span>
            )}
            
            {index === items.length - 1 ? (
              <span className="text-sm font-medium text-gray-900">
                {item}
              </span>
            ) : (
              <button
                onClick={() => handleItemClick(item, index)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                {item}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Icon Breadcrumb component
interface IconBreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  showHome?: boolean
  homeIcon?: React.ReactNode
  homeHref?: string
  onItemClick?: (item: BreadcrumbItem, index: number) => void
  className?: string
  style?: React.CSSProperties
}

export const IconBreadcrumb: React.FC<IconBreadcrumbProps> = ({
  items,
  separator,
  showHome = true,
  homeIcon,
  homeHref = '/',
  onItemClick,
  className = '',
  style = {}
}) => {
  const defaultSeparator = (
    <svg
      className="w-4 h-4 text-gray-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )

  const defaultHomeIcon = (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  )

  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    if (onItemClick) {
      onItemClick(item, index)
    }
  }

  const allItems = showHome
    ? [
        {
          id: 'home',
          label: 'Home',
          href: homeHref,
          icon: homeIcon || defaultHomeIcon,
          current: false
        },
        ...items
      ]
    : items

  return (
    <nav className={`flex ${className}`} style={style} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => (
          <li key={item.id} className="flex items-center">
            {index > 0 && (
              <div className="mx-2">
                {separator || defaultSeparator}
              </div>
            )}
            
            <div className="flex items-center">
              {item.icon && (
                <div className="mr-2 text-gray-500">
                  {item.icon}
                </div>
              )}
              
              {item.current ? (
                <span className="text-sm font-medium text-gray-900">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    handleItemClick(item, index)
                  }}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  onClick={() => handleItemClick(item, index)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {item.label}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Compact Breadcrumb component
interface CompactBreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  showHome?: boolean
  homeIcon?: React.ReactNode
  homeHref?: string
  onItemClick?: (item: BreadcrumbItem, index: number) => void
  className?: string
  style?: React.CSSProperties
}

export const CompactBreadcrumb: React.FC<CompactBreadcrumbProps> = ({
  items,
  separator,
  showHome = true,
  homeIcon,
  homeHref = '/',
  onItemClick,
  className = '',
  style = {}
}) => {
  const defaultSeparator = (
    <svg
      className="w-3 h-3 text-gray-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )

  const defaultHomeIcon = (
    <svg
      className="w-3 h-3"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  )

  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    if (onItemClick) {
      onItemClick(item, index)
    }
  }

  const allItems = showHome
    ? [
        {
          id: 'home',
          label: 'Home',
          href: homeHref,
          icon: homeIcon || defaultHomeIcon,
          current: false
        },
        ...items
      ]
    : items

  return (
    <nav className={`flex ${className}`} style={style} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => (
          <li key={item.id} className="flex items-center">
            {index > 0 && (
              <div className="mx-1">
                {separator || defaultSeparator}
              </div>
            )}
            
            <div className="flex items-center">
              {item.icon && (
                <div className="mr-1 text-gray-500">
                  {item.icon}
                </div>
              )}
              
              {item.current ? (
                <span className="text-xs font-medium text-gray-900">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    handleItemClick(item, index)
                  }}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  onClick={() => handleItemClick(item, index)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {item.label}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}