import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface Driver {
  id: string;
  userId: string;
  vehicleType: string;
  status: 'offline' | 'online' | 'on_delivery';
  rating: number;
  totalDeliveries: number;
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  driver: Driver | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (
    user: User,
    driver: Driver | null,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  setDriver: (driver: Driver) => void;
  clearAuth: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'driver_access_token',
  REFRESH_TOKEN: 'driver_refresh_token',
  USER: 'driver_user',
  DRIVER: 'driver_profile',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  driver: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user, driver, accessToken, refreshToken) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
        driver && SecureStore.setItemAsync(STORAGE_KEYS.DRIVER, JSON.stringify(driver)),
      ]);

      set({
        user,
        driver,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to store auth:', error);
    }
  },

  setDriver: (driver) => {
    set({ driver });
    SecureStore.setItemAsync(STORAGE_KEYS.DRIVER, JSON.stringify(driver));
  },

  clearAuth: async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
        SecureStore.deleteItemAsync(STORAGE_KEYS.DRIVER),
      ]);

      set({
        user: null,
        driver: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const [accessToken, refreshToken, userJson, driverJson] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.USER),
        SecureStore.getItemAsync(STORAGE_KEYS.DRIVER),
      ]);

      if (accessToken && refreshToken && userJson) {
        const user = JSON.parse(userJson);
        const driver = driverJson ? JSON.parse(driverJson) : null;
        set({
          user,
          driver,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
      set({ isLoading: false });
    }
  },
}));
