'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package, Clock, MapPin, ChevronRight, Filter } from 'lucide-react';
import { api } from '@/services/api';

type OrderStatus = 'all' | 'active' | 'completed' | 'cancelled';

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders', statusFilter],
    queryFn: () => api.getMyOrders({ status: statusFilter }),
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      accepted: { color: 'bg-blue-100 text-blue-800', label: 'Accepted' },
      preparing: { color: 'bg-purple-100 text-purple-800', label: 'Preparing' },
      ready: { color: 'bg-indigo-100 text-indigo-800', label: 'Ready' },
      picked_up: { color: 'bg-cyan-100 text-cyan-800', label: 'Picked Up' },
      in_transit: { color: 'bg-blue-100 text-blue-800', label: 'In Transit' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">View and track all your orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={20} className="text-gray-600" />
            <span className="font-semibold text-gray-900">Filter by status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'completed', 'cancelled'] as OrderStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="block bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition">
                          Order #{order.orderNumber}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                        <Package size={16} />
                        <span>{order.chefName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Clock size={16} />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        ${(order.totalCents / 100).toFixed(2)}
                      </div>
                      <ChevronRight className="ml-auto text-gray-400 group-hover:text-primary-600 transition" />
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                    </p>
                    {order.deliveryAddress && (
                      <div className="flex items-start gap-2 mt-2 text-sm text-gray-600">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{order.deliveryAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* ETA for active orders */}
                  {order.estimatedDeliveryTime &&
                    !['delivered', 'cancelled'].includes(order.status) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-primary-600 font-medium">
                          <Clock size={18} />
                          <span>
                            ETA:{' '}
                            {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all'
                ? "You haven't placed any orders yet"
                : `You don't have any ${statusFilter} orders`}
            </p>
            <Link
              href="/customer"
              className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
            >
              Browse Chefs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
