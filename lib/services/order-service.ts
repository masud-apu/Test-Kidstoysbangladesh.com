import { db } from "@/lib/db"
import { orders, orderItems, productVariants, inventoryBatches, orderPackingDetails, boxTypes, boxTransactions, packingMaterials, packingMaterialTransactions, type MediaItem } from "@/lib/schema"
import { deductInventoryFIFO } from "./inventory-service"
import { deductBoxInventoryFIFO, deductMaterialInventoryFIFO, revertBoxInventoryFIFO, revertMaterialInventoryFIFO, type BoxBatchAllocation, type MaterialBatchAllocation } from "./packing-inventory-service"
import { eq, sql, inArray } from "drizzle-orm"
import { calculateOrderShipping, type DeliveryType } from "@/lib/utils/shipping-calculator"

export interface OrderItemWithCost {
  productId: number
  variantId: number | null
  productName: string
  productPrice: string
  productImage: string | null
  variantTitle: string | null
  variantSku: string | null
  selectedOptions: Array<{ optionName: string; valueName: string }> | null
  quantity: number
  itemTotal: string
  purchaseCost: string | null
  batchAllocations: Array<{ batchId: number; quantity: number; costPerUnit: string }> | null
}

export interface OrderCostCalculation {
  totalPackingCharges: number
  totalPurchaseCost: number
  totalProfit: number
}

/**
 * Calculate actual shipping cost based on order items' weights and delivery type
 */
export async function calculateActualShippingCost(
  items: Array<{
    variantId?: number | null
    quantity: number
  }>,
  deliveryType: DeliveryType
): Promise<{
  actualShippingCost: number
  totalWeightGrams: number
  totalWeightKg: number
}> {
  // Get all variant IDs that have a variantId
  const variantIds = items
    .filter((item) => item.variantId)
    .map((item) => item.variantId as number)

  if (variantIds.length === 0) {
    // No variants with IDs, return 0 shipping
    return {
      actualShippingCost: 0,
      totalWeightGrams: 0,
      totalWeightKg: 0,
    }
  }

  // Fetch variant weights from database
  const variants = await db
    .select({
      id: productVariants.id,
      weight: productVariants.weight,
    })
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds))

  // Create a map of variantId -> weight
  const weightMap = new Map(variants.map((v) => [v.id, v.weight]))

  // Build items array with weights for shipping calculator
  const itemsWithWeights = items.map((item) => ({
    quantity: item.quantity,
    weight: item.variantId ? weightMap.get(item.variantId) : null,
  }))

  // Calculate shipping using the utility function
  return calculateOrderShipping(itemsWithWeights, deliveryType)
}

/**
 * Auto-calculate packing from variant defaults (box type + materials)
 * Aggregates boxes by type and sums material costs from all items
 */
export async function calculatePackingFromVariants(
  items: Array<{
    variantId?: number | null
    quantity: number
  }>
): Promise<{
  boxesUsed: Array<{ boxTypeId: number; boxName: string; quantity: number; costPerBox: string; totalCost: string }>
  materialsUsed: Array<{ materialId: number; materialName: string; costUsed: string }>
  totalBoxCost: string
  totalMaterialCost: string
  totalPackingCost: string
}> {
  // Get all variant IDs
  const variantIds = items
    .filter((item) => item.variantId)
    .map((item) => item.variantId as number)

  if (variantIds.length === 0) {
    return {
      boxesUsed: [],
      materialsUsed: [],
      totalBoxCost: "0.00",
      totalMaterialCost: "0.00",
      totalPackingCost: "0.00",
    }
  }

  // Fetch variant packing defaults
  const variants = await db
    .select({
      id: productVariants.id,
      defaultBoxTypeId: productVariants.defaultBoxTypeId,
      defaultMaterials: productVariants.defaultMaterials,
    })
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds))

  // Create map of variantId -> packing config
  const variantPackingMap = new Map(
    variants.map((v) => [v.id, { boxTypeId: v.defaultBoxTypeId, materials: v.defaultMaterials as Array<{ materialId: number; name: string; cost: string }> || [] }])
  )

  // Aggregate boxes by type
  const boxMap = new Map<number, number>() // boxTypeId -> quantity
  // Aggregate materials by id
  const materialMap = new Map<number, { name: string; totalCost: number }>() // materialId -> { name, totalCost }

  for (const item of items) {
    if (!item.variantId) continue

    const packingConfig = variantPackingMap.get(item.variantId)
    if (!packingConfig) continue

    // Aggregate boxes
    if (packingConfig.boxTypeId) {
      const currentQty = boxMap.get(packingConfig.boxTypeId) || 0
      boxMap.set(packingConfig.boxTypeId, currentQty + item.quantity)
    }

    // Aggregate materials
    for (const material of packingConfig.materials) {
      const currentData = materialMap.get(material.materialId) || { name: material.name, totalCost: 0 }
      currentData.totalCost += parseFloat(material.cost) * item.quantity
      materialMap.set(material.materialId, currentData)
    }
  }

  // Fetch box types to get names and costs
  const boxTypeIds = Array.from(boxMap.keys())
  const boxTypesData = boxTypeIds.length > 0
    ? await db.select().from(boxTypes).where(inArray(boxTypes.id, boxTypeIds))
    : []

  const boxTypeCostMap = new Map(
    boxTypesData.map((bt) => {
      // Cost is tracked at batch level, not box type level
      // For now, we'll use 0 as default cost since we don't have batch data here
      const cost = 0
      return [bt.id, { name: bt.name, cost }]
    })
  )

  // Build boxes used array
  const boxesUsed = Array.from(boxMap.entries()).map(([boxTypeId, quantity]) => {
    const boxData = boxTypeCostMap.get(boxTypeId) || { name: "Unknown Box", cost: 0 }
    const totalCost = boxData.cost * quantity
    return {
      boxTypeId,
      boxName: boxData.name,
      quantity,
      costPerBox: boxData.cost.toFixed(2),
      totalCost: totalCost.toFixed(2),
    }
  })

  // Build materials used array
  const materialsUsed = Array.from(materialMap.entries()).map(([materialId, data]) => ({
    materialId,
    materialName: data.name,
    costUsed: data.totalCost.toFixed(2),
  }))

  // Calculate totals
  const totalBoxCost = boxesUsed.reduce((sum, box) => sum + parseFloat(box.totalCost), 0)
  const totalMaterialCost = materialsUsed.reduce((sum, mat) => sum + parseFloat(mat.costUsed), 0)
  const totalPackingCost = totalBoxCost + totalMaterialCost

  return {
    boxesUsed,
    materialsUsed,
    totalBoxCost: totalBoxCost.toFixed(2),
    totalMaterialCost: totalMaterialCost.toFixed(2),
    totalPackingCost: totalPackingCost.toFixed(2),
  }
}

/**
 * Prepare order items WITHOUT deducting inventory or calculating costs
 * Used during order placement - inventory will be deducted when status changes to "shipped"
 */
export async function prepareOrderItems(
  items: Array<{
    id: number
    variantId?: number | null
    name: string
    price?: string
    variantPrice?: string
    images?: (string | MediaItem)[]
    variantTitle?: string | null
    variantSku?: string | null
    selectedOptions?: Array<{ optionName: string; valueName: string }>
    quantity: number
  }>
): Promise<{
  orderItems: OrderItemWithCost[]
  success: boolean
  error?: string
}> {
  const processedItems: OrderItemWithCost[] = []

  try {
    for (const item of items) {
      const effectivePrice = item.variantPrice || item.price || "0"
      const itemTotal = parseFloat(effectivePrice) * item.quantity

      // Extract image URL - handle both string and MediaItem formats
      const firstImage = item.images?.[0]
      const imageUrl = firstImage
        ? (typeof firstImage === 'string' ? firstImage : firstImage.url)
        : null

      processedItems.push({
        productId: item.id,
        variantId: item.variantId || null,
        productName: item.name,
        productPrice: effectivePrice,
        productImage: imageUrl,
        variantTitle: item.variantTitle || null,
        variantSku: item.variantSku || null,
        selectedOptions: item.selectedOptions || null,
        quantity: item.quantity,
        itemTotal: itemTotal.toString(),
        // Costs will be calculated when status changes to "shipped"
        purchaseCost: null,
        batchAllocations: null,
      })
    }

    return {
      orderItems: processedItems,
      success: true,
    }
  } catch (error) {
    console.error("Error preparing order items:", error)
    return {
      orderItems: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Process inventory deduction and cost calculation when order status changes to "shipped"
 * This is the ONLY place where inventory should be deducted
 */
export async function processInventoryAndCosts(
  orderId: number
): Promise<{
  success: boolean
  costCalculation?: OrderCostCalculation
  error?: string
}> {
  try {
    // Get order with items
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))

    if (!order) {
      return {
        success: false,
        error: "Order not found",
      }
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))

    let totalPackingCharges = 0
    let totalPurchaseCost = 0

    // Process each item
    for (const item of items) {
      if (!item.variantId) continue

      // Get variant details
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))

      if (!variant) continue

      // Deduct inventory using FIFO
      const deductionResult = await deductInventoryFIFO(
        item.variantId,
        item.quantity
      )

      if (!deductionResult.success) {
        return {
          success: false,
          error: `Insufficient inventory for ${item.productName}: ${deductionResult.error}`,
        }
      }

      totalPurchaseCost += deductionResult.totalCost

      // Update order item with costs and batch allocations
      await db
        .update(orderItems)
        .set({
          purchaseCost: deductionResult.totalCost.toString(),
          batchAllocations: deductionResult.allocations,
        })
        .where(eq(orderItems.id, item.id))
    }

    // Check for packing details and deduct box/material inventory
    const [packingDetails] = await db
      .select()
      .from(orderPackingDetails)
      .where(eq(orderPackingDetails.orderId, orderId))

    if (packingDetails && !packingDetails.isInventoryDeducted) {
      // Deduct boxes from inventory using FIFO
      const boxesUsed = packingDetails.boxesUsed as Array<{ boxTypeId: number; boxName: string; quantity: number; costPerBox: string; totalCost: string }>
      const boxBatchAllocations: Array<{ boxTypeId: number; boxTypeName: string; quantity: number; batchAllocations: BoxBatchAllocation[]; totalCost: number }> = []

      for (const boxUsage of boxesUsed) {
        // Deduct using FIFO
        const deductionResult = await deductBoxInventoryFIFO(
          boxUsage.boxTypeId,
          boxUsage.quantity
        )

        if (!deductionResult.success) {
          return {
            success: false,
            error: `Failed to deduct box inventory: ${deductionResult.error}`,
          }
        }

        boxBatchAllocations.push({
          boxTypeId: boxUsage.boxTypeId,
          boxTypeName: boxUsage.boxName,
          quantity: boxUsage.quantity,
          batchAllocations: deductionResult.allocations,
          totalCost: deductionResult.totalCost,
        })

        totalPackingCharges += deductionResult.totalCost

        // Create box transaction record for audit trail
        const [boxType] = await db.select().from(boxTypes).where(eq(boxTypes.id, boxUsage.boxTypeId))
        if (boxType) {
          await db.insert(boxTransactions).values({
            boxTypeId: boxUsage.boxTypeId,
            transactionType: "order_use",
            quantity: -boxUsage.quantity,
            stockBefore: boxType.currentStock + boxUsage.quantity, // Stock before deduction
            stockAfter: boxType.currentStock, // Stock after deduction
            orderId: orderId,
            notes: `Used for order ${order.orderId} (FIFO)`,
            createdBy: null,
          })
        }
      }

      // Deduct materials from balance using FIFO
      const materialsUsed = packingDetails.materialsUsed as Array<{ materialId: number; materialName: string; costUsed: string }>
      const materialBatchAllocations: Array<{ materialId: number; materialName: string; amount: string; batchAllocations: MaterialBatchAllocation[]; totalCost: number }> = []

      for (const materialUsage of materialsUsed) {
        const materialCost = parseFloat(materialUsage.costUsed || "0")
        if (materialCost <= 0) continue

        // Deduct using FIFO
        const deductionResult = await deductMaterialInventoryFIFO(
          materialUsage.materialId,
          materialCost
        )

        if (!deductionResult.success) {
          console.warn(`Failed to deduct material inventory: ${deductionResult.error}`)
          // Continue without failing - materials are tracked as monetary value
        }

        materialBatchAllocations.push({
          materialId: materialUsage.materialId,
          materialName: materialUsage.materialName,
          amount: materialCost.toFixed(2),
          batchAllocations: deductionResult.allocations,
          totalCost: deductionResult.totalCost,
        })

        totalPackingCharges += deductionResult.totalCost

        // Create material transaction record for audit trail
        const [material] = await db.select().from(packingMaterials).where(eq(packingMaterials.id, materialUsage.materialId))
        if (material) {
          const currentBalance = parseFloat(material.currentBalance)
          await db.insert(packingMaterialTransactions).values({
            materialId: materialUsage.materialId,
            transactionType: "order_use",
            amount: (-materialCost).toFixed(2),
            balanceBefore: (currentBalance + materialCost).toFixed(2), // Balance before deduction
            balanceAfter: currentBalance.toFixed(2), // Balance after deduction
            orderId: orderId,
            notes: `Used for order ${order.orderId} (FIFO)`,
            createdBy: null,
          })
        }
      }

      // Update packing details to mark inventory as deducted and store batch allocations
      await db
        .update(orderPackingDetails)
        .set({
          isInventoryDeducted: true,
          boxesUsed: JSON.parse(JSON.stringify(boxBatchAllocations)), // Store with batch allocations
          materialsUsed: JSON.parse(JSON.stringify(materialBatchAllocations)), // Store with batch allocations
          updatedAt: new Date(),
        })
        .where(eq(orderPackingDetails.orderId, orderId))

      // Total packing charges now comes from FIFO costs (already accumulated above)
      // totalPackingCharges already includes box and material costs from FIFO
    }

    // Calculate COD cost (1% of total amount) - will match the value set at order creation
    const totalAmount = parseFloat(order.totalAmount)
    const codCost = totalAmount * 0.01

    // Calculate profit
    const totalProfit = calculateOrderProfit(
      totalAmount,
      totalPurchaseCost,
      totalPackingCharges,
      parseFloat(order.actualShippingCost || order.shippingCost),
      codCost
    )

    // Update order with cost calculations
    await db
      .update(orders)
      .set({
        totalPackingCharges: totalPackingCharges.toString(),
        totalPurchaseCost: totalPurchaseCost.toString(),
        codCost: codCost.toString(),
        totalProfit: totalProfit.toString(),
      })
      .where(eq(orders.id, orderId))

    return {
      success: true,
      costCalculation: {
        totalPackingCharges,
        totalPurchaseCost,
        totalProfit,
      },
    }
  } catch (error) {
    console.error("Error processing inventory and costs:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Revert inventory deduction and recalculate costs when order is returned
 * This adds quantities back to the original batches and sets profit to negative
 */
export async function revertInventoryAndCosts(
  orderId: number
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Get order with items
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))

    if (!order) {
      return {
        success: false,
        error: "Order not found",
      }
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))

    // Revert inventory for each item
    for (const item of items) {
      if (!item.variantId || !item.batchAllocations) continue

      const allocations = item.batchAllocations as Array<{
        batchId: number
        quantity: number
        costPerUnit: string
      }>

      // Add quantities back to the original batches
      for (const allocation of allocations) {
        await db
          .update(inventoryBatches)
          .set({
            remainingQuantity: sql`${inventoryBatches.remainingQuantity} + ${allocation.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(inventoryBatches.id, allocation.batchId))
      }

      // Update variant inventory
      await db
        .update(productVariants)
        .set({
          inventoryQuantity: sql`${productVariants.inventoryQuantity} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, item.variantId))
    }

    // Revert packing inventory (boxes and materials)
    const [packingDetails] = await db
      .select()
      .from(orderPackingDetails)
      .where(eq(orderPackingDetails.orderId, orderId))

    if (packingDetails && packingDetails.isInventoryDeducted) {
      // Revert boxes using FIFO
      const boxesUsed = packingDetails.boxesUsed as Array<{ boxTypeId: number; boxName?: string; quantity: number; batchAllocations?: BoxBatchAllocation[]; totalCost?: string }>
      for (const boxUsage of boxesUsed) {
        // If batch allocations exist, use FIFO revert
        if (boxUsage.batchAllocations && boxUsage.batchAllocations.length > 0) {
          const revertResult = await revertBoxInventoryFIFO(
            boxUsage.batchAllocations,
            boxUsage.boxTypeId
          )
          if (!revertResult.success) {
            console.error(`Failed to revert box inventory: ${revertResult.error}`)
          }
        } else {
          // Fallback for old orders without batch allocations
          await db
            .update(boxTypes)
            .set({
              currentStock: sql`${boxTypes.currentStock} + ${boxUsage.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(boxTypes.id, boxUsage.boxTypeId))
        }

        // Create revert transaction for audit trail
        const [boxType] = await db.select().from(boxTypes).where(eq(boxTypes.id, boxUsage.boxTypeId))
        if (boxType) {
          await db.insert(boxTransactions).values({
            boxTypeId: boxUsage.boxTypeId,
            transactionType: "revert",
            quantity: boxUsage.quantity,
            stockBefore: boxType.currentStock - boxUsage.quantity, // Stock before revert
            stockAfter: boxType.currentStock, // Stock after revert
            orderId: orderId,
            notes: `Reverted from returned order ${order.orderId} (FIFO)`,
            createdBy: null,
          })
        }
      }

      // Revert materials using FIFO
      const materialsUsed = packingDetails.materialsUsed as Array<{ materialId: number; materialName?: string; costUsed?: string; batchAllocations?: MaterialBatchAllocation[]; totalCost?: string }>
      for (const materialUsage of materialsUsed) {
        const materialCost = parseFloat(materialUsage.costUsed || "0")
        if (materialCost <= 0) continue

        // If batch allocations exist, use FIFO revert
        if (materialUsage.batchAllocations && materialUsage.batchAllocations.length > 0) {
          const revertResult = await revertMaterialInventoryFIFO(
            materialUsage.batchAllocations,
            materialUsage.materialId
          )
          if (!revertResult.success) {
            console.error(`Failed to revert material inventory: ${revertResult.error}`)
          }
        } else {
          // Fallback for old orders without batch allocations
          await db
            .update(packingMaterials)
            .set({
              currentBalance: sql`${packingMaterials.currentBalance}::numeric + ${materialCost}`,
              updatedAt: new Date(),
            })
            .where(eq(packingMaterials.id, materialUsage.materialId))
        }

        // Create revert transaction for audit trail
        const [material] = await db.select().from(packingMaterials).where(eq(packingMaterials.id, materialUsage.materialId))
        if (material) {
          const currentBalance = parseFloat(material.currentBalance)
          await db.insert(packingMaterialTransactions).values({
            materialId: materialUsage.materialId,
            transactionType: "revert",
            amount: materialCost.toFixed(2),
            balanceBefore: (currentBalance - materialCost).toFixed(2), // Balance before revert
            balanceAfter: currentBalance.toFixed(2), // Balance after revert
            orderId: orderId,
            notes: `Reverted from returned order ${order.orderId} (FIFO)`,
            createdBy: null,
          })
        }
      }

      // Mark packing inventory as not deducted
      await db
        .update(orderPackingDetails)
        .set({
          isInventoryDeducted: false,
          updatedAt: new Date(),
        })
        .where(eq(orderPackingDetails.orderId, orderId))
    }

    // Calculate negative profit (loss from return)
    // Loss = Purchase Cost + Packing Charges + Shipping Cost + COD Cost (we paid these but got no revenue)
    const totalPurchaseCost = parseFloat(order.totalPurchaseCost || "0")
    const totalPackingCharges = parseFloat(order.totalPackingCharges || "0")
    const actualShippingCost = parseFloat(order.actualShippingCost || order.shippingCost)
    const codCost = parseFloat(order.codCost || "0")

    const negativeProfitLoss = -(totalPurchaseCost + totalPackingCharges + actualShippingCost + codCost)

    // Update order with negative profit
    await db
      .update(orders)
      .set({
        totalProfit: negativeProfitLoss.toString(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error reverting inventory and costs:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Calculate order profit
 * Profit = Total Amount - Purchase Cost - Packing Charges - Shipping Cost - COD Cost
 */
export function calculateOrderProfit(
  totalAmount: number,
  totalPurchaseCost: number,
  totalPackingCharges: number,
  actualShippingCost: number,
  codCost: number = 0
): number {
  return totalAmount - totalPurchaseCost - totalPackingCharges - actualShippingCost - codCost
}
