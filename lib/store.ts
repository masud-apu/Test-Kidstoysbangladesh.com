import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from './schema'

export interface CartItem extends Product {
  quantity: number
}

interface CartStore {
  items: CartItem[]
  selectedItems: number[]
  directBuyItem: CartItem | null
  addToCart: (product: Product) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  setDirectBuy: (product: Product) => void
  clearDirectBuy: () => void
  toggleItemSelection: (productId: number) => void
  selectAllItems: () => void
  clearSelection: () => void
  getSelectedItems: () => CartItem[]
  getSelectedTotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedItems: [],
      directBuyItem: null,
      
      addToCart: (product) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id)
          const updatedItems = existingItem
            ? state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            : [...state.items, { ...product, quantity: 1 }]
          
          // Auto-select newly added items
          const newSelectedItems = existingItem
            ? state.selectedItems
            : state.selectedItems.includes(product.id)
            ? state.selectedItems
            : [...state.selectedItems, product.id]
          
          return {
            items: updatedItems,
            selectedItems: newSelectedItems,
          }
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
          selectedItems: state.selectedItems.filter(id => id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity === 0
            ? state.items.filter((item) => item.id !== productId)
            : state.items.map((item) =>
                item.id === productId ? { ...item, quantity } : item
              ),
          selectedItems: quantity === 0
            ? state.selectedItems.filter(id => id !== productId)
            : state.selectedItems,
        })),

      clearCart: () => set({ items: [], selectedItems: [] }),

      getTotalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0)
      },

      setDirectBuy: (product) => 
        set({ directBuyItem: { ...product, quantity: 1 } }),

      clearDirectBuy: () => set({ directBuyItem: null }),

      toggleItemSelection: (productId) =>
        set((state) => ({
          selectedItems: state.selectedItems.includes(productId)
            ? state.selectedItems.filter(id => id !== productId)
            : [...state.selectedItems, productId],
        })),

      selectAllItems: () =>
        set((state) => ({
          selectedItems: state.items.map(item => item.id),
        })),

      clearSelection: () => set({ selectedItems: [] }),

      getSelectedItems: () => {
        const { items, selectedItems } = get()
        return items.filter(item => selectedItems.includes(item.id))
      },

      getSelectedTotal: () => {
        const selectedItems = get().getSelectedItems()
        return selectedItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)