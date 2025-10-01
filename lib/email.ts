import { Resend } from "resend";
import { type OrderStatus } from "./validations/order";
import { CartItemType } from "./validations";
import { R2StorageService } from "./r2-storage";
import { generatePaidReceiptBuffer } from "./pdf-generator";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderData {
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  customerAddress: string;
  specialNote?: string;
  items: CartItemType[];
  itemsTotal: number;
  shippingCost: number;
  totalAmount: number;
  orderId: string;
  // Promo code fields
  promoCode?: string;
  promoCodeDiscount?: number;
}

export async function sendOrderConfirmationEmails(
  orderData: OrderData,
  invoiceUrl?: string | null,
) {
  const {
    customerEmail,
    customerName,
    items,
    itemsTotal,
    shippingCost,
    totalAmount,
    orderId,
    promoCode,
    promoCodeDiscount,
  } = orderData;

  console.log("📧 sendOrderConfirmationEmails called with:", {
    orderId,
    customerEmail,
    customerName,
    hasInvoiceUrl: !!invoiceUrl,
    itemsCount: items.length,
    totalAmount,
    resendApiKey: process.env.RESEND_API_KEY ? "Present" : "Missing",
    resendFromEmail: process.env.RESEND_FROM_EMAIL || "Not set",
  });

  // Validate Resend configuration
  if (!process.env.RESEND_API_KEY) {
    console.error("📧 RESEND_API_KEY is not configured!");
    return {
      success: false,
      error: "Email service not configured - missing API key",
    };
  }

  try {
    const logoUrl = await getMainLogoUrl();
    // Prepare PDF attachment if invoice URL is provided
    let pdfAttachment = null;
    if (invoiceUrl) {
      try {
        const fileName = R2StorageService.generateFileName(orderId);
        const pdfBuffer = await R2StorageService.downloadPDF(fileName);
        pdfAttachment = {
          filename: `Invoice-${orderId}.pdf`,
          content: pdfBuffer,
          type: "application/pdf",
          disposition: "attachment",
        };
      } catch (attachmentError) {
        console.error("Failed to prepare PDF attachment:", attachmentError);
        // Continue without attachment
      }
    }

    // Email to customer
    let customerEmailId: string | undefined;
    if (customerEmail) {
      console.log("📧 Sending customer email to:", customerEmail);

      const emailPayload: {
        from: string;
        to: string;
        subject: string;
        html: string;
        attachments?: Array<{
          filename: string;
          content: Buffer;
          type: string;
          disposition: string;
        }>;
      } = {
        from: "KidsToys Bangladesh <noreply@kidstoysbangladesh.com>",
        to: customerEmail,
        subject: `Order Confirmation - #${orderId}`,
        html: generateCustomerEmailTemplate(
          customerName,
          items,
          itemsTotal,
          shippingCost,
          totalAmount,
          orderId,
          invoiceUrl,
          promoCode,
          promoCodeDiscount,
          logoUrl,
        ),
      };

      // Add PDF attachment if available
      if (pdfAttachment) {
        console.log("📧 Adding PDF attachment to customer email");
        emailPayload.attachments = [pdfAttachment];
      }

      console.log("📧 Customer email payload prepared:", {
        from: emailPayload.from,
        to: emailPayload.to,
        subject: emailPayload.subject,
        hasAttachments: !!emailPayload.attachments,
      });

      try {
        const customerRes = await resend.emails.send(emailPayload);
        customerEmailId = customerRes.data?.id;
        console.log("📧 Customer email sent successfully:", {
          emailId: customerEmailId,
          response: customerRes,
        });
      } catch (customerEmailError) {
        console.error("📧 Customer email failed:", customerEmailError);
        throw customerEmailError;
      }
    } else {
      console.log(
        "📧 No customer email provided, skipping customer notification",
      );
    }

    // Email to owner (with PDF attachment as well)
    console.log("📧 Sending owner notification email");

    const ownerEmailPayload: {
      from: string;
      to: string;
      subject: string;
      html: string;
      attachments?: Array<{
        filename: string;
        content: Buffer;
        type: string;
        disposition: string;
      }>;
    } = {
      from: "KidsToys Bangladesh <noreply@kidstoysbangladesh.com>",
      to: "kidstoysbangladesh@gmail.com",
      subject: `New Order - #${orderId}`,
      html: generateOwnerEmailTemplate(orderData, invoiceUrl, logoUrl),
    };

    // Add PDF attachment if available
    if (pdfAttachment) {
      console.log("📧 Adding PDF attachment to owner email");
      ownerEmailPayload.attachments = [pdfAttachment];
    }

    console.log("📧 Owner email payload prepared:", {
      from: ownerEmailPayload.from,
      to: ownerEmailPayload.to,
      subject: ownerEmailPayload.subject,
      hasAttachments: !!ownerEmailPayload.attachments,
    });

    let ownerRes;
    try {
      ownerRes = await resend.emails.send(ownerEmailPayload);
      console.log("📧 Owner email sent successfully:", {
        emailId: ownerRes.data?.id,
        response: ownerRes,
      });
    } catch (ownerEmailError) {
      console.error("📧 Owner email failed:", ownerEmailError);
      throw ownerEmailError;
    }

    console.log("📧 All emails processed successfully");
    return {
      success: true,
      customerEmailId,
      ownerEmailId: ownerRes.data?.id,
    };
  } catch (error) {
    console.error("📧 Email sending failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      orderData: {
        orderId,
        customerEmail,
        customerName,
      },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function generateCustomerEmailTemplate(
  customerName: string,
  items: CartItemType[],
  itemsTotal: number,
  shippingCost: number,
  totalAmount: number,
  orderId: string,
  invoiceUrl?: string | null,
  promoCode?: string,
  promoCodeDiscount?: number,
  logoDataUrl?: string,
): string {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #ddd;"><b>${item.name}</b></td><td style="padding:8px;text-align:center;">${item.quantity}</td><td style="padding:8px;text-align:right;">TK ${item.price}</td><td style="padding:8px;text-align:right;"><b>TK ${(parseFloat(item.price) * item.quantity).toFixed(2)}</b></td></tr>`,
    )
    .join("");

  const logoBlock = logoDataUrl
    ? `<div style="text-align:center;margin-bottom:20px;"><img src="${logoDataUrl}" alt="KidsToys Bangladesh" style="height:60px;max-width:100%;object-fit:contain"/></div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - KidsToys Bangladesh</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="650" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);">
              
              <!-- Header with Logo -->
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                  ${logoBlock ? logoBlock.replace('style="height:60px;max-width:100%;object-fit:contain"', 'style="height:60px;max-width:200px;object-fit:contain;margin-bottom:15px;filter:brightness(0) invert(1);"') : ""}
                  <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 32px; font-weight: 700;">KidsToys Bangladesh</h1>
                  <div style="background: rgba(255, 255, 255, 0.2); display: inline-block; padding: 8px 20px; border-radius: 20px; margin-top: 10px;">
                    <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600;">
                      ✨ Order Confirmed
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Thank You Message -->
              <tr>
                <td style="padding: 40px 40px 0;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #111827; margin: 0 0 10px; font-size: 28px; font-weight: 700;">
                      Thank You, ${customerName}! 🎉
                    </h2>
                    <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">
                      Your order has been received and is being processed.
                    </p>
                  </div>
                  
                  <!-- Order Number Badge -->
                  <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <p style="color: #6b7280; margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Order Number
                    </p>
                    <p style="color: #111827; margin: 0; font-size: 24px; font-weight: 700;">
                      #${orderId}
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Order Items -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <h3 style="color: #111827; margin: 0 0 20px; font-size: 18px; font-weight: 600;">
                    Order Details
                  </h3>
                  <table style="width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 8px; overflow: hidden;">
                    <thead>
                      <tr style="background: linear-gradient(90deg, #f9fafb 0%, #f3f4f6 100%);">
                        <th style="padding: 15px; text-align: left; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Product
                        </th>
                        <th style="padding: 15px; text-align: center; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Qty
                        </th>
                        <th style="padding: 15px; text-align: right; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Price
                        </th>
                        <th style="padding: 15px; text-align: right; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody style="background: #ffffff;">
                      ${itemsHtml}
                    </tbody>
                  </table>
                  
                  <!-- Price Summary -->
                  <div style="margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 8px;">
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 15px;">Subtotal</td>
                        <td style="padding: 8px 0; text-align: right; color: #4b5563; font-size: 15px;">TK ${itemsTotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 15px;">Shipping</td>
                        <td style="padding: 8px 0; text-align: right; color: #4b5563; font-size: 15px;">TK ${shippingCost.toFixed(2)}</td>
                      </tr>
                      ${
                        promoCode && promoCodeDiscount
                          ? `
                      <tr>
                        <td style="padding: 8px 0; color: #10b981; font-size: 15px;">Promo Discount (${promoCode})</td>
                        <td style="padding: 8px 0; text-align: right; color: #10b981; font-size: 15px;">-TK ${promoCodeDiscount.toFixed(2)}</td>
                      </tr>`
                          : ""
                      }
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 12px 0 8px; color: #111827; font-size: 18px; font-weight: 700;">Total</td>
                        <td style="padding: 12px 0 8px; text-align: right; color: #7c3aed; font-size: 20px; font-weight: 700;">TK ${totalAmount.toFixed(2)}</td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
              
              <!-- Delivery Information -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b;">
                    <h4 style="color: #92400e; margin: 0 0 12px; font-size: 16px; font-weight: 600;">
                      📦 Delivery Information
                    </h4>
                    <ul style="color: #78350f; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                      <li>Inside Dhaka: 2-3 business days</li>
                      <li>Outside Dhaka: 3-5 business days</li>
                      <li>Cash on delivery available</li>
                      <li>Our delivery partner will call before delivery</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Invoice Download (if available) -->
              ${
                invoiceUrl
                  ? `
              <tr>
                <td style="padding: 0 40px 30px;">
                  <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 10px; text-align: center;">
                    <p style="color: #1e3a8a; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
                      📄 Your Invoice is Ready!
                    </p>
                    <a href="${invoiceUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                      Download Invoice PDF
                    </a>
                    <p style="color: #64748b; margin: 12px 0 0; font-size: 13px;">
                      The invoice is also attached to this email for your convenience.
                    </p>
                  </div>
                </td>
              </tr>
              `
                  : ""
              }
              
              <!-- Next Steps -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <div style="background: #f0fdf4; padding: 20px; border-radius: 10px;">
                    <h4 style="color: #14532d; margin: 0 0 12px; font-size: 16px; font-weight: 600;">
                      ✅ What's Next?
                    </h4>
                    <ol style="color: #166534; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                      <li>We'll confirm your order within 24 hours</li>
                      <li>Your items will be carefully packed</li>
                      <li>You'll receive tracking information once shipped</li>
                      <li>Our delivery partner will contact you before delivery</li>
                    </ol>
                  </div>
                </td>
              </tr>
              
              <!-- Contact Support -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <div style="text-align: center;">
                    <h4 style="color: #111827; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
                      Need Help?
                    </h4>
                    <p style="color: #6b7280; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
                      Our customer support team is here to assist you with any questions.
                    </p>
                    <div>
                      <a href="tel:+8801735547173" style="display: inline-block; margin: 0 10px; padding: 10px 20px; background: #ffffff; color: #7c3aed; text-decoration: none; border: 2px solid #7c3aed; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        📞 Call Support
                      </a>
                      <a href="mailto:kidstoysbangladesh@gmail.com" style="display: inline-block; margin: 0 10px; padding: 10px 20px; background: #7c3aed; color: #ffffff; text-decoration: none; border: 2px solid #7c3aed; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        ✉️ Email Us
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #1f2937; border-radius: 0 0 12px 12px; text-align: center;">
                  <p style="color: #d1d5db; margin: 0 0 10px; font-size: 16px; font-weight: 500;">
                    Thank you for choosing
                  </p>
                  <p style="color: #ffffff; margin: 0 0 20px; font-size: 20px; font-weight: 700;">
                    KidsToys Bangladesh
                  </p>
                  <p style="color: #9ca3af; margin: 0 0 15px; font-size: 13px;">
                    Bringing smiles to children across Bangladesh 🎈
                  </p>
                  <div>
                    <a href="https://kidstoysbangladesh.com" style="color: #a78bfa; text-decoration: none; font-size: 13px; margin: 0 10px;">
                      Visit Website
                    </a>
                    <span style="color: #4b5563;">•</span>
                    <a href="https://kidstoysbangladesh.com/orders" style="color: #a78bfa; text-decoration: none; font-size: 13px; margin: 0 10px;">
                      Track Order
                    </a>
                    <span style="color: #4b5563;">•</span>
                    <a href="https://kidstoysbangladesh.com/privacy" style="color: #a78bfa; text-decoration: none; font-size: 13px; margin: 0 10px;">
                      Privacy Policy
                    </a>
                  </div>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function generateOwnerEmailTemplate(
  orderData: OrderData,
  invoiceUrl?: string | null,
  logoDataUrl?: string,
): string {
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
          TK ${item.price}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          TK ${(parseFloat(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `,
    )
    .join("");

  const logoBlock = logoDataUrl
    ? `<div style="text-align:center;margin-bottom:12px;"><img src="${logoDataUrl}" alt="KidsToys Bangladesh" style="height:48px;max-width:100%;object-fit:contain"/></div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
        ${logoBlock}
        <h1 style="color: #dc2626;">🔔 নতুন অর্ডার পাওয়া গেছে!</h1>
        
        <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>অর্ডার #${orderData.orderId}</h3>
          <p><strong>পণ্যের মূল্য: TK ${orderData.itemsTotal.toFixed(2)}</strong></p>
          ${orderData.promoCode && orderData.promoCodeDiscount ? `<p><strong style="color: #10b981;">প্রোমো ডিসকাউন্ট (${orderData.promoCode}): -TK ${orderData.promoCodeDiscount.toFixed(2)}</strong></p>` : ""}
          <p><strong>ডেলিভারি চার্জ: TK ${orderData.shippingCost.toFixed(2)}</strong></p>
          <hr style="border: none; border-top: 1px solid #dc2626; margin: 10px 0;">
          <p><strong>মোট পরিমাণ: TK ${orderData.totalAmount.toFixed(2)}</strong></p>
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

        ${
          orderData.specialNote && orderData.specialNote.trim().length > 0
            ? `
        <div style="background-color: #fff7ed; padding: 12px 16px; border-left: 4px solid #fb923c; border-radius: 6px; margin: 10px 0 20px 0;">
          <p style="margin: 0;"><strong>Special Note:</strong> ${orderData.specialNote}</p>
        </div>
        `
            : ""
        }

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

        ${
          invoiceUrl
            ? `
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="margin-bottom: 10px;"><strong>📄 Invoice PDF</strong></p>
          <a href="${invoiceUrl}" target="_blank" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600;">
            View Invoice PDF
          </a>
          <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
            Invoice is also attached to this email.
          </p>
        </div>
        `
            : ""
        }
      </div>
    </body>
    </html>
  `;
}

export async function sendPaymentConfirmationEmail(
  orderData: OrderData,
  orderId: string,
) {
  const { customerEmail, customerName, totalAmount } = orderData;

  if (!customerEmail) {
    return { success: false, message: "No customer email provided" };
  }

  try {
    console.log("🔄 Generating receipt PDF...");
    const logoDataUrl = await getMainLogoUrl();

    // Generate receipt PDF
    const paidReceiptBuffer = await generatePaidReceiptBuffer(orderData);
    const paidReceiptFileName =
      R2StorageService.generatePaidReceiptFileName(orderId);

    // Upload receipt to R2
    const paidReceiptUrl = await R2StorageService.uploadPDF(
      paidReceiptBuffer,
      paidReceiptFileName,
    );
    console.log("📤 Paid receipt uploaded successfully:", paidReceiptUrl);

    // Prepare PDF attachment
    const pdfAttachment = {
      filename: `Receipt-${orderId}-PAID.pdf`,
      content: paidReceiptBuffer,
      type: "application/pdf",
      disposition: "attachment",
    };

    // Send payment confirmation email
    const result = await resend.emails.send({
      from: "KidsToys Bangladesh <noreply@kidstoysbangladesh.com>",
      to: customerEmail,
      subject: `Payment Confirmed - Order #${orderId}`,
      html: generatePaymentConfirmationTemplate(
        customerName,
        orderId,
        totalAmount,
        paidReceiptUrl,
        logoDataUrl || undefined,
      ),
      attachments: [pdfAttachment],
    });

    console.log("✅ Payment confirmation email sent:", result.data?.id);

    return {
      success: true,
      message: "Payment confirmation email sent successfully",
      receiptUrl: paidReceiptUrl,
    };
  } catch (error) {
    console.error("❌ Payment confirmation email error:", error);
    return {
      success: false,
      message: `Failed to send payment confirmation email: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

function generatePaymentConfirmationTemplate(
  customerName: string,
  orderId: string,
  totalAmount: number,
  receiptUrl?: string,
  logoDataUrl?: string,
): string {
  const formatBDT = (amount: number) => `TK ${amount.toFixed(0)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmed - KidsToys Bangladesh</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${logoDataUrl ? `<div style="text-align:center;margin-bottom:12px;"><img src="${logoDataUrl}" alt="KidsToys Bangladesh" style="height:48px;max-width:100%;object-fit:contain"/></div>` : ""}
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #16a34a; margin: 0;">🎉 Payment Confirmed!</h1>
        <h2 style="color: #374151; margin: 5px 0 0 0;">KidsToys Bangladesh</h2>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #16a34a; margin-top: 0;">Hello ${customerName},</h3>
        <p style="margin-bottom: 15px;">
          Great news! We have successfully received your payment for Order <strong>#${orderId}</strong>.
        </p>
        <p style="margin-bottom: 15px;">
          <strong>Payment Amount: ${formatBDT(totalAmount)}</strong>
        </p>
        <p style="margin-bottom: 0;">
          Your receipt is attached to this email and your order is now being processed for delivery.
        </p>
      </div>

      <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px solid #16a34a;">
        <p style="margin-bottom: 10px; color: #16a34a;"><strong>✅ PAYMENT STATUS: PAID</strong></p>
        <p style="margin-bottom: 15px;">Your order is confirmed and will be shipped soon!</p>
        
        ${
          receiptUrl
            ? `
        <a href="${receiptUrl}" target="_blank" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; margin-bottom: 10px;">
          View Paid Receipt
        </a>
        <p style="font-size: 12px; color: #6b7280; margin: 5px 0;">
          Receipt is also attached to this email.
        </p>
        `
            : ""
        }
      </div>

      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h4 style="color: #374151; margin-top: 0;">What happens next?</h4>
        <ol style="color: #6b7280; margin: 0; padding-left: 20px;">
          <li>We will prepare your order for shipment</li>
          <li>You'll receive tracking information once shipped</li>
          <li>We'll call you if we need any additional information</li>
          <li>Your order will be delivered to your address</li>
        </ol>
      </div>

      <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Thank you for choosing KidsToys Bangladesh!<br>
          <strong style="color: #16a34a;">www.kidstoysbangladesh.com</strong>
        </p>
      </div>
    </body>
    </html>
  `;
}

// Sends a status update email to the customer for any status change
export async function sendOrderStatusUpdateEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  status: OrderStatus;
}) {
  const { to, customerName, orderId, status } = params;
  console.log(`📨 Preparing to send status update email:`, {
    to,
    customerName,
    orderId,
    status,
    humanizedStatus: humanizeStatus(status),
  });

  try {
    const logoDataUrl = await getMainLogoUrl();
    const subject = `Order Update - #${orderId}: ${humanizeStatus(status)}`;
    const html = generateStatusUpdateEmailTemplate({
      customerName,
      orderId,
      status,
      logoDataUrl: logoDataUrl || undefined,
    });

    console.log(`📤 Sending email via Resend...`);
    const result = await resend.emails.send({
      from: "KidsToys Bangladesh <noreply@kidstoysbangladesh.com>",
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully:`, result);
    return { success: true, emailId: result.data?.id };
  } catch (error) {
    console.error("❌ Status email failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function humanizeStatus(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    order_placed: "Order Placed",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    returned: "Returned",
    canceled: "Canceled",
  };
  return map[status];
}

function generateStatusUpdateEmailTemplate({
  customerName,
  orderId,
  status,
  logoDataUrl,
}: {
  customerName: string;
  orderId: string;
  status: OrderStatus;
  logoDataUrl?: string;
}): string {
  const title = humanizeStatus(status);

  const statusConfig: Record<
    OrderStatus,
    {
      emoji: string;
      color: string;
      bgColor: string;
      message: string;
      nextSteps?: string[];
    }
  > = {
    order_placed: {
      emoji: "📦",
      color: "#3b82f6",
      bgColor: "#eff6ff",
      message:
        "Great news! We have received your order and our team is reviewing it.",
      nextSteps: [
        "Our team will verify your order details",
        "You will receive a confirmation once the order is approved",
        "We will contact you if we need any additional information",
      ],
    },
    confirmed: {
      emoji: "✅",
      color: "#16a34a",
      bgColor: "#f0fdf4",
      message:
        "Your order has been confirmed! We are now preparing your items for shipment.",
      nextSteps: [
        "Our warehouse team is picking your items",
        "Quality check will be performed",
        "Package will be prepared for shipping",
        "You will receive tracking information once shipped",
      ],
    },
    shipped: {
      emoji: "🚚",
      color: "#0891b2",
      bgColor: "#f0fdfa",
      message:
        "Exciting news! Your order has been shipped and is on its way to you.",
      nextSteps: [
        "Track your package using the tracking number",
        "Expected delivery within 2-5 business days",
        "Our delivery partner will call you before delivery",
        "Keep your phone accessible for delivery updates",
      ],
    },
    delivered: {
      emoji: "🎉",
      color: "#7c3aed",
      bgColor: "#faf5ff",
      message:
        "Wonderful! Your order has been successfully delivered. We hope you and your little ones enjoy the toys!",
      nextSteps: [
        "Check all items in your package",
        "Contact us if anything is missing or damaged",
        "Share your feedback to help us improve",
        "Follow us on social media for exclusive offers",
      ],
    },
    returned: {
      emoji: "↩️",
      color: "#ea580c",
      bgColor: "#fff7ed",
      message:
        "We have processed the return for your order. Your refund will be initiated shortly.",
      nextSteps: [
        "Refund will be processed within 3-5 business days",
        "You will receive a confirmation once refund is complete",
        "Contact support if you have any questions",
      ],
    },
    canceled: {
      emoji: "❌",
      color: "#dc2626",
      bgColor: "#fef2f2",
      message:
        "Your order has been canceled. If this was not requested by you, please contact our support team immediately.",
      nextSteps: [
        "Any payment made will be refunded",
        "Refund will reflect in 3-5 business days",
        "You can place a new order anytime",
        "Contact support for assistance",
      ],
    },
  };

  const config = statusConfig[status];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update - KidsToys Bangladesh</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header with Logo -->
              <tr>
                <td style="padding: 30px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                  ${
                    logoDataUrl
                      ? `
                    <img src="${logoDataUrl}" alt="KidsToys Bangladesh" style="height: 50px; max-width: 200px; margin-bottom: 10px; filter: brightness(0) invert(1);">
                  `
                      : `
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">KidsToys Bangladesh</h1>
                  `
                  }
                  <p style="color: #e0e7ff; margin: 8px 0 0; font-size: 14px;">Your Trusted Toy Store</p>
                </td>
              </tr>
              
              <!-- Status Badge -->
              <tr>
                <td style="padding: 0 40px;">
                  <div style="margin-top: -15px; text-align: center;">
                    <span style="display: inline-block; background: #ffffff; padding: 8px 20px; border-radius: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                      <span style="font-size: 20px; vertical-align: middle;">${config.emoji}</span>
                      <span style="color: ${config.color}; font-weight: 600; margin-left: 8px; vertical-align: middle;">${title}</span>
                    </span>
                  </div>
                </td>
              </tr>
              
              <!-- Order Number -->
              <tr>
                <td style="padding: 20px 40px 0; text-align: center;">
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">Order Number</p>
                  <p style="color: #111827; margin: 4px 0 0; font-size: 20px; font-weight: 600;">#${orderId}</p>
                </td>
              </tr>
              
              <!-- Main Message -->
              <tr>
                <td style="padding: 30px 40px;">
                  <div style="background-color: ${config.bgColor}; border-left: 4px solid ${config.color}; padding: 20px; border-radius: 8px;">
                    <p style="color: #374151; margin: 0 0 12px; font-size: 16px; font-weight: 600;">
                      Hello ${customerName}! 👋
                    </p>
                    <p style="color: #4b5563; margin: 0; font-size: 15px; line-height: 1.6;">
                      ${config.message}
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Next Steps (if applicable) -->
              ${
                config.nextSteps
                  ? `
              <tr>
                <td style="padding: 0 40px 30px;">
                  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #111827; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
                      What happens next?
                    </h3>
                    <ul style="color: #4b5563; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                      ${config.nextSteps.map((step) => `<li style="margin-bottom: 8px;">${step}</li>`).join("")}
                    </ul>
                  </div>
                </td>
              </tr>
              `
                  : ""
              }
              
              <!-- Call to Action -->
              <tr>
                <td style="padding: 0 40px 30px; text-align: center;">
                  <a href="https://kidstoysbangladesh.com/orders" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                    Track Your Order
                  </a>
                </td>
              </tr>
              
              <!-- Support Section -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center;">
                        <p style="color: #6b7280; margin: 0 0 8px; font-size: 13px;">
                          Need help? We're here for you!
                        </p>
                        <p style="margin: 0;">
                          <a href="tel:+8801735547173" style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: 600;">
                            📞 Call Us
                          </a>
                          <span style="color: #d1d5db; margin: 0 15px;">|</span>
                          <a href="mailto:kidstoysbangladesh@gmail.com" style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: 600;">
                            ✉️ Email Support
                          </a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #1f2937; border-radius: 0 0 12px 12px; text-align: center;">
                  <p style="color: #9ca3af; margin: 0 0 8px; font-size: 12px;">
                    © 2024 KidsToys Bangladesh. All rights reserved.
                  </p>
                  <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                    Bringing joy to children across Bangladesh 🎈
                  </p>
                  <div style="margin-top: 15px;">
                    <a href="https://kidstoysbangladesh.com" style="color: #a78bfa; text-decoration: none; font-size: 12px;">
                      Visit Our Store
                    </a>
                    <span style="color: #4b5563; margin: 0 10px;">•</span>
                    <a href="https://kidstoysbangladesh.com/privacy" style="color: #a78bfa; text-decoration: none; font-size: 12px;">
                      Privacy Policy
                    </a>
                  </div>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Load the main site logo and return a data URL for embedding in emails
async function getMainLogoUrl(): Promise<string> {
  // Return the URL of the logo hosted on the domain
  // This avoids embedding base64 images which increases email size
  return "https://kidstoysbangladesh.com/main-logo.png";
}
