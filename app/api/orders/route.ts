import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/schema'
import { createOrderSchema } from '@/lib/validations/order'
import { sendOrderConfirmationEmails, type OrderData } from '@/lib/email'
import { eq, sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the incoming data with our schema
    const validatedData = createOrderSchema.parse(body)

    // Calculate items total from cart items
    const itemsTotal = validatedData.items.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity)
    }, 0)

    // Start database transaction
    const result = await db.transaction(async (tx) => {
      // 1. Insert order
      const [newOrder] = await tx.insert(orders).values({
        orderId: validatedData.orderId,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail || null,
        customerPhone: validatedData.customerPhone,
        customerAddress: validatedData.customerAddress,
        itemsTotal: itemsTotal.toString(),
        shippingCost: validatedData.shippingCost.toString(),
        totalAmount: validatedData.totalAmount.toString(),
        deliveryType: validatedData.deliveryType,
        status: 'order_placed',
      }).returning()

      // 2. Transform cart items to order items and insert
      const orderItemsData = validatedData.items.map(item => {
        const itemTotal = parseFloat(item.price) * item.quantity
        return {
          orderId: newOrder.id,
          productId: item.id, // CartItem uses 'id' not 'productId'
          productName: item.name, // CartItem uses 'name' not 'productName'
          productPrice: item.price, // Already a string
          productImage: item.images?.[0] || null, // Get first image
          quantity: item.quantity,
          itemTotal: itemTotal.toString(),
        }
      })

      await tx.insert(orderItems).values(orderItemsData)

      // 3. Update product quantities (subtract ordered quantities)
      for (const item of validatedData.items) {
        await tx
          .update(products)
          .set({
            quantity: sql`${products.quantity} - ${item.quantity}`,
            updatedAt: sql`now()`
          })
          .where(eq(products.id, item.id))
      }

      return newOrder
    })

    // 4. Prepare data for email service (items are already in the correct CartItemType format)
    // Normalize items to CartItemType shape (ensure Date types)
    const normalizedItems = validatedData.items.map((item) => ({
      ...item,
      createdAt: typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt,
      updatedAt: typeof item.updatedAt === 'string' ? new Date(item.updatedAt) : item.updatedAt,
    }))

    const emailOrderData: OrderData = {
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone,
      customerAddress: validatedData.customerAddress,
      items: normalizedItems, // Ensure correct types for email service
      itemsTotal: itemsTotal,
      shippingCost: validatedData.shippingCost,
      totalAmount: validatedData.totalAmount,
      orderId: validatedData.orderId,
    }

    // 5. Send confirmation emails
    const emailResult = await sendOrderConfirmationEmails(emailOrderData)

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: emailResult.success 
        ? 'Order placed successfully and confirmation emails sent!'
        : 'Order placed successfully but email sending failed',
      emailSent: emailResult.success,
    })

  } catch (error) {
    console.error('Order processing error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process order',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
