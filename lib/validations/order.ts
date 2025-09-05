import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'order_placed', 
  'confirmed', 
  'shipped', 
  'delivered', 
  'returned',
  'canceled'
])

// This matches the existing CartItemType structure from validations.ts
export const cartItemForOrderSchema = z.object({
  id: z.number(),
  handle: z.string(),
  name: z.string(),
  price: z.string(),
  comparePrice: z.string().optional().nullable(),
  tags: z.array(z.string()),
  images: z.array(z.string()),
  description: z.string().optional().nullable(),
  quantity: z.number().min(1),
  // Optional fields that may be present as strings or dates
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
})

export const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional().or(z.literal('')).optional().nullable(),
  customerPhone: z.string().min(10),
  customerAddress: z.string().min(10),
  items: z.array(cartItemForOrderSchema).min(1),
  shippingCost: z.number().min(0),
  totalAmount: z.number().min(0),
  deliveryType: z.enum(['inside', 'outside']),
  orderId: z.string(),
})

// Internal schema for database operations
export const orderItemSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  productPrice: z.string(),
  productImage: z.string().optional().nullable(),
  quantity: z.number().min(1),
  itemTotal: z.number(),
})

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
})

export const updateOrderCustomerInfoSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().min(10),
  customerAddress: z.string().min(10),
})

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type CreateOrderData = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusData = z.infer<typeof updateOrderStatusSchema>
export type UpdateOrderCustomerInfoData = z.infer<typeof updateOrderCustomerInfoSchema>
export type OrderItemData = z.infer<typeof orderItemSchema>