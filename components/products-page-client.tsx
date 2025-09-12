'use client'

import { useEffect } from 'react'
import { fbPixelEvents } from '@/lib/facebook-pixel-events'
import { Analytics } from '@/lib/analytics'

interface ProductsPageClientProps {
  productCount: number
  category?: string
}

export function ProductsPageClient({ productCount, category = 'All Products' }: ProductsPageClientProps) {
  useEffect(() => {
    // Track Facebook Pixel custom event for category/collection view
    fbPixelEvents.customEvent('ViewCategory', {
      content_category: category,
      content_type: 'product_group',
      num_items: productCount
    })
    
    // Track PostHog Analytics
    Analytics.trackCategoryView(category, productCount)
  }, [category, productCount])

  return null
}