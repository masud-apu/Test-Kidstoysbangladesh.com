import { pgTable, serial, varchar, decimal, text, timestamp, json, integer, boolean } from 'drizzle-orm/pg-core'

// Type for media items (images and videos)
export type MediaItem = {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string; // Optional thumbnail for videos
}

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  handle: varchar('handle', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  vendor: varchar('vendor', { length: 255 }),
  productType: varchar('product_type', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, draft, archived
  tags: json('tags').$type<string[]>().default([]),
  images: json('images').$type<(string | MediaItem)[]>().default([]), // Support both legacy string URLs and new MediaItem objects
  tracksInventory: boolean('tracks_inventory').default(true).notNull(),
  hasOnlyDefaultVariant: boolean('has_only_default_variant').default(true).notNull(),
  totalInventory: integer('total_inventory').default(0).notNull(),
  completedOrders: integer('completed_orders').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
})

export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).default('Default Title').notNull(),
  sku: varchar('sku', { length: 255 }),
  barcode: varchar('barcode', { length: 255 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  inventoryQuantity: integer('inventory_quantity').default(0).notNull(),
  inventoryPolicy: varchar('inventory_policy', { length: 50 }).default('deny').notNull(), // deny, continue
  position: integer('position').default(1).notNull(),
  image: varchar('image', { length: 500 }),
  availableForSale: boolean('available_for_sale').default(true).notNull(),
  requiresShipping: boolean('requires_shipping').default(true).notNull(),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  weightUnit: varchar('weight_unit', { length: 20 }).default('kg'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const productOptions = pgTable('product_options', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  position: integer('position').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const productOptionValues = pgTable('product_option_values', {
  id: serial('id').primaryKey(),
  optionId: integer('option_id').references(() => productOptions.id, { onDelete: 'cascade' }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  image: varchar('image', { length: 500 }),
  position: integer('position').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const variantSelectedOptions = pgTable('variant_selected_options', {
  id: serial('id').primaryKey(),
  variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }).notNull(),
  optionId: integer('option_id').references(() => productOptions.id, { onDelete: 'cascade' }).notNull(),
  optionValueId: integer('option_value_id').references(() => productOptionValues.id, { onDelete: 'cascade' }).notNull(),
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 50 }).notNull().unique(),
  status: varchar('status', { length: 50 }).default('order_placed').notNull(),
  
  // Customer information
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }).notNull(),
  customerAddress: text('customer_address').notNull(),
  
  // Order totals
  itemsTotal: decimal('items_total', { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Delivery information
  deliveryType: varchar('delivery_type', { length: 20 }).notNull(),
  
  // Additional information from customer
  specialNote: text('special_note'),
  
  // Payment status
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending').notNull(),

  // Promo code information
  promoCodeId: integer('promo_code_id').references(() => promoCodes.id),
  promoCode: varchar('promo_code', { length: 50 }),
  promoCodeDiscount: decimal('promo_code_discount', { precision: 10, scale: 2 }),

  // Invoice PDF URL
  invoiceUrl: varchar('invoice_url', { length: 500 }),

  // Paid receipt PDF URL
  paidReceiptUrl: varchar('paid_receipt_url', { length: 500 }),

  // Steadfast delivery tracking
  steadfastConsignmentId: varchar('steadfast_consignment_id', { length: 100 }),
  steadfastTrackingCode: varchar('steadfast_tracking_code', { length: 100 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  variantId: integer('variant_id').references(() => productVariants.id),

  // Product snapshot (in case product changes after order)
  productName: varchar('product_name', { length: 255 }).notNull(),
  productPrice: decimal('product_price', { precision: 10, scale: 2 }).notNull(),
  productImage: varchar('product_image', { length: 500 }),

  // Variant snapshot
  variantTitle: varchar('variant_title', { length: 255 }),
  variantSku: varchar('variant_sku', { length: 255 }),
  selectedOptions: json('selected_options').$type<Array<{ optionName: string; valueName: string }>>(),

  quantity: integer('quantity').notNull(),
  itemTotal: decimal('item_total', { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const promoCodes = pgTable('promo_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),

  // Discount configuration
  discountType: varchar('discount_type', { length: 20 }).notNull(), // 'percentage' or 'fixed'
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  maxDiscountAmount: decimal('max_discount_amount', { precision: 10, scale: 2 }), // For percentage discounts with ceiling

  // Usage configuration
  isOneTimeUse: boolean('is_one_time_use').default(false).notNull(),
  usageLimit: integer('usage_limit'), // null for unlimited
  usedCount: integer('used_count').default(0).notNull(),

  // Scope configuration
  isStoreWide: boolean('is_store_wide').default(true).notNull(),
  applicableProducts: json('applicable_products').$type<number[]>().default([]), // Product IDs

  // Status and timing
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ProductVariant = typeof productVariants.$inferSelect
export type NewProductVariant = typeof productVariants.$inferInsert
export type ProductOption = typeof productOptions.$inferSelect
export type NewProductOption = typeof productOptions.$inferInsert
export type ProductOptionValue = typeof productOptionValues.$inferSelect
export type NewProductOptionValue = typeof productOptionValues.$inferInsert
export type VariantSelectedOption = typeof variantSelectedOptions.$inferSelect
export type NewVariantSelectedOption = typeof variantSelectedOptions.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
export type PromoCode = typeof promoCodes.$inferSelect
export type NewPromoCode = typeof promoCodes.$inferInsert