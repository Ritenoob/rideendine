'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import OrderCard from '@/components/orders/OrderCard';
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import OrderStatusFilter from '@/components/orders/OrderStatusFilter';
import { Search, Loader2, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: any[];
  totalCents: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'assigned_to_driver' | 'picked_up' | 'in_transit' | 'delivered';
  createdAt: Date;
  acceptedAt?: Date;
  readyAt?: Date;
  deliveredAt?: Date;
}

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Mock data - replace with API call
        const mockOrders: Order[] = [
          {
            id: '1',
            orderNumber: 'RND-20260131-0001',
            customerName: 'John Doe',
            customerPhone: '+1-555-0123',
            deliveryAddress: '123 Main St, Hamilton, ON',
            items: [
              { name: 'Margherita Pizza', quantity: 2, price: 18.99 },
              { name: 'Caesar Salad', quantity: 1, price: 9.99 },
            ],
            totalCents: 4899,
            status: 'pending',
            createdAt: new Date(Date.now() - 5 * 60000),
          },
          {
            id: '2',
            orderNumber: 'RND-20260131-0002',
            customerName: 'Sarah Smith',
            customerPhone: '+1-555-0456',
            deliveryAddress: '456 Oak Ave, Burlington, ON',
            items: [
              { name: 'Spicy Thai Curry', quantity: 1, price: 14.99 },
              { name: 'Spring Rolls', quantity: 2, price: 8.99 },
            ],
            totalCents: 5247,
            status: 'preparing',
            createdAt: new Date(Date.now() - 20 * 60000),
            acceptedAt: new Date(Date.now() - 18 * 60000),
          },
          {
            id: '3',
            orderNumber: 'RND-20260131-0003',
            customerName: 'Mike Johnson',
            customerPhone: '+1-555-0789',
            deliveryAddress: '789 Spring Ln, Oakville, ON',
            items: [
              { name: 'Grilled Salmon', quantity: 1, price: 22.99 },
              { name: 'Roasted Vegetables', quantity: 1, price: 8.99 },
            ],
            totalCents: 5997,
            status: 'ready_for_pickup',
            createdAt: new Date(Date.now() - 45 * 60000),
            acceptedAt: new Date(Date.now() - 43 * 60000),
            readyAt: new Date(Date.now() - 5 * 60000),
          },
        ];
        setOrders(mockOrders);
        setError(null);
      } catch (err) {
        setError('Failed to load orders');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, router]);

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchQuery]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      // API call: PATCH /orders/{orderId}/accept
      console.log('Accept order:', orderId);
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: 'accepted', acceptedAt: new Date() } : o
      ));
      setShowDetailModal(false);
    } catch (err) {
      console.error('Failed to accept order:', err);
    }
  };

  const handleRejectOrder = async (orderId: string, reason: string) => {
    try {
      // API call: PATCH /orders/{orderId}/reject
      console.log('Reject order:', orderId, reason);
      setOrders(orders.filter(o => o.id !== orderId));
      setShowDetailModal(false);
    } catch (err) {
      console.error('Failed to reject order:', err);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      // API call: PATCH /orders/{orderId}/ready
      console.log('Mark ready:', orderId);
      setOrders(orders.map(o =>
        o.id === orderId ? { ...o, status: 'ready_for_pickup', readyAt: new Date() } : o
      ));
      setShowDetailModal(false);
    } catch (err) {
      console.error('Failed to mark order ready:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage incoming orders and prepare meals</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <OrderStatusFilter 
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {/* Error State */}
      {error && (
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
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={() => {
                setSelectedOrder(order);
                setShowDetailModal(true);
              }}
            />
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onAccept={() => handleAcceptOrder(selectedOrder.id)}
          onReject={(reason) => handleRejectOrder(selectedOrder.id, reason)}
          onMarkReady={() => handleMarkReady(selectedOrder.id)}
        />
      )}
    </div>
  );
}
