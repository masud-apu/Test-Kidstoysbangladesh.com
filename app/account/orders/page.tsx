import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, ExternalLink } from 'lucide-react'

async function getCustomerOrders(sessionToken: string) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'

  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/orders`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return { orders: [] }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return { orders: [] }
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'delivered':
      return 'default'
    case 'shipped':
      return 'secondary'
    case 'confirmed':
      return 'outline'
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default async function OrdersPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const ordersData = await getCustomerOrders(session.user.sessionToken)
  const orders = ordersData.orders || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground">
          View and track all your orders
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              You haven&apos;t placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button asChild>
              <Link href="/">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{order.orderId}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/track-order?orderId=${order.orderId}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Track
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.productName} {item.variantTitle && `(${item.variantTitle})`} × {item.quantity}
                          </span>
                          <span className="font-medium">৳{item.itemTotal}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No items found</p>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{order.itemsTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>৳{order.shippingCost}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span>৳{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-1">Shipping Address</p>
                    <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
