/**
 * Driver test fixtures
 * Provides consistent test data for driver-related tests
 */

export const validDriver = {
  id: 'driver-profile-uuid-1',
  user_id: 'driver-uuid-1',
  vehicle_type: 'car',
  vehicle_make: 'Toyota',
  vehicle_model: 'Camry',
  vehicle_year: 2022,
  vehicle_color: 'Silver',
  license_plate: 'ABC1234',
  driver_license_number: 'DL1234567',
  insurance_policy_number: 'INS9876543',
  rating: 4.9,
  total_deliveries: 200,
  is_available: true,
  is_verified: true,
  current_latitude: 37.7749,
  current_longitude: -122.4194,
  last_location_update: new Date('2026-01-31T17:00:00Z'),
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-31T17:00:00Z'),
};

export const unavailableDriver = {
  ...validDriver,
  id: 'driver-profile-uuid-2',
  user_id: 'driver-uuid-2',
  license_plate: 'XYZ5678',
  is_available: false,
  rating: 4.7,
  total_deliveries: 150,
};

export const unverifiedDriver = {
  ...validDriver,
  id: 'driver-profile-uuid-3',
  user_id: 'driver-uuid-3',
  license_plate: 'DEF9012',
  is_verified: false,
  rating: 0,
  total_deliveries: 0,
};

export const onDeliveryDriver = {
  ...validDriver,
  id: 'driver-profile-uuid-4',
  user_id: 'driver-uuid-4',
  license_plate: 'GHI3456',
  is_available: false,
  current_latitude: 37.7849,
  current_longitude: -122.4094,
};

export const validCreateDriverProfileDto = {
  vehicleType: 'car',
  vehicleMake: 'Honda',
  vehicleModel: 'Civic',
  vehicleYear: 2023,
  vehicleColor: 'Blue',
  licensePlate: 'JKL7890',
  driverLicenseNumber: 'DL7654321',
  insurancePolicyNumber: 'INS1234567',
};

export const validUpdateDriverProfileDto = {
  vehicleColor: 'Red',
  isAvailable: false,
};

export const validUpdateDriverLocationDto = {
  latitude: 37.7849,
  longitude: -122.4094,
};

/**
 * Vehicle types for validation
 */
export const validVehicleTypes = [
  'car',
  'motorcycle',
  'bicycle',
  'scooter',
];

/**
 * Driver availability statuses
 */
export const driverStatuses = {
  available: {
    is_available: true,
    current_order_id: null,
  },
  busy: {
    is_available: false,
    current_order_id: 'order-uuid-1',
  },
  offline: {
    is_available: false,
    current_order_id: null,
  },
};

/**
 * Driver location update frequency tests
 */
export const locationUpdateScenarios = [
  {
    description: 'Recent update (within 5 minutes)',
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    isStale: false,
  },
  {
    description: 'Stale update (over 5 minutes)',
    lastUpdate: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    isStale: true,
  },
  {
    description: 'Very stale update (over 30 minutes)',
    lastUpdate: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
    isStale: true,
  },
];

/**
 * Driver search filters for dispatch testing
 */
export const validDriverSearchFilters = {
  latitude: 37.7749,
  longitude: -122.4194,
  maxDistanceKm: 5,
  isAvailable: true,
  minRating: 4.5,
};

/**
 * Driver earnings test data
 */
export const driverEarningsScenarios = [
  {
    deliveryFee: 500, // $5.00
    driverPayout: 450, // $4.50 (90% of delivery fee)
    platformFee: 50, // $0.50 (10% platform cut)
  },
  {
    deliveryFee: 800, // $8.00
    driverPayout: 720, // $7.20 (90%)
    platformFee: 80, // $0.80 (10%)
  },
  {
    deliveryFee: 1200, // $12.00
    driverPayout: 1080, // $10.80 (90%)
    platformFee: 120, // $1.20 (10%)
  },
];

/**
 * Driver performance metrics for testing
 */
export const driverPerformanceMetrics = {
  excellent: {
    rating: 4.9,
    total_deliveries: 500,
    on_time_percentage: 98,
    acceptance_rate: 95,
  },
  good: {
    rating: 4.5,
    total_deliveries: 200,
    on_time_percentage: 90,
    acceptance_rate: 85,
  },
  average: {
    rating: 4.0,
    total_deliveries: 100,
    on_time_percentage: 80,
    acceptance_rate: 75,
  },
  poor: {
    rating: 3.5,
    total_deliveries: 50,
    on_time_percentage: 70,
    acceptance_rate: 60,
  },
};
