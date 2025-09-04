'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Product } from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { ShoppingCart } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart)
  const router = useRouter()
  
  const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.comparePrice!) - parseFloat(product.price)) / parseFloat(product.comparePrice!)) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    // prevent the card's link from firing
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    // navigate to checkout where the cart will contain this product
    router.push('/checkout')
  }

  return (
    <div className="block">
      <article
        className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100 overflow-hidden cursor-pointer"
        role="link"
        aria-label={`View product ${product.name}`}
        tabIndex={0}
        onClick={() => router.push(`/product/${product.handle}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            router.push(`/product/${product.handle}`)
          }
        }}
      >
        {/* Product Image */}
        <div className="p-3">
          <div className="relative rounded-xl overflow-hidden ring-1 ring-gray-100 bg-gradient-to-br from-gray-100 to-gray-50">
            <AspectRatio ratio={1}>
              {/* Red discount badge: show when the product has a discount */}
              {hasDiscount && (
                <div className="absolute top-3 right-3 z-10 bg-red-500 text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow">-{discountPercentage}%</div>
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

        {/* Card Content */}
        <div className="px-6 pb-6 pt-1">
          {/* Product Name */}
          <h3 className="text-gray-800 text-base md:text-lg font-semibold mb-2 line-clamp-2 min-h-[3rem] md:min-h-[3.5rem]">
            {product.name}
          </h3>
          
          {/* Price Section */}
          <div className="mb-4">
            {hasDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-bold text-green-600">৳{product.price}</span>
                <span className="text-sm md:text-base text-gray-400 line-through">৳{product.comparePrice}</span>
              </div>
            ) : (
              <span className="text-xl md:text-2xl font-bold text-green-600">৳{product.price}</span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Button 
                onClick={handleBuyNow}
                className="w-full h-11 md:h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
                size="sm"
              >
                Buy Now
              </Button>
            </div>
            
            <div className="flex-shrink-0">
              <Button
                onClick={handleAddToCart}
                size="sm"
                aria-label="Add to cart"
                className="w-11 h-11 md:w-12 md:h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}