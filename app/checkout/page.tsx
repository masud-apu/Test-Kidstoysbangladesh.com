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
import { useCartStore } from '@/lib/store'
import { checkoutSchema, type CheckoutType } from '@/lib/validations'
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle } from 'lucide-react'

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
    clearDirectBuy 
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
    
  const totalPrice = checkoutType === 'direct' && directBuyItem
    ? parseFloat(directBuyItem.price) * directBuyItem.quantity
    : getSelectedTotal()
  
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
        customerEmail: data.email,
        customerPhone: data.phone,
        customerAddress: data.address,
        customerCity: data.city,
        customerPostalCode: data.postalCode,
        items: checkoutItems,
        totalAmount: totalPrice,
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
        
        // Clear cart or direct buy item
        if (checkoutType === 'direct') {
          clearDirectBuy()
        } else {
          clearCart()
        }
      } else {
        alert('অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।')
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
          <h1 className="text-3xl font-bold font-bengali">চেকআউট</h1>
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
                      <h3 className="font-medium font-bengali line-clamp-2">{item.name}</h3>
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
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>৳{totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-bengali">শিপিং তথ্য</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      className="font-bengali"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register('address')}
                      className="font-bengali"
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      className="font-bengali"
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      {...register('postalCode')}
                    />
                    {errors.postalCode && (
                      <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'অর্ডার করুন'}
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
            <DialogTitle className="text-xl font-bold font-bengali">
              অর্ডার নিশ্চিত হয়েছে!
            </DialogTitle>
            <DialogDescription className="text-center space-y-2">
              <p className="font-bengali">
                আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।
              </p>
              <p className="font-mono text-sm">
                <strong>Order ID: #{orderId}</strong>
              </p>
              <p className="text-sm text-muted-foreground font-bengali">
                শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব।
                একটি নিশ্চিতকরণ ইমেইলও পাঠানো হয়েছে।
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