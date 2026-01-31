import Link from 'next/link';
import { ShoppingBag, UtensilsCrossed, Settings, TrendingUp } from 'lucide-react';

export default function QuickActionsCard() {
  const actions = [
    {
      icon: ShoppingBag,
      label: 'New Orders',
      href: '/dashboard/orders?status=pending',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      icon: UtensilsCrossed,
      label: 'Update Menu',
      href: '/dashboard/menu',
      color: 'bg-green-100 text-green-700',
    },
    {
      icon: TrendingUp,
      label: 'View Earnings',
      href: '/dashboard/earnings',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/dashboard/settings',
      color: 'bg-gray-100 text-gray-700',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map(action => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">
              {action.label}
            </span>
            <span className="ml-auto text-gray-400 group-hover:text-gray-600 transition-colors">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
