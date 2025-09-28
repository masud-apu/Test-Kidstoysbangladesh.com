import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { promoCodes } from '@/lib/schema'
import { promoCodeSchema } from '@/lib/validations/promo-code'
import { desc, asc, ilike, count, or } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build queries
    const sortableColumns = {
      createdAt: promoCodes.createdAt,
      updatedAt: promoCodes.updatedAt,
      name: promoCodes.name,
      code: promoCodes.code,
      discountValue: promoCodes.discountValue,
      usedCount: promoCodes.usedCount,
      isActive: promoCodes.isActive,
      expiresAt: promoCodes.expiresAt,
    } as const

    const sortColumn = sortableColumns[(sortBy as keyof typeof sortableColumns) || 'createdAt'] || promoCodes.createdAt
    const orderExpr = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

    const promoCodeListPromise = search
      ? db
          .select()
          .from(promoCodes)
          .where(
            or(
              ilike(promoCodes.name, `%${search}%`),
              ilike(promoCodes.code, `%${search}%`)
            )
          )
          .orderBy(orderExpr)
          .limit(limit)
          .offset(offset)
      : db
          .select()
          .from(promoCodes)
          .orderBy(orderExpr)
          .limit(limit)
          .offset(offset)

    const countPromise = search
      ? db
          .select({ count: count() })
          .from(promoCodes)
          .where(
            or(
              ilike(promoCodes.name, `%${search}%`),
              ilike(promoCodes.code, `%${search}%`)
            )
          )
      : db
          .select({ count: count() })
          .from(promoCodes)

    const [promoCodeList, totalCount] = await Promise.all([
      promoCodeListPromise,
      countPromise,
    ])

    const total = totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      promoCodes: promoCodeList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const validatedData = promoCodeSchema.parse(body)

    // Convert form data to database format
    const promoCodeData = {
      name: validatedData.name,
      code: validatedData.code.toUpperCase(),
      discountType: validatedData.discountType,
      discountValue: validatedData.discountValue.toString(),
      maxDiscountAmount: validatedData.maxDiscountAmount || null,
      isOneTimeUse: validatedData.isOneTimeUse,
      usageLimit: validatedData.usageLimit ? parseInt(validatedData.usageLimit) : null,
      usedCount: 0,
      isStoreWide: validatedData.isStoreWide,
      applicableProducts: validatedData.applicableProducts,
      isActive: validatedData.isActive,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
    }

    // Check if code already exists
    const existingPromoCode = await db
      .select()
      .from(promoCodes)
      .where(ilike(promoCodes.code, promoCodeData.code))
      .limit(1)

    if (existingPromoCode.length > 0) {
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 400 }
      )
    }

    const [newPromoCode] = await db
      .insert(promoCodes)
      .values(promoCodeData)
      .returning()

    return NextResponse.json(newPromoCode, { status: 201 })
  } catch (error) {
    console.error('Error creating promo code:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid promo code data', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create promo code' },
      { status: 500 }
    )
  }
}