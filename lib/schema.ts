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

  // Default packing configuration (auto-filled for single-product orders)
  defaultBoxTypeId: integer('default_box_type_id').references(() => boxTypes.id),
  // Dynamic material defaults - array of {materialId, name, cost}
  defaultMaterials: json('default_materials').$type<Array<{ materialId: number; name: string; cost: string }>>().default([]),

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

// Inventory batches for FIFO tracking
export const inventoryBatches = pgTable('inventory_batches', {
  id: serial('id').primaryKey(),
  variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }).notNull(),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(), // Auto-generated or manual
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }).notNull(), // Cost per unit
  quantity: integer('quantity').notNull(), // Original quantity
  remainingQuantity: integer('remaining_quantity').notNull(), // Available quantity (decreases with sales)
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  notes: text('notes'), // Optional notes about the batch
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Box types for packing (unit cost tracked at batch level for FIFO)
export const boxTypes = pgTable('box_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  dimensions: varchar('dimensions', { length: 100 }),
  currentStock: integer('current_stock').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Box inventory transactions (audit trail)
export const boxTransactions = pgTable('box_transactions', {
  id: serial('id').primaryKey(),
  boxTypeId: integer('box_type_id').references(() => boxTypes.id).notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'purchase', 'order_use', 'damage', 'adjustment', 'revert'
  quantity: integer('quantity').notNull(), // Positive for add, negative for use
  stockBefore: integer('stock_before').notNull(),
  stockAfter: integer('stock_after').notNull(),
  orderId: integer('order_id').references(() => orders.id),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Box inventory batches (FIFO tracking)
export const boxInventoryBatches = pgTable('box_inventory_batches', {
  id: serial('id').primaryKey(),
  boxTypeId: integer('box_type_id').references(() => boxTypes.id, { onDelete: 'cascade' }).notNull(),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(), // Auto-generated or manual
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }).notNull(), // Price PER UNIT (not total batch cost)
  quantity: integer('quantity').notNull(), // Number of units purchased
  remainingQuantity: integer('remaining_quantity').notNull(), // Available units (decreases with FIFO deduction)
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  notes: text('notes'), // Optional notes (supplier, invoice, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Packing materials (cost tracked at batch level for FIFO)
export const packingMaterials = pgTable('packing_materials', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }),
  currentBalance: decimal('current_balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Packing material transactions (audit trail)
export const packingMaterialTransactions = pgTable('packing_material_transactions', {
  id: serial('id').primaryKey(),
  materialId: integer('material_id').references(() => packingMaterials.id).notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'purchase', 'order_use', 'damage', 'adjustment', 'revert'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Positive for add, negative for use
  balanceBefore: decimal('balance_before', { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
  orderId: integer('order_id').references(() => orders.id),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Packing material inventory batches (FIFO tracking)
export const packingMaterialBatches = pgTable('packing_material_batches', {
  id: serial('id').primaryKey(),
  materialId: integer('material_id').references(() => packingMaterials.id, { onDelete: 'cascade' }).notNull(),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(), // Auto-generated or manual
  purchaseAmount: decimal('purchase_amount', { precision: 10, scale: 2 }).notNull(), // TOTAL monetary value of this purchase
  remainingAmount: decimal('remaining_amount', { precision: 10, scale: 2 }).notNull(), // Remaining value (decreases with FIFO deduction)
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  notes: text('notes'), // Optional notes (supplier, invoice, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).notNull(), // What customer pays
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),

  // Shipping charges (editable per order)
  shippingChargeInsideDhaka: decimal('shipping_charge_inside_dhaka', { precision: 10, scale: 2 }).default('60.00'),
  shippingChargeOutsideDhaka: decimal('shipping_charge_outside_dhaka', { precision: 10, scale: 2 }).default('120.00'),
  actualShippingCost: decimal('actual_shipping_cost', { precision: 10, scale: 2 }), // What you actually pay (nullable for old orders)
  codCost: decimal('cod_cost', { precision: 10, scale: 2 }), // Cash on Delivery charge (1% of total amount)

  // Delivery information
  deliveryType: varchar('delivery_type', { length: 20 }).notNull(),
  deliveryPartner: varchar('delivery_partner', { length: 20 }).default('steadfast').notNull(), // 'steadfast' or 'self'
  totalWeight: decimal('total_weight', { precision: 10, scale: 2 }), // Total weight in kg (editable by admin)

  // Additional information from customer
  specialNote: text('special_note'),

  // Order creation source
  createdBy: varchar('created_by', { length: 100 }).default('website').notNull(), // 'website', 'admin', or Telegram user's full name

  // Payment status
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending').notNull(),

  // Promo code information
  promoCodeId: integer('promo_code_id').references(() => promoCodes.id),
  promoCode: varchar('promo_code', { length: 50 }),
  promoCodeDiscount: decimal('promo_code_discount', { precision: 10, scale: 2 }),

  // Expense and income tracking (nullable for old orders)
  totalPackingCharges: decimal('total_packing_charges', { precision: 10, scale: 2 }), // Sum of all packing charges
  totalPurchaseCost: decimal('total_purchase_cost', { precision: 10, scale: 2 }), // Total cost from inventory batches
  totalProfit: decimal('total_profit', { precision: 10, scale: 2 }), // totalAmount - totalPurchaseCost - totalPackingCharges - shippingCost

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

  // Cost tracking (nullable for old orders)
  purchaseCost: decimal('purchase_cost', { precision: 10, scale: 2 }), // Cost from inventory batch (FIFO)
  batchAllocations: json('batch_allocations').$type<Array<{ batchId: number; quantity: number; costPerUnit: string }>>(), // Track which batches were used

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Type for box usage in order
export type BoxUsage = {
  boxTypeId: number
  boxName: string
  quantity: number
  costPerBox: string
  totalCost: string
}

// Type for material usage in order
export type MaterialUsage = {
  materialId: number
  materialName: string
  costUsed: string
}

// Detailed packing breakdown per order
export const orderPackingDetails = pgTable('order_packing_details', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull().unique(),

  // Boxes used (can be multiple)
  boxesUsed: json('boxes_used').$type<BoxUsage[]>().default([]),

  // Packing materials used
  materialsUsed: json('materials_used').$type<MaterialUsage[]>().default([]),

  // Totals
  totalBoxCost: decimal('total_box_cost', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalMaterialCost: decimal('total_material_cost', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalPackingCost: decimal('total_packing_cost', { precision: 10, scale: 2 }).default('0.00').notNull(),

  // Tracking
  isInventoryDeducted: boolean('is_inventory_deducted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
export type InventoryBatch = typeof inventoryBatches.$inferSelect
export type NewInventoryBatch = typeof inventoryBatches.$inferInsert
export type BoxType = typeof boxTypes.$inferSelect
export type NewBoxType = typeof boxTypes.$inferInsert
export type BoxTransaction = typeof boxTransactions.$inferSelect
export type NewBoxTransaction = typeof boxTransactions.$inferInsert
export type BoxInventoryBatch = typeof boxInventoryBatches.$inferSelect
export type NewBoxInventoryBatch = typeof boxInventoryBatches.$inferInsert
export type PackingMaterial = typeof packingMaterials.$inferSelect
export type NewPackingMaterial = typeof packingMaterials.$inferInsert
export type PackingMaterialTransaction = typeof packingMaterialTransactions.$inferSelect
export type NewPackingMaterialTransaction = typeof packingMaterialTransactions.$inferInsert
export type PackingMaterialBatch = typeof packingMaterialBatches.$inferSelect
export type NewPackingMaterialBatch = typeof packingMaterialBatches.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
export type OrderPackingDetail = typeof orderPackingDetails.$inferSelect
export type NewOrderPackingDetail = typeof orderPackingDetails.$inferInsert
// Financial Transactions - Track all money movements
export const financialTransactions = pgTable('financial_transactions', {
  id: serial('id').primaryKey(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'CASH_IN', 'EXPENSE', 'INVENTORY_PURCHASE', 'ORDER_REVENUE', 'ORDER_EXPENSE'
  category: varchar('category', { length: 100 }), // For expenses: 'office', 'utilities', 'salaries', 'marketing', 'inventory', etc.
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(), // Positive for income, negative for expenses

  // Separate tracking of cash and assets
  cashBalanceAfter: decimal('cash_balance_after', { precision: 12, scale: 2 }).notNull(), // Cash balance after this transaction
  assetBalanceAfter: decimal('asset_balance_after', { precision: 12, scale: 2 }).notNull(), // Asset balance after this transaction
  balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }).notNull(), // Total balance (cash + assets) after transaction

  description: text('description').notNull(),

  // References to related entities
  orderId: integer('order_id').references(() => orders.id),
  inventoryBatchId: integer('inventory_batch_id').references(() => inventoryBatches.id),
  boxBatchId: integer('box_batch_id').references(() => boxInventoryBatches.id),
  materialBatchId: integer('material_batch_id').references(() => packingMaterialBatches.id),

  // User who created this transaction
  createdBy: integer('created_by').references(() => users.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Cash Balance - Single row table to track current balance
export const cashBalance = pgTable('cash_balance', {
  id: serial('id').primaryKey(),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type PromoCode = typeof promoCodes.$inferSelect
export type NewPromoCode = typeof promoCodes.$inferInsert
export type FinancialTransaction = typeof financialTransactions.$inferSelect
export type NewFinancialTransaction = typeof financialTransactions.$inferInsert
export type CashBalance = typeof cashBalance.$inferSelect
export type NewCashBalance = typeof cashBalance.$inferInsert