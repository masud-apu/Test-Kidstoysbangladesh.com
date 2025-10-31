import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, User, ShoppingBag } from 'lucide-react'

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

export default async function AccountPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const ordersData = await getCustomerOrders(session.user.sessionToken)
  const orders = ordersData.orders || []
  const recentOrders = orders.slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{session.user.name ? `, ${session.user.name}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Manage your orders and account settings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {session.user.name ? 'Complete' : 'Incomplete'}
            </div>
            <p className="text-xs text-muted-foreground">
              {session.user.name ? 'All details filled' : 'Add your name'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Your latest orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Start shopping to see your orders here
              </p>
              <Button asChild className="mt-4">
                <Link href="/">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-semibold">{order.orderId}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm">
                      <span className="capitalize">{order.status.replace('_', ' ')}</span>
                      {' • '}
                      <span className="font-semibold">৳{order.totalAmount}</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/track-order?orderId=${order.orderId}`}>
                      Track Order
                    </Link>
                  </Button>
                </div>
              ))}
              {orders.length > 3 && (
                <Button variant="link" asChild className="w-full">
                  <Link href="/account/orders">View all orders</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
