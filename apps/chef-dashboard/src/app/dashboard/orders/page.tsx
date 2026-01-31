'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, X, Clock, ChefHat } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryAddress: { street: string; city: string };
  createdAt: string;
  customerName?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.getOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.acceptOrder(orderId, 30);
      toast.success('Order accepted!');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await api.rejectOrder(orderId, 'Unable to fulfill at this time');
      toast.success('Order rejected');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject order');
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await api.markOrderReady(orderId);
      toast.success('Order marked as ready!');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark order ready');
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const filteredOrders = orders.filter((order) => {
    switch (filter) {
      case 'pending':
        return order.status === 'payment_confirmed';
      case 'active':
        return ['accepted', 'preparing', 'ready_for_pickup'].includes(order.status);
      case 'completed':
        return ['delivered', 'cancelled', 'rejected'].includes(order.status);
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      payment_confirmed: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-blue-100 text-blue-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready_for_pickup: 'bg-green-100 text-green-700',
      delivered: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <p className="text-muted mt-1">Manage incoming orders</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['pending', 'active', 'completed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-white text-muted hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="card text-center py-12 text-muted">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-muted">No {filter} orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-ink">Order #{order.id.slice(-6)}</h3>
                    <span className={`badge ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-xl font-bold text-ink">{formatCurrency(order.total)}</p>
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span className="text-ink">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-muted">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              <p className="text-sm text-muted mb-4">
                📍 {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
              </p>

              {/* Actions */}
              {order.status === 'payment_confirmed' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAcceptOrder(order.id)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Accept Order
                  </button>
                  <button
                    onClick={() => handleRejectOrder(order.id)}
                    className="flex-1 bg-red-100 text-red-600 font-semibold py-3 px-6 rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              )}

              {order.status === 'accepted' && (
                <button
                  onClick={() => handleAcceptOrder(order.id)}
                  className="w-full bg-orange-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ChefHat size={18} />
                  Start Preparing
                </button>
              )}

              {order.status === 'preparing' && (
                <button
                  onClick={() => handleMarkReady(order.id)}
                  className="w-full bg-green-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Mark Ready for Pickup
                </button>
              )}

              {order.status === 'ready_for_pickup' && (
                <div className="flex items-center justify-center gap-2 text-green-600 py-3">
                  <Clock size={18} />
                  <span className="font-medium">Waiting for driver pickup</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
