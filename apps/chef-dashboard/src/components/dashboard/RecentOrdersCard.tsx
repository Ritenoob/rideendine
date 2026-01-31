import { ArrowRight, Clock } from 'lucide-react';

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: Date;
  itemCount: number;
}

interface RecentOrdersCardProps {
  orders: RecentOrder[];
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
  preparing: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Preparing' },
  ready_for_pickup: { bg: 'bg-green-50', text: 'text-green-700', label: 'Ready' },
  assigned_to_driver: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Assigned' },
};

export default function RecentOrdersCard({ orders }: RecentOrdersCardProps) {
  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No recent orders
          </div>
        ) : (
          orders.map(order => {
            const statusInfo = statusColors[order.status] || statusColors.pending;
            return (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{order.itemCount} items</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getTimeAgo(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${(order.total / 100).toFixed(2)}</p>
                    <button className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
        <a href="/dashboard/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View all orders →
        </a>
      </div>
    </div>
  );
}
