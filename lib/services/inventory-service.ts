import { db } from "@/lib/db"
import { inventoryBatches, productVariants, products } from "@/lib/schema"
import { eq, and, gt, asc, sql } from "drizzle-orm"
import { FinanceService } from "@/lib/services/finance-service"

export interface BatchAllocation {
  batchId: number
  quantity: number
  costPerUnit: string
}

export interface InventoryDeductionResult {
  success: boolean
  allocations: BatchAllocation[]
  totalCost: number
  error?: string
}

/**
 * Deduct inventory using FIFO (First In First Out) method
 * @param variantId - The product variant ID
 * @param quantityNeeded - How many units to deduct
 * @returns Result with batch allocations and total cost
 */
export async function deductInventoryFIFO(
  variantId: number,
  quantityNeeded: number
): Promise<InventoryDeductionResult> {
  try {
    // Get available batches ordered by purchase date (FIFO)
    const batches = await db
      .select()
      .from(inventoryBatches)
      .where(
        and(
          eq(inventoryBatches.variantId, variantId),
          gt(inventoryBatches.remainingQuantity, 0)
        )
      )
      .orderBy(asc(inventoryBatches.purchaseDate))

    if (batches.length === 0) {
      return {
        success: false,
        allocations: [],
        totalCost: 0,
        error: "No inventory available",
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
        error: `Insufficient inventory. Available: ${totalAvailable}, Needed: ${quantityNeeded}`,
      }
    }

    // Allocate from batches using FIFO
    const allocations: BatchAllocation[] = []
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
        .update(inventoryBatches)
        .set({
          remainingQuantity: batch.remainingQuantity - quantityFromThisBatch,
          updatedAt: new Date(),
        })
        .where(eq(inventoryBatches.id, batch.id))
    }

    // Update variant total inventory
    await db
      .update(productVariants)
      .set({
        inventoryQuantity: sql`${productVariants.inventoryQuantity} - ${quantityNeeded}`,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId))

    return {
      success: true,
      allocations,
      totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
    }
  } catch (error) {
    console.error("Error deducting inventory:", error)
    return {
      success: false,
      allocations: [],
      totalCost: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Add inventory batch
 * @param variantId - The product variant ID
 * @param quantity - How many units to add
 * @param purchasePrice - Cost per unit
 * @param batchNumber - Optional batch number (auto-generated if not provided)
 * @param notes - Optional notes about the batch
 */
export async function addInventoryBatch(
  variantId: number,
  quantity: number,
  purchasePrice: string,
  batchNumber?: string,
  notes?: string,
  purchaseDate?: Date
) {
  try {
    // Auto-generate batch number if not provided
    const finalBatchNumber =
      batchNumber || `BATCH-${Date.now()}-${variantId}`

    // Insert new batch
    const [newBatch] = await db
      .insert(inventoryBatches)
      .values({
        variantId,
        batchNumber: finalBatchNumber,
        purchasePrice,
        quantity,
        remainingQuantity: quantity,
        purchaseDate: purchaseDate || new Date(),
        notes,
      })
      .returning()

    // Update variant total inventory
    await db
      .update(productVariants)
      .set({
        inventoryQuantity: sql`${productVariants.inventoryQuantity} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId))

    // Get product and variant details for description
    const [variantInfo] = await db
      .select({
        variantTitle: productVariants.title,
        productTitle: products.title,
      })
      .from(productVariants)
      .leftJoin(products, eq(productVariants.productId, products.id))
      .where(eq(productVariants.id, variantId))
      .limit(1)

    // Record finance transaction for inventory purchase
    const totalCost = parseFloat(purchasePrice) * quantity
    await FinanceService.recordInventoryPurchase(
      totalCost,
      `Inventory purchase: ${variantInfo?.productTitle || 'Product'} - ${variantInfo?.variantTitle || 'Variant'} (${quantity} units @ ৳${purchasePrice}/unit)`,
      newBatch.id
    )

    return { success: true, batch: newBatch }
  } catch (error) {
    console.error("Error adding inventory batch:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get all inventory batches for a variant
 */
export async function getInventoryBatches(variantId: number) {
  return await db
    .select()
    .from(inventoryBatches)
    .where(eq(inventoryBatches.variantId, variantId))
    .orderBy(asc(inventoryBatches.purchaseDate))
}

/**
 * Get available inventory for a variant
 */
export async function getAvailableInventory(variantId: number) {
  const batches = await db
    .select()
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.variantId, variantId),
        gt(inventoryBatches.remainingQuantity, 0)
      )
    )

  const totalAvailable = batches.reduce(
    (sum, batch) => sum + batch.remainingQuantity,
    0
  )

  return {
    totalAvailable,
    batches,
  }
}
