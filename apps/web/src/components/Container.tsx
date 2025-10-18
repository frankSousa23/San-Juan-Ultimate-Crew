import React from 'react'

interface ContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
  fluid?: boolean
  className?: string
  style?: React.CSSProperties
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  padding = 'md',
  margin = 'none',
  center = true,
  fluid = false,
  className = '',
  style = {}
}) => {
  const getSizeClass = () => {
    if (fluid) return 'w-full'
    
    switch (size) {
      case 'sm':
        return 'max-w-sm'
      case 'md':
        return 'max-w-md'
      case 'lg':
        return 'max-w-4xl'
      case 'xl':
        return 'max-w-6xl'
      case '2xl':
        return 'max-w-7xl'
      case 'full':
        return 'w-full'
      default:
        return 'max-w-4xl'
    }
  }

  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return 'p-0'
      case 'sm':
        return 'p-2'
      case 'md':
        return 'p-4'
      case 'lg':
        return 'p-6'
      case 'xl':
        return 'p-8'
      default:
        return 'p-4'
    }
  }

  const getMarginClass = () => {
    switch (margin) {
      case 'none':
        return 'm-0'
      case 'sm':
        return 'm-2'
      case 'md':
        return 'm-4'
      case 'lg':
        return 'm-6'
      case 'xl':
        return 'm-8'
      default:
        return 'm-0'
    }
  }

  const containerClasses = [
    getSizeClass(),
    getPaddingClass(),
    getMarginClass(),
    center ? 'mx-auto' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses} style={style}>
      {children}
    </div>
  )
}

// Section Container component
interface SectionContainerProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
  fluid?: boolean
  className?: string
  style?: React.CSSProperties
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  title,
  subtitle,
  icon,
  size = 'lg',
  padding = 'md',
  margin = 'none',
  center = true,
  fluid = false,
  className = '',
  style = {}
}) => {
  return (
    <Container
      size={size}
      padding={padding}
      margin={margin}
      center={center}
      fluid={fluid}
      className={className}
      style={style}
    >
      {(title || subtitle || icon) && (
        <div className="mb-6">
          {title && (
            <div className="flex items-center mb-2">
              {icon && (
                <div className="mr-3 text-gray-600">
                  {icon}
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {title}
              </h2>
            </div>
          )}
          
          {subtitle && (
            <p className="text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {children}
    </Container>
  )
}

// Card Container component
interface CardContainerProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
  fluid?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  border?: boolean
  className?: string
  style?: React.CSSProperties
}

export const CardContainer: React.FC<CardContainerProps> = ({
  children,
  title,
  subtitle,
  icon,
  size = 'lg',
  padding = 'md',
  margin = 'none',
  center = true,
  fluid = false,
  shadow = 'md',
  rounded = 'lg',
  border = true,
  className = '',
  style = {}
}) => {
  const getShadowClass = () => {
    switch (shadow) {
      case 'none':
        return ''
      case 'sm':
        return 'shadow-sm'
      case 'md':
        return 'shadow-md'
      case 'lg':
        return 'shadow-lg'
      case 'xl':
        return 'shadow-xl'
      default:
        return 'shadow-md'
    }
  }

  const getRoundedClass = () => {
    switch (rounded) {
      case 'none':
        return ''
      case 'sm':
        return 'rounded-sm'
      case 'md':
        return 'rounded-md'
      case 'lg':
        return 'rounded-lg'
      case 'xl':
        return 'rounded-xl'
      case 'full':
        return 'rounded-full'
      default:
        return 'rounded-lg'
    }
  }

  const cardClasses = [
    'bg-white',
    getShadowClass(),
    getRoundedClass(),
    border ? 'border border-gray-200' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <Container
      size={size}
      padding={padding}
      margin={margin}
      center={center}
      fluid={fluid}
      className={cardClasses}
      style={style}
    >
      {(title || subtitle || icon) && (
        <div className="mb-6 pb-4 border-b border-gray-200">
          {title && (
            <div className="flex items-center mb-2">
              {icon && (
                <div className="mr-3 text-gray-600">
                  {icon}
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            </div>
          )}
          
          {subtitle && (
            <p className="text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {children}
    </Container>
  )
}

// Fluid Container component
interface FluidContainerProps {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
  className?: string
  style?: React.CSSProperties
}

export const FluidContainer: React.FC<FluidContainerProps> = ({
  children,
  padding = 'md',
  margin = 'none',
  center = true,
  className = '',
  style = {}
}) => {
  return (
    <Container
      size="full"
      padding={padding}
      margin={margin}
      center={center}
      fluid={true}
      className={className}
      style={style}
    >
      {children}
    </Container>
  )
}

// Narrow Container component
interface NarrowContainerProps {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
  className?: string
  style?: React.CSSProperties
}

export const NarrowContainer: React.FC<NarrowContainerProps> = ({
  children,
  padding = 'md',
  margin = 'none',
  center = true,
  className = '',
  style = {}
}) => {
  return (
    <Container
      size="sm"
      padding={padding}
      margin={margin}
      center={center}
      fluid={false}
      className={className}
      style={style}
    >
      {children}
    </Container>
  )
}

// Wide Container component
interface WideContainerProps {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
  className?: string
  style?: React.CSSProperties
}

export const WideContainer: React.FC<WideContainerProps> = ({
  children,
  padding = 'md',
  margin = 'none',
  center = true,
  className = '',
  style = {}
}) => {
  return (
    <Container
      size="2xl"
      padding={padding}
      margin={margin}
      center={center}
      fluid={false}
      className={className}
      style={style}
    >
      {children}
    </Container>
  )
}