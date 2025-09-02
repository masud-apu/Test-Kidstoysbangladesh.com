import { Product } from '@/lib/schema'

interface ProductStructuredDataProps {
  product: Product
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const baseOffers = {
    "@type": "Offer",
    "url": `https://kidstoysbangladesh.com/product/${product.handle}`,
    "priceCurrency": "BDT",
    "price": product.price,
    "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "KidsToysBangladesh"
    }
  }

  const offers = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)
    ? { ...baseOffers, "highPrice": product.comparePrice, "lowPrice": product.price }
    : baseOffers

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `High quality ${product.name} for children`,
    "image": product.images && product.images.length > 0 ? product.images : undefined,
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
      "telephone": "+8801718007639",
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