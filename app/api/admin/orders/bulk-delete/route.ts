import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/schema'
import { eq, inArray } from 'drizzle-orm'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order IDs provided' },
        { status: 400 }
      )
    }

    // Start transaction to delete orders and their items
    const deletedCount = await db.transaction(async (tx) => {
      // First delete order items for all orders
      await tx.delete(orderItems).where(inArray(orderItems.orderId, ids))
      
      // Then delete the orders
      const deletedOrders = await tx
        .delete(orders)
        .where(inArray(orders.id, ids))
        .returning()

      return deletedOrders.length
    })

    return NextResponse.json({
      success: true,
      message: `${deletedCount} orders deleted successfully`,
      deletedCount
    })

  } catch (error) {
    console.error('Error bulk deleting orders:', error)
    return NextResponse.json(
      { error: 'Failed to delete orders' },
      { status: 500 }
    )
  }
}