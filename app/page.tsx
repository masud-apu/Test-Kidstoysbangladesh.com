import { ProductCard } from '@/components/product-card'
import { FilteredProductSection } from '@/components/filtered-product-section'
import { FeaturesMarquee } from '@/components/features-marquee'


import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight
} from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { MediaItem } from '@/lib/schema'


// Revalidate homepage every 5 minutes to keep it fresh while serving static
export const revalidate = 300

export default async function Home() {
  // Fetch products from admin API backend
  // The /api/products route is proxied to admin backend via Next.js rewrites
  const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'}/api/products?limit=60`, {
    next: { revalidate: 300 } // 5 minutes cache
  })

  // Fetch and store products - using basic typing to avoid complex type matching
  let productsWithVariants: unknown[] = []

  if (response.ok) {
    const data = await response.json()
    productsWithVariants = data.products || []
  } else {
    console.error('Failed to fetch products:', response.statusText)
  }

  // Cast to typed products for sorting and filtering
  interface SimpleProduct {
    id: number
    title: string
    createdAt: Date | string
    variants: Array<{
      price: string
      compareAtPrice?: string | null
    }>
    tags?: unknown[]
  }

  const typedProducts = productsWithVariants as SimpleProduct[]

  const allProductsTyped = [...typedProducts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
  const saleProductsTyped = allProductsTyped.filter((p) => {
    // Check if any variant has a discount
    return p.variants.some(v => {
      const price = parseFloat(v.price)
      const compare = v.compareAtPrice ? parseFloat(v.compareAtPrice) : 0
      return compare > price
    })
  })
  // Always keep 5 items in the Sale list by filling with non-sale items if needed
  const saleListTyped = (() => {
    const ids = new Set(saleProductsTyped.map((p) => p.id))
    const filler = allProductsTyped.filter((p) => !ids.has(p.id))
    return [...saleProductsTyped, ...filler].slice(0, 5)
  })()

  // Educational Toys: filter from already fetched products
  const educationalProductsTyped = typedProducts
    .filter((p) => {
      const tagsArr = Array.isArray(p.tags) ? p.tags : []
      const title = (p.title || '').toLowerCase()
      const tagMatch = tagsArr.some((t) => String(t).toLowerCase().includes('educational') || String(t).toLowerCase().includes('learning'))
      return tagMatch || title.includes('educational') || title.includes('learning')
    })
    .slice(0, 10)

  // Vehicles: filter from already fetched products
  const vehicleProductsTyped = typedProducts
    .filter((p) => {
      const tagsArr = Array.isArray(p.tags) ? p.tags : []
      const title = (p.title || '').toLowerCase()
      const keywords = ['vehicle', 'car', 'truck', 'bike', 'jeep']
      const tagMatch = tagsArr.some((t) =>
        keywords.some(keyword => String(t).toLowerCase().includes(keyword))
      )
      return tagMatch || keywords.some(keyword => title.includes(keyword))
    })
    .slice(0, 10)

  // Building Blocks: filter from already fetched products
  const buildingBlockProductsTyped = typedProducts
    .filter((p) => {
      const tagsArr = Array.isArray(p.tags) ? p.tags : []
      const title = (p.title || '').toLowerCase()
      const keywords = ['block', 'building', 'lego', 'construction', 'brick']
      const tagMatch = tagsArr.some((t) =>
        keywords.some(keyword => String(t).toLowerCase().includes(keyword))
      )
      return tagMatch || keywords.some(keyword => title.includes(keyword))
    })
    .slice(0, 10)

  // Cast to any for component props to avoid type checking issues
  // The API returns the correct structure, but matching exact types is complex
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProducts = allProductsTyped as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saleList = saleListTyped as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const educationalProducts = educationalProductsTyped as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vehicleProducts = vehicleProductsTyped as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildingBlockProducts = buildingBlockProductsTyped as any[]


  return (
    <div className="min-h-screen bg-white">
      {/* Integrated Features Section - Moved to Top */}
      {/* Integrated Features Section - Compact Design at Top */}
      {/* Integrated Features Section - Scrolling Marquee with Brand Colors */}
      <FeaturesMarquee />

      {/* Quick Filters - Modern Single Line Bar */}
      <div className="top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center gap-3 py-3 overflow-x-auto no-scrollbar">

            {/* Age Group */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">Age</span>
              {[
                { label: '0-6m', val: '0-6' },
                { label: '6m-1y', val: '6-12' },
                { label: '1y-2y', val: '12-24' },
                { label: '2y-3y', val: '24-36' },
                { label: '3y-4y', val: '36-48' },
                { label: '4y-5y', val: '48-60' },
              ].map((age) => (
                <Link
                  key={age.label}
                  href={`/products?age_min=${age.val.split('-')[0]}&age_max=${age.val.split('-')[1]}`}
                  className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 whitespace-nowrap transition-all hover:bg-brand-navy hover:text-white hover:border-brand-navy hover:shadow-md active:scale-95"
                >
                  {age.label}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 mx-2 shrink-0"></div>

            {/* Budget Group */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">Budget</span>
              {[
                { label: '< 300', min: 0, max: 300 },
                { label: '300-700', min: 300, max: 700 },
                { label: '700-1k', min: 700, max: 1000 },
                { label: '1k-2k', min: 1000, max: 2000 },
                { label: '2k-5k', min: 2000, max: 5000 },
                { label: '> 5k', min: 5000, max: 100000 }
              ].map((budget) => (
                <Link
                  key={budget.label}
                  href={`/products?min_price=${budget.min}&max_price=${budget.max}`}
                  className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 whitespace-nowrap transition-all hover:bg-brand-blue hover:text-white hover:border-brand-blue hover:shadow-md active:scale-95 shadow-sm"
                >
                  {budget.label}
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>





      {/* Sale Section */}
      <section id="sale" className="py-8 bg-white scroll-mt-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Badge className="mb-4 bg-brand-red/10 text-brand-red border-brand-red/20">🔥 Limited Time</Badge>
              <h2 className="text-4xl font-bold tracking-tight text-gray-800">
                Sale Items
                <span className="text-brand-red ml-3">Up to 55% Off</span>
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

      {/* Educational Toys Collection Section */}
      <section id="educational-toys" className="py-8 bg-white scroll-mt-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Badge className="mb-4 bg-brand-green/10 text-brand-green border-brand-green/20">🧠 Educational</Badge>
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

      {/* Vehicles Collection Section */}
      <section id="vehicles" className="py-8 bg-white scroll-mt-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Badge className="mb-4 bg-brand-blue/10 text-brand-blue border-brand-blue/20">🚗 Vehicles</Badge>
              <h2 className="text-4xl font-bold tracking-tight text-gray-800">Vehicles Collection</h2>
              <p className="text-gray-600 mt-2">Zoom into fun with our amazing collection of toy vehicles</p>
            </div>
          </div>

          {vehicleProducts.length > 0 ? (
            <Carousel className="w-full" opts={{ align: "start", slidesToScroll: 1 }}>
              <CarouselContent className="-ml-2 md:-ml-4">
                {vehicleProducts.map((product) => (
                  <CarouselItem key={`veh-${product.id}`} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/2 lg:basis-1/3 xl:basis-1/5">
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
              <h3 className="text-2xl font-bold mb-2 text-gray-900">No vehicle toys yet</h3>
              <p className="text-gray-600">Tag products with “vehicle”, “car”, or “truck” to feature them here.</p>
            </div>
          )}
        </div>
      </section>

      {/* Building Blocks Collection Section */}
      <section id="building-blocks" className="py-8 bg-white scroll-mt-24">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Badge className="mb-4 bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20">🧱 Building Blocks</Badge>
              <h2 className="text-4xl font-bold tracking-tight text-gray-800">Building Blocks Collection</h2>
              <p className="text-gray-600 mt-2">Construct your imagination with our building sets</p>
            </div>
          </div>

          {buildingBlockProducts.length > 0 ? (
            <Carousel className="w-full" opts={{ align: "start", slidesToScroll: 1 }}>
              <CarouselContent className="-ml-2 md:-ml-4">
                {buildingBlockProducts.map((product) => (
                  <CarouselItem key={`block-${product.id}`} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/2 lg:basis-1/3 xl:basis-1/5">
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
              <h3 className="text-2xl font-bold mb-2 text-gray-900">No building blocks yet</h3>
              <p className="text-gray-600">Tag products with “block”, “building”, or “lego” to feature them here.</p>
            </div>
          )}
        </div>
      </section>

      {/* All Products Section */}
      <FilteredProductSection products={allProducts} />



      {/* Footer appears globally via ConditionalLayout */}
    </div>
  )
}
