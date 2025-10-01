import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { SteadfastService } from '@/lib/steadfast'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order from database
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderId, orderId))
      .limit(1)

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Get tracking status from Steadfast if available
    let steadfastStatus = null
    if (order.steadfastTrackingCode) {
      try {
        steadfastStatus = await SteadfastService.getStatusByInvoice(orderId)
      } catch (error) {
        console.error('Error fetching Steadfast status:', error)
        // Continue without Steadfast status
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        status: order.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        totalAmount: order.totalAmount,
        deliveryType: order.deliveryType,
        steadfastConsignmentId: order.steadfastConsignmentId,
        steadfastTrackingCode: order.steadfastTrackingCode,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      steadfastStatus,
    })
  } catch (error) {
    console.error('Order tracking error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch order tracking information',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
