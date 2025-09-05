"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge } from "./order-status-badge"
import { Order } from "./orders-table"
import { OrderItem } from "@/lib/schema"
import { updateOrderCustomerInfoSchema, UpdateOrderCustomerInfoData } from "@/lib/validations/order"

interface OrderDetailsDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus: (id: number, status: string) => void
  onUpdateCustomerInfo: (id: number, customerInfo: { customerName: string; customerEmail: string | null; customerPhone: string; customerAddress: string }) => void
}

const statusOptions = [
  { value: "order_placed", label: "Order Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
  { value: "canceled", label: "Canceled" },
]

export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  onUpdateCustomerInfo,
}: OrderDetailsDialogProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOrderCustomerInfoData>({
    resolver: zodResolver(updateOrderCustomerInfoSchema),
  })

  useEffect(() => {
    if (order && open) {
      setSelectedStatus(order.status)
      setIsEditingCustomer(false)
      reset({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
      })
      fetchOrderItems(order.id)
    }
  }, [order, open, reset])

  const fetchOrderItems = async (orderId: number) => {
    try {
      setIsLoadingItems(true)
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) throw new Error("Failed to fetch order items")
      
      const data = await response.json()
      setOrderItems(data.items || [])
    } catch (error) {
      console.error("Error fetching order items:", error)
    } finally {
      setIsLoadingItems(false)
    }
  }

  const handleStatusUpdate = () => {
    if (order && selectedStatus !== order.status) {
      onUpdateStatus(order.id, selectedStatus)
      onOpenChange(false)
    }
  }

  const onSubmitCustomerInfo = async (data: UpdateOrderCustomerInfoData) => {
    if (order) {
      await onUpdateCustomerInfo(order.id, data)
      setIsEditingCustomer(false)
    }
  }

  if (!order) return null

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - {order.orderId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Customer Information</h3>
                  {!isEditingCustomer ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingCustomer(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingCustomer(false)
                          reset({
                            customerName: order.customerName,
                            customerEmail: order.customerEmail,
                            customerPhone: order.customerPhone,
                            customerAddress: order.customerAddress,
                          })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit(onSubmitCustomerInfo)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>
                
                {!isEditingCustomer ? (
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {order.customerName}</div>
                    <div><span className="font-medium">Phone:</span> {order.customerPhone}</div>
                    {order.customerEmail && (
                      <div><span className="font-medium">Email:</span> {order.customerEmail}</div>
                    )}
                    <div><span className="font-medium">Address:</span> {order.customerAddress}</div>
                    <div><span className="font-medium">Delivery:</span> {order.deliveryType === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}</div>
                  </div>
                ) : (
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Name</Label>
                      <Input
                        id="customerName"
                        {...register("customerName")}
                        className="mt-1"
                      />
                      {errors.customerName && (
                        <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="customerPhone">Phone</Label>
                      <Input
                        id="customerPhone"
                        {...register("customerPhone")}
                        className="mt-1"
                      />
                      {errors.customerPhone && (
                        <p className="text-sm text-red-500 mt-1">{errors.customerPhone.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="customerEmail">Email (Optional)</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        {...register("customerEmail")}
                        className="mt-1"
                      />
                      {errors.customerEmail && (
                        <p className="text-sm text-red-500 mt-1">{errors.customerEmail.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="customerAddress">Address</Label>
                      <Textarea
                        id="customerAddress"
                        {...register("customerAddress")}
                        className="mt-1"
                        rows={3}
                      />
                      {errors.customerAddress && (
                        <p className="text-sm text-red-500 mt-1">{errors.customerAddress.message}</p>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Order ID:</span> {order.orderId}</div>
                  <div><span className="font-medium">Date:</span> {orderDate}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Update Status</h3>
                <div className="flex items-center gap-2">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleStatusUpdate}
                    disabled={selectedStatus === order.status}
                    size="sm"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-4">Order Items</h3>
            {isLoadingItems ? (
              <div className="text-center py-4">Loading items...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>
                        {item.productImage ? (
                          <img // eslint-disable-line @next/next/no-img-element
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">৳{parseFloat(item.productPrice)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">৳{parseFloat(item.itemTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Items Total:</span>
              <span>৳{parseFloat(order.itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping Cost:</span>
              <span>৳{parseFloat(order.shippingCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span>৳{parseFloat(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}