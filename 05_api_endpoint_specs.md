# API Endpoint Specifications

> **Status:** ✅ COMPLETE — NestJS API fully implemented with 42 REST endpoints + WebSocket gateway.

**Base URL:** `http://localhost:9001`  
**Last Updated:** 2026-01-31  
**API Version:** v1

---

## Table of Contents

1. [Authentication](#authentication) (7 endpoints)
2. [Users](#users) (3 endpoints)
3. [Chefs](#chefs) (21 endpoints)
4. [Orders](#orders) (12 endpoints)
5. [Drivers](#drivers) (7 endpoints)
6. [Dispatch](#dispatch) (4 endpoints)
7. [Admin](#admin) (2 endpoints)
8. [WebSocket](#websocket) (Real-time events)

**Total:** 42 REST endpoints + 1 WebSocket gateway

---

## Authentication

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+15555551234",
  "role": "customer"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### POST /auth/login
Authenticate and receive JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

---

### POST /auth/refresh
Refresh access token using refresh token.

**Headers:** `Authorization: Bearer {refreshToken}`

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc..."
}
```

---

### POST /auth/logout
Invalidate refresh token.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/verify-email
Verify email address with token.

**Request:**
```json
{
  "token": "verification-token"
}
```

**Response:** `200 OK`

---

### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

---

### POST /auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset-token",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`

---

## Users

### GET /users/me
Get current user profile.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+15555551234",
  "role": "customer",
  "createdAt": "2026-01-31T00:00:00Z"
}
```

---

### PATCH /users/me
Update user profile.

**Headers:** `Authorization: Bearer {accessToken}`

**Request:**
```json
{
  "firstName": "Jane",
  "phoneNumber": "+15555559999"
}
```

**Response:** `200 OK`

---

### DELETE /users/me
Delete user account.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:** `200 OK`

---

## Chefs

### POST /chefs
Apply to become a chef.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** customer (upgrades to chef)

**Request:**
```json
{
  "businessName": "Chef John's Kitchen",
  "cuisineTypes": ["italian", "mexican"],
  "businessAddress": "123 Main St, Austin, TX",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "businessPhone": "+15555551234",
  "description": "Authentic home-cooked Italian and Mexican cuisine"
}
```

**Response:** `201 Created`
```json
{
  "id": "chef-uuid",
  "userId": "user-uuid",
  "businessName": "Chef John's Kitchen",
  "verificationStatus": "pending"
}
```

---

### GET /chefs/search
Search for chefs near a location.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Search radius in km (default: 10)
- `cuisineType` (optional): Filter by cuisine
- `minRating` (optional): Minimum average rating

**Example:** `GET /chefs/search?lat=30.2672&lng=-97.7431&radius=15&cuisineType=italian`

**Response:** `200 OK`
```json
{
  "chefs": [
    {
      "id": "uuid",
      "businessName": "Chef John's Kitchen",
      "cuisineTypes": ["italian", "mexican"],
      "averageRating": 4.8,
      "totalReviews": 127,
      "distanceKm": 2.3,
      "businessAddress": "123 Main St",
      "isAvailable": true
    }
  ],
  "total": 1
}
```

---

### GET /chefs/:id
Get chef profile details.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "businessName": "Chef John's Kitchen",
  "cuisineTypes": ["italian", "mexican"],
  "businessAddress": "123 Main St",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "description": "Authentic home-cooked cuisine",
  "averageRating": 4.8,
  "totalReviews": 127,
  "minimumOrder": 1500,
  "deliveryRadius": 10,
  "operatingHours": {
    "monday": { "open": "09:00", "close": "21:00" },
    "tuesday": { "open": "09:00", "close": "21:00" }
  },
  "isAvailable": true
}
```

---

### PATCH /chefs/:id
Update chef profile.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef (own profile only)

**Request:**
```json
{
  "description": "Updated description",
  "minimumOrder": 2000,
  "deliveryRadius": 15
}
```

**Response:** `200 OK`

---

### POST /chefs/:id/stripe/onboard
Start Stripe Connect onboarding.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Response:** `200 OK`
```json
{
  "url": "https://connect.stripe.com/setup/..."
}
```

---

### GET /chefs/:id/stripe/status
Check Stripe Connect onboarding status.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Response:** `200 OK`
```json
{
  "isOnboarded": true,
  "stripeAccountId": "acct_...",
  "chargesEnabled": true,
  "payoutsEnabled": true
}
```

---

### POST /chefs/:id/stripe/dashboard-link
Get Stripe Express dashboard link.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Response:** `200 OK`
```json
{
  "url": "https://connect.stripe.com/express/..."
}
```

---

### GET /chefs/:id/menus
Get all menus for a chef.

**Response:** `200 OK`
```json
{
  "menus": [
    {
      "id": "menu-uuid",
      "name": "Dinner Menu",
      "description": "Weekday dinner specials",
      "isActive": true
    }
  ]
}
```

---

### POST /chefs/:chefId/menus
Create a new menu.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Request:**
```json
{
  "name": "Dinner Menu",
  "description": "Weekday dinner specials",
  "isActive": true
}
```

**Response:** `201 Created`

---

### GET /chefs/:chefId/menus/:menuId
Get menu details with items.

**Response:** `200 OK`
```json
{
  "id": "menu-uuid",
  "name": "Dinner Menu",
  "items": [
    {
      "id": "item-uuid",
      "name": "Spaghetti Carbonara",
      "description": "Classic Italian pasta",
      "price": 1599,
      "category": "pasta",
      "isAvailable": true,
      "prepTimeMinutes": 25
    }
  ]
}
```

---

### PATCH /chefs/:chefId/menus/:menuId
Update menu details.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Request:**
```json
{
  "name": "Updated Menu Name",
  "isActive": false
}
```

**Response:** `200 OK`

---

### DELETE /chefs/:chefId/menus/:menuId
Delete a menu.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Response:** `200 OK`

---

### POST /chefs/:chefId/menus/:menuId/items
Create a menu item.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Request:**
```json
{
  "name": "Spaghetti Carbonara",
  "description": "Classic Italian pasta with pancetta and egg",
  "price": 1599,
  "category": "pasta",
  "prepTimeMinutes": 25,
  "isAvailable": true
}
```

**Response:** `201 Created`

---

### PATCH /chefs/:chefId/menus/:menuId/items/:itemId
Update menu item.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Request:**
```json
{
  "price": 1799,
  "isAvailable": false
}
```

**Response:** `200 OK`

---

### DELETE /chefs/:chefId/menus/:menuId/items/:itemId
Delete menu item.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Response:** `200 OK`

---

### GET /chefs/:id/reviews
Get reviews for a chef.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Amazing food!",
      "customerName": "Jane D.",
      "createdAt": "2026-01-30T00:00:00Z"
    }
  ],
  "total": 127,
  "page": 1,
  "totalPages": 7
}
```

---

### GET /chefs/:id/stats
Get chef statistics.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef (own stats only)

**Response:** `200 OK`
```json
{
  "totalOrders": 453,
  "totalEarnings": 38475,
  "averageRating": 4.8,
  "totalReviews": 127,
  "pendingPayouts": 2340
}
```

---

### PATCH /chefs/:id/availability
Toggle chef availability.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Request:**
```json
{
  "isAvailable": false
}
```

**Response:** `200 OK`

---

### PATCH /chefs/:id/operating-hours
Update operating hours.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Request:**
```json
{
  "monday": { "open": "10:00", "close": "22:00" },
  "tuesday": { "open": "10:00", "close": "22:00" },
  "wednesday": null
}
```

**Response:** `200 OK`

---

### POST /chefs/:id/promo-codes
Create promo code.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Request:**
```json
{
  "code": "SAVE20",
  "discountPercent": 20,
  "validFrom": "2026-02-01T00:00:00Z",
  "validUntil": "2026-02-28T23:59:59Z"
}
```

**Response:** `201 Created`

---

### POST /chefs/:id/documents
Upload verification documents.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef  
**Content-Type:** `multipart/form-data`

**Request:** FormData with file upload

**Response:** `201 Created`

---

## Orders

### POST /orders
Create a new order.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** customer

**Request:**
```json
{
  "chefId": "chef-uuid",
  "deliveryAddress": "456 Customer St, Austin, TX",
  "deliveryLatitude": 30.2750,
  "deliveryLongitude": -97.7500,
  "items": [
    {
      "menuItemId": "item-uuid",
      "quantity": 2,
      "notes": "Extra spicy please"
    }
  ],
  "deliveryInstructions": "Ring doorbell"
}
```

**Response:** `201 Created`
```json
{
  "id": "order-uuid",
  "orderNumber": "RND-20260131-0001",
  "status": "pending",
  "subtotalCents": 3198,
  "taxCents": 256,
  "deliveryFeeCents": 500,
  "platformFeeCents": 480,
  "totalCents": 3954,
  "chefEarningsCents": 2718
}
```

---

### GET /orders/:id
Get order details.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** customer (own orders), chef (their orders), driver (assigned), admin

**Response:** `200 OK`
```json
{
  "id": "order-uuid",
  "orderNumber": "RND-20260131-0001",
  "status": "in_transit",
  "customer": {
    "name": "John Doe",
    "phone": "+15555551234"
  },
  "chef": {
    "businessName": "Chef John's Kitchen",
    "address": "123 Main St"
  },
  "items": [
    {
      "name": "Spaghetti Carbonara",
      "quantity": 2,
      "priceAtOrderCents": 1599,
      "notes": "Extra spicy please"
    }
  ],
  "deliveryAddress": "456 Customer St",
  "subtotalCents": 3198,
  "totalCents": 3954,
  "createdAt": "2026-01-31T10:00:00Z",
  "estimatedDeliveryTime": "2026-01-31T11:15:00Z"
}
```

---

### GET /orders
List orders with filters.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `status`: Filter by status (pending, accepted, delivered, etc.)
- `chefId`: Filter by chef
- `customerId`: Filter by customer
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "orders": [...],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

---

### POST /orders/:id/create-payment-intent
Create Stripe PaymentIntent for order.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** customer (own order only)

**Response:** `200 OK`
```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_...",
  "amountCents": 3954
}
```

---

### PATCH /orders/:id/accept
Chef accepts the order.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Response:** `200 OK`
```json
{
  "id": "order-uuid",
  "orderNumber": "RND-20260131-0001",
  "status": "accepted",
  "message": "Order accepted successfully"
}
```

---

### PATCH /orders/:id/reject
Chef rejects the order.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Request:**
```json
{
  "rejectionReason": "Out of ingredients"
}
```

**Response:** `200 OK`

---

### PATCH /orders/:id/ready
Mark order ready for pickup.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** chef

**Response:** `200 OK`
```json
{
  "status": "ready_for_pickup"
}
```

---

### PATCH /orders/:id/pickup
Driver picks up order from chef.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Response:** `200 OK`
```json
{
  "status": "picked_up"
}
```

---

### PATCH /orders/:id/in-transit
Mark order in transit.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Response:** `200 OK`

---

### PATCH /orders/:id/deliver
Mark order delivered.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Response:** `200 OK`
```json
{
  "status": "delivered",
  "driverEarnings": 500
}
```

---

### PATCH /orders/:id/cancel
Cancel order.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** customer, chef

**Request:**
```json
{
  "cancellationReason": "Customer changed mind"
}
```

**Response:** `200 OK`
```json
{
  "status": "cancelled",
  "refundInitiated": true
}
```

---

### POST /orders/:id/refund
Process refund for order.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** admin, chef

**Request:**
```json
{
  "amountCents": 3954,
  "reason": "Customer complaint"
}
```

**Response:** `200 OK`

---

### GET /orders/:id/tracking
Get comprehensive order tracking data.

**Response:** `200 OK`
```json
{
  "orderId": "uuid",
  "orderNumber": "RND-20260131-0001",
  "status": "in_transit",
  "customer": {...},
  "chef": {...},
  "driver": {
    "name": "Driver Jane",
    "phone": "+15555559999",
    "latitude": 30.2700,
    "longitude": -97.7450,
    "lastLocationUpdate": "2026-01-31T10:45:00Z"
  },
  "estimatedDeliveryTime": "2026-01-31T11:15:00Z",
  "etaMinutes": 12,
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "2026-01-31T10:00:00Z"
    },
    {
      "status": "payment_confirmed",
      "timestamp": "2026-01-31T10:01:00Z"
    }
  ]
}
```

---

## Drivers

### POST /drivers/register
Register as a driver.

**Request:**
```json
{
  "email": "driver@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Driver",
  "phoneNumber": "+15555559999",
  "vehicleType": "car",
  "vehicleMake": "Toyota",
  "vehicleModel": "Camry",
  "vehicleYear": 2020,
  "licensePlate": "ABC1234"
}
```

**Response:** `201 Created`

---

### GET /drivers/profile
Get driver profile.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Response:** `200 OK`
```json
{
  "id": "driver-uuid",
  "vehicleType": "car",
  "vehicleMake": "Toyota",
  "vehicleModel": "Camry",
  "isAvailable": true,
  "verificationStatus": "approved",
  "averageRating": 4.9,
  "totalDeliveries": 234
}
```

---

### PATCH /drivers/profile
Update driver profile.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Request:**
```json
{
  "vehicleMake": "Honda",
  "vehicleModel": "Civic"
}
```

**Response:** `200 OK`

---

### PATCH /drivers/availability
Go online/offline.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Request:**
```json
{
  "isAvailable": true
}
```

**Response:** `200 OK`

---

### POST /drivers/location
Update GPS location.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Request:**
```json
{
  "latitude": 30.2672,
  "longitude": -97.7431,
  "accuracy": 10.5,
  "speed": 8.3,
  "heading": 45
}
```

**Response:** `200 OK`

---

### GET /drivers/stats
Get driver statistics and earnings.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Response:** `200 OK`
```json
{
  "totalDeliveries": 234,
  "successfulDeliveries": 230,
  "totalEarnings": 11700,
  "pendingPayouts": 850,
  "averageRating": 4.9
}
```

---

### GET /drivers/location/history
Get location history.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Query Parameters:**
- `limit`: Number of records (default: 50)

**Response:** `200 OK`
```json
{
  "locations": [
    {
      "latitude": 30.2672,
      "longitude": -97.7431,
      "timestamp": "2026-01-31T10:45:00Z"
    }
  ]
}
```

---

## Dispatch

### POST /dispatch/assign
Assign driver to order.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** admin, chef

**Request:**
```json
{
  "orderId": "order-uuid",
  "searchRadiusKm": 15
}
```

**Response:** `200 OK`
```json
{
  "assignmentId": "assignment-uuid",
  "driverId": "driver-uuid",
  "driverName": "Jane Driver",
  "distanceKm": 2.3,
  "estimatedPickupTimeMinutes": 7
}
```

---

### GET /dispatch/available-drivers
Find available drivers near location.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** admin

**Query Parameters:**
- `latitude`: Chef location latitude
- `longitude`: Chef location longitude
- `radiusKm`: Search radius (default: 10)

**Response:** `200 OK`
```json
{
  "drivers": [
    {
      "id": "driver-uuid",
      "name": "Jane Driver",
      "distanceKm": 2.3,
      "averageRating": 4.9,
      "currentLatitude": 30.2650,
      "currentLongitude": -97.7400
    }
  ]
}
```

---

### POST /dispatch/accept
Driver accepts assignment.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Request:**
```json
{
  "assignmentId": "assignment-uuid"
}
```

**Response:** `200 OK`

---

### POST /dispatch/decline
Driver declines assignment.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** driver

**Request:**
```json
{
  "assignmentId": "assignment-uuid",
  "reason": "Too far away"
}
```

**Response:** `200 OK`

---

## Admin

### PATCH /admin/chefs/:id/verify
Verify chef account.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** admin

**Request:**
```json
{
  "verificationStatus": "approved",
  "notes": "All documents verified"
}
```

**Response:** `200 OK`

---

### GET /admin/actions
Get admin action audit log.

**Headers:** `Authorization: Bearer {accessToken}`  
**Roles:** admin

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `actionType`: Filter by action type

**Response:** `200 OK`
```json
{
  "actions": [
    {
      "id": "uuid",
      "adminId": "admin-uuid",
      "actionType": "chef_verification",
      "targetType": "chef",
      "targetId": "chef-uuid",
      "details": {...},
      "createdAt": "2026-01-31T10:00:00Z"
    }
  ]
}
```

---

## WebSocket

### Connection
**Namespace:** `/realtime`  
**URL:** `ws://localhost:9001/realtime`

**Authentication:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:9001/realtime', {
  auth: {
    token: 'your-jwt-access-token'
  }
});
```

### Events (Client → Server)

#### subscribe:order
Subscribe to order updates.
```javascript
socket.emit('subscribe:order', { orderId: 'order-uuid' });
```

#### unsubscribe:order
Unsubscribe from order updates.
```javascript
socket.emit('unsubscribe:order', { orderId: 'order-uuid' });
```

#### driver:location
Send driver GPS location.
```javascript
socket.emit('driver:location', {
  latitude: 30.2672,
  longitude: -97.7431,
  orderId: 'order-uuid'
});
```

### Events (Server → Client)

#### connected
Connection confirmation.
```javascript
socket.on('connected', (data) => {
  console.log('Connected:', data.userId, data.role);
});
```

#### order:status_update
Order status changed.
```javascript
socket.on('order:status_update', (data) => {
  // { orderId, status, timestamp }
});
```

#### driver:location_update
Driver position update.
```javascript
socket.on('driver:location_update', (data) => {
  // { orderId, driverId, latitude, longitude, timestamp }
});
```

#### order:new
New order notification (chef only).
```javascript
socket.on('order:new', (data) => {
  // { orderId, orderNumber, customerName, items }
});
```

#### driver:new_assignment
Assignment notification (driver only).
```javascript
socket.on('driver:new_assignment', (data) => {
  // { assignmentId, orderId, chefAddress, estimatedPickupTime }
});
```

#### order:eta_update
ETA recalculation.
```javascript
socket.on('order:eta_update', (data) => {
  // { orderId, etaMinutes, estimatedDeliveryTime }
});
```

---

## Error Responses

All endpoints follow consistent error format:

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Rate Limiting

**Global Limit:** 100 requests per 15 minutes per IP  
**Headers:**
- `X-RateLimit-Limit`: Total allowed requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

**429 Response:**
```json
{
  "statusCode": 429,
  "message": "Too Many Requests"
}
```

---

## Pagination

Paginated endpoints return:
```json
{
  "data": [...],
  "total": 127,
  "page": 1,
  "limit": 20,
  "totalPages": 7
}
```

---

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

**Documentation Generated:** 2026-01-31  
**API Status:** ✅ Production-ready  
**Source:** `services/api/src/`
