import React from 'react'

interface FlexProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  style?: React.CSSProperties
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  wrap = 'nowrap',
  align = 'stretch',
  justify = 'start',
  gap = 'none',
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
        return 'flex-row'
    }
  }

  const getWrapClass = () => {
    switch (wrap) {
      case 'nowrap':
        return 'flex-nowrap'
      case 'wrap':
        return 'flex-wrap'
      case 'wrap-reverse':
        return 'flex-wrap-reverse'
      default:
        return 'flex-nowrap'
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

  const getGapClass = () => {
    switch (gap) {
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
        return 'gap-0'
    }
  }

  const flexClasses = [
    'flex',
    getDirectionClass(),
    getWrapClass(),
    getAlignClass(),
    getJustifyClass(),
    getGapClass(),
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={flexClasses} style={style}>
      {children}
    </div>
  )
}

// Flex Item component
interface FlexItemProps {
  children: React.ReactNode
  grow?: boolean | number
  shrink?: boolean | number
  basis?: string | number
  order?: number
  align?: 'auto' | 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  className?: string
  style?: React.CSSProperties
}

export const FlexItem: React.FC<FlexItemProps> = ({
  children,
  grow,
  shrink,
  basis,
  order,
  align,
  className = '',
  style = {}
}) => {
  const getGrowClass = () => {
    if (grow === true) return 'flex-grow'
    if (grow === false) return 'flex-grow-0'
    if (typeof grow === 'number') return `flex-grow-${grow}`
    return ''
  }

  const getShrinkClass = () => {
    if (shrink === true) return 'flex-shrink'
    if (shrink === false) return 'flex-shrink-0'
    if (typeof shrink === 'number') return `flex-shrink-${shrink}`
    return ''
  }

  const getBasisClass = () => {
    if (basis) return ''
    return ''
  }

  const getOrderClass = () => {
    if (order !== undefined) return `order-${order}`
    return ''
  }

  const getAlignClass = () => {
    switch (align) {
      case 'auto':
        return 'self-auto'
      case 'start':
        return 'self-start'
      case 'center':
        return 'self-center'
      case 'end':
        return 'self-end'
      case 'stretch':
        return 'self-stretch'
      case 'baseline':
        return 'self-baseline'
      default:
        return ''
    }
  }

  const itemClasses = [
    getGrowClass(),
    getShrinkClass(),
    getBasisClass(),
    getOrderClass(),
    getAlignClass(),
    className
  ].filter(Boolean).join(' ')

  const itemStyle: React.CSSProperties = {
    ...style,
    ...(basis && { flexBasis: typeof basis === 'number' ? `${basis}px` : basis })
  }

  return (
    <div className={itemClasses} style={itemStyle}>
      {children}
    </div>
  )
}

// Centered Flex component
interface CenteredFlexProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  style?: React.CSSProperties
}

export const CenteredFlex: React.FC<CenteredFlexProps> = ({
  children,
  direction = 'row',
  wrap = 'nowrap',
  gap = 'none',
  className = '',
  style = {}
}) => {
  return (
    <Flex
      direction={direction}
      wrap={wrap}
      align="center"
      justify="center"
      gap={gap}
      className={className}
      style={style}
    >
      {children}
    </Flex>
  )
}

// Spaced Flex component
interface SpacedFlexProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  style?: React.CSSProperties
}

export const SpacedFlex: React.FC<SpacedFlexProps> = ({
  children,
  direction = 'row',
  wrap = 'nowrap',
  align = 'stretch',
  gap = 'lg',
  className = '',
  style = {}
}) => {
  return (
    <Flex
      direction={direction}
      wrap={wrap}
      align={align}
      justify="between"
      gap={gap}
      className={className}
      style={style}
    >
      {children}
    </Flex>
  )
}

// Responsive Flex component
interface ResponsiveFlexProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: {
    sm?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    md?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    lg?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    xl?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  }
  className?: string
  style?: React.CSSProperties
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  direction = 'row',
  wrap = 'nowrap',
  align = 'stretch',
  justify = 'start',
  gap = 'none',
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
        return 'flex-row'
    }
  }

  const getWrapClass = () => {
    switch (wrap) {
      case 'nowrap':
        return 'flex-nowrap'
      case 'wrap':
        return 'flex-wrap'
      case 'wrap-reverse':
        return 'flex-wrap-reverse'
      default:
        return 'flex-nowrap'
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

  const getGapClass = () => {
    switch (gap) {
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
        return 'gap-0'
    }
  }

  const flexClasses = [
    'flex',
    getDirectionClass(),
    getResponsiveClasses(),
    getWrapClass(),
    getAlignClass(),
    getJustifyClass(),
    getGapClass(),
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={flexClasses} style={style}>
      {children}
    </div>
  )
}
