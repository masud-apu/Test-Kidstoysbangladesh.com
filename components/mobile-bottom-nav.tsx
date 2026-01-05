'use client'

import Link from 'next/link'
import { ShoppingCart, UserCircle, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/store'
import { useOverlayStore } from '@/lib/ui-store'
import { Analytics } from '@/lib/analytics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PhoneAuthDialog } from '@/components/auth/phone-auth-dialog'

export function MobileBottomNav() {
  const pathname = usePathname()
  const totalItems = useCartStore((s) => s.getTotalItems())
  const openCart = useOverlayStore((s) => s.openCart)
  const { data: session, status } = useSession()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Hide the global bottom nav on product detail pages to avoid overlapping
  if (pathname && pathname.startsWith('/product/')) {
    return null
  }

  const isAuthenticated = status === 'authenticated' && !!session?.user

  return (
    <>
      <nav
        role="navigation"
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 text-center">
            {/* Cart */}
            <Button
              onClick={() => {
                Analytics.trackButtonClick('cart_icon', 'mobile_bottom_nav')
                openCart()
              }}
              className="relative group flex flex-col items-center justify-center py-3 bg-transparent hover:bg-gray-50 text-gray-600 hover:text-brand-navy border-0 rounded-none h-auto"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-[10px] bg-brand-yellow text-brand-navy font-bold">
                    {totalItems}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">Cart</span>
            </Button>

            {/* Sign In / Account */}
            {isAuthenticated ? (
              <Link
                href="/account"
                className="relative group flex flex-col items-center justify-center py-3 text-gray-600 hover:text-brand-navy"
              >
                <UserCircle className="h-6 w-6" />
                <span className="text-xs mt-1">Account</span>
              </Link>
            ) : (
              <Button
                onClick={() => {
                  Analytics.trackButtonClick('signin', 'mobile_bottom_nav')
                  setShowAuthDialog(true)
                }}
                className="relative group flex flex-col items-center justify-center py-3 bg-transparent hover:bg-gray-50 text-gray-600 hover:text-brand-navy border-0 rounded-none h-auto"
              >
                <User className="h-6 w-6" />
                <span className="text-xs mt-1">Sign In</span>
              </Button>
            )}
          </div>
          {/* iOS safe area inset */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </nav>

      {/* Auth Dialog */}
      <PhoneAuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        callbackUrl="/"
      />
    </>
  )
}
