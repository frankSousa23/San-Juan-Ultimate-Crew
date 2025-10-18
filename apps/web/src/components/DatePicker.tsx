import React, { useState, useRef, useEffect } from 'react'

interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  format?: 'date' | 'datetime' | 'time'
  className?: string
  label?: string
  error?: string
  required?: boolean
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  minDate,
  maxDate,
  format = 'date',
  className = '',
  label,
  error,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null)
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }

    if (format === 'datetime') {
      options.hour = '2-digit'
      options.minute = '2-digit'
    } else if (format === 'time') {
      options.hour = '2-digit'
      options.minute = '2-digit'
      delete options.year
      delete options.month
      delete options.day
    }

    return date.toLocaleDateString('es-ES', options)
  }

  // Update input value when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setInputValue(formatDate(selectedDate))
    } else {
      setInputValue('')
    }
  }, [selectedDate, format])

  // Update selected date when value prop changes
  useEffect(() => {
    setSelectedDate(value || null)
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  // Check if date is disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  // Check if date is selected
  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return

    setSelectedDate(date)
    onChange(date)
    setIsOpen(false)
  }

  // Handle month navigation
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // Handle input blur
  const handleInputBlur = () => {
    if (inputValue) {
      const parsedDate = new Date(inputValue)
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate)
        onChange(parsedDate)
      }
    }
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div ref={datePickerRef} className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          📅
        </button>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button
              type="button"
              onClick={() => handleMonthChange('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <h3 className="text-sm font-medium text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => handleMonthChange('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>

          {/* Calendar Days */}
          <div className="p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-xs text-gray-500 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                const isSelected = isDateSelected(date)
                const isTodayDate = isToday(date)
                const isDisabled = isDateDisabled(date)

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={isDisabled}
                    className={`w-8 h-8 text-xs rounded hover:bg-gray-100 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${
                      isSelected
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : isTodayDate
                        ? 'bg-indigo-100 text-indigo-700'
                        : ''
                    } ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Calendar Footer */}
          <div className="flex items-center justify-between p-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null)
                onChange(null)
                setIsOpen(false)
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                setSelectedDate(today)
                onChange(today)
                setIsOpen(false)
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Date Range Picker
interface DateRangePickerProps {
  startDate?: Date | null
  endDate?: Date | null
  onChange: (startDate: Date | null, endDate: Date | null) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  className?: string
  label?: string
  error?: string
  required?: boolean
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  placeholder = 'Seleccionar rango de fechas',
  disabled = false,
  minDate,
  maxDate,
  className = '',
  label,
  error,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(startDate || null)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(endDate || null)
  const [isSelectingEnd, setIsSelectingEnd] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Format date range for display
  const formatDateRange = (start: Date | null, end: Date | null) => {
    if (!start && !end) return ''
    if (!start) return `Hasta ${end?.toLocaleDateString('es-ES')}`
    if (!end) return `Desde ${start?.toLocaleDateString('es-ES')}`
    return `${start?.toLocaleDateString('es-ES')} - ${end?.toLocaleDateString('es-ES')}`
  }

  // Update input value when selected dates change
  useEffect(() => {
    setInputValue(formatDateRange(selectedStartDate, selectedEndDate))
  }, [selectedStartDate, selectedEndDate])

  // Update selected dates when value props change
  useEffect(() => {
    setSelectedStartDate(startDate || null)
    setSelectedEndDate(endDate || null)
  }, [startDate, endDate])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  // Check if date is disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  // Check if date is in range
  const isDateInRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false
    return date >= selectedStartDate && date <= selectedEndDate
  }

  // Check if date is start or end
  const isDateStart = (date: Date) => {
    if (!selectedStartDate) return false
    return (
      date.getDate() === selectedStartDate.getDate() &&
      date.getMonth() === selectedStartDate.getMonth() &&
      date.getFullYear() === selectedStartDate.getFullYear()
    )
  }

  const isDateEnd = (date: Date) => {
    if (!selectedEndDate) return false
    return (
      date.getDate() === selectedEndDate.getDate() &&
      date.getMonth() === selectedEndDate.getMonth() &&
      date.getFullYear() === selectedEndDate.getFullYear()
    )
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return

    if (!selectedStartDate || isSelectingEnd) {
      if (selectedStartDate && date < selectedStartDate) {
        setSelectedStartDate(date)
        setSelectedEndDate(null)
        setIsSelectingEnd(true)
      } else {
        setSelectedEndDate(date)
        setIsSelectingEnd(false)
        onChange(selectedStartDate, date)
        setIsOpen(false)
      }
    } else {
      setSelectedStartDate(date)
      setIsSelectingEnd(true)
    }
  }

  // Handle month navigation
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div ref={datePickerRef} className="relative">
        <input
          type="text"
          value={inputValue}
          readOnly
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          📅
        </button>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button
              type="button"
              onClick={() => handleMonthChange('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <h3 className="text-sm font-medium text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => handleMonthChange('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>

          {/* Calendar Days */}
          <div className="p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-xs text-gray-500 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                const isStart = isDateStart(date)
                const isEnd = isDateEnd(date)
                const isInRange = isDateInRange(date)
                const isDisabled = isDateDisabled(date)

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={isDisabled}
                    className={`w-8 h-8 text-xs rounded hover:bg-gray-100 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${
                      isStart || isEnd
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : isInRange
                        ? 'bg-indigo-100 text-indigo-700'
                        : ''
                    } ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Calendar Footer */}
          <div className="flex items-center justify-between p-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setSelectedStartDate(null)
                setSelectedEndDate(null)
                onChange(null, null)
                setIsOpen(false)
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
            <div className="text-sm text-gray-500">
              {isSelectingEnd ? 'Selecciona fecha final' : 'Selecciona fecha inicial'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
