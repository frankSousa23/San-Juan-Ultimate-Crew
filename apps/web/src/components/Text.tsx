import React from 'react'

interface TextProps {
  children?: React.ReactNode
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'strong' | 'em' | 'small' | 'code' | 'pre'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'white' | 'black' | string
  align?: 'left' | 'center' | 'right' | 'justify'
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case'
  decoration?: 'underline' | 'line-through' | 'no-underline'
  truncate?: boolean
  lineHeight?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'
  letterSpacing?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const Text: React.FC<TextProps> = ({
  children,
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
  color = 'primary',
  align = 'left',
  transform = 'normal-case',
  decoration = 'no-underline',
  truncate = false,
  lineHeight = 'normal',
  letterSpacing = 'normal',
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'xs':
        return 'text-xs'
      case 'sm':
        return 'text-sm'
      case 'base':
        return 'text-base'
      case 'lg':
        return 'text-lg'
      case 'xl':
        return 'text-xl'
      case '2xl':
        return 'text-2xl'
      case '3xl':
        return 'text-3xl'
      case '4xl':
        return 'text-4xl'
      case '5xl':
        return 'text-5xl'
      case '6xl':
        return 'text-6xl'
      default:
        return 'text-base'
    }
  }

  const getWeightClass = () => {
    switch (weight) {
      case 'thin':
        return 'font-thin'
      case 'light':
        return 'font-light'
      case 'normal':
        return 'font-normal'
      case 'medium':
        return 'font-medium'
      case 'semibold':
        return 'font-semibold'
      case 'bold':
        return 'font-bold'
      case 'extrabold':
        return 'font-extrabold'
      case 'black':
        return 'font-black'
      default:
        return 'font-normal'
    }
  }

  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'text-gray-900'
      case 'secondary':
        return 'text-gray-600'
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      case 'info':
        return 'text-blue-600'
      case 'muted':
        return 'text-gray-500'
      case 'white':
        return 'text-white'
      case 'black':
        return 'text-black'
      default:
        return ''
    }
  }

  const getAlignClass = () => {
    switch (align) {
      case 'left':
        return 'text-left'
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      case 'justify':
        return 'text-justify'
      default:
        return 'text-left'
    }
  }

  const getTransformClass = () => {
    switch (transform) {
      case 'uppercase':
        return 'uppercase'
      case 'lowercase':
        return 'lowercase'
      case 'capitalize':
        return 'capitalize'
      case 'normal-case':
        return 'normal-case'
      default:
        return 'normal-case'
    }
  }

  const getDecorationClass = () => {
    switch (decoration) {
      case 'underline':
        return 'underline'
      case 'line-through':
        return 'line-through'
      case 'no-underline':
        return 'no-underline'
      default:
        return 'no-underline'
    }
  }

  const getLineHeightClass = () => {
    switch (lineHeight) {
      case 'none':
        return 'leading-none'
      case 'tight':
        return 'leading-tight'
      case 'snug':
        return 'leading-snug'
      case 'normal':
        return 'leading-normal'
      case 'relaxed':
        return 'leading-relaxed'
      case 'loose':
        return 'leading-loose'
      default:
        return 'leading-normal'
    }
  }

  const getLetterSpacingClass = () => {
    switch (letterSpacing) {
      case 'tighter':
        return 'tracking-tighter'
      case 'tight':
        return 'tracking-tight'
      case 'normal':
        return 'tracking-normal'
      case 'wide':
        return 'tracking-wide'
      case 'wider':
        return 'tracking-wider'
      case 'widest':
        return 'tracking-widest'
      default:
        return 'tracking-normal'
    }
  }

  const textClasses = [
    getSizeClass(),
    getWeightClass(),
    getColorClass(),
    getAlignClass(),
    getTransformClass(),
    getDecorationClass(),
    getLineHeightClass(),
    getLetterSpacingClass(),
    truncate ? 'truncate' : '',
    className
  ].filter(Boolean).join(' ')

  const textStyle: React.CSSProperties = {
    ...style,
    ...(color && !['primary', 'secondary', 'success', 'warning', 'error', 'info', 'muted', 'white', 'black'].includes(color) && { color })
  }

  return (
    <Component
      className={textClasses}
      style={textStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </Component>
  )
}

// Heading component
interface HeadingProps {
  children?: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'white' | 'black' | string
  align?: 'left' | 'center' | 'right' | 'justify'
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case'
  decoration?: 'underline' | 'line-through' | 'no-underline'
  truncate?: boolean
  lineHeight?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'
  letterSpacing?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const Heading: React.FC<HeadingProps> = ({
  children,
  as: Component = 'h2',
  size = '2xl',
  weight = 'bold',
  color = 'primary',
  align = 'left',
  transform = 'normal-case',
  decoration = 'no-underline',
  truncate = false,
  lineHeight = 'tight',
  letterSpacing = 'normal',
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  return (
    <Text
      as={Component}
      size={size}
      weight={weight}
      color={color}
      align={align}
      transform={transform}
      decoration={decoration}
      truncate={truncate}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </Text>
  )
}

// Label component
interface LabelProps {
  children?: React.ReactNode
  as?: 'label' | 'span' | 'div'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'white' | 'black' | string
  align?: 'left' | 'center' | 'right' | 'justify'
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case'
  decoration?: 'underline' | 'line-through' | 'no-underline'
  truncate?: boolean
  lineHeight?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'
  letterSpacing?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'
  required?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const Label: React.FC<LabelProps> = ({
  children,
  as: Component = 'label',
  size = 'sm',
  weight = 'medium',
  color = 'primary',
  align = 'left',
  transform = 'normal-case',
  decoration = 'no-underline',
  truncate = false,
  lineHeight = 'normal',
  letterSpacing = 'normal',
  required = false,
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  return (
    <Text
      as={Component}
      size={size}
      weight={weight}
      color={color}
      align={align}
      transform={transform}
      decoration={decoration}
      truncate={truncate}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Text>
  )
}

// Caption component
interface CaptionProps {
  children?: React.ReactNode
  as?: 'p' | 'span' | 'div' | 'small'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'white' | 'black' | string
  align?: 'left' | 'center' | 'right' | 'justify'
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case'
  decoration?: 'underline' | 'line-through' | 'no-underline'
  truncate?: boolean
  lineHeight?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'
  letterSpacing?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const Caption: React.FC<CaptionProps> = ({
  children,
  as: Component = 'small',
  size = 'xs',
  weight = 'normal',
  color = 'muted',
  align = 'left',
  transform = 'normal-case',
  decoration = 'no-underline',
  truncate = false,
  lineHeight = 'normal',
  letterSpacing = 'normal',
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  return (
    <Text
      as={Component}
      size={size}
      weight={weight}
      color={color}
      align={align}
      transform={transform}
      decoration={decoration}
      truncate={truncate}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </Text>
  )
}

// Code component
interface CodeProps {
  children?: React.ReactNode
  as?: 'code' | 'pre' | 'span' | 'div'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'white' | 'black' | string
  align?: 'left' | 'center' | 'right' | 'justify'
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case'
  decoration?: 'underline' | 'line-through' | 'no-underline'
  truncate?: boolean
  lineHeight?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'
  letterSpacing?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const Code: React.FC<CodeProps> = ({
  children,
  as: Component = 'code',
  size = 'sm',
  weight = 'normal',
  color = 'primary',
  align = 'left',
  transform = 'normal-case',
  decoration = 'no-underline',
  truncate = false,
  lineHeight = 'normal',
  letterSpacing = 'normal',
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const codeClasses = [
    'font-mono',
    'bg-gray-100',
    'px-1',
    'py-0.5',
    'rounded',
    className
  ].filter(Boolean).join(' ')

  return (
    <Text
      as={Component}
      size={size}
      weight={weight}
      color={color}
      align={align}
      transform={transform}
      decoration={decoration}
      truncate={truncate}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      className={codeClasses}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </Text>
  )
}