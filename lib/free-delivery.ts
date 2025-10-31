/**
 * Shipping Cost Utilities
 *
 * Provides shipping cost calculation based on delivery location.
 */

export function getShippingCost(deliveryType: 'inside' | 'outside'): number {
  // Standard shipping costs - always applied
  return deliveryType === 'inside' ? 60 : 120;
}
