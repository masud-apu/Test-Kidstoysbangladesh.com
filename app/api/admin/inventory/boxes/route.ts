import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { boxTypes } from '@/lib/schema'
import { desc } from 'drizzle-orm'

// GET /api/admin/inventory/boxes - List all box types
export async function GET() {
  try {
    const boxes = await db.select().from(boxTypes).orderBy(desc(boxTypes.createdAt))
    return NextResponse.json(boxes)
  } catch (error) {
    console.error('Error fetching box types:', error)
    return NextResponse.json({ error: 'Failed to fetch box types' }, { status: 500 })
  }
}

// POST /api/admin/inventory/boxes - Create new box type (cost tracked at batch level)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, dimensions, currentStock } = body

    // Create box type (no cost field - tracked at batch level)
    const [boxType] = await db
      .insert(boxTypes)
      .values({
        name,
        dimensions: dimensions || null,
        currentStock: currentStock || 0,
        isActive: true,
      })
      .returning()

    return NextResponse.json(boxType, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating box type:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'Box type with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create box type' }, { status: 500 })
  }
}
