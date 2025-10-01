'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Sparkles, Flame, Star, PackageSearch } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useOverlayStore } from '@/lib/ui-store'
import { cn } from '@/lib/utils'
import { Analytics } from '@/lib/analytics'

export function Header() {
  const totalItems = useCartStore((s) => s.getTotalItems())
  const openCart = useOverlayStore((s) => s.openCart)

  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')

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
        'sticky top-0 z-50 w-full transition-all duration-500 ease-out',
        isScrolled
          ? 'bg-transparent border-0 shadow-none pt-4'
          : 'bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 border-b border-gray-100 shadow-sm'
      )}
    >
      <div
        className={cn(
          'container mx-auto px-4 transition-all duration-500 ease-out',
          isScrolled ? 'max-w-4xl' : 'max-w-7xl'
        )}
      >
        <div
          className={cn(
            'relative flex items-center transition-all duration-500 ease-out',
            isScrolled
              ? 'h-20 rounded-full border border-gray-200 bg-white/90 backdrop-blur-md shadow-md px-4 md:px-5 justify-end md:justify-between'
              : 'h-24 justify-end md:justify-between'
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              'flex items-center group transition-all duration-500 ease-out',
              // Keep logo centered on mobile at all times; static on md+ for layout
              'absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0'
            )}
          >
            <div
              className={cn(
                'relative transition-transform duration-500 ease-out group-hover:scale-105',
                isScrolled ? 'w-20 h-20 md:w-28 md:h-28' : 'w-24 h-24 md:w-36 md:h-36'
              )}
            >
              {/* Mobile: always show the main logo */}
              <Image
                src="/main-logo.svg"
                alt="Kids Toys Bangladesh"
                fill
                className="object-contain md:hidden"
                priority
                sizes="(max-width: 767px) 112px"
              />
              {/* Desktop: use same logo asset; only size changes on scroll */}
              <Image
                src="/main-logo.svg"
                alt="Kids Toys Bangladesh"
                fill
                className="hidden md:block object-contain"
                priority
                sizes={isScrolled ? '(min-width: 768px) 56px' : '(min-width: 768px) 160px'}
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className={cn(
              'hidden md:flex items-center gap-2 transition-all duration-500 ease-out',
              isScrolled ? 'text-sm' : 'text-base'
            )}
          >
            {[
              { id: 'new-arrivals', href: '/#new-arrivals', label: 'New Arrival', Icon: Sparkles },
              { id: 'sale', href: '/#sale', label: 'Sale', Icon: Flame },
              { id: 'all-products', href: '/#all-products', label: 'All Products', Icon: Star },
              { id: 'track-order', href: '/track-order', label: 'Track Order', Icon: PackageSearch },
            ].map(({ id, href, label, Icon }) => {
              const active = activeSection === id
              return (
                <Link
                  key={id}
                  href={href}
                  onClick={() => Analytics.trackCategoryView(label.toLowerCase().replace(' ', '_'))}
                  className={cn(
                    'group/link relative flex items-center gap-2 px-3 py-1.5 rounded-full font-medium transition-all duration-300',
                    active ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                  <span
                    className={cn(
                      'pointer-events-none absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-yellow-400 transition-opacity',
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
              isScrolled ? 'space-x-2' : 'space-x-4'
            )}
          >
            <Button
              aria-label="Cart"
              className={cn(
                'relative rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-all duration-500 ease-out',
                isScrolled ? 'w-11 h-11 md:w-12 md:h-12' : 'w-11 h-11 md:w-12 md:h-12'
              )}
              onClick={() => {
                Analytics.trackButtonClick('cart_icon', 'header')
                openCart()
              }}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-[10px] bg-yellow-500 text-gray-900 font-bold">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
