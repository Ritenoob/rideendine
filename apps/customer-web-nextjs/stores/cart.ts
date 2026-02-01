import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, MenuItem, Chef } from '@/types';

interface CartState {
  items: CartItem[];
  chef: Chef | null; // Cart is locked to one chef at a time
  addItem: (menuItem: MenuItem, chef: Chef, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateSpecialInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      chef: null,
      addItem: (menuItem, chef, quantity = 1) => {
        const state = get();

        // If adding from different chef, clear cart first
        if (state.chef && state.chef.id !== chef.id) {
          if (
            !confirm(
              `Your cart contains items from ${state.chef.businessName}. Do you want to clear your cart and add items from ${chef.businessName}?`
            )
          ) {
            return;
          }
          set({ items: [], chef });
        }

        const existingItem = state.items.find(
          (item) => item.menuItem.id === menuItem.id
        );

        if (existingItem) {
          set({
            items: state.items.map((item) =>
              item.menuItem.id === menuItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [...state.items, { menuItem, quantity }],
            chef: state.chef || chef,
          });
        }
      },
      removeItem: (menuItemId) =>
        set((state) => {
          const newItems = state.items.filter(
            (item) => item.menuItem.id !== menuItemId
          );
          return {
            items: newItems,
            chef: newItems.length === 0 ? null : state.chef,
          };
        }),
      updateQuantity: (menuItemId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.menuItem.id === menuItemId ? { ...item, quantity } : item
          ),
        })),
      updateSpecialInstructions: (menuItemId, instructions) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.menuItem.id === menuItemId
              ? { ...item, specialInstructions: instructions }
              : item
          ),
        })),
      clearCart: () => set({ items: [], chef: null }),
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },
      getSubtotal: () => {
        const state = get();
        return state.items.reduce(
          (total, item) => total + item.menuItem.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
