import React, { useState, useEffect, useRef } from 'react'

interface CarouselProps {
  children: React.ReactNode
  autoplay?: boolean
  autoplayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  infinite?: boolean
  className?: string
  style?: React.CSSProperties
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  autoplay = false,
  autoplayInterval = 3000,
  showDots = true,
  showArrows = true,
  infinite = true,
  className = '',
  style = {}
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  const childrenArray = React.Children.toArray(children)
  const totalSlides = childrenArray.length

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return

    setIsTransitioning(true)
    setCurrentIndex(index)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }

  const goToPrevious = () => {
    if (isTransitioning) return

    if (infinite) {
      goToSlide(currentIndex === 0 ? totalSlides - 1 : currentIndex - 1)
    } else {
      goToSlide(Math.max(0, currentIndex - 1))
    }
  }

  const goToNext = () => {
    if (isTransitioning) return

    if (infinite) {
      goToSlide(currentIndex === totalSlides - 1 ? 0 : currentIndex + 1)
    } else {
      goToSlide(Math.min(totalSlides - 1, currentIndex + 1))
    }
  }

  useEffect(() => {
    if (autoplay && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        goToNext()
      }, autoplayInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoplay, autoplayInterval, currentIndex, totalSlides])

  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const handleMouseLeave = () => {
    if (autoplay && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        goToNext()
      }, autoplayInterval)
    }
  }

  if (totalSlides === 0) {
    return null
  }

  return (
    <div
      ref={carouselRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          width: `${totalSlides * 100}%`
        }}
      >
        {childrenArray.map((child, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0"
            style={{ width: `${100 / totalSlides}%` }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && totalSlides > 1 && (
        <>
          <button
            onClick={goToPrevious}
            disabled={!infinite && currentIndex === 0}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={goToNext}
            disabled={!infinite && currentIndex === totalSlides - 1}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {childrenArray.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Carousel Item component
interface CarouselItemProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const CarouselItem: React.FC<CarouselItemProps> = ({
  children,
  className = '',
  style = {}
}) => {
  return (
    <div className={`w-full h-full ${className}`} style={style}>
      {children}
    </div>
  )
}

// Image Carousel component
interface ImageCarouselProps {
  images: string[]
  alt?: string
  autoplay?: boolean
  autoplayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  infinite?: boolean
  className?: string
  style?: React.CSSProperties
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  alt = '',
  autoplay = false,
  autoplayInterval = 3000,
  showDots = true,
  showArrows = true,
  infinite = true,
  className = '',
  style = {}
}) => {
  return (
    <Carousel
      autoplay={autoplay}
      autoplayInterval={autoplayInterval}
      showDots={showDots}
      showArrows={showArrows}
      infinite={infinite}
      className={className}
      style={style}
    >
      {images.map((image, index) => (
        <CarouselItem key={index}>
          <img
            src={image}
            alt={`${alt} ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </CarouselItem>
      ))}
    </Carousel>
  )
}

// Card Carousel component
interface CardCarouselProps {
  cards: React.ReactNode[]
  autoplay?: boolean
  autoplayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  infinite?: boolean
  className?: string
  style?: React.CSSProperties
}

export const CardCarousel: React.FC<CardCarouselProps> = ({
  cards,
  autoplay = false,
  autoplayInterval = 3000,
  showDots = true,
  showArrows = true,
  infinite = true,
  className = '',
  style = {}
}) => {
  return (
    <Carousel
      autoplay={autoplay}
      autoplayInterval={autoplayInterval}
      showDots={showDots}
      showArrows={showArrows}
      infinite={infinite}
      className={className}
      style={style}
    >
      {cards.map((card, index) => (
        <CarouselItem key={index}>
          {card}
        </CarouselItem>
      ))}
    </Carousel>
  )
}

// Testimonial Carousel component
interface Testimonial {
  id: string
  content: string
  author: string
  role?: string
  avatar?: string
  rating?: number
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[]
  autoplay?: boolean
  autoplayInterval?: number
  showDots?: boolean
  showArrows?: boolean
  infinite?: boolean
  className?: string
  style?: React.CSSProperties
}

export const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({
  testimonials,
  autoplay = true,
  autoplayInterval = 5000,
  showDots = true,
  showArrows = true,
  infinite = true,
  className = '',
  style = {}
}) => {
  return (
    <Carousel
      autoplay={autoplay}
      autoplayInterval={autoplayInterval}
      showDots={showDots}
      showArrows={showArrows}
      infinite={infinite}
      className={className}
      style={style}
    >
      {testimonials.map((testimonial) => (
        <CarouselItem key={testimonial.id}>
          <div className="text-center p-8">
            {testimonial.rating && (
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < testimonial.rating! ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            )}
            
            <blockquote className="text-lg text-gray-700 mb-6">
              "{testimonial.content}"
            </blockquote>
            
            <div className="flex items-center justify-center">
              {testimonial.avatar && (
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full mr-4"
                />
              )}
              <div>
                <div className="font-semibold text-gray-900">
                  {testimonial.author}
                </div>
                {testimonial.role && (
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CarouselItem>
      ))}
    </Carousel>
  )
}
