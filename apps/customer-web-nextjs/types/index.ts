// Core domain types for RideNDine customer web app

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'customer' | 'chef' | 'driver' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label?: string; // e.g., "Home", "Work"
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  instructions?: string;
  isDefault?: boolean;
}

export interface Chef {
  id: string;
  userId: string;
  businessName: string;
  bio?: string;
  cuisineTypes: string[];
  rating: number;
  reviewCount: number;
  averagePrepTime: number; // minutes
  isActive: boolean;
  address: Address;
  distance?: number; // km from customer
  menus: Menu[];
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
}

export interface MenuItem {
  id: string;
  menuId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  prepTime: number; // minutes
  allergens?: string[];
  dietaryInfo?: string[]; // vegan, gluten-free, etc.
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  customerId: string;
  chefId: string;
  driverId?: string;
  status: OrderStatus;
  items: OrderItem[];
  deliveryAddress: Address;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tip: number;
  total: number;
  specialInstructions?: string;
  paymentIntentId?: string;
  estimatedPrepTime: number;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  chef?: Chef;
  driver?: Driver;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  menuItem?: MenuItem;
}

export type OrderStatus =
  | 'pending' // Created, waiting for chef acceptance
  | 'accepted' // Chef accepted
  | 'preparing' // Chef is preparing
  | 'ready_for_pickup' // Ready for driver
  | 'assigned' // Driver assigned
  | 'picked_up' // Driver picked up from chef
  | 'in_transit' // On the way to customer
  | 'delivered' // Delivered to customer
  | 'cancelled' // Cancelled
  | 'failed'; // Failed

export interface Driver {
  id: string;
  userId: string;
  vehicleType: string;
  vehiclePlate: string;
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  chefId?: string;
  driverId?: string;
  chefRating?: number;
  chefComment?: string;
  driverRating?: number;
  driverComment?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'cash';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}

// API Response types
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

export interface SearchChefsParams {
  lat: number;
  lng: number;
  radius?: number;
  cuisineType?: string;
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'prepTime';
}

export interface CreateOrderData {
  chefId: string;
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    lat: number;
    lng: number;
    instructions?: string;
  };
  tip?: number;
  specialInstructions?: string;
}
