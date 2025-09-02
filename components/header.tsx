'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Store } from 'lucide-react'
import { useCartStore } from '@/lib/store'

export function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Store className="h-6 w-6" />
          <span className="text-xl font-bold">KidsToysBangladesh</span>
        </Link>
        
        <nav className="flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:underline">
            Home
          </Link>
          
          <Link href="/cart">
            <Button variant="outline" size="sm" className="relative">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart
              {totalItems > 0 && (
                <Badge 
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
                  variant="destructive"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}