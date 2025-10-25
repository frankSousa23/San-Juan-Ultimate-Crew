import React from 'react'

interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  className?: string
  style?: React.CSSProperties
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
  style = {}
}) => {
  const getColsClass = () => {
    switch (cols) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-3'
      case 4:
        return 'grid-cols-4'
      case 5:
        return 'grid-cols-5'
      case 6:
        return 'grid-cols-6'
      case 12:
        return 'grid-cols-12'
      default:
        return 'grid-cols-3'
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

  const gridClasses = [
    'grid',
    getColsClass(),
    getGapClass(),
    getAlignClass(),
    getJustifyClass(),
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={gridClasses} style={style}>
      {children}
    </div>
  )
}

// Grid Item component
interface GridItemProps {
  children: React.ReactNode
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  end?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  className?: string
  style?: React.CSSProperties
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  colSpan,
  rowSpan,
  start,
  end,
  className = '',
  style = {}
}) => {
  const getColSpanClass = () => {
    if (!colSpan) return ''
    
    switch (colSpan) {
      case 1:
        return 'col-span-1'
      case 2:
        return 'col-span-2'
      case 3:
        return 'col-span-3'
      case 4:
        return 'col-span-4'
      case 5:
        return 'col-span-5'
      case 6:
        return 'col-span-6'
      case 12:
        return 'col-span-12'
      default:
        return ''
    }
  }

  const getRowSpanClass = () => {
    if (!rowSpan) return ''
    
    switch (rowSpan) {
      case 1:
        return 'row-span-1'
      case 2:
        return 'row-span-2'
      case 3:
        return 'row-span-3'
      case 4:
        return 'row-span-4'
      case 5:
        return 'row-span-5'
      case 6:
        return 'row-span-6'
      default:
        return ''
    }
  }

  const getStartClass = () => {
    if (!start) return ''
    
    switch (start) {
      case 1:
        return 'col-start-1'
      case 2:
        return 'col-start-2'
      case 3:
        return 'col-start-3'
      case 4:
        return 'col-start-4'
      case 5:
        return 'col-start-5'
      case 6:
        return 'col-start-6'
      case 12:
        return 'col-start-12'
      default:
        return ''
    }
  }

  const getEndClass = () => {
    if (!end) return ''
    
    switch (end) {
      case 1:
        return 'col-end-1'
      case 2:
        return 'col-end-2'
      case 3:
        return 'col-end-3'
      case 4:
        return 'col-end-4'
      case 5:
        return 'col-end-5'
      case 6:
        return 'col-end-6'
      case 12:
        return 'col-end-12'
      default:
        return ''
    }
  }

  const itemClasses = [
    getColSpanClass(),
    getRowSpanClass(),
    getStartClass(),
    getEndClass(),
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={itemClasses} style={style}>
      {children}
    </div>
  )
}

// Responsive Grid component
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  }
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  className?: string
  style?: React.CSSProperties
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { sm: 1, md: 2, lg: 3 },
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
  style = {}
}) => {
  const getResponsiveColsClass = () => {
    const classes = []
    
    if (cols.sm) {
      classes.push(`sm:grid-cols-${cols.sm}`)
    }
    
    if (cols.md) {
      classes.push(`md:grid-cols-${cols.md}`)
    }
    
    if (cols.lg) {
      classes.push(`lg:grid-cols-${cols.lg}`)
    }
    
    if (cols.xl) {
      classes.push(`xl:grid-cols-${cols.xl}`)
    }
    
    return classes.join(' ')
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

  const gridClasses = [
    'grid',
    'grid-cols-1', // Default for mobile
    getResponsiveColsClass(),
    getGapClass(),
    getAlignClass(),
    getJustifyClass(),
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={gridClasses} style={style}>
      {children}
    </div>
  )
}

// Auto Grid component
interface AutoGridProps {
  children: React.ReactNode
  minWidth?: string
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  className?: string
  style?: React.CSSProperties
}

export const AutoGrid: React.FC<AutoGridProps> = ({
  children,
  minWidth = '250px',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
  style = {}
}) => {
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

  const gridClasses = [
    'grid',
    getGapClass(),
    getAlignClass(),
    getJustifyClass(),
    className
  ].filter(Boolean).join(' ')

  const gridStyle: React.CSSProperties = {
    ...style,
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`
  }

  return (
    <div className={gridClasses} style={gridStyle}>
      {children}
    </div>
  )
}

// Masonry Grid component
interface MasonryGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  style?: React.CSSProperties
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  className = '',
  style = {}
}) => {
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
        return 'gap-4'
    }
  }

  const gridClasses = [
    'grid',
    getGapClass(),
    className
  ].filter(Boolean).join(' ')

  const gridStyle: React.CSSProperties = {
    ...style,
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridAutoRows: 'masonry'
  }

  return (
    <div className={gridClasses} style={gridStyle}>
      {children}
    </div>
  )
}
