'use client'

import { useState, useEffect } from 'react'
import { OrdersTable, Order } from '@/components/orders/orders-table'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sorting, setSorting] = useState<{ field: string; order: 'asc' | 'desc' } | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, sorting])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (sorting) {
        params.append('sortField', sorting.field)
        params.append('sortOrder', sorting.order)
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch orders')

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Failed to update order status')

      toast.success('Order status updated successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const handleUpdatePaymentStatus = async (orderId: number, paymentStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      })

      if (!response.ok) throw new Error('Failed to update payment status')

      toast.success('Payment status updated successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('Failed to update payment status')
    }
  }

  const handleUpdateCustomerInfo = async (
    orderId: number,
    customerInfo: {
      customerName: string
      customerEmail: string | null
      customerPhone: string
      customerAddress: string
    }
  ) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerInfo),
      })

      if (!response.ok) throw new Error('Failed to update customer information')

      toast.success('Customer information updated successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error updating customer info:', error)
      toast.error('Failed to update customer information')
    }
  }

  const handleDeleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete order')

      toast.success('Order deleted successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order')
    }
  }

  const handleBulkDelete = async (orderIds: number[]) => {
    try {
      const response = await fetch('/api/admin/orders/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds }),
      })

      if (!response.ok) throw new Error('Failed to delete orders')

      toast.success(`${orderIds.length} order(s) deleted successfully`)
      fetchOrders()
    } catch (error) {
      console.error('Error deleting orders:', error)
      toast.error('Failed to delete orders')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      <OrdersTable
        data={orders}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
        onUpdateCustomerInfo={handleUpdateCustomerInfo}
        onDeleteOrder={handleDeleteOrder}
        onBulkDelete={handleBulkDelete}
        sorting={sorting}
        onSortingChange={setSorting}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
    </div>
  )
}
