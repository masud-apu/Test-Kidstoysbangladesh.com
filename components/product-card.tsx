'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Product } from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { ShoppingCart } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import Link from 'next/link'

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
  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group border border-gray-100 overflow-hidden cursor-pointer"
        aria-label={`View product ${product.name}`}
      >
        <Link href={`/product/${product.handle}`} className="block focus:outline-none focus:ring-2 focus:ring-orange-200/70">
          {/* Product Image */}
          <div className="p-2">
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

          {/* Card Content (Title + Price) */}
          <div className="px-4 pb-3 pt-0">
            {/* Product Name */}
            <h3 className="text-gray-800 text-sm md:text-base font-semibold mb-1 line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]">
              {product.name}
            </h3>
            
            {/* Price Section */}
            <div className="mb-0 min-h-[1.75rem]">
              {hasDiscount ? (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-lg md:text-xl font-bold text-green-600">৳{product.price}</span>
                  <span className="text-xs md:text-sm text-gray-400 line-through">৳{product.comparePrice}</span>
                </div>
              ) : (
                <span className="text-lg md:text-xl font-bold text-green-600">৳{product.price}</span>
              )}
            </div>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="px-4 pb-4 pt-0">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Button 
                onClick={handleBuyNow}
                className="w-full h-9 md:h-10 font-semibold text-sm"
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
                className="w-9 h-9 md:w-10 md:h-10"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}