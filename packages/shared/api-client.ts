/**
 * RideNDine API Client
 * Unified API client for all frontend applications
 */

import type {
  ApiResponse,
  AuthResponse,
  Chef,
  ChefSearchParams,
  Menu,
  MenuItem,
  Order,
  PaginatedResponse,
  User,
  Address,
  Review,
  EarningsSummary,
  EarningsTransaction,
  Driver,
} from './types';

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private config: ApiClientConfig;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = true,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (requiresAuth) {
      const token = this.config.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - try token refresh
    if (response.status === 401 && requiresAuth) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        const newToken = this.config.getAccessToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
        }
        const retryResponse = await fetch(url, { ...options, headers });
        if (!retryResponse.ok) {
          const error = await retryResponse.json();
          throw new Error(error.message || 'Request failed');
        }
        return retryResponse.json();
      } else {
        this.config.onUnauthorized?.();
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.config.getRefreshToken();
        if (!refreshToken) return false;

        const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        this.config.setTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ============ Auth ============
  async register(
    email: string,
    password: string,
    role: 'customer' | 'home_chef' | 'driver',
    firstName?: string,
    lastName?: string,
    phone?: string,
  ): Promise<ApiResponse<{ user: User }>> {
    return this.request(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, role, firstName, lastName, phone }),
      },
      false,
    );
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<ApiResponse<AuthResponse>>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false,
    );

    if (response.success && response.data) {
      this.config.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.config.clearTokens();
    }
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request('/users/me');
  }

  async updateMe(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============ Chefs ============
  async searchChefs(params: ChefSearchParams): Promise<ApiResponse<PaginatedResponse<Chef>>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return this.request(`/chefs/search?${searchParams.toString()}`, {}, false);
  }

  async getChef(chefId: string): Promise<ApiResponse<Chef>> {
    return this.request(`/chefs/${chefId}`, {}, false);
  }

  async getChefMenus(chefId: string): Promise<ApiResponse<Menu[]>> {
    return this.request(`/chefs/${chefId}/menus`, {}, false);
  }

  async getChefReviews(
    chefId: string,
    page = 1,
    perPage = 20,
  ): Promise<ApiResponse<PaginatedResponse<Review>>> {
    return this.request(`/chefs/${chefId}/reviews?page=${page}&perPage=${perPage}`, {}, false);
  }

  // ============ Chef Dashboard ============
  async applyAsChef(data: {
    businessName: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    cuisineTypes: string[];
    minimumOrderCents?: number;
    deliveryRadiusKm?: number;
    operatingHours?: Record<string, { isOpen: boolean; openTime?: string; closeTime?: string }>;
  }): Promise<ApiResponse<Chef>> {
    return this.request('/chefs/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChef(chefId: string, data: Partial<Chef>): Promise<ApiResponse<Chef>> {
    return this.request(`/chefs/${chefId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getStripeOnboardingLink(chefId: string): Promise<ApiResponse<{ url: string }>> {
    return this.request(`/chefs/${chefId}/stripe/onboard`, { method: 'POST' });
  }

  async getStripeStatus(chefId: string): Promise<
    ApiResponse<{
      connected: boolean;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
    }>
  > {
    return this.request(`/chefs/${chefId}/stripe/status`);
  }

  async toggleVacationMode(chefId: string): Promise<ApiResponse<Chef>> {
    return this.request(`/chefs/${chefId}/toggle-vacation-mode`, { method: 'POST' });
  }

  // ============ Menus ============
  async createMenu(
    chefId: string,
    data: {
      name: string;
      description?: string;
    },
  ): Promise<ApiResponse<Menu>> {
    return this.request(`/chefs/${chefId}/menus`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenu(menuId: string, data: Partial<Menu>): Promise<ApiResponse<Menu>> {
    return this.request(`/menus/${menuId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMenu(menuId: string): Promise<ApiResponse<void>> {
    return this.request(`/menus/${menuId}`, { method: 'DELETE' });
  }

  async createMenuItem(
    menuId: string,
    data: {
      name: string;
      description?: string;
      priceCents: number;
      preparationTimeMinutes?: number;
      allergens?: string[];
      dietaryTags?: string[];
    },
  ): Promise<ApiResponse<MenuItem>> {
    return this.request(`/menus/${menuId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(itemId: string, data: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    return this.request(`/menu-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuItem(itemId: string): Promise<ApiResponse<void>> {
    return this.request(`/menu-items/${itemId}`, { method: 'DELETE' });
  }

  // ============ Orders ============
  async createOrder(data: {
    chefId: string;
    items: { menuItemId: string; quantity: number; notes?: string }[];
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    deliveryInstructions?: string;
    scheduledDeliveryTime?: string;
  }): Promise<ApiResponse<{ order: Order; clientSecret: string }>> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${orderId}`);
  }

  async getOrders(params?: {
    status?: string;
    page?: number;
    perPage?: number;
  }): Promise<ApiResponse<PaginatedResponse<Order>>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    return this.request(`/orders?${searchParams.toString()}`);
  }

  async createPaymentIntent(orderId: string): Promise<ApiResponse<{ clientSecret: string }>> {
    return this.request(`/orders/${orderId}/create-payment-intent`, { method: 'POST' });
  }

  async acceptOrder(orderId: string, estimatedReadyTime?: string): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${orderId}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ estimatedReadyTime }),
    });
  }

  async rejectOrder(orderId: string, rejectionReason: string): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${orderId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason }),
    });
  }

  async markOrderReady(orderId: string): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${orderId}/ready`, { method: 'PATCH' });
  }

  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ cancellationReason: reason }),
    });
  }

  async getOrderETA(orderId: string): Promise<ApiResponse<{ etaMinutes: number }>> {
    return this.request(`/orders/${orderId}/eta`);
  }

  // ============ Driver ============
  async registerAsDriver(data: {
    vehicleType: string;
    vehicleColor?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    licensePlate?: string;
  }): Promise<ApiResponse<Driver>> {
    return this.request('/drivers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDriverProfile(): Promise<ApiResponse<Driver>> {
    return this.request('/drivers/me');
  }

  async updateDriverStatus(isOnline: boolean): Promise<ApiResponse<Driver>> {
    return this.request('/drivers/status', {
      method: 'PATCH',
      body: JSON.stringify({ isOnline }),
    });
  }

  async updateDriverLocation(
    latitude: number,
    longitude: number,
    heading?: number,
  ): Promise<ApiResponse<void>> {
    return this.request('/drivers/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, heading }),
    });
  }

  async getAvailableOrders(): Promise<ApiResponse<Order[]>> {
    return this.request('/drivers/available-orders');
  }

  async acceptDelivery(orderId: string): Promise<ApiResponse<Order>> {
    return this.request(`/drivers/orders/${orderId}/accept`, { method: 'POST' });
  }

  async pickupOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.request(`/drivers/orders/${orderId}/pickup`, { method: 'POST' });
  }

  async deliverOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.request(`/drivers/orders/${orderId}/deliver`, { method: 'POST' });
  }

  async getDriverEarnings(): Promise<ApiResponse<EarningsSummary>> {
    return this.request('/drivers/earnings');
  }

  async getDriverDeliveryHistory(
    page = 1,
    perPage = 20,
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    return this.request(`/drivers/deliveries?page=${page}&perPage=${perPage}`);
  }

  // ============ Addresses ============
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    return this.request('/users/me/addresses');
  }

  async createAddress(data: Omit<Address, 'id' | 'userId'>): Promise<ApiResponse<Address>> {
    return this.request('/users/me/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAddress(addressId: string, data: Partial<Address>): Promise<ApiResponse<Address>> {
    return this.request(`/users/me/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAddress(addressId: string): Promise<ApiResponse<void>> {
    return this.request(`/users/me/addresses/${addressId}`, { method: 'DELETE' });
  }

  // ============ Reviews ============
  async createReview(
    orderId: string,
    data: {
      foodRating: number;
      deliveryRating?: number;
      overallRating: number;
      comment?: string;
    },
  ): Promise<ApiResponse<Review>> {
    return this.request(`/orders/${orderId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ Chef Earnings ============
  async getChefEarnings(chefId: string): Promise<ApiResponse<EarningsSummary>> {
    return this.request(`/chefs/${chefId}/earnings`);
  }

  async getChefTransactions(
    chefId: string,
    page = 1,
    perPage = 20,
  ): Promise<ApiResponse<PaginatedResponse<EarningsTransaction>>> {
    return this.request(`/chefs/${chefId}/transactions?page=${page}&perPage=${perPage}`);
  }

  // ============ Admin ============
  async getPendingChefs(): Promise<ApiResponse<Chef[]>> {
    return this.request('/admin/chefs/pending');
  }

  async verifyChef(
    chefId: string,
    status: 'approved' | 'rejected',
    notes?: string,
  ): Promise<ApiResponse<Chef>> {
    return this.request(`/admin/chefs/${chefId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async getPendingDrivers(): Promise<ApiResponse<Driver[]>> {
    return this.request('/admin/drivers/pending');
  }

  async verifyDriver(
    driverId: string,
    status: 'approved' | 'rejected',
    notes?: string,
  ): Promise<ApiResponse<Driver>> {
    return this.request(`/admin/drivers/${driverId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
