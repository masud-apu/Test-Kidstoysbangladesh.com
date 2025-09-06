import { Resend } from 'resend'
import { CartItemType } from './validations'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface OrderData {
  customerName: string
  customerEmail?: string | null
  customerPhone: string
  customerAddress: string
  specialNote?: string
  items: CartItemType[]
  itemsTotal: number
  shippingCost: number
  totalAmount: number
  orderId: string
}

export async function sendOrderConfirmationEmails(orderData: OrderData) {
  const { customerEmail, customerName, items, itemsTotal, shippingCost, totalAmount, orderId } = orderData
  
  try {
    // Email to customer
    let customerEmailId: string | undefined
    if (customerEmail) {
      const customerRes = await resend.emails.send({
        from: 'KidsToys Bangladesh <noreply@kidstoysbangladesh.com>',
        to: customerEmail,
        subject: `Order Confirmation - #${orderId}`,
        html: generateCustomerEmailTemplate(customerName, items, itemsTotal, shippingCost, totalAmount, orderId),
      })
      customerEmailId = customerRes.data?.id
    }

    // Email to owner
    const ownerRes = await resend.emails.send({
      from: 'KidsToys Bangladesh <noreply@kidstoysbangladesh.com>',
      to: 'apu.sns@gmail.com',
      subject: `New Order - #${orderId}`,
      html: generateOwnerEmailTemplate(orderData),
    })

    return {
      success: true,
      customerEmailId,
      ownerEmailId: ownerRes.data?.id,
    }
  } catch (error) {
    console.error('Email sending failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function generateCustomerEmailTemplate(
  customerName: string,
  items: CartItemType[],
  itemsTotal: number,
  shippingCost: number,
  totalAmount: number,
  orderId: string
): string {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <strong>${item.name}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          ৳${item.price}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          ৳${(parseFloat(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb; text-align: center;">Order Confirmation</h1>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Dear ${customerName},</strong></p>
          <p>Your order has been received successfully. Your order number is <strong>#${orderId}</strong>.</p>
        </div>

  <h3>Order Details:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Quantity</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Price</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin: 20px 0;">
          <div style="border-top: 1px solid #e2e8f0; padding-top: 10px;">
            <p style="margin: 5px 0;"><strong>Items Total: ৳${itemsTotal.toFixed(2)}</strong></p>
            <p style="margin: 5px 0;"><strong>Shipping Cost: ৳${shippingCost.toFixed(2)}</strong></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 10px 0;">
            <h3 style="color: #2563eb; margin: 5px 0;">Total Amount: ৳${totalAmount.toFixed(2)}</h3>
          </div>
        </div>

        <div style="background-color: #f8fafc; padding: 12px 16px; border-left: 3px solid #93c5fd; border-radius: 4px; margin: 10px 0;">
          <p style="margin: 0; color: #374151; font-size: 14px;">
            If you provided any special delivery note, our team will follow it.
          </p>
        </div>

        <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Delivery Information:</strong></p>
          <ul>
            <li>Inside Dhaka: 2–3 business days</li>
            <li>Outside Dhaka: 3–5 business days</li>
            <li>Cash on delivery available</li>
          </ul>
        </div>

  <p>Thank you for your order!</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #6b7280; font-size: 14px;">KidsToysBangladesh - Your Kids Toy Destination</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateOwnerEmailTemplate(orderData: OrderData): string {
  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
          ${item.name}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          ৳${item.price}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          ৳${(parseFloat(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">🔔 নতুন অর্ডার পাওয়া গেছে!</h1>
        
        <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>অর্ডার #${orderData.orderId}</h3>
          <p><strong>পণ্যের মূল্য: ৳${orderData.itemsTotal.toFixed(2)}</strong></p>
          <p><strong>ডেলিভারি চার্জ: ৳${orderData.shippingCost.toFixed(2)}</strong></p>
          <hr style="border: none; border-top: 1px solid #dc2626; margin: 10px 0;">
          <p><strong>মোট পরিমাণ: ৳${orderData.totalAmount.toFixed(2)}</strong></p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <div>
            <h3>গ্রাহকের তথ্য:</h3>
            <p><strong>নাম:</strong> ${orderData.customerName}</p>
            <p><strong>ইমেইল:</strong> ${orderData.customerEmail}</p>
            <p><strong>ফোন:</strong> ${orderData.customerPhone}</p>
          </div>
          <div>
            <h3>ঠিকানা:</h3>
            <p>${orderData.customerAddress}</p>
          </div>
        </div>

        ${orderData.specialNote && orderData.specialNote.trim().length > 0 ? `
        <div style="background-color: #fff7ed; padding: 12px 16px; border-left: 4px solid #fb923c; border-radius: 6px; margin: 10px 0 20px 0;">
          <p style="margin: 0;"><strong>Special Note:</strong> ${orderData.specialNote}</p>
        </div>
        ` : ''}

        <h3>অর্ডারের পণ্যসমূহ:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; text-align: left;">পণ্য</th>
              <th style="padding: 8px; text-align: center;">পরিমাণ</th>
              <th style="padding: 8px; text-align: right;">দাম</th>
              <th style="padding: 8px; text-align: right;">মোট</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>⚠️ করণীয়:</strong></p>
          <ol>
            <li>গ্রাহকের সাথে ফোনে যোগাযোগ করুন</li>
            <li>পণ্য প্রস্তুত করুন</li>
            <li>ডেলিভারির ব্যবস্থা করুন</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
  `
}