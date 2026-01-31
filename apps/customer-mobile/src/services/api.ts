/**
 * API Service - HTTP client for RideNDine API
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthStore } from '@/store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
const API_VERSION = ''; // Core server uses /api, NestJS will use /api/v2

interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // For core server: http://localhost:8081/api
    // For NestJS server: http://localhost:9001 (no prefix needed)
    this.baseUrl = API_VERSION ? `${API_URL}/api/${API_VERSION}` : `${API_URL}/api`;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
        // Token expired - attempt refresh or logout
        await useAuthStore.getState().clearAuth();
        throw { statusCode: 401, message: 'Session expired. Please login again.' };
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

  async login(email: string, password: string) {
    return this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
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
  }) {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'customer' }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile() {
    return this.request<any>('/users/me');
  }

  async updateProfile(data: any) {
    return this.request<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============ Chefs ============

  async searchChefs(params: {
    lat: number;
    lng: number;
    radius?: number;
    cuisineType?: string;
    minRating?: number;
    sortBy?: 'distance' | 'rating' | 'prepTime';
  }) {
    const query = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      ...(params.radius && { radius: params.radius.toString() }),
      ...(params.cuisineType && { cuisineType: params.cuisineType }),
      ...(params.minRating && { minRating: params.minRating.toString() }),
      ...(params.sortBy && { sortBy: params.sortBy }),
    });
    return this.request<any[]>(`/chefs/search?${query}`);
  }

  async getChef(id: string) {
    return this.request<any>(`/chefs/${id}`);
  }

  async getChefMenus(chefId: string) {
    return this.request<any[]>(`/chefs/${chefId}/menus`);
  }

  async getChefReviews(chefId: string) {
    return this.request<{ data: any[]; total: number }>(`/chefs/${chefId}/reviews`);
  }

  // ============ Orders ============

  async createOrder(data: {
    chefId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
    }>;
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      lat: number;
      lng: number;
      instructions?: string;
    };
    tip?: number;
    specialInstructions?: string;
  }) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrder(orderId: string) {
    return this.request<any>(`/orders/${orderId}`);
  }

  async getOrders(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const queryString = query.toString();
    return this.request<{ data: any[]; total: number; page: number; totalPages: number }>(
      `/orders${queryString ? `?${queryString}` : ''}`,
    );
  }

  async createPaymentIntent(orderId: string) {
    return this.request<{
      clientSecret: string;
      paymentIntentId: string;
      amount: number;
    }>(`/orders/${orderId}/create-payment-intent`, {
      method: 'POST',
    });
  }

  async getEphemeralKey() {
    return this.request<{
      ephemeralKey: string;
      customerId: string;
    }>('/payments/ephemeral-key', {
      method: 'POST',
    });
  }

  async cancelOrder(orderId: string, reason?: string) {
    return this.request<any>(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async getOrderEta(orderId: string) {
    return this.request<{ etaSeconds: number; etaMinutes: number }>(`/orders/${orderId}/eta`);
  }

  // ============ Reviews ============

  async createReview(data: {
    orderId: string;
    chefRating?: number;
    chefComment?: string;
    driverRating?: number;
    driverComment?: string;
  }) {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
