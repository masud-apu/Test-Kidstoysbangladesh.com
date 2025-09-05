import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { bulkDeleteSchema } from '@/lib/validations/product'
import { inArray } from 'drizzle-orm'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = bulkDeleteSchema.parse(body)

    const deletedProducts = await db
      .delete(products)
      .where(inArray(products.id, ids))
      .returning({ id: products.id })

    return NextResponse.json({
      message: `${deletedProducts.length} products deleted successfully`,
      deletedIds: deletedProducts.map(p => p.id)
    })
  } catch (error) {
    console.error('Error bulk deleting products:', error)
    return NextResponse.json(
      { error: 'Failed to delete products' },
      { status: 500 }
    )
  }
}