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

    // 4. Prepare data for email service (items are already in the correct CartItemType format)
    // Normalize items to CartItemType shape (ensure Date types and convert MediaItem objects to strings)
    const normalizedItems: CartItemType[] = validatedData.items.map((item) => {
      const createdAt =
        typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
      const updatedAt =
        typeof item.updatedAt === 'string' ? new Date(item.updatedAt) : item.updatedAt

      // Convert MediaItem objects to string URLs for email compatibility
      const normalizedImages = (item.images ?? []).map(img =>
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
      items: normalizedItems, // Ensure correct types for email service
      itemsTotal: itemsTotal,
      shippingCost: validatedData.shippingCost,
      totalAmount: validatedData.totalAmount,
      orderId: validatedData.orderId,
      // Promo code data for email
      promoCode: validatedData.promoCode || undefined,
      promoCodeDiscount: validatedData.promoCodeDiscount || undefined,
    }

    // 5. Generate and upload PDF invoice
    let invoiceUrl: string | null = null
    try {
      console.log('🔄 Starting PDF generation for order:', validatedData.orderId)
      const pdfBuffer = await generatePDFBuffer(emailOrderData)
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length)
      const fileName = R2StorageService.generateFileName(validatedData.orderId)
      invoiceUrl = await R2StorageService.uploadPDF(pdfBuffer, fileName)
      console.log('📤 PDF uploaded successfully, URL:', invoiceUrl)
      
      // Update order with invoice URL
      await db
        .update(orders)
        .set({ invoiceUrl })
        .where(eq(orders.id, result.id))
        
    } catch (pdfError) {
      console.error('PDF generation/upload error:', pdfError)
      // Continue without failing the order - PDF generation is optional
    }

    // 6. Send confirmation emails with PDF attachment
    console.log('📧 Starting email sending process for order:', validatedData.orderId)
    console.log('📧 Email data:', {
      customerEmail: emailOrderData.customerEmail,
      customerName: emailOrderData.customerName,
      orderId: emailOrderData.orderId,
      invoiceUrl: invoiceUrl ? 'Present' : 'Not available',
      promoCode: emailOrderData.promoCode || 'None',
      promoCodeDiscount: emailOrderData.promoCodeDiscount || 0
    })

    const emailResult = await sendOrderConfirmationEmails(emailOrderData, invoiceUrl)

    console.log('📧 Email sending result:', emailResult)

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: emailResult.success
        ? 'Order placed successfully and confirmation emails sent!'
        : 'Order placed successfully but email sending failed',
      emailSent: emailResult.success,
      invoiceUrl,
    })

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
