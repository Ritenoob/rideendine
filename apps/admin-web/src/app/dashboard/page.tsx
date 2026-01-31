'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ShoppingBag,
  DollarSign,
  ChefHat,
  Truck,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface Stats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  totalCommission: number;
  pendingChefs: number;
  pendingDrivers: number;
  activeDrivers: number;
  totalUsers: number;
}

// Mock data for charts
const revenueData = [
  { name: 'Mon', revenue: 12400, orders: 34 },
  { name: 'Tue', revenue: 15600, orders: 42 },
  { name: 'Wed', revenue: 18200, orders: 51 },
  { name: 'Thu', revenue: 14800, orders: 38 },
  { name: 'Fri', revenue: 22100, orders: 61 },
  { name: 'Sat', revenue: 28500, orders: 78 },
  { name: 'Sun', revenue: 24300, orders: 65 },
];

const ordersByHour = [
  { hour: '6AM', orders: 2 },
  { hour: '9AM', orders: 8 },
  { hour: '12PM', orders: 35 },
  { hour: '3PM', orders: 18 },
  { hour: '6PM', orders: 45 },
  { hour: '9PM', orders: 28 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingChefs: 0,
    pendingDrivers: 0,
    activeDrivers: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, ordersData] = await Promise.all([
        api.getDashboardStats(),
        api.getOrders({ page: 1 }),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use mock data for demo
      setStats({
        totalOrders: 1284,
        activeOrders: 54,
        totalRevenue: 12845600,
        totalCommission: 1927840,
        pendingChefs: 7,
        pendingDrivers: 3,
        activeDrivers: 23,
        totalUsers: 4521,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);

  const statCards = [
    {
      icon: ShoppingBag,
      label: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      subValue: `${stats.activeOrders} active`,
      color: 'bg-blue-500',
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      subValue: `${formatCurrency(stats.totalCommission)} commission`,
      color: 'bg-emerald-500',
    },
    {
      icon: ChefHat,
      label: 'Pending Chefs',
      value: stats.pendingChefs.toString(),
      subValue: 'Awaiting approval',
      color: 'bg-amber-500',
      alert: stats.pendingChefs > 0,
    },
    {
      icon: Truck,
      label: 'Active Drivers',
      value: stats.activeDrivers.toString(),
      subValue: `${stats.pendingDrivers} pending`,
      color: 'bg-purple-500',
    },
    {
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      subValue: 'Registered accounts',
      color: 'bg-pink-500',
    },
    {
      icon: TrendingUp,
      label: 'Growth',
      value: '+12.5%',
      subValue: 'vs last month',
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-muted text-sm">Overview of platform metrics</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="btn-secondary text-sm"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.alert && (
                <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                  <AlertCircle className="w-3 h-3" />
                  Action needed
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-ink">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="text-xs text-muted mt-1">{stat.subValue}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="font-semibold text-ink mb-4">Weekly Revenue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9e9e9e" fontSize={12} />
                <YAxis
                  stroke="#9e9e9e"
                  fontSize={12}
                  tickFormatter={(v) => `$${v / 100}`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `$${(value / 100).toFixed(2)}`,
                    'Revenue',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1b7f5a"
                  strokeWidth={2}
                  dot={{ fill: '#1b7f5a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Hour */}
        <div className="card">
          <h3 className="font-semibold text-ink mb-4">Orders by Hour</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" stroke="#9e9e9e" fontSize={12} />
                <YAxis stroke="#9e9e9e" fontSize={12} />
                <Tooltip />
                <Bar dataKey="orders" fill="#2f6fed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink">Recent Orders</h3>
          <a
            href="/dashboard/orders"
            className="text-sm text-accent hover:underline"
          >
            View all
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">Order ID</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Chef</th>
                <th className="table-header">Status</th>
                <th className="table-header">Total</th>
                <th className="table-header">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="table-cell font-mono text-xs">
                      {order.order_number || order.id.slice(0, 8)}
                    </td>
                    <td className="table-cell">{order.customer_name || '-'}</td>
                    <td className="table-cell">{order.chef_name || '-'}</td>
                    <td className="table-cell">
                      <span
                        className={`badge ${
                          order.status === 'delivered'
                            ? 'badge-approved'
                            : order.status === 'cancelled'
                            ? 'badge-rejected'
                            : 'badge-pending'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {formatCurrency(order.total_cents || 0)}
                    </td>
                    <td className="table-cell text-muted text-xs">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="table-cell text-center text-muted py-8"
                  >
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No recent orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/dashboard/chefs"
          className="card hover:border-accent transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <ChefHat className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-ink">Review Chef Applications</p>
              <p className="text-sm text-muted">
                {stats.pendingChefs} pending approvals
              </p>
            </div>
          </div>
        </a>

        <a
          href="/dashboard/drivers"
          className="card hover:border-accent transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-ink">Manage Drivers</p>
              <p className="text-sm text-muted">
                {stats.activeDrivers} currently active
              </p>
            </div>
          </div>
        </a>

        <a
          href="/dashboard/commission"
          className="card hover:border-accent transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-ink">Commission Report</p>
              <p className="text-sm text-muted">View earnings breakdown</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
