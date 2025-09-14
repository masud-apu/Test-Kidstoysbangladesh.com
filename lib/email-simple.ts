import { Resend } from 'resend'
import { type OrderStatus } from './validations/order'
import { CartItemType } from './validations'
import { R2StorageService } from './r2-storage'

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

async function getMainLogoUrl(): Promise<string> {
  return 'https://kidstoysbangladesh.com/main-logo.png'
}

// Simple, compact order confirmation email
function generateCustomerEmailTemplate(
  customerName: string,
  items: CartItemType[],
  itemsTotal: number,
  shippingCost: number,
  totalAmount: number,
  orderId: string,
  invoiceUrl?: string | null,
  logoUrl?: string
): string {
  const itemsHtml = items
    .map(item => `<tr><td style="padding:8px;border-bottom:1px solid #ddd;"><b>${item.name}</b></td><td style="padding:8px;text-align:center;">${item.quantity}</td><td style="padding:8px;text-align:right;">TK ${item.price}</td><td style="padding:8px;text-align:right;"><b>TK ${(parseFloat(item.price) * item.quantity).toFixed(2)}</b></td></tr>`)
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Order Confirmation</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fa;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;"><tr><td align="center" style="padding:20px;"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;"><tr><td style="padding:30px;text-align:center;background:#667eea;color:white;">${logoUrl ? `<img src="${logoUrl}" alt="KidsToys Bangladesh" style="height:50px;margin-bottom:10px;">` : `<h1 style="margin:0;font-size:24px;">KidsToys Bangladesh</h1>`}<p style="margin:5px 0 0;font-size:14px;">✨ Order Confirmed</p></td></tr><tr><td style="padding:30px;"><h2 style="color:#333;margin:0 0 10px;">Thank You, ${customerName}! 🎉</h2><p style="color:#666;margin:0 0 20px;">Your order #${orderId} has been received.</p><h3 style="color:#333;margin:20px 0 10px;">Order Details</h3><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8f9fa;"><th style="padding:10px;text-align:left;color:#666;font-size:12px;">Product</th><th style="padding:10px;text-align:center;color:#666;font-size:12px;">Qty</th><th style="padding:10px;text-align:right;color:#666;font-size:12px;">Price</th><th style="padding:10px;text-align:right;color:#666;font-size:12px;">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><div style="margin-top:20px;padding:15px;background:#f8f9fa;border-radius:6px;"><table style="width:100%;"><tr><td>Subtotal</td><td align="right">TK ${itemsTotal.toFixed(2)}</td></tr><tr><td>Shipping</td><td align="right">TK ${shippingCost.toFixed(2)}</td></tr><tr style="border-top:1px solid #ddd;"><td style="padding-top:10px;font-weight:bold;">Total</td><td align="right" style="padding-top:10px;font-weight:bold;color:#667eea;">TK ${totalAmount.toFixed(2)}</td></tr></table></div><div style="background:#fff3cd;padding:15px;border-radius:6px;margin:20px 0;"><h4 style="margin:0 0 10px;color:#856404;">📦 Delivery Info</h4><ul style="margin:0;padding-left:20px;color:#856404;font-size:14px;"><li>Inside Dhaka: 2-3 business days</li><li>Outside Dhaka: 3-5 business days</li><li>Cash on delivery available</li></ul></div>${invoiceUrl ? `<div style="background:#e7f3ff;padding:20px;border-radius:6px;text-align:center;margin:20px 0;"><p style="margin:0 0 10px;color:#0056b3;font-weight:bold;">📄 Your Invoice</p><a href="${invoiceUrl}" style="display:inline-block;background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">Download PDF</a></div>` : ''}<div style="background:#d4edda;padding:15px;border-radius:6px;margin:20px 0;"><h4 style="margin:0 0 10px;color:#155724;">✅ What's Next?</h4><p style="margin:0;color:#155724;font-size:14px;">We'll confirm your order within 24 hours and send tracking information once shipped.</p></div><div style="text-align:center;margin:20px 0;"><a href="tel:+8801234567890" style="margin:5px;padding:8px 16px;background:#fff;color:#667eea;text-decoration:none;border:1px solid #667eea;border-radius:4px;font-size:14px;">📞 Call</a><a href="mailto:support@kidstoysbangladesh.com" style="margin:5px;padding:8px 16px;background:#667eea;color:white;text-decoration:none;border-radius:4px;font-size:14px;">✉️ Email</a></div></td></tr><tr><td style="padding:20px;background:#343a40;color:white;text-align:center;"><p style="margin:0;font-size:14px;">Thank you for choosing KidsToys Bangladesh 🎈</p></td></tr></table></td></tr></table></body></html>`
}

// Simple, compact status update email
function generateStatusUpdateEmailTemplate({ customerName, orderId, status }: { customerName: string; orderId: string; status: OrderStatus }): string {
  const statusConfig: Record<OrderStatus, { emoji: string; color: string; message: string }> = {
    order_placed: { emoji: '📦', color: '#3b82f6', message: 'We have received your order and are reviewing it.' },
    confirmed: { emoji: '✅', color: '#16a34a', message: 'Your order has been confirmed and is being prepared.' },
    shipped: { emoji: '🚚', color: '#0891b2', message: 'Your order has shipped and is on its way.' },
    delivered: { emoji: '🎉', color: '#7c3aed', message: 'Your order has been delivered! Enjoy!' },
    returned: { emoji: '↩️', color: '#ea580c', message: 'We have processed your return.' },
    canceled: { emoji: '❌', color: '#dc2626', message: 'Your order has been canceled.' },
  }
  
  const config = statusConfig[status]
  const title = humanizeStatus(status)
  
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Order Update</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fa;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;"><tr><td align="center" style="padding:20px;"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;"><tr><td style="padding:30px;text-align:center;background:${config.color};color:white;"><h1 style="margin:0;font-size:24px;">KidsToys Bangladesh</h1><p style="margin:10px 0 0;font-size:16px;">${config.emoji} ${title}</p></td></tr><tr><td style="padding:30px;"><h2 style="color:#333;margin:0 0 10px;">Hello ${customerName}!</h2><p style="color:#666;margin:0 0 15px;">Order #${orderId}</p><div style="background:#f8f9fa;padding:20px;border-radius:6px;border-left:4px solid ${config.color};"><p style="margin:0;color:#333;font-size:16px;">${config.message}</p></div><div style="text-align:center;margin:30px 0;"><a href="https://kidstoysbangladesh.com/orders" style="display:inline-block;background:${config.color};color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">Track Order</a></div><div style="text-align:center;margin:20px 0;"><a href="tel:+8801234567890" style="margin:5px;padding:8px 16px;background:#fff;color:${config.color};text-decoration:none;border:1px solid ${config.color};border-radius:4px;font-size:14px;">📞 Call</a><a href="mailto:support@kidstoysbangladesh.com" style="margin:5px;padding:8px 16px;background:${config.color};color:white;text-decoration:none;border-radius:4px;font-size:14px;">✉️ Email</a></div></td></tr><tr><td style="padding:20px;background:#343a40;color:white;text-align:center;"><p style="margin:0;font-size:14px;">KidsToys Bangladesh 🎈</p></td></tr></table></td></tr></table></body></html>`
}

function humanizeStatus(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    order_placed: 'Order Placed',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    returned: 'Returned',
    canceled: 'Canceled',
  }
  return map[status]
}

export async function sendOrderStatusUpdateEmail(params: {
  to: string
  customerName: string
  orderId: string
  status: OrderStatus
}) {
  const { to, customerName, orderId, status } = params
  console.log(`📨 Preparing to send status update email:`, { to, customerName, orderId, status })
  
  try {
    const subject = `Order Update - #${orderId}: ${humanizeStatus(status)}`
    const html = generateStatusUpdateEmailTemplate({ customerName, orderId, status })
    
    console.log(`📤 Sending email via Resend...`)
    const result = await resend.emails.send({
      from: 'KidsToys Bangladesh <noreply@kidstoysbangladesh.com>',
      to,
      subject,
      html,
    })
    
    console.log(`✅ Email sent successfully:`, result)
    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('❌ Status email failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendOrderConfirmationEmails(orderData: OrderData, invoiceUrl?: string | null) {
  const { customerEmail, customerName, items, itemsTotal, shippingCost, totalAmount, orderId } = orderData
  
  try {
    const logoUrl = await getMainLogoUrl()
    // Prepare PDF attachment if invoice URL is provided
    let pdfAttachment = null
    if (invoiceUrl) {
      try {
        const fileName = R2StorageService.generateFileName(orderId)
        const pdfBuffer = await R2StorageService.downloadPDF(fileName)
        pdfAttachment = {
          filename: `Invoice-${orderId}.pdf`,
          content: pdfBuffer,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      } catch (attachmentError) {
        console.error('Failed to prepare PDF attachment:', attachmentError)
      }
    }

    // Email to customer
    let customerEmailId: string | undefined
    if (customerEmail) {
      const emailPayload: {
        from: string
        to: string
        subject: string
        html: string
        attachments?: Array<{
          filename: string
          content: Buffer
          type: string
          disposition: string
        }>
      } = {
        from: 'KidsToys Bangladesh <noreply@kidstoysbangladesh.com>',
        to: customerEmail,
        subject: `Order Confirmation - #${orderId}`,
        html: generateCustomerEmailTemplate(customerName, items, itemsTotal, shippingCost, totalAmount, orderId, invoiceUrl, logoUrl),
      }
      
      if (pdfAttachment) {
        emailPayload.attachments = [pdfAttachment]
      }
      
      const customerRes = await resend.emails.send(emailPayload)
      customerEmailId = customerRes.data?.id
    }

    return {
      success: true,
      customerEmailId,
    }
  } catch (error) {
    console.error('Email sending failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}