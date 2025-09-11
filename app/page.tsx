import { ProductCard } from '@/components/product-card'
import { HeroCarousel } from '@/components/hero-carousel'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
// import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Truck,
  Banknote,
  Headset,
  ShieldCheck,
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
  // Fetch products then sort by latest in JS to avoid DB-specific orderBy typing issues
  const fetched = await db.select().from(products).limit(100)
  const allProducts = [...fetched]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
  const saleProducts = allProducts.filter((p) => {
    const price = parseFloat(String(p.price))
    const compare = p.comparePrice ? parseFloat(String(p.comparePrice)) : 0
    return compare > price
  })
  // Always keep 5 items in the Sale list by filling with non-sale items if needed
  const saleList = (() => {
    const ids = new Set(saleProducts.map((p) => p.id))
    const filler = allProducts.filter((p) => !ids.has(p.id))
    return [...saleProducts, ...filler].slice(0, 5)
  })()
  
  // Educational Toys: pick up to 10 items marked by tags or name
  // We fetch a larger recent set then filter in JS to avoid DB-specific JSON queries
  const educationalCandidates = await db
    .select()
    .from(products)
    .limit(100)
  const educationalProducts = educationalCandidates
    .filter((p) => {
      const tagsArr = Array.isArray(p.tags) ? p.tags : []
      const name = (p.name || '').toLowerCase()
      const tagMatch = tagsArr.some((t) => String(t).toLowerCase().includes('educational') || String(t).toLowerCase().includes('learning'))
      return tagMatch || name.includes('educational') || name.includes('learning')
    })
    .slice(0, 10)
  
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Carousel Section */}
      <HeroCarousel />

        

  {/* New Arrivals Section */}
  <section id="new-arrivals" className="py-5 bg-white scroll-mt-24">
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
        <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/2 lg:basis-1/3 xl:basis-1/5">
                  <div className="h-full">
                    <ProductCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>

          {/* Mobile anchor to all products */}
          <div className="md:hidden mt-8 text-center">
            <Link href="#all-products">
              <Button className="px-8 h-12 text-base font-semibold">
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
              {saleList.map((product) => (
                <CarouselItem key={`sale-${product.id}`} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/2 lg:basis-1/3 xl:basis-1/5">
                  <div className="h-full relative">
                    <ProductCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>

          {/* Mobile anchor to all products */}
          <div className="md:hidden mt-8 text-center">
            <Link href="#all-products">
              <Button className="px-8 h-12 text-base font-semibold">
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
              <Button className="h-12 text-base font-semibold">Add Products</Button>
            </div>
          )}
        </div>
      </section>

      {/* Educational Toys Collection Section */}
      <section id="educational-toys" className="py-20 bg-gradient-to-br from-teal-50 to-emerald-50 scroll-mt-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <Badge className="mb-4 bg-teal-100 text-teal-800 border-teal-200">🧠 Educational</Badge>
              <h2 className="text-4xl font-bold tracking-tight text-gray-800">Educational Toys Collection</h2>
              <p className="text-gray-600 mt-2">Learn through play with our curated learning toys</p>
            </div>
          </div>

          {educationalProducts.length > 0 ? (
            <Carousel className="w-full" opts={{ align: "start", slidesToScroll: 1 }}>
              <CarouselContent className="-ml-2 md:-ml-4">
                {educationalProducts.map((product) => (
                  <CarouselItem key={`edu-${product.id}`} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/2 lg:basis-1/3 xl:basis-1/5">
                    <div className="h-full relative">
                      <ProductCard product={product} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">No educational toys yet</h3>
              <p className="text-gray-600">Tag products with “educational” or “learning” to feature them here.</p>
            </div>
          )}
        </div>
      </section>

      {/* Integrated Features Section */}
    <div className="relative mt-2 md:mt-4 z-10">
          <div className="container mx-auto max-w-7xl px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {[
                {
                  icon: Truck,
                  title: "Fast & Reliable Delivery",
                  description: "24–48 hour delivery within Dhaka city.",
                  color: "teal"
                },
                {
                  icon: Banknote,
                  title: "Easy Cash on Delivery",
                  description: "No advance payment needed. Pay upon delivery.",
                  color: "blue"
                },
                {
                  icon: Headset,
                  title: "Friendly Support",
                  description: "Have a question? Our friendly team is here to help.",
                  color: "orange"
                },
                {
                  icon: ShieldCheck,
                  title: "Authentic & Child‑Safe",
                  description: "Every toy is quality-checked for your child’s safety.",
                  color: "green"
                }
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="rounded-xl bg-white/90 backdrop-blur border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <CardContent className="p-2.5 md:p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center ring-1 ring-black/5 ${
                          feature.color === 'teal' ? 'bg-teal-50' :
                          feature.color === 'blue' ? 'bg-blue-50' :
                          feature.color === 'orange' ? 'bg-orange-50' :
                          'bg-green-50'
                        }`}
                      >
                        <feature.icon
                          className={`h-5 w-5 ${
                            feature.color === 'teal' ? 'text-teal-600' :
                            feature.color === 'blue' ? 'text-blue-600' :
                            feature.color === 'orange' ? 'text-orange-600' :
                            'text-green-600'
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[13px] md:text-sm leading-tight text-gray-900 truncate">{feature.title}</h3>
                        <p className="text-gray-600 text-[10px] md:text-xs leading-snug hidden sm:block">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

  {/* Footer appears globally via ConditionalLayout */}
    </div>
  )
}
