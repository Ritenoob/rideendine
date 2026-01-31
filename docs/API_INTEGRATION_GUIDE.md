# API Integration Guide

Complete developer guide for integrating with the RideNDine API platform.

**Last Updated:** 2026-01-31
**API Version:** 1.0.0
**Status:** Production Ready

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication & Authorization](#authentication--authorization)
4. [Core API Patterns](#core-api-patterns)
5. [User Management](#user-management)
6. [Chef Discovery & Menus](#chef-discovery--menus)
7. [Order Management](#order-management)
8. [Payment Integration](#payment-integration)
9. [Driver Management](#driver-management)
10. [Real-Time Communication](#real-time-communication)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)
13. [Testing & Debugging](#testing--debugging)
14. [Code Examples by Language](#code-examples-by-language)
15. [Common Integration Patterns](#common-integration-patterns)

---

## Introduction

The RideNDine API is a RESTful API that enables you to build food delivery applications connecting customers, home chefs, and drivers. This guide provides comprehensive integration examples and best practices.

### API Characteristics

- **Architecture:** REST with JSON payloads
- **Authentication:** JWT Bearer tokens
- **Base URL (Production):** `https://api.ridendine.com`
- **Base URL (Development):** `http://localhost:9001`
- **API Documentation:** See [openapi.yaml](../openapi.yaml) or [Swagger UI](http://localhost:9001/api/docs)
- **Rate Limiting:** 100 requests per 15 minutes per IP

### Supported Features

- Multi-role authentication (customer, chef, driver, admin)
- Geospatial chef search with PostGIS
- Complete order lifecycle management (12 states)
- Real-time order tracking via WebSocket
- Stripe payment integration
- GPS-based driver tracking
- Review and rating system
- Admin operations and audit logging

---

## Getting Started

### Prerequisites

- API key/credentials (contact support@ridendine.com)
- HTTPS client library (axios, fetch, etc.)
- WebSocket client for real-time features
- Node.js 18+ or equivalent runtime

### Quick Start: Your First API Call

```javascript
// Install axios
// npm install axios

const axios = require('axios');

const API_BASE_URL = 'http://localhost:9001';

// Step 1: Register a new user
async function registerUser() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: 'customer@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+15555551234',
      role: 'customer',
    });

    console.log('Registration successful!');
    console.log('Access Token:', response.data.accessToken);
    console.log('Refresh Token:', response.data.refreshToken);
    console.log('User ID:', response.data.user.id);

    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  }
}

// Step 2: Login
async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    console.log('Login successful!');
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Run it
registerUser()
  .then((data) => console.log('Ready to make authenticated requests!'))
  .catch((err) => console.error('Setup failed:', err));
```

### Expected Response

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "customer@example.com",
    "role": "customer",
    "createdAt": "2026-01-31T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Authentication & Authorization

### Token-Based Authentication

RideNDine uses JWT (JSON Web Tokens) for authentication. All authenticated endpoints require an `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token:** Expires after 15 minutes
- **Refresh Token:** Expires after 7 days (168 hours)
- **Strategy:** Use access tokens for requests; refresh when expired

### Complete Authentication Flow

```typescript
// api-client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  role: 'customer' | 'chef' | 'driver' | 'admin';
}

class RideNDineAPI {
  private client: AxiosInstance;
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(baseURL: string = 'http://localhost:9001') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor: Handle 401 and refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && this.tokens?.refreshToken) {
          try {
            // Prevent multiple refresh calls
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshAccessToken();
            }

            const tokens = await this.refreshPromise;
            this.refreshPromise = null;

            // Retry original request with new token
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              return this.client.request(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.tokens = null;
            this.refreshPromise = null;
            // Trigger logout or redirect to login page
            console.error('Session expired. Please login again.');
            throw refreshError;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Register new user
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: 'customer' | 'chef' | 'driver';
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await this.client.post('/auth/register', data);
    this.setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
    return response.data;
  }

  // Login
  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await this.client.post('/auth/login', { email, password });
    this.setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
    return response.data;
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post('/auth/refresh', {
      refreshToken: this.tokens.refreshToken,
    });

    const newTokens = {
      accessToken: response.data.accessToken,
      refreshToken: this.tokens.refreshToken, // Keep existing refresh token
    };

    this.setTokens(newTokens);
    return newTokens;
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.tokens = null;
    }
  }

  // Store tokens
  private setTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
    // Optionally persist to localStorage/AsyncStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ridendine_tokens', JSON.stringify(tokens));
    }
  }

  // Load tokens from storage
  loadTokens(): void {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('ridendine_tokens');
      if (stored) {
        this.tokens = JSON.parse(stored);
      }
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    await this.client.post('/auth/verify-email', { token });
  }

  // Request password reset
  async forgotPassword(email: string): Promise<void> {
    await this.client.post('/auth/forgot-password', { email });
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.client.post('/auth/reset-password', { token, newPassword });
  }

  // Get axios instance for custom requests
  getClient(): AxiosInstance {
    return this.client;
  }
}

export default RideNDineAPI;
```

### Usage Example

```typescript
// Initialize API client
const api = new RideNDineAPI('http://localhost:9001');

// Load saved tokens (if any)
api.loadTokens();

// Register new user
const registerResult = await api.register({
  email: 'chef@example.com',
  password: 'SecureChef123!',
  firstName: 'Gordon',
  lastName: 'Ramsay',
  phoneNumber: '+15555552222',
  role: 'chef',
});

console.log('Registered user:', registerResult.user.id);

// Login existing user
const loginResult = await api.login('chef@example.com', 'SecureChef123!');
console.log('Logged in as:', loginResult.user.email);

// Get current user (authenticated request)
const currentUser = await api.getCurrentUser();
console.log('Current user role:', currentUser.role);
```

### Role-Based Access Control (RBAC)

Different user roles have different permissions:

| Role         | Can Access                                         | Cannot Access                                        |
| ------------ | -------------------------------------------------- | ---------------------------------------------------- |
| **customer** | Place orders, track orders, review chefs           | Chef menu management, driver operations, admin panel |
| **chef**     | Manage menus, accept/prepare orders, view earnings | Place orders as customer, driver GPS tracking        |
| **driver**   | Update location, accept deliveries, view earnings  | Chef operations, order creation                      |
| **admin**    | Everything (all endpoints)                         | N/A                                                  |

**Authorization Example:**

```typescript
// Only chefs can create menus
// POST /chefs/:id/menus
// Requires: role === 'chef' AND user owns chef profile

// Only customers can create orders
// POST /orders
// Requires: role === 'customer'

// Only drivers can update location
// POST /drivers/location
// Requires: role === 'driver'

// Only admins can verify chefs
// PATCH /admin/chefs/:id/verify
// Requires: role === 'admin'
```

---

## Core API Patterns

### Request/Response Format

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer <token>
```

**Success Response (200-299):**

```json
{
  "data": {
    /* response payload */
  },
  "meta": {
    "timestamp": "2026-01-31T10:00:00.000Z"
  }
}
```

**Error Response (400-599):**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-01-31T10:00:00.000Z"
}
```

### Pagination

List endpoints support pagination:

**Request Parameters:**

```
GET /orders?page=1&limit=20
```

**Response:**

```json
{
  "orders": [
    /* array of orders */
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### Filtering

Many endpoints support filtering:

```typescript
// Filter orders by status
GET /orders?status=preparing&page=1&limit=10

// Filter chefs by cuisine type
GET /chefs/search?lat=30.2672&lng=-97.7431&cuisineType=italian&minRating=4.5

// Filter admin actions by type
GET /admin/actions?actionType=chef_verification&page=1&limit=50
```

### Sorting

Some endpoints support sorting:

```typescript
// Sort by distance (default for chef search)
GET /chefs/search?lat=30.2672&lng=-97.7431&sortBy=distance

// Sort by rating
GET /chefs/search?lat=30.2672&lng=-97.7431&sortBy=rating
```

---

## User Management

### Get Current User Profile

```typescript
async function getUserProfile(api: RideNDineAPI) {
  const profile = await api.getClient().get('/users/me');
  console.log('User profile:', profile.data);
  return profile.data;
}

// Response
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "role": "customer",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+15555551234",
  "avatarUrl": "https://cdn.ridendine.com/avatars/user123.jpg",
  "isVerified": true,
  "createdAt": "2026-01-15T08:30:00.000Z"
}
```

### Update User Profile

```typescript
async function updateProfile(api: RideNDineAPI) {
  const updated = await api.getClient().patch('/users/me', {
    firstName: 'Jonathan',
    phoneNumber: '+15555559999',
    avatarUrl: 'https://cdn.ridendine.com/avatars/new-avatar.jpg',
  });

  console.log('Profile updated:', updated.data);
  return updated.data;
}
```

### Delete User Account

```typescript
async function deleteAccount(api: RideNDineAPI) {
  await api.getClient().delete('/users/me');
  console.log('Account deleted successfully');
}
```

---

## Chef Discovery & Menus

### Search for Nearby Chefs

```typescript
interface ChefSearchParams {
  lat: number; // Latitude (required)
  lng: number; // Longitude (required)
  radius?: number; // Search radius in km (default: 10)
  cuisineType?: string; // Filter by cuisine
  minRating?: number; // Minimum rating (0-5)
}

async function searchChefs(api: RideNDineAPI, params: ChefSearchParams) {
  const response = await api.getClient().get('/chefs/search', { params });
  console.log(`Found ${response.data.total} chefs`);
  return response.data;
}

// Example usage
const chefs = await searchChefs(api, {
  lat: 30.2672,
  lng: -97.7431,
  radius: 15,
  cuisineType: 'italian',
  minRating: 4.5,
});

console.log('Top chef:', chefs.chefs[0].businessName);
```

**Response:**

```json
{
  "chefs": [
    {
      "id": "chef-uuid-1",
      "businessName": "Mama Mia's Kitchen",
      "cuisineTypes": ["italian", "pasta"],
      "averageRating": 4.8,
      "totalReviews": 125,
      "distanceKm": 2.3,
      "businessAddress": "123 Main St, Austin, TX 78701",
      "isAvailable": true
    },
    {
      "id": "chef-uuid-2",
      "businessName": "Nonna's Trattoria",
      "cuisineTypes": ["italian", "pizza"],
      "averageRating": 4.6,
      "totalReviews": 89,
      "distanceKm": 4.1,
      "businessAddress": "456 Oak Ave, Austin, TX 78702",
      "isAvailable": true
    }
  ],
  "total": 2
}
```

### Get Chef Profile Details

```typescript
async function getChefProfile(api: RideNDineAPI, chefId: string) {
  const response = await api.getClient().get(`/chefs/${chefId}`);
  return response.data;
}

// Example
const chef = await getChefProfile(api, 'chef-uuid-1');
console.log('Chef description:', chef.description);
console.log('Delivery radius:', chef.deliveryRadius, 'km');
console.log('Minimum order:', chef.minimumOrder / 100, 'USD');
```

**Response:**

```json
{
  "id": "chef-uuid-1",
  "userId": "user-uuid-1",
  "businessName": "Mama Mia's Kitchen",
  "description": "Authentic Italian cuisine from Tuscany region",
  "businessAddress": "123 Main St, Austin, TX 78701",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "cuisineTypes": ["italian", "pasta"],
  "averageRating": 4.8,
  "totalReviews": 125,
  "minimumOrder": 1500,
  "deliveryRadius": 10,
  "isAvailable": true,
  "verificationStatus": "approved",
  "stripeOnboardingComplete": true,
  "createdAt": "2026-01-10T12:00:00.000Z"
}
```

### Get Chef Menus

```typescript
async function getChefMenus(api: RideNDineAPI, chefId: string) {
  const response = await api.getClient().get(`/chefs/${chefId}/menus`);
  console.log(`Chef has ${response.data.menus.length} menus`);
  return response.data.menus;
}

// Get specific menu with items
async function getMenuDetails(api: RideNDineAPI, chefId: string, menuId: string) {
  const response = await api.getClient().get(`/chefs/${chefId}/menus/${menuId}`);
  console.log(`Menu "${response.data.name}" has ${response.data.items.length} items`);
  return response.data;
}

// Example
const menus = await getChefMenus(api, 'chef-uuid-1');
const dinnerMenu = await getMenuDetails(api, 'chef-uuid-1', menus[0].id);

dinnerMenu.items.forEach((item) => {
  console.log(`${item.name}: $${item.price / 100}`);
});
```

**Menu Response:**

```json
{
  "id": "menu-uuid-1",
  "chefId": "chef-uuid-1",
  "name": "Dinner Menu",
  "description": "Classic Italian dinner dishes",
  "isActive": true,
  "createdAt": "2026-01-20T10:00:00.000Z",
  "items": [
    {
      "id": "item-uuid-1",
      "menuId": "menu-uuid-1",
      "name": "Spaghetti Carbonara",
      "description": "Classic Roman pasta with eggs, pecorino, and guanciale",
      "price": 1599,
      "category": "pasta",
      "isAvailable": true,
      "prepTimeMinutes": 25,
      "imageUrl": "https://cdn.ridendine.com/items/carbonara.jpg",
      "dietaryTags": []
    },
    {
      "id": "item-uuid-2",
      "menuId": "menu-uuid-1",
      "name": "Margherita Pizza",
      "description": "Fresh mozzarella, San Marzano tomatoes, basil",
      "price": 1299,
      "category": "pizza",
      "isAvailable": true,
      "prepTimeMinutes": 20,
      "imageUrl": "https://cdn.ridendine.com/items/margherita.jpg",
      "dietaryTags": ["vegetarian"]
    }
  ]
}
```

### Get Chef Reviews

```typescript
async function getChefReviews(api: RideNDineAPI, chefId: string, page: number = 1) {
  const response = await api.getClient().get(`/chefs/${chefId}/reviews`, {
    params: { page, limit: 10 },
  });
  return response.data;
}

// Example
const reviews = await getChefReviews(api, 'chef-uuid-1');
reviews.reviews.forEach((review) => {
  console.log(`${review.rating}/5 - ${review.comment}`);
  console.log(`By ${review.customerName} on ${review.createdAt}`);
});
```

---

## Order Management

### Create Order

```typescript
interface OrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

interface CreateOrderData {
  chefId: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  items: OrderItem[];
  deliveryInstructions?: string;
  tipAmountCents?: number;
}

async function createOrder(api: RideNDineAPI, data: CreateOrderData) {
  const response = await api.getClient().post('/orders', data);
  console.log('Order created:', response.data.orderNumber);
  console.log('Total amount:', response.data.totalCents / 100, 'USD');
  console.log('Estimated delivery:', response.data.estimatedDeliveryTime);
  return response.data;
}

// Example usage
const newOrder = await createOrder(api, {
  chefId: 'chef-uuid-1',
  deliveryAddress: '789 Customer Lane, Austin, TX 78703',
  deliveryLatitude: 30.285,
  deliveryLongitude: -97.75,
  items: [
    {
      menuItemId: 'item-uuid-1',
      quantity: 2,
      notes: 'Extra cheese please',
    },
    {
      menuItemId: 'item-uuid-2',
      quantity: 1,
    },
  ],
  deliveryInstructions: 'Ring doorbell, leave at door',
  tipAmountCents: 500, // $5.00 tip
});

console.log('Order ID:', newOrder.id);
console.log('Order number:', newOrder.orderNumber);
```

**Response:**

```json
{
  "id": "order-uuid-1",
  "orderNumber": "RND-20260131-0042",
  "status": "pending",
  "customerId": "customer-uuid-1",
  "chefId": "chef-uuid-1",
  "subtotalCents": 4497,
  "taxCents": 360,
  "deliveryFeeCents": 500,
  "platformFeeCents": 450,
  "tipAmountCents": 500,
  "totalCents": 6307,
  "chefEarningsCents": 3822,
  "driverEarningsCents": 0,
  "createdAt": "2026-01-31T10:30:00.000Z",
  "estimatedDeliveryTime": "2026-01-31T11:30:00.000Z"
}
```

### Get Order Details

```typescript
async function getOrderDetails(api: RideNDineAPI, orderId: string) {
  const response = await api.getClient().get(`/orders/${orderId}`);
  return response.data;
}

// Example
const order = await getOrderDetails(api, 'order-uuid-1');
console.log('Order status:', order.status);
console.log('Items:');
order.items.forEach((item) => {
  console.log(`  ${item.quantity}x ${item.name} - $${item.priceAtOrderCents / 100}`);
});
```

**Response:**

```json
{
  "id": "order-uuid-1",
  "orderNumber": "RND-20260131-0042",
  "status": "preparing",
  "customer": {
    "name": "John Doe",
    "phone": "+15555551234"
  },
  "chef": {
    "businessName": "Mama Mia's Kitchen",
    "address": "123 Main St, Austin, TX 78701"
  },
  "driver": {
    "name": "Mike Smith",
    "phone": "+15555553333",
    "vehicleType": "car"
  },
  "items": [
    {
      "name": "Spaghetti Carbonara",
      "quantity": 2,
      "priceAtOrderCents": 1599,
      "notes": "Extra cheese please"
    },
    {
      "name": "Margherita Pizza",
      "quantity": 1,
      "priceAtOrderCents": 1299,
      "notes": null
    }
  ],
  "deliveryAddress": "789 Customer Lane, Austin, TX 78703",
  "deliveryInstructions": "Ring doorbell, leave at door",
  "subtotalCents": 4497,
  "totalCents": 6307,
  "createdAt": "2026-01-31T10:30:00.000Z",
  "estimatedDeliveryTime": "2026-01-31T11:30:00.000Z"
}
```

### List Orders with Filters

```typescript
async function listOrders(
  api: RideNDineAPI,
  filters: {
    status?: string;
    chefId?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  },
) {
  const response = await api.getClient().get('/orders', { params: filters });
  console.log(`Found ${response.data.total} orders`);
  return response.data;
}

// Example: Get all preparing orders
const preparingOrders = await listOrders(api, { status: 'preparing', page: 1, limit: 10 });

// Example: Get all orders for a specific chef
const chefOrders = await listOrders(api, { chefId: 'chef-uuid-1', page: 1 });
```

### Order Status Flow

The order progresses through these states:

```
pending → payment_confirmed → accepted → preparing → ready_for_pickup
  → assigned_to_driver → picked_up → in_transit → delivered

  (or)

pending → cancelled → refunded
```

### Chef: Accept Order

```typescript
// Only chefs can accept their orders
async function acceptOrder(api: RideNDineAPI, orderId: string) {
  const response = await api.getClient().patch(`/orders/${orderId}/accept`);
  console.log('Order accepted:', response.data.message);
  return response.data;
}
```

### Get Order Tracking (Public Endpoint)

```typescript
async function trackOrder(orderId: string) {
  // This endpoint does NOT require authentication
  const response = await axios.get(`http://localhost:9001/orders/${orderId}/tracking`);
  return response.data;
}

// Example
const tracking = await trackOrder('order-uuid-1');
console.log('Order status:', tracking.status);
console.log('ETA:', tracking.etaMinutes, 'minutes');

if (tracking.driver) {
  console.log('Driver location:', tracking.driver.latitude, tracking.driver.longitude);
  console.log('Last update:', tracking.driver.lastLocationUpdate);
}
```

**Tracking Response:**

```json
{
  "orderId": "order-uuid-1",
  "orderNumber": "RND-20260131-0042",
  "status": "in_transit",
  "customer": {
    "name": "John Doe"
  },
  "chef": {
    "businessName": "Mama Mia's Kitchen",
    "address": "123 Main St, Austin, TX 78701"
  },
  "driver": {
    "name": "Mike Smith",
    "phone": "+15555553333",
    "latitude": 30.275,
    "longitude": -97.745,
    "lastLocationUpdate": "2026-01-31T11:15:23.000Z"
  },
  "estimatedDeliveryTime": "2026-01-31T11:30:00.000Z",
  "etaMinutes": 12,
  "statusHistory": [
    { "status": "pending", "timestamp": "2026-01-31T10:30:00.000Z" },
    { "status": "payment_confirmed", "timestamp": "2026-01-31T10:30:15.000Z" },
    { "status": "accepted", "timestamp": "2026-01-31T10:31:00.000Z" },
    { "status": "preparing", "timestamp": "2026-01-31T10:32:00.000Z" },
    { "status": "ready_for_pickup", "timestamp": "2026-01-31T11:00:00.000Z" },
    { "status": "assigned_to_driver", "timestamp": "2026-01-31T11:02:00.000Z" },
    { "status": "picked_up", "timestamp": "2026-01-31T11:08:00.000Z" },
    { "status": "in_transit", "timestamp": "2026-01-31T11:10:00.000Z" }
  ]
}
```

---

## Payment Integration

### Create Payment Intent

```typescript
async function createPaymentIntent(api: RideNDineAPI, orderId: string) {
  const response = await api.getClient().post(`/orders/${orderId}/create-payment-intent`);

  console.log('Payment Intent created');
  console.log('Client Secret:', response.data.clientSecret);
  console.log('Amount:', response.data.amountCents / 100, 'USD');

  return response.data;
}

// Example
const paymentIntent = await createPaymentIntent(api, 'order-uuid-1');

// Use client secret with Stripe SDK
// See: https://stripe.com/docs/payments/accept-a-payment
```

### Stripe Frontend Integration

```typescript
// Install Stripe SDK
// npm install @stripe/stripe-js

import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_your_publishable_key');

async function processPayment(orderId: string) {
  // Step 1: Create order
  const order = await createOrder(api, {
    chefId: 'chef-uuid-1',
    deliveryAddress: '789 Customer Lane, Austin, TX 78703',
    deliveryLatitude: 30.285,
    deliveryLongitude: -97.75,
    items: [{ menuItemId: 'item-uuid-1', quantity: 2 }],
  });

  // Step 2: Create payment intent
  const paymentIntent = await createPaymentIntent(api, order.id);

  // Step 3: Confirm payment with Stripe
  const stripe = await stripePromise;
  const { error, paymentIntent: confirmedIntent } = await stripe!.confirmCardPayment(
    paymentIntent.clientSecret,
    {
      payment_method: {
        card: cardElement, // From Stripe Elements
        billing_details: {
          name: 'John Doe',
        },
      },
    },
  );

  if (error) {
    console.error('Payment failed:', error.message);
    throw error;
  }

  console.log('Payment successful!');
  console.log('Order status will update to payment_confirmed via webhook');

  return confirmedIntent;
}
```

### Payment Webhooks

Stripe webhooks automatically update order status:

- **payment_intent.succeeded** → Order status changes to `payment_confirmed`
- **payment_intent.payment_failed** → Order remains in `pending` status
- **charge.refunded** → Order status changes to `refunded`

---

## Driver Management

### Register as Driver

```typescript
async function registerDriver(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  vehicleType: 'car' | 'bike' | 'scooter' | 'motorcycle';
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  licensePlate: string;
}) {
  const response = await axios.post('http://localhost:9001/drivers/register', data);
  console.log('Driver registered:', response.data.id);
  return response.data;
}

// Example
const driver = await registerDriver({
  email: 'driver@example.com',
  password: 'SecureDriver123!',
  firstName: 'Mike',
  lastName: 'Smith',
  phoneNumber: '+15555553333',
  vehicleType: 'car',
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  vehicleYear: 2020,
  licensePlate: 'ABC1234',
});
```

### Update Driver Location

```typescript
async function updateLocation(
  api: RideNDineAPI,
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number; // meters
    speed?: number; // m/s
    heading?: number; // degrees
  },
) {
  await api.getClient().post('/drivers/location', location);
  console.log('Location updated');
}

// Example: GPS tracking loop
async function startGPSTracking(api: RideNDineAPI) {
  setInterval(async () => {
    // Get location from device GPS
    const position = await getCurrentPosition();

    await updateLocation(api, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || 0,
      heading: position.coords.heading || 0,
    });
  }, 5000); // Update every 5 seconds
}
```

### Toggle Driver Availability

```typescript
async function goOnline(api: RideNDineAPI) {
  await api.getClient().patch('/drivers/availability', { isAvailable: true });
  console.log('Driver is now online and available for deliveries');
}

async function goOffline(api: RideNDineAPI) {
  await api.getClient().patch('/drivers/availability', { isAvailable: false });
  console.log('Driver is now offline');
}
```

### Get Driver Stats

```typescript
async function getDriverStats(api: RideNDineAPI) {
  const response = await api.getClient().get('/drivers/stats');
  console.log('Total deliveries:', response.data.totalDeliveries);
  console.log('Total earnings:', response.data.totalEarnings / 100, 'USD');
  console.log('Average rating:', response.data.averageRating);
  console.log('Pending payouts:', response.data.pendingPayouts / 100, 'USD');
  return response.data;
}
```

---

## Real-Time Communication

### WebSocket Connection

```typescript
// Install socket.io-client
// npm install socket.io-client

import { io, Socket } from 'socket.io-client';

class RealtimeClient {
  private socket: Socket;

  constructor(url: string = 'http://localhost:9001', token: string) {
    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  // Subscribe to order status updates
  onOrderStatusChanged(callback: (order: any) => void) {
    this.socket.on('order:status_changed', callback);
  }

  // Subscribe to driver location updates
  onDriverLocationUpdated(callback: (location: any) => void) {
    this.socket.on('driver:location_updated', callback);
  }

  // Subscribe to notifications
  onNotification(callback: (notification: any) => void) {
    this.socket.on('notification:new', callback);
  }

  // Join order room for updates
  joinOrderRoom(orderId: string) {
    this.socket.emit('join_order', { orderId });
  }

  // Leave order room
  leaveOrderRoom(orderId: string) {
    this.socket.emit('leave_order', { orderId });
  }

  disconnect() {
    this.socket.disconnect();
  }

  getSocket(): Socket {
    return this.socket;
  }
}

export default RealtimeClient;
```

### Usage Example: Customer Order Tracking

```typescript
// Customer tracking an order
async function trackOrderRealtime(orderId: string, accessToken: string) {
  const realtime = new RealtimeClient('http://localhost:9001', accessToken);

  // Join order room
  realtime.joinOrderRoom(orderId);

  // Listen for order status updates
  realtime.onOrderStatusChanged((order) => {
    console.log('📦 Order status changed:', order.status);

    if (order.status === 'delivered') {
      console.log('✅ Order delivered!');
      realtime.leaveOrderRoom(orderId);
      realtime.disconnect();
    }
  });

  // Listen for driver location updates
  realtime.onDriverLocationUpdated((location) => {
    console.log('📍 Driver location:', location.latitude, location.longitude);
    console.log('⏱️  ETA:', location.etaMinutes, 'minutes');

    // Update map marker on UI
    updateDriverMarker(location.latitude, location.longitude);
  });

  // Listen for notifications
  realtime.onNotification((notification) => {
    console.log('🔔 Notification:', notification.message);
    showToast(notification.message);
  });
}

// Usage
const api = new RideNDineAPI();
await api.login('customer@example.com', 'password');
const tokens = api['tokens']; // Access private property (for demo)
await trackOrderRealtime('order-uuid-1', tokens.accessToken);
```

### Usage Example: Driver App

```typescript
// Driver receiving delivery assignments
async function driverRealtimeUpdates(accessToken: string) {
  const realtime = new RealtimeClient('http://localhost:9001', accessToken);

  // Listen for new delivery assignments
  realtime.getSocket().on('delivery:assigned', (delivery) => {
    console.log('🚗 New delivery assigned!');
    console.log('Order:', delivery.orderNumber);
    console.log('Pickup:', delivery.pickupAddress);
    console.log('Dropoff:', delivery.deliveryAddress);
    console.log('Earnings:', delivery.driverEarnings / 100, 'USD');

    // Show notification to driver
    showDeliveryNotification(delivery);
  });

  // Listen for order status updates
  realtime.onOrderStatusChanged((order) => {
    console.log('Order status:', order.status);

    if (order.status === 'ready_for_pickup') {
      console.log('✅ Food is ready for pickup!');
      playNotificationSound();
    }
  });

  // Listen for notifications
  realtime.onNotification((notification) => {
    console.log('Notification:', notification.message);
  });
}
```

---

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than 8 characters"],
  "error": "Bad Request",
  "timestamp": "2026-01-31T10:00:00.000Z"
}
```

### Common HTTP Status Codes

| Code | Meaning               | Common Causes                                |
| ---- | --------------------- | -------------------------------------------- |
| 400  | Bad Request           | Validation failed, missing required fields   |
| 401  | Unauthorized          | Missing or invalid access token              |
| 403  | Forbidden             | Insufficient permissions for operation       |
| 404  | Not Found             | Resource does not exist                      |
| 409  | Conflict              | Email already exists, order already assigned |
| 422  | Unprocessable Entity  | Business logic validation failed             |
| 429  | Too Many Requests     | Rate limit exceeded                          |
| 500  | Internal Server Error | Server error (contact support)               |

### Error Handling Best Practices

```typescript
import axios, { AxiosError } from 'axios';

interface APIError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
}

async function makeAPICall() {
  try {
    const response = await api.getClient().post('/orders', orderData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;

      if (axiosError.response) {
        // Server responded with error status
        const status = axiosError.response.status;
        const apiError = axiosError.response.data;

        switch (status) {
          case 400:
            // Validation error
            console.error('Validation failed:', apiError.message);
            // Display field-specific errors to user
            if (Array.isArray(apiError.message)) {
              apiError.message.forEach((msg) => showFieldError(msg));
            }
            break;

          case 401:
            // Unauthorized - redirect to login
            console.error('Session expired');
            redirectToLogin();
            break;

          case 403:
            // Forbidden - insufficient permissions
            console.error('Access denied:', apiError.message);
            showAlert('You do not have permission to perform this action');
            break;

          case 404:
            // Not found
            console.error('Resource not found:', apiError.message);
            showAlert('The requested resource was not found');
            break;

          case 409:
            // Conflict
            console.error('Conflict:', apiError.message);
            showAlert(apiError.message as string);
            break;

          case 422:
            // Business logic error
            console.error('Business logic error:', apiError.message);
            showAlert(apiError.message as string);
            break;

          case 429:
            // Rate limit exceeded
            console.error('Rate limit exceeded');
            showAlert('Too many requests. Please wait a moment and try again.');
            break;

          case 500:
          default:
            // Server error
            console.error('Server error:', apiError.message);
            showAlert('An unexpected error occurred. Please try again later.');
            break;
        }
      } else if (axiosError.request) {
        // Request made but no response received
        console.error('Network error:', axiosError.message);
        showAlert('Unable to connect to server. Please check your internet connection.');
      } else {
        // Error setting up request
        console.error('Request setup error:', axiosError.message);
      }
    } else {
      // Non-Axios error
      console.error('Unexpected error:', error);
    }

    throw error;
  }
}
```

### Validation Errors

```typescript
// Example validation error for registration
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than 8 characters",
    "phoneNumber must match pattern ^\\+?[1-9]\\d{1,14}$"
  ],
  "error": "Bad Request"
}

// Handle in UI:
function handleValidationErrors(messages: string[]) {
  messages.forEach(msg => {
    // Parse field from message
    const field = msg.split(' ')[0]; // e.g., "email"
    const error = msg.substring(field.length + 1); // e.g., "must be an email"

    // Show error under form field
    showFieldError(field, error);
  });
}
```

---

## Rate Limiting

### Rate Limit Rules

| Endpoint Pattern       | Limit        | Window     |
| ---------------------- | ------------ | ---------- |
| Global (all endpoints) | 100 requests | 15 minutes |
| POST /auth/login       | 5 requests   | 1 minute   |
| POST /auth/register    | 3 requests   | 1 hour     |
| POST /drivers/location | 120 requests | 1 minute   |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706698800
```

### Handling Rate Limits

```typescript
async function makeRateLimitedRequest() {
  try {
    const response = await api.getClient().get('/chefs/search', { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      // Rate limit exceeded
      const resetTime = error.response.headers['x-ratelimit-reset'];
      const waitSeconds = parseInt(resetTime) - Math.floor(Date.now() / 1000);

      console.log(`Rate limit exceeded. Retry after ${waitSeconds} seconds`);

      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
      return makeRateLimitedRequest();
    }
    throw error;
  }
}
```

---

## Testing & Debugging

### Using cURL

```bash
# Register user
curl -X POST http://localhost:9001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test12345!",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+15555551234",
    "role": "customer"
  }'

# Login
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test12345!"
  }'

# Get user profile (authenticated)
curl -X GET http://localhost:9001/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Search chefs
curl -X GET "http://localhost:9001/chefs/search?lat=30.2672&lng=-97.7431&radius=10"
```

### Using Postman

1. Import OpenAPI spec: `File > Import > openapi.yaml`
2. Set environment variable: `{{baseUrl}} = http://localhost:9001`
3. Create collection variable: `{{accessToken}}`
4. Add auth to collection: `Bearer Token = {{accessToken}}`

**Test Script (auto-save token):**

```javascript
// In login request "Tests" tab
pm.test('Status is 200', function () {
  pm.response.to.have.status(200);
});

const response = pm.response.json();
pm.collectionVariables.set('accessToken', response.accessToken);
```

### Debug Logging

```typescript
// Enable debug logging
const api = new RideNDineAPI('http://localhost:9001');

api.getClient().interceptors.request.use((request) => {
  console.log('📤 Request:', request.method?.toUpperCase(), request.url);
  console.log('   Headers:', request.headers);
  console.log('   Body:', request.data);
  return request;
});

api.getClient().interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url);
    console.log('   Data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Error:', error.response?.status, error.config?.url);
    console.error('   Error data:', error.response?.data);
    return Promise.reject(error);
  },
);
```

---

## Code Examples by Language

### Python

```python
import requests
from typing import Dict, Optional

class RideNDineAPI:
    def __init__(self, base_url: str = "http://localhost:9001"):
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers

    def register(self, email: str, password: str, first_name: str,
                 last_name: str, phone: str, role: str) -> Dict:
        response = requests.post(
            f"{self.base_url}/auth/register",
            json={
                "email": email,
                "password": password,
                "firstName": first_name,
                "lastName": last_name,
                "phoneNumber": phone,
                "role": role
            }
        )
        response.raise_for_status()
        data = response.json()
        self.access_token = data["accessToken"]
        self.refresh_token = data["refreshToken"]
        return data

    def login(self, email: str, password: str) -> Dict:
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        data = response.json()
        self.access_token = data["accessToken"]
        self.refresh_token = data["refreshToken"]
        return data

    def search_chefs(self, lat: float, lng: float, radius: float = 10) -> Dict:
        response = requests.get(
            f"{self.base_url}/chefs/search",
            params={"lat": lat, "lng": lng, "radius": radius}
        )
        response.raise_for_status()
        return response.json()

    def create_order(self, order_data: Dict) -> Dict:
        response = requests.post(
            f"{self.base_url}/orders",
            json=order_data,
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()

# Usage
api = RideNDineAPI()
api.login("customer@example.com", "password")
chefs = api.search_chefs(30.2672, -97.7431)
print(f"Found {chefs['total']} chefs")
```

### Ruby

```ruby
require 'net/http'
require 'json'
require 'uri'

class RideNDineAPI
  def initialize(base_url = 'http://localhost:9001')
    @base_url = base_url
    @access_token = nil
  end

  def register(email:, password:, first_name:, last_name:, phone:, role:)
    response = post('/auth/register', {
      email: email,
      password: password,
      firstName: first_name,
      lastName: last_name,
      phoneNumber: phone,
      role: role
    })
    @access_token = response['accessToken']
    response
  end

  def login(email, password)
    response = post('/auth/login', { email: email, password: password })
    @access_token = response['accessToken']
    response
  end

  def search_chefs(lat, lng, radius = 10)
    get("/chefs/search?lat=#{lat}&lng=#{lng}&radius=#{radius}")
  end

  private

  def post(path, body)
    uri = URI("#{@base_url}#{path}")
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request['Authorization'] = "Bearer #{@access_token}" if @access_token
    request.body = body.to_json

    response = Net::HTTP.start(uri.hostname, uri.port) do |http|
      http.request(request)
    end

    JSON.parse(response.body)
  end

  def get(path)
    uri = URI("#{@base_url}#{path}")
    request = Net::HTTP::Get.new(uri)
    request['Authorization'] = "Bearer #{@access_token}" if @access_token

    response = Net::HTTP.start(uri.hostname, uri.port) do |http|
      http.request(request)
    end

    JSON.parse(response.body)
  end
end

# Usage
api = RideNDineAPI.new
api.login('customer@example.com', 'password')
chefs = api.search_chefs(30.2672, -97.7431)
puts "Found #{chefs['total']} chefs"
```

---

## Common Integration Patterns

### Pattern 1: Customer Order Flow

```typescript
async function completeCustomerOrderFlow(api: RideNDineAPI) {
  // 1. Search for chefs
  const chefs = await api.getClient().get('/chefs/search', {
    params: { lat: 30.2672, lng: -97.7431, radius: 10 },
  });

  const chef = chefs.data.chefs[0];
  console.log('Selected chef:', chef.businessName);

  // 2. Get chef menu
  const menus = await api.getClient().get(`/chefs/${chef.id}/menus`);
  const menu = await api.getClient().get(`/chefs/${chef.id}/menus/${menus.data.menus[0].id}`);

  // 3. Create order
  const order = await api.getClient().post('/orders', {
    chefId: chef.id,
    deliveryAddress: '789 Customer Lane, Austin, TX 78703',
    deliveryLatitude: 30.285,
    deliveryLongitude: -97.75,
    items: [{ menuItemId: menu.data.items[0].id, quantity: 2 }],
  });

  console.log('Order created:', order.data.orderNumber);

  // 4. Create payment intent
  const payment = await api.getClient().post(`/orders/${order.data.id}/create-payment-intent`);

  // 5. Process payment with Stripe (frontend)
  // ... Stripe SDK integration ...

  // 6. Track order in real-time
  const realtime = new RealtimeClient('http://localhost:9001', api['tokens'].accessToken);
  realtime.joinOrderRoom(order.data.id);

  realtime.onOrderStatusChanged((updatedOrder) => {
    console.log('Order status:', updatedOrder.status);
  });

  return order.data;
}
```

### Pattern 2: Chef Order Management

```typescript
async function chefOrderManagement(api: RideNDineAPI) {
  // 1. Get pending orders
  const pendingOrders = await api.getClient().get('/orders', {
    params: { status: 'payment_confirmed', page: 1, limit: 10 },
  });

  for (const order of pendingOrders.data.orders) {
    console.log('New order:', order.orderNumber);

    // 2. Accept order
    await api.getClient().patch(`/orders/${order.id}/accept`);
    console.log('Order accepted');

    // 3. Update status to preparing
    await api.getClient().patch(`/orders/${order.id}/status`, {
      status: 'preparing',
    });

    // 4. Wait for food to be ready...
    await new Promise((resolve) => setTimeout(resolve, 20 * 60 * 1000)); // 20 minutes

    // 5. Mark as ready for pickup
    await api.getClient().patch(`/orders/${order.id}/status`, {
      status: 'ready_for_pickup',
    });

    console.log('Order ready for pickup');
  }
}
```

### Pattern 3: Driver Delivery Flow

```typescript
async function driverDeliveryFlow(api: RideNDineAPI, orderId: string) {
  // 1. Get order details
  const order = await api.getClient().get(`/orders/${orderId}`);

  console.log('Pickup from:', order.data.chef.address);
  console.log('Deliver to:', order.data.deliveryAddress);

  // 2. Navigate to chef location
  // ... Navigation integration ...

  // 3. Update status when picked up
  await api.getClient().patch(`/orders/${orderId}/status`, {
    status: 'picked_up',
  });

  // 4. Start GPS tracking
  const gpsInterval = setInterval(async () => {
    const position = await getCurrentPosition();
    await api.getClient().post('/drivers/location', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  }, 5000);

  // 5. Update status to in-transit
  await api.getClient().patch(`/orders/${orderId}/status`, {
    status: 'in_transit',
  });

  // 6. Navigate to customer
  // ... Navigation integration ...

  // 7. Mark as delivered
  await api.getClient().patch(`/orders/${orderId}/status`, {
    status: 'delivered',
  });

  clearInterval(gpsInterval);
  console.log('Delivery complete!');
}
```

---

## Next Steps

- **Explore Swagger UI:** Visit [http://localhost:9001/api/docs](http://localhost:9001/api/docs) for interactive API testing
- **Review OpenAPI Spec:** See [openapi.yaml](../openapi.yaml) for complete endpoint reference
- **Check Architecture:** Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- **See User Journeys:** Review [USER_JOURNEYS.md](./USER_JOURNEYS.md) for complete flow documentation
- **Database Schema:** Check [DATABASE.md](./DATABASE.md) for data model details

---

## Support

- **Documentation Issues:** Create GitHub issue
- **API Questions:** support@ridendine.com
- **Bug Reports:** GitHub issues
- **Feature Requests:** GitHub discussions

---

**Last Updated:** 2026-01-31
**Maintained By:** RideNDine Engineering Team
**Version:** 1.0.0
