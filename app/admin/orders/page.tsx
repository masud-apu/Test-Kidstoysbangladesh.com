"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { usePersistentState, usePersistentObject } from "@/hooks/use-persistent-state"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { OrdersTable, Order } from "@/components/orders/orders-table"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Persistent pagination preferences
  const [paginationPrefs, setPaginationPrefs] = usePersistentObject("admin-orders-pagination", {
    limit: 25,
  })
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: paginationPrefs.limit,
    total: 0,
    totalPages: 0,
  })
  
  const [search, setSearch] = usePersistentState("admin-orders-search", "")
  const [sortBy, setSortBy] = usePersistentState("admin-orders-sortBy", "createdAt")
  const [sortOrder, setSortOrder] = usePersistentState("admin-orders-sortOrder", "desc")
  const [statusFilter, setStatusFilter] = usePersistentState("admin-orders-statusFilter", "all")
  
  // Prevent duplicate calls during React Strict Mode or rapid state changes
  const fetchingRef = useRef(false)

  const fetchOrders = async () => {
    // Prevent duplicate calls
    if (fetchingRef.current) {
      return
    }

    try {
      fetchingRef.current = true
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        sortBy,
        sortOrder,
        status: statusFilter === "all" ? "" : statusFilter,
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      if (!response.ok) throw new Error("Failed to fetch orders")

      const data = await response.json()
      setOrders(data.orders)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }

  // Update pagination limit when preferences change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      limit: paginationPrefs.limit,
      page: 1 // Reset to first page when changing limit
    }))
  }, [paginationPrefs.limit])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to first page when search changes
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        fetchOrders()
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [search])

  // Fetch orders when pagination, sortBy, sortOrder, or statusFilter changes
  useEffect(() => {
    fetchOrders()
  }, [pagination.page, pagination.limit, sortBy, sortOrder, statusFilter])

  const handleUpdateOrderStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Failed to update order status")

      toast.success("Order status updated successfully")
      fetchOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
      toast.error("Failed to update order status")
    }
  }

  const handleUpdatePaymentStatus = async (id: number, paymentStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      })

      if (!response.ok) throw new Error("Failed to update payment status")

      toast.success("Payment status updated successfully")
      fetchOrders()
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast.error("Failed to update payment status")
    }
  }

  const handleUpdateCustomerInfo = async (id: number, customerInfo: { customerName: string; customerEmail: string | null; customerPhone: string; customerAddress: string }) => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerInfo),
      })

      if (!response.ok) throw new Error("Failed to update customer information")

      toast.success("Customer information updated successfully")
      fetchOrders()
    } catch (error) {
      console.error("Error updating customer information:", error)
      toast.error("Failed to update customer information")
    }
  }

  const handlePaginationChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPaginationPrefs({ limit: pageSize })
    setPagination(prev => ({ 
      ...prev, 
      limit: pageSize, 
      page: 1 // Reset to first page when changing page size
    }))
  }

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue)
  }

  const handleSearchSubmit = (searchValue: string) => {
    // Immediately trigger search on Enter press (bypass debounce)
    setSearch(searchValue)
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      // Force immediate fetch by temporarily setting search to trigger useEffect
      fetchOrders()
    }
  }

  const handleSortingChange = (field: string, order: "asc" | "desc") => {
    setSortBy(field)
    setSortOrder(order)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleDeleteOrder = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete order")

      toast.success("Order deleted successfully")
      fetchOrders()
    } catch (error) {
      console.error("Error deleting order:", error)
      toast.error("Failed to delete order")
    }
  }

  const handleBulkDeleteOrders = async (ids: number[]) => {
    try {
      const response = await fetch(`/api/admin/orders/bulk-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) throw new Error("Failed to delete orders")

      const result = await response.json()
      toast.success(`${result.deletedCount} orders deleted successfully`)
      fetchOrders()
    } catch (error) {
      console.error("Error bulk deleting orders:", error)
      toast.error("Failed to delete orders")
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and track their status
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <OrdersTable
          data={orders}
          onUpdateStatus={handleUpdateOrderStatus}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onUpdateCustomerInfo={handleUpdateCustomerInfo}
          onDelete={handleDeleteOrder}
          onBulkDelete={handleBulkDeleteOrders}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onPageSizeChange={handlePageSizeChange}
          search={search}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          sorting={{ field: sortBy, order: sortOrder as "asc" | "desc" }}
          onSortingChange={handleSortingChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
        />
      )}
    </div>
  )
}