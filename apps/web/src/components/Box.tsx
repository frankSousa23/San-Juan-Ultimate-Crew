import React from 'react'

interface BoxProps {
  children?: React.ReactNode
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav'
  width?: string | number
  height?: string | number
  minWidth?: string | number
  minHeight?: string | number
  maxWidth?: string | number
  maxHeight?: string | number
  padding?: string | number
  margin?: string | number
  backgroundColor?: string
  color?: string
  border?: string
  borderRadius?: string | number
  boxShadow?: string
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'none'
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  top?: string | number
  right?: string | number
  bottom?: string | number
  left?: string | number
  zIndex?: number
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  cursor?: 'default' | 'pointer' | 'not-allowed' | 'grab' | 'grabbing'
  opacity?: number
  transform?: string
  transition?: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const Box: React.FC<BoxProps> = ({
  children,
  as: Component = 'div',
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  padding,
  margin,
  backgroundColor,
  color,
  border,
  borderRadius,
  boxShadow,
  display,
  position,
  top,
  right,
  bottom,
  left,
  zIndex,
  overflow,
  cursor,
  opacity,
  transform,
  transition,
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const boxStyle: React.CSSProperties = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    ...(minWidth && { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }),
    ...(minHeight && { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }),
    ...(maxWidth && { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }),
    ...(maxHeight && { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }),
    ...(padding && { padding: typeof padding === 'number' ? `${padding}px` : padding }),
    ...(margin && { margin: typeof margin === 'number' ? `${margin}px` : margin }),
    ...(backgroundColor && { backgroundColor }),
    ...(color && { color }),
    ...(border && { border }),
    ...(borderRadius && { borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius }),
    ...(boxShadow && { boxShadow }),
    ...(display && { display }),
    ...(position && { position }),
    ...(top && { top: typeof top === 'number' ? `${top}px` : top }),
    ...(right && { right: typeof right === 'number' ? `${right}px` : right }),
    ...(bottom && { bottom: typeof bottom === 'number' ? `${bottom}px` : bottom }),
    ...(left && { left: typeof left === 'number' ? `${left}px` : left }),
    ...(zIndex && { zIndex }),
    ...(overflow && { overflow }),
    ...(cursor && { cursor }),
    ...(opacity && { opacity }),
    ...(transform && { transform }),
    ...(transition && { transition })
  }

  return (
    <Component
      className={className}
      style={boxStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </Component>
  )
}

// Card Box component
interface CardBoxProps {
  children?: React.ReactNode
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav'
  padding?: string | number
  margin?: string | number
  backgroundColor?: string
  color?: string
  border?: string
  borderRadius?: string | number
  boxShadow?: string
  hover?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const CardBox: React.FC<CardBoxProps> = ({
  children,
  as: Component = 'div',
  padding = '1rem',
  margin,
  backgroundColor = '#ffffff',
  color,
  border = '1px solid #e5e7eb',
  borderRadius = '0.5rem',
  boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  hover = false,
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const cardClasses = [
    'transition-all duration-200',
    hover ? 'hover:shadow-lg hover:scale-105' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <Box
      as={Component}
      padding={padding}
      margin={margin}
      backgroundColor={backgroundColor}
      color={color}
      border={border}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      className={cardClasses}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </Box>
  )
}

// Container Box component
interface ContainerBoxProps {
  children?: React.ReactNode
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav'
  maxWidth?: string | number
  padding?: string | number
  margin?: string | number
  backgroundColor?: string
  color?: string
  border?: string
  borderRadius?: string | number
  boxShadow?: string
  center?: boolean
  className?: string
  style?: React.CSSProperties
}

export const ContainerBox: React.FC<ContainerBoxProps> = ({
  children,
  as: Component = 'div',
  maxWidth = '1200px',
  padding = '1rem',
  margin = '0 auto',
  backgroundColor,
  color,
  border,
  borderRadius,
  boxShadow,
  center = true,
  className = '',
  style = {},
  ...props
}) => {
  const containerClasses = [
    center ? 'mx-auto' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <Box
      as={Component}
      maxWidth={maxWidth}
      padding={padding}
      margin={margin}
      backgroundColor={backgroundColor}
      color={color}
      border={border}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      className={containerClasses}
      style={style}
      {...props}
    >
      {children}
    </Box>
  )
}

// Flex Box component
interface FlexBoxProps {
  children?: React.ReactNode
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav'
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: string | number
  padding?: string | number
  margin?: string | number
  backgroundColor?: string
  color?: string
  border?: string
  borderRadius?: string | number
  boxShadow?: string
  className?: string
  style?: React.CSSProperties
}

export const FlexBox: React.FC<FlexBoxProps> = ({
  children,
  as: Component = 'div',
  direction = 'row',
  wrap = 'nowrap',
  align = 'stretch',
  justify = 'start',
  gap,
  padding,
  margin,
  backgroundColor,
  color,
  border,
  borderRadius,
  boxShadow,
  className = '',
  style = {},
  ...props
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

  const flexClasses = [
    'flex',
    getDirectionClass(),
    getWrapClass(),
    getAlignClass(),
    getJustifyClass(),
    className
  ].filter(Boolean).join(' ')

  const flexStyle: React.CSSProperties = {
    ...style,
    ...(gap && { gap: typeof gap === 'number' ? `${gap}px` : gap })
  }

  return (
    <Box
      as={Component}
      display="flex"
      padding={padding}
      margin={margin}
      backgroundColor={backgroundColor}
      color={color}
      border={border}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      className={flexClasses}
      style={flexStyle}
      {...props}
    >
      {children}
    </Box>
  )
}

// Grid Box component
interface GridBoxProps {
  children?: React.ReactNode
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav'
  cols?: number
  rows?: number
  gap?: string | number
  padding?: string | number
  margin?: string | number
  backgroundColor?: string
  color?: string
  border?: string
  borderRadius?: string | number
  boxShadow?: string
  className?: string
  style?: React.CSSProperties
}

export const GridBox: React.FC<GridBoxProps> = ({
  children,
  as: Component = 'div',
  cols = 3,
  rows,
  gap,
  padding,
  margin,
  backgroundColor,
  color,
  border,
  borderRadius,
  boxShadow,
  className = '',
  style = {},
  ...props
}) => {
  const gridStyle: React.CSSProperties = {
    ...style,
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    ...(rows && { gridTemplateRows: `repeat(${rows}, 1fr)` }),
    ...(gap && { gap: typeof gap === 'number' ? `${gap}px` : gap })
  }

  return (
    <Box
      as={Component}
      padding={padding}
      margin={margin}
      backgroundColor={backgroundColor}
      color={color}
      border={border}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      className={className}
      style={gridStyle}
      {...props}
    >
      {children}
    </Box>
  )
}

// Absolute Box component
interface AbsoluteBoxProps {
  children?: React.ReactNode
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav'
  top?: string | number
  right?: string | number
  bottom?: string | number
  left?: string | number
  zIndex?: number
  width?: string | number
  height?: string | number
  padding?: string | number
  margin?: string | number
  backgroundColor?: string
  color?: string
  border?: string
  borderRadius?: string | number
  boxShadow?: string
  className?: string
  style?: React.CSSProperties
}

export const AbsoluteBox: React.FC<AbsoluteBoxProps> = ({
  children,
  as: Component = 'div',
  top,
  right,
  bottom,
  left,
  zIndex,
  width,
  height,
  padding,
  margin,
  backgroundColor,
  color,
  border,
  borderRadius,
  boxShadow,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <Box
      as={Component}
      position="absolute"
      top={top}
      right={right}
      bottom={bottom}
      left={left}
      zIndex={zIndex}
      width={width}
      height={height}
      padding={padding}
      margin={margin}
      backgroundColor={backgroundColor}
      color={color}
      border={border}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Box>
  )
}

// Fixed Box component
interface FixedBoxProps {
  children?: React.ReactNode
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav'
  top?: string | number
  right?: string | number
  bottom?: string | number
  left?: string | number
  zIndex?: number
  width?: string | number
  height?: string | number
  padding?: string | number
  margin?: string | number
  backgroundColor?: string
  color?: string
  border?: string
  borderRadius?: string | number
  boxShadow?: string
  className?: string
  style?: React.CSSProperties
}

export const FixedBox: React.FC<FixedBoxProps> = ({
  children,
  as: Component = 'div',
  top,
  right,
  bottom,
  left,
  zIndex,
  width,
  height,
  padding,
  margin,
  backgroundColor,
  color,
  border,
  borderRadius,
  boxShadow,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <Box
      as={Component}
      position="fixed"
      top={top}
      right={right}
      bottom={bottom}
      left={left}
      zIndex={zIndex}
      width={width}
      height={height}
      padding={padding}
      margin={margin}
      backgroundColor={backgroundColor}
      color={color}
      border={border}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Box>
  )
}
