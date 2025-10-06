import { z } from 'zod'

export const productSchema = z.object({
  id: z.number(),
  handle: z.string().min(1, 'Handle is required').regex(/^[a-z0-9-]+$/, 'Handle must only contain lowercase letters, numbers, and hyphens'),
  name: z.string().optional(), // Legacy field, kept for backward compatibility
  title: z.string().min(1, 'Product title is required'),
  price: z.string().optional(), // Legacy field, now price is in variants
  comparePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid compare price format').optional().nullable(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  description: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const newProductSchema = productSchema.omit({ id: true, createdAt: true, updatedAt: true })

export const selectedOptionSchema = z.object({
  optionName: z.string(),
  valueName: z.string(),
})

export const cartItemSchema = productSchema.extend({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  // Variant-specific fields (optional)
  variantId: z.number().optional(),
  variantTitle: z.string().optional(),
  variantSku: z.string().nullable().optional(),
  variantPrice: z.string().optional(),
  variantCompareAtPrice: z.string().nullable().optional(),
  selectedOptions: z.array(selectedOptionSchema).optional(),
})

export const checkoutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  // Email is optional; allow empty string
  email: z.string().email('Invalid email address').optional().or(z.literal('')).optional(),
  phone: z
    .string()
    .regex(/^[0-9]{11}$/, 'Phone number must be exactly 11 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  // Special note is optional; allow empty string
  specialNote: z
    .string()
    .max(500, 'Special Note must be at most 500 characters')
    .optional()
    .or(z.literal(''))
    .optional(),
  // Promo code is optional
  promoCode: z
    .string()
    .max(50, 'Promo code must be at most 50 characters')
    .optional()
    .or(z.literal(''))
    .optional(),
  // City and postal code removed per requirements
})

export type ProductType = z.infer<typeof productSchema>
export type NewProductType = z.infer<typeof newProductSchema>
export type CartItemType = z.infer<typeof cartItemSchema>
export type CheckoutType = z.infer<typeof checkoutSchema>