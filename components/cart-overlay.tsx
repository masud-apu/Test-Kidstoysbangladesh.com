"use client"

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useOverlayStore } from '@/lib/ui-store'

export default function CartOverlay() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, selectAllItems, getItemKey } = useCartStore()
  const openCheckout = useOverlayStore((s) => s.openCheckout)

  const total = getTotalPrice()

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">Your cart is empty.</div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Items */}
      {items.map((item) => {
        const itemKey = getItemKey(item)
        const displayPrice = item.variantPrice || '0'

        return (
          <Card key={itemKey} className="overflow-hidden border-none shadow-none">
            <CardContent className="p-0">
              <div className="flex items-start gap-3 py-3">
                {/* Thumb */}
                <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {item.images?.[0] ? (
                    <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                {/* Title and controls */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Variant info - only if NOT a default variant product */}
                  {!item.hasOnlyDefaultVariant && item.variantTitle && item.variantTitle !== 'Default Title' && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.selectedOptions && item.selectedOptions.length > 0 ? (
                        <span>{item.selectedOptions.map(opt => opt.valueName).join(' / ')}</span>
                      ) : (
                        <span>{item.variantTitle}</span>
                      )}
                    </div>
                  )}

                  {/* Quantity controls */}
                  <div className="mt-2 inline-flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(itemKey, Math.max(0, item.quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Remove + price */}
                <div className="flex flex-col items-end gap-2 min-w-[56px]">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeFromCart(itemKey)}
                    aria-label="Remove from cart"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold">TK {(parseFloat(displayPrice) * item.quantity).toFixed(0)}</span>
                </div>
              </div>
              <Separator />
            </CardContent>
          </Card>
        )
      })}

      {/* Total + CTA */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>TK {total.toFixed(0)}</span>
        </div>
        <Button
          className="mt-3 w-full h-12 text-base font-semibold"
          size="lg"
          onClick={() => { selectAllItems(); openCheckout('cart') }}
        >
          Confirm Order
        </Button>
      </div>
    </div>
  )
}
