import { create } from 'zustand';

interface Order {
  id: string;
  chefBusinessName: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  estimatedDistance: number;
  estimatedDuration: number;
  deliveryFee: number;
  tip: number;
  itemCount: number;
  status: string;
}

interface DeliveryState {
  availableOrders: Order[];
  activeDelivery: Order | null;
  isOnline: boolean;
  currentLocation: { lat: number; lng: number } | null;
  todayEarnings: number;
  todayDeliveries: number;

  setAvailableOrders: (orders: Order[]) => void;
  setActiveDelivery: (order: Order | null) => void;
  updateDeliveryStatus: (status: string) => void;
  setOnlineStatus: (online: boolean) => void;
  setCurrentLocation: (lat: number, lng: number) => void;
  setTodayStats: (earnings: number, deliveries: number) => void;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  availableOrders: [],
  activeDelivery: null,
  isOnline: false,
  currentLocation: null,
  todayEarnings: 0,
  todayDeliveries: 0,

  setAvailableOrders: (orders) => set({ availableOrders: orders }),

  setActiveDelivery: (order) => set({ activeDelivery: order }),

  updateDeliveryStatus: (status) => {
    const { activeDelivery } = get();
    if (activeDelivery) {
      set({ activeDelivery: { ...activeDelivery, status } });
    }
  },

  setOnlineStatus: (online) => set({ isOnline: online }),

  setCurrentLocation: (lat, lng) => set({ currentLocation: { lat, lng } }),

  setTodayStats: (earnings, deliveries) =>
    set({ todayEarnings: earnings, todayDeliveries: deliveries }),
}));
