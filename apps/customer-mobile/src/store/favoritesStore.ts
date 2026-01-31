/**
 * Favorites Store - Saved favorite chefs
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface FavoriteChef {
  id: string;
  businessName: string;
  cuisineTypes: string[];
  profileImageUrl?: string;
  rating: number;
  reviewCount: number;
  averagePrepTime: number;
  minimumOrder: number;
  city?: string;
}

interface FavoritesState {
  favorites: FavoriteChef[];
  isLoading: boolean;
  hasLoaded: boolean;

  loadFavorites: () => Promise<void>;
  toggleFavorite: (chef: FavoriteChef) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

const STORAGE_KEY = 'ridendine_favorite_chefs';

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const persist = async (data: FavoriteChef[]) => {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,
  hasLoaded: false,

  loadFavorites: async () => {
    if (get().hasLoaded) return;
    set({ isLoading: true });

    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      const favorites = safeParse<FavoriteChef[]>(stored, []);
      set({ favorites, isLoading: false, hasLoaded: true });
    } catch (error) {
      console.error('Failed to load favorites:', error);
      set({ isLoading: false, hasLoaded: true });
    }
  },

  toggleFavorite: async (chef) => {
    const { favorites } = get();
    const exists = favorites.some((fav) => fav.id === chef.id);
    const updated = exists ? favorites.filter((fav) => fav.id !== chef.id) : [chef, ...favorites];

    set({ favorites: updated });
    await persist(updated);
  },

  removeFavorite: async (id) => {
    const { favorites } = get();
    const updated = favorites.filter((fav) => fav.id !== id);
    set({ favorites: updated });
    await persist(updated);
  },

  isFavorite: (id) => get().favorites.some((fav) => fav.id === id),
}));
