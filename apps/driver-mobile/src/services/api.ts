import { useAuthStore } from '@/store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:9001';
const API_VERSION = 'v2';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/api/${API_VERSION}`;
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
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers as Record<string, string>),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { email: string; password: string; firstName?: string; lastName?: string }) {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'driver' }),
    });
  }

  // Driver Profile
  async getDriverProfile() {
    return this.request<any>('/drivers/me');
  }

  async updateDriverStatus(status: 'online' | 'offline') {
    return this.request<any>('/drivers/me/status', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateDriverLocation(lat: number, lng: number, heading?: number) {
    return this.request<void>('/drivers/me/location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, heading }),
    });
  }

  // Orders
  async getAvailableOrders() {
    return this.request<any[]>('/drivers/available-orders');
  }

  async acceptDelivery(orderId: string) {
    return this.request<any>(`/drivers/orders/${orderId}/accept`, {
      method: 'POST',
    });
  }

  async markPickedUp(orderId: string) {
    return this.request<any>(`/drivers/orders/${orderId}/picked-up`, {
      method: 'PATCH',
    });
  }

  async markDelivered(orderId: string, photoUrl?: string) {
    return this.request<any>(`/drivers/orders/${orderId}/delivered`, {
      method: 'PATCH',
      body: JSON.stringify({ photoUrl }),
    });
  }

  async getActiveDelivery() {
    return this.request<any>('/drivers/me/active-delivery');
  }

  // Earnings
  async getEarnings(period?: 'today' | 'week' | 'month') {
    const query = period ? `?period=${period}` : '';
    return this.request<{ total: number; deliveries: number; tips: number }>(
      `/drivers/me/earnings${query}`,
    );
  }

  async getDeliveryHistory() {
    return this.request<{ data: any[] }>('/drivers/me/history');
  }
}

export const api = new ApiService();
