'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Product, ProductVariant } from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useOverlayStore } from '@/lib/ui-store'

interface ProductCardProps {
  product: Product & { variants?: ProductVariant[] }
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const addToCart = useCartStore((state) => state.addToCart)
  const setDirectBuy = useCartStore((state) => state.setDirectBuy)
  const openCart = useOverlayStore((s) => s.openCart)
  const openCheckout = useOverlayStore((s) => s.openCheckout)

  // Calculate minimum price and its discount from variants
  const variants = product.variants || []

  // Find variant with minimum price
  const minPriceVariant = variants.reduce((min, v) => {
    const price = parseFloat(v.price)
    const minPrice = parseFloat(min.price)
    return price < minPrice ? v : min
  }, variants[0])

  const minPrice = minPriceVariant ? parseFloat(minPriceVariant.price) : 0
  const minPriceCompare = minPriceVariant?.compareAtPrice ? parseFloat(minPriceVariant.compareAtPrice) : 0

  // Calculate discount for minimum price variant
  const hasDiscount = minPriceCompare > minPrice
  const discountPercentage = hasDiscount
    ? Math.round(((minPriceCompare - minPrice) / minPriceCompare) * 100)
    : 0

  const priceDisplay = `TK ${minPrice.toFixed(2)}`

  const handleProductClick = () => {
    // Navigate to product page where user can select variants
    router.push(`/product/${product.handle}`)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Add product with the minimum price variant selected
    if (minPriceVariant) {
      const selectedOptions = minPriceVariant.selectedOptions || []
      addToCart(product, minPriceVariant, selectedOptions)
      openCart()
    }
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Direct buy with the minimum price variant
    if (minPriceVariant) {
      const selectedOptions = minPriceVariant.selectedOptions || []
      setDirectBuy(product, minPriceVariant, selectedOptions)
      openCheckout('direct')
    }
  }

  return (
    <div className="block">
      <article
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group border border-gray-100 overflow-hidden cursor-pointer"
        aria-label={`View product ${product.title}`}
      >
        <Link href={`/product/${product.handle}`} onClick={handleProductClick} className="block focus:outline-none focus:ring-2 focus:ring-orange-200/70">
          {/* Product Image */}
          <div className="p-1.5">
            <div className="relative rounded-lg overflow-hidden ring-1 ring-gray-100 bg-gradient-to-br from-gray-100 to-gray-50">
              <AspectRatio ratio={1}>
                {/* Discount badge */}
                {hasDiscount && (
                  <div className="absolute top-2 right-2 z-10 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow">
                    -{discountPercentage}%
                  </div>
                )}
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
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
              {product.title}
            </h3>

            {/* Price */}
            <div className="mb-0 min-h-[1.5rem]">
              <span className="text-base md:text-lg font-bold text-green-600">{priceDisplay}</span>
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