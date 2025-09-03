'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Search, 
  Menu,
  Sparkles,
  Flame,
  X
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function Header() {
  const totalItems = useCartStore((state) => state.getTotalItems())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
                  src="/main-logo.png"
                  alt="Kids Toys Bangladesh"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                  sizes="160px"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/new-arrivals" className="flex items-center space-x-2 text-gray-700 hover:text-teal-600 transition-colors font-medium">
                <Sparkles className="h-5 w-5" />
                <span>New Arrival</span>
              </Link>
              <Link href="/sale" className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors font-medium">
                <Flame className="h-5 w-5" />
                <span>Sale</span>
              </Link>
            </nav>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative group w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                <Input 
                  type="search" 
                  placeholder="Search toys..." 
                  className="pl-12 pr-6 py-3 w-full rounded-2xl border-2 border-gray-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link href="/cart">
                <Button className="relative bg-orange-500 hover:bg-orange-600 text-white px-4 md:px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 group">
                  <ShoppingCart className="h-5 w-5 md:mr-2 group-hover:scale-110 transition-transform" />
                  <span className="hidden md:inline font-medium">Cart</span>
                  {totalItems > 0 && (
                    <Badge 
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 text-xs bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold animate-pulse"
                    >
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden p-3 rounded-xl hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile App-Style Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu */}
          <div className="absolute top-24 left-0 right-0 bg-white shadow-2xl rounded-b-3xl mx-4">
            <div className="p-6 space-y-6">
              {/* Search Bar in Mobile */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  type="search" 
                  placeholder="Search toys..." 
                  className="pl-12 pr-6 py-4 w-full rounded-2xl border-2 border-gray-200 focus:border-teal-400 bg-gray-50 text-base"
                />
              </div>

              {/* Navigation Links */}
              <div className="space-y-4">
                <Link 
                  href="/new-arrivals" 
                  className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-green-50 hover:from-teal-100 hover:to-green-100 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">New Arrival</div>
                    <div className="text-sm text-gray-600">Latest toys & games</div>
                  </div>
                </Link>

                <Link 
                  href="/sale" 
                  className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sale</div>
                    <div className="text-sm text-gray-600">Best deals & discounts</div>
                  </div>
                </Link>

                <Link 
                  href="/cart" 
                  className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all duration-200 relative"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center relative">
                    <ShoppingCart className="h-6 w-6 text-white" />
                    {totalItems > 0 && (
                      <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs bg-yellow-500 text-gray-900 font-bold">
                        {totalItems}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Cart</div>
                    <div className="text-sm text-gray-600">
                      {totalItems > 0 ? `${totalItems} items` : 'Your shopping cart'}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}