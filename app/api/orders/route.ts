import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { db } from '@/lib/db'
import { orders, orderItems, products, productVariants, promoCodes } from '@/lib/schema'
import { createOrderSchema } from '@/lib/validations/order'
import { CartItemType } from '@/lib/validations'
import { sendOrderConfirmationEmails, type OrderData } from '@/lib/email'
import { generatePDFBuffer } from '@/lib/pdf-generator'
import { R2StorageService } from '@/lib/r2-storage'
import { convertBanglaToEnglishNumerals } from '@/lib/bangla-utils'
import { eq, sql } from 'drizzle-orm'

/**
 * Handles background tasks (PDF generation and email sending) asynchronously
 * This function runs after the order is saved and response is sent to the client
 */
async function handleBackgroundTasks(
  orderId: number,
  validatedData: ReturnType<typeof createOrderSchema.parse>,
  itemsTotal: number
) {
  console.log('🔄 Starting background tasks for order:', validatedData.orderId)

  try {
    // Prepare normalized items for email and PDF
    const normalizedItems: CartItemType[] = validatedData.items.map((item) => {
      const createdAt =
        typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
      const updatedAt =
        typeof item.updatedAt === 'string' ? new Date(item.updatedAt) : item.updatedAt

      // Convert MediaItem objects to string URLs for email compatibility
      const normalizedImages = (item.images ?? []).map((img) =>
        typeof img === 'string' ? img : img.url
      )

      return {
        ...item,
        handle: item.handle ?? `product-${item.id}`,
        tags: item.tags ?? [],
        images: normalizedImages,
        createdAt,
        updatedAt,
      }
    })

    const emailOrderData: OrderData = {
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone,
      customerAddress: validatedData.customerAddress,
      specialNote: validatedData.specialNote || undefined,
      items: normalizedItems,
      itemsTotal: itemsTotal,
      shippingCost: validatedData.shippingCost,
      totalAmount: validatedData.totalAmount,
      orderId: validatedData.orderId,
      promoCode: validatedData.promoCode || undefined,
      promoCodeDiscount: validatedData.promoCodeDiscount || undefined,
    }

    // Generate and upload PDF invoice
    let invoiceUrl: string | null = null
    try {
      console.log('📄 Generating PDF for order:', validatedData.orderId)
      const pdfBuffer = await generatePDFBuffer(emailOrderData)
      console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes')

      const fileName = R2StorageService.generateFileName(validatedData.orderId)
      invoiceUrl = await R2StorageService.uploadPDF(pdfBuffer, fileName)
      console.log('📤 PDF uploaded successfully:', invoiceUrl)

      // Update order with invoice URL
      await db
        .update(orders)
        .set({ invoiceUrl })
        .where(eq(orders.id, orderId))

      console.log('✅ Order updated with invoice URL')
    } catch (pdfError) {
      console.error('❌ PDF generation/upload failed for order:', validatedData.orderId, pdfError)
      // Continue to send email even if PDF fails
    }

    // Send confirmation emails
    try {
      console.log('📧 Sending confirmation emails for order:', validatedData.orderId)
      const emailResult = await sendOrderConfirmationEmails(emailOrderData, invoiceUrl)

      if (emailResult.success) {
        console.log('✅ Emails sent successfully for order:', validatedData.orderId)
      } else {
        console.error('⚠️ Email sending failed for order:', validatedData.orderId, emailResult.error)
      }
    } catch (emailError) {
      console.error('❌ Email sending error for order:', validatedData.orderId, emailError)
    }

    console.log('✅ Background tasks completed for order:', validatedData.orderId)
  } catch (error) {
    console.error('❌ Background tasks error for order:', validatedData.orderId, error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Convert Bangla numerals to English numerals in phone number
    if (body.customerPhone) {
      body.customerPhone = convertBanglaToEnglishNumerals(body.customerPhone)
    }

    // Validate the incoming data with our schema
    const validatedData = createOrderSchema.parse(body)


    // Calculate items total from cart items
    const itemsTotal = validatedData.items.reduce((total, item) => {
      const price = item.variantPrice || item.price || '0'
      return total + (parseFloat(price) * item.quantity)
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
        specialNote: validatedData.specialNote || null,
        itemsTotal: itemsTotal.toString(),
        shippingCost: validatedData.shippingCost.toString(),
        totalAmount: validatedData.totalAmount.toString(),
        deliveryType: validatedData.deliveryType,
        paymentStatus: validatedData.paymentStatus || 'pending',
        status: 'order_placed',
        // Promo code fields
        promoCodeId: validatedData.promoCodeId,
        promoCode: validatedData.promoCode,
        promoCodeDiscount: validatedData.promoCodeDiscount?.toString() || null,
      }).returning()

      // 2. Transform cart items to order items and insert
      const orderItemsData = validatedData.items.map(item => {
        // Use variant price if available, otherwise use product price
        const effectivePrice = item.variantPrice || item.price || '0'
        const itemTotal = parseFloat(effectivePrice) * item.quantity

        // Extract image URL from either string or MediaItem object
        const firstImage = item.images?.[0]
        const productImage = firstImage
          ? typeof firstImage === 'string'
            ? firstImage
            : firstImage.url
          : null

        return {
          orderId: newOrder.id,
          productId: item.id,
          variantId: item.variantId || null,
          productName: item.title || item.name || 'Unknown Product',
          productPrice: effectivePrice,
          productImage,
          variantTitle: item.variantTitle || null,
          variantSku: item.variantSku || null,
          selectedOptions: item.selectedOptions || null,
          quantity: item.quantity,
          itemTotal: itemTotal.toString(),
        }
      })

      await tx.insert(orderItems).values(orderItemsData)

      // 3. Update variant inventory (subtract ordered quantities) and product totals
      for (const item of validatedData.items) {
        // Only update inventory if variantId is provided
        if (item.variantId) {
          await tx
            .update(productVariants)
            .set({
              inventoryQuantity: sql`${productVariants.inventoryQuantity} - ${item.quantity}`,
              updatedAt: sql`now()`
            })
            .where(eq(productVariants.id, item.variantId))

          // Update product's totalInventory by recalculating from all variants
          const allVariants = await tx
            .select()
            .from(productVariants)
            .where(eq(productVariants.productId, item.id))

          const totalInventory = allVariants.reduce((sum, v) => {
            // Subtract quantity from the variant we just updated
            const inventory = v.id === item.variantId
              ? v.inventoryQuantity - item.quantity
              : v.inventoryQuantity
            return sum + inventory
          }, 0)

          await tx
            .update(products)
            .set({
              totalInventory,
              updatedAt: sql`now()`
            })
            .where(eq(products.id, item.id))
        }
      }

      // 4. Handle promo code usage tracking and expiry
      if (validatedData.promoCodeId) {
        await tx
          .update(promoCodes)
          .set({
            usedCount: sql`${promoCodes.usedCount} + 1`,
            updatedAt: sql`now()`
          })
          .where(eq(promoCodes.id, validatedData.promoCodeId))
      }

      return newOrder
    })

    // 4. Return success response immediately to make it feel instant
    const response = NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: 'Order placed successfully!',
    })

    // 5. Handle PDF generation and email sending in the background
    // This runs asynchronously without blocking the response
    handleBackgroundTasks(result.id, validatedData, itemsTotal).catch((error) => {
      console.error('❌ Background tasks failed for order:', validatedData.orderId, error)
    })

    return response

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
