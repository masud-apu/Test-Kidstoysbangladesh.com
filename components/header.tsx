'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Sparkles,
  Flame,
  Star,
  
} from 'lucide-react'
import { useCartStore } from '@/lib/store'

export function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 border-b border-gray-100 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Main Header */}
          <div className="flex h-24 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative w-40 h-40 transition-transform group-hover:scale-105">
                <Image
                  src="/main-logo.svg"
                  alt="Kids Toys Bangladesh"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/#new-arrivals" className="flex items-center space-x-2 text-gray-700 hover:text-teal-600 transition-colors font-medium">
                <Sparkles className="h-5 w-5" />
                <span>New Arrival</span>
              </Link>
              <Link href="/#sale" className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors font-medium">
                <Flame className="h-5 w-5" />
                <span>Sale</span>
              </Link>
              <Link href="/#all-products" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-medium">
                <Star className="h-5 w-5" />
                <span>All Products</span>
              </Link>
            </nav>

            {/* Search removed */}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link href="/cart">
                <Button
                  aria-label="Cart"
                  className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-[10px] bg-yellow-500 text-gray-900 font-bold">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}