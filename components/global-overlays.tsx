"use client"

import { useEffect } from 'react'
import { useOverlayStore } from '@/lib/ui-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import CheckoutPage from '@/app/checkout/page'
import CartOverlay from '@/components/cart-overlay'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'

// Wrapper to render either Drawer (mobile) or Sheet (desktop) with a unified API
function ResponsiveOverlay(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'right' | 'bottom'
  title: string
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const side = props.side ?? (isMobile ? 'bottom' : 'right')

  if (isMobile) {
    const dir: 'bottom' | 'right' = 'bottom'
    return (
      <Drawer open={props.open} onOpenChange={props.onOpenChange} direction={dir}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{props.title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4">{props.children}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
  <SheetContent side={side} className={side === 'bottom' ? 'max-h-[85vh]' : ''}>
        <SheetHeader>
          <SheetTitle>{props.title}</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-4 h-full">{props.children}</div>
      </SheetContent>
    </Sheet>
  )
}

export function GlobalOverlays() {
  const { cartOpen, checkoutOpen, checkoutMode, closeCart, closeCheckout } = useOverlayStore()
  const totalItems = useCartStore((s) => s.getTotalItems())

  // Close cart when checkout opens to prevent stacking
  useEffect(() => {
    if (checkoutOpen && cartOpen) {
      closeCart()
    }
  }, [checkoutOpen, cartOpen, closeCart])

  return (
    <>
      {/* Cart Side/Bottom Sheet */}
      <ResponsiveOverlay
        open={cartOpen}
        onOpenChange={(open) => (open ? undefined : closeCart())}
        side="right"
        title=""
      >
        {/* Header bar similar to the screenshot */}
        <div className="sticky top-0 z-10 bg-background">
          <div className="flex items-center justify-between py-3">
            <Button asChild variant="link" className="px-0 text-sm">
              <Link href="#" onClick={(e) => { e.preventDefault(); closeCart(); }}>
                Continue Shopping
              </Link>
            </Button>
            <h2 className="text-xl font-bold">Your Cart</h2>
            <div className="inline-flex items-center justify-center h-8 w-8 rounded-full border font-semibold">
              {totalItems}
            </div>
          </div>
          <div className="border-b" />
        </div>
        <div className="pt-3">
          <CartOverlay />
        </div>
      </ResponsiveOverlay>

      {/* Checkout Bottom Sheet (also bottom on desktop per requirement) */}
      <ResponsiveOverlay
        open={checkoutOpen}
        onOpenChange={(open) => (open ? undefined : closeCheckout())}
        side="bottom"
        title="Checkout"
      >
        <CheckoutPage />
      </ResponsiveOverlay>
    </>
  )
}
