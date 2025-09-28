import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { promoCodes } from '@/lib/schema'
import { updatePromoCodeSchema } from '@/lib/validations/promo-code'
import { eq, ilike, and, not } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid promo code ID' },
        { status: 400 }
      )
    }

    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.id, id))
      .limit(1)

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(promoCode)
  } catch (error) {
    console.error('Error fetching promo code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo code' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid promo code ID' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate the request body
    const validatedData = updatePromoCodeSchema.parse({ ...body, id })

    // Convert form data to database format
    const promoCodeData = {
      name: validatedData.name,
      code: validatedData.code?.toUpperCase(),
      discountType: validatedData.discountType,
      discountValue: validatedData.discountValue?.toString(),
      maxDiscountAmount: validatedData.maxDiscountAmount || null,
      isOneTimeUse: validatedData.isOneTimeUse,
      usageLimit: validatedData.usageLimit ? parseInt(validatedData.usageLimit.toString()) : null,
      isStoreWide: validatedData.isStoreWide,
      applicableProducts: validatedData.applicableProducts,
      isActive: validatedData.isActive,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      updatedAt: new Date(),
    }

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(promoCodeData).filter(([_, value]) => value !== undefined)
    )

    // Check if code already exists (excluding current promo code)
    if (updateData.code) {
      const existingPromoCode = await db
        .select()
        .from(promoCodes)
        .where(
          and(
            eq(promoCodes.code, String(updateData.code).toUpperCase()),
            not(eq(promoCodes.id, id))
          )
        )
        .limit(1)

      if (existingPromoCode.length > 0) {
        return NextResponse.json(
          { error: 'Promo code already exists' },
          { status: 400 }
        )
      }
    }

    const [updatedPromoCode] = await db
      .update(promoCodes)
      .set(updateData)
      .where(eq(promoCodes.id, id))
      .returning()

    if (!updatedPromoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedPromoCode)
  } catch (error) {
    console.error('Error updating promo code:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid promo code data', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid promo code ID' },
        { status: 400 }
      )
    }

    const [deletedPromoCode] = await db
      .delete(promoCodes)
      .where(eq(promoCodes.id, id))
      .returning()

    if (!deletedPromoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Promo code deleted successfully' })
  } catch (error) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 }
    )
  }
}