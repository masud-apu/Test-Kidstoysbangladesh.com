'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight,
  Gamepad2,
  Baby,
  Car,
  Puzzle,
} from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel"

const heroSlides = [
  {
    id: 1,
    title: "New Year Special Sale",
    subtitle: "Up to 50% Off",
    description: "Discover amazing toys that spark imagination and create lasting memories for your little ones.",
    buttonText: "Shop Sale Now",
    buttonLink: "/sale",
    bgGradient: "from-orange-400 via-red-400 to-pink-400",
    badge: "🎉 Limited Time",
    badgeColor: "bg-red-100 text-red-800"
  },
  {
    id: 2,
    title: "Educational Toys Collection",
    subtitle: "Learn Through Play",
    description: "Premium educational toys designed to boost creativity, problem-solving skills and cognitive development.",
    buttonText: "Explore Learning",
    buttonLink: "/educational",
    bgGradient: "from-teal-400 via-green-400 to-blue-400",
    badge: "🧠 Smart Play",
    badgeColor: "bg-teal-100 text-teal-800"
  },
  {
    id: 3,
    title: "New Arrivals This Week",
    subtitle: "Fresh & Exciting",
    description: "Check out the latest toy arrivals that kids are loving. From trendy games to classic favorites.",
    buttonText: "See New Toys",
    buttonLink: "/new-arrivals",
    bgGradient: "from-purple-400 via-blue-400 to-cyan-400",
    badge: "✨ Just Arrived",
    badgeColor: "bg-purple-100 text-purple-800"
  }
]

export function HeroCarousel() {
  const [api, setApi] = React.useState<CarouselApi>()
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!api) return

    // Auto-scroll function
    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        api.scrollNext()
      }, 5000)
    }

    // Stop auto-scroll on user interaction
    const stopAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current)
      }
    }

    // Start auto-scroll
    startAutoScroll()

    // Add event listeners for user interactions
    const carousel = api.containerNode()
    carousel.addEventListener('mouseenter', stopAutoScroll)
    carousel.addEventListener('mouseleave', startAutoScroll)
    carousel.addEventListener('touchstart', stopAutoScroll)

    // Cleanup
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
              <div className={`relative bg-gradient-to-br ${slide.bgGradient} py-12 md:py-16 overflow-hidden min-h-[400px] md:min-h-[480px]`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full bg-repeat" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                </div>
                
                <div className="container mx-auto max-w-7xl px-4 relative z-10">
                  <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[320px]">
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
                    
                    {/* Modern Visual Element */}
                    <div className="hidden lg:block relative">
                      <div className="relative">
                        {/* Floating Background Elements */}
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                        <div className="absolute top-1/2 -left-6 w-16 h-16 bg-white/15 rounded-full blur-lg animate-pulse delay-1000"></div>
                        <div className="absolute bottom-8 right-1/4 w-12 h-12 bg-white/20 rounded-full blur-md animate-pulse delay-500"></div>
                        
                        {/* Main Container */}
                        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                          {/* Header */}
                          <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              <span className="text-white/90 text-xs font-medium">Popular Categories</span>
                            </div>
                          </div>
                          
                          {/* Modern Grid Layout */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Gaming */}
                            <div className="group relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                              <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:rotate-1">
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
                                    <Gamepad2 className="h-5 w-5 text-white" />
                                  </div>
                                  <span className="text-white/80 text-xs font-medium">Gaming</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Vehicles */}
                            <div className="group relative mt-4">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                              <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:-rotate-1">
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                                    <Car className="h-5 w-5 text-white" />
                                  </div>
                                  <span className="text-white/80 text-xs font-medium">Vehicles</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Baby Toys */}
                            <div className="group relative -mt-2">
                              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                              <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:rotate-2">
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg">
                                    <Baby className="h-5 w-5 text-white" />
                                  </div>
                                  <span className="text-white/80 text-xs font-medium">Baby</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Puzzles */}
                            <div className="group relative mt-2">
                              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                              <div className="relative bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:-rotate-2">
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl flex items-center justify-center shadow-lg">
                                    <Puzzle className="h-5 w-5 text-white" />
                                  </div>
                                  <span className="text-white/80 text-xs font-medium">Puzzles</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Bottom Accent */}
                          <div className="mt-4 flex justify-center">
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse delay-200"></div>
                              <div className="w-1 h-1 bg-white/40 rounded-full animate-pulse delay-400"></div>
                            </div>
                          </div>
                        </div>
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
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {heroSlides.map((_, index) => (
            <div key={index} className="w-3 h-3 rounded-full bg-white/40 backdrop-blur-sm border border-white/30"></div>
          ))}
        </div>
      </Carousel>
    </section>
  )
}
