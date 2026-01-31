'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { ClipboardList, DollarSign, Clock, TrendingUp } from 'lucide-react';

interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  todayEarnings: number;
  avgPrepTime: number;
}

interface RecentOrder {
  id: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { chef, user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    pendingOrders: 0,
    todayEarnings: 0,
    avgPrepTime: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersRes = await api.getOrders();
        const orders = ordersRes.data || [];

        // Calculate stats
        const today = new Date().toDateString();
        const todayOrders = orders.filter(
          (o: any) => new Date(o.createdAt).toDateString() === today
        );
        const pending = orders.filter((o: any) =>
          ['payment_confirmed', 'accepted', 'preparing'].includes(o.status)
        );

        setStats({
          todayOrders: todayOrders.length,
          pendingOrders: pending.length,
          todayEarnings: todayOrders.reduce((sum: number, o: any) => sum + o.total, 0),
          avgPrepTime: chef?.averagePrepTime || 30,
        });

        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chef]);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      payment_confirmed: 'badge badge-pending',
      accepted: 'badge badge-accepted',
      preparing: 'badge badge-preparing',
      ready_for_pickup: 'badge badge-ready',
      delivered: 'badge badge-delivered',
    };
    return classes[status] || 'badge bg-gray-100 text-gray-700';
  };

  if (!chef) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-6xl mb-6">👨‍🍳</div>
          <h2 className="text-2xl font-bold text-ink mb-4">Set Up Your Kitchen</h2>
          <p className="text-muted mb-8">
            Complete your chef profile to start receiving orders
          </p>
          <Link href="/dashboard/settings" className="btn-primary">
            Complete Setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Welcome back, {user?.firstName || 'Chef'}! 👋
        </h1>
        <p className="text-muted mt-1">Here's how your kitchen is doing today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <ClipboardList className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted">Today's Orders</p>
              <p className="text-2xl font-bold text-ink">{stats.todayOrders}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted">Pending Orders</p>
              <p className="text-2xl font-bold text-ink">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted">Today's Earnings</p>
              <p className="text-2xl font-bold text-ink">
                {formatCurrency(stats.todayEarnings)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted">Avg Prep Time</p>
              <p className="text-2xl font-bold text-ink">{stats.avgPrepTime} min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-ink">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-primary-500 font-medium hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted">Loading...</div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted">No orders yet</div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-ink">Order #{order.id.slice(-6)}</p>
                  <p className="text-sm text-muted">
                    {order.itemCount || 1} items • {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink">{formatCurrency(order.total)}</p>
                  <span className={getStatusBadge(order.status)}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
