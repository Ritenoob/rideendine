const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001';
const API_VERSION = 'v2';

class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor() {
    this.baseUrl = `${API_URL}/api/${API_VERSION}`;
    this.getToken = () => {
      if (typeof window !== 'undefined') {
        const storage = localStorage.getItem('chef-auth-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          return parsed.state?.accessToken || null;
        }
      }
      return null;
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }

  // Auth
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

  async register(data: { email: string; password: string; firstName?: string; lastName?: string }) {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'chef' }),
    });
  }

  // Chef Profile
  async getChefProfile() {
    return this.request<any>('/chefs/me');
  }

  async applyAsChef(data: any) {
    return this.request<any>('/chefs/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChefProfile(chefId: string, data: any) {
    return this.request<any>(`/chefs/${chefId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async toggleVacationMode(chefId: string) {
    return this.request<any>(`/chefs/${chefId}/toggle-vacation-mode`, {
      method: 'POST',
    });
  }

  // Stripe
  async getStripeOnboardingLink(chefId: string) {
    return this.request<{ url: string }>(`/chefs/${chefId}/stripe/onboard`, {
      method: 'POST',
    });
  }

  async getStripeStatus(chefId: string) {
    return this.request<{ complete: boolean; payoutsEnabled: boolean }>(
      `/chefs/${chefId}/stripe/status`,
    );
  }

  // Menus
  async getMenus(chefId: string) {
    return this.request<any[]>(`/chefs/${chefId}/menus`);
  }

  async createMenu(chefId: string, data: any) {
    return this.request<any>(`/chefs/${chefId}/menus`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenu(menuId: string, data: any) {
    return this.request<any>(`/menus/${menuId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMenu(menuId: string) {
    return this.request<void>(`/menus/${menuId}`, { method: 'DELETE' });
  }

  async createMenuItem(menuId: string, data: any) {
    return this.request<any>(`/menus/${menuId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(itemId: string, data: any) {
    return this.request<any>(`/menu-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuItem(itemId: string) {
    return this.request<void>(`/menu-items/${itemId}`, { method: 'DELETE' });
  }

  // Orders
  async getOrders(params?: { status?: string }) {
    const query = params?.status ? `?status=${params.status}` : '';
    return this.request<{ data: any[]; total: number }>(`/orders${query}`);
  }

  async getOrder(orderId: string) {
    return this.request<any>(`/orders/${orderId}`);
  }

  async acceptOrder(orderId: string, estimatedPrepTime?: number) {
    return this.request<any>(`/orders/${orderId}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ estimatedPrepTime }),
    });
  }

  async rejectOrder(orderId: string, reason?: string) {
    return this.request<any>(`/orders/${orderId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async markOrderReady(orderId: string) {
    return this.request<any>(`/orders/${orderId}/ready`, {
      method: 'PATCH',
    });
  }

  // Earnings
  async getEarnings(period?: 'today' | 'week' | 'month') {
    const query = period ? `?period=${period}` : '';
    return this.request<{
      total: number;
      orders: number;
      commission: number;
    }>(`/chefs/me/earnings${query}`);
  }
}

export const api = new ApiClient();
