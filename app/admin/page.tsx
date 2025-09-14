import Link from 'next/link'
import { getCurrentUser } from '@/lib/get-user'
import { db } from '@/lib/db'
import { orders, products } from '@/lib/schema'
import { desc, sql, count } from 'drizzle-orm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { DashboardActions } from '@/components/dashboard-actions'
import { Package, ShoppingCart, TrendingUp, ArrowUpRight } from 'lucide-react'


export default async function AdminDashboard() {
  const user = await getCurrentUser()
  
  if (!user) {
    return <div>Unauthorized</div>
  }

  // Get dashboard stats
  const [ordersCount, productsCount, recentOrders] = await Promise.all([
    db.select({ count: count() }).from(orders),
    db.select({ count: count() }).from(products),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5)
  ])

  // Calculate revenue (orders that are delivered or confirmed)
  const revenueResult = await db.select({
    revenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
  }).from(orders).where(
    sql`${orders.status} IN ('delivered', 'confirmed')`
  )

  const totalOrders = ordersCount[0]?.count || 0
  const totalProducts = productsCount[0]?.count || 0
  const totalRevenue = parseFloat(revenueResult[0]?.revenue || '0')

  // Get orders by status for quick stats
  const ordersByStatus = await db.select({
    status: orders.status,
    count: count()
  }).from(orders).groupBy(orders.status)


  const pendingOrders = ordersByStatus.find(s => s.status === 'order_placed')?.count || 0
  const confirmedOrders = ordersByStatus.find(s => s.status === 'confirmed')?.count || 0

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.username}! Here&apos;s an overview of your store.
          </p>
        </div>
        <DashboardActions />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From delivered orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders} pending, {confirmedOrders} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Active products in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {pendingOrders}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders from your customers
            </CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/admin/orders">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderId}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customerPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status as "order_placed" | "confirmed" | "shipped" | "delivered" | "returned" | "canceled"} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ৳{parseFloat(order.totalAmount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No orders yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Overview</CardTitle>
          <CardDescription>
            Current status distribution of all orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {ordersByStatus.map((statusGroup) => (
              <div key={statusGroup.status} className="text-center">
                <div className="text-2xl font-bold">{statusGroup.count}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {statusGroup.status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}