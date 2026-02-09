'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, MapPin, Star, Clock, ChefHat } from 'lucide-react';
import { api } from '@/services/api';
import type { Chef } from '@/types';

export default function ChefsPage() {
  const [location, setLocation] = useState({ lat: 43.2207, lng: -79.7651 }); // Default: Hamilton
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'prepTime'>('distance');

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Fetch chefs
  const { data: chefs, isLoading } = useQuery({
    queryKey: ['chefs', location, cuisineFilter, sortBy],
    queryFn: () =>
      api.searchChefs({
        lat: location.lat,
        lng: location.lng,
        radius: 25, // 25km radius
        ...(cuisineFilter && { cuisineType: cuisineFilter }),
        sortBy,
      }),
    enabled: !!location,
  });

  // Filter chefs by search query
  const filteredChefs = chefs?.filter(
    (chef) =>
      !searchQuery ||
      chef.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chef.cuisineTypes.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ChefHat size={32} className="text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900">Chef Marketplace</h1>
          </div>
          <p className="text-lg text-gray-600">
            Discover talented home chefs in your area and enjoy authentic homemade meals
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search chefs or cuisine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Cuisine Filter */}
            <select
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">All Cuisines</option>
              <option value="italian">Italian</option>
              <option value="chinese">Chinese</option>
              <option value="mexican">Mexican</option>
              <option value="indian">Indian</option>
              <option value="japanese">Japanese</option>
              <option value="thai">Thai</option>
              <option value="american">American</option>
              <option value="mediterranean">Mediterranean</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating' | 'prepTime')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
            >
              <option value="distance">Closest to Me</option>
              <option value="rating">Highest Rated</option>
              <option value="prepTime">Fastest Prep Time</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && filteredChefs && (
          <div className="mb-6">
            <p className="text-gray-600">
              Found <span className="font-semibold">{filteredChefs.length}</span> chef{filteredChefs.length !== 1 ? 's' : ''} near you
            </p>
          </div>
        )}

        {/* Chef Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white animate-pulse rounded-xl h-80 shadow-md"></div>
            ))}
          </div>
        ) : filteredChefs && filteredChefs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChefs.map((chef) => (
              <Link
                key={chef.id}
                href={`/chefs/${chef.slug || chef.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group"
              >
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative overflow-hidden">
                  <span className="text-6xl group-hover:scale-110 transition-transform">
                    {chef.cuisineTypes[0]?.charAt(0) || '🍽️'}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {chef.businessName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {chef.bio || 'Passionate about creating delicious homemade meals'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {chef.cuisineTypes.slice(0, 3).map((cuisine) => (
                      <span
                        key={cuisine}
                        className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full font-medium"
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{chef.rating.toFixed(1)}</span>
                      <span className="text-gray-400">({chef.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{chef.averagePrepTime} min</span>
                    </div>
                    {chef.distance && (
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{chef.distance.toFixed(1)} km</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <ChefHat size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No chefs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
