'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  preparationTime: number;
  imageUrl?: string;
}

interface Menu {
  id: string;
  name: string;
  isActive: boolean;
  items: MenuItem[];
}

export default function MenuPage() {
  const { chef } = useAuthStore();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: '30',
  });

  useEffect(() => {
    if (chef?.id) {
      fetchMenus();
    }
  }, [chef]);

  const fetchMenus = async () => {
    try {
      const data = await api.getMenus(chef!.id);
      setMenus(data);
      if (data.length > 0 && !selectedMenu) {
        setSelectedMenu(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async () => {
    try {
      await api.createMenu(chef!.id, {
        name: 'Main Menu',
        isActive: true,
      });
      toast.success('Menu created!');
      fetchMenus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create menu');
    }
  };

  const handleAddItem = async () => {
    if (!selectedMenu || !newItem.name || !newItem.price || !newItem.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.createMenuItem(selectedMenu, {
        name: newItem.name,
        description: newItem.description,
        price: Math.round(parseFloat(newItem.price) * 100),
        category: newItem.category,
        preparationTime: parseInt(newItem.preparationTime),
        isAvailable: true,
      });
      toast.success('Item added!');
      setShowAddItem(false);
      setNewItem({ name: '', description: '', price: '', category: '', preparationTime: '30' });
      fetchMenus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add item');
    }
  };

  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      await api.updateMenuItem(itemId, { isAvailable: !isAvailable });
      toast.success(isAvailable ? 'Item hidden' : 'Item visible');
      fetchMenus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.deleteMenuItem(itemId);
      toast.success('Item deleted');
      fetchMenus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const currentMenu = menus.find((m) => m.id === selectedMenu);

  if (!chef) {
    return (
      <div className="card text-center py-12">
        <p className="text-muted">Complete your chef profile first to manage your menu</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">Menu Management</h1>
          <p className="text-muted mt-1">Add and manage your dishes</p>
        </div>
        <button onClick={() => setShowAddItem(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-muted">Loading menu...</div>
      ) : menus.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🍽️</div>
          <h3 className="text-lg font-bold text-ink mb-2">No menu yet</h3>
          <p className="text-muted mb-6">Create your first menu to start adding items</p>
          <button onClick={handleCreateMenu} className="btn-primary">
            Create Menu
          </button>
        </div>
      ) : (
        <>
          {/* Menu Items */}
          <div className="grid gap-4">
            {currentMenu?.items.map((item) => (
              <div key={item.id} className="card flex items-center gap-4">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                    🍽️
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-ink">{item.name}</h3>
                    {!item.isAvailable && (
                      <span className="badge bg-gray-100 text-gray-600">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm text-muted line-clamp-1">{item.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="font-bold text-primary-500">{formatCurrency(item.price)}</span>
                    <span className="text-sm text-muted">{item.category}</span>
                    <span className="text-sm text-muted">{item.preparationTime} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={item.isAvailable ? 'Hide item' : 'Show item'}
                  >
                    {item.isAvailable ? (
                      <Eye size={18} className="text-green-600" />
                    ) : (
                      <EyeOff size={18} className="text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            {currentMenu?.items.length === 0 && (
              <div className="card text-center py-8 text-muted">
                No items yet. Click "Add Item" to get started.
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-xl font-bold text-ink mb-6">Add Menu Item</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Butter Chicken"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">Description</label>
                <textarea
                  className="input"
                  placeholder="Describe your dish..."
                  rows={2}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="12.99"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="30"
                    value={newItem.preparationTime}
                    onChange={(e) => setNewItem({ ...newItem, preparationTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">Category *</label>
                <select
                  className="input"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="Appetizers">Appetizers</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Sides">Sides</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Drinks">Drinks</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddItem(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleAddItem} className="flex-1 btn-primary">
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
