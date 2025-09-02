import { Resend } from 'resend'
import { CartItemType } from './validations'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface OrderData {
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  customerCity: string
  customerPostalCode: string
  items: CartItemType[]
  totalAmount: number
  orderId: string
}

export async function sendOrderConfirmationEmails(orderData: OrderData) {
  const { customerEmail, customerName, items, totalAmount, orderId } = orderData
  
  try {
    // Email to customer
    const customerEmailResult = await resend.emails.send({
      from: 'KidsToys Bangladesh <noreply@kidstoysbangladesh.com>',
      to: customerEmail,
      subject: `অর্ডার নিশ্চিতকরণ - #${orderId}`,
      html: generateCustomerEmailTemplate(customerName, items, totalAmount, orderId),
    })

    // Email to owner
    const ownerEmailResult = await resend.emails.send({
      from: 'KidsToys Bangladesh <noreply@kidstoysbangladesh.com>',
      to: 'soyeb.jim@gmail.com',
      subject: `নতুন অর্ডার - #${orderId}`,
      html: generateOwnerEmailTemplate(orderData),
    })

    return {
      success: true,
      customerEmailId: customerEmailResult.data?.id,
      ownerEmailId: ownerEmailResult.data?.id,
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
  totalAmount: number,
  orderId: string
): string {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <strong class="font-bengali">${item.name}</strong>
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
        <h1 style="color: #2563eb; text-align: center;">অর্ডার নিশ্চিতকরণ</h1>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>প্রিয় ${customerName},</strong></p>
          <p>আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আপনার অর্ডার নম্বর: <strong>#${orderId}</strong></p>
        </div>

        <h3>অর্ডারের বিবরণ:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">পণ্য</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">পরিমাণ</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">দাম</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">মোট</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin: 20px 0;">
          <h3 style="color: #2563eb;">মোট পরিমাণ: ৳${totalAmount.toFixed(2)}</h3>
        </div>

        <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>ডেলিভারি তথ্য:</strong></p>
          <ul>
            <li>ঢাকার মধ্যে ২-৩ কার্যদিবস</li>
            <li>ঢাকার বাইরে ৩-৫ কার্যদিবস</li>
            <li>ক্যাশ অন ডেলিভারি সুবিধা উপলব্ধ</li>
          </ul>
        </div>

        <p>আপনার অর্ডারের জন্য ধন্যবাদ!</p>
        
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
            <p>${orderData.customerCity}, ${orderData.customerPostalCode}</p>
          </div>
        </div>

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