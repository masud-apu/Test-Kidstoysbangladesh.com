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

// Helper function to normalize media items
function normalizeMediaItem(item: string | MediaItem): MediaItem {
  if (typeof item === 'string') {
    const isVideo = item.includes('.mp4') || item.includes('.webm') || item.includes('.mov') || 
                   item.includes('video/upload') || item.includes('resource_type=video');
    return { url: item, type: isVideo ? 'video' : 'image' };
  }
  return item;
}

function forceCloudinaryMp4(url: string): string {
  try {
    if (!url.includes('res.cloudinary.com') || !url.includes('/video/upload/')) return url;
    const [prefix, restRaw] = url.split('/upload/');
    let rest = restRaw || '';
    if (!rest.startsWith('f_mp4/')) {
      rest = `f_mp4/${rest}`;
    }
    rest = rest.replace(/\.(mov|webm|mkv|avi|mpg|mpeg|3gp|wmv)(\?.*)?$/i, '.mp4$2');
    if (!/\.mp4(\?|$)/i.test(rest)) {
      const qIndex = rest.indexOf('?');
      if (qIndex >= 0) {
        rest = `${rest.slice(0, qIndex)}.mp4${rest.slice(qIndex)}`;
      } else {
        rest = `${rest}.mp4`;
      }
    }
    return `${prefix}/upload/${rest}`;
  } catch {
    return url;
  }
}

interface VariantWithOptions extends ProductVariant {
  selectedOptions?: Array<{
    optionName: string;
    valueName: string;
  }>;
}

interface ProductCardProps {
  product: Product & { variants?: VariantWithOptions[] }
}

export function ProductCard({ product }: ProductCardProps) {
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
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group border border-gray-100 overflow-hidden cursor-pointer"
        aria-label={`View product ${product.title}`}
      >
        <Link href={`/product/${product.handle}`} onClick={handleProductClick} className="block focus:outline-none focus:ring-2 focus:ring-orange-200/70">
          {/* Product Image */}
          <div className="p-1.5">
            <div className="relative rounded-lg overflow-hidden ring-1 ring-gray-100 bg-gradient-to-br from-gray-100 to-gray-50">
              <AspectRatio ratio={1}>
                {/* Discount badge */}
                {hasDiscount && isInStock && (
                  <div className="absolute top-2 right-2 z-10 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow">
                    -{discountPercentage}%
                  </div>
                )}
                {/* Out of stock badge */}
                {!isInStock && minPriceVariant && (
                  <div className="absolute top-2 right-2 z-10 bg-gray-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow">
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
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
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
                        sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
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
                disabled={!canPurchase}
              >
                {!minPriceVariant ? 'View Details' : !isInStock ? 'Out of Stock' : 'Buy Now'}
              </Button>
            </div>

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
          </div>
        </div>
      </article>
    </div>
  )
}