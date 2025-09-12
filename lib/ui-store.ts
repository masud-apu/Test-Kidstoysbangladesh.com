"use client"

import { create } from 'zustand'

export type CheckoutMode = 'cart' | 'direct'

interface OverlayStore {
  cartOpen: boolean
  checkoutOpen: boolean
  checkoutMode: CheckoutMode
  successDialogOpen: boolean
  orderId: string
  openCart: () => void
  closeCart: () => void
  openCheckout: (mode: CheckoutMode) => void
  closeCheckout: () => void
  showSuccessDialog: (orderId: string) => void
  hideSuccessDialog: () => void
}

export const useOverlayStore = create<OverlayStore>((set) => ({
  cartOpen: false,
  checkoutOpen: false,
  checkoutMode: 'cart',
  successDialogOpen: false,
  orderId: '',
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openCheckout: (mode) => set({ checkoutOpen: true, checkoutMode: mode }),
  closeCheckout: () => set({ checkoutOpen: false }),
  showSuccessDialog: (orderId: string) => set({ successDialogOpen: true, orderId }),
  hideSuccessDialog: () => set({ successDialogOpen: false, orderId: '' }),
}))
