import { ProductCard } from '@/components/product-card'
import { HeroCarousel } from '@/components/hero-carousel'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Truck, 
  Shield, 
  Clock, 
  Star,
  Gift,
  ArrowRight
} from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default async function Home() {
  // Fetch up to 20 latest products for the landing page only
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt)).limit(20)
  const saleProducts = allProducts.filter((p) => {
    const price = parseFloat(String(p.price))
    const compare = p.comparePrice ? parseFloat(String(p.comparePrice)) : 0
    return compare > price
  })
  
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Carousel Section */}
      <HeroCarousel />

        {/* Integrated Features Section */}
        <div className="relative -mt-16 z-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                {
                  icon: Truck,
                  title: "Free Delivery",
                  description: "Free shipping on orders over ৳1500",
                  color: "teal"
                },
                {
                  icon: Shield,
                  title: "Safe & Secure",
                  description: "100% safe and tested toys",
                  color: "green"
                },
                {
                  icon: Clock,
                  title: "Quick Service",
                  description: "24/7 customer support",
                  color: "orange"
                },
                {
                  icon: Star,
                  title: "Quality Guaranteed",
                  description: "Premium quality assured",
                  color: "yellow"
                }
              ].map((feature, index) => (
                <Card key={index} className="bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full flex items-center justify-center ${
                      feature.color === 'teal' ? 'bg-teal-100' :
                      feature.color === 'green' ? 'bg-green-100' :
                      feature.color === 'orange' ? 'bg-orange-100' :
                      'bg-yellow-100'
                    }`}>
                      <feature.icon className={`h-6 w-6 md:h-8 md:w-8 ${
                        feature.color === 'teal' ? 'text-teal-600' :
                        feature.color === 'green' ? 'text-green-600' :
                        feature.color === 'orange' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`} />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg mb-1 md:mb-2 text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 text-xs md:text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

  {/* New Arrivals Section */}
  <section id="new-arrivals" className="py-20 bg-white scroll-mt-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <Badge className="mb-4 bg-teal-100 text-teal-800 border-teal-200">✨ Fresh & Latest</Badge>
              <h2 className="text-4xl font-bold tracking-tight text-gray-800">New Arrivals</h2>
              <p className="text-gray-600 mt-2">Discover the latest toys that kids are loving this week</p>
            </div>
          </div>

          <Carousel className="w-full" opts={{ align: "start", slidesToScroll: 1 }}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {allProducts.slice(0, 6).map((product) => (
                <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <div className="h-full">
                    <ProductCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-white shadow-lg border-gray-200 hover:bg-gray-50" />
            <CarouselNext className="hidden md:flex -right-12 bg-white shadow-lg border-gray-200 hover:bg-gray-50" />
          </Carousel>

          {/* Mobile anchor to all products */}
          <div className="md:hidden mt-8 text-center">
            <Link href="#all-products">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white px-8">
                Browse All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sale Section */}
      <section id="sale" className="py-20 bg-gradient-to-br from-orange-50 to-red-50 scroll-mt-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <Badge className="mb-4 bg-red-100 text-red-800 border-red-200">🔥 Limited Time</Badge>
              <h2 className="text-4xl font-bold tracking-tight text-gray-800">
                Sale Items
                <span className="text-red-600 ml-3">Up to 80% Off</span>
              </h2>
              <p className="text-gray-600 mt-2">Amazing deals on premium toys - grab them before they&apos;re gone!</p>
            </div>
          </div>

          <Carousel className="w-full" opts={{ align: "start", slidesToScroll: 1 }}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {(saleProducts.length ? saleProducts : allProducts).slice(0, 4).map((product) => (
                <CarouselItem key={`sale-${product.id}`} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <div className="h-full relative">
                    <ProductCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-white shadow-lg border-gray-200 hover:bg-gray-50" />
            <CarouselNext className="hidden md:flex -right-12 bg-white shadow-lg border-gray-200 hover:bg-gray-50" />
          </Carousel>

          {/* Mobile anchor to all products */}
          <div className="md:hidden mt-8 text-center">
            <Link href="#all-products">
              <Button className="bg-red-500 hover:bg-red-600 text-white px-8">
                Browse All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* All Products Section */}
      <section id="all-products" className="py-20 bg-white scroll-mt-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">⭐ All Products</Badge>
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">Browse Our Collection</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">Up to 20 latest items, right here on the homepage.</p>
          </div>
          
          {allProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Gift className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">No products found</h3>
              <p className="text-gray-600 mb-8">Add some products to your database to get started.</p>
              <Button className="bg-teal-500 hover:bg-teal-600 text-white">Add Products</Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-yellow-500">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-4">Stay Updated with Latest Toys</h2>
            <p className="text-xl opacity-90 mb-8">
              Get exclusive deals, new arrivals, and parenting tips delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 border-0 focus:ring-2 focus:ring-white/50"
              />
              <Button className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3 font-semibold">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
