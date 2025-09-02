'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <Link href={`/product/${product.handle}`} className="block">
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer">
        <div className="relative aspect-square overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          {hasDiscount && (
            <Badge className="absolute right-2 top-2 bg-destructive text-destructive-foreground">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-medium line-clamp-2 font-bengali group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold">৳{product.price}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ৳{product.comparePrice}
              </span>
            )}
          </div>
          
          {product.tags && product.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={handleAddToCart}
            className="w-full"
            size="sm"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}