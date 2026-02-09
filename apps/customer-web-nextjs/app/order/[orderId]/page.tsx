'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

// Public order tracking - NO AUTH REQUIRED
// Data is intentionally redacted to protect chef privacy
export default function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);

  // Fetch public tracking data (redacted)
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/tracking`);
      if (!response.ok) throw new Error('Order not found');
      return response.json();
    },
  });

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: Package },
      { key: 'accepted', label: 'Confirmed', icon: CheckCircle },
      { key: 'preparing', label: 'Preparing', icon: Clock },
      { key: 'ready', label: 'Ready', icon: Package },
      { key: 'picked_up', label: 'Picked Up', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle },
    ];

    const currentIndex = steps.findIndex((s) => s.key === order?.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center max-w-md w-full">
          <XCircle className="mx-auto text-red-500 mb-4" size={64} />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find an order with ID: <span className="font-mono font-semibold">{orderId}</span>
          </p>
          <Link
            href="/customer"
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
          >
            Browse Chefs
          </Link>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">
            Order ID: <span className="font-mono font-semibold">{orderId}</span>
          </p>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div
              className="absolute left-6 top-0 w-0.5 bg-primary-600 transition-all duration-500"
              style={{
                height: `${(statusSteps.filter((s) => s.completed).length - 1) * 100 / (statusSteps.length - 1)}%`,
              }}
            ></div>

            {/* Steps */}
            <div className="space-y-8">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                        step.completed
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      } ${step.current ? 'ring-4 ring-primary-100' : ''}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3
                        className={`font-semibold ${
                          step.completed ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </h3>
                      {step.current && (
                        <p className="text-sm text-primary-600 font-medium mt-1">Current Status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ETA Card */}
        {order.estimatedDeliveryTime && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Estimated Delivery</h2>
            </div>
            <p className="text-2xl font-bold text-primary-600">
              {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(order.estimatedDeliveryTime).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Order Details (Redacted) */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Restaurant</span>
              <span className="font-semibold text-gray-900">{order.chefName || 'Local Chef'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Items</span>
              <span className="font-semibold text-gray-900">{order.itemCount} item(s)</span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-gray-900 font-semibold">Total</span>
              <span className="text-xl font-bold text-primary-600">
                ${(order.totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <MapPin size={12} className="inline mr-1" />
              For privacy and security, exact addresses and driver details are only visible to authenticated users.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <Link
            href="/customer"
            className="flex-1 text-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg border-2 border-gray-300 transition"
          >
            Browse More Chefs
          </Link>
          <Link
            href="/login"
            className="flex-1 text-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
          >
            Sign In for Full Details
          </Link>
        </div>
      </div>
    </div>
  );
}
