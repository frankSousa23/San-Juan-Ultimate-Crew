import React from 'react'

interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  direction?: 'horizontal' | 'vertical' | 'both'
  className?: string
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  direction = 'vertical',
  className = ''
}) => {
  const sizeClasses = {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
    '2xl': '12',
    '3xl': '16',
    '4xl': '20',
    '5xl': '24',
    '6xl': '32'
  }

  const directionClasses = {
    horizontal: `w-${sizeClasses[size]}`,
    vertical: `h-${sizeClasses[size]}`,
    both: `w-${sizeClasses[size]} h-${sizeClasses[size]}`
  }

  return (
    <div className={`${directionClasses[direction]} ${className}`} />
  )
}

// Horizontal Spacer
interface HorizontalSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  className?: string
}

export const HorizontalSpacer: React.FC<HorizontalSpacerProps> = ({
  size = 'md',
  className = ''
}) => {
  return (
    <Spacer
      size={size}
      direction="horizontal"
      className={className}
    />
  )
}

// Vertical Spacer
interface VerticalSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  className?: string
}

export const VerticalSpacer: React.FC<VerticalSpacerProps> = ({
  size = 'md',
  className = ''
}) => {
  return (
    <Spacer
      size={size}
      direction="vertical"
      className={className}
    />
  )
}

// Square Spacer
interface SquareSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  className?: string
}

export const SquareSpacer: React.FC<SquareSpacerProps> = ({
  size = 'md',
  className = ''
}) => {
  return (
    <Spacer
      size={size}
      direction="both"
      className={className}
    />
  )
}

// Custom Spacer with specific dimensions
interface CustomSpacerProps {
  width?: string
  height?: string
  className?: string
}

export const CustomSpacer: React.FC<CustomSpacerProps> = ({
  width,
  height,
  className = ''
}) => {
  const style: React.CSSProperties = {}
  
  if (width) style.width = width
  if (height) style.height = height

  return (
    <div
      style={style}
      className={className}
    />
  )
}

// Responsive Spacer
interface ResponsiveSpacerProps {
  size?: {
    xs?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    sm?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    md?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    lg?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    xl?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  }
  direction?: 'horizontal' | 'vertical' | 'both'
  className?: string
}

export const ResponsiveSpacer: React.FC<ResponsiveSpacerProps> = ({
  size = { xs: 'md' },
  direction = 'vertical',
  className = ''
}) => {
  const sizeClasses = {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
    '2xl': '12',
    '3xl': '16',
    '4xl': '20',
    '5xl': '24',
    '6xl': '32'
  }

  const getResponsiveClasses = () => {
    const classes: string[] = []
    
    if (size.xs) {
      const baseClass = direction === 'horizontal' ? 'w' : direction === 'vertical' ? 'h' : 'w'
      classes.push(`${baseClass}-${sizeClasses[size.xs]}`)
    }
    
    if (size.sm) {
      const baseClass = direction === 'horizontal' ? 'sm:w' : direction === 'vertical' ? 'sm:h' : 'sm:w'
      classes.push(`${baseClass}-${sizeClasses[size.sm]}`)
    }
    
    if (size.md) {
      const baseClass = direction === 'horizontal' ? 'md:w' : direction === 'vertical' ? 'md:h' : 'md:w'
      classes.push(`${baseClass}-${sizeClasses[size.md]}`)
    }
    
    if (size.lg) {
      const baseClass = direction === 'horizontal' ? 'lg:w' : direction === 'vertical' ? 'lg:h' : 'lg:w'
      classes.push(`${baseClass}-${sizeClasses[size.lg]}`)
    }
    
    if (size.xl) {
      const baseClass = direction === 'horizontal' ? 'xl:w' : direction === 'vertical' ? 'xl:h' : 'xl:w'
      classes.push(`${baseClass}-${sizeClasses[size.xl]}`)
    }

    if (direction === 'both') {
      // For both direction, we need to add height classes as well
      if (size.xs) classes.push(`h-${sizeClasses[size.xs]}`)
      if (size.sm) classes.push(`sm:h-${sizeClasses[size.sm]}`)
      if (size.md) classes.push(`md:h-${sizeClasses[size.md]}`)
      if (size.lg) classes.push(`lg:h-${sizeClasses[size.lg]}`)
      if (size.xl) classes.push(`xl:h-${sizeClasses[size.xl]}`)
    }
    
    return classes.join(' ')
  }

  return (
    <div className={`${getResponsiveClasses()} ${className}`} />
  )
}
