/**
 * RideNDine Shared Types
 * Used across all frontend applications
 */

// ============ User & Auth Types ============

export enum UserRole {
  CUSTOMER = 'customer',
  CHEF = 'chef',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

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
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// ============ Chef Types ============

export enum ChefStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export interface OperatingHours {
  day: number; // 0-6, Sunday=0
  open: string; // HH:mm
  close: string; // HH:mm
  closed: boolean;
}

export interface Chef {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  cuisineTypes: string[];
  profileImageUrl?: string;
  bannerImageUrl?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  deliveryRadius: number; // in miles
  minimumOrder: number; // in cents
  averagePrepTime: number; // in minutes
  rating: number;
  reviewCount: number;
  status: ChefStatus;
  isOnVacation: boolean;
  operatingHours: OperatingHours[];
  stripeAccountId?: string;
  stripeOnboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChefSearchParams {
  lat: number;
  lng: number;
  radius?: number;
  cuisineType?: string;
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'prepTime';
}

// ============ Menu Types ============

export interface MenuItem {
  id: string;
  menuId: string;
  name: string;
  description?: string;
  price: number; // in cents
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: number; // 0-5
  calories?: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Menu {
  id: string;
  chefId: string;
  name: string;
  description?: string;
  isActive: boolean;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

// ============ Order Types ============

export enum OrderStatus {
  PENDING = 'pending',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ASSIGNED_TO_DRIVER = 'assigned_to_driver',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface OrderAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  instructions?: string;
}

export interface Order {
  id: string;
  customerId: string;
  chefId: string;
  driverId?: string;
  status: OrderStatus;
  items: OrderItem[];
  deliveryAddress: OrderAddress;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip: number;
  total: number;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  specialInstructions?: string;
  stripePaymentIntentId?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  chefId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  deliveryAddress: OrderAddress;
  tip?: number;
  specialInstructions?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

// ============ Driver Types ============

export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  ON_DELIVERY = 'on_delivery',
}

export interface Driver {
  id: string;
  userId: string;
  vehicleType: 'car' | 'motorcycle' | 'bicycle' | 'scooter';
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  licensePlate?: string;
  status: DriverStatus;
  currentLat?: number;
  currentLng?: number;
  rating: number;
  totalDeliveries: number;
  todayEarnings: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface AvailableOrder {
  id: string;
  chefBusinessName: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  estimatedDistance: number; // in miles
  estimatedDuration: number; // in minutes
  deliveryFee: number;
  tip: number;
  itemCount: number;
  createdAt: string;
}

// ============ Review Types ============

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  chefId?: string;
  driverId?: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  orderId: string;
  chefRating?: number;
  chefComment?: string;
  driverRating?: number;
  driverComment?: string;
}

// ============ Cart Types (Client-side only) ============

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface Cart {
  chefId: string;
  chef: Chef;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  estimatedTax: number;
  tip: number;
  total: number;
}

// ============ WebSocket Event Types ============

export type WebSocketEventType =
  | 'init'
  | 'order_update'
  | 'driver_location'
  | 'new_order'
  | 'order_assigned'
  | 'eta_update';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  data: T;
  timestamp: string;
}

export interface OrderUpdateEvent {
  orderId: string;
  status: OrderStatus;
  estimatedDeliveryTime?: string;
}

export interface DriverLocationEvent {
  orderId: string;
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  etaMinutes?: number;
}

// ============ API Response Types ============

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
