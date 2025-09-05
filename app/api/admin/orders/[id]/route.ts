import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { updateOrderStatusSchema, updateOrderCustomerInfoSchema } from '@/lib/validations/order'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)

    // Get order with items
    const orderData = await db.select().from(orders).where(eq(orders.id, orderId))
    
    if (orderData.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderItemsData = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))

    return NextResponse.json({
      order: orderData[0],
      items: orderItemsData
    })

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    const body = await request.json()

    // Check if this is a status update or customer info update
    if (body.status) {
      // Validate status update
      const validatedData = updateOrderStatusSchema.parse(body)

      // Update order status
      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: validatedData.status,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning()

      if (!updatedOrder) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      // If status is confirmed, update product completedOrders count
      if (validatedData.status === 'confirmed') {
        // Get all order items for this order
        const orderItemsData = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId))

        // Update each product's completedOrders count
        for (const item of orderItemsData) {
          await db
            .update(products)
            .set({
              completedOrders: sql`${products.completedOrders} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId))
        }
      }

      return NextResponse.json({
        success: true,
        order: updatedOrder
      })

    } else {
      // Validate customer info update
      const validatedData = updateOrderCustomerInfoSchema.parse(body)

      // Update customer information
      const [updatedOrder] = await db
        .update(orders)
        .set({
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail,
          customerPhone: validatedData.customerPhone,
          customerAddress: validatedData.customerAddress,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning()

      if (!updatedOrder) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        order: updatedOrder
      })
    }

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)

    // Start transaction to delete order and its items
    await db.transaction(async (tx) => {
      // First delete order items
      await tx.delete(orderItems).where(eq(orderItems.orderId, orderId))
      
      // Then delete the order
      const [deletedOrder] = await tx
        .delete(orders)
        .where(eq(orders.id, orderId))
        .returning()

      if (!deletedOrder) {
        throw new Error('Order not found')
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}