import { db } from "@/lib/db"
import { boxInventoryBatches, packingMaterialBatches, boxTypes, packingMaterials } from "@/lib/schema"
import { eq, and, gt, asc, sql } from "drizzle-orm"

/**
 * Box batch allocation for FIFO tracking
 */
export interface BoxBatchAllocation {
  batchId: number
  quantity: number
  costPerUnit: string
}

/**
 * Material batch allocation for FIFO tracking
 */
export interface MaterialBatchAllocation {
  batchId: number
  amount: string
}

/**
 * Box inventory deduction result
 */
export interface BoxInventoryDeductionResult {
  success: boolean
  allocations: BoxBatchAllocation[]
  totalCost: number
  error?: string
}

/**
 * Material inventory deduction result
 */
export interface MaterialInventoryDeductionResult {
  success: boolean
  allocations: MaterialBatchAllocation[]
  totalCost: number
  error?: string
}

/**
 * Deduct box inventory using FIFO (First In First Out) method
 * @param boxTypeId - The box type ID
 * @param quantityNeeded - How many boxes to deduct
 * @returns Result with batch allocations and total cost
 */
export async function deductBoxInventoryFIFO(
  boxTypeId: number,
  quantityNeeded: number
): Promise<BoxInventoryDeductionResult> {
  try {
    // Get available batches ordered by purchase date (FIFO)
    const batches = await db
      .select()
      .from(boxInventoryBatches)
      .where(
        and(
          eq(boxInventoryBatches.boxTypeId, boxTypeId),
          gt(boxInventoryBatches.remainingQuantity, 0)
        )
      )
      .orderBy(asc(boxInventoryBatches.purchaseDate))

    if (batches.length === 0) {
      return {
        success: false,
        allocations: [],
        totalCost: 0,
        error: "No box inventory available",
      }
    }

    // Calculate total available inventory
    const totalAvailable = batches.reduce(
      (sum, batch) => sum + batch.remainingQuantity,
      0
    )

    if (totalAvailable < quantityNeeded) {
      return {
        success: false,
        allocations: [],
        totalCost: 0,
        error: `Insufficient box inventory. Available: ${totalAvailable}, Needed: ${quantityNeeded}`,
      }
    }

    // Allocate from batches using FIFO
    const allocations: BoxBatchAllocation[] = []
    let remainingQuantity = quantityNeeded
    let totalCost = 0

    for (const batch of batches) {
      if (remainingQuantity <= 0) break

      const quantityFromThisBatch = Math.min(
        batch.remainingQuantity,
        remainingQuantity
      )
      const costPerUnit = parseFloat(batch.purchasePrice || "0")
      const batchCost = quantityFromThisBatch * costPerUnit

      allocations.push({
        batchId: batch.id,
        quantity: quantityFromThisBatch,
        costPerUnit: batch.purchasePrice || "0",
      })

      totalCost += batchCost
      remainingQuantity -= quantityFromThisBatch

      // Update batch remaining quantity
      await db
        .update(boxInventoryBatches)
        .set({
          remainingQuantity: batch.remainingQuantity - quantityFromThisBatch,
          updatedAt: new Date(),
        })
        .where(eq(boxInventoryBatches.id, batch.id))
    }

    // Update box type total stock
    await db
      .update(boxTypes)
      .set({
        currentStock: sql`${boxTypes.currentStock} - ${quantityNeeded}`,
        updatedAt: new Date(),
      })
      .where(eq(boxTypes.id, boxTypeId))

    return {
      success: true,
      allocations,
      totalCost,
    }
  } catch (error) {
    console.error("Error deducting box inventory:", error)
    return {
      success: false,
      allocations: [],
      totalCost: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Deduct packing material inventory using FIFO (First In First Out) method
 * @param materialId - The material ID
 * @param amountNeeded - Monetary amount to deduct
 * @returns Result with batch allocations and total cost
 */
export async function deductMaterialInventoryFIFO(
  materialId: number,
  amountNeeded: number
): Promise<MaterialInventoryDeductionResult> {
  try {
    // Get available batches ordered by purchase date (FIFO)
    const batches = await db
      .select()
      .from(packingMaterialBatches)
      .where(
        and(
          eq(packingMaterialBatches.materialId, materialId),
          gt(packingMaterialBatches.remainingAmount, "0")
        )
      )
      .orderBy(asc(packingMaterialBatches.purchaseDate))

    if (batches.length === 0) {
      return {
        success: false,
        allocations: [],
        totalCost: 0,
        error: "No material inventory available",
      }
    }

    // Calculate total available amount
    const totalAvailable = batches.reduce(
      (sum, batch) => sum + parseFloat(batch.remainingAmount || "0"),
      0
    )

    if (totalAvailable < amountNeeded) {
      // Allow partial deduction with warning
      console.warn(`Insufficient material inventory. Available: ${totalAvailable}, Needed: ${amountNeeded}`)
      // Continue with available amount (materials are tracked monetarily, so we can go negative)
    }

    // Allocate from batches using FIFO
    const allocations: MaterialBatchAllocation[] = []
    let remainingAmount = amountNeeded
    let totalCost = 0

    for (const batch of batches) {
      if (remainingAmount <= 0) break

      const availableInBatch = parseFloat(batch.remainingAmount || "0")
      const amountFromThisBatch = Math.min(availableInBatch, remainingAmount)

      if (amountFromThisBatch > 0) {
        allocations.push({
          batchId: batch.id,
          amount: amountFromThisBatch.toFixed(2),
        })

        totalCost += amountFromThisBatch
        remainingAmount -= amountFromThisBatch

        // Update batch remaining amount
        const newRemainingAmount = Math.max(0, availableInBatch - amountFromThisBatch)
        await db
          .update(packingMaterialBatches)
          .set({
            remainingAmount: newRemainingAmount.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(packingMaterialBatches.id, batch.id))
      }
    }

    // Update material total balance
    await db
      .update(packingMaterials)
      .set({
        currentBalance: sql`GREATEST(0, ${packingMaterials.currentBalance}::numeric - ${amountNeeded})`,
        updatedAt: new Date(),
      })
      .where(eq(packingMaterials.id, materialId))

    return {
      success: true,
      allocations,
      totalCost,
    }
  } catch (error) {
    console.error("Error deducting material inventory:", error)
    return {
      success: false,
      allocations: [],
      totalCost: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Revert box inventory deduction (for order returns/cancellations)
 * @param allocations - The batch allocations to revert
 * @param boxTypeId - The box type ID
 */
export async function revertBoxInventoryFIFO(
  allocations: BoxBatchAllocation[],
  boxTypeId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    let totalQuantity = 0

    for (const allocation of allocations) {
      // Add quantity back to the batch
      await db
        .update(boxInventoryBatches)
        .set({
          remainingQuantity: sql`${boxInventoryBatches.remainingQuantity} + ${allocation.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(boxInventoryBatches.id, allocation.batchId))

      totalQuantity += allocation.quantity
    }

    // Update box type total stock
    await db
      .update(boxTypes)
      .set({
        currentStock: sql`${boxTypes.currentStock} + ${totalQuantity}`,
        updatedAt: new Date(),
      })
      .where(eq(boxTypes.id, boxTypeId))

    return { success: true }
  } catch (error) {
    console.error("Error reverting box inventory:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Revert material inventory deduction (for order returns/cancellations)
 * @param allocations - The batch allocations to revert
 * @param materialId - The material ID
 */
export async function revertMaterialInventoryFIFO(
  allocations: MaterialBatchAllocation[],
  materialId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    let totalAmount = 0

    for (const allocation of allocations) {
      const amount = parseFloat(allocation.amount || "0")

      // Add amount back to the batch
      await db
        .update(packingMaterialBatches)
        .set({
          remainingAmount: sql`${packingMaterialBatches.remainingAmount}::numeric + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(packingMaterialBatches.id, allocation.batchId))

      totalAmount += amount
    }

    // Update material total balance
    await db
      .update(packingMaterials)
      .set({
        currentBalance: sql`${packingMaterials.currentBalance}::numeric + ${totalAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(packingMaterials.id, materialId))

    return { success: true }
  } catch (error) {
    console.error("Error reverting material inventory:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
