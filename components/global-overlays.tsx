"use client"

import { useEffect, useState } from 'react'
import { useOverlayStore } from '@/lib/ui-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CheckoutPage from '@/app/checkout/page'
import CartOverlay from '@/components/cart-overlay'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import { CheckCircle2, Package, Phone, Mail, X } from 'lucide-react'

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
  const { cartOpen, checkoutOpen, checkoutMode, successDialogOpen, orderId, closeCart, closeCheckout, hideSuccessDialog } = useOverlayStore()
  const totalItems = useCartStore((s) => s.getTotalItems())
  const isMobile = useIsMobile()
  const [checkoutSnapPoint, setCheckoutSnapPoint] = useState<number | string | null>(0.7)

  // Close cart when checkout opens to prevent stacking
  useEffect(() => {
    if (checkoutOpen && cartOpen) {
      closeCart()
    }
  }, [checkoutOpen, cartOpen, closeCart])

  // Reset snap point when checkout closes
  useEffect(() => {
    if (!checkoutOpen) {
      setCheckoutSnapPoint(1)
    }
  }, [checkoutOpen])

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

      {/* Checkout Drawer - Mobile: expandable to fullscreen, Desktop: fixed 70vh */}
      <Drawer
        open={checkoutOpen}
        onOpenChange={(open) => (open ? undefined : closeCheckout())}
        direction="bottom"
        snapPoints={isMobile ? [1] : undefined}
        activeSnapPoint={isMobile ? checkoutSnapPoint : undefined}
        setActiveSnapPoint={isMobile ? setCheckoutSnapPoint : undefined}
      >
        <DrawerContent className={isMobile ? "flex flex-col [&[data-vaul-snap-points]]:h-full" : "max-h-[70vh] flex flex-col"}>
          <DrawerHeader className="border-b flex-shrink-0 relative flex items-center justify-center">
            <DrawerTitle>Checkout</DrawerTitle>
            <DrawerClose asChild className="absolute right-4 top-1/2 -translate-y-1/2">
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div
            className="flex-1"
            style={{
              overflow: isMobile && checkoutSnapPoint !== 1 ? 'hidden' : 'auto'
            }}
          >
            <CheckoutPage />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Order Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={hideSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="relative">
            {/* Success Icon Animation */}
            <div className="mx-auto mb-6 relative">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-500">
                <svg
                  className="w-10 h-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" className="opacity-20" />
                  <path
                    d="m9 12 2 2 4-4"
                    className="animate-in draw-in duration-700 delay-300"
                    style={{
                      strokeDasharray: '12',
                      strokeDashoffset: '12',
                      animation: 'draw-check 0.7s ease-in-out 0.3s forwards'
                    }}
                  />
                </svg>
              </div>
            </div>

            {/* Content */}
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-center">
                Order Placed Successfully!
              </DialogTitle>
              <DialogDescription className="text-center space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-lg font-semibold text-foreground">
                    Order ID: {orderId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please save this ID for your reference
                  </p>
                </div>

                <div className="grid gap-3 text-left">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Order Placed</p>
                      <p className="text-xs text-muted-foreground">Your order has been received and confirmed</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Invoice Sent</p>
                      <p className="text-xs text-muted-foreground">We&apos;ve sent you an email with your invoice</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Confirmation Call</p>
                      <p className="text-xs text-muted-foreground">We will call you to confirm your order details</p>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={() => {
                  hideSuccessDialog()
                  window.location.href = `/track-order?orderId=${orderId}`
                }}
                className="w-full"
                size="lg"
              >
                Track Your Order
              </Button>
              <Button
                onClick={() => {
                  hideSuccessDialog()
                  window.location.href = '/'
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
