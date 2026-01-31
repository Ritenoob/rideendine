/**
 * RideNDine API Client
 * Cross-platform HTTP client for all frontend apps
 */

import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Chef,
  ChefSearchParams,
  Menu,
  MenuItem,
  Order,
  CreateOrderRequest,
  PaymentIntentResponse,
  Driver,
  AvailableOrder,
  Review,
  CreateReviewRequest,
  PaginatedResponse,
  ApiError,
} from '../types';
import { API_VERSION, DEFAULT_API_URL } from '../constants';

export interface ApiClientConfig {
  baseUrl?: string;
  getAccessToken?: () => string | null;
  onTokenExpired?: () => void;
  onError?: (error: ApiError) => void;
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken: () => string | null;
  private onTokenExpired?: () => void;
  private onError?: (error: ApiError) => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_API_URL;
    this.getAccessToken = config.getAccessToken || (() => null);
    this.onTokenExpired = config.onTokenExpired;
    this.onError = config.onError;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/${API_VERSION}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.onTokenExpired?.();
        throw { statusCode: 401, message: 'Unauthorized' };
      }

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          statusCode: response.status,
          message: data.message || 'An error occurred',
          error: data.error,
        };
        this.onError?.(error);
        throw error;
      }

      return data as T;
    } catch (error) {
      if ((error as ApiError).statusCode) {
        throw error;
      }
      const networkError: ApiError = {
        statusCode: 0,
        message: 'Network error. Please check your connection.',
      };
      this.onError?.(networkError);
      throw networkError;
    }
  }

  // ============ Auth Endpoints ============

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', { method: 'POST' });
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============ Chef Endpoints ============

  async searchChefs(params: ChefSearchParams): Promise<Chef[]> {
    const query = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      ...(params.radius && { radius: params.radius.toString() }),
      ...(params.cuisineType && { cuisineType: params.cuisineType }),
      ...(params.minRating && { minRating: params.minRating.toString() }),
      ...(params.sortBy && { sortBy: params.sortBy }),
    });
    return this.request<Chef[]>(`/chefs/search?${query}`);
  }

  async getChef(id: string): Promise<Chef> {
    return this.request<Chef>(`/chefs/${id}`);
  }

  async getChefMenus(chefId: string): Promise<Menu[]> {
    return this.request<Menu[]>(`/chefs/${chefId}/menus`);
  }

  async getMenu(menuId: string): Promise<Menu> {
    return this.request<Menu>(`/menus/${menuId}`);
  }

  // ============ Chef Dashboard Endpoints ============

  async applyAsChef(data: Partial<Chef>): Promise<Chef> {
    return this.request<Chef>('/chefs/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChefProfile(chefId: string, data: Partial<Chef>): Promise<Chef> {
    return this.request<Chef>(`/chefs/${chefId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async toggleVacationMode(chefId: string): Promise<Chef> {
    return this.request<Chef>(`/chefs/${chefId}/toggle-vacation-mode`, {
      method: 'POST',
    });
  }

  async createMenu(chefId: string, data: Partial<Menu>): Promise<Menu> {
    return this.request<Menu>(`/chefs/${chefId}/menus`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenu(menuId: string, data: Partial<Menu>): Promise<Menu> {
    return this.request<Menu>(`/menus/${menuId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMenu(menuId: string): Promise<void> {
    return this.request<void>(`/menus/${menuId}`, { method: 'DELETE' });
  }

  async createMenuItem(menuId: string, data: Partial<MenuItem>): Promise<MenuItem> {
    return this.request<MenuItem>(`/menus/${menuId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(itemId: string, data: Partial<MenuItem>): Promise<MenuItem> {
    return this.request<MenuItem>(`/menu-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuItem(itemId: string): Promise<void> {
    return this.request<void>(`/menu-items/${itemId}`, { method: 'DELETE' });
  }

  async getStripeOnboardingLink(chefId: string): Promise<{ url: string }> {
    return this.request<{ url: string }>(`/chefs/${chefId}/stripe/onboard`, {
      method: 'POST',
    });
  }

  async getStripeStatus(chefId: string): Promise<{ complete: boolean; payoutsEnabled: boolean }> {
    return this.request<{ complete: boolean; payoutsEnabled: boolean }>(
      `/chefs/${chefId}/stripe/status`,
    );
  }

  // ============ Order Endpoints ============

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}`);
  }

  async getOrders(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString();
    return this.request<PaginatedResponse<Order>>(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async createPaymentIntent(orderId: string): Promise<PaymentIntentResponse> {
    return this.request<PaymentIntentResponse>(`/orders/${orderId}/create-payment-intent`, {
      method: 'POST',
    });
  }

  async acceptOrder(orderId: string, estimatedPrepTime?: number): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ estimatedPrepTime }),
    });
  }

  async rejectOrder(orderId: string, reason?: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async markOrderReady(orderId: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/ready`, {
      method: 'PATCH',
    });
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async requestRefund(orderId: string, amount?: number, reason?: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  async getOrderEta(orderId: string): Promise<{ etaSeconds: number; etaMinutes: number }> {
    return this.request<{ etaSeconds: number; etaMinutes: number }>(`/orders/${orderId}/eta`);
  }

  // ============ Driver Endpoints ============

  async getDriverProfile(): Promise<Driver> {
    return this.request<Driver>('/drivers/me');
  }

  async updateDriverStatus(status: 'online' | 'offline'): Promise<Driver> {
    return this.request<Driver>('/drivers/me/status', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateDriverLocation(lat: number, lng: number, heading?: number): Promise<void> {
    return this.request<void>('/drivers/me/location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, heading }),
    });
  }

  async getAvailableOrders(): Promise<AvailableOrder[]> {
    return this.request<AvailableOrder[]>('/drivers/available-orders');
  }

  async acceptDelivery(orderId: string): Promise<Order> {
    return this.request<Order>(`/drivers/orders/${orderId}/accept`, {
      method: 'POST',
    });
  }

  async markPickedUp(orderId: string): Promise<Order> {
    return this.request<Order>(`/drivers/orders/${orderId}/picked-up`, {
      method: 'PATCH',
    });
  }

  async markDelivered(orderId: string, photoUrl?: string): Promise<Order> {
    return this.request<Order>(`/drivers/orders/${orderId}/delivered`, {
      method: 'PATCH',
      body: JSON.stringify({ photoUrl }),
    });
  }

  async getDriverEarnings(period?: 'today' | 'week' | 'month'): Promise<{
    total: number;
    deliveries: number;
    tips: number;
  }> {
    const query = period ? `?period=${period}` : '';
    return this.request<{ total: number; deliveries: number; tips: number }>(
      `/drivers/me/earnings${query}`,
    );
  }

  // ============ Review Endpoints ============

  async createReview(data: CreateReviewRequest): Promise<Review> {
    return this.request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChefReviews(chefId: string): Promise<PaginatedResponse<Review>> {
    return this.request<PaginatedResponse<Review>>(`/chefs/${chefId}/reviews`);
  }

  // ============ Admin Endpoints ============

  async getPendingChefs(): Promise<Chef[]> {
    return this.request<Chef[]>('/admin/chefs/pending');
  }

  async verifyChef(
    chefId: string,
    decision: 'approved' | 'rejected',
    notes?: string,
  ): Promise<Chef> {
    return this.request<Chef>(`/admin/chefs/${chefId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, notes }),
    });
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalChefs: number;
    totalDrivers: number;
    totalOrders: number;
    revenue: number;
  }> {
    return this.request<{
      totalUsers: number;
      totalChefs: number;
      totalDrivers: number;
      totalOrders: number;
      revenue: number;
    }>('/admin/stats');
  }
}

// Export singleton for convenience
export const createApiClient = (config?: ApiClientConfig) => new ApiClient(config);
