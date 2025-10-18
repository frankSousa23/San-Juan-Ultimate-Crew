import React from 'react'

interface TimelineItem {
  id: string
  title: string
  description?: string
  date?: string
  time?: string
  status?: 'completed' | 'in-progress' | 'pending' | 'cancelled'
  icon?: React.ReactNode
  color?: string
  content?: React.ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
  orientation?: 'vertical' | 'horizontal'
  showConnector?: boolean
  showDates?: boolean
  showStatus?: boolean
  className?: string
  style?: React.CSSProperties
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  orientation = 'vertical',
  showConnector = true,
  showDates = true,
  showStatus = true,
  className = '',
  style = {}
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-blue-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in-progress':
        return 'In Progress'
      case 'pending':
        return 'Pending'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  if (orientation === 'horizontal') {
    return (
      <div className={`flex items-center ${className}`} style={style}>
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center">
            {/* Timeline Item */}
            <div className="flex flex-col items-center">
              {/* Icon/Status */}
              <div className="relative">
                <div
                  className={`w-4 h-4 rounded-full ${
                    item.color || getStatusColor(item.status)
                  } flex items-center justify-center`}
                >
                  {item.icon && (
                    <div className="text-white text-xs">
                      {item.icon}
                    </div>
                  )}
                </div>
                
                {/* Status Badge */}
                {showStatus && item.status && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                      {getStatusText(item.status)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="mt-4 text-center max-w-xs">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-gray-600 text-xs mt-1">
                    {item.description}
                  </p>
                )}
                {showDates && item.date && (
                  <p className="text-gray-500 text-xs mt-1">
                    {item.date}
                  </p>
                )}
                {item.content && (
                  <div className="mt-2">
                    {item.content}
                  </div>
                )}
              </div>
            </div>

            {/* Connector */}
            {showConnector && index < items.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-300 mx-4" />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Vertical Line */}
      {showConnector && (
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />
      )}

      {/* Timeline Items */}
      <div className="space-y-8">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex items-start">
            {/* Icon/Status */}
            <div className="relative z-10">
              <div
                className={`w-12 h-12 rounded-full ${
                  item.color || getStatusColor(item.status)
                } flex items-center justify-center shadow-lg`}
              >
                {item.icon ? (
                  <div className="text-white text-lg">
                    {item.icon}
                  </div>
                ) : (
                  <div className="text-white text-sm font-semibold">
                    {index + 1}
                  </div>
                )}
              </div>
              
              {/* Status Badge */}
              {showStatus && item.status && (
                <div className="absolute -top-2 -right-2">
                  <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                    {getStatusText(item.status)}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="ml-6 flex-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  {showDates && item.date && (
                    <span className="text-sm text-gray-500">
                      {item.date}
                    </span>
                  )}
                </div>
                
                {item.time && (
                  <p className="text-sm text-gray-600 mb-2">
                    {item.time}
                  </p>
                )}
                
                {item.description && (
                  <p className="text-gray-700 mb-4">
                    {item.description}
                  </p>
                )}
                
                {item.content && (
                  <div className="mt-4">
                    {item.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact Timeline component
interface CompactTimelineProps {
  items: TimelineItem[]
  showConnector?: boolean
  showDates?: boolean
  showStatus?: boolean
  className?: string
  style?: React.CSSProperties
}

export const CompactTimeline: React.FC<CompactTimelineProps> = ({
  items,
  showConnector = true,
  showDates = true,
  showStatus = true,
  className = '',
  style = {}
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-blue-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Vertical Line */}
      {showConnector && (
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300" />
      )}

      {/* Timeline Items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex items-center">
            {/* Icon/Status */}
            <div className="relative z-10">
              <div
                className={`w-8 h-8 rounded-full ${
                  item.color || getStatusColor(item.status)
                } flex items-center justify-center`}
              >
                {item.icon ? (
                  <div className="text-white text-sm">
                    {item.icon}
                  </div>
                ) : (
                  <div className="text-white text-xs font-semibold">
                    {index + 1}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  {item.title}
                </h4>
                {showDates && item.date && (
                  <span className="text-xs text-gray-500">
                    {item.date}
                  </span>
                )}
              </div>
              
              {item.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {item.description}
                </p>
              )}
              
              {showStatus && item.status && (
                <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {item.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Event Timeline component
interface Event {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  location?: string
  type?: 'meeting' | 'deadline' | 'milestone' | 'event' | 'reminder'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  attendees?: string[]
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

interface EventTimelineProps {
  events: Event[]
  showConnector?: boolean
  showDates?: boolean
  showStatus?: boolean
  className?: string
  style?: React.CSSProperties
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  showConnector = true,
  showDates = true,
  showStatus = true,
  className = '',
  style = {}
}) => {
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'meeting':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
          </svg>
        )
      case 'deadline':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      case 'milestone':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'event':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        )
      case 'reminder':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15v-3a2 2 0 114 0v3H8z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500'
      case 'deadline':
        return 'bg-red-500'
      case 'milestone':
        return 'bg-green-500'
      case 'event':
        return 'bg-purple-500'
      case 'reminder':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500'
      case 'high':
        return 'border-orange-500'
      case 'medium':
        return 'border-yellow-500'
      case 'low':
        return 'border-green-500'
      default:
        return 'border-gray-300'
    }
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Vertical Line */}
      {showConnector && (
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />
      )}

      {/* Timeline Items */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex items-start">
            {/* Icon/Status */}
            <div className="relative z-10">
              <div
                className={`w-12 h-12 rounded-full ${getTypeColor(event.type)} flex items-center justify-center shadow-lg`}
              >
                <div className="text-white">
                  {getTypeIcon(event.type)}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="ml-6 flex-1">
              <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${getPriorityColor(event.priority)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.title}
                  </h3>
                  {showDates && (
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {event.date}
                      </span>
                      {event.time && (
                        <span className="text-sm text-gray-500 ml-2">
                          {event.time}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {event.description && (
                  <p className="text-gray-700 mb-3">
                    {event.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {event.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {event.location}
                      </div>
                    )}
                    
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        {event.attendees.length} attendees
                      </div>
                    )}
                  </div>
                  
                  {showStatus && event.status && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {event.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
