/**
 * Cart Store - Manages shopping cart state
 */
import { create } from 'zustand';

interface MenuItem {
  id: string;
  menuId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  preparationTime: number;
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
}

interface Chef {
  id: string;
  businessName: string;
  profileImageUrl?: string;
  address: string;
  city: string;
  deliveryRadius: number;
  minimumOrder: number;
  averagePrepTime: number;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartState {
  chef: Chef | null;
  items: CartItem[];
  tip: number;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    lat: number;
    lng: number;
    instructions?: string;
  } | null;

  // Computed
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  total: number;
  itemCount: number;

  // Actions
  setChef: (chef: Chef) => void;
  addItem: (item: MenuItem, quantity?: number, instructions?: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateInstructions: (itemId: string, instructions: string) => void;
  setTip: (amount: number) => void;
  setDeliveryAddress: (address: CartState['deliveryAddress']) => void;
  clearCart: () => void;
}

const SERVICE_FEE_RATE = 0.05;
const TAX_RATE = 0.08;
const BASE_DELIVERY_FEE = 500; // $5.00

const calculateTotals = (items: CartItem[], tip: number) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const deliveryFee = items.length > 0 ? BASE_DELIVERY_FEE : 0;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const tax = Math.round((subtotal + serviceFee) * TAX_RATE);
  const total = subtotal + deliveryFee + serviceFee + tax + tip;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, deliveryFee, serviceFee, tax, total, itemCount };
};

export const useCartStore = create<CartState>((set, get) => ({
  chef: null,
  items: [],
  tip: 0,
  deliveryAddress: null,
  subtotal: 0,
  deliveryFee: 0,
  serviceFee: 0,
  tax: 0,
  total: 0,
  itemCount: 0,

  setChef: (chef) => {
    const currentChef = get().chef;
    // Clear cart if switching to a different chef
    if (currentChef && currentChef.id !== chef.id) {
      set({
        chef,
        items: [],
        tip: 0,
        ...calculateTotals([], 0),
      });
    } else {
      set({ chef });
    }
  },

  addItem: (item, quantity = 1, instructions) => {
    const { items, tip } = get();
    const existingIndex = items.findIndex((i) => i.menuItem.id === item.id);

    let newItems: CartItem[];
    if (existingIndex >= 0) {
      newItems = items.map((cartItem, index) =>
        index === existingIndex
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      );
    } else {
      newItems = [...items, { menuItem: item, quantity, specialInstructions: instructions }];
    }

    set({
      items: newItems,
      ...calculateTotals(newItems, tip),
    });
  },

  updateItemQuantity: (itemId, quantity) => {
    const { items, tip } = get();
    const newItems =
      quantity <= 0
        ? items.filter((item) => item.menuItem.id !== itemId)
        : items.map((item) =>
            item.menuItem.id === itemId ? { ...item, quantity } : item
          );

    set({
      items: newItems,
      ...calculateTotals(newItems, tip),
    });
  },

  removeItem: (itemId) => {
    const { items, tip } = get();
    const newItems = items.filter((item) => item.menuItem.id !== itemId);

    set({
      items: newItems,
      ...calculateTotals(newItems, tip),
    });
  },

  updateInstructions: (itemId, instructions) => {
    const { items } = get();
    const newItems = items.map((item) =>
      item.menuItem.id === itemId
        ? { ...item, specialInstructions: instructions }
        : item
    );
    set({ items: newItems });
  },

  setTip: (amount) => {
    const { items } = get();
    set({
      tip: amount,
      ...calculateTotals(items, amount),
    });
  },

  setDeliveryAddress: (address) => {
    set({ deliveryAddress: address });
  },

  clearCart: () => {
    set({
      chef: null,
      items: [],
      tip: 0,
      deliveryAddress: null,
      ...calculateTotals([], 0),
    });
  },
}));
