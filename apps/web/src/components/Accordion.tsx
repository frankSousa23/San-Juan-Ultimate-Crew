import React, { useState } from 'react'

interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
  disabled?: boolean
  icon?: string
  badge?: string | number
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  defaultOpen?: string[]
  variant?: 'default' | 'bordered' | 'flush'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onToggle?: (itemId: string, isOpen: boolean) => void
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  variant = 'default',
  size = 'md',
  className = '',
  onToggle
}) => {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen)

  const handleToggle = (itemId: string) => {
    const isCurrentlyOpen = openItems.includes(itemId)
    let newOpenItems: string[]

    if (allowMultiple) {
      newOpenItems = isCurrentlyOpen
        ? openItems.filter(id => id !== itemId)
        : [...openItems, itemId]
    } else {
      newOpenItems = isCurrentlyOpen ? [] : [itemId]
    }

    setOpenItems(newOpenItems)
    onToggle?.(itemId, !isCurrentlyOpen)
  }

  const variantClasses = {
    default: 'border border-gray-200 rounded-lg overflow-hidden',
    bordered: 'border border-gray-200 rounded-lg overflow-hidden',
    flush: 'border-0'
  }

  const sizeClasses = {
    sm: {
      header: 'px-3 py-2 text-sm',
      content: 'px-3 py-2 text-sm'
    },
    md: {
      header: 'px-4 py-3 text-base',
      content: 'px-4 py-3 text-base'
    },
    lg: {
      header: 'px-6 py-4 text-lg',
      content: 'px-6 py-4 text-lg'
    }
  }

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {items.map((item, _index) => {
        const isOpen = openItems.includes(item.id)
        const isDisabled = item.disabled

        return (
          <div key={item.id} className={variant === 'flush' ? '' : 'border-b border-gray-200 last:border-b-0'}>
            <button
              onClick={() => !isDisabled && handleToggle(item.id)}
              disabled={isDisabled}
              className={`w-full flex items-center justify-between text-left transition-colors ${
                isDisabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
              } ${sizeClasses[size].header}`}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
            >
              <div className="flex items-center">
                {item.icon && <span className="mr-2">{item.icon}</span>}
                <span className="font-medium">{item.title}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <div className={`transform transition-transform duration-200 ${
                isOpen ? 'rotate-180' : 'rotate-0'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            <div
              id={`accordion-content-${item.id}`}
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className={`${sizeClasses[size].content} text-gray-600`}>
                {item.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Simple Accordion for basic use cases
interface SimpleAccordionProps {
  items: Array<{
    id: string
    title: string
    content: React.ReactNode
  }>
  defaultOpen?: string[]
  className?: string
}

export const SimpleAccordion: React.FC<SimpleAccordionProps> = ({
  items,
  defaultOpen = [],
  className = ''
}) => {
  return (
    <Accordion
      items={items}
      defaultOpen={defaultOpen}
      variant="default"
      className={className}
    />
  )
}

// Bordered Accordion
interface BorderedAccordionProps {
  items: Array<{
    id: string
    title: string
    content: React.ReactNode
    disabled?: boolean
  }>
  allowMultiple?: boolean
  defaultOpen?: string[]
  className?: string
}

export const BorderedAccordion: React.FC<BorderedAccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = ''
}) => {
  return (
    <Accordion
      items={items}
      allowMultiple={allowMultiple}
      defaultOpen={defaultOpen}
      variant="bordered"
      className={className}
    />
  )
}

// Flush Accordion (no borders)
interface FlushAccordionProps {
  items: Array<{
    id: string
    title: string
    content: React.ReactNode
    disabled?: boolean
  }>
  allowMultiple?: boolean
  defaultOpen?: string[]
  className?: string
}

export const FlushAccordion: React.FC<FlushAccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = ''
}) => {
  return (
    <Accordion
      items={items}
      allowMultiple={allowMultiple}
      defaultOpen={defaultOpen}
      variant="flush"
      className={className}
    />
  )
}

// FAQ Accordion with common styling
interface FAQAccordionProps {
  faqs: Array<{
    id: string
    question: string
    answer: React.ReactNode
  }>
  defaultOpen?: string[]
  className?: string
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  faqs,
  defaultOpen = [],
  className = ''
}) => {
  const items = faqs.map(faq => ({
    id: faq.id,
    title: faq.question,
    content: faq.answer,
    icon: '❓'
  }))

  return (
    <Accordion
      items={items}
      defaultOpen={defaultOpen}
      variant="bordered"
      className={className}
    />
  )
}
