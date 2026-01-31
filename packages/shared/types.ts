/**
 * RideNDine Shared Types
 * Common TypeScript interfaces used across all frontend applications
 */

// ============ User Types ============
export type UserRole = 'customer' | 'home_chef' | 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============ Chef Types ============
export interface Chef {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  cuisineTypes: string[];
  averageRating: number;
  totalReviews: number;
  totalOrders: number;
  minimumOrderCents: number;
  deliveryRadiusKm: number;
  isAcceptingOrders: boolean;
  isVacationMode: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  profileImageUrl?: string;
  bannerImageUrl?: string;
  operatingHours: OperatingHours;
  stripeAccountId?: string;
  stripeOnboardingComplete: boolean;
  createdAt: string;
  distanceKm?: number; // Computed for search results
}

export interface OperatingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "21:00"
}

// ============ Menu Types ============
export interface Menu {
  id: string;
  chefId: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  items: MenuItem[];
  createdAt: string;
}

export interface MenuItem {
  id: string;
  menuId: string;
  name: string;
  description?: string;
  priceCents: number;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  allergens: string[];
  dietaryTags: string[]; // vegetarian, vegan, gluten-free, etc.
  sortOrder: number;
  createdAt: string;
}

// ============ Cart Types ============
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Cart {
  chefId: string;
  chef: Chef;
  items: CartItem[];
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  totalCents: number;
}

// ============ Order Types ============
export type OrderStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'accepted_by_chef'
  | 'rejected_by_chef'
  | 'preparing'
  | 'ready_for_pickup'
  | 'assigned_to_driver'
  | 'driver_en_route_to_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  chefId: string;
  driverId?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  platformCommissionCents: number;
  totalCents: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryInstructions?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  scheduledDeliveryTime?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  chef?: Chef;
  driver?: Driver;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
  notes?: string;
}

// ============ Driver Types ============
export interface Driver {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleType: 'car' | 'motorcycle' | 'bicycle' | 'scooter';
  vehicleColor?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  licensePlate?: string;
  isOnline: boolean;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  averageRating: number;
  totalDeliveries: number;
  acceptanceRate: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  profileImageUrl?: string;
  createdAt: string;
}

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

// ============ Review Types ============
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  chefId: string;
  driverId?: string;
  foodRating: number; // 1-5
  deliveryRating?: number; // 1-5
  overallRating: number; // 1-5
  comment?: string;
  photoUrls: string[];
  createdAt: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

// ============ Address Types ============
export interface Address {
  id: string;
  userId: string;
  label: string; // "Home", "Work", etc.
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  instructions?: string;
  isDefault: boolean;
}

// ============ Notification Types ============
export interface Notification {
  id: string;
  userId: string;
  type: 'order_update' | 'promotion' | 'review_request' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ============ API Response Types ============
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

// ============ Search Types ============
export interface ChefSearchParams {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  cuisineType?: string;
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'total_orders';
  page?: number;
  perPage?: number;
}

// ============ Earnings Types ============
export interface EarningsSummary {
  todayCents: number;
  weekCents: number;
  monthCents: number;
  pendingCents: number;
  totalOrders: number;
  averageOrderCents: number;
}

export interface EarningsTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  amountCents: number;
  commissionCents: number;
  netAmountCents: number;
  status: 'pending' | 'paid' | 'refunded';
  paidAt?: string;
  createdAt: string;
}

// ============ WebSocket Event Types ============
export interface WSOrderUpdate {
  type: 'order_update';
  orderId: string;
  status: OrderStatus;
  timestamp: string;
}

export interface WSDriverLocation {
  type: 'driver_location';
  orderId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  etaMinutes?: number;
}

export interface WSNewOrder {
  type: 'new_order';
  order: Order;
}

export type WSMessage = WSOrderUpdate | WSDriverLocation | WSNewOrder;
