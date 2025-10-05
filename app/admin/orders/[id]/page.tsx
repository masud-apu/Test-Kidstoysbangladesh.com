import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Package, User, MapPin, Phone, Mail, Calendar } from 'lucide-react'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { PaymentStatusBadge } from '@/components/orders/payment-status-badge'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const orderId = parseInt(id)

  if (isNaN(orderId)) {
    notFound()
  }

  // Fetch order details
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))

  if (!order) {
    notFound()
  }

  // Fetch order items
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">Order ID: {order.orderId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => {
                  const selectedOptions = item.selectedOptions as Array<{ optionName: string; valueName: string }> | null

                  return (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                      {/* Product Image */}
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted border">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base">{item.productName}</h3>

                        {/* Variant Information */}
                        {item.variantTitle && item.variantTitle !== 'Default Title' && (
                          <div className="mt-1 space-y-1">
                            {selectedOptions && selectedOptions.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedOptions.map((opt, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-xs font-medium">
                                    {opt.optionName}: {opt.valueName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">{item.variantTitle}</p>
                            )}
                          </div>
                        )}

                        {item.variantSku && (
                          <p className="text-xs text-muted-foreground mt-1">SKU: {item.variantSku}</p>
                        )}

                        {/* Price and Quantity */}
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            TK {parseFloat(item.productPrice).toFixed(2)} × {item.quantity}
                          </span>
                          <span className="font-semibold">
                            TK {parseFloat(item.itemTotal).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Order Summary */}
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items Total:</span>
                  <span>TK {parseFloat(order.itemsTotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping Cost:</span>
                  <span>TK {parseFloat(order.shippingCost).toFixed(2)}</span>
                </div>
                {order.promoCode && order.promoCodeDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promo Code ({order.promoCode}):</span>
                    <span>-TK {parseFloat(order.promoCodeDiscount).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>TK {parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Order Status</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Payment Status</p>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{orderDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                </div>
              </div>
              {order.customerEmail && (
                <div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium break-all">{order.customerEmail}</p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                    <p className="font-medium">{order.customerAddress}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Type</p>
                <p className="font-medium capitalize">
                  {order.deliveryType === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}
                </p>
              </div>
              {order.specialNote && (
                <div>
                  <p className="text-sm text-muted-foreground">Special Note</p>
                  <p className="text-sm bg-muted p-2 rounded-md mt-1">{order.specialNote}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
