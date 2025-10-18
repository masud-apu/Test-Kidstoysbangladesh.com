import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { boxInventoryBatches, boxTypes } from "@/lib/schema"
import { eq, desc, sql } from "drizzle-orm"

// GET /api/admin/inventory/boxes/batches - Get all box inventory batches
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const boxTypeId = searchParams.get("boxTypeId")

    const batches = boxTypeId
      ? await db
          .select({
            id: boxInventoryBatches.id,
            boxTypeId: boxInventoryBatches.boxTypeId,
            batchNumber: boxInventoryBatches.batchNumber,
            purchasePrice: boxInventoryBatches.purchasePrice,
            quantity: boxInventoryBatches.quantity,
            remainingQuantity: boxInventoryBatches.remainingQuantity,
            purchaseDate: boxInventoryBatches.purchaseDate,
            notes: boxInventoryBatches.notes,
            createdAt: boxInventoryBatches.createdAt,
            boxType: {
              id: boxTypes.id,
              name: boxTypes.name,
              dimensions: boxTypes.dimensions,
            },
          })
          .from(boxInventoryBatches)
          .leftJoin(boxTypes, eq(boxInventoryBatches.boxTypeId, boxTypes.id))
          .where(eq(boxInventoryBatches.boxTypeId, parseInt(boxTypeId)))
          .orderBy(desc(boxInventoryBatches.purchaseDate))
      : await db
          .select({
            id: boxInventoryBatches.id,
            boxTypeId: boxInventoryBatches.boxTypeId,
            batchNumber: boxInventoryBatches.batchNumber,
            purchasePrice: boxInventoryBatches.purchasePrice,
            quantity: boxInventoryBatches.quantity,
            remainingQuantity: boxInventoryBatches.remainingQuantity,
            purchaseDate: boxInventoryBatches.purchaseDate,
            notes: boxInventoryBatches.notes,
            createdAt: boxInventoryBatches.createdAt,
            boxType: {
              id: boxTypes.id,
              name: boxTypes.name,
              dimensions: boxTypes.dimensions,
            },
          })
          .from(boxInventoryBatches)
          .leftJoin(boxTypes, eq(boxInventoryBatches.boxTypeId, boxTypes.id))
          .orderBy(desc(boxInventoryBatches.purchaseDate))

    return NextResponse.json(batches)
  } catch (error) {
    console.error("Error fetching box batches:", error)
    return NextResponse.json(
      { error: "Failed to fetch box batches" },
      { status: 500 }
    )
  }
}

// POST /api/admin/inventory/boxes/batches - Add new box inventory batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      boxTypeId,
      quantity,
      purchasePrice,
      batchNumber,
      notes,
      purchaseDate,
    } = body

    if (!boxTypeId || !quantity || !purchasePrice) {
      return NextResponse.json(
        { error: "Missing required fields: boxTypeId, quantity, purchasePrice" },
        { status: 400 }
      )
    }

    // Generate batch number if not provided
    const finalBatchNumber = batchNumber || `BOX-${Date.now()}`

    // Insert batch record
    const [batch] = await db
      .insert(boxInventoryBatches)
      .values({
        boxTypeId: parseInt(boxTypeId),
        batchNumber: finalBatchNumber,
        purchasePrice: purchasePrice.toString(),
        quantity: parseInt(quantity),
        remainingQuantity: parseInt(quantity),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        notes: notes || null,
      })
      .returning()

    // Update box type total stock
    await db
      .update(boxTypes)
      .set({
        currentStock: sql`${boxTypes.currentStock} + ${parseInt(quantity)}`,
        updatedAt: new Date(),
      })
      .where(eq(boxTypes.id, parseInt(boxTypeId)))

    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    console.error("Error adding box batch:", error)
    return NextResponse.json(
      { error: "Failed to add box batch" },
      { status: 500 }
    )
  }
}
