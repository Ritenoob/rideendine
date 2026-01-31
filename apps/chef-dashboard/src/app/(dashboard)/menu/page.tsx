'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import MenuItemCard from '@/components/menu/MenuItemCard';
import MenuItemForm from '@/components/menu/MenuItemForm';
import { Plus, Loader2, AlertCircle } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl?: string;
  category: string;
  prepTimeMinutes: number;
  dietaryTags: string[];
  isAvailable: boolean;
  createdAt: Date;
}

interface MenuItemFormData {
  name: string;
  description: string;
  priceCents: number;
  category: string;
  prepTimeMinutes: number;
  dietaryTags: string[];
  imageUrl?: string;
}

export default function MenuPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['Appetizers', 'Mains', 'Sides', 'Desserts', 'Beverages'];

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        // Mock data - replace with API call
        const mockItems: MenuItem[] = [
          {
            id: '1',
            name: 'Margherita Pizza',
            description: 'Fresh mozzarella, basil, tomato sauce on thin crust',
            priceCents: 1899,
            category: 'Mains',
            prepTimeMinutes: 12,
            dietaryTags: ['vegetarian'],
            isAvailable: true,
            createdAt: new Date(),
          },
          {
            id: '2',
            name: 'Caesar Salad',
            description: 'Romaine lettuce, parmesan, croutons, classic Caesar dressing',
            priceCents: 999,
            category: 'Appetizers',
            prepTimeMinutes: 5,
            dietaryTags: ['vegetarian'],
            isAvailable: true,
            createdAt: new Date(),
          },
          {
            id: '3',
            name: 'Grilled Salmon',
            description: 'Atlantic salmon fillet with lemon butter and herbs',
            priceCents: 2299,
            category: 'Mains',
            prepTimeMinutes: 18,
            dietaryTags: ['gluten-free'],
            isAvailable: true,
            createdAt: new Date(),
          },
          {
            id: '4',
            name: 'Tiramisu',
            description: 'Classic Italian dessert with mascarpone and espresso',
            priceCents: 799,
            category: 'Desserts',
            prepTimeMinutes: 0,
            dietaryTags: ['vegetarian'],
            isAvailable: true,
            createdAt: new Date(),
          },
        ];
        setItems(mockItems);
        setError(null);
      } catch (err) {
        setError('Failed to load menu items');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [token, router]);

  const handleCreateItem = async (formData: MenuItemFormData) => {
    try {
      // API call: POST /menus/{menuId}/items
      const newItem: MenuItem = {
        id: Date.now().toString(),
        ...formData,
        isAvailable: true,
        createdAt: new Date(),
      };
      setItems([...items, newItem]);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create menu item:', err);
    }
  };

  const handleUpdateItem = async (itemId: string, formData: MenuItemFormData) => {
    try {
      // API call: PATCH /menu-items/{itemId}
      setItems(items.map(item =>
        item.id === itemId
          ? { ...item, ...formData }
          : item
      ));
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update menu item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      // API call: DELETE /menu-items/{itemId}
      setItems(items.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  };

  const handleToggleAvailability = async (itemId: string) => {
    try {
      // API call: PATCH /menu-items/{itemId}
      setItems(items.map(item =>
        item.id === itemId
          ? { ...item, isAvailable: !item.isAvailable }
          : item
      ));
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
          <p className="text-gray-600 mt-1">Manage your menu items and availability</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">{error}</h3>
            <button 
              onClick={() => window.location.reload()}
              className="text-red-700 hover:text-red-900 text-sm mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Menu Item Form */}
      {showForm && (
        <MenuItemForm
          item={editingItem}
          onSubmit={(data) => {
            if (editingItem) {
              handleUpdateItem(editingItem.id, data);
            } else {
              handleCreateItem(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          categories={categories}
        />
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Items
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No items in this category</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={() => {
                setEditingItem(item);
                setShowForm(true);
              }}
              onDelete={() => handleDeleteItem(item.id)}
              onToggleAvailability={() => handleToggleAvailability(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
