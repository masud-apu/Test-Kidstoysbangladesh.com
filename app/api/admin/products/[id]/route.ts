import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { updateProductSchema } from '@/lib/validations/product'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const product = await db.select().from(products).where(eq(products.id, id)).limit(1)
    
    if (product.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product[0])
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateProductSchema.parse({ ...body, id })

    const updateData: Record<string, unknown> = {}
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.handle) updateData.handle = validatedData.handle
    if (validatedData.price) updateData.price = validatedData.price
    
    // Handle numeric fields - convert empty strings to null
    if (validatedData.actualPrice !== undefined) {
      updateData.actualPrice = validatedData.actualPrice === "" ? null : validatedData.actualPrice
    }
    if (validatedData.comparePrice !== undefined) {
      updateData.comparePrice = validatedData.comparePrice === "" ? null : validatedData.comparePrice
    }
    
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.tags) updateData.tags = validatedData.tags
    if (validatedData.images) updateData.images = validatedData.images
    
    updateData.updatedAt = new Date()

    const updatedProduct = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning()

    if (updatedProduct.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(updatedProduct[0])
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const deletedProduct = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning()

    if (deletedProduct.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}