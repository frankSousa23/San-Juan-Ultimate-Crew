import React from 'react'

interface StackProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  className?: string
  style?: React.CSSProperties
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  style = {}
}) => {
  const getDirectionClass = () => {
    switch (direction) {
      case 'row':
        return 'flex-row'
      case 'column':
        return 'flex-col'
      case 'row-reverse':
        return 'flex-row-reverse'
      case 'column-reverse':
        return 'flex-col-reverse'
      default:
        return 'flex-col'
    }
  }

  const getSpacingClass = () => {
    switch (spacing) {
      case 'none':
        return 'gap-0'
      case 'xs':
        return 'gap-1'
      case 'sm':
        return 'gap-2'
      case 'md':
        return 'gap-4'
      case 'lg':
        return 'gap-6'
      case 'xl':
        return 'gap-8'
      default:
        return 'gap-4'
    }
  }

  const getAlignClass = () => {
    switch (align) {
      case 'start':
        return 'items-start'
      case 'center':
        return 'items-center'
      case 'end':
        return 'items-end'
      case 'stretch':
        return 'items-stretch'
      case 'baseline':
        return 'items-baseline'
      default:
        return 'items-stretch'
    }
  }

  const getJustifyClass = () => {
    switch (justify) {
      case 'start':
        return 'justify-start'
      case 'center':
        return 'justify-center'
      case 'end':
        return 'justify-end'
      case 'between':
        return 'justify-between'
      case 'around':
        return 'justify-around'
      case 'evenly':
        return 'justify-evenly'
      default:
        return 'justify-start'
    }
  }

  const stackClasses = [
    'flex',
    getDirectionClass(),
    getSpacingClass(),
    getAlignClass(),
    getJustifyClass(),
    wrap ? 'flex-wrap' : 'flex-nowrap',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={stackClasses} style={style}>
      {children}
    </div>
  )
}

// HStack component (horizontal stack)
interface HStackProps {
  children: React.ReactNode
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  className?: string
  style?: React.CSSProperties
}

export const HStack: React.FC<HStackProps> = ({
  children,
  spacing = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className = '',
  style = {}
}) => {
  return (
    <Stack
      direction="row"
      spacing={spacing}
      align={align}
      justify={justify}
      wrap={wrap}
      className={className}
      style={style}
    >
      {children}
    </Stack>
  )
}

// VStack component (vertical stack)
interface VStackProps {
  children: React.ReactNode
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  className?: string
  style?: React.CSSProperties
}

export const VStack: React.FC<VStackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  style = {}
}) => {
  return (
    <Stack
      direction="column"
      spacing={spacing}
      align={align}
      justify={justify}
      wrap={wrap}
      className={className}
      style={style}
    >
      {children}
    </Stack>
  )
}

// Centered Stack component
interface CenteredStackProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  wrap?: boolean
  className?: string
  style?: React.CSSProperties
}

export const CenteredStack: React.FC<CenteredStackProps> = ({
  children,
  direction = 'column',
  spacing = 'md',
  wrap = false,
  className = '',
  style = {}
}) => {
  return (
    <Stack
      direction={direction}
      spacing={spacing}
      align="center"
      justify="center"
      wrap={wrap}
      className={className}
      style={style}
    >
      {children}
    </Stack>
  )
}

// Spaced Stack component
interface SpacedStackProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  className?: string
  style?: React.CSSProperties
}

export const SpacedStack: React.FC<SpacedStackProps> = ({
  children,
  direction = 'column',
  spacing = 'lg',
  align = 'stretch',
  justify = 'between',
  wrap = false,
  className = '',
  style = {}
}) => {
  return (
    <Stack
      direction={direction}
      spacing={spacing}
      align={align}
      justify={justify}
      wrap={wrap}
      className={className}
      style={style}
    >
      {children}
    </Stack>
  )
}

// Responsive Stack component
interface ResponsiveStackProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  responsive?: {
    sm?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    md?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    lg?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    xl?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  }
  className?: string
  style?: React.CSSProperties
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  responsive,
  className = '',
  style = {}
}) => {
  const getResponsiveClasses = () => {
    if (!responsive) return ''

    const classes = []
    
    if (responsive.sm) {
      classes.push(`sm:flex-${responsive.sm === 'row' ? 'row' : 'col'}`)
    }
    
    if (responsive.md) {
      classes.push(`md:flex-${responsive.md === 'row' ? 'row' : 'col'}`)
    }
    
    if (responsive.lg) {
      classes.push(`lg:flex-${responsive.lg === 'row' ? 'row' : 'col'}`)
    }
    
    if (responsive.xl) {
      classes.push(`xl:flex-${responsive.xl === 'row' ? 'row' : 'col'}`)
    }
    
    return classes.join(' ')
  }

  const getDirectionClass = () => {
    switch (direction) {
      case 'row':
        return 'flex-row'
      case 'column':
        return 'flex-col'
      case 'row-reverse':
        return 'flex-row-reverse'
      case 'column-reverse':
        return 'flex-col-reverse'
      default:
        return 'flex-col'
    }
  }

  const getSpacingClass = () => {
    switch (spacing) {
      case 'none':
        return 'gap-0'
      case 'xs':
        return 'gap-1'
      case 'sm':
        return 'gap-2'
      case 'md':
        return 'gap-4'
      case 'lg':
        return 'gap-6'
      case 'xl':
        return 'gap-8'
      default:
        return 'gap-4'
    }
  }

  const getAlignClass = () => {
    switch (align) {
      case 'start':
        return 'items-start'
      case 'center':
        return 'items-center'
      case 'end':
        return 'items-end'
      case 'stretch':
        return 'items-stretch'
      case 'baseline':
        return 'items-baseline'
      default:
        return 'items-stretch'
    }
  }

  const getJustifyClass = () => {
    switch (justify) {
      case 'start':
        return 'justify-start'
      case 'center':
        return 'justify-center'
      case 'end':
        return 'justify-end'
      case 'between':
        return 'justify-between'
      case 'around':
        return 'justify-around'
      case 'evenly':
        return 'justify-evenly'
      default:
        return 'justify-start'
    }
  }

  const stackClasses = [
    'flex',
    getDirectionClass(),
    getResponsiveClasses(),
    getSpacingClass(),
    getAlignClass(),
    getJustifyClass(),
    wrap ? 'flex-wrap' : 'flex-nowrap',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={stackClasses} style={style}>
      {children}
    </div>
  )
}