'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Sparkles, Flame, Star, PackageSearch, UserCircle, Search } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useOverlayStore } from '@/lib/ui-store'
import { cn } from '@/lib/utils'
import { Analytics } from '@/lib/analytics'
import { HeaderAuth } from '@/components/header-auth'

export function Header() {
  const totalItems = useCartStore((s) => s.getTotalItems())
  const openCart = useOverlayStore((s) => s.openCart)
  const router = useRouter()

  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false)

  // Track scroll to shrink header and swap desktop logo
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scrollspy for highlighting active nav link (desktop only use-case, safe on mobile too)
  useEffect(() => {
    const ids = ['new-arrivals', 'sale', 'all-products']
    const elements = ids
      .map((id) => (typeof document !== 'undefined' ? document.getElementById(id) : null))
      .filter((el): el is HTMLElement => !!el)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))
        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id)
        }
      },
      {
        root: null,
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Always use the same logo asset; only size changes on scroll

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-500 ease-out bg-white shadow-sm',
        isScrolled && 'md:bg-transparent md:border-0 md:shadow-none md:pt-4'
      )}
    >
      <div
        className={cn(
          'container mx-auto px-4 transition-all duration-500 ease-out max-w-7xl',
          isScrolled && 'md:max-w-4xl'
        )}
      >
        <div
          className={cn(
            'relative transition-all duration-500 ease-out px-4 md:px-5',
            isScrolled && 'md:border md:border-gray-200 md:bg-white/90 md:backdrop-blur-md md:shadow-md md:rounded-full'
          )}
        >
          {/* Main navigation row */}
          <div className={cn(
            'flex items-center justify-between transition-all duration-500 ease-out',
            'h-20',
            isScrolled ? 'md:h-20' : 'md:h-24'
          )}>
            {/* Logo */}
            <Link
              href="/"
              className={cn(
                'flex items-center group transition-all duration-500 ease-out flex-shrink-0'
              )}
            >
              <div
                className={cn(
                  'relative transition-transform duration-500 ease-out group-hover:scale-105',
                  'w-12 h-12',
                  isScrolled ? 'md:w-16 md:h-16' : 'md:w-20 md:h-20'
                )}
              >
                {/* Mobile: always show the main logo */}
                <Image
                  src="/main-logo.png"
                  alt="Kids Toys Bangladesh"
                  fill
                  className="object-contain md:hidden"
                  priority
                  sizes="(max-width: 767px) 64px"
                  unoptimized
                />
                {/* Desktop: use same logo asset; only size changes on scroll */}
                <Image
                  src="/main-logo.png"
                  alt="Kids Toys Bangladesh"
                  fill
                  className="hidden md:block object-contain"
                  priority
                  sizes={isScrolled ? '(min-width: 768px) 64px' : '(min-width: 768px) 80px'}
                  unoptimized
                />
              </div>
            </Link>

            {/* Mobile & Desktop Navigation - Centered on mobile */}
            <nav
              className={cn(
                'flex items-center gap-0.5 md:gap-2 transition-all duration-500 ease-out absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0',
                isScrolled ? 'text-xs md:text-sm' : 'text-xs md:text-base'
              )}
            >
              {[
                { id: 'sale', href: '/#sale', label: 'Sale', labelDesktop: 'On Sale', Icon: Flame },
                { id: 'all-products', href: '/#all-products', label: 'Products', labelDesktop: 'All Products', Icon: Star },
                { id: 'track-order', href: '/track-order', label: 'Track', labelDesktop: 'Track Order', Icon: PackageSearch },
              ].map(({ id, href, label, labelDesktop, Icon }) => {
                const active = activeSection === id
                return (
                  <Link
                    key={id}
                    href={href}
                    onClick={() => Analytics.trackCategoryView(label.toLowerCase().replace(' ', '_'))}
                    className={cn(
                      'group/link relative flex items-center gap-0.5 md:gap-2 px-1.5 md:px-3 py-1.5 rounded-full font-medium transition-all duration-300',
                      active ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="md:hidden">{label}</span>
                    <span className="hidden md:inline">{labelDesktop}</span>
                    <span
                      className={cn(
                        'pointer-events-none absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-brand-yellow transition-opacity',
                        active ? 'opacity-100' : 'opacity-0 group-hover/link:opacity-60'
                      )}
                    />
                  </Link>
                )
              })}
            </nav>

            {/* Right Side Actions */}
            <div
              className={cn(
                'flex items-center relative z-10 transition-all duration-500 ease-out',
                isScrolled ? 'space-x-1 md:space-x-2' : 'space-x-2 md:space-x-4'
              )}
            >
              {/* Mobile Search Icon - Only show when not expanded */}
              {!mobileSearchExpanded && (
                <Button
                  onClick={() => setMobileSearchExpanded(true)}
                  aria-label="Search"
                  className={cn(
                    'md:hidden rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-all duration-500 ease-out',
                    isScrolled ? 'w-9 h-9' : 'w-9 h-9'
                  )}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}

              {/* Search Bar - Desktop Only */}
              <div className={cn(
                "hidden md:flex items-center relative transition-all duration-300",
                isScrolled ? "w-48" : "w-64"
              )}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (searchQuery.trim()) {
                      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
                    }
                  }}
                  className="relative w-full group"
                >
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-yellow focus:ring-0 outline-none text-sm transition-all duration-300"
                  />
                  <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-yellow transition-colors">
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Account / Sign In - Desktop Only */}
              <div className="hidden md:block">
                <HeaderAuth isScrolled={isScrolled} />
              </div>

              {/* Cart - Desktop Only */}
              <Button
                aria-label="Cart"
                className={cn(
                  'hidden md:flex relative rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 items-center justify-center transition-all duration-500 ease-out',
                  isScrolled ? 'w-10 h-10' : 'w-10 h-10'
                )}
                onClick={() => {
                  Analytics.trackButtonClick('cart_icon', 'header')
                  openCart()
                }}
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-[10px] bg-brand-yellow text-brand-navy font-bold">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Search Expansion Row - Shows below navigation when expanded */}
          {mobileSearchExpanded && (
            <div className="md:hidden pb-3 pt-1 animate-in slide-in-from-top-3 duration-300">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
                    setMobileSearchExpanded(false)
                    setSearchQuery('')
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 pl-4 pr-3 py-2 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-yellow focus:ring-0 outline-none text-sm transition-all duration-300"
                />
                <Button
                  type="button"
                  onClick={() => {
                    setMobileSearchExpanded(false)
                    setSearchQuery('')
                  }}
                  aria-label="Close search"
                  className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 w-10 h-10 p-0 flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-xl">×</span>
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
