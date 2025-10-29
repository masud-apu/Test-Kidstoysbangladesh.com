// @ts-nocheck - Temporary fix for static export type issues with Drizzle schema
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, ProductVariant } from "./schema";
import { Analytics } from "./analytics";
import { getShippingCost as getFreeDeliveryShippingCost } from "./free-delivery";

export type DeliveryType = "inside" | "outside";

export interface SelectedOption {
  optionName: string;
  valueName: string;
}

export interface CartItem extends Product {
  quantity: number;
  // Variant-specific fields (optional for backward compatibility)
  variantId?: number;
  variantTitle?: string;
  variantSku?: string | null;
  variantPrice?: string;
  variantCompareAtPrice?: string | null;
  selectedOptions?: SelectedOption[];
}

interface CartStore {
  items: CartItem[];
  selectedItems: string[]; // Changed to string to support composite keys (productId:variantId)
  directBuyItem: CartItem | null;
  deliveryType: DeliveryType;
  addToCart: (
    product: Product,
    variant?: ProductVariant,
    selectedOptions?: SelectedOption[],
  ) => void;
  removeFromCart: (itemKey: string) => void; // Changed to support variant keys
  updateQuantity: (itemKey: string, quantity: number) => void; // Changed to support variant keys
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  setDirectBuy: (
    product: Product,
    variant?: ProductVariant,
    selectedOptions?: SelectedOption[],
  ) => void;
  updateDirectBuyQuantity: (quantity: number) => void;
  clearDirectBuy: () => void;
  toggleItemSelection: (itemKey: string) => void;
  selectAllItems: () => void;
  clearSelection: () => void;
  getSelectedItems: () => CartItem[];
  getSelectedTotal: () => number;
  setDeliveryType: (type: DeliveryType) => void;
  getShippingCost: () => number;
  getSelectedTotalWithShipping: () => number;
  getItemKey: (item: CartItem) => string;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedItems: [],
      directBuyItem: null,
      deliveryType: "outside",

      // Helper function to create unique key for cart items
      getItemKey: (item) => {
        return item.variantId ? `${item.id}:${item.variantId}` : `${item.id}`;
      },

      addToCart: (product, variant, selectedOptions) =>
        set((state) => {
          // Create cart item with variant data if provided
          const cartItem: CartItem = {
            ...product,
            quantity: 1,
            ...(variant && {
              variantId: variant.id,
              variantTitle: variant.title,
              variantSku: variant.sku,
              variantPrice: variant.price,
              variantCompareAtPrice: variant.compareAtPrice,
            }),
            ...(selectedOptions && { selectedOptions }),
          };

          const itemKey = get().getItemKey(cartItem);
          const existingItem = state.items.find(
            (item) => get().getItemKey(item) === itemKey,
          );

          const updatedItems = existingItem
            ? state.items.map((item) =>
                get().getItemKey(item) === itemKey
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              )
            : [...state.items, cartItem];

          // Auto-select newly added items
          const newSelectedItems = existingItem
            ? state.selectedItems
            : state.selectedItems.includes(itemKey)
              ? state.selectedItems
              : [...state.selectedItems, itemKey];

          return {
            items: updatedItems,
            selectedItems: newSelectedItems,
          };
        }),

      removeFromCart: (itemKey) =>
        set((state) => {
          const itemToRemove = state.items.find(
            (item) => get().getItemKey(item) === itemKey,
          );
          if (itemToRemove) {
            Analytics.trackRemoveFromCart({
              product_id: itemToRemove.id.toString(),
              product_name: itemToRemove.title,
              quantity: itemToRemove.quantity,
              variant_id: itemToRemove.variantId?.toString(),
              variant_title: itemToRemove.variantTitle,
            });
          }
          return {
            items: state.items.filter(
              (item) => get().getItemKey(item) !== itemKey,
            ),
            selectedItems: state.selectedItems.filter((key) => key !== itemKey),
          };
        }),

      updateQuantity: (itemKey, quantity) =>
        set((state) => ({
          items:
            quantity === 0
              ? state.items.filter((item) => get().getItemKey(item) !== itemKey)
              : state.items.map((item) =>
                  get().getItemKey(item) === itemKey
                    ? { ...item, quantity }
                    : item,
                ),
          selectedItems:
            quantity === 0
              ? state.selectedItems.filter((key) => key !== itemKey)
              : state.selectedItems,
        })),

      clearCart: () => set({ items: [], selectedItems: [] }),

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.variantPrice || "0";
          return total + parseFloat(price) * item.quantity;
        }, 0);
      },

      setDirectBuy: (product, variant, selectedOptions) => {
        const directItem: CartItem = {
          ...product,
          quantity: 1,
          ...(variant && {
            variantId: variant.id,
            variantTitle: variant.title,
            variantSku: variant.sku,
            variantPrice: variant.price,
            variantCompareAtPrice: variant.compareAtPrice,
          }),
          ...(selectedOptions && { selectedOptions }),
        };
        set({ directBuyItem: directItem });
      },

      updateDirectBuyQuantity: (quantity) =>
        set((state) => {
          if (!state.directBuyItem) return state;
          return {
            directBuyItem: {
              ...state.directBuyItem,
              quantity: Math.max(1, quantity),
            },
          };
        }),

      clearDirectBuy: () => set({ directBuyItem: null }),

      toggleItemSelection: (itemKey) =>
        set((state) => ({
          selectedItems: state.selectedItems.includes(itemKey)
            ? state.selectedItems.filter((key) => key !== itemKey)
            : [...state.selectedItems, itemKey],
        })),

      selectAllItems: () =>
        set((state) => ({
          selectedItems: state.items.map((item) => get().getItemKey(item)),
        })),

      clearSelection: () => set({ selectedItems: [] }),

      getSelectedItems: () => {
        const { items, selectedItems } = get();
        return items.filter((item) =>
          selectedItems.includes(get().getItemKey(item)),
        );
      },

      getSelectedTotal: () => {
        const selectedItems = get().getSelectedItems();
        return selectedItems.reduce((total, item) => {
          const price = item.variantPrice || "0";
          return total + parseFloat(price) * item.quantity;
        }, 0);
      },

      setDeliveryType: (type) => set({ deliveryType: type }),

      getShippingCost: () => {
        const { deliveryType } = get();
        return getFreeDeliveryShippingCost(deliveryType);
      },

      getSelectedTotalWithShipping: () => {
        const itemTotal = get().getSelectedTotal();
        const shipping = get().getShippingCost();
        return itemTotal + shipping;
      },
    }),
    {
      name: "cart-storage",
    },
  ),
);
