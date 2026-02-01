'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, User, LogOut, Home, Package } from 'lucide-react';
import { useAuthStore, useCartStore } from '@/stores';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const totalItems = useCartStore((state) => state.getTotalItems());

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/home" className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">RideNDine</h1>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/home"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive('/home')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home size={20} />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              href="/orders"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive('/orders')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package size={20} />
              <span className="hidden sm:inline">Orders</span>
            </Link>

            <Link
              href="/cart"
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive('/cart')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
              <span className="hidden sm:inline">Cart</span>
            </Link>

            <Link
              href="/profile"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive('/profile')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User size={20} />
              <span className="hidden sm:inline">{user?.firstName || 'Profile'}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
