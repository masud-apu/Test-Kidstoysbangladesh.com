import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { promoCodes } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const validatePromoCodeSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
  items: z.array(z.object({
    id: z.number(),
    price: z.string(),
    quantity: z.number(),
  })).min(1, 'Items are required'),
  itemsTotal: z.number().min(0, 'Items total must be positive'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = validatePromoCodeSchema.parse(body)

    const { code, items, itemsTotal } = validatedData

    // Find the promo code
    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code.toUpperCase()))
      .limit(1)

    if (!promoCode) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Promo code not found',
          errorType: 'NOT_FOUND'
        },
        { status: 400 }
      )
    }

    // Check if promo code is active
    if (!promoCode.isActive) {
      return NextResponse.json(
        {
          valid: false,
          error: 'This promo code is no longer active',
          errorType: 'INACTIVE'
        },
        { status: 400 }
      )
    }

    // Check if promo code has expired
    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          valid: false,
          error: 'This promo code has expired',
          errorType: 'EXPIRED'
        },
        { status: 400 }
      )
    }

    // Check usage limits
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return NextResponse.json(
        {
          valid: false,
          error: 'This promo code has reached its usage limit',
          errorType: 'USAGE_LIMIT_REACHED'
        },
        { status: 400 }
      )
    }

    // Check if it's a one-time use code that has already been used
    if (promoCode.isOneTimeUse && promoCode.usedCount > 0) {
      return NextResponse.json(
        {
          valid: false,
          error: 'This one-time promo code has already been used',
          errorType: 'ALREADY_USED'
        },
        { status: 400 }
      )
    }

    // Check product applicability
    if (!promoCode.isStoreWide) {
      const applicableProductIds = promoCode.applicableProducts as number[]
      const orderProductIds = items.map(item => item.id)

      // Check if any of the order items are in the applicable products list
      const hasApplicableProducts = orderProductIds.some(productId =>
        applicableProductIds.includes(productId)
      )

      if (!hasApplicableProducts) {
        return NextResponse.json(
          {
            valid: false,
            error: 'This promo code is not applicable to any items in your cart',
            errorType: 'NOT_APPLICABLE'
          },
          { status: 400 }
        )
      }

      // Calculate discount only for applicable products
      const applicableItemsTotal = items
        .filter(item => applicableProductIds.includes(item.id))
        .reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0)

      // Calculate discount
      let discountAmount = 0
      if (promoCode.discountType === 'percentage') {
        const discountValue = parseFloat(promoCode.discountValue)
        discountAmount = (applicableItemsTotal * discountValue) / 100

        // Apply maximum discount ceiling if set
        if (promoCode.maxDiscountAmount) {
          const maxDiscount = parseFloat(promoCode.maxDiscountAmount)
          discountAmount = Math.min(discountAmount, maxDiscount)
        }
      } else {
        // Fixed amount discount
        discountAmount = parseFloat(promoCode.discountValue)
        // Don't allow discount to exceed applicable items total
        discountAmount = Math.min(discountAmount, applicableItemsTotal)
      }

      return NextResponse.json({
        valid: true,
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          name: promoCode.name,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          maxDiscountAmount: promoCode.maxDiscountAmount,
        },
        discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
        applicableItemsTotal: Math.round(applicableItemsTotal * 100) / 100,
        isStoreWide: false,
      })
    }

    // Store-wide promo code
    let discountAmount = 0
    if (promoCode.discountType === 'percentage') {
      const discountValue = parseFloat(promoCode.discountValue)
      discountAmount = (itemsTotal * discountValue) / 100

      // Apply maximum discount ceiling if set
      if (promoCode.maxDiscountAmount) {
        const maxDiscount = parseFloat(promoCode.maxDiscountAmount)
        discountAmount = Math.min(discountAmount, maxDiscount)
      }
    } else {
      // Fixed amount discount
      discountAmount = parseFloat(promoCode.discountValue)
      // Don't allow discount to exceed total
      discountAmount = Math.min(discountAmount, itemsTotal)
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        name: promoCode.name,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        maxDiscountAmount: promoCode.maxDiscountAmount,
      },
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      applicableItemsTotal: Math.round(itemsTotal * 100) / 100,
      isStoreWide: true,
    })

  } catch (error) {
    console.error('Error validating promo code:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid request data',
          errorType: 'VALIDATION_ERROR',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        valid: false,
        error: 'Failed to validate promo code',
        errorType: 'SERVER_ERROR'
      },
      { status: 500 }
    )
  }
}