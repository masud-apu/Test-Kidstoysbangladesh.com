import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  Star
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductsPageClient } from '@/components/products-page-client'
import { CollectionPageStructuredData, BreadcrumbStructuredData } from '@/components/structured-data'
import { Metadata } from 'next'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const params = await searchParams
  const query = typeof params?.search === 'string' ? params.search : undefined

  const title = query ? `Search Results for "${query}" | KidsToysBangladesh` : 'All Products | KidsToysBangladesh'
  const description = query
    ? `Shop for ${query} at KidsToysBangladesh. Best collection of kids toys in Bangladesh.`
    : 'Browse our complete collection of kids toys. Find educational, vehicles, building blocks and more at the best prices in Bangladesh.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://kidstoysbangladesh.com/products',
    },
    alternates: {
      canonical: 'https://kidstoysbangladesh.com/products',
    }
  }
}

export default async function ProductsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'}/api/products?limit=100`, {
    next: { revalidate: 300 }
  })

  if (!response.ok) {
    console.error('Failed to fetch products')
  }

  const data = response.ok ? await response.json() : { products: [] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsWithVariants: any[] = data.products || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allProducts: any[] = [...productsWithVariants].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const searchQuery = typeof searchParams?.search === 'string' ? searchParams.search : undefined
  const minPrice = typeof searchParams?.min_price === 'string' ? parseFloat(searchParams.min_price) : undefined
  const maxPrice = typeof searchParams?.max_price === 'string' ? parseFloat(searchParams.max_price) : undefined
  const ageMinParam = typeof searchParams?.age_min === 'string' ? parseInt(searchParams.age_min) : undefined
  const ageMaxParam = typeof searchParams?.age_max === 'string' ? parseInt(searchParams.age_max) : undefined

  // 1. Text Search Filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    allProducts = allProducts.filter((product) =>
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    )
  }

  // 2. Price Range Filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    allProducts = allProducts.filter((product) => {
      if (!Array.isArray(product.variants) || product.variants.length === 0) return false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return product.variants.some((v: any) => {
        const price = parseFloat(v.price)
        if (isNaN(price)) return false
        const passesMin = minPrice === undefined || price >= minPrice
        const passesMax = maxPrice === undefined || price <= maxPrice
        return passesMin && passesMax
      })
    })
  }

  // 3. Age Range Filter (Months)
  if (ageMinParam !== undefined || ageMaxParam !== undefined) {
    const filterMin = ageMinParam ?? 0
    const filterMax = ageMaxParam ?? 1200

    allProducts = allProducts.filter((product) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tags = Array.isArray(product.tags) ? product.tags.map((t: any) => String(t).toLowerCase().trim()) : []
      let productMatches = false
      let hasAgeTags = false

      for (const tag of tags) {
        let min = -1
        let max = -1
        const monthRangeMatch = tag.match(/^(\d+)-(\d+)\s*m(onths?)?$/)
        if (monthRangeMatch) {
          min = parseInt(monthRangeMatch[1])
          max = parseInt(monthRangeMatch[2])
          hasAgeTags = true
        }
        const yearRangeMatch = tag.match(/^(\d+)-(\d+)\s*y(ears?)?$/)
        if (yearRangeMatch) {
          min = parseInt(yearRangeMatch[1]) * 12
          max = parseInt(yearRangeMatch[2]) * 12
          hasAgeTags = true
        }
        const yearPlusMatch = tag.match(/^(\d+)\+?\s*y(ears?)?(\s*\+)?$/)
        if (yearPlusMatch) {
          min = parseInt(yearPlusMatch[1]) * 12
          max = 1200
          hasAgeTags = true
        }
        const monthPlusMatch = tag.match(/^(\d+)\s*m(onths?)?(\s*\+)?$/)
        if (monthPlusMatch && !tag.includes('-')) {
          min = parseInt(monthPlusMatch[1])
          max = 1200
          hasAgeTags = true
        }
        if (min !== -1 && max !== -1) {
          if (min <= filterMax && max >= filterMin) {
            productMatches = true
            break
          }
        }
      }
      if (!productMatches && !hasAgeTags) {
        if (filterMax <= 12) {
          if (tags.includes('baby') || tags.includes('infant') || tags.includes('newborn')) productMatches = true
        }
        if (filterMin >= 12 && filterMax <= 36) {
          if (tags.includes('toddler')) productMatches = true
        }
      }
      return productMatches
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CollectionPageStructuredData
        name={searchQuery ? `Search Results for "${searchQuery}"` : "All Products"}
        description={searchQuery ? `Search results for ${searchQuery}` : "Browse our complete collection of kids toys."}
        url={`https://kidstoysbangladesh.com/products${searchQuery ? `?search=${searchQuery}` : ''}`}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', item: 'https://kidstoysbangladesh.com' },
          { name: 'Products', item: 'https://kidstoysbangladesh.com/products' }
        ]}
      />
      <ProductsPageClient productCount={allProducts.length} category={searchQuery ? `Search: ${searchQuery}` : "All Products"} />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <span>Home</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">All Products</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-gray-600">
            {searchQuery
              ? `Found ${allProducts.length} results`
              : 'Discover our complete collection of amazing toys'}
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>

                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="puzzles">Puzzles</SelectItem>
                    <SelectItem value="baby">Blogs</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-12">6-12 years</SelectItem>
                    <SelectItem value="13+">13+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <Select defaultValue="newest">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Best Rating</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {allProducts.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {allProducts.length} products
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <SlidersHorizontal className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">No products found</h3>
            <p className="text-gray-600 mb-8">Try adjusting your filters or search terms</p>
            <Button>Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  )
}
