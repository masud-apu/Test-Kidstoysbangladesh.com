import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/schema'
import { eq, ilike, desc, asc, sql, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '25')
    const search = searchParams.get('search') ?? ''
    const sortBy = searchParams.get('sortBy') ?? 'createdAt'
    const sortOrder = searchParams.get('sortOrder') ?? 'desc'
    const status = searchParams.get('status') ?? ''

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions = []
    
    if (search) {
      whereConditions.push(
        sql`${orders.orderId} ILIKE ${`%${search}%`} OR ${orders.customerName} ILIKE ${`%${search}%`} OR ${orders.customerPhone} ILIKE ${`%${search}%`}`
      )
    }

    if (status) {
      whereConditions.push(eq(orders.status, status))
    }

    const whereClause = whereConditions.length > 0 
      ? sql`${whereConditions[0]}${whereConditions.slice(1).map(condition => sql` AND ${condition}`).join('')}`
      : undefined

    // Get total count
    const totalQuery = whereClause 
      ? db.select({ count: count() }).from(orders).where(whereClause)
      : db.select({ count: count() }).from(orders)
    
    const [{ count: total }] = await totalQuery

    // Build order by clause
    const orderByColumn = orders[sortBy as keyof typeof orders] || orders.createdAt
    const orderByClause = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn)

    // Get orders with pagination
    const ordersQuery = db.select().from(orders)
    
    if (whereClause) {
      ordersQuery.where(whereClause)
    }
    
    const ordersData = await ordersQuery
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      orders: ordersData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}