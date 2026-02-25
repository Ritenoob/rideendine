'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function PayoutsPage() {
  const { data: payouts, isLoading } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      return [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Payout Management</h1>
        <p className="text-muted mt-1">Manage chef and driver payouts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Pending</p>
              <p className="text-xl font-bold text-ink">$0.00</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Completed</p>
              <p className="text-xl font-bold text-ink">$0.00</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-50">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted">This Week</p>
              <p className="text-xl font-bold text-ink">$0.00</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Total Paid</p>
              <p className="text-xl font-bold text-ink">$0.00</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 text-center text-muted">
          No payouts to display
        </div>
      </div>
    </div>
  );
}
