import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'
import { csvImportSchema } from '@/lib/validations/product'
import { parse } from 'csv-parse/sync'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    const content = await file.text()
    
    let records
    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid CSV format' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNumber = i + 2 // +2 because CSV is 1-indexed and we have headers
      
      try {
        // Build raw record data (tags/images as strings) and validate
        const productData = {
          name: record.name,
          handle: record.handle,
          price: record.price,
          actualPrice: record.actualPrice || null,
          comparePrice: record.comparePrice || null,
          description: record.description || null,
          tags: record.tags ?? undefined,
          images: record.images ?? undefined,
        }

        // Validate the data
        const validatedData = csvImportSchema.parse(productData)

        // Check if product with this handle already exists
        const existingProduct = await db
          .select()
          .from(products)
          .where(eq(products.handle, validatedData.handle))
          .limit(1)

        if (existingProduct.length > 0) {
          results.errors.push(`Row ${rowNumber}: Product with handle "${validatedData.handle}" already exists`)
          continue
        }

        // Transform tags/images to arrays and insert the product
        const tags = validatedData.tags
          ? String(validatedData.tags).split(',').map((tag: string) => tag.trim()).filter(Boolean)
          : []
        const images = validatedData.images
          ? String(validatedData.images).split(',').map((img: string) => img.trim()).filter(Boolean)
          : []

        await db.insert(products).values({
          name: validatedData.name,
          handle: validatedData.handle,
          price: validatedData.price,
          actualPrice: validatedData.actualPrice ?? null,
          comparePrice: validatedData.comparePrice ?? null,
          description: validatedData.description ?? null,
          tags,
          images,
        })

        results.success++
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Row ${rowNumber}: ${errorMessage}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json(
      { error: 'Failed to import CSV' },
      { status: 500 }
    )
  }
}
