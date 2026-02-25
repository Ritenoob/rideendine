'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, MapPin } from 'lucide-react';
import { useCartStore } from '@/stores';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Clear cart after successful order
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
          <div className="mb-6">
            <CheckCircle className="mx-auto text-green-500" size={80} strokeWidth={1.5} />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your order. Your chef has been notified and will start preparing your meal.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Order Number</p>
              <p className="text-2xl font-mono font-bold text-gray-900">{orderId}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-primary-50 rounded-lg p-6 text-left">
              <Package className="text-primary-600 mb-3" size={32} />
              <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
              <p className="text-sm text-gray-600">
                Your chef will confirm and start preparing your order. You'll receive updates along the way.
              </p>
            </div>
            <div className="bg-primary-50 rounded-lg p-6 text-left">
              <MapPin className="text-primary-600 mb-3" size={32} />
              <h3 className="font-semibold text-gray-900 mb-2">Track Your Order</h3>
              <p className="text-sm text-gray-600">
                Follow your order in real-time from preparation to delivery at your door.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {orderId && (
              <Link
                href={`/order/${orderId}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
              >
                Track Your Order
              </Link>
            )}
            <Link
              href="/customer"
              className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg border-2 border-gray-300 transition"
            >
              Continue Browsing
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to your inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
