import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, productVariants, productOptions, productOptionValues, variantSelectedOptions } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params

    // Fetch product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.handle, handle))
      .limit(1)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch variants
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(productVariants.position)

    // Fetch options
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
      .orderBy(productOptions.position)

    // Fetch option values for each option (including images)
    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        const values = await db
          .select({
            id: productOptionValues.id,
            optionId: productOptionValues.optionId,
            value: productOptionValues.value,
            image: productOptionValues.image,
            position: productOptionValues.position,
            createdAt: productOptionValues.createdAt,
          })
          .from(productOptionValues)
          .where(eq(productOptionValues.optionId, option.id))
          .orderBy(productOptionValues.position)

        return { ...option, values }
      })
    )

    // Fetch selected options for each variant
    const variantsWithOptions = await Promise.all(
      variants.map(async (variant) => {
        const selectedOpts = await db
          .select({
            id: variantSelectedOptions.id,
            variantId: variantSelectedOptions.variantId,
            optionId: variantSelectedOptions.optionId,
            optionValueId: variantSelectedOptions.optionValueId,
            optionName: productOptions.name,
            valueName: productOptionValues.value,
          })
          .from(variantSelectedOptions)
          .innerJoin(productOptions, eq(variantSelectedOptions.optionId, productOptions.id))
          .innerJoin(productOptionValues, eq(variantSelectedOptions.optionValueId, productOptionValues.id))
          .where(eq(variantSelectedOptions.variantId, variant.id))

        return {
          ...variant,
          selectedOptions: selectedOpts.map(opt => ({
            optionName: opt.optionName,
            valueName: opt.valueName,
          })),
        }
      })
    )

    return NextResponse.json({
      product,
      variants: variantsWithOptions,
      options: optionsWithValues,
    })
  } catch (error) {
    console.error('Error fetching product with variants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
