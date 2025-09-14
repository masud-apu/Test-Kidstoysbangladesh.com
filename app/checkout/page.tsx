'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCartStore, type DeliveryType } from '@/lib/store'
import { useOverlayStore } from '@/lib/ui-store'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { checkoutSchema, type CheckoutType } from '@/lib/validations'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Analytics } from '@/lib/analytics'
import { fbPixelEvents } from '@/lib/facebook-pixel-events'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const overlayCheckoutOpen = useOverlayStore((s) => s.checkoutOpen)
  const overlayCheckoutMode = useOverlayStore((s) => s.checkoutMode)
  const closeCheckout = useOverlayStore((s) => s.closeCheckout)
  const showSuccessDialog = useOverlayStore((s) => s.showSuccessDialog)
  const checkoutType = overlayCheckoutOpen ? overlayCheckoutMode : (searchParams.get('type') || 'cart')
  
  const { 
    directBuyItem,
    getSelectedItems,
    getSelectedTotal,
    updateQuantity, 
    removeFromCart, 
    clearCart,
  clearDirectBuy,
  deliveryType,
  setDeliveryType,
  getShippingCost,
  } = useCartStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Determine which items to show based on checkout type
  const checkoutItems = checkoutType === 'direct' && directBuyItem 
    ? [directBuyItem] 
    : checkoutType === 'cart' 
    ? getSelectedItems() 
    : []
    
  const itemsTotal = checkoutType === 'direct' && directBuyItem
    ? parseFloat(directBuyItem.price) * directBuyItem.quantity
    : getSelectedTotal()
  const shippingCost = checkoutItems.length > 0 ? getShippingCost() : 0
  const totalPrice = itemsTotal + shippingCost
  
  useEffect(() => {
    setMounted(true)
    
    // Track checkout started
    if (checkoutItems.length > 0) {
      // Track Facebook Pixel InitiateCheckout event
      fbPixelEvents.initiateCheckout({
        content_ids: checkoutItems.map(item => item.id.toString()),
        contents: checkoutItems.map(item => ({
          id: item.id.toString(),
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        currency: 'BDT',
        num_items: checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
        value: totalPrice,
        content_category: checkoutItems.length > 0 && Array.isArray(checkoutItems[0].tags) && checkoutItems[0].tags.length > 0 ? checkoutItems[0].tags[0] : undefined
      })
      
      // Track PostHog Analytics
      Analytics.trackCheckoutStart({
        items: checkoutItems.map(item => ({
          product_id: item.id.toString(),
          product_name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity
        })),
        total_amount: totalPrice,
        currency: 'BDT',
        item_count: checkoutItems.reduce((sum, item) => sum + item.quantity, 0)
      })
    }
  }, [checkoutItems, totalPrice])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutType>({
    resolver: zodResolver(checkoutSchema),
  })

  const onSubmit = async (data: CheckoutType) => {
    setIsLoading(true)
    
    try {
      const newOrderId = `KTB${Date.now()}`
      
      const orderData = {
        customerName: data.name,
        customerEmail: data.email ?? null,
        customerPhone: data.phone,
        customerAddress: data.address,
  specialNote: data.specialNote ?? undefined,
        // city and postalCode removed
        items: checkoutItems,
        totalAmount: totalPrice,
        shippingCost,
        deliveryType,
        orderId: newOrderId,
      }
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Close the checkout overlay immediately
        if (overlayCheckoutOpen) {
          closeCheckout()
        }
        
        // Track Facebook Pixel Purchase event
        fbPixelEvents.purchase({
          content_ids: checkoutItems.map(item => item.id.toString()),
          content_name: checkoutItems.map(item => item.name).join(', '),
          content_type: 'product',
          contents: checkoutItems.map(item => ({
            id: item.id.toString(),
            quantity: item.quantity,
            price: parseFloat(item.price)
          })),
          currency: 'BDT',
          num_items: checkoutItems.reduce((sum, item) => sum + item.quantity, 0),
          value: totalPrice
        })
        
        // Track PostHog Analytics
        Analytics.trackPurchase({
          items: checkoutItems.map(item => ({
            product_id: item.id.toString(),
            product_name: item.name,
            price: parseFloat(item.price),
            quantity: item.quantity
          })),
          total_amount: totalPrice,
          currency: 'BDT',
          item_count: checkoutItems.reduce((sum, item) => sum + item.quantity, 0)
        }, newOrderId)
        
        // Track user identification
        Analytics.identifyUser(`customer_${data.phone}`, {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address,
          total_orders: 1,
          last_order_id: newOrderId,
          delivery_type: deliveryType
        })
        
        // Clear cart or direct buy item
        if (checkoutType === 'direct') {
          clearDirectBuy()
        } else {
          clearCart()
        }
        
        // Show simple success toast
        toast.success('Order placed successfully!', {
          description: `Order #${newOrderId} confirmed`,
          duration: 3000,
        })
        
        // Show success dialog after a brief delay to ensure overlay is closed
        setTimeout(() => {
          showSuccessDialog(newOrderId)
        }, 300)
      } else {
        toast.error('Order failed', {
          description: result.message || 'There was a problem processing your order. Please try again.',
        })
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Order failed', {
        description: 'There was a problem processing your order. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return <div className="container mx-auto max-w-6xl py-16 text-center">Loading...</div>
  }
  
  if (checkoutItems.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">No items to checkout</h2>
        <p className="text-muted-foreground mb-4">
          {checkoutType === 'direct' 
            ? 'No product selected for direct purchase' 
            : 'No items selected from cart'}
        </p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
  <div className="container mx-auto max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <div className="text-sm text-muted-foreground">
            {checkoutType === 'direct' ? 'Direct Purchase' : 'From Cart'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Delivery Location</p>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(val) => setDeliveryType(val as DeliveryType)}
                    className="grid gap-2"
                  >
                    <label htmlFor="checkout-outside" className="flex items-center justify-between rounded-lg border p-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="outside" id="checkout-outside" />
                        <span className="text-sm">Outside Dhaka</span>
                      </div>
                      <span className="text-sm font-medium">TK 120</span>
                    </label>
                    <label htmlFor="checkout-inside" className="flex items-center justify-between rounded-lg border p-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="inside" id="checkout-inside" />
                        <span className="text-sm">Inside Dhaka</span>
                      </div>
                      <span className="text-sm font-medium">TK 60</span>
                    </label>
                  </RadioGroup>
                </div>

                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded">
                      {item.images && item.images[0] ? (
                        <Image
                          src={item.images[0]}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <h3 className="font-medium line-clamp-2">{item.name}</h3>
                      <p className="font-bold">TK {item.price}</p>
                      
                      {checkoutType === 'cart' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 ml-auto"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">TK {(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items Total:</span>
                    <span>TK {itemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>TK {shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total:</span>
                    <span>TK {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" {...register('phone')} />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      rows={3}
                      placeholder="House/Flat, Road, Area, City (e.g., House 12, Road 5, Dhanmondi, Dhaka)"
                      className="resize-y min-h-[96px]"
                      {...register('address')}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Provide full delivery address so the courier can find you.</p>
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="specialNote">Special Note (optional)</Label>
                    <Textarea
                      id="specialNote"
                      rows={2}
                      placeholder="Any delivery instruction (e.g., call before delivery, landmark, preferred time)"
                      className="resize-y min-h-[72px]"
                      {...register('specialNote')}
                    />
                    {errors.specialNote && (
                      <p className="text-sm text-destructive">{errors.specialNote.message}</p>
                    )}
                  </div>

                  <Separator />
                  <p className="text-sm text-muted-foreground">You can get invoice on your email (optional)</p>

                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input id="email" type="email" placeholder="example@email.com" {...register('email')} />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Place Order'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container py-16 text-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}