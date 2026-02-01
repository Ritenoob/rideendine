'use client';

import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/stores';

export default function CartPage() {
  const router = useRouter();
  const { items, chef, removeItem, updateQuantity, getSubtotal } = useCartStore();

  const subtotal = getSubtotal();
  const deliveryFee = 5.0;
  const serviceFee = subtotal * 0.1;
  const total = subtotal + deliveryFee + serviceFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <button
            onClick={() => router.push('/home')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Browse Chefs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

      {chef && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Order from: {chef.businessName}</h2>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.menuItem.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.menuItem.name}</h3>
                <p className="text-sm text-gray-600">${item.menuItem.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.menuItem.id, Math.max(1, item.quantity - 1))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="w-24 text-right font-semibold">
                ${(item.menuItem.price * item.quantity).toFixed(2)}
              </div>
              <button
                onClick={() => removeItem(item.menuItem.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service Fee</span>
            <span className="font-semibold">${serviceFee.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-primary-600">${total.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/checkout')}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
