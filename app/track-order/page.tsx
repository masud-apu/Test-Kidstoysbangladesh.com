'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Package, TruckIcon, MapPin, Phone, User, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface OrderTrackingData {
  order: {
    orderId: string
    status: string
    customerName: string
    customerPhone: string
    customerAddress: string
    totalAmount: string
    deliveryType: string
    steadfastConsignmentId: string | null
    steadfastTrackingCode: string | null
    createdAt: string
    updatedAt: string
  }
  steadfastStatus: Record<string, unknown> | null
}

const statusLabels: Record<string, string> = {
  order_placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null)

  const handleTrackOrder = async () => {
    if (!orderId.trim()) {
      toast.error('Please enter an order ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/orders/track?orderId=${encodeURIComponent(orderId.trim())}`)
      const data = await response.json()

      if (data.success) {
        setTrackingData(data)
        toast.success('Order found!')
      } else {
        toast.error(data.message || 'Order not found')
        setTrackingData(null)
      }
    } catch (error) {
      console.error('Error tracking order:', error)
      toast.error('Failed to track order')
      setTrackingData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">
          Enter your order ID to track the delivery status
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order ID</CardTitle>
          <CardDescription>
            You can find your order ID in the confirmation email or SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="orderId" className="sr-only">Order ID</Label>
              <Input
                id="orderId"
                placeholder="e.g., KTB1234567890"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTrackOrder()
                  }
                }}
                disabled={loading}
              />
            </div>
            <Button onClick={handleTrackOrder} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Tracking...
                </>
              ) : (
                'Track Order'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {trackingData && (
        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="font-semibold text-lg">
                    {statusLabels[trackingData.order.status] || trackingData.order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Order ID:</span>
                  <span className="font-mono">{trackingData.order.orderId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount:</span>
                  <span className="font-semibold">TK {trackingData.order.totalAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Delivery Type:</span>
                  <span className="capitalize">{trackingData.order.deliveryType} Dhaka</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{trackingData.order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{trackingData.order.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                    <p className="font-medium">{trackingData.order.customerAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">
                      {new Date(trackingData.order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steadfast Tracking */}
          {trackingData.order.steadfastTrackingCode && trackingData.steadfastStatus && (
            <>
              {/* Delivery Person Info */}
              {trackingData.steadfastStatus.result?.rider && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Delivery Rider
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Rider Name</p>
                          <p className="font-medium">{trackingData.steadfastStatus.result.rider.name}</p>
                        </div>
                      </div>
                      {trackingData.steadfastStatus.result.rider.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Rider Phone</p>
                            <p className="font-medium">{trackingData.steadfastStatus.result.rider.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tracking Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TruckIcon className="h-5 w-5" />
                    Tracking History
                  </CardTitle>
                  <CardDescription>
                    Tracking ID: {trackingData.order.steadfastTrackingCode}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trackingData.steadfastStatus.trackings && trackingData.steadfastStatus.trackings.length > 0 ? (
                    <div className="relative space-y-6 pl-6">
                      {/* Timeline line */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border" />

                      {trackingData.steadfastStatus.trackings.map((event: any, index: number) => (
                        <div key={event.id || index} className="relative">
                          {/* Timeline dot */}
                          <div className={`absolute left-[-23px] top-1 h-4 w-4 rounded-full border-2 ${
                            index === 0 ? 'bg-primary border-primary' : 'bg-background border-border'
                          }`} />

                          <div className="space-y-2">
                            <p className="font-medium text-sm leading-relaxed">
                              {event.text}
                            </p>

                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              {event.created_at && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(event.created_at).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              )}

                              {event.deliveryman?.name && (
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3 w-3" />
                                  <span>{event.deliveryman.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tracking history available yet.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
