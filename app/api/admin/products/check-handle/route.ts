import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { eq, and, ne } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { handle, excludeId } = await request.json()
    
    if (!handle) {
      return NextResponse.json({ isUnique: false, message: 'Handle is required' })
    }

    // Check if handle exists, optionally excluding a specific product ID (for updates)
    const query = excludeId 
      ? db.select().from(products).where(and(eq(products.handle, handle), ne(products.id, excludeId)))
      : db.select().from(products).where(eq(products.handle, handle))
    
    const existingProduct = await query.limit(1)
    
    const isUnique = existingProduct.length === 0
    
    return NextResponse.json({
      isUnique,
      message: isUnique ? 'Handle is available' : 'Handle already exists'
    })
    
  } catch (error) {
    console.error('Handle check error:', error)
    return NextResponse.json(
      { isUnique: false, message: 'Error checking handle availability' },
      { status: 500 }
    )
  }
}