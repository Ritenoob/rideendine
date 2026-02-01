/**
 * API Service - HTTP client for RideNDine API
 * Points to NestJS backend at http://localhost:9001
 */

import type {
  ApiError,
  LoginResponse,
  User,
  Chef,
  SearchChefsParams,
  Menu,
  Review,
  PaginatedResponse,
  Order,
  CreateOrderData,
  PaymentIntentResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001';

class ApiService {
  private baseUrl: string;

  constructor() {
    // NestJS API doesn't use /api prefix
    this.baseUrl = API_URL;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers as Record<string, string>),
        },
      });

      if (response.status === 401) {
        // Token expired - clear auth and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        throw {
          statusCode: 401,
          message: 'Session expired. Please login again.',
        } as ApiError;
      }

      const data = await response.json();

      if (!response.ok) {
        throw {
          statusCode: response.status,
          message: data.message || 'An error occurred',
          error: data.error,
        } as ApiError;
      }

      return data as T;
    } catch (error) {
      if ((error as ApiError).statusCode) {
        throw error;
      }
      throw {
        statusCode: 0,
        message: 'Network error. Please check your connection.',
      } as ApiError;
    }
  }

  // ============ Auth ============

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'customer' }),
    });
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.request<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
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

  // ============ Chefs ============

  async searchChefs(params: SearchChefsParams): Promise<Chef[]> {
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

  async getChefReviews(chefId: string): Promise<PaginatedResponse<Review>> {
    return this.request<PaginatedResponse<Review>>(`/chefs/${chefId}/reviews`);
  }

  // ============ Orders ============

  async createOrder(data: CreateOrderData): Promise<Order> {
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
    return this.request<PaginatedResponse<Order>>(
      `/orders${queryString ? `?${queryString}` : ''}`
    );
  }

  async createPaymentIntent(orderId: string): Promise<PaymentIntentResponse> {
    return this.request<PaymentIntentResponse>(
      `/orders/${orderId}/create-payment-intent`,
      {
        method: 'POST',
      }
    );
  }

  async getEphemeralKey(): Promise<{
    ephemeralKey: string;
    customerId: string;
  }> {
    return this.request<{
      ephemeralKey: string;
      customerId: string;
    }>('/payments/ephemeral-key', {
      method: 'POST',
    });
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async getOrderEta(orderId: string): Promise<{
    etaSeconds: number;
    etaMinutes: number;
  }> {
    return this.request<{ etaSeconds: number; etaMinutes: number }>(
      `/orders/${orderId}/eta`
    );
  }

  // ============ Reviews ============

  async createReview(data: {
    orderId: string;
    chefRating?: number;
    chefComment?: string;
    driverRating?: number;
    driverComment?: string;
  }): Promise<Review> {
    return this.request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
