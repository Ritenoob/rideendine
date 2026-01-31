/**
 * RideNDine Shared Constants
 */

// ============ API Configuration ============

export const API_VERSION = 'v2';

export const DEFAULT_API_URL = 'http://localhost:9001';
export const DEFAULT_WS_URL = 'ws://localhost:9004';
export const DEFAULT_DEMO_URL = 'http://localhost:8081';

// ============ Business Rules ============

export const PLATFORM_COMMISSION_RATE = 0.15; // 15%
export const TAX_RATE = 0.08; // 8%
export const BASE_DELIVERY_FEE = 500; // $5.00 in cents
export const SERVICE_FEE_RATE = 0.05; // 5%
export const MIN_ORDER_AMOUNT = 1000; // $10.00 in cents

export const DEFAULT_DELIVERY_RADIUS = 10; // miles
export const MAX_DELIVERY_RADIUS = 25; // miles

export const DEFAULT_PREP_TIME = 30; // minutes
export const MAX_PREP_TIME = 120; // minutes

// ============ Order Status Flow ============

export const ORDER_STATUS_SEQUENCE = [
  'pending',
  'payment_pending',
  'payment_confirmed',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'assigned_to_driver',
  'picked_up',
  'in_transit',
  'delivered',
] as const;

export const CANCELLABLE_STATUSES = [
  'pending',
  'payment_pending',
  'payment_confirmed',
  'accepted',
] as const;

export const REFUNDABLE_STATUSES = [
  'payment_confirmed',
  'accepted',
  'preparing',
  'ready_for_pickup',
] as const;

// ============ UI Configuration ============

export const COLORS = {
  primary: '#ff9800',
  primaryDark: '#f57c00',
  primaryLight: '#ffb74d',
  secondary: '#4caf50',
  secondaryDark: '#388e3c',
  accent: '#2196f3',
  background: '#f7f4ee',
  backgroundDark: '#1a1a1a',
  surface: '#ffffff',
  surfaceDark: '#2d2d2d',
  text: '#151515',
  textLight: '#5f5f5f',
  textMuted: '#9e9e9e',
  textOnPrimary: '#ffffff',
  error: '#d32f2f',
  success: '#388e3c',
  warning: '#ffa000',
  info: '#1976d2',
  border: '#e0e0e0',
  divider: '#eeeeee',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  display: 34,
} as const;

// ============ Cuisine Types ============

export const CUISINE_TYPES = [
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
  'Caribbean',
  'Soul Food',
  'BBQ',
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Other',
] as const;

// ============ Allergens ============

export const COMMON_ALLERGENS = [
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree Nuts',
  'Peanuts',
  'Wheat',
  'Soy',
  'Sesame',
] as const;

// ============ Polling Intervals ============

export const ETA_POLL_INTERVAL = 8000; // 8 seconds
export const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds
export const ORDER_REFRESH_INTERVAL = 30000; // 30 seconds

// ============ Map Configuration ============

export const DEFAULT_MAP_REGION = {
  latitude: 43.2207,
  longitude: -79.7651,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export const MAP_MARKER_COLORS = {
  customer: '#4caf50',
  driver: '#2196f3',
  chef: '#ff9800',
  destination: '#d32f2f',
} as const;
