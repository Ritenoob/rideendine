# RideNDine API Client Documentation

Developer guide for integrating with the RideNDine API.

**Version:** 1.0.0
**Last Updated:** 2026-01-31
**API Base URL:** `http://localhost:9001` (development)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [API Examples](#api-examples)
5. [TypeScript Types](#typescript-types)
6. [Rate Limiting](#rate-limiting)
7. [Best Practices](#best-practices)

---

## Quick Start

### Installation

```bash
# Using npm
npm install axios

# Using yarn
yarn add axios
```

### Basic Setup

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:9001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### First API Call

```typescript
// Register a new user
const response = await apiClient.post('/auth/register', {
  email: 'user@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '+15555551234',
  role: 'customer',
});

console.log('Access token:', response.data.accessToken);
```

---

## Authentication

### JWT Token Flow

The RideNDine API uses JWT (JSON Web Tokens) for authentication.

#### 1. Register or Login

```typescript
// Register new user
const registerResponse = await apiClient.post('/auth/register', {
  email: 'customer@example.com',
  password: 'password123',
  firstName: 'Jane',
  lastName: 'Smith',
  phoneNumber: '+15555551234',
  role: 'customer',
});

const { accessToken, refreshToken, user } = registerResponse.data;

// OR Login existing user
const loginResponse = await apiClient.post('/auth/login', {
  email: 'customer@example.com',
  password: 'password123',
});

const { accessToken, refreshToken, user } = loginResponse.data;
```

#### 2. Store Tokens Securely

```typescript
// Browser (localStorage)
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// React Native (Expo SecureStore)
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('accessToken', accessToken);
await SecureStore.setItemAsync('refreshToken', refreshToken);

// Node.js (environment variables or secure vault)
process.env.ACCESS_TOKEN = accessToken;
```

#### 3. Add Token to Requests

```typescript
// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
```

#### 4. Handle Token Refresh

```typescript
// Response interceptor for automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('http://localhost:9001/auth/refresh', {
          refreshToken,
        });

        const { accessToken } = response.data;

        // Store new token
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be at least 8 characters"],
  "error": "Bad Request",
  "timestamp": "2026-01-31T10:00:00.000Z"
}
```

### Handling Errors in Code

```typescript
try {
  const response = await apiClient.post('/auth/login', {
    email: 'invalid-email',
    password: 'short',
  });
} catch (error) {
  if (error.response) {
    // Server responded with error
    const { statusCode, message, error: errorType } = error.response.data;

    switch (statusCode) {
      case 400:
        console.error('Validation error:', message);
        // Display validation errors to user
        break;
      case 401:
        console.error('Unauthorized:', message);
        // Redirect to login
        break;
      case 404:
        console.error('Not found:', message);
        // Show not found page
        break;
      case 500:
        console.error('Server error:', message);
        // Show generic error message
        break;
      default:
        console.error('Error:', message);
    }
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.message);
  } else {
    // Something else happened
    console.error('Error:', error.message);
  }
}
```

### Common Error Codes

| Code | Error                 | Cause                    | Solution                     |
| ---- | --------------------- | ------------------------ | ---------------------------- |
| 400  | Bad Request           | Validation failed        | Check request body format    |
| 401  | Unauthorized          | Invalid/missing token    | Login again or refresh token |
| 403  | Forbidden             | Insufficient permissions | Check user role              |
| 404  | Not Found             | Resource doesn't exist   | Verify ID/URL                |
| 409  | Conflict              | Duplicate resource       | Use different email/ID       |
| 429  | Too Many Requests     | Rate limit exceeded      | Wait and retry               |
| 500  | Internal Server Error | Server issue             | Contact support              |

---

## API Examples

### Authentication Examples

#### Register Customer

```typescript
const registerCustomer = async () => {
  try {
    const response = await apiClient.post('/auth/register', {
      email: 'customer@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '+15555551234',
      role: 'customer',
    });

    return response.data; // { accessToken, refreshToken, user }
  } catch (error) {
    console.error('Registration failed:', error.response?.data);
    throw error;
  }
};
```

#### Login

```typescript
const login = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });

  const { accessToken, refreshToken } = response.data;

  // Store tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  return response.data;
};
```

#### Logout

```typescript
const logout = async () => {
  const token = localStorage.getItem('accessToken');

  await apiClient.post('/auth/logout', null, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Clear local storage
  localStorage.clear();
};
```

---

### Chef Examples

#### Search Chefs Near Location

```typescript
const searchChefs = async (latitude: number, longitude: number, radius: number = 10) => {
  const response = await apiClient.get('/chefs/search', {
    params: {
      lat: latitude,
      lng: longitude,
      radius: radius,
      minRating: 4.0, // Optional filter
    },
  });

  return response.data.chefs;
};

// Usage
const chefs = await searchChefs(30.2672, -97.7431, 15);
console.log(`Found ${chefs.length} chefs`);
```

#### Get Chef Profile

```typescript
const getChefProfile = async (chefId: string) => {
  const response = await apiClient.get(`/chefs/${chefId}`);

  return response.data; // Chef profile with full details
};
```

#### Get Chef Menu

```typescript
const getChefMenu = async (chefId: string) => {
  const response = await apiClient.get(`/chefs/${chefId}/menus`);

  return response.data.menus; // Array of menus
};

// Get specific menu with items
const getMenuItems = async (chefId: string, menuId: string) => {
  const response = await apiClient.get(`/chefs/${chefId}/menus/${menuId}`);

  return response.data; // Menu with items array
};
```

---

### Order Examples

#### Create Order

```typescript
interface OrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

const createOrder = async (
  chefId: string,
  deliveryAddress: string,
  deliveryLat: number,
  deliveryLng: number,
  items: OrderItem[],
) => {
  const response = await apiClient.post('/orders', {
    chefId,
    deliveryAddress,
    deliveryLatitude: deliveryLat,
    deliveryLongitude: deliveryLng,
    items,
    deliveryInstructions: 'Ring doorbell',
    tipAmountCents: 300, // $3.00 tip
  });

  return response.data; // { id, orderNumber, totalCents, ... }
};

// Usage
const order = await createOrder('chef-uuid-123', '456 Customer St, Austin, TX', 30.275, -97.75, [
  { menuItemId: 'item-uuid-1', quantity: 2, notes: 'Extra spicy' },
  { menuItemId: 'item-uuid-2', quantity: 1 },
]);
```

#### Create Payment Intent

```typescript
const createPaymentIntent = async (orderId: string) => {
  const response = await apiClient.post(`/orders/${orderId}/create-payment-intent`);

  const { clientSecret, paymentIntentId, amountCents } = response.data;

  return { clientSecret, paymentIntentId, amountCents };
};
```

#### Get Order Tracking

```typescript
const getOrderTracking = async (orderId: string) => {
  const response = await apiClient.get(`/orders/${orderId}/tracking`);

  const { orderNumber, status, driver, estimatedDeliveryTime, etaMinutes, statusHistory } =
    response.data;

  return response.data;
};
```

#### List Customer Orders

```typescript
const getMyOrders = async (status?: string) => {
  const response = await apiClient.get('/orders', {
    params: {
      status, // Optional: 'pending', 'in_transit', 'delivered'
      page: 1,
      limit: 20,
    },
  });

  const { orders, total, page, totalPages } = response.data;

  return orders;
};
```

---

### Chef Management Examples

#### Apply to Become Chef

```typescript
const applyAsChef = async () => {
  const response = await apiClient.post('/chefs', {
    businessName: "Chef John's Kitchen",
    cuisineTypes: ['italian', 'mexican'],
    businessAddress: '123 Main St, Austin, TX 78701',
    latitude: 30.2672,
    longitude: -97.7431,
    businessPhone: '+15555551234',
    description: 'Authentic home-cooked Italian and Mexican cuisine',
  });

  return response.data; // Chef profile with verification_status: 'pending'
};
```

#### Start Stripe Onboarding

```typescript
const startStripeOnboarding = async (chefId: string) => {
  const response = await apiClient.post(`/chefs/${chefId}/stripe/onboard`);

  const { url } = response.data;

  // Redirect user to Stripe onboarding
  window.location.href = url;
};
```

#### Create Menu Item

```typescript
const createMenuItem = async (chefId: string, menuId: string) => {
  const response = await apiClient.post(`/chefs/${chefId}/menus/${menuId}/items`, {
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with pancetta and egg',
    price: 1599, // $15.99 in cents
    category: 'pasta',
    prepTimeMinutes: 25,
    isAvailable: true,
    dietaryTags: ['vegetarian'],
  });

  return response.data;
};
```

#### Accept Order (Chef)

```typescript
const acceptOrder = async (orderId: string) => {
  const response = await apiClient.patch(`/orders/${orderId}/accept`);

  return response.data; // { status: 'accepted', message: '...' }
};
```

---

### Driver Examples

#### Update Driver Location

```typescript
const updateLocation = async (latitude: number, longitude: number) => {
  await apiClient.post('/drivers/location', {
    latitude,
    longitude,
    accuracy: 10.5, // meters
    speed: 8.3, // m/s
    heading: 45, // degrees
  });
};

// Use with setInterval for continuous tracking
setInterval(async () => {
  const position = await getCurrentPosition();
  await updateLocation(position.coords.latitude, position.coords.longitude);
}, 10000); // Every 10 seconds
```

#### Toggle Availability

```typescript
const goOnline = async () => {
  await apiClient.patch('/drivers/availability', {
    isAvailable: true,
  });
};

const goOffline = async () => {
  await apiClient.patch('/drivers/availability', {
    isAvailable: false,
  });
};
```

#### Accept Delivery

```typescript
const acceptDelivery = async (assignmentId: string) => {
  await apiClient.post('/dispatch/accept', {
    assignmentId,
  });
};
```

---

## TypeScript Types

### API Response Types

```typescript
// User
interface User {
  id: string;
  email: string;
  role: 'customer' | 'chef' | 'driver' | 'admin';
  createdAt: string;
}

interface UserProfile extends User {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatarUrl?: string;
  isVerified: boolean;
}

// Auth
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Chef
interface Chef {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  businessAddress: string;
  latitude: number;
  longitude: number;
  cuisineTypes: string[];
  averageRating: number;
  totalReviews: number;
  minimumOrder: number; // cents
  deliveryRadius: number; // km
  isAvailable: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  stripeOnboardingComplete: boolean;
  createdAt: string;
}

// Menu & Items
interface MenuItem {
  id: string;
  menuId: string;
  name: string;
  description: string;
  price: number; // cents
  category: string;
  isAvailable: boolean;
  prepTimeMinutes: number;
  imageUrl?: string;
  dietaryTags: string[];
}

// Order
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  platformFeeCents: number;
  totalCents: number;
  chefEarningsCents: number;
  driverEarningsCents?: number;
  createdAt: string;
  estimatedDeliveryTime?: string;
}

type OrderStatus =
  | 'pending'
  | 'payment_confirmed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'assigned_to_driver'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// Driver
interface Driver {
  id: string;
  userId: string;
  vehicleType: 'car' | 'bike' | 'scooter' | 'motorcycle';
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
  isAvailable: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  averageRating: number;
  totalDeliveries: number;
  createdAt: string;
}

// Pagination
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## Rate Limiting

### Limits

- **Global:** 100 requests per 15 minutes per IP
- **Login:** 5 requests per minute
- **Registration:** 3 requests per hour

### Headers

Check rate limit status in response headers:

```typescript
const response = await apiClient.get('/chefs/search');

console.log('Limit:', response.headers['x-ratelimit-limit']);
console.log('Remaining:', response.headers['x-ratelimit-remaining']);
console.log('Reset:', response.headers['x-ratelimit-reset']);
```

### Handling Rate Limits

```typescript
try {
  await apiClient.post('/auth/login', { email, password });
} catch (error) {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);

    // Wait and retry
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return apiClient.post('/auth/login', { email, password });
  }
}
```

---

## Best Practices

### 1. Use Environment Variables

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});
```

### 2. Centralize API Calls

```typescript
// api/auth.ts
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
};

// Usage
import { authAPI } from './api/auth';

const response = await authAPI.login({ email, password });
```

### 3. Handle Loading States

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchChefs = async () => {
  setLoading(true);
  setError(null);

  try {
    const chefs = await apiClient.get('/chefs/search');
    return chefs.data;
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to fetch chefs');
    throw err;
  } finally {
    setLoading(false);
  }
};
```

### 4. Cache Responses

```typescript
// Use React Query for automatic caching
import { useQuery } from '@tanstack/react-query';

const useChef = (chefId: string) => {
  return useQuery({
    queryKey: ['chef', chefId],
    queryFn: () => apiClient.get(`/chefs/${chefId}`).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### 5. Retry Failed Requests

```typescript
import axiosRetry from 'axios-retry';

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500;
  },
});
```

---

## Resources

- **OpenAPI Spec:** [openapi.yaml](../openapi.yaml)
- **Swagger UI:** http://localhost:9001/api/docs
- **Architecture Docs:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **GitHub Issues:** https://github.com/ridendine/ridendine/issues

---

**Document Status:** ✅ Complete
**Last Updated:** 2026-01-31
