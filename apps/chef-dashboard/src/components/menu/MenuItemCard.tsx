'use client';

import { useState } from 'react';
import { Edit2, Trash2, ToggleRight, ToggleLeft } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  preparationTime: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string) => void;
}

export default function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuItemCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Image */}
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            <p className="font-bold text-blue-600 text-lg flex-shrink-0">${(item.price / 100).toFixed(2)}</p>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-block px-2 py-1 rounded-full bg-gray-100">
              {item.category}
            </span>
            <span>{item.preparationTime}min prep</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => onToggleAvailability(item.id)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            title={item.available ? 'Mark unavailable' : 'Mark available'}
          >
            {item.available ? (
              <ToggleRight className="w-5 h-5 text-green-600" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <button
            onClick={() => onEdit(item)}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
            title="Edit item"
          >
            <Edit2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsDeleting(!isDeleting)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
            title="Delete item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {isDeleting && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-900 font-medium mb-2">Delete this item?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDeleting(false)}
              className="px-3 py-1 border border-red-300 text-red-700 rounded text-sm hover:bg-red-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete(item.id);
                setIsDeleting(false);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Availability Status */}
      {!item.available && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-sm text-gray-600 text-center font-medium">
          Currently Unavailable
        </div>
      )}
    </div>
  );
}
