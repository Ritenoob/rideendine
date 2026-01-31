'use client';

import { useState } from 'react';
import { X, Phone, MapPin, Clock } from 'lucide-react';

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

interface OrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: (reason: string) => void;
  onMarkReady: () => void;
}

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onMarkReady,
}: OrderDetailModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen) return null;

  const itemTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const platformFee = Math.round(itemTotal * 0.15);
  const tax = Math.round(itemTotal * 0.08);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-medium">Name:</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>{order.deliveryAddress}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">${(item.price * item.quantity / 100).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">${(itemTotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Platform Fee (15%)</span>
              <span className="text-gray-900">${(platformFee / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax (8%)</span>
              <span className="text-gray-900">${(tax / 100).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-lg text-blue-600">${(order.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">
                  Order Placed: {order.createdAt.toLocaleString()}
                </span>
              </div>
              {order.acceptedAt && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">
                    Accepted: {order.acceptedAt.toLocaleString()}
                  </span>
                </div>
              )}
              {order.readyAt && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">
                    Ready: {order.readyAt.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reject Form */}
          {showRejectForm && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-semibold text-red-900 mb-3">Reason for Rejection</h4>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why you're rejecting this order..."
                className="w-full p-2 border border-red-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3 justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Close
          </button>

          {order.status === 'pending' && (
            <>
              {!showRejectForm ? (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={onAccept}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Accept Order
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onReject(rejectReason);
                      setShowRejectForm(false);
                    }}
                    disabled={!rejectReason.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </>
              )}
            </>
          )}

          {(order.status === 'accepted' || order.status === 'preparing') && (
            <button
              onClick={onMarkReady}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Mark Ready for Pickup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
