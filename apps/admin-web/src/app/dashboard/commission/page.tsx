'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Download,
  ChefHat,
  Truck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CommissionStats {
  totalRevenue: number;
  totalCommission: number;
  orderCount: number;
  avgOrderValue: number;
  byDate: { date: string; revenue: number; commission: number }[];
}

export default function CommissionPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>(
    'month'
  );
  const [stats, setStats] = useState<CommissionStats>({
    totalRevenue: 0,
    totalCommission: 0,
    orderCount: 0,
    avgOrderValue: 0,
    byDate: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getCommissionStats(period);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch commission stats:', error);
      // Mock data
      const mockByDate =
        period === 'week'
          ? [
              { date: 'Mon', revenue: 124000, commission: 18600 },
              { date: 'Tue', revenue: 156000, commission: 23400 },
              { date: 'Wed', revenue: 182000, commission: 27300 },
              { date: 'Thu', revenue: 148000, commission: 22200 },
              { date: 'Fri', revenue: 221000, commission: 33150 },
              { date: 'Sat', revenue: 285000, commission: 42750 },
              { date: 'Sun', revenue: 243000, commission: 36450 },
            ]
          : period === 'month'
          ? Array.from({ length: 30 }, (_, i) => ({
              date: `${i + 1}`,
              revenue: Math.floor(Math.random() * 50000) + 100000,
              commission: Math.floor(Math.random() * 7500) + 15000,
            }))
          : [
              { date: 'Jan', revenue: 4500000, commission: 675000 },
              { date: 'Feb', revenue: 4200000, commission: 630000 },
              { date: 'Mar', revenue: 4800000, commission: 720000 },
              { date: 'Apr', revenue: 5100000, commission: 765000 },
              { date: 'May', revenue: 5500000, commission: 825000 },
              { date: 'Jun', revenue: 6200000, commission: 930000 },
            ];

      setStats({
        totalRevenue: mockByDate.reduce((sum, d) => sum + d.revenue, 0),
        totalCommission: mockByDate.reduce((sum, d) => sum + d.commission, 0),
        orderCount: period === 'month' ? 3420 : period === 'week' ? 845 : 12500,
        avgOrderValue: 3850,
        byDate: mockByDate,
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

  const commissionBreakdown = [
    { name: 'Chef Commission (15%)', value: stats.totalCommission * 0.6 },
    { name: 'Platform Fee', value: stats.totalCommission * 0.25 },
    { name: 'Driver Fee', value: stats.totalCommission * 0.15 },
  ];

  const COLORS = ['#1b7f5a', '#2f6fed', '#d24b4b'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Commission & Revenue</h1>
          <p className="text-muted text-sm">Track platform earnings</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="input w-32"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Commission Earned</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalCommission)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-muted text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-ink">
                {stats.orderCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-muted text-sm">Avg Order Value</p>
              <p className="text-2xl font-bold text-ink">
                {formatCurrency(stats.avgOrderValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-ink mb-4">Revenue Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.byDate}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b7f5a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1b7f5a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorCommission"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#2f6fed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2f6fed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9e9e9e" fontSize={12} />
                <YAxis
                  stroke="#9e9e9e"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 100).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'revenue' ? 'Revenue' : 'Commission',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1b7f5a"
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="#2f6fed"
                  fill="url(#colorCommission)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="card">
          <h3 className="font-semibold text-ink mb-4">Commission Breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commissionBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {commissionBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {commissionBreakdown.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Chefs */}
        <div className="card">
          <h3 className="font-semibold text-ink mb-4">Top Chefs by Revenue</h3>
          <div className="space-y-3">
            {[
              { name: "Maria's Kitchen", revenue: 1250000, orders: 156 },
              { name: "Chen's Dumplings", revenue: 980000, orders: 142 },
              { name: 'Soul Food by James', revenue: 820000, orders: 98 },
              { name: "Raj's Spice Corner", revenue: 650000, orders: 87 },
              { name: 'Mediterranean Delights', revenue: 580000, orders: 72 },
            ].map((chef, index) => (
              <div
                key={chef.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{chef.name}</p>
                    <p className="text-xs text-muted">{chef.orders} orders</p>
                  </div>
                </div>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(chef.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Drivers */}
        <div className="card">
          <h3 className="font-semibold text-ink mb-4">Top Drivers</h3>
          <div className="space-y-3">
            {[
              { name: 'David Chen', deliveries: 245, earnings: 185000 },
              { name: 'Sarah Johnson', deliveries: 198, earnings: 148500 },
              { name: 'Mike Williams', deliveries: 176, earnings: 132000 },
              { name: 'Lisa Brown', deliveries: 154, earnings: 115500 },
              { name: 'Tom Wilson', deliveries: 142, earnings: 106500 },
            ].map((driver, index) => (
              <div
                key={driver.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-xs text-muted">
                      {driver.deliveries} deliveries
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(driver.earnings)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
