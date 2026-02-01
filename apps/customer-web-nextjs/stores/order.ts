import { create } from 'zustand';
import type { Order } from '@/types';

interface OrderState {
  currentOrder: Order | null;
  driverLocation: { lat: number; lng: number } | null;
  setCurrentOrder: (order: Order) => void;
  updateCurrentOrder: (order: Partial<Order>) => void;
  setDriverLocation: (location: { lat: number; lng: number }) => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  currentOrder: null,
  driverLocation: null,
  setCurrentOrder: (order) => set({ currentOrder: order }),
  updateCurrentOrder: (orderData) =>
    set((state) => ({
      currentOrder: state.currentOrder
        ? { ...state.currentOrder, ...orderData }
        : null,
    })),
  setDriverLocation: (location) => set({ driverLocation: location }),
  clearCurrentOrder: () => set({ currentOrder: null, driverLocation: null }),
}));
