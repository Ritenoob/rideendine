'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Download, Calendar } from 'lucide-react';

interface EarningsRecord {
  date: string;
  orderNumber: string;
  amount: number;
  platformFee: number;
  tax: number;
  netEarnings: number;
}

export default function EarningsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Mock earnings data
  const earningsData = {
    week: {
      totalEarnings: 2850,
      totalOrders: 28,
      averageOrderValue: 102,
      commissionEarned: 427.5,
      trend: '+12%',
      records: [
        {
          date: '2026-01-31',
          orderNumber: 'RND-20260131-0001',
          amount: 4500,
          platformFee: 675,
          tax: 360,
          netEarnings: 3825,
        },
        {
          date: '2026-01-30',
          orderNumber: 'RND-20260130-0015',
          amount: 3200,
          platformFee: 480,
          tax: 256,
          netEarnings: 2720,
        },
        {
          date: '2026-01-29',
          orderNumber: 'RND-20260129-0042',
          amount: 2800,
          platformFee: 420,
          tax: 224,
          netEarnings: 2380,
        },
      ],
    },
    month: {
      totalEarnings: 12420,
      totalOrders: 124,
      averageOrderValue: 100,
      commissionEarned: 1863,
      trend: '+8%',
      records: [],
    },
    year: {
      totalEarnings: 145680,
      totalOrders: 1456,
      averageOrderValue: 100,
      commissionEarned: 21852,
      trend: '+15%',
      records: [],
    },
  };

  const current = earningsData[selectedPeriod as 'week' | 'month' | 'year'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-1">Track your income and payouts</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {['week', 'month', 'year'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Earnings</h3>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${(current.totalEarnings / 100).toFixed(2)}</p>
          <p className="text-sm text-green-600 mt-2">{current.trend} from last period</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{current.totalOrders}</p>
          <p className="text-sm text-gray-600 mt-2">orders completed</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Avg Order Value</h3>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${(current.averageOrderValue / 100).toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">per order</p>
        </div>

        {/* Commission Earned */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">You Keep (85%)</h3>
            <TrendingUp className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${(current.commissionEarned / 100).toFixed(2)}</p>
          <p className="text-sm text-gray-600 mt-2">after fees & tax</p>
        </div>
      </div>

      {/* Breakdown Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
        <div className="space-y-4">
          {/* Item amounts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Food & Items (85%)</span>
              <span className="font-semibold text-gray-900">${(current.totalEarnings * 0.85 / 100).toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          {/* Platform fee */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Platform Fee (15%)</span>
              <span className="font-semibold text-gray-900">${(current.totalEarnings * 0.15 / 100).toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings History */}
      {current.records.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Earnings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Order #</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Order Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Platform Fee</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Tax</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Your Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {current.records.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{record.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      ${(record.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      ${(record.platformFee / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      ${(record.tax / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      ${(record.netEarnings / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Next Payout
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-blue-700 mb-1">Scheduled Date</p>
            <p className="text-2xl font-bold text-blue-900">Feb 7, 2026</p>
          </div>
          <div>
            <p className="text-sm text-blue-700 mb-1">Pending Balance</p>
            <p className="text-2xl font-bold text-blue-900">${(current.commissionEarned / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700 mb-1">Payout Method</p>
            <p className="text-lg font-semibold text-blue-900">Bank Transfer</p>
          </div>
        </div>
        <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          <Download className="w-4 h-4" />
          Download Statement
        </button>
      </div>
    </div>
  );
}
