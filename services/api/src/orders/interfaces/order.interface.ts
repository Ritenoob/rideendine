export enum OrderStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ASSIGNED_TO_DRIVER = 'assigned_to_driver',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  priceCents: number;
  specialInstructions?: string;
}

export interface DeliveryWindow {
  start: Date;
  end: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  chefId: string;
  customerId: string;
  driverId?: string;
  items: OrderItem[];
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  platformFeeCents: number;
  totalCents: number;
  chefEarningCents: number;
  driverEarningCents?: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: Address;
  pickupAddress: Address;
  deliveryWindow?: DeliveryWindow;
  etaMinutes?: number;
  driverStatus?: string;
  mealbridgeDispatchId?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  source: 'ridendine' | 'cooco';
  externalOrderId?: string;
  customerNotes?: string;
  driverNotes?: string;
  estimatedPrepTimeMinutes?: number;
  estimatedDeliveryTimeMinutes?: number;
  scheduledPickupTime?: Date;
  actualPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  etaMinutes?: number;
  deliveryWindow?: DeliveryWindow;
  driverStatus?: string;
  pickupLabel: string;
  estimatedDeliveryTime?: Date;
  createdAt: Date;
}
