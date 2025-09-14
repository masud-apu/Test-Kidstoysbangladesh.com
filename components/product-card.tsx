'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Product } from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { ShoppingCart } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import Link from 'next/link'
import { useOverlayStore } from '@/lib/ui-store'
import { Analytics } from '@/lib/analytics'
import { fbPixelEvents } from '@/lib/facebook-pixel-events'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart)
  const setDirectBuy = useCartStore((state) => state.setDirectBuy)
  const openCart = useOverlayStore((s) => s.openCart)
  const openCheckout = useOverlayStore((s) => s.openCheckout)
  const router = useRouter()
  
  const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.comparePrice!) - parseFloat(product.price)) / parseFloat(product.comparePrice!)) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
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
    openCart()
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Track Facebook Pixel AddToCart event for Buy Now
    fbPixelEvents.addToCart({
      content_name: product.name,
      content_ids: [product.id.toString()],
      content_type: 'product',
      value: parseFloat(product.price),
      currency: 'BDT',
      content_category: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags[0] : undefined
    })
    
    // Track PostHog Analytics
    Analytics.trackButtonClick('buy_now', 'product_card', {
      product_id: product.id,
      product_name: product.name,
      price: parseFloat(product.price)
    })
    
    setDirectBuy(product)
    openCheckout('direct')
  }

  const handleProductClick = () => {
    // Note: ViewContent tracking is handled on the product page itself
    // Track PostHog Analytics for click
    Analytics.trackProductView({
      product_id: product.id.toString(),
      product_name: product.name,
      price: parseFloat(product.price),
      compare_price: product.comparePrice ? parseFloat(product.comparePrice) : undefined,
      tags: Array.isArray(product.tags) ? product.tags : []
    })
  }

  return (
    <div className="block">
      <article
  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group border border-gray-100 overflow-hidden cursor-pointer"
        aria-label={`View product ${product.name}`}
      >
        <Link href={`/product/${product.handle}`} onClick={handleProductClick} className="block focus:outline-none focus:ring-2 focus:ring-orange-200/70">
          {/* Product Image */}
          <div className="p-1.5">
            <div className="relative rounded-lg overflow-hidden ring-1 ring-gray-100 bg-gradient-to-br from-gray-100 to-gray-50">
              <AspectRatio ratio={1}>
                {/* Red discount badge: show when the product has a discount */}
                {hasDiscount && (
                  <div className="absolute top-2 right-2 z-10 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow">-{discountPercentage}%</div>
                )}
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-gray-100">No image</div>
                )}
                {/* Subtle gradient overlay for depth */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,rgba(255,255,255,0.35),rgba(255,255,255,0))]" />
              </AspectRatio>
            </div>
          </div>

          {/* Card Content (Title + Price) */}
          <div className="px-3 pb-2 pt-0">
            {/* Product Name */}
            <h3 className="text-gray-800 text-[13px] md:text-sm font-semibold mb-0.5 line-clamp-2 min-h-[2.1rem] md:min-h-[2.5rem]">
              {product.name}
            </h3>
            
            {/* Price Section */}
            <div className="mb-0 min-h-[1.5rem]">
              {hasDiscount ? (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-base md:text-lg font-bold text-green-600">TK {product.price}</span>
                  <span className="text-[11px] md:text-xs text-gray-400 line-through">TK {product.comparePrice}</span>
                </div>
              ) : (
                <span className="text-base md:text-lg font-bold text-green-600">TK {product.price}</span>
              )}
            </div>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="px-3 pb-3 pt-0">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Button 
                onClick={handleBuyNow}
                className="w-full h-8 md:h-9 font-semibold text-[13px]"
                size="sm"
              >
                Buy Now
              </Button>
            </div>
            
            <div className="flex-shrink-0">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                size="sm"
                aria-label="Add to cart"
                className="w-8 h-8 md:w-9 md:h-9"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}