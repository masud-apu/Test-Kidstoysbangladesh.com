import { z } from "zod"

export const promoCodeSchema = z.object({
  name: z.string().min(1, "Promo code name is required").max(255, "Name too long"),
  code: z.string().min(1, "Promo code is required").max(50, "Code too long")
    .regex(/^[A-Z0-9-_]+$/, "Code must contain only uppercase letters, numbers, hyphens, and underscores"),
  discountType: z.enum(["percentage", "fixed"], {
    message: "Discount type is required",
  }),
  discountValue: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Discount value must be a positive number",
  }),
  maxDiscountAmount: z.string().optional().refine((val) => {
    if (!val || val === "") return true
    return !isNaN(Number(val)) && Number(val) > 0
  }, {
    message: "Max discount amount must be a positive number",
  }),
  isOneTimeUse: z.boolean().default(false),
  usageLimit: z.string().optional().refine((val) => {
    if (!val || val === "") return true
    return !isNaN(Number(val)) && Number(val) > 0
  }, {
    message: "Usage limit must be a positive number",
  }),
  isStoreWide: z.boolean().default(true),
  applicableProducts: z.array(z.number()).default([]),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional().refine((val) => {
    if (!val || val === "") return true
    const date = new Date(val)
    return !isNaN(date.getTime()) && date > new Date()
  }, {
    message: "Expiry date must be in the future",
  }),
}).refine((data) => {
  if (data.discountType === "percentage") {
    const discountValue = Number(data.discountValue)
    return discountValue > 0 && discountValue <= 100
  }
  return true
}, {
  message: "Percentage discount must be between 1 and 100",
  path: ["discountValue"],
}).refine((data) => {
  if (!data.isStoreWide && data.applicableProducts.length === 0) {
    return false
  }
  return true
}, {
  message: "Product-specific promo codes must have at least one applicable product",
  path: ["applicableProducts"],
})

export const updatePromoCodeSchema = promoCodeSchema.partial().extend({
  id: z.number().positive("Invalid promo code ID"),
})

export const bulkDeletePromoCodesSchema = z.object({
  ids: z.array(z.number().positive("Invalid promo code ID")).min(1, "At least one promo code must be selected"),
})

export type PromoCodeFormData = z.infer<typeof promoCodeSchema>
export type UpdatePromoCodeData = z.infer<typeof updatePromoCodeSchema>
export type BulkDeletePromoCodesData = z.infer<typeof bulkDeletePromoCodesSchema>