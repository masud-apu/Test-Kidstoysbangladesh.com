import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ProductPageClient } from '@/components/product-page-client'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function generateStaticParams() {
  const allProducts = await db.select({ handle: products.handle }).from(products)
  
  return allProducts.map((product) => ({
    slug: product.handle,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await db.select().from(products).where(eq(products.handle, slug)).limit(1)
  
  if (!product.length) {
    return {
      title: 'Product Not Found',
    }
  }

  const prod = product[0]
  const productUrl = `https://kidstoysbangladesh.com/product/${prod.handle}`
  const imageUrl = prod.images && prod.images.length > 0 
    ? prod.images[0] 
    : 'https://kidstoysbangladesh.com/og-image.jpg'

  return {
    title: prod.name,
    description: prod.description 
      ? prod.description.substring(0, 160) + (prod.description.length > 160 ? '...' : '')
      : `Buy ${prod.name} at best price in Bangladesh. High quality kids toy with fast delivery and cash on delivery available.`,
    keywords: [
      prod.name,
      'kids toy',
      'children toy',
      'toy Bangladesh',
      'buy online',
      ...(prod.tags || [])
    ],
    openGraph: {
      title: prod.name,
      description: prod.description || `Buy ${prod.name} at best price in Bangladesh`,
      url: productUrl,
      siteName: 'KidsToysBangladesh',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: prod.name,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: prod.name,
      description: prod.description || `Buy ${prod.name} at best price in Bangladesh`,
      images: [imageUrl],
    },
    alternates: {
      canonical: productUrl,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await db.select().from(products).where(eq(products.handle, slug)).limit(1)
  
  if (!product.length) {
    notFound()
  }

  return <ProductPageClient product={product[0]} />
}