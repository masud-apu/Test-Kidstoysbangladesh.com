/**
 * Free Delivery Campaign Utilities
 *
 * Controls the free delivery campaign behavior across the application.
 * Toggle via NEXT_PUBLIC_FREE_DELIVERY_CAMPAIGN environment variable.
 */

export function isFreeDeliveryActive(): boolean {
  return process.env.NEXT_PUBLIC_FREE_DELIVERY_CAMPAIGN === 'true';
}

export function getShippingCost(deliveryType: 'inside' | 'outside'): number {
  if (isFreeDeliveryActive()) {
    return 0;
  }

  // Standard shipping costs
  return deliveryType === 'inside' ? 60 : 120;
}

export const FREE_DELIVERY_MESSAGE = '🎉 FREE DELIVERY ALL OCTOBER 🎉';
export const FREE_DELIVERY_SUBTITLE = 'No minimum order • Valid on all products';
export const FREE_DELIVERY_MESSAGE_BN = 'অক্টোবর মাসের জন্য ফ্রি ডেলিভারি!';
