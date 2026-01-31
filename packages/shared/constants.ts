/**
 * RideNDine Shared Constants
 * Design tokens and configuration constants
 */

// ============ Colors ============
export const Colors = {
  // Primary brand colors
  primary: '#ff9800',
  primaryDark: '#f57c00',
  primaryLight: '#ffb74d',

  // Secondary colors
  secondary: '#4caf50',
  secondaryDark: '#388e3c',
  secondaryLight: '#81c784',

  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',

  // Neutrals
  white: '#ffffff',
  background: '#f7f4ee',
  surface: '#ffffff',
  surfaceVariant: '#f5f5f5',
  border: '#e0e0e0',
  divider: '#eeeeee',

  // Text colors
  textPrimary: '#151515',
  textSecondary: '#5f5f5f',
  textMuted: '#9e9e9e',
  textInverse: '#ffffff',

  // Semantic colors
  online: '#4caf50',
  offline: '#9e9e9e',
  busy: '#ff9800',
} as const;

// ============ Typography ============
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// ============ Spacing ============
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// ============ Border Radius ============
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ============ Shadows ============
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// ============ Order Status ============
export const OrderStatusLabels: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  payment_confirmed: 'Payment Confirmed',
  accepted_by_chef: 'Order Accepted',
  rejected_by_chef: 'Order Rejected',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  assigned_to_driver: 'Driver Assigned',
  driver_en_route_to_pickup: 'Driver En Route',
  picked_up: 'Picked Up',
  in_transit: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const OrderStatusColors: Record<string, string> = {
  pending_payment: Colors.warning,
  payment_confirmed: Colors.info,
  accepted_by_chef: Colors.info,
  rejected_by_chef: Colors.error,
  preparing: Colors.warning,
  ready_for_pickup: Colors.success,
  assigned_to_driver: Colors.info,
  driver_en_route_to_pickup: Colors.info,
  picked_up: Colors.info,
  in_transit: Colors.primary,
  delivered: Colors.success,
  cancelled: Colors.error,
};

// ============ Cuisine Types ============
export const CuisineTypes = [
  'American',
  'Chinese',
  'Indian',
  'Italian',
  'Japanese',
  'Korean',
  'Mexican',
  'Thai',
  'Vietnamese',
  'Mediterranean',
  'Middle Eastern',
  'Caribbean',
  'Soul Food',
  'BBQ',
  'Vegan',
  'Vegetarian',
  'Seafood',
  'Desserts',
  'Bakery',
  'Other',
] as const;

// ============ Dietary Tags ============
export const DietaryTags = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'halal',
  'kosher',
  'keto',
  'low-carb',
  'organic',
] as const;

// ============ Allergens ============
export const Allergens = [
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'tree nuts',
  'peanuts',
  'wheat',
  'soybeans',
  'sesame',
] as const;

// ============ Vehicle Types ============
export const VehicleTypes = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'scooter', label: 'Scooter' },
] as const;

// ============ Platform Config ============
export const PlatformConfig = {
  platformCommissionRate: 0.15, // 15%
  taxRate: 0.08, // 8%
  defaultDeliveryFeeCents: 500, // $5.00
  minOrderAmountCents: 1000, // $10.00
  maxDeliveryRadiusKm: 25,
  defaultDeliveryRadiusKm: 10,
  orderExpirationMinutes: 30,
  driverSearchRadiusKm: 15,
  maxItemsPerOrder: 50,
} as const;

// ============ API Config ============
export const ApiConfig = {
  defaultTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;
