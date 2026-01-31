'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentOrdersCard from '@/components/dashboard/RecentOrdersCard';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  Star,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  averageRating: number;
  totalDeliveries: number;
  recentOrders: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        // Mock data for now - replace with API call
        const mockStats: DashboardStats = {
          todayOrders: 12,
          todayRevenue: 285.50,
          pendingOrders: 3,
          averageRating: 4.8,
          totalDeliveries: 156,
          recentOrders: [
            {
              id: '1',
              orderNumber: 'RND-20260131-0001',
              customerName: 'John Doe',
              total: 45.99,
              status: 'pending',
              createdAt: new Date(Date.now() - 15 * 60000),
              itemCount: 3,
            },
            {
              id: '2',
              orderNumber: 'RND-20260131-0002',
              customerName: 'Sarah Smith',
              total: 52.50,
              status: 'preparing',
              createdAt: new Date(Date.now() - 45 * 60000),
              itemCount: 4,
            },
            {
              id: '3',
              orderNumber: 'RND-20260131-0003',
              customerName: 'Mike Johnson',
              total: 38.75,
              status: 'ready_for_pickup',
              createdAt: new Date(Date.now() - 90 * 60000),
              itemCount: 2,
            },
          ],
        };
        setStats(mockStats);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard stats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">{error}</h3>
          <button 
            onClick={() => window.location.reload()}
            className="text-red-700 hover:text-red-900 text-sm mt-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.firstName || 'Chef'}! 👨‍🍳</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={ShoppingBag}
          label="Today's Orders"
          value={stats?.todayOrders || 0}
          change="+5 from yesterday"
          colorClass="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Today's Revenue"
          value={`$${stats?.todayRevenue?.toFixed(2) || '0.00'}`}
          change="+12% from yesterday"
          colorClass="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          icon={Clock}
          label="Pending Orders"
          value={stats?.pendingOrders || 0}
          change="Needs your attention"
          colorClass="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatsCard
          icon={Star}
          label="Average Rating"
          value={stats?.averageRating || 5.0}
          change="Excellent!"
          colorClass="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <RecentOrdersCard orders={stats?.recentOrders || []} />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActionsCard />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Earnings</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Total Earnings</span>
              <span className="text-2xl font-bold text-green-600">$1,245.50</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Platform Fee (15%)</span>
              <span className="text-red-600">-$186.83</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-gray-900 font-semibold">Net Earnings</span>
              <span className="text-2xl font-bold text-blue-600">$1,058.67</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-semibold text-gray-900">98%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '98%' }}></div>
            </div>
            <div className="pt-3">
              <span className="text-gray-600 text-sm">156 orders completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
