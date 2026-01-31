'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DollarSign, TrendingUp, Package, CreditCard } from 'lucide-react';

interface Earnings {
  total: number;
  orders: number;
  commission: number;
}

export default function EarningsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [earnings, setEarnings] = useState<Earnings>({
    total: 0,
    orders: 0,
    commission: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        // In a real app, this would fetch from the API
        // For now, we'll calculate from orders
        const ordersRes = await api.getOrders();
        const orders = ordersRes.data || [];

        const now = new Date();
        const filtered = orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          if (period === 'today') {
            return orderDate.toDateString() === now.toDateString();
          } else if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          } else {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          }
        });

        const delivered = filtered.filter((o: any) => o.status === 'delivered');
        const total = delivered.reduce((sum: number, o: any) => sum + o.subtotal, 0);
        const commission = Math.round(total * 0.15);

        setEarnings({
          total: total - commission,
          orders: delivered.length,
          commission,
        });
      } catch (error) {
        console.error('Failed to fetch earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [period]);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Earnings</h1>
        <p className="text-muted mt-1">Track your revenue and payouts</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              period === p
                ? 'bg-primary-500 text-white'
                : 'bg-white text-muted hover:bg-gray-50'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="card text-center py-12 text-muted">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted">Net Earnings</p>
                <p className="text-2xl font-bold text-ink">
                  {formatCurrency(earnings.total)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted">Completed Orders</p>
                <p className="text-2xl font-bold text-ink">{earnings.orders}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted">Platform Fee (15%)</p>
                <p className="text-2xl font-bold text-ink">
                  {formatCurrency(earnings.commission)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Info */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <CreditCard className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-ink">Payouts</h3>
            <p className="text-sm text-muted">Via Stripe Connect</p>
          </div>
        </div>

        <p className="text-muted mb-4">
          Payouts are processed automatically through Stripe Connect. Funds are typically
          available in your bank account within 2-3 business days after delivery completion.
        </p>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted">Next Payout</p>
              <p className="font-bold text-ink">{formatCurrency(earnings.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">Expected</p>
              <p className="font-medium text-ink">2-3 business days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
