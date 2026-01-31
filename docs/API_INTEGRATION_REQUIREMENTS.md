# API Integration Requirements for Frontend Applications

**Document Version:** 1.0
**Date:** 2026-01-31
**For:** Agent 1 (Backend Developer)
**From:** Agent 2 (Frontend Developer)

## Overview

This document specifies the API endpoints, request/response formats, and integration requirements for all frontend applications in the RideNDine platform.

## Base Configuration

### API Endpoints

- **Core Demo Server:** `http://localhost:8081/api`
- **NestJS API Service:** `http://localhost:9001/api/v2` (or `/api` without version)
- **WebSocket Gateway:** `ws://localhost:9001` or `ws://localhost:8081`

### Port Reference

| Service | Port | Status |
|---------|------|--------|
| Core Demo | 8081 | Working (single-server demo) |
| NestJS API | 9001 | In Progress (microservices) |
| Dispatch | 9002 | Scaffolded |
| Routing | 9003 | Scaffolded |
| Realtime | 9004 | Scaffolded |

## Authentication

### JWT Authentication Flow

```typescript
// Login Request
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

// Login Response
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer" | "chef" | "driver" | "admin" | "super_admin",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "isVerified": true,
    "createdAt": "2026-01-31T00:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Token Refresh

```typescript
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

### Registration

```typescript
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "customer" | "chef" | "driver"
}

// Response
{
  "message": "Registration successful. Please verify your email.",
  "userId": "uuid"
}
```

### Authorization Header

All authenticated requests must include:

```
Authorization: Bearer <accessToken>
```

### Error Handling

```typescript
// 401 Unauthorized (token expired or invalid)
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Token expired"
}

// 403 Forbidden (insufficient permissions)
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Insufficient permissions"
}
```

## User Management

### Get Current User Profile

```typescript
GET /users/me
Authorization: Bearer <token>

// Response
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "customer",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "profileImageUrl": "https://...",
  "addresses": [
    {
      "id": "uuid",
      "street": "123 Main St",
      "city": "Hamilton",
      "state": "ON",
      "zipCode": "L8P 1A1",
      "lat": 43.2607,
      "lng": -79.8711,
      "isDefault": true
    }
  ],
  "createdAt": "2026-01-31T00:00:00Z"
}
```

### Update User Profile

```typescript
PATCH /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "profileImageUrl": "https://..."
}

// Response: Updated user object
```

## Chef Endpoints

### Search Chefs

```typescript
GET /chefs/search?lat=43.2607&lng=-79.8711&radius=15&cuisineType=Italian&minRating=4.0&sortBy=distance
Authorization: Bearer <token>

// Response
[
  {
    "id": "uuid",
    "businessName": "Chef Mario's Kitchen",
    "cuisineTypes": ["Italian", "Mediterranean"],
    "profileImageUrl": "https://...",
    "rating": 4.8,
    "reviewCount": 127,
    "averagePrepTime": 30,
    "minimumOrder": 2000,
    "deliveryRadius": 15,
    "distance": 2.4,
    "isAvailable": true,
    "nextAvailableTime": "2026-01-31T12:00:00Z"
  }
]
```

### Get Chef Details

```typescript
GET /chefs/:id
Authorization: Bearer <token>

// Response
{
  "id": "uuid",
  "businessName": "Chef Mario's Kitchen",
  "cuisineTypes": ["Italian", "Mediterranean"],
  "description": "Authentic Italian cuisine...",
  "profileImageUrl": "https://...",
  "bannerImageUrl": "https://...",
  "rating": 4.8,
  "reviewCount": 127,
  "averagePrepTime": 30,
  "minimumOrder": 2000,
  "deliveryRadius": 15,
  "location": {
    "street": "456 Chef Ave",
    "city": "Hamilton",
    "state": "ON",
    "lat": 43.2607,
    "lng": -79.8711
  },
  "isAvailable": true,
  "operatingHours": [
    { "day": "monday", "open": "11:00", "close": "21:00" }
  ]
}
```

### Get Chef Menus

```typescript
GET /chefs/:id/menus
Authorization: Bearer <token>

// Response
[
  {
    "id": "uuid",
    "name": "Pasta Carbonara",
    "description": "Classic Roman pasta dish...",
    "price": 1850,
    "imageUrl": "https://...",
    "category": "Pasta",
    "isAvailable": true,
    "prepTime": 25,
    "ingredients": ["pasta", "eggs", "bacon", "cheese"],
    "allergens": ["gluten", "dairy", "eggs"],
    "spicyLevel": 0
  }
]
```

### Get Chef Reviews

```typescript
GET /chefs/:id/reviews?page=1&limit=10
Authorization: Bearer <token>

// Response
{
  "data": [
    {
      "id": "uuid",
      "customerName": "John D.",
      "customerAvatar": "https://...",
      "rating": 5,
      "comment": "Amazing food! Will order again.",
      "createdAt": "2026-01-30T18:30:00Z",
      "orderId": "uuid"
    }
  ],
  "total": 127,
  "page": 1,
  "totalPages": 13
}
```

## Order Management

### Create Order

```typescript
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "chefId": "uuid",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2,
      "specialInstructions": "No onions please"
    }
  ],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Hamilton",
    "state": "ON",
    "zipCode": "L8P 1A1",
    "lat": 43.2607,
    "lng": -79.8711,
    "instructions": "Ring doorbell"
  },
  "tip": 500,
  "specialInstructions": "Call when you arrive",
  "scheduledFor": null // or ISO timestamp for future orders
}

// Response
{
  "id": "uuid",
  "orderNumber": "RN-2026-001234",
  "status": "pending",
  "subtotal": 3700,
  "deliveryFee": 599,
  "serviceFee": 199,
  "tip": 500,
  "tax": 481,
  "total": 5479,
  "estimatedPrepTime": 30,
  "estimatedDeliveryTime": 50,
  "createdAt": "2026-01-31T12:00:00Z"
}
```

### Get Order Details

```typescript
GET /orders/:id
Authorization: Bearer <token>

// Response
{
  "id": "uuid",
  "orderNumber": "RN-2026-001234",
  "status": "pending" | "accepted" | "preparing" | "ready" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled",
  "customer": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  },
  "chef": {
    "id": "uuid",
    "businessName": "Chef Mario's Kitchen",
    "profileImageUrl": "https://...",
    "phone": "+1234567890"
  },
  "driver": {
    "id": "uuid",
    "firstName": "Mike",
    "lastName": "Driver",
    "phone": "+1234567890",
    "vehicleInfo": "Blue Honda Civic - ABC123",
    "currentLocation": { "lat": 43.2607, "lng": -79.8711 }
  },
  "items": [
    {
      "id": "uuid",
      "menuItem": {
        "id": "uuid",
        "name": "Pasta Carbonara",
        "imageUrl": "https://..."
      },
      "quantity": 2,
      "price": 1850,
      "specialInstructions": "No onions"
    }
  ],
  "pickupAddress": {
    "street": "456 Chef Ave",
    "city": "Hamilton",
    "lat": 43.2607,
    "lng": -79.8711
  },
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Hamilton",
    "lat": 43.2607,
    "lng": -79.8711,
    "instructions": "Ring doorbell"
  },
  "subtotal": 3700,
  "deliveryFee": 599,
  "serviceFee": 199,
  "tip": 500,
  "tax": 481,
  "total": 5479,
  "paymentStatus": "paid" | "pending" | "failed",
  "paymentMethod": "card_****1234",
  "timeline": [
    {
      "status": "pending",
      "timestamp": "2026-01-31T12:00:00Z"
    },
    {
      "status": "accepted",
      "timestamp": "2026-01-31T12:02:00Z"
    }
  ],
  "estimatedDeliveryTime": "2026-01-31T12:50:00Z",
  "actualDeliveryTime": null,
  "createdAt": "2026-01-31T12:00:00Z"
}
```

### Get User Orders

```typescript
GET /orders?status=active&page=1&limit=10
Authorization: Bearer <token>

// Response
{
  "data": [
    // Array of order objects (same structure as Get Order Details)
  ],
  "total": 45,
  "page": 1,
  "totalPages": 5
}
```

### Cancel Order

```typescript
PATCH /orders/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Changed my mind"
}

// Response
{
  "message": "Order cancelled successfully",
  "refundAmount": 5479,
  "refundStatus": "pending"
}
```

### Get Order ETA

```typescript
GET /orders/:id/eta
Authorization: Bearer <token>

// Response
{
  "etaSeconds": 1800,
  "etaMinutes": 30,
  "estimatedDeliveryTime": "2026-01-31T12:30:00Z",
  "driverLocation": {
    "lat": 43.2607,
    "lng": -79.8711
  },
  "distanceRemaining": 2.4 // miles
}
```

## Payment Integration (Stripe)

### Create Payment Intent

```typescript
POST /orders/:id/create-payment-intent
Authorization: Bearer <token>

// Response
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 5479,
  "currency": "usd"
}
```

### Get Ephemeral Key (for Stripe Mobile SDK)

```typescript
POST /payments/ephemeral-key
Authorization: Bearer <token>

// Response
{
  "ephemeralKey": "ek_test_xxx",
  "customerId": "cus_xxx"
}
```

## Reviews

### Create Review

```typescript
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "uuid",
  "chefRating": 5,
  "chefComment": "Amazing food! Will order again.",
  "driverRating": 4,
  "driverComment": "Fast delivery but missed special instructions."
}

// Response
{
  "id": "uuid",
  "message": "Review submitted successfully"
}
```

## Driver-Specific Endpoints

### Get Available Orders (Driver)

```typescript
GET /drivers/available-orders
Authorization: Bearer <driver_token>

// Response
[
  {
    "id": "uuid",
    "orderNumber": "RN-2026-001234",
    "chefBusinessName": "Chef Mario's Kitchen",
    "pickupAddress": "456 Chef Ave, Hamilton",
    "deliveryAddress": "123 Main St, Hamilton",
    "pickupLat": 43.2607,
    "pickupLng": -79.8711,
    "deliveryLat": 43.2607,
    "deliveryLng": -79.8711,
    "estimatedDistance": 2.4,
    "estimatedDuration": 15,
    "deliveryFee": 599,
    "tip": 500,
    "itemCount": 2,
    "createdAt": "2026-01-31T12:00:00Z"
  }
]
```

### Accept Delivery

```typescript
POST /drivers/orders/:id/accept
Authorization: Bearer <driver_token>

// Response
{
  // Full order object with driver assigned
}
```

### Update Driver Location

```typescript
POST /drivers/me/location
Authorization: Bearer <driver_token>
Content-Type: application/json

{
  "lat": 43.2607,
  "lng": -79.8711,
  "heading": 45 // optional, compass heading in degrees
}

// Response: 204 No Content
```

### Mark Order Picked Up

```typescript
PATCH /drivers/orders/:id/picked-up
Authorization: Bearer <driver_token>

// Response
{
  "message": "Order marked as picked up",
  "order": {
    // Updated order object
  }
}
```

### Mark Order Delivered

```typescript
PATCH /drivers/orders/:id/delivered
Authorization: Bearer <driver_token>
Content-Type: application/json

{
  "photoUrl": "https://..." // optional proof of delivery
}

// Response
{
  "message": "Delivery completed",
  "earnings": 1099 // deliveryFee + tip
}
```

### Get Driver Earnings

```typescript
GET /drivers/me/earnings?period=today
Authorization: Bearer <driver_token>

// Response
{
  "total": 12599,
  "deliveries": 8,
  "tips": 4000,
  "period": "today",
  "breakdown": [
    {
      "orderId": "uuid",
      "deliveryFee": 599,
      "tip": 500,
      "completedAt": "2026-01-31T12:45:00Z"
    }
  ]
}
```

## Chef-Specific Endpoints

### Get Chef Orders

```typescript
GET /chefs/me/orders?status=pending&page=1
Authorization: Bearer <chef_token>

// Response
{
  "data": [
    // Array of order objects
  ],
  "total": 15,
  "page": 1,
  "totalPages": 2
}
```

### Accept/Reject Order

```typescript
PATCH /chefs/orders/:id/accept
Authorization: Bearer <chef_token>
Content-Type: application/json

{
  "prepTime": 30 // estimated prep time in minutes
}

// Response
{
  "message": "Order accepted",
  "order": {
    // Updated order object
  }
}
```

```typescript
PATCH /chefs/orders/:id/reject
Authorization: Bearer <chef_token>
Content-Type: application/json

{
  "reason": "Too busy right now"
}

// Response
{
  "message": "Order rejected"
}
```

### Mark Order Ready

```typescript
PATCH /chefs/orders/:id/ready
Authorization: Bearer <chef_token>

// Response
{
  "message": "Order marked as ready",
  "order": {
    // Updated order object
  }
}
```

### Get/Update Menu Items

```typescript
GET /chefs/me/menu
Authorization: Bearer <chef_token>

POST /chefs/me/menu
Authorization: Bearer <chef_token>
Content-Type: application/json

{
  "name": "Pasta Carbonara",
  "description": "Classic Roman pasta dish",
  "price": 1850,
  "imageUrl": "https://...",
  "category": "Pasta",
  "prepTime": 25,
  "ingredients": ["pasta", "eggs", "bacon", "cheese"],
  "allergens": ["gluten", "dairy"],
  "isAvailable": true
}

PATCH /chefs/me/menu/:id
Authorization: Bearer <chef_token>
Content-Type: application/json

{
  "isAvailable": false
}
```

## Admin-Specific Endpoints

### Get Platform Statistics

```typescript
GET /admin/stats
Authorization: Bearer <admin_token>

// Response
{
  "totalUsers": 1250,
  "activeChefs": 45,
  "activeDrivers": 78,
  "ordersToday": 156,
  "revenueToday": 125600,
  "averageOrderValue": 5479
}
```

### Get Users List

```typescript
GET /admin/users?role=customer&page=1&limit=20
Authorization: Bearer <admin_token>

// Response
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "customer",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": true,
      "createdAt": "2026-01-31T00:00:00Z"
    }
  ],
  "total": 1250,
  "page": 1,
  "totalPages": 63
}
```

### Verify Chef/Driver

```typescript
PATCH /admin/users/:id/verify
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "verified": true,
  "notes": "Background check completed"
}

// Response
{
  "message": "User verification updated"
}
```

## WebSocket Events

### Connection

```javascript
// Client connects with JWT token
const ws = new WebSocket('ws://localhost:9001?token=<accessToken>');
```

### Server to Client Events

```typescript
// Order Status Update
{
  "event": "order:update",
  "data": {
    "orderId": "uuid",
    "status": "preparing",
    "estimatedDeliveryTime": "2026-01-31T12:50:00Z"
  }
}

// Driver Location Update
{
  "event": "driver:location",
  "data": {
    "orderId": "uuid",
    "driverId": "uuid",
    "location": {
      "lat": 43.2607,
      "lng": -79.8711,
      "heading": 45
    },
    "timestamp": "2026-01-31T12:30:00Z"
  }
}

// New Order (for drivers)
{
  "event": "order:new",
  "data": {
    // Order object
  }
}

// Order Accepted (for customers)
{
  "event": "order:accepted",
  "data": {
    "orderId": "uuid",
    "chefName": "Chef Mario",
    "estimatedPrepTime": 30
  }
}
```

### Client to Server Events

```typescript
// Subscribe to Order Updates
{
  "event": "subscribe:order",
  "orderId": "uuid"
}

// Update Driver Location (alternative to REST)
{
  "event": "driver:location:update",
  "location": {
    "lat": 43.2607,
    "lng": -79.8711,
    "heading": 45
  }
}
```

## Error Response Format

All API errors follow this consistent format:

```typescript
{
  "statusCode": 400 | 401 | 403 | 404 | 500,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": {
    // Optional additional context
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `ORDER_ALREADY_ASSIGNED` - Order already accepted by another driver
- `ORDER_CANCELLED` - Order was cancelled
- `PAYMENT_FAILED` - Payment processing failed
- `CHEF_UNAVAILABLE` - Chef is not accepting orders
- `OUT_OF_DELIVERY_RANGE` - Delivery address too far

## TypeScript Type Definitions

```typescript
// User Types
export interface User {
  id: string;
  email: string;
  role: 'customer' | 'chef' | 'driver' | 'admin' | 'super_admin';
  firstName: string;
  lastName: string;
  phone: string;
  profileImageUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

// Chef Types
export interface Chef {
  id: string;
  businessName: string;
  cuisineTypes: string[];
  description: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  rating: number;
  reviewCount: number;
  averagePrepTime: number;
  minimumOrder: number;
  deliveryRadius: number;
  location: Address;
  isAvailable: boolean;
  operatingHours: OperatingHour[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  prepTime: number;
  ingredients: string[];
  allergens: string[];
  spicyLevel: 0 | 1 | 2 | 3;
}

// Order Types
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  chef: {
    id: string;
    businessName: string;
    phone: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    vehicleInfo: string;
  };
  items: OrderItem[];
  pickupAddress: Address;
  deliveryAddress: Address;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tip: number;
  tax: number;
  total: number;
  paymentStatus: 'paid' | 'pending' | 'failed';
  timeline: StatusTimeline[];
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  instructions?: string;
}

// Review Types
export interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId: string;
}
```

## Implementation Notes

1. **Rate Limiting**: All endpoints should implement rate limiting (e.g., 100 requests/minute per user)
2. **Pagination**: Default page size is 10, max is 100
3. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
4. **Currency**: All monetary values are in cents (USD)
5. **Distance**: All distances are in miles
6. **Coordinates**: Latitude/longitude in decimal degrees
7. **File Uploads**: Use multipart/form-data for images, max 5MB per file

## Testing Endpoints

Use these test credentials for development:

```
Customer:
- Email: customer@test.com
- Password: Test123!

Chef:
- Email: chef@test.com
- Password: Test123!

Driver:
- Email: driver@test.com
- Password: Test123!

Admin:
- Email: admin@ridendine.com
- Password: Admin123!
```

## Questions for Backend Team

1. Should we use `/api` or `/api/v2` as the base path for NestJS services?
2. What is the preferred WebSocket library (Socket.io vs native WebSocket)?
3. How should file uploads be handled (direct to S3 or through API)?
4. What is the token expiration time (access token vs refresh token)?
5. Should we implement optimistic UI updates or wait for server confirmation?
6. How should real-time location updates be throttled (every X seconds or distance threshold)?

## Change Log

- **2026-01-31:** Initial API specification created
