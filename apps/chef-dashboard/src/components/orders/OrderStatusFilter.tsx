'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface OrderStatusFilterProps {
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-blue-100 text-blue-800' },
  { value: 'preparing', label: 'Preparing', color: 'bg-purple-100 text-purple-800' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup', color: 'bg-green-100 text-green-800' },
  { value: 'assigned_to_driver', label: 'Assigned', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'picked_up', label: 'Picked Up', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'in_transit', label: 'In Transit', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
];

export default function OrderStatusFilter({
  selectedStatus,
  onStatusChange,
}: OrderStatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (!selectedStatus) return 'All Orders';
    const option = STATUS_OPTIONS.find((opt) => opt.value === selectedStatus);
    return option?.label || 'All Orders';
  }, [selectedStatus]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-40 min-w-[200px]">
          {/* Clear filter option */}
          <button
            onClick={() => {
              onStatusChange(null);
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm font-medium ${
              !selectedStatus ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            }`}
          >
            All Orders
          </button>

          {/* Status options */}
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onStatusChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm flex items-center justify-between ${
                selectedStatus === option.value ? 'bg-blue-50' : ''
              }`}
            >
              <span className={selectedStatus === option.value ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                {option.label}
              </span>
              <span
                className={`inline-block w-2 h-2 rounded-full ${option.color.split(' ')[0].replace('bg-', 'bg-')}`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
