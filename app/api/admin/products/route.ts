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

    // Build query with search
    let query = db.select().from(products)
    let countQuery = db.select({ count: count() }).from(products)

    if (search) {
      query = query.where(ilike(products.name, `%${search}%`))
      countQuery = countQuery.where(ilike(products.name, `%${search}%`))
    }

    // Add sorting
    const sortColumn = products[sortBy as keyof typeof products] || products.createdAt
    query = sortOrder === 'asc' 
      ? query.orderBy(asc(sortColumn))
      : query.orderBy(desc(sortColumn))

    // Add pagination
    query = query.limit(limit).offset(offset)

    const [productList, totalCount] = await Promise.all([
      query,
      countQuery
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