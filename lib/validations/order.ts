import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'order_placed', 
  'confirmed', 
  'shipped', 
  'delivered', 
  'returned',
  'canceled'
])

export const paymentStatusSchema = z.enum([
  'pending',
  'paid',
  'failed',
  'refunded'
])

// This matches the existing CartItemType structure from validations.ts
export const selectedOptionSchema = z.object({
  optionName: z.string(),
  valueName: z.string(),
})

export const cartItemForOrderSchema = z.object({
  id: z.number(),
  handle: z.string().optional(),
  name: z.string().optional(), // Legacy field, optional for backward compatibility
  title: z.string(), // New required field
  price: z.string().optional(), // Legacy field, optional since price is now in variants
  comparePrice: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  description: z.string().optional().nullable(),
  quantity: z.number().min(1),
  // Variant-specific fields
  variantId: z.number().optional(),
  variantTitle: z.string().optional(),
  variantSku: z.string().nullable().optional(),
  variantPrice: z.string().optional(),
  variantCompareAtPrice: z.string().nullable().optional(),
  selectedOptions: z.array(selectedOptionSchema).optional(),
  // Optional fields that may be present as strings or dates
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
})

export const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional().or(z.literal('')).optional().nullable(),
  customerPhone: z.string().min(10),
  customerAddress: z.string().min(10),
  specialNote: z.string().optional().nullable(),
  items: z.array(cartItemForOrderSchema).min(1),
  shippingCost: z.number().min(0),
  totalAmount: z.number().min(0),
  deliveryType: z.enum(['inside', 'outside']),
  paymentStatus: paymentStatusSchema.default('pending'),
  orderId: z.string(),
  // Promo code fields
  promoCodeId: z.number().optional().nullable(),
  promoCode: z.string().optional().nullable(),
  promoCodeDiscount: z.number().optional().nullable(),
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

export const updateOrderPaymentStatusSchema = z.object({
  paymentStatus: paymentStatusSchema,
})

export const updateOrderCustomerInfoSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().min(10),
  customerAddress: z.string().min(10),
  specialNote: z.string().optional().nullable(),
})

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type CreateOrderData = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusData = z.infer<typeof updateOrderStatusSchema>
export type UpdateOrderPaymentStatusData = z.infer<typeof updateOrderPaymentStatusSchema>
export type UpdateOrderCustomerInfoData = z.infer<typeof updateOrderCustomerInfoSchema>
export type OrderItemData = z.infer<typeof orderItemSchema>