/**
 * Order Store - Manages active order tracking state
 */
import { create } from 'zustand';

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  chefId: string;
  chefName: string;
  driverId?: string;
  driverName?: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip: number;
  total: number;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    lat: number;
    lng: number;
  };
  estimatedDeliveryTime?: string;
  createdAt: string;
}

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
}

interface OrderState {
  activeOrder: Order | null;
  driverLocation: DriverLocation | null;
  etaMinutes: number | null;
  orderHistory: Order[];
  isTracking: boolean;

  // Actions
  setActiveOrder: (order: Order) => void;
  updateOrderStatus: (status: string) => void;
  setDriverLocation: (location: DriverLocation) => void;
  setEta: (minutes: number) => void;
  clearActiveOrder: () => void;
  setOrderHistory: (orders: Order[]) => void;
  setIsTracking: (tracking: boolean) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  activeOrder: null,
  driverLocation: null,
  etaMinutes: null,
  orderHistory: [],
  isTracking: false,

  setActiveOrder: (order) => {
    set({ activeOrder: order, isTracking: true });
  },

  updateOrderStatus: (status) => {
    const { activeOrder } = get();
    if (activeOrder) {
      set({ activeOrder: { ...activeOrder, status } });
    }
  },

  setDriverLocation: (location) => {
    set({ driverLocation: location });
  },

  setEta: (minutes) => {
    set({ etaMinutes: minutes });
  },

  clearActiveOrder: () => {
    set({
      activeOrder: null,
      driverLocation: null,
      etaMinutes: null,
      isTracking: false,
    });
  },

  setOrderHistory: (orders) => {
    set({ orderHistory: orders });
  },

  setIsTracking: (tracking) => {
    set({ isTracking: tracking });
  },
}));
