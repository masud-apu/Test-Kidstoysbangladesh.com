"use client"

import { create } from 'zustand'

export type CheckoutMode = 'cart' | 'direct'

interface OverlayStore {
  cartOpen: boolean
  checkoutOpen: boolean
  checkoutMode: CheckoutMode
  openCart: () => void
  closeCart: () => void
  openCheckout: (mode: CheckoutMode) => void
  closeCheckout: () => void
}

export const useOverlayStore = create<OverlayStore>((set) => ({
  cartOpen: false,
  checkoutOpen: false,
  checkoutMode: 'cart',
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openCheckout: (mode) => set({ checkoutOpen: true, checkoutMode: mode }),
  closeCheckout: () => set({ checkoutOpen: false }),
}))
