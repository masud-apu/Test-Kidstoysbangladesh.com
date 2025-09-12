import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { updateOrderStatusSchema, updateOrderPaymentStatusSchema, updateOrderCustomerInfoSchema } from '@/lib/validations/order'
import { sendPaymentConfirmationEmail, type OrderData } from '@/lib/email'
import { sendOrderStatusUpdateEmail } from '@/lib/email-simple'

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

    // Check if this is a status update, payment status update, or customer info update
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

      // Send status update email to customer if available
      try {
        if (updatedOrder.customerEmail) {
          console.log(`📧 Sending status update email for order ${updatedOrder.orderId} - Status: ${validatedData.status}`)
          const emailResult = await sendOrderStatusUpdateEmail({
            to: updatedOrder.customerEmail,
            customerName: updatedOrder.customerName,
            orderId: updatedOrder.orderId,
            status: validatedData.status,
          })
          if (emailResult.success) {
            console.log(`✅ Status update email sent successfully for order ${updatedOrder.orderId}`)
          } else {
            console.error(`❌ Failed to send status update email for order ${updatedOrder.orderId}`)
          }
        } else {
          console.log(`⚠️ No email address for order ${updatedOrder.orderId}, skipping email notification`)
        }
      } catch (e) {
        console.error('Failed to send status update email:', e)
      }

      return NextResponse.json({
        success: true,
        order: updatedOrder
      })

    } else if (body.paymentStatus) {
      // Validate payment status update
      const validatedData = updateOrderPaymentStatusSchema.parse(body)

      // Update payment status
      const [updatedOrder] = await db
        .update(orders)
        .set({
          paymentStatus: validatedData.paymentStatus,
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

      // If payment status is changed to "paid", send confirmation email
      if (validatedData.paymentStatus === 'paid' && updatedOrder.customerEmail) {
        try {
          // Get order items for email
          const orderItemsData = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, orderId))

          // Prepare order data for email
          const emailOrderData: OrderData = {
            customerName: updatedOrder.customerName,
            customerEmail: updatedOrder.customerEmail,
            customerPhone: updatedOrder.customerPhone,
            customerAddress: updatedOrder.customerAddress,
            specialNote: updatedOrder.specialNote || undefined,
            items: orderItemsData.map(item => ({
              id: item.productId,
              handle: '', // Not needed for email
              name: item.productName,
              price: item.productPrice,
              comparePrice: null,
              tags: [],
              images: item.productImage ? [item.productImage] : [],
              description: null,
              quantity: item.quantity,
              createdAt: new Date(),
              updatedAt: new Date()
            })),
            itemsTotal: parseFloat(updatedOrder.itemsTotal),
            shippingCost: parseFloat(updatedOrder.shippingCost),
            totalAmount: parseFloat(updatedOrder.totalAmount),
            orderId: updatedOrder.orderId,
          }

          // Send payment confirmation email and get receipt URL
          sendPaymentConfirmationEmail(emailOrderData, updatedOrder.orderId)
            .then(async (result) => {
              if (result.success && result.receiptUrl) {
                // Update order with receipt URL
                await db
                  .update(orders)
                  .set({ paidReceiptUrl: result.receiptUrl })
                  .where(eq(orders.id, orderId))
                console.log('✅ Receipt URL saved for order:', updatedOrder.orderId)
              }
            })
            .catch(error => console.error('Payment confirmation email error:', error))

          console.log('✅ Payment confirmation email queued for order:', updatedOrder.orderId)
        } catch (emailError) {
          console.error('Failed to prepare payment confirmation email:', emailError)
          // Don't fail the payment status update if email fails
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
          specialNote: validatedData.specialNote,
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
