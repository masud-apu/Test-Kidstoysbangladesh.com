'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { ShoppingCart } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart)
  
  const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.comparePrice!) - parseFloat(product.price)) / parseFloat(product.comparePrice!)) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer border border-gray-100 overflow-hidden">
      {/* Product Image */}
      <div className="relative bg-gray-50 h-48 flex items-center justify-center">
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
            -{discountPercentage}%
          </div>
        )}
        
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={200}
            height={200}
            className="object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <div className="p-6">
        {/* Product Name */}
        <h3 className="text-gray-800 text-lg font-semibold mb-3 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>
        
        {/* Price Section */}
        <div className="mb-6">
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">৳{product.price}</span>
              <span className="text-lg text-gray-400 line-through">৳{product.comparePrice}</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-green-600">৳{product.price}</span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link href={`/product/${product.handle}`} className="flex-1">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium py-2.5 transition-colors"
              size="sm"
            >
              Buy Now
            </Button>
          </Link>
          
          <Button
            onClick={handleAddToCart}
            size="sm"
            variant="outline"
            className="border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg p-2.5 w-12 h-12 flex items-center justify-center transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}