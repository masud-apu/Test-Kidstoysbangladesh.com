import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { db } from '@/lib/db'
import { orders, orderItems, products, productVariants, promoCodes, orderPackingDetails } from '@/lib/schema'
import { createOrderSchema } from '@/lib/validations/order'
import { CartItemType } from '@/lib/validations'
import { sendOrderConfirmationEmails, type OrderData } from '@/lib/email'
import { generatePDFBuffer } from '@/lib/pdf-generator'
import { R2StorageService } from '@/lib/r2-storage'
import { convertBanglaToEnglishNumerals } from '@/lib/bangla-utils'
import { calculatePackingFromVariants } from '@/lib/services/order-service'
import { eq, sql } from 'drizzle-orm'

/**
 * Handles PDF generation and email sending after order is saved
 * IMPORTANT: This MUST be awaited to ensure completion in serverless environment
 */
async function handleBackgroundTasks(
  orderId: number,
  validatedData: ReturnType<typeof createOrderSchema.parse>,
  itemsTotal: number
) {
  const startTime = Date.now()
  console.log('🔄 [Order:', validatedData.orderId, '] Starting background tasks at', new Date().toISOString())

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

    // Step 1: Generate and upload PDF invoice
    let invoiceUrl: string | null = null
    let pdfSuccess = false
    try {
      const pdfStartTime = Date.now()
      console.log('📄 [Order:', validatedData.orderId, '] Generating PDF...')

      const pdfBuffer = await generatePDFBuffer(emailOrderData)
      console.log('✅ [Order:', validatedData.orderId, '] PDF generated, size:', pdfBuffer.length, 'bytes')

      const fileName = R2StorageService.generateFileName(validatedData.orderId)
      invoiceUrl = await R2StorageService.uploadPDF(pdfBuffer, fileName)
      console.log('📤 [Order:', validatedData.orderId, '] PDF uploaded to:', invoiceUrl)

      // Update order with invoice URL
      await db
        .update(orders)
        .set({ invoiceUrl })
        .where(eq(orders.id, orderId))

      const pdfDuration = Date.now() - pdfStartTime
      console.log('✅ [Order:', validatedData.orderId, '] PDF processing completed in', pdfDuration, 'ms')
      pdfSuccess = true
    } catch (pdfError) {
      console.error('❌ [Order:', validatedData.orderId, '] PDF generation/upload FAILED:', pdfError)
      console.error('PDF Error stack:', pdfError instanceof Error ? pdfError.stack : 'No stack trace')
      // Continue to send email even if PDF fails
    }

    // Step 2: Send confirmation emails
    let emailSuccess = false
    try {
      const emailStartTime = Date.now()
      console.log('📧 [Order:', validatedData.orderId, '] Sending confirmation emails...')

      const emailResult = await sendOrderConfirmationEmails(emailOrderData, invoiceUrl)

      if (emailResult.success) {
        const emailDuration = Date.now() - emailStartTime
        console.log('✅ [Order:', validatedData.orderId, '] Emails sent successfully in', emailDuration, 'ms')
        emailSuccess = true
      } else {
        console.error('⚠️ [Order:', validatedData.orderId, '] Email sending FAILED:', emailResult.error)
      }
    } catch (emailError) {
      console.error('❌ [Order:', validatedData.orderId, '] Email sending exception:', emailError)
      console.error('Email Error stack:', emailError instanceof Error ? emailError.stack : 'No stack trace')
    }

    const totalDuration = Date.now() - startTime
    console.log('✅ [Order:', validatedData.orderId, '] Background tasks completed in', totalDuration, 'ms - PDF:', pdfSuccess ? '✓' : '✗', 'Email:', emailSuccess ? '✓' : '✗')
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

    // Calculate COD cost (1% of total amount) upfront for visibility
    const codCost = validatedData.totalAmount * 0.01

    // Auto-calculate packing from variant defaults BEFORE creating order
    const packingCalculation = await calculatePackingFromVariants(validatedData.items)

    console.log('📦 Frontend Packing calculation:', {
      totalBoxCost: packingCalculation.totalBoxCost,
      totalMaterialCost: packingCalculation.totalMaterialCost,
      totalPackingCost: packingCalculation.totalPackingCost,
      boxesCount: packingCalculation.boxesUsed.length,
      materialsCount: packingCalculation.materialsUsed.length,
    })

    // Start database transaction
    const result = await db.transaction(async (tx) => {
      // 1. Insert order WITH calculated packing charges
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
        createdBy: validatedData.createdBy || 'website',
        // Promo code fields
        promoCodeId: validatedData.promoCodeId,
        promoCode: validatedData.promoCode,
        promoCodeDiscount: validatedData.promoCodeDiscount?.toString() || null,
        // Cost tracking - packing and COD calculated upfront, purchase cost calculated when shipped
        codCost: codCost.toString(), // COD cost (1% of total) - calculated upfront for visibility
        totalPackingCharges: packingCalculation.totalPackingCost,
        totalPurchaseCost: '0', // Will be calculated via FIFO when status changes to "shipped"
        totalProfit: '0', // Will be calculated when shipped
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

      // 3. Create order packing details if any packing was calculated
      if (parseFloat(packingCalculation.totalPackingCost) > 0) {
        await tx.insert(orderPackingDetails).values({
          orderId: newOrder.id,
          boxesUsed: packingCalculation.boxesUsed,
          materialsUsed: packingCalculation.materialsUsed,
          totalBoxCost: packingCalculation.totalBoxCost,
          totalMaterialCost: packingCalculation.totalMaterialCost,
          totalPackingCost: packingCalculation.totalPackingCost,
          isInventoryDeducted: false, // Will be deducted when status changes to "shipped"
        })
      }

      // 4. Update variant inventory (subtract ordered quantities) and product totals
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

      // 5. Handle promo code usage tracking and expiry
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

    // 5. Handle PDF generation and email sending (in parallel for speed)
    // We MUST await this to ensure it completes in serverless environment
    await handleBackgroundTasks(result.id, validatedData, itemsTotal).catch((error) => {
      console.error('❌ Background tasks failed for order:', validatedData.orderId, error)
      // Continue anyway - order is already saved
    })

    // 5. Return success response
    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: 'Order placed successfully!',
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
