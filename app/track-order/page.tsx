'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface TrackingEvent {
  id?: string | number
  text: string
  created_at?: string
  deliveryman?: {
    name?: string
  }
}

interface OrderItem {
  id: number
  productName: string
  productPrice: string
  productImage: string | null
  variantTitle: string | null
  variantSku: string | null
  selectedOptions: Array<{ optionName: string; valueName: string }> | null
  quantity: number
  itemTotal: string
}

interface OrderTrackingData {
  order: {
    orderId: string
    status: string
    customerName: string
    customerPhone: string
    customerAddress: string
    itemsTotal: string
    shippingCost: string
    totalAmount: string
    deliveryType: string
    promoCode: string | null
    promoCodeDiscount: string | null
    steadfastConsignmentId: string | null
    steadfastTrackingCode: string | null
    createdAt: string
    updatedAt: string
  }
  items: OrderItem[]
  steadfastStatus: {
    result?: {
      rider?: {
        name?: string
        phone?: string
      }
    }
    trackings?: TrackingEvent[]
  } | null
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

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [trackingData, setTrackingData] = useState<OrderTrackingData | null>(null)

  const handleTrackOrder = async (orderIdToTrack?: string) => {
    const targetOrderId = orderIdToTrack || orderId

    if (!targetOrderId.trim()) {
      toast.error('Please enter an order ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/orders/track?orderId=${encodeURIComponent(targetOrderId.trim())}`)
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

  // Check for orderId in URL params on mount
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId')
    if (orderIdParam) {
      setOrderId(orderIdParam)
      handleTrackOrder(orderIdParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatCurrency = (value: string) => {
    const amount = Number.parseFloat(value)
    return Number.isNaN(amount) ? value : amount.toFixed(2)
  }

  const formatDateTime = (value?: string, options?: Intl.DateTimeFormatOptions) => {
    if (!value) {
      return ''
    }

    return new Date(value).toLocaleString(
      'en-US',
      options ?? { dateStyle: 'medium', timeStyle: 'short' }
    )
  }

  const trackings = trackingData?.steadfastStatus?.trackings ?? []
  const rider = trackingData?.steadfastStatus?.result?.rider

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-10 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Track Your Order</h1>
        <p className="text-muted-foreground">
          Enter your order ID to check the latest delivery updates.
        </p>
      </div>

      <div className="rounded-2xl border bg-background/80 p-6 backdrop-blur">
        <Label htmlFor="orderId" className="sr-only">
          Order ID
        </Label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Order ID</p>
            <p className="text-sm text-muted-foreground">
              It’s in your confirmation email or SMS.
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                id="orderId"
                placeholder="e.g., KTB1234567890"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTrackOrder()
                  }
                }}
                disabled={loading}
                className="w-full"
              />
              <Button
                onClick={handleTrackOrder}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  'Track Order'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {trackingData && (
        <div className="mt-10 space-y-8">
          <section className="rounded-2xl border bg-background/80 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order information</p>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold leading-tight">
                    Order #{trackingData.order.orderId}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {`Placed ${formatDateTime(trackingData.order.createdAt, { dateStyle: 'medium' })} | Last updated ${formatDateTime(
                      trackingData.order.updatedAt,
                      { dateStyle: 'medium', timeStyle: 'short' }
                    )}`}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm font-medium capitalize">
                {statusLabels[trackingData.order.status] || trackingData.order.status}
              </Badge>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-dashed p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Items total</p>
                <p className="mt-2 text-base font-semibold">
                  TK {formatCurrency(trackingData.order.itemsTotal)}
                </p>
              </div>
              <div className="rounded-xl border border-dashed p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shipping</p>
                <p className="mt-2 text-base font-semibold">
                  TK {formatCurrency(trackingData.order.shippingCost)}
                </p>
              </div>
              <div className="rounded-xl border border-dashed p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total paid</p>
                <p className="mt-2 text-base font-semibold">
                  TK {formatCurrency(trackingData.order.totalAmount)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-background/80 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-tight">Products</h3>
              <span className="text-sm text-muted-foreground">{trackingData.items.length} items</span>
            </div>
            <Table className="mt-4">
              <TableHeader>
                <TableRow className="border-muted/80">
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackingData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      No products found for this order.
                    </TableCell>
                  </TableRow>
                ) : (
                  trackingData.items.map((item) => {
                    const optionSummary = item.selectedOptions
                      ?.map((option) => `${option.optionName}: ${option.valueName}`)
                      .join(' / ')
                    const variantLabel =
                      item.variantTitle && item.variantTitle !== 'Default Title' ? item.variantTitle : null
                    const descriptor = [variantLabel, optionSummary].filter(Boolean).join(' • ')
                    const displayName = descriptor ? `${item.productName} — ${descriptor}` : item.productName

                    return (
                      <TableRow key={item.id} className="border-muted/60">
                        <TableCell className="max-w-xs">
                          <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          TK {formatCurrency(item.productPrice)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-foreground">
                          TK {formatCurrency(item.itemTotal)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </section>

          <section className="rounded-2xl border bg-background/80 p-6">
            <h3 className="text-lg font-semibold leading-tight">Charges</h3>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Items subtotal</span>
                <span className="text-foreground">TK {formatCurrency(trackingData.order.itemsTotal)}</span>
              </div>
              {trackingData.order.promoCode &&
                trackingData.order.promoCodeDiscount &&
                Number.parseFloat(trackingData.order.promoCodeDiscount) > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Promo {trackingData.order.promoCode}</span>
                    <span>-TK {formatCurrency(trackingData.order.promoCodeDiscount)}</span>
                  </div>
                )}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-foreground">TK {formatCurrency(trackingData.order.shippingCost)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total paid</span>
                <span>TK {formatCurrency(trackingData.order.totalAmount)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-background/80 p-6">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div>
                <h3 className="text-lg font-semibold leading-tight">Delivery information</h3>
                <div className="mt-6 space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Customer</p>
                    <p className="mt-1 font-medium text-foreground">{trackingData.order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Phone</p>
                    <p className="mt-1 font-medium text-foreground">{trackingData.order.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Address</p>
                    <p className="mt-1 font-medium text-foreground">{trackingData.order.customerAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Delivery type</p>
                    <p className="mt-1 font-medium text-foreground capitalize">{trackingData.order.deliveryType}</p>
                  </div>
                  {rider?.name && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Delivery rider</p>
                      <p className="mt-1 font-medium text-foreground">{rider.name}</p>
                    </div>
                  )}
                  {rider?.phone && (
                    <Button asChild variant="outline" className="mt-2 w-full sm:w-auto">
                      <a href={`tel:${rider.phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call rider
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">Delivery updates</h3>
                    <p className="text-sm text-muted-foreground">
                      {trackings.length > 0
                        ? 'Latest activity first.'
                        : 'Updates will appear here once the parcel is moving.'}
                    </p>
                  </div>
                  {trackingData.order.steadfastTrackingCode && (
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {trackingData.order.steadfastTrackingCode}
                    </span>
                  )}
                </div>
                <div className="mt-6">
                  {trackings.length > 0 ? (
                    <ol className="space-y-6 border-l border-border/60">
                      {trackings.map((event: TrackingEvent, index: number) => (
                        <li key={event.id || index} className="relative pl-6">
                          <span
                            className={`absolute left-0 top-1.5 flex h-2.5 w-2.5 -translate-x-1/2 transform rounded-full ${
                              index === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground/60'
                            }`}
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-relaxed">{event.text}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              {event.created_at && <span>{formatDateTime(event.created_at)}</span>}
                              {event.deliveryman?.name && <span>Handled by {event.deliveryman.name}</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tracking updates yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  )
}
