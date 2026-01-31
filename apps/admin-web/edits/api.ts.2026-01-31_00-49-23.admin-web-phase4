const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<{
      totalOrders: number;
      activeOrders: number;
      totalRevenue: number;
      totalCommission: number;
      pendingChefs: number;
      pendingDrivers: number;
      activeDrivers: number;
      totalUsers: number;
    }>('/admin/dashboard/stats');
  }

  async getRecentActivity() {
    return this.request<{ activities: any[] }>('/admin/dashboard/activity');
  }

  // Users
  async getUsers(params?: { role?: string; search?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    return this.request<{ users: any[]; total: number }>(`/admin/users?${query}`);
  }

  async updateUser(id: string, data: any) {
    return this.request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async suspendUser(id: string) {
    return this.request(`/admin/users/${id}/suspend`, { method: 'POST' });
  }

  // Chefs
  async getChefs(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return this.request<{ chefs: any[] }>(`/admin/chefs?${query}`);
  }

  async approveChef(id: string) {
    return this.request(`/admin/chefs/${id}/approve`, { method: 'PATCH' });
  }

  async rejectChef(id: string, reason: string) {
    return this.request(`/admin/chefs/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async getChefDetails(id: string) {
    return this.request<{ chef: any }>(`/admin/chefs/${id}`);
  }

  // Drivers
  async getDrivers(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return this.request<{ drivers: any[] }>(`/admin/drivers?${query}`);
  }

  async approveDriver(id: string) {
    return this.request(`/admin/drivers/${id}/approve`, { method: 'PATCH' });
  }

  async rejectDriver(id: string, reason: string) {
    return this.request(`/admin/drivers/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // Orders
  async getOrders(params?: { status?: string; search?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    return this.request<{ orders: any[]; total: number }>(`/admin/orders?${query}`);
  }

  async getOrderDetails(id: string) {
    return this.request<{ order: any }>(`/admin/orders/${id}`);
  }

  async refundOrder(id: string, reason: string) {
    return this.request(`/admin/orders/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Commission & Earnings
  async getCommissionStats(period: 'day' | 'week' | 'month' | 'year') {
    return this.request<{
      totalRevenue: number;
      totalCommission: number;
      orderCount: number;
      avgOrderValue: number;
      byDate: { date: string; revenue: number; commission: number }[];
    }>(`/admin/commission?period=${period}`);
  }

  async getPayouts(params?: { status?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    return this.request<{ payouts: any[] }>(`/admin/payouts?${query}`);
  }

  // Reviews
  async getReviews(params?: { type?: string; flagged?: boolean }) {
    const query = new URLSearchParams();
    if (params?.type) query.set('revieweeType', params.type);
    if (params?.flagged) query.set('flagged', 'true');
    return this.request<{ reviews: any[] }>(`/admin/reviews?${query}`);
  }

  async removeReview(id: string, reason: string) {
    return this.request(`/admin/reviews/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // Settings
  async getSettings() {
    return this.request<{ settings: any }>('/admin/settings');
  }

  async updateSettings(settings: any) {
    return this.request('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient();
