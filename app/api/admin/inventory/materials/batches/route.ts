import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { packingMaterialBatches, packingMaterials } from "@/lib/schema"
import { eq, desc, sql } from "drizzle-orm"

// GET /api/admin/inventory/materials/batches - Get all material inventory batches
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const materialId = searchParams.get("materialId")

    const batches = materialId
      ? await db
          .select({
            id: packingMaterialBatches.id,
            materialId: packingMaterialBatches.materialId,
            batchNumber: packingMaterialBatches.batchNumber,
            purchaseAmount: packingMaterialBatches.purchaseAmount,
            remainingAmount: packingMaterialBatches.remainingAmount,
            purchaseDate: packingMaterialBatches.purchaseDate,
            notes: packingMaterialBatches.notes,
            createdAt: packingMaterialBatches.createdAt,
            material: {
              id: packingMaterials.id,
              name: packingMaterials.name,
              unitOfMeasure: packingMaterials.unitOfMeasure,
            },
          })
          .from(packingMaterialBatches)
          .leftJoin(packingMaterials, eq(packingMaterialBatches.materialId, packingMaterials.id))
          .where(eq(packingMaterialBatches.materialId, parseInt(materialId)))
          .orderBy(desc(packingMaterialBatches.purchaseDate))
      : await db
          .select({
            id: packingMaterialBatches.id,
            materialId: packingMaterialBatches.materialId,
            batchNumber: packingMaterialBatches.batchNumber,
            purchaseAmount: packingMaterialBatches.purchaseAmount,
            remainingAmount: packingMaterialBatches.remainingAmount,
            purchaseDate: packingMaterialBatches.purchaseDate,
            notes: packingMaterialBatches.notes,
            createdAt: packingMaterialBatches.createdAt,
            material: {
              id: packingMaterials.id,
              name: packingMaterials.name,
              unitOfMeasure: packingMaterials.unitOfMeasure,
            },
          })
          .from(packingMaterialBatches)
          .leftJoin(packingMaterials, eq(packingMaterialBatches.materialId, packingMaterials.id))
          .orderBy(desc(packingMaterialBatches.purchaseDate))

    return NextResponse.json(batches)
  } catch (error) {
    console.error("Error fetching material batches:", error)
    return NextResponse.json(
      { error: "Failed to fetch material batches" },
      { status: 500 }
    )
  }
}

// POST /api/admin/inventory/materials/batches - Add new material inventory batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      materialId,
      purchaseAmount,
      batchNumber,
      notes,
      purchaseDate,
    } = body

    if (!materialId || !purchaseAmount) {
      return NextResponse.json(
        { error: "Missing required fields: materialId, purchaseAmount" },
        { status: 400 }
      )
    }

    // Generate batch number if not provided
    const finalBatchNumber = batchNumber || `MAT-${Date.now()}`

    // Insert batch record
    const [batch] = await db
      .insert(packingMaterialBatches)
      .values({
        materialId: parseInt(materialId),
        batchNumber: finalBatchNumber,
        purchaseAmount: purchaseAmount.toString(),
        remainingAmount: purchaseAmount.toString(),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        notes: notes || null,
      })
      .returning()

    // Update material current balance
    await db
      .update(packingMaterials)
      .set({
        currentBalance: sql`${packingMaterials.currentBalance} + ${parseFloat(purchaseAmount)}`,
        updatedAt: new Date(),
      })
      .where(eq(packingMaterials.id, parseInt(materialId)))

    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    console.error("Error adding material batch:", error)
    return NextResponse.json(
      { error: "Failed to add material batch" },
      { status: 500 }
    )
  }
}
