/**
 * Shipping Cost Calculator based on weight and delivery type
 *
 * Inside Dhaka:
 * - <= 150g: 50৳
 * - > 150g and <= 500g: 60৳
 * - > 500g and <= 1kg: 70৳
 * - Each additional 1kg: +20৳
 *
 * Outside Dhaka:
 * - <= 500g: 110৳
 * - > 500g and <= 1kg: 130৳
 * - Each additional 1kg: +20৳
 */

export type DeliveryType = 'inside' | 'outside'

export interface ShippingCalculation {
  actualShippingCost: number
  totalWeightGrams: number
  totalWeightKg: number
}

/**
 * Calculate shipping cost based on total weight and delivery type
 * @param totalWeightGrams - Total order weight in grams
 * @param deliveryType - 'inside' or 'outside' Dhaka
 * @returns Shipping cost in Taka
 */
export function calculateShippingCost(
  totalWeightGrams: number,
  deliveryType: DeliveryType
): number {
  if (totalWeightGrams <= 0) {
    return 0
  }

  const weightInKg = totalWeightGrams / 1000

  if (deliveryType === 'inside') {
    // Inside Dhaka pricing
    if (totalWeightGrams <= 150) {
      return 50
    } else if (totalWeightGrams <= 500) {
      return 60
    } else if (totalWeightGrams <= 1000) {
      return 70
    } else {
      // > 1kg: base 70৳ + 20৳ per additional kg
      const additionalKg = Math.ceil(weightInKg - 1) // Round up partial kg
      return 70 + (additionalKg * 20)
    }
  } else {
    // Outside Dhaka pricing
    if (totalWeightGrams <= 500) {
      return 110
    } else if (totalWeightGrams <= 1000) {
      return 130
    } else {
      // > 1kg: base 130৳ + 20৳ per additional kg
      const additionalKg = Math.ceil(weightInKg - 1) // Round up partial kg
      return 130 + (additionalKg * 20)
    }
  }
}

/**
 * Calculate total weight and shipping cost from order items
 * @param items - Array of order items with variant information
 * @param deliveryType - 'inside' or 'outside' Dhaka
 * @returns Shipping calculation with weight and cost
 */
export function calculateOrderShipping(
  items: Array<{
    quantity: number
    weight?: number | string | null // Weight in kg from variant
  }>,
  deliveryType: DeliveryType
): ShippingCalculation {
  // Calculate total weight in grams
  let totalWeightGrams = 0

  for (const item of items) {
    const weightKg = parseFloat(String(item.weight || 0))
    const weightGrams = weightKg * 1000
    totalWeightGrams += weightGrams * item.quantity
  }

  const actualShippingCost = calculateShippingCost(totalWeightGrams, deliveryType)

  return {
    actualShippingCost,
    totalWeightGrams,
    totalWeightKg: totalWeightGrams / 1000,
  }
}
