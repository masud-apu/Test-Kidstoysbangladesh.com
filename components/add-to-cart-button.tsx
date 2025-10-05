'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCartStore, SelectedOption } from '@/lib/store'
import { Product, ProductVariant } from '@/lib/schema'
import { ShoppingCart, Check } from 'lucide-react'
import { fbPixelEvents } from '@/lib/facebook-pixel-events'
import { Analytics } from '@/lib/analytics'

interface AddToCartButtonProps {
  product: Product
  variant?: ProductVariant
  selectedOptions?: SelectedOption[]
  className?: string
}

export function AddToCartButton({ product, variant, selectedOptions, className }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false)
  const addToCart = useCartStore((state) => state.addToCart)

  const handleAddToCart = () => {
    const price = variant ? parseFloat(variant.price) : 0
    const comparePrice = variant?.compareAtPrice ? parseFloat(variant.compareAtPrice) : undefined

    // Track Facebook Pixel AddToCart event
    fbPixelEvents.addToCart({
      content_name: product.title,
      content_ids: [product.id.toString()],
      content_type: 'product',
      value: price,
      currency: 'BDT',
      content_category: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags[0] : undefined
    })

    // Track PostHog Analytics
    Analytics.trackAddToCart({
      product_id: product.id.toString(),
      product_name: product.title,
      price: price,
      compare_price: comparePrice,
      tags: Array.isArray(product.tags) ? product.tags : [],
      quantity: 1,
      variant_id: variant?.id.toString(),
      variant_title: variant?.title,
      variant_price: price
    })

    addToCart(product, variant, selectedOptions)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <Button
      onClick={handleAddToCart}
      className={className}
      size="lg"
      disabled={isAdded}
    >
      {isAdded ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </>
      )}
    </Button>
  )
}