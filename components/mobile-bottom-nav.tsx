'use client'

import Link from 'next/link'
import { Sparkles, Flame, Star } from 'lucide-react'

export function MobileBottomNav() {
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-3 text-center">
          <Link
            href="/#new-arrivals"
            className="flex flex-col items-center justify-center py-3 text-gray-600 hover:text-teal-600"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-xs mt-1">New Arrival</span>
          </Link>

          <Link
            href="/#sale"
            className="flex flex-col items-center justify-center py-3 text-gray-600 hover:text-orange-600"
          >
            <Flame className="h-5 w-5" />
            <span className="text-xs mt-1">Sale</span>
          </Link>

          <Link
            href="/#all-products"
            className="flex flex-col items-center justify-center py-3 text-gray-600 hover:text-gray-900"
          >
            <Star className="h-5 w-5" />
            <span className="text-xs mt-1">All Products</span>
          </Link>
        </div>
        {/* iOS safe area inset */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  )
}
