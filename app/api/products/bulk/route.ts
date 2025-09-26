import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { inArray } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Valid product IDs are required' },
        { status: 400 }
      )
    }

    const productList = await db
      .select()
      .from(products)
      .where(inArray(products.id, ids))

    return NextResponse.json({ products: productList })
  } catch (error) {
    console.error('Error fetching products by IDs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}