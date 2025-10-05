import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders } from '@/lib/schema'
import { desc, asc, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = db.select().from(orders)

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.where(eq(orders.status, status)) as any
    }

    // Apply sorting
    const orderBy = sortOrder === 'desc' ? desc : asc
    const sortColumn = orders[sortField as keyof typeof orders] || orders.createdAt

    const allOrders = await query.orderBy(orderBy(sortColumn))

    return NextResponse.json({ orders: allOrders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
