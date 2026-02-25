'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  ChefHat,
  Truck,
  ShoppingBag,
  DollarSign,
  Star,
  Settings,
  LogOut,
  Shield,
  Map,
  Navigation,
  Zap,
  MessageSquare,
  FileText,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/users', icon: Users, label: 'Customers' },
  { href: '/dashboard/chefs', icon: ChefHat, label: 'Chefs' },
  { href: '/dashboard/drivers', icon: Truck, label: 'Drivers' },
  { href: '/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/dashboard/payouts', icon: DollarSign, label: 'Payouts' },
  { href: '/dashboard/disputes', icon: MessageSquare, label: 'Disputes' },
  { href: '/dashboard/live-map', icon: Map, label: 'Live Map' },
  { href: '/dashboard/driver-simulator', icon: Navigation, label: 'Simulator' },
  { href: '/dashboard/integrations', icon: Zap, label: 'Integrations' },
  { href: '/dashboard/reviews', icon: Star, label: 'Reviews' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, token, isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (token) {
      api.setToken(token);
    }
  }, [isAuthenticated, token, router]);

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-3 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-ink">RideNDine</h1>
              <p className="text-xs text-muted">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:bg-gray-50 hover:text-ink'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2 mb-2">
            <p className="font-medium text-sm text-ink truncate">
              {admin?.firstName} {admin?.lastName}
            </p>
            <p className="text-xs text-muted truncate">{admin?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
