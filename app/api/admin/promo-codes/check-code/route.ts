import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { promoCodes } from '@/lib/schema'
import { ilike } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Code parameter is required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingPromoCode = await db
      .select({ id: promoCodes.id })
      .from(promoCodes)
      .where(ilike(promoCodes.code, code.toUpperCase()))
      .limit(1)

    const available = existingPromoCode.length === 0

    return NextResponse.json({
      available,
      code: code.toUpperCase(),
    })
  } catch (error) {
    console.error('Error checking promo code availability:', error)
    return NextResponse.json(
      { error: 'Failed to check code availability' },
      { status: 500 }
    )
  }
}