'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores';
import { Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, chef, getTotal } = useCartStore();

  useEffect(() => {
    // Redirect to cart if empty
    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    // In a real app, this would:
    // 1. Create order with backend
    // 2. Initialize Stripe Payment Intent
    // 3. Redirect to Stripe Checkout or show Payment Element
    
    // For now, simulate checkout and redirect to success
    const simulateCheckout = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Generate mock order ID
      const orderId = `RND-${Date.now()}`;
      
      // Redirect to success page
      router.push(`/checkout/success?orderId=${orderId}`);
    };

    simulateCheckout();
  }, [items, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-12 max-w-md w-full text-center">
        <Loader2 className="animate-spin mx-auto mb-6 text-primary-600" size={64} />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Order</h1>
        <p className="text-gray-600 mb-8">
          Please wait while we prepare your checkout...
        </p>
        
        {chef && (
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-600 mb-2">Ordering from:</p>
            <p className="font-semibold text-gray-900">{chef.businessName}</p>
            <p className="text-sm text-gray-600 mt-3">Total: ${getTotal().toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
