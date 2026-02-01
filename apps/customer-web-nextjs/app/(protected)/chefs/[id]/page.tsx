'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Star, Clock, MapPin, Plus, Minus, ShoppingCart } from 'lucide-react';
import { api } from '@/services/api';
import { useCartStore } from '@/stores';
import type { MenuItem } from '@/types';
import { useState } from 'react';

export default function ChefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem, chef: cartChef } = useCartStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: chef, isLoading } = useQuery({
    queryKey: ['chef', id],
    queryFn: () => api.getChef(id),
  });

  const { data: menus } = useQuery({
    queryKey: ['chef-menus', id],
    queryFn: () => api.getChefMenus(id),
    enabled: !!chef,
  });

  const { data: reviews } = useQuery({
    queryKey: ['chef-reviews', id],
    queryFn: () => api.getChefReviews(id),
    enabled: !!chef,
  });

  const handleAddToCart = (menuItem: MenuItem) => {
    if (!chef) return;
    const quantity = quantities[menuItem.id] || 1;
    addItem(menuItem, chef, quantity);
    setQuantities({ ...quantities, [menuItem.id]: 1 });
    // Show success message or navigate to cart
    router.push('/cart');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading chef details...</div>
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Chef not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Chef Header */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{chef.businessName}</h1>
            <p className="text-gray-600 mb-4">{chef.bio}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {chef.cuisineTypes.map((cuisine) => (
                <span
                  key={cuisine}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {cuisine}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-6 text-gray-700">
              <div className="flex items-center gap-2">
                <Star size={20} className="text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{chef.rating.toFixed(1)}</span>
                <span className="text-gray-500">({chef.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} />
                <span>{chef.averagePrepTime} min avg prep time</span>
              </div>
              {chef.distance && (
                <div className="flex items-center gap-2">
                  <MapPin size={20} />
                  <span>{chef.distance.toFixed(1)} km away</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>
        {menus && menus.length > 0 ? (
          <div className="space-y-8">
            {menus.map((menu) => (
              <div key={menu.id}>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{menu.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menu.items.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="h-48 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                        <span className="text-6xl">🍽️</span>
                      </div>
                      <div className="p-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xl font-bold text-primary-600">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">{item.prepTime} min</span>
                        </div>
                        {item.isAvailable ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() =>
                                  setQuantities({
                                    ...quantities,
                                    [item.id]: Math.max(1, (quantities[item.id] || 1) - 1),
                                  })
                                }
                                className="p-2 hover:bg-gray-100"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="px-4 py-2 font-semibold">
                                {quantities[item.id] || 1}
                              </span>
                              <button
                                onClick={() =>
                                  setQuantities({
                                    ...quantities,
                                    [item.id]: (quantities[item.id] || 1) + 1,
                                  })
                                }
                                className="p-2 hover:bg-gray-100"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                            >
                              <ShoppingCart size={18} />
                              Add
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled
                            className="w-full bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
                          >
                            Unavailable
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No menu items available</p>
        )}
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
        {reviews && reviews.data.length > 0 ? (
          <div className="space-y-4">
            {reviews.data.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={18} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{review.chefRating}/5</span>
                </div>
                <p className="text-gray-700">{review.chefComment}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No reviews yet</p>
        )}
      </div>
    </div>
  );
}
