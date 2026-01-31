/**
 * Profile Store - Saved addresses and payment methods
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  instructions?: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
}

interface ProfileState {
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  hasLoaded: boolean;

  loadProfileData: () => Promise<void>;

  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, updates: Partial<Address>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;

  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => Promise<void>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
}

const STORAGE_KEYS = {
  ADDRESSES: 'ridendine_addresses',
  PAYMENT_METHODS: 'ridendine_payment_methods',
};

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const persist = async (key: string, data: unknown) => {
  await SecureStore.setItemAsync(key, JSON.stringify(data));
};

const ensureSingleDefault = <T extends { id: string; isDefault: boolean }>(
  items: T[],
  defaultId?: string,
) => {
  if (!items.length) return items;
  const targetId = defaultId || items.find((item) => item.isDefault)?.id || items[0].id;
  return items.map((item) => ({
    ...item,
    isDefault: item.id === targetId,
  }));
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  addresses: [],
  paymentMethods: [],
  isLoading: false,
  hasLoaded: false,

  loadProfileData: async () => {
    if (get().hasLoaded) return;

    set({ isLoading: true });
    try {
      const [addressesRaw, paymentRaw] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ADDRESSES),
        SecureStore.getItemAsync(STORAGE_KEYS.PAYMENT_METHODS),
      ]);

      const addresses = ensureSingleDefault<Address>(safeParse(addressesRaw, []));
      const paymentMethods = ensureSingleDefault<PaymentMethod>(safeParse(paymentRaw, []));

      set({ addresses, paymentMethods, hasLoaded: true, isLoading: false });
    } catch (error) {
      console.error('Failed to load profile data:', error);
      set({ isLoading: false, hasLoaded: true });
    }
  },

  addAddress: async (address) => {
    const { addresses } = get();
    const id = `addr_${Date.now()}`;
    const isDefault = address.isDefault || addresses.length === 0;

    const updated = ensureSingleDefault<Address>(
      [...addresses, { ...address, id, isDefault }],
      isDefault ? id : undefined,
    );

    set({ addresses: updated });
    await persist(STORAGE_KEYS.ADDRESSES, updated);
  },

  updateAddress: async (id, updates) => {
    const { addresses } = get();
    const updated = addresses.map((address) =>
      address.id === id ? { ...address, ...updates } : address,
    );

    const normalized = ensureSingleDefault<Address>(updated, updates.isDefault ? id : undefined);

    set({ addresses: normalized });
    await persist(STORAGE_KEYS.ADDRESSES, normalized);
  },

  removeAddress: async (id) => {
    const { addresses } = get();
    const updated = addresses.filter((address) => address.id !== id);
    const normalized = ensureSingleDefault<Address>(updated);

    set({ addresses: normalized });
    await persist(STORAGE_KEYS.ADDRESSES, normalized);
  },

  setDefaultAddress: async (id) => {
    const { addresses } = get();
    const updated = ensureSingleDefault<Address>(addresses, id);

    set({ addresses: updated });
    await persist(STORAGE_KEYS.ADDRESSES, updated);
  },

  addPaymentMethod: async (method) => {
    const { paymentMethods } = get();
    const id = `pm_${Date.now()}`;
    const isDefault = method.isDefault || paymentMethods.length === 0;

    const updated = ensureSingleDefault<PaymentMethod>(
      [...paymentMethods, { ...method, id, isDefault }],
      isDefault ? id : undefined,
    );

    set({ paymentMethods: updated });
    await persist(STORAGE_KEYS.PAYMENT_METHODS, updated);
  },

  updatePaymentMethod: async (id, updates) => {
    const { paymentMethods } = get();
    const updated = paymentMethods.map((method) =>
      method.id === id ? { ...method, ...updates } : method,
    );

    const normalized = ensureSingleDefault<PaymentMethod>(
      updated,
      updates.isDefault ? id : undefined,
    );

    set({ paymentMethods: normalized });
    await persist(STORAGE_KEYS.PAYMENT_METHODS, normalized);
  },

  removePaymentMethod: async (id) => {
    const { paymentMethods } = get();
    const updated = paymentMethods.filter((method) => method.id !== id);
    const normalized = ensureSingleDefault<PaymentMethod>(updated);

    set({ paymentMethods: normalized });
    await persist(STORAGE_KEYS.PAYMENT_METHODS, normalized);
  },

  setDefaultPaymentMethod: async (id) => {
    const { paymentMethods } = get();
    const updated = ensureSingleDefault<PaymentMethod>(paymentMethods, id);

    set({ paymentMethods: updated });
    await persist(STORAGE_KEYS.PAYMENT_METHODS, updated);
  },
}));
