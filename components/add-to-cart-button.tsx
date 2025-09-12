'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { Product } from '@/lib/schema'
import { ShoppingCart, Check } from 'lucide-react'
import { fbPixelEvents } from '@/lib/facebook-pixel-events'
import { Analytics } from '@/lib/analytics'

interface AddToCartButtonProps {
  product: Product
  className?: string
}

export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false)
  const addToCart = useCartStore((state) => state.addToCart)

  const handleAddToCart = () => {
    // Track Facebook Pixel AddToCart event
    fbPixelEvents.addToCart({
      content_name: product.name,
      content_ids: [product.id.toString()],
      content_type: 'product',
      value: parseFloat(product.price),
      currency: 'BDT',
      content_category: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags[0] : undefined
    })
    
    // Track PostHog Analytics
    Analytics.trackAddToCart({
      product_id: product.id.toString(),
      product_name: product.name,
      price: parseFloat(product.price),
      compare_price: product.comparePrice ? parseFloat(product.comparePrice) : undefined,
      tags: Array.isArray(product.tags) ? product.tags : [],
      quantity: 1
    })
    
    addToCart(product)
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