'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Product, ProductVariant, MediaItem } from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import Link from 'next/link'
import { ShoppingCart, Play } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useOverlayStore } from '@/lib/ui-store'
import { fbPixelEvents } from '@/lib/facebook-pixel-events'
import { Analytics } from '@/lib/analytics'
import { normalizeMediaItem, forceCloudinaryMp4 } from '@/lib/utils/media-helpers'



interface VariantWithOptions extends ProductVariant {
  selectedOptions?: Array<{
    optionName: string;
    valueName: string;
  }>;
}

interface ProductCardProps {
  product: Product & { variants?: VariantWithOptions[] }
  compact?: boolean
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const router = useRouter()
  const addToCart = useCartStore((state) => state.addToCart)
  const setDirectBuy = useCartStore((state) => state.setDirectBuy)
  const openCart = useOverlayStore((s) => s.openCart)
  const openCheckout = useOverlayStore((s) => s.openCheckout)

  // Calculate minimum price and its discount from variants
  const variants = product.variants || []

  // Find variant with minimum price (handle empty variants array)
  const minPriceVariant = variants.length > 0
    ? variants.reduce((min, v) => {
      const price = parseFloat(v.price)
      const minPrice = parseFloat(min.price)
      return price < minPrice ? v : min
    })
    : null

  const minPrice = minPriceVariant ? parseFloat(minPriceVariant.price) : 0
  const minPriceCompare = minPriceVariant?.compareAtPrice ? parseFloat(minPriceVariant.compareAtPrice) : 0

  // Calculate discount for minimum price variant
  const hasDiscount = minPriceCompare > minPrice && minPrice > 0
  const discountPercentage = hasDiscount
    ? Math.round(((minPriceCompare - minPrice) / minPriceCompare) * 100)
    : 0

  const savedAmount = hasDiscount ? (minPriceCompare - minPrice) : 0

  const priceDisplay = minPrice > 0 ? `TK ${minPrice.toFixed(2)}` : 'Price not available'

  // Check if variant is available for purchase
  const isAvailableForSale = minPriceVariant?.availableForSale ?? false
  const isInStock = minPriceVariant
    ? (minPriceVariant.inventoryQuantity > 0 || minPriceVariant.inventoryPolicy === 'continue')
    : false
  const canPurchase = minPriceVariant && isAvailableForSale && isInStock

  const handleProductClick = () => {
    // Track product view
    if (minPriceVariant) {
      Analytics.trackProductView({
        product_id: product.id.toString(),
        product_name: product.title,
        price: parseFloat(minPriceVariant.price),
        compare_price: minPriceVariant.compareAtPrice ? parseFloat(minPriceVariant.compareAtPrice) : undefined,
        tags: Array.isArray(product.tags) ? product.tags : [],
        category: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags[0] : undefined
      })
    }

    // Navigate to product page where user can select variants
    router.push(`/product/${product.handle}`)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!minPriceVariant) {
      // Navigate to product page to select variant
      router.push(`/product/${product.handle}`)
      return
    }

    const price = parseFloat(minPriceVariant.price)
    const comparePrice = minPriceVariant.compareAtPrice ? parseFloat(minPriceVariant.compareAtPrice) : undefined

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
      variant_id: minPriceVariant.id.toString(),
      variant_title: minPriceVariant.title,
      variant_price: price
    })

    const selectedOptions = minPriceVariant.selectedOptions || []
    addToCart(product, minPriceVariant, selectedOptions)
    openCart()
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!minPriceVariant) {
      // Navigate to product page to select variant
      router.push(`/product/${product.handle}`)
      return
    }

    const price = parseFloat(minPriceVariant.price)
    const comparePrice = minPriceVariant.compareAtPrice ? parseFloat(minPriceVariant.compareAtPrice) : undefined

    // Track Facebook Pixel InitiateCheckout event
    fbPixelEvents.initiateCheckout({
      content_name: product.title,
      content_ids: [product.id.toString()],
      content_type: 'product',
      value: price,
      currency: 'BDT',
      num_items: 1,
      content_category: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags[0] : undefined
    })

    // Track PostHog Checkout Started
    Analytics.trackCheckoutStart({
      items: [{
        product_id: product.id.toString(),
        product_name: product.title,
        price: price,
        quantity: 1
      }],
      total_amount: price,
      currency: 'BDT',
      item_count: 1
    })

    const selectedOptions = minPriceVariant.selectedOptions || []
    setDirectBuy(product, minPriceVariant, selectedOptions)
    openCheckout('direct')
  }

  return (
    <div className="block">
      <article
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group/card border border-gray-100 overflow-hidden cursor-pointer"
        aria-label={`View product ${product.title}`}
      >
        <Link href={`/product/${product.handle}`} prefetch={false} onClick={handleProductClick} className="block focus:outline-none focus:ring-2 focus:ring-brand-yellow/70">
          {/* Product Image */}
          <div className={compact ? "p-1" : "p-1.5"}>
            <div className="relative rounded-lg overflow-hidden ring-1 ring-gray-100 bg-gradient-to-br from-gray-100 to-gray-50">
              <AspectRatio ratio={1}>
                {/* Discount badge */}
                {hasDiscount && isInStock && (
                  <div className={`absolute top-2 right-2 z-10 bg-red-600 text-white rounded-full font-bold shadow ${compact ? 'text-[8px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'}`}>
                    -{discountPercentage}%
                  </div>
                )}
                {/* Out of stock badge */}
                {!isInStock && minPriceVariant && (
                  <div className={`absolute top-2 right-2 z-10 bg-gray-600 text-white rounded-full font-bold shadow ${compact ? 'text-[8px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'}`}>
                    Out of Stock
                  </div>
                )}
                {product.images && product.images.length > 0 ? (
                  (() => {
                    const firstMedia = normalizeMediaItem(product.images[0]);
                    const isVideo = firstMedia.type === 'video';

                    return isVideo ? (
                      <div className="relative w-full h-full">
                        <video
                          src={forceCloudinaryMp4(firstMedia.url)}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
                          preload="metadata"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 rounded-full p-2">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={firstMedia.url}
                        alt={product.title}
                        fill
                        sizes={compact ? "(min-width:1280px) 20vw, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" : "(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"}
                        loading="lazy"
                        className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
                      />
                    );
                  })()
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-gray-100">No image</div>
                )}
                {/* Subtle gradient overlay for depth */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,rgba(255,255,255,0.35),rgba(255,255,255,0))]" />
              </AspectRatio>
            </div>
          </div>

          {/* Card Content (Title + Price) */}
          <div className={`pt-0 ${compact ? 'px-1.5 pb-1.5' : 'px-3 pb-2'}`}>
            {/* Product Name */}
            <h3 className={`text-gray-800 font-semibold mb-0.5 line-clamp-2 ${compact ? 'text-[11px] leading-tight min-h-[1.8rem]' : 'text-[13px] md:text-sm min-h-[2.1rem] md:min-h-[2.5rem]'}`}>
              {product.title}
            </h3>

            {/* Price */}
            <div className={`mb-0 flex flex-wrap items-center gap-1.5 ${compact ? 'min-h-[1rem]' : 'min-h-[1.5rem] gap-2'}`}>
              <span className={`font-bold text-brand-navy ${compact ? 'text-sm' : 'text-base md:text-lg'}`}>
                TK {minPrice.toFixed(0)}
              </span>
              {hasDiscount && (
                <span className={`text-gray-400 line-through decoration-gray-400 font-medium translate-y-[0.5px] ${compact ? 'text-[9px]' : 'text-xs translate-y-[1px]'}`}>
                  TK {minPriceCompare.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className={`pt-0 ${compact ? 'px-1.5 pb-2' : 'px-3 pb-3'}`}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Button
                onClick={handleBuyNow}
                className={`w-full font-semibold bg-brand-red text-white hover:bg-brand-red/90 ${compact ? 'h-7 text-[10px]' : 'h-8 md:h-9 text-[13px]'}`}
                size="sm"
                disabled={!canPurchase}
              >
                {!minPriceVariant ? 'Details' : !isInStock ? 'No Stock' : 'Order Now'}
              </Button>
            </div>

            {!compact && (
              <div className="flex-shrink-0">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  size="sm"
                  aria-label="Add to cart"
                  className="w-8 h-8 md:w-9 md:h-9"
                  disabled={!canPurchase}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}