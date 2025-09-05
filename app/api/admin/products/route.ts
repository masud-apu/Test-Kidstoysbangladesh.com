import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { productSchema } from '@/lib/validations/product'
import { desc, asc, ilike, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const offset = (page - 1) * limit

    // Build queries (avoid mutating builder to keep types sound)
    const sortableColumns = {
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      name: products.name,
      price: products.price,
      completedOrders: products.completedOrders,
    } as const

    const sortColumn = sortableColumns[(sortBy as keyof typeof sortableColumns) || 'createdAt'] || products.createdAt
    const orderExpr = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

    const productListPromise = search
      ? db
          .select()
          .from(products)
          .where(ilike(products.name, `%${search}%`))
          .orderBy(orderExpr)
          .limit(limit)
          .offset(offset)
      : db
          .select()
          .from(products)
          .orderBy(orderExpr)
          .limit(limit)
          .offset(offset)

    const countPromise = search
      ? db
          .select({ count: count() })
          .from(products)
          .where(ilike(products.name, `%${search}%`))
      : db
          .select({ count: count() })
          .from(products)

    const [productList, totalCount] = await Promise.all([
      productListPromise,
      countPromise,
    ])

    const total = totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products: productList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = productSchema.parse(body)

    const newProduct = await db.insert(products).values({
      name: validatedData.name,
      handle: validatedData.handle,
      price: validatedData.price,
      actualPrice: validatedData.actualPrice === "" ? null : validatedData.actualPrice || null,
      comparePrice: validatedData.comparePrice === "" ? null : validatedData.comparePrice || null,
      description: validatedData.description || null,
      tags: validatedData.tags,
      images: validatedData.images,
    }).returning()

    return NextResponse.json(newProduct[0], { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
