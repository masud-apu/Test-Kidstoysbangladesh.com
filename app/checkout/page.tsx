'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCartStore, type DeliveryType } from '@/lib/store'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { checkoutSchema, type CheckoutType } from '@/lib/validations'
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const checkoutType = searchParams.get('type') || 'cart'
  
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
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
        setOrderId(newOrderId)
        setShowSuccessDialog(true)
        
        // Show success toast
        toast.success('Order placed successfully!', {
          description: `Your order #${newOrderId} has been placed. You will receive a confirmation email shortly.`,
          duration: 5000,
        })
        
        // Clear cart or direct buy item
        if (checkoutType === 'direct') {
          clearDirectBuy()
        } else {
          clearCart()
        }
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
                      <span className="text-sm font-medium">৳120</span>
                    </label>
                    <label htmlFor="checkout-inside" className="flex items-center justify-between rounded-lg border p-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="inside" id="checkout-inside" />
                        <span className="text-sm">Inside Dhaka</span>
                      </div>
                      <span className="text-sm font-medium">৳60</span>
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
                      <p className="font-bold">৳{item.price}</p>
                      
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
                      <p className="font-bold">৳{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items Total:</span>
                    <span>৳{itemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>৳{shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total:</span>
                    <span>৳{totalPrice.toFixed(2)}</span>
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
                    <Input id="address" {...register('address')} />
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold">Order Confirmed!</DialogTitle>
            <DialogDescription className="text-center space-y-2">
              <p>Your order has been received successfully.</p>
              <p className="font-mono text-sm">
                <strong>Order ID: #{orderId}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                We will contact you soon. A confirmation email has also been sent.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setShowSuccessDialog(false)}>
              Continue Shopping
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cart">View Cart</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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