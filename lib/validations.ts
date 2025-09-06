import { z } from 'zod'

export const productSchema = z.object({
  id: z.number(),
  handle: z.string().min(1, 'Handle is required').regex(/^[a-z0-9-]+$/, 'Handle must only contain lowercase letters, numbers, and hyphens'),
  name: z.string().min(1, 'Product name is required'),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  comparePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid compare price format').optional().nullable(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  description: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const newProductSchema = productSchema.omit({ id: true, createdAt: true, updatedAt: true })

export const cartItemSchema = productSchema.extend({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
})

export const checkoutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  // Email is optional; allow empty string
  email: z.string().email('Invalid email address').optional().or(z.literal('')).optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  // Special note is optional; allow empty string
  specialNote: z
    .string()
    .max(500, 'Special Note must be at most 500 characters')
    .optional()
    .or(z.literal(''))
    .optional(),
  // City and postal code removed per requirements
})

export type ProductType = z.infer<typeof productSchema>
export type NewProductType = z.infer<typeof newProductSchema>
export type CartItemType = z.infer<typeof cartItemSchema>
export type CheckoutType = z.infer<typeof checkoutSchema>