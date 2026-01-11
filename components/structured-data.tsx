import { Product, ProductVariant, MediaItem } from '@/lib/schema'

interface BreadcrumbItem {
  name: string
  item: string
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function CollectionPageStructuredData({ name, description, url }: { name: string, description: string, url: string }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": name,
    "description": description,
    "url": url
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}



interface ProductStructuredDataProps {
  product: Product
  variants?: ProductVariant[]
}

// Helper function to extract image URLs from media items
function extractImageUrls(mediaItems: (string | MediaItem)[] | null | undefined): string[] | undefined {
  if (!mediaItems || mediaItems.length === 0) return undefined

  return mediaItems
    .map(item => typeof item === 'string' ? item : item.url)
    .filter(url => url) // Remove any undefined/null values
}

export function ProductStructuredData({ product, variants = [] }: ProductStructuredDataProps) {
  // Find the minimum price variant
  const minPriceVariant = variants.reduce((min, v) => {
    const price = parseFloat(v.price)
    const minPrice = parseFloat(min.price)
    return price < minPrice ? v : min
  }, variants[0])

  const price = minPriceVariant ? minPriceVariant.price : '0'
  const compareAtPrice = minPriceVariant?.compareAtPrice

  const baseOffers = {
    "@type": "Offer",
    "url": `https://kidstoysbangladesh.com/product/${product.handle}`,
    "priceCurrency": "BDT",
    "price": price,
    "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "KidsToysBangladesh"
    }
  }

  const offers = compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price)
    ? { ...baseOffers, "highPrice": compareAtPrice, "lowPrice": price }
    : baseOffers

  // Extract image URLs for structured data
  const imageUrls = extractImageUrls(product.images)

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description || `High quality ${product.title} for children`,
    "image": imageUrls,
    "sku": product.handle,
    "brand": {
      "@type": "Brand",
      "name": "KidsToysBangladesh"
    },
    "offers": offers,
    "category": "Toys & Games",
    "audience": {
      "@type": "PeopleAudience",
      "suggestedMinAge": 0,
      "suggestedMaxAge": 12
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "KidsToysBangladesh",
    "url": "https://kidstoysbangladesh.com",
    "logo": "https://kidstoysbangladesh.com/logo.png",
    "sameAs": [
      "https://facebook.com/kidstoysbangladesh",
      "https://instagram.com/kidstoysbangladesh"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+8801337411948",
      "contactType": "customer service",
      "availableLanguage": ["Bengali", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "BD",
      "addressRegion": "Dhaka"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function WebsiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KidsToysBangladesh",
    "url": "https://kidstoysbangladesh.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://kidstoysbangladesh.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}