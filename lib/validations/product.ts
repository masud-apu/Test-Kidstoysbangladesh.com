import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Product name too long"),
  handle: z.string().min(1, "Handle is required").max(255, "Handle too long")
    .regex(/^[a-z0-9-]+$/, "Handle must contain only lowercase letters, numbers, and hyphens"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  actualPrice: z.string().optional().refine((val) => {
    if (!val || val === "") return true
    return !isNaN(Number(val)) && Number(val) > 0
  }, {
    message: "Actual price must be a positive number",
  }),
  comparePrice: z.string().optional().refine((val) => {
    if (!val || val === "") return true
    return !isNaN(Number(val)) && Number(val) > 0
  }, {
    message: "Compare price must be a positive number",
  }),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Quantity must be a non-negative number",
  }).default("1"),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url("Invalid image URL")).default([]),
})

export const updateProductSchema = productSchema.partial().extend({
  id: z.number().positive("Invalid product ID"),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.number().positive("Invalid product ID")).min(1, "At least one product must be selected"),
})

export const csvImportSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  handle: z.string().min(1, "Handle is required"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  actualPrice: z.string().optional(),
  comparePrice: z.string().optional(),
  quantity: z.string().optional().refine((val) => {
    if (!val || val === "") return true
    return !isNaN(Number(val)) && Number(val) >= 0
  }, {
    message: "Quantity must be a non-negative number",
  }),
  description: z.string().optional(),
  tags: z.string().optional(), // CSV will be comma-separated string
  images: z.string().optional(), // CSV will be comma-separated URLs
})

export type ProductFormData = z.infer<typeof productSchema>
export type UpdateProductData = z.infer<typeof updateProductSchema>
export type BulkDeleteData = z.infer<typeof bulkDeleteSchema>
export type CsvImportData = z.infer<typeof csvImportSchema>