import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change: string;
  colorClass: string;
  iconColor: string;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  colorClass,
  iconColor,
}: StatsCardProps) {
  return (
    <div className={`${colorClass} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-2">{change}</p>
        </div>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </div>
  );
}
