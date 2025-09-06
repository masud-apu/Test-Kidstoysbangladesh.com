'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel"
import Image from 'next/image'

const heroSlides = [
  {
    id: 1,
    title: "New Year Special Sale",
    subtitle: "Up to 50% Off",
    description: "Discover amazing toys that spark imagination and create lasting memories for your little ones.",
    buttonText: "Shop Sale Now",
    buttonLink: "/sale",
    badge: "🎉 Limited Time",
    badgeColor: "bg-red-100 text-red-800",
    imageSrc: "/slide-1.svg",
    imageAlt: "Kids toys new year sale"
  },
  {
    id: 2,
    title: "Educational Toys Collection",
    subtitle: "Learn Through Play",
    description: "Premium educational toys designed to boost creativity, problem-solving skills and cognitive development.",
    buttonText: "Explore Learning",
    buttonLink: "/educational",
    badge: "🧠 Smart Play",
    badgeColor: "bg-teal-100 text-teal-800",
    imageSrc: "slide-1.svg",
    imageAlt: "Educational toys collection"
  },
  {
    id: 3,
    title: "New Arrivals This Week",
    subtitle: "Fresh & Exciting",
    description: "Check out the latest toy arrivals that kids are loving. From trendy games to classic favorites.",
    buttonText: "See New Toys",
    buttonLink: "/new-arrivals",
    badge: "✨ Just Arrived",
    badgeColor: "bg-purple-100 text-purple-800",
    imageSrc: "slide-1.svg",
    imageAlt: "New arrivals toys"
  }
]

export function HeroCarousel() {
  const [api, setApi] = React.useState<CarouselApi>()
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!api) return

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        api.scrollNext()
      }, 5000)
    }

    const stopAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current)
      }
    }

    startAutoScroll()

    const carousel = api.containerNode()
    carousel.addEventListener('mouseenter', stopAutoScroll)
    carousel.addEventListener('mouseleave', startAutoScroll)
    carousel.addEventListener('touchstart', stopAutoScroll)

    return () => {
      stopAutoScroll()
      carousel.removeEventListener('mouseenter', stopAutoScroll)
      carousel.removeEventListener('mouseleave', startAutoScroll)
      carousel.removeEventListener('touchstart', stopAutoScroll)
    }
  }, [api])

  return (
    <section className="relative overflow-hidden bg-gray-50">
      <Carousel 
        className="w-full" 
        opts={{ align: "start", loop: true }}
        setApi={setApi}
      >
        <CarouselContent>
          {heroSlides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="relative py-6 md:py-8 overflow-hidden min-h-[240px] md:min-h-[300px]">
                {/* Background image (replaces gradient) */}
                <div className="absolute inset-0 -z-10">
                  <Image
                    src={slide.imageSrc}
                    alt={slide.imageAlt}
                    fill
                    sizes="100vw"
                    priority={slide.id === 1}
                    className="object-cover"
                  />
                </div>

                {/* Overlay for text readability */}
                <div className="absolute inset-0 -z-10 bg-black/30" />

                {/* Optional subtle pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div
                    className="w-full h-full bg-repeat"
                  />
                </div>

                <div className="container mx-auto max-w-7xl px-4 relative z-10">
                  <div className="grid gap-6 items-center min-h-[160px]">
                    {/* Content */}
                    <div className="text-center lg:text-left text-white">
                      <Badge className={`mb-6 ${slide.badgeColor} border-0 text-sm font-medium px-4 py-2`}>
                        {slide.badge}
                      </Badge>
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                        {slide.title}
                      </h1>
                      <h2 className="text-xl md:text-2xl font-semibold mb-4 opacity-90">
                        {slide.subtitle}
                      </h2>
                      <p className="text-base md:text-lg mb-6 leading-relaxed opacity-90 max-w-2xl">
                        {slide.description}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Link href={slide.buttonLink}>
                          <Button size="lg" variant="secondary" className="px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                            Buy now
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Arrows - Hidden on mobile */}
        <CarouselPrevious className="hidden md:flex left-4 bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30" />
        <CarouselNext className="hidden md:flex right-4 bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30" />
        
        {/* Dots Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {heroSlides.map((_, index) => (
            <div key={index} className="w-3 h-3 rounded-full bg-white/40 backdrop-blur-sm border border-white/30"></div>
          ))}
        </div>
      </Carousel>
    </section>
  )
}
