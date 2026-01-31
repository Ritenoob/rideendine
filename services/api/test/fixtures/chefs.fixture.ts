/**
 * Chef test fixtures
 * Provides consistent test data for chef-related tests
 */

export const validChef = {
  id: 'chef-profile-uuid-1',
  user_id: 'chef-uuid-1',
  business_name: 'Gordon\'s Kitchen',
  cuisine_types: ['italian', 'mediterranean'],
  bio: 'Passionate chef with 20 years of experience',
  rating: 4.8,
  total_orders: 150,
  is_available: true,
  is_verified: true,
  stripe_account_id: 'acct_test123',
  address: '123 Chef St, City, State 12345',
  latitude: 37.7749,
  longitude: -122.4194,
  service_radius_km: 10,
  min_order_amount: 1500, // $15.00 in cents
  preparation_time_minutes: 30,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

export const unavailableChef = {
  ...validChef,
  id: 'chef-profile-uuid-2',
  user_id: 'chef-uuid-2',
  business_name: 'Busy Chef Kitchen',
  is_available: false,
};

export const unverifiedChef = {
  ...validChef,
  id: 'chef-profile-uuid-3',
  user_id: 'chef-uuid-3',
  business_name: 'New Chef Kitchen',
  is_verified: false,
  rating: 0,
  total_orders: 0,
};

export const validChefMenuItem = {
  id: 'menu-item-uuid-1',
  chef_id: 'chef-profile-uuid-1',
  name: 'Spaghetti Carbonara',
  description: 'Classic Italian pasta with bacon, eggs, and cheese',
  price: 1500, // $15.00 in cents
  category: 'main',
  dietary_restrictions: ['gluten'],
  allergens: ['eggs', 'dairy', 'gluten'],
  is_available: true,
  preparation_time_minutes: 20,
  image_url: 'https://example.com/images/carbonara.jpg',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

export const unavailableMenuItem = {
  ...validChefMenuItem,
  id: 'menu-item-uuid-2',
  name: 'Out of Stock Item',
  is_available: false,
};

export const validCreateChefProfileDto = {
  businessName: 'New Chef Kitchen',
  cuisineTypes: ['asian', 'fusion'],
  bio: 'Innovative chef bringing unique flavors',
  address: '456 New Chef Lane, City, State 12345',
  latitude: 37.7849,
  longitude: -122.4094,
  serviceRadiusKm: 15,
  minOrderAmount: 2000, // $20.00 in cents
  preparationTimeMinutes: 45,
};

export const validUpdateChefProfileDto = {
  businessName: 'Updated Kitchen Name',
  bio: 'Updated bio with more details',
  isAvailable: false,
  serviceRadiusKm: 12,
  minOrderAmount: 1800,
  preparationTimeMinutes: 35,
};

export const validCreateMenuItemDto = {
  name: 'Margherita Pizza',
  description: 'Classic pizza with tomato, mozzarella, and basil',
  price: 1200, // $12.00 in cents
  category: 'main',
  dietaryRestrictions: ['vegetarian'],
  allergens: ['gluten', 'dairy'],
  preparationTimeMinutes: 25,
  imageUrl: 'https://example.com/images/margherita.jpg',
};

export const validUpdateMenuItemDto = {
  price: 1300, // $13.00 in cents
  isAvailable: false,
  description: 'Updated description with seasonal ingredients',
};

/**
 * Chef search filters for testing
 */
export const validChefSearchFilters = {
  cuisineType: 'italian',
  minRating: 4.5,
  maxDistance: 5,
  latitude: 37.7749,
  longitude: -122.4194,
  isAvailable: true,
};

/**
 * Chef cuisine types for validation
 */
export const validCuisineTypes = [
  'italian',
  'chinese',
  'japanese',
  'mexican',
  'indian',
  'thai',
  'mediterranean',
  'american',
  'french',
  'korean',
  'vietnamese',
  'middle_eastern',
  'latin_american',
  'fusion',
  'other',
];

/**
 * Menu item categories for validation
 */
export const validMenuCategories = [
  'appetizer',
  'main',
  'dessert',
  'beverage',
  'side',
  'salad',
  'soup',
];

/**
 * Dietary restrictions for validation
 */
export const validDietaryRestrictions = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'halal',
  'kosher',
  'keto',
  'paleo',
];
