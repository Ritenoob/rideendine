# Customer App Development Plan

> **Status:** 🔄 IN PROGRESS — Week 7 Day 1 complete. Testing and integration ongoing.

**Last Updated:** 2026-01-31  
**Current Phase:** Phase 3 Week 7 (Customer Discovery)  
**Platform:** React Native (Expo)

---

## Overview

The customer mobile app enables users to discover local chefs, browse menus, place orders, and track deliveries in real-time.

**Progress:** 35% complete (navigation + API foundation ready)

---

## Technology Stack

### Framework & Libraries
- **Platform:** React Native (Expo SDK 52)
- **Language:** TypeScript
- **Navigation:** React Navigation 6 (Stack + Bottom Tabs)
- **State Management:** Zustand
- **API Client:** Axios with interceptors
- **Maps:** React Native Maps
- **Location:** Expo Location
- **Payments:** @stripe/stripe-react-native
- **Real-time:** Socket.IO client
- **Storage:** Expo SecureStore

### UI Components
- **Design System:** Custom components (Card, Button, Input)
- **Icons:** @expo/vector-icons
- **Animations:** React Native Reanimated

---

## Phase Breakdown

### Phase 0 — Decisions ✅ COMPLETE

**Completed:**
- ✅ React Native for iOS/Android
- ✅ Expo for rapid development
- ✅ TypeScript for type safety
- ✅ Zustand for lightweight state management
- ✅ React Native Maps for delivery tracking
- ✅ JWT auth + refresh tokens

---

### Phase 1 — Foundation ✅ COMPLETE

**Completed:**
- ✅ Project structure setup
- ✅ TypeScript configuration (strict mode)
- ✅ API client (`src/services/api.ts` - 239 lines)
- ✅ Auth store (`src/store/authStore.ts` - 118 lines)
- ✅ Cart store (`src/store/cartStore.ts`)
- ✅ All dependencies installed

---

### Phase 2 — Navigation & Screens 🔄 IN PROGRESS

**Week 7 Day 1 Complete:**
- ✅ RootNavigator (Auth vs Main app logic)
- ✅ AuthNavigator (Welcome, Login, Register)
- ✅ MainTabNavigator (Home, Orders, Profile tabs)
- ✅ MainStack (Detail screens: ChefDetail, Cart, Checkout, etc.)
- ✅ Location permissions configured (iOS + Android)
- ✅ Environment variables setup (.env)

**14 Screens Scaffolded:**

| Screen | Path | Status |
|--------|------|--------|
| WelcomeScreen | auth/WelcomeScreen.tsx | ✅ Complete |
| LoginScreen | auth/LoginScreen.tsx | ✅ Complete |
| RegisterScreen | auth/RegisterScreen.tsx | ✅ Complete |
| HomeScreen | home/HomeScreen.tsx | 🔄 API integration |
| ChefDetailScreen | chef/ChefDetailScreen.tsx | ⏳ Needs API |
| MenuItemScreen | chef/MenuItemScreen.tsx | ⏳ Scaffolded |
| CartScreen | order/CartScreen.tsx | ⏳ Needs wiring |
| CheckoutScreen | order/CheckoutScreen.tsx | ⏳ Needs Stripe |
| OrderConfirmationScreen | order/OrderConfirmationScreen.tsx | ⏳ Scaffolded |
| OrderDetailScreen | order/OrderDetailScreen.tsx | ⏳ Scaffolded |
| OrderTrackingScreen | order/OrderTrackingScreen.tsx | ⏳ Needs WebSocket |
| OrdersScreen | orders/OrdersScreen.tsx | ⏳ Needs API |
| ProfileScreen | profile/ProfileScreen.tsx | ⏳ Scaffolded |
| SettingsScreen | profile/SettingsScreen.tsx | ⏳ Scaffolded |

---

### Phase 3 — Chef Discovery (Week 7) 🔄 IN PROGRESS

**Goal:** Customer can browse chefs and view menus

#### Day 1 Complete ✅
- Navigation structure
- Location permissions
- API service connected to core server (port 8081)
- HomeScreen with chef discovery logic

#### Day 2-3 Tasks (In Progress)
- [ ] Test app on device/simulator
- [ ] Enhance ChefCard component
- [ ] Search & filter UI
- [ ] ChefDetailScreen API integration
- [ ] Menu browsing functionality
- [ ] Reviews display

**Expected Outcome:**
- Customer can browse 5+ chefs in area
- Chef profile shows menu items
- Can tap items to view details

---

### Phase 4 — Ordering & Payment (Week 8) ⏳ NOT STARTED

**Goal:** Customer can complete purchase

**Features to Implement:**
1. **Cart Management**
   - Add/remove items
   - Quantity adjustment
   - Cart persistence
   - Cart badge count

2. **Checkout Flow**
   - Delivery address input
   - Tip selection (15%, 18%, 20%, custom)
   - Order summary
   - Promo code validation

3. **Stripe Payment Sheet**
   - Initialize Payment Sheet
   - Present payment UI
   - Handle success/failure
   - Order confirmation

4. **Order History**
   - List past orders
   - View order details
   - Reorder functionality

**API Endpoints Used:**
- `POST /orders` - Create order
- `POST /orders/:id/create-payment-intent` - Get clientSecret
- `GET /orders` - List orders
- `GET /orders/:id` - Order details

---

### Phase 5 — Order Tracking (Week 7-8) ⏳ NOT STARTED

**Goal:** Real-time delivery tracking

**Features to Implement:**
1. **Live Map**
   - Driver location marker
   - Customer location marker
   - Chef location marker
   - Animated driver movement

2. **Status Timeline**
   - Visual progress indicator
   - Status timestamps
   - Estimated delivery time

3. **WebSocket Integration**
   - Subscribe to order updates
   - Receive driver location stream
   - ETA updates
   - Status change notifications

4. **Push Notifications**
   - Order confirmed
   - Chef accepted order
   - Driver assigned
   - Order picked up
   - Order delivered

**Code Example:**
```typescript
// WebSocket connection
const socket = io(process.env.EXPO_PUBLIC_WS_URL, {
  auth: { token: accessToken }
});

socket.emit('subscribe:order', { orderId });

socket.on('order:status_update', (data) => {
  // Update UI
});

socket.on('driver:location_update', (data) => {
  // Update map marker
});
```

---

## App Architecture

### Directory Structure

```
apps/customer-mobile/
├── App.tsx                    # Entry point with NavigationContainer
├── app.json                   # Expo configuration
├── .env                       # Environment variables
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx       # Auth vs Main logic
│   │   ├── AuthNavigator.tsx       # Login, Register
│   │   ├── MainTabNavigator.tsx    # Bottom tabs
│   │   └── types.ts                # Navigation types
│   ├── screens/
│   │   ├── auth/                   # Auth screens
│   │   ├── home/                   # Home screen
│   │   ├── chef/                   # Chef-related screens
│   │   ├── order/                  # Order screens
│   │   ├── orders/                 # Order history
│   │   └── profile/                # Profile screens
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   ├── chef/                   # Chef-specific components
│   │   └── order/                  # Order-specific components
│   ├── services/
│   │   ├── api.ts                  # API client (239 lines)
│   │   ├── location.ts             # Location service (129 lines)
│   │   └── websocket.ts            # WebSocket client
│   ├── store/
│   │   ├── authStore.ts            # Auth state (118 lines)
│   │   ├── cartStore.ts            # Cart state
│   │   └── orderStore.ts           # Order state
│   ├── hooks/
│   │   ├── useLocation.ts          # Location hook
│   │   └── useWebSocket.ts         # WebSocket hook
│   ├── types/
│   │   ├── api.ts                  # API types
│   │   ├── navigation.ts           # Navigation types
│   │   └── domain.ts               # Domain models
│   └── utils/
│       ├── formatters.ts           # Formatters
│       └── validators.ts           # Validators
```

---

## API Integration

### API Client Configuration

**File:** `src/services/api.ts`

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api';

// Interceptor adds auth token
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor handles 401 (token refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await authStore.getState().refreshToken();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Available API Methods

```typescript
// Auth
api.register({ email, password, firstName, lastName, role })
api.login({ email, password })
api.refreshToken()

// Chefs
api.searchChefs({ lat, lng, radius, cuisineType })
api.getChef(chefId)
api.getChefMenus(chefId)
api.getChefReviews(chefId)

// Orders
api.createOrder({ chefId, deliveryAddress, items })
api.createPaymentIntent(orderId)
api.getOrders({ status, page, limit })
api.getOrder(orderId)
api.getOrderTracking(orderId)
api.cancelOrder(orderId, reason)

// Users
api.getProfile()
api.updateProfile(data)
```

---

## State Management

### Auth Store (Zustand)

**File:** `src/store/authStore.ts`

```typescript
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Usage
const { user, isAuthenticated, login } = useAuthStore();
```

### Cart Store

**File:** `src/store/cartStore.ts`

```typescript
interface CartStore {
  items: CartItem[];
  chefId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}
```

---

## Location Services

### Permission Handling

**File:** `src/services/location.ts`

```typescript
async function getCurrentLocation() {
  // Request permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    // Fallback to Hamilton, ON
    return { latitude: 43.2207, longitude: -79.7651 };
  }
  
  // Get location
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}
```

---

## Stripe Payment Integration

### Setup

**File:** `app.json`

```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.ridendine",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

### Payment Flow

```typescript
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

// 1. Create order
const order = await api.createOrder(orderData);

// 2. Get payment intent
const { clientSecret } = await api.createPaymentIntent(order.id);

// 3. Initialize Payment Sheet
const { error } = await initPaymentSheet({
  merchantDisplayName: 'RideNDine',
  paymentIntentClientSecret: clientSecret,
});

// 4. Present Payment Sheet
const { error: paymentError } = await presentPaymentSheet();

if (!paymentError) {
  // Success - navigate to confirmation
  navigation.navigate('OrderConfirmation', { orderId: order.id });
}
```

---

## Environment Variables

**File:** `.env`

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.100.133:8081
EXPO_PUBLIC_WS_URL=ws://192.168.100.133:8081

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Note:** Use LAN IP for testing on physical devices, `localhost` for simulators.

---

## Testing Strategy

### Local Testing

```bash
cd apps/customer-mobile

# Start Expo
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Physical Device
# Scan QR code with Expo Go app
```

### Test Scenarios

1. **Authentication**
   - [ ] Register new account
   - [ ] Login with existing account
   - [ ] Token refresh works
   - [ ] Logout clears state

2. **Chef Discovery**
   - [ ] Location permission prompt
   - [ ] Chef list loads
   - [ ] Search filters work
   - [ ] Can navigate to chef detail

3. **Ordering**
   - [ ] Add items to cart
   - [ ] Cart badge updates
   - [ ] Checkout flow completes
   - [ ] Payment succeeds

4. **Tracking**
   - [ ] Order tracking loads
   - [ ] Driver location updates
   - [ ] ETA displays
   - [ ] Status changes reflect

---

## Known Issues & TODOs

### Current Issues
- [ ] Core server vs NestJS API mismatch (using core on 8081)
- [ ] Some API endpoints return different structure than expected
- [ ] Image upload not implemented

### Week 7-8 TODOs
- [ ] Complete HomeScreen UI polish
- [ ] Wire ChefDetailScreen to API
- [ ] Implement cart functionality
- [ ] Integrate Stripe Payment Sheet
- [ ] Add push notifications
- [ ] Connect WebSocket for tracking

---

## Performance Optimization

### Planned Optimizations
- Image lazy loading
- FlatList virtualization
- API response caching
- Debounced search input
- Optimistic UI updates

---

## Success Criteria

### Week 7 Checkpoint
- [ ] Can browse 5+ chefs
- [ ] Chef profile displays menu
- [ ] Navigation works smoothly
- [ ] Location-based search functional

### Week 8 Checkpoint
- [ ] Can add items to cart
- [ ] Stripe payment completes
- [ ] Order appears in backend
- [ ] Order history displays

### Final (End of Week 10)
- [ ] Full order cycle works
- [ ] Real-time tracking functional
- [ ] Push notifications send
- [ ] No critical bugs

---

**Current Status:** Week 7 Day 1 complete ✅  
**Next Steps:** Test on device, enhance chef discovery UI  
**Estimated Completion:** End of Week 8 (7 days)
