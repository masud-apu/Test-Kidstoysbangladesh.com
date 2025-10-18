import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { packingMaterials } from '@/lib/schema'
import { desc } from 'drizzle-orm'

// GET /api/admin/inventory/materials - List all materials
export async function GET() {
  try {
    const materials = await db.select().from(packingMaterials).orderBy(desc(packingMaterials.createdAt))
    return NextResponse.json(materials)
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}

// POST /api/admin/inventory/materials - Create new material (cost tracked at batch level)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, unitOfMeasure, currentBalance } = body

    // Create material (no cost field - tracked at batch level)
    const [material] = await db
      .insert(packingMaterials)
      .values({
        name,
        unitOfMeasure: unitOfMeasure || null,
        currentBalance: (currentBalance || 0).toString(),
        isActive: true,
      })
      .returning()

    return NextResponse.json(material, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating material:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'Material with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
  }
}
