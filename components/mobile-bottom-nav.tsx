'use client'

import Link from 'next/link'
import { Sparkles, Flame, Star, PackageSearch } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<string>('')

  // Scrollspy to mirror desktop active state
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
  // Hide the global bottom nav on product detail pages to avoid overlapping
  if (pathname && pathname.startsWith('/product/')) {
    return null
  }
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-4 text-center">
          {(
            [
              { id: 'new-arrivals', href: '/#new-arrivals', label: 'New', Icon: Sparkles, hover: 'hover:text-teal-600' },
              { id: 'sale', href: '/#sale', label: 'Sale', Icon: Flame, hover: 'hover:text-orange-600' },
              { id: 'all-products', href: '/#all-products', label: 'Products', Icon: Star, hover: 'hover:text-gray-900' },
              { id: 'track-order', href: '/track-order', label: 'Track', Icon: PackageSearch, hover: 'hover:text-blue-600' },
            ] as const
          ).map(({ id, href, label, Icon, hover }) => {
            const active = activeSection === id || (pathname === '/track-order' && id === 'track-order')
            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  'relative group flex flex-col items-center justify-center py-3',
                  active ? 'text-gray-900' : cn('text-gray-600', hover)
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none absolute top-0 left-3 right-3 h-0.5 rounded-full bg-yellow-400 transition-opacity',
                    active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                  )}
                />
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            )
          })}
        </div>
        {/* iOS safe area inset */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  )
}
