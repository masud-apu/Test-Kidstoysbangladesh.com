'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/lib/store'
import { Minus, Plus, Trash2, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useOverlayStore } from '@/lib/ui-store'
import { Analytics } from '@/lib/analytics'
import { fbPixelEvents } from '@/lib/facebook-pixel-events'

export default function CartPage() {
  const router = useRouter()
  const openCheckout = useOverlayStore((s) => s.openCheckout)
  const {
    items,
    selectedItems,
    updateQuantity,
    removeFromCart,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    getSelectedItems,
    getSelectedTotal,
    getItemKey,
  } = useCartStore()
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Auto-select all items when first visiting cart
    if (items.length > 0 && selectedItems.length === 0) {
      selectAllItems()
    }
    
    // Track cart view
    if (items.length > 0) {
      const totalValue = items.reduce((total, item) => {
        const price = item.variantPrice || '0'
        return total + parseFloat(price) * item.quantity
      }, 0)
      
      // Track Facebook Pixel custom ViewCart event
      fbPixelEvents.customEvent('ViewCart', {
        content_ids: items.map(item => item.id.toString()),
        contents: items.map(item => ({
          id: item.id.toString(),
          quantity: item.quantity,
          price: parseFloat(item.variantPrice || '0')
        })),
        currency: 'BDT',
        value: totalValue,
        num_items: items.reduce((sum, item) => sum + item.quantity, 0)
      })
      
      // Track PostHog Analytics
      Analytics.trackCartView(items, totalValue)
    }
  }, [items.length, selectedItems.length, selectAllItems, items])

  const selectedItemsData = getSelectedItems()
  const selectedTotal = getSelectedTotal()
  const allSelected = items.length > 0 && selectedItems.length === items.length

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection()
    } else {
      selectAllItems()
    }
  }

  const handleCheckout = () => {
    if (selectedItemsData.length > 0) {
      openCheckout('cart')
    }
  }

  if (!mounted) {
    return <div className="container py-16 text-center">Loading...</div>
  }

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground">Add some products to get started</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            Select All ({items.length})
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const itemKey = getItemKey(item)
            const displayPrice = item.variantPrice || '0'
            const displayComparePrice = item.variantCompareAtPrice || null

            return (
              <Card key={itemKey} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Checkbox
                      checked={selectedItems.includes(itemKey)}
                      onCheckedChange={() => toggleItemSelection(itemKey)}
                    />

                    <div className="relative w-20 h-20 flex-shrink-0">
                      {item.images && item.images[0] ? (
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.handle}`}>
                        <h3 className="font-medium line-clamp-2 hover:underline">
                          {item.title}
                        </h3>
                      </Link>

                      {/* Display variant information - only if NOT a default variant product */}
                      {!item.hasOnlyDefaultVariant && item.variantTitle && item.variantTitle !== 'Default Title' && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {item.selectedOptions && item.selectedOptions.length > 0 ? (
                            <span>{item.selectedOptions.map(opt => opt.valueName).join(' / ')}</span>
                          ) : (
                            <span>{item.variantTitle}</span>
                          )}
                        </div>
                      )}

                      {!item.hasOnlyDefaultVariant && item.variantSku && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          SKU: {item.variantSku}
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold">TK {displayPrice}</span>
                        {displayComparePrice && parseFloat(displayComparePrice) > parseFloat(displayPrice) && (
                          <span className="text-sm text-muted-foreground line-through">
                            TK {displayComparePrice}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-bold">
                            TK {(parseFloat(displayPrice) * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removeFromCart(itemKey)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Selected Items ({selectedItemsData.length})</span>
                  <span>
                    {selectedItemsData.reduce((total, item) => total + item.quantity, 0)} items
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>TK {selectedTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={handleCheckout}
                disabled={selectedItemsData.length === 0}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Proceed to Checkout ({selectedItemsData.length})
              </Button>

              {/* Continue Shopping removed as requested */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
