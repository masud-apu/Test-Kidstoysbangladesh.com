import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ProductPageClient } from '@/components/product-page-client'
import { MediaItem } from '@/lib/schema'
import { Suspense } from 'react'
import { RecommendedProductsSection } from '@/components/recommended-products-section'
import { RecommendedProductsSkeleton } from '@/components/recommended-products-skeleton'

// Helper function to get URL from media item
function getMediaUrl(item: string | MediaItem): string {
  return typeof item === 'string' ? item : item.url
}

// Disabled during build to prevent connection errors on Vercel
// Products will be generated dynamically on-demand
// export async function generateStaticParams() {
//   // Fetch all product handles from admin API for static generation
//   const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'}/api/products?limit=100`, {
//     next: { revalidate: 3600 } // 1 hour cache
//   })

//   if (!response.ok) {
//     return []
//   }

//   const data = await response.json()
//   const allProducts = data.products || []

//   return allProducts.map((product: { handle: string }) => ({
//     slug: product.handle,
//   }))
// }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  // Fetch product from admin API
  const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'}/api/products/${slug}`, {
    next: { revalidate: 300 } // 5 minutes cache
  })

  if (!response.ok) {
    return {
      title: 'Product Not Found',
    }
  }

  const data = await response.json()
  const prod = data.product
  const productUrl = `https://kidstoysbangladesh.com/product/${prod.handle}`
  const imageUrl = prod.images && prod.images.length > 0
    ? getMediaUrl(prod.images[0])
    : 'https://kidstoysbangladesh.com/og-image.png'

  return {
    title: prod.title,
    description: prod.description
      ? prod.description.substring(0, 160) + (prod.description.length > 160 ? '...' : '')
      : `Buy ${prod.title} at best price in Bangladesh. High quality kids toy with fast delivery and cash on delivery available.`,
    keywords: [
      prod.title,
      'kids toy',
      'children toy',
      'toy Bangladesh',
      'buy online',
      ...((Array.isArray(prod.tags) ? prod.tags : []) as string[])
    ],
    openGraph: {
      title: prod.title,
      description: prod.description || `Buy ${prod.title} at best price in Bangladesh`,
      url: productUrl,
      siteName: 'KidsToysBangladesh',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: prod.title,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: prod.title,
      description: prod.description || `Buy ${prod.title} at best price in Bangladesh`,
      images: [imageUrl],
    },
    alternates: {
      canonical: productUrl,
    },
  }
}

import { ProductStructuredData, BreadcrumbStructuredData } from '@/components/structured-data'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Fetch product with all related data from admin API
  const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'}/api/products/${slug}`, {
    next: { revalidate: 300 } // 5 minutes cache
  })

  if (!response.ok) {
    notFound()
  }

  const data = await response.json()
  const { product, variants, options } = data

  const breadcrumbItems = [
    { name: 'Home', item: 'https://kidstoysbangladesh.com' },
    { name: 'Products', item: 'https://kidstoysbangladesh.com/products' },
    { name: product.title, item: `https://kidstoysbangladesh.com/product/${product.handle}` }
  ]

  return (
    <>
      <ProductStructuredData product={product} variants={variants} />
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <ProductPageClient
        product={product}
        variants={variants}
        options={options}
        recommendedProductsSlot={
          <Suspense fallback={<RecommendedProductsSkeleton />}>
            <RecommendedProductsSection />
          </Suspense>
        }
      />
    </>
  )
}