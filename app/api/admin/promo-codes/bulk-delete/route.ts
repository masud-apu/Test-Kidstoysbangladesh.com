import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { promoCodes } from '@/lib/schema'
import { bulkDeletePromoCodesSchema } from '@/lib/validations/promo-code'
import { inArray } from 'drizzle-orm'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const validatedData = bulkDeletePromoCodesSchema.parse(body)

    // Delete promo codes
    const deletedPromoCodes = await db
      .delete(promoCodes)
      .where(inArray(promoCodes.id, validatedData.ids))
      .returning()

    if (deletedPromoCodes.length === 0) {
      return NextResponse.json(
        { error: 'No promo codes found to delete' },
        { status: 404 }
      )
    }

    const deletedCount = deletedPromoCodes.length
    const requestedCount = validatedData.ids.length

    if (deletedCount < requestedCount) {
      return NextResponse.json({
        message: `Successfully deleted ${deletedCount} out of ${requestedCount} promo codes. Some promo codes may not have existed.`,
        deletedCount,
        requestedCount,
      })
    }

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} promo code${deletedCount !== 1 ? 's' : ''}`,
      deletedCount,
    })
  } catch (error) {
    console.error('Error bulk deleting promo codes:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete promo codes' },
      { status: 500 }
    )
  }
}