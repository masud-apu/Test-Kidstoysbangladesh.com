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
    // title: "The Big Toy Sale Is On!",
    // subtitle: "Unbeatable Prices, Unforgettable Fun.",
    // description: "Don't miss out! Find the perfect toys to spark their imagination and create lasting memories.",
    buttonText: "Shop Sale Now",
    buttonLink: "#sale",
    badge: "🎉 Limited Time",
    badgeColor: "bg-red-100 text-red-800",
    imageSrc: "https://res.cloudinary.com/dcuwepyuz/image/upload/v1757967345/Untitled_2048_x_850_px_2880_x_800_px_rs63ae.svg",
    imageAlt: "Kids toys new year sale"
  },
  {
    id: 2,
    // title: "Educational Toys Collection",
    // subtitle: "Learn Through Play",
    // description: "Premium educational toys designed to boost creativity, problem-solving skills and cognitive development.",
    buttonText: "Explore Learning",
    buttonLink: "/#educational-toys",
    badge: "🧠 Smart Play",
    badgeColor: "bg-teal-100 text-teal-800",
    imageSrc: "https://res.cloudinary.com/dcuwepyuz/image/upload/v1757205090/silde-3_lhh1jv.svg",
    imageAlt: "Educational toys collection"
  },
  {
    id: 3,
    // title: "This Week's Hottest Drops",
    // subtitle: "Get Them Before They're Gone.",
    // description: "Meet the new must-haves! We've just dropped the toys everyone's talking about, from viral trends to timeless treasures.",
    // buttonText: "See New Toys",
    buttonLink: "/#new-arrivals",
    badge: "✨ Just Arrived",
    badgeColor: "bg-purple-100 text-purple-800",
    imageSrc: "https://res.cloudinary.com/dcuwepyuz/image/upload/v1757972298/Untitled_2048_x_850_px_2880_x_800_px_2880_x_670_px_ppglte.svg",
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
      }, 8000)
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
              <div className="relative z-0 py-6 md:py-8 overflow-hidden min-h-[240px] md:min-h-[300px]">
                {/* Background image */}
                <div className="absolute inset-0 z-0">
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
                <div className="absolute inset-0 z-0 bg-black/0" />

                {/* Optional subtle pattern */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                  <div className="w-full h-full bg-repeat" />
                </div>

                <div className="container mx-auto max-w-7xl px-4 relative z-10">
                  <div className="grid gap-6 items-center min-h-[160px]">
                    {/* Content */}
                    <div className="text-center text-gray-700 flex flex-col justify-between h-full min-h-[200px] md:min-h-[250px]">
                      {/* Badge at the top center */}
                      <div className="flex justify-center">
                        <Badge className={`${slide.badgeColor} border-0 text-sm font-medium px-4 py-2`}>
                          {slide.badge}
                        </Badge>
                      </div>
                      
                      {/* Spacer to push button to bottom */}
                      <div className="flex-grow"></div>
                      
                      {/* Button at the bottom center */}
                      <div className="flex justify-center">
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
