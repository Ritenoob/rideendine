'use client';

import Link from 'next/link';
import { XCircle, ShoppingCart, ArrowLeft } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
          <div className="mb-6">
            <XCircle className="mx-auto text-orange-500" size={80} strokeWidth={1.5} />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Checkout Cancelled
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your order was not completed. Your cart has been saved and you can return to checkout when you're ready.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <p className="text-sm text-yellow-800">
              <strong>Don't worry!</strong> Your items are still in your cart. You can continue shopping or proceed to checkout whenever you're ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition"
            >
              <ShoppingCart size={20} />
              Return to Cart
            </Link>
            <Link
              href="/customer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg border-2 border-gray-300 transition"
            >
              <ArrowLeft size={20} />
              Continue Shopping
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-semibold">Contact support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
