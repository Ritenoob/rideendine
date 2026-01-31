import { Clock, MapPin, Phone, ChefHat, ArrowRight } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalCents: number;
  status: string;
  createdAt: Date;
  acceptedAt?: Date;
  readyAt?: Date;
}

interface OrderCardProps {
  order: Order;
  onViewDetails: () => void;
}

const statusConfig: Record<string, { bg: string; text: string; label: string; action?: string }> = {
  pending: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: 'Pending', action: 'Accept Order' },
  accepted: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Accepted', action: 'Start Preparing' },
  preparing: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Preparing', action: 'Mark Ready' },
  ready_for_pickup: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Ready for Pickup' },
};

export default function OrderCard({ order, onViewDetails }: OrderCardProps) {
  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const config = statusConfig[order.status] || statusConfig.pending;
  const itemSummary = order.items.map(item => `${item.quantity}x ${item.name}`).join(', ');

  return (
    <div className={`border rounded-lg p-6 ${config.bg} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
          <p className={`text-sm font-medium mt-1 ${config.text}`}>{config.label}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">${(order.totalCents / 100).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{order.items.length} items</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-700">
          <ChefHat className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{order.customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{order.customerPhone}</span>
        </div>
        <div className="flex items-start gap-2 text-gray-600 text-sm">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
          <span>{order.deliveryAddress}</span>
        </div>
      </div>

      {/* Items Summary */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <p className="text-sm text-gray-600 line-clamp-2">{itemSummary}</p>
      </div>

      {/* Time and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{getTimeAgo(order.createdAt)}</span>
        </div>
        <button
          onClick={onViewDetails}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
