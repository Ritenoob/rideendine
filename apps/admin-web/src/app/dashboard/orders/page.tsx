'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ShoppingBag,
  Search,
  Eye,
  RefreshCw,
  Clock,
  MapPin,
  DollarSign,
  ChefHat,
  Truck,
  User,
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  chef_name: string;
  driver_name?: string;
  status: string;
  total_cents: number;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tip_cents: number;
  commission_cents: number;
  delivery_address: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

const ORDER_STATUSES = [
  'pending',
  'payment_confirmed',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'assigned_to_driver',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
  'refunded',
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [filter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders({
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
        page,
      });
      setOrders(data.orders);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Mock data
      setOrders([
        {
          id: '1',
          order_number: 'RND-2024-001234',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          chef_name: "Maria's Kitchen",
          driver_name: 'David Chen',
          status: 'delivered',
          total_cents: 4599,
          subtotal_cents: 3500,
          delivery_fee_cents: 599,
          tip_cents: 500,
          commission_cents: 525,
          delivery_address: '123 Main St, Hamilton, ON',
          item_count: 3,
          created_at: '2024-01-20T12:00:00Z',
          updated_at: '2024-01-20T13:30:00Z',
        },
        {
          id: '2',
          order_number: 'RND-2024-001235',
          customer_name: 'Sarah Johnson',
          customer_email: 'sarah@example.com',
          chef_name: "Chen's Dumplings",
          status: 'preparing',
          total_cents: 2899,
          subtotal_cents: 2200,
          delivery_fee_cents: 499,
          tip_cents: 200,
          commission_cents: 330,
          delivery_address: '456 Oak Ave, Burlington, ON',
          item_count: 2,
          created_at: '2024-01-20T14:00:00Z',
          updated_at: '2024-01-20T14:15:00Z',
        },
      ]);
      setTotal(1284);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (orderId: string) => {
    const reason = prompt('Enter refund reason:');
    if (!reason) return;
    try {
      await api.refundOrder(orderId, reason);
      fetchOrders();
    } catch (error) {
      console.error('Failed to refund order:', error);
    }
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'badge-approved';
      case 'cancelled':
      case 'refunded':
        return 'badge-rejected';
      case 'pending':
        return 'badge-pending';
      default:
        return 'badge-active';
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.chef_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Order Management</h1>
          <p className="text-muted text-sm">View and manage all orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, customer, or chef..."
            className="input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Order List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-muted">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-muted">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header">Order</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Chef</th>
                  <th className="table-header">Driver</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Commission</th>
                  <th className="table-header">Time</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {order.order_number}
                        </p>
                        <p className="text-xs text-muted">
                          {order.item_count} items
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted" />
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted">
                            {order.customer_email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-orange-500" />
                        <span>{order.chef_name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {order.driver_name ? (
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-purple-500" />
                          <span>{order.driver_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold">
                          {formatCurrency(order.total_cents)}
                        </p>
                        <p className="text-xs text-muted">
                          +{formatCurrency(order.tip_cents)} tip
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(order.commission_cents)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3 text-muted" />
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-muted" />
                        </button>
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => handleRefund(order.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-xs text-red-600"
                            title="Issue Refund"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-muted">
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of{' '}
              {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-ink">Order Details</h3>
                <p className="text-sm text-muted">
                  {selectedOrder.order_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Customer</h4>
                <p>{selectedOrder.customer_name}</p>
                <p className="text-sm text-muted">
                  {selectedOrder.customer_email}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Chef</h4>
                <p>{selectedOrder.chef_name}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Delivery Address</h4>
                <p className="flex items-start gap-1 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted" />
                  {selectedOrder.delivery_address}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Driver</h4>
                <p>{selectedOrder.driver_name || 'Not assigned'}</p>
              </div>
            </div>

            <hr className="my-6" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery Fee</span>
                <span>{formatCurrency(selectedOrder.delivery_fee_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Tip</span>
                <span>{formatCurrency(selectedOrder.tip_cents)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total_cents)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Platform Commission</span>
                <span>{formatCurrency(selectedOrder.commission_cents)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
