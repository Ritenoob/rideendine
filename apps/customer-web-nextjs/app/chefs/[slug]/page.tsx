'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Star, Clock, MapPin, Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useCartStore } from '@/stores';
import type { MenuItem } from '@/types';
import { useState } from 'react';

export default function ChefDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { addItem, chef: cartChef } = useCartStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Try to use slug as ID for now (backend should support slug lookup)
  const chefId = slug;

  const { data: chef, isLoading } = useQuery({
    queryKey: ['chef', chefId],
    queryFn: () => api.getChef(chefId),
  });

  const { data: menus } = useQuery({
    queryKey: ['chef-menus', chefId],
    queryFn: () => api.getChefMenus(chefId),
    enabled: !!chef,
  });

  const { data: reviews } = useQuery({
    queryKey: ['chef-reviews', chefId],
    queryFn: () => api.getChefReviews(chefId),
    enabled: !!chef,
  });

  const handleAddToCart = (menuItem: MenuItem) => {
    if (!chef) return;
    
    // Check if trying to add from different chef
    if (cartChef && cartChef.id !== chef.id) {
      if (!confirm('Adding items from a different chef will clear your cart. Continue?')) {
        return;
      }
    }
    
    const quantity = quantities[menuItem.id] || 1;
    addItem(menuItem, chef, quantity);
    setQuantities({ ...quantities, [menuItem.id]: 1 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="text-xl text-gray-600">Loading chef details...</div>
        </div>
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Chef not found</h2>
          <Link href="/chefs" className="text-primary-600 hover:text-primary-700 font-semibold">
            ← Back to chef marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/chefs"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span>Back to chefs</span>
        </Link>

        {/* Chef Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{chef.businessName}</h1>
              <p className="text-lg text-gray-600 mb-4 max-w-3xl">{chef.bio}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {chef.cuisineTypes.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-8 text-gray-700">
                <div className="flex items-center gap-2">
                  <Star size={22} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-lg">{chef.rating.toFixed(1)}</span>
                  <span className="text-gray-500">({chef.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={22} />
                  <span>{chef.averagePrepTime} min prep time</span>
                </div>
                {chef.distance && (
                  <div className="flex items-center gap-2">
                    <MapPin size={22} />
                    <span>{chef.distance.toFixed(1)} km away</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Menu</h2>
          {menus && menus.length > 0 ? (
            <div className="space-y-12">
              {menus.map((menu) => (
                <div key={menu.id}>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-6 pb-2 border-b-2 border-primary-200">
                    {menu.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menu.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="h-48 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                          <span className="text-7xl">🍽️</span>
                        </div>
                        <div className="p-5">
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl font-bold text-primary-600">
                              ${item.price.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <Clock size={16} />
                              <span>{item.prepTime} min</span>
                            </div>
                          </div>
                          {item.isAvailable ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border-2 border-gray-300 rounded-lg">
                                <button
                                  onClick={() =>
                                    setQuantities({
                                      ...quantities,
                                      [item.id]: Math.max(1, (quantities[item.id] || 1) - 1),
                                    })
                                  }
                                  className="p-2 hover:bg-gray-100 transition"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={18} />
                                </button>
                                <span className="px-4 py-2 font-bold min-w-[50px] text-center">
                                  {quantities[item.id] || 1}
                                </span>
                                <button
                                  onClick={() =>
                                    setQuantities({
                                      ...quantities,
                                      [item.id]: (quantities[item.id] || 1) + 1,
                                    })
                                  }
                                  className="p-2 hover:bg-gray-100 transition"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
                              >
                                <ShoppingCart size={18} />
                                Add to Cart
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled
                              className="w-full bg-gray-200 text-gray-500 font-semibold py-2.5 px-4 rounded-lg cursor-not-allowed"
                            >
                              Currently Unavailable
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
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-xl text-gray-600">No menu items available at this time</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          {reviews && reviews.data.length > 0 ? (
            <div className="space-y-4">
              {reviews.data.map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={
                          star <= review.chefRating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                    <span className="font-semibold text-lg ml-2">{review.chefRating}/5</span>
                  </div>
                  <p className="text-gray-700 text-lg mb-3">{review.chefComment}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-xl text-gray-600">No reviews yet. Be the first to order!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
