/**
 * Order test fixtures
 * Provides consistent test data for order-related tests
 */

export const validOrder = {
  id: 'order-uuid-1',
  customer_id: 'customer-uuid-1',
  chef_id: 'chef-uuid-1',
  driver_id: null,
  status: 'pending',
  subtotal: 2500, // $25.00 in cents
  delivery_fee: 500, // $5.00 in cents
  service_fee: 300, // $3.00 in cents
  total: 3300, // $33.00 in cents
  pickup_address: '123 Chef St, City, State 12345',
  pickup_latitude: 37.7749,
  pickup_longitude: -122.4194,
  delivery_address: '456 Customer Ave, City, State 12345',
  delivery_latitude: 37.7849,
  delivery_longitude: -122.4094,
  delivery_notes: 'Leave at door',
  payment_intent_id: 'pi_test123',
  commission_rate: 15, // 15%
  commission_amount: 375, // $3.75 in cents
  chef_payout: 2125, // $21.25 in cents
  estimated_pickup_time: new Date('2026-01-31T18:30:00Z'),
  actual_pickup_time: null,
  estimated_delivery_time: new Date('2026-01-31T19:00:00Z'),
  actual_delivery_time: null,
  created_at: new Date('2026-01-31T17:00:00Z'),
  updated_at: new Date('2026-01-31T17:00:00Z'),
};

export const acceptedOrder = {
  ...validOrder,
  id: 'order-uuid-2',
  status: 'accepted',
  driver_id: 'driver-uuid-1',
  updated_at: new Date('2026-01-31T17:05:00Z'),
};

export const preparingOrder = {
  ...validOrder,
  id: 'order-uuid-3',
  status: 'preparing',
  driver_id: 'driver-uuid-1',
  updated_at: new Date('2026-01-31T17:10:00Z'),
};

export const readyForPickupOrder = {
  ...validOrder,
  id: 'order-uuid-4',
  status: 'ready',
  driver_id: 'driver-uuid-1',
  updated_at: new Date('2026-01-31T17:20:00Z'),
};

export const pickedUpOrder = {
  ...validOrder,
  id: 'order-uuid-5',
  status: 'picked_up',
  driver_id: 'driver-uuid-1',
  actual_pickup_time: new Date('2026-01-31T18:30:00Z'),
  updated_at: new Date('2026-01-31T18:30:00Z'),
};

export const deliveredOrder = {
  ...validOrder,
  id: 'order-uuid-6',
  status: 'delivered',
  driver_id: 'driver-uuid-1',
  actual_pickup_time: new Date('2026-01-31T18:30:00Z'),
  actual_delivery_time: new Date('2026-01-31T19:00:00Z'),
  updated_at: new Date('2026-01-31T19:00:00Z'),
};

export const completedOrder = {
  ...validOrder,
  id: 'order-uuid-7',
  status: 'completed',
  driver_id: 'driver-uuid-1',
  actual_pickup_time: new Date('2026-01-31T18:30:00Z'),
  actual_delivery_time: new Date('2026-01-31T19:00:00Z'),
  updated_at: new Date('2026-01-31T19:05:00Z'),
};

export const cancelledOrder = {
  ...validOrder,
  id: 'order-uuid-8',
  status: 'cancelled',
  updated_at: new Date('2026-01-31T17:05:00Z'),
};

export const refundedOrder = {
  ...validOrder,
  id: 'order-uuid-9',
  status: 'refunded',
  updated_at: new Date('2026-01-31T17:10:00Z'),
};

export const validCreateOrderDto = {
  chefId: 'chef-uuid-1',
  pickupAddress: '123 Chef St, City, State 12345',
  pickupLatitude: 37.7749,
  pickupLongitude: -122.4194,
  deliveryAddress: '456 Customer Ave, City, State 12345',
  deliveryLatitude: 37.7849,
  deliveryLongitude: -122.4094,
  deliveryNotes: 'Leave at door',
  items: [
    {
      menuItemId: 'menu-item-uuid-1',
      quantity: 2,
      specialInstructions: 'Extra spicy',
    },
  ],
  paymentMethodId: 'pm_test123',
};

export const validUpdateOrderStatusDto = {
  status: 'accepted',
};

/**
 * Order status transition test cases
 * Valid transitions for state machine validation
 */
export const validOrderStatusTransitions = [
  { from: 'pending', to: 'accepted' },
  { from: 'pending', to: 'cancelled' },
  { from: 'accepted', to: 'preparing' },
  { from: 'accepted', to: 'cancelled' },
  { from: 'preparing', to: 'ready' },
  { from: 'ready', to: 'picked_up' },
  { from: 'picked_up', to: 'delivered' },
  { from: 'delivered', to: 'completed' },
  { from: 'cancelled', to: 'refunded' },
];

/**
 * Invalid order status transitions
 * For testing state machine validation
 */
export const invalidOrderStatusTransitions = [
  { from: 'pending', to: 'preparing' }, // Must be accepted first
  { from: 'pending', to: 'ready' },
  { from: 'pending', to: 'picked_up' },
  { from: 'pending', to: 'delivered' },
  { from: 'pending', to: 'completed' },
  { from: 'accepted', to: 'picked_up' }, // Must go through preparing and ready
  { from: 'preparing', to: 'picked_up' }, // Must be ready first
  { from: 'ready', to: 'completed' }, // Must be delivered first
  { from: 'delivered', to: 'pending' }, // Cannot go backwards
  { from: 'completed', to: 'pending' }, // Cannot reopen completed orders
  { from: 'cancelled', to: 'accepted' }, // Cannot reopen cancelled orders
];

/**
 * Commission calculation test cases
 */
export const commissionTestCases = [
  { subtotal: 1000, rate: 10, expected: 100 }, // $10 order, 10% = $1
  { subtotal: 2500, rate: 15, expected: 375 }, // $25 order, 15% = $3.75
  { subtotal: 5000, rate: 20, expected: 1000 }, // $50 order, 20% = $10
  { subtotal: 10000, rate: 12.5, expected: 1250 }, // $100 order, 12.5% = $12.50
];
