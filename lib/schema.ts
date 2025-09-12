import { pgTable, serial, varchar, decimal, text, timestamp, json, integer } from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  handle: varchar('handle', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  actualPrice: decimal('actual_price', { precision: 10, scale: 2 }),
  comparePrice: decimal('compare_price', { precision: 10, scale: 2 }),
  quantity: integer('quantity').default(1).notNull(),
  completedOrders: integer('completed_orders').default(0).notNull(),
  tags: json('tags').$type<string[]>().default([]),
  images: json('images').$type<string[]>().default([]),
  description: text('description'),
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
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Delivery information
  deliveryType: varchar('delivery_type', { length: 20 }).notNull(),
  
  // Additional information from customer
  specialNote: text('special_note'),
  
  // Payment status
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending').notNull(),
  
  // Invoice PDF URL
  invoiceUrl: varchar('invoice_url', { length: 500 }),
  
  // Paid receipt PDF URL
  paidReceiptUrl: varchar('paid_receipt_url', { length: 500 }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  
  // Product snapshot (in case product changes after order)
  productName: varchar('product_name', { length: 255 }).notNull(),
  productPrice: decimal('product_price', { precision: 10, scale: 2 }).notNull(),
  productImage: varchar('product_image', { length: 500 }),
  
  quantity: integer('quantity').notNull(),
  itemTotal: decimal('item_total', { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert