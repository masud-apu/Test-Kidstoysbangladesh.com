import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ProductPageClient } from '@/components/product-page-client'
import { db } from '@/lib/db'
import { products, productVariants, productOptions, productOptionValues, variantSelectedOptions } from '@/lib/schema'
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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [product] = await db.select().from(products).where(eq(products.handle, slug)).limit(1)

  if (!product) {
    notFound()
  }

  // Fetch variants
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id))
    .orderBy(productVariants.position)

  // Fetch options
  const options = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, product.id))
    .orderBy(productOptions.position)

  // Fetch option values for each option (including images)
  const optionsWithValues = await Promise.all(
    options.map(async (option) => {
      const values = await db
        .select({
          id: productOptionValues.id,
          optionId: productOptionValues.optionId,
          value: productOptionValues.value,
          image: productOptionValues.image,
          position: productOptionValues.position,
          createdAt: productOptionValues.createdAt,
        })
        .from(productOptionValues)
        .where(eq(productOptionValues.optionId, option.id))
        .orderBy(productOptionValues.position)

      return { ...option, values }
    })
  )

  // Fetch selected options for each variant
  const variantsWithOptions = await Promise.all(
    variants.map(async (variant) => {
      const selectedOpts = await db
        .select({
          id: variantSelectedOptions.id,
          variantId: variantSelectedOptions.variantId,
          optionId: variantSelectedOptions.optionId,
          optionValueId: variantSelectedOptions.optionValueId,
          optionName: productOptions.name,
          valueName: productOptionValues.value,
        })
        .from(variantSelectedOptions)
        .innerJoin(productOptions, eq(variantSelectedOptions.optionId, productOptions.id))
        .innerJoin(productOptionValues, eq(variantSelectedOptions.optionValueId, productOptionValues.id))
        .where(eq(variantSelectedOptions.variantId, variant.id))

      return {
        ...variant,
        selectedOptions: selectedOpts.map(opt => ({
          optionName: opt.optionName,
          valueName: opt.valueName,
        })),
      }
    })
  )

  return (
    <ProductPageClient
      product={product}
      variants={variantsWithOptions}
      options={optionsWithValues}
    />
  )
}