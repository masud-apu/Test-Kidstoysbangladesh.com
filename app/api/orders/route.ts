import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmationEmails, type OrderData } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const orderData: OrderData = {
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      customerCity: body.customerCity,
      customerPostalCode: body.customerPostalCode,
      items: body.items,
      totalAmount: body.totalAmount,
      orderId: body.orderId,
    }

    // Send confirmation emails
    const emailResult = await sendOrderConfirmationEmails(orderData)

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Order placed successfully and confirmation emails sent!',
        customerEmailId: emailResult.customerEmailId,
        ownerEmailId: emailResult.ownerEmailId,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Order placed but email sending failed',
          error: emailResult.error,
        },
        { status: 200 } // Order is still successful even if email fails
      )
    }
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