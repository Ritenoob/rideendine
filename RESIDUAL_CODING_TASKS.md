# Residual Coding Tasks & Incomplete Work

**Generated:** 2026-01-31  
**Project:** RideNDine Delivery Platform  
**Overall Status:** ~45% Complete

---

## Executive Summary

The RideNDine project has a solid foundation with:
- ✅ Core demo server (fully functional)
- ✅ Backend API (NestJS with 42 REST endpoints + WebSocket)
- ✅ Database schema (defined with migrations)
- ✅ Admin web panel (mostly complete)
- ✅ Basic app structures for all roles

**Critical Gaps:**
- ❌ Frontend apps not wired to backend API
- ❌ Real-time features not integrated
- ❌ Payment flows incomplete
- ❌ Service split prototypes not integrated
- ❌ Testing infrastructure missing

---

## 1. BACKEND API - RESIDUAL TASKS

### 1.1 Real-Time Integration (HIGH PRIORITY)
**Status:** Partially implemented, not wired

**Issues:**
- [`orders.service.ts`](services/api/src/orders/orders.service.ts:17) - RealtimeService import commented out
- No WebSocket event emission in order state transitions
- RealtimeService exists but not integrated into OrdersService

**Tasks:**
```typescript
// In orders.service.ts, uncomment and integrate:
- Line 17: Uncomment RealtimeService import
- Add constructor injection of RealtimeService
- Add emit calls in all state transition methods:
  * createOrder() → emit 'order:created'
  * acceptOrder() → emit 'order:accepted'
  * markReady() → emit 'order:ready'
  * assignDriver() → emit 'order:assigned'
  * markPickedUp() → emit 'order:picked_up'
  * markInTransit() → emit 'order:in_transit'
  * markDelivered() → emit 'order:delivered'
  * cancelOrder() → emit 'order:cancelled'
```

**Files to Modify:**
- [`services/api/src/orders/orders.service.ts`](services/api/src/orders/orders.service.ts)
- [`services/api/src/realtime/realtime.service.ts`](services/api/src/realtime/realtime.service.ts)

**Estimated Effort:** 2-3 hours

---

### 1.2 Image Upload Endpoint (HIGH PRIORITY)
**Status:** Missing

**Required For:**
- Chef menu item images
- User profile photos
- Delivery proof photos (driver)

**Tasks:**
1. Install Multer for file uploads:
   ```bash
   cd services/api
   npm install multer @nestjs/platform-express
   npm install -D @types/multer
   ```

2. Create upload module:
   - `services/api/src/upload/upload.module.ts`
   - `services/api/src/upload/upload.controller.ts`
   - `services/api/src/upload/upload.service.ts`

3. Implement endpoints:
   - `POST /upload/image` - Upload single image
   - `POST /upload/images` - Upload multiple images
   - `DELETE /upload/:filename` - Delete uploaded file

4. Configure storage:
   - Local storage for development
   - S3 integration for production

**Files to Create:**
- `services/api/src/upload/upload.module.ts`
- `services/api/src/upload/upload.controller.ts`
- `services/api/src/upload/upload.service.ts`
- `services/api/src/upload/dto/upload.dto.ts`

**Estimated Effort:** 4-5 hours

---

### 1.3 Push Notification Registration (HIGH PRIORITY)
**Status:** Missing

**Required For:**
- Order status updates
- New order notifications (chefs)
- Assignment notifications (drivers)
- Delivery updates (customers)

**Tasks:**
1. Create devices table migration:
   ```sql
   CREATE TABLE devices (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     device_type TEXT NOT NULL, -- 'ios', 'android', 'web'
     token TEXT NOT NULL,
     platform TEXT NOT NULL, -- 'expo', 'fcm', 'apns'
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, token)
   );
   ```

2. Create devices module:
   - `services/api/src/devices/devices.module.ts`
   - `services/api/src/devices/devices.controller.ts`
   - `services/api/src/devices/devices.service.ts`

3. Implement endpoints:
   - `POST /devices` - Register device token
   - `PATCH /devices/:id` - Update device
   - `DELETE /devices/:id` - Unregister device
   - `GET /users/me/devices` - List user's devices

4. Integrate with Expo/FCM:
   - Install Expo Server SDK
   - Create notification service
   - Add notification triggers in order state transitions

**Files to Create:**
- `database/migrations/007_devices.sql`
- `services/api/src/devices/devices.module.ts`
- `services/api/src/devices/devices.controller.ts`
- `services/api/src/devices/devices.service.ts`
- `services/api/src/notifications/notifications.service.ts`

**Estimated Effort:** 6-8 hours

---

### 1.4 Service Split Integration (MEDIUM PRIORITY)
**Status:** Prototypes exist, not integrated

**Current State:**
- [`services/dispatch/server.js`](services/dispatch/server.js) - 113 lines, Haversine scoring
- [`services/routing/server.js`](services/routing/server.js) - 223 lines, Provider abstraction
- [`services/realtime/server.js`](services/realtime/server.js) - 84 lines, HTTP/WS proxy

**Issues:**
- No inter-service communication
- No database integration
- No auth integration
- Not wired to main API

**Tasks:**
1. **Option A: Keep Monolithic (Recommended for MVP)**
   - Move logic from prototypes into NestJS modules
   - Delete prototype servers
   - Consolidate into single API service

2. **Option B: Full Microservices (Future)**
   - Convert prototypes to NestJS microservices
   - Implement Redis/NATS for messaging
   - Add service discovery
   - Implement API gateway

**Recommendation:** Option A for now, defer microservices until scale requirements

**Estimated Effort:** 8-12 hours (Option A) or 40-60 hours (Option B)

---

### 1.5 API Enhancements (MEDIUM PRIORITY)

#### 1.5.1 Order ETA Calculation
**Status:** Endpoint exists, not implemented

**Tasks:**
- Implement ETA calculation using Mapbox/Google Maps API
- Add caching for ETA results
- Handle API rate limits

**Files to Modify:**
- [`services/api/src/orders/orders.service.ts`](services/api/src/orders/orders.service.ts)

**Estimated Effort:** 3-4 hours

#### 1.5.2 Driver Location Updates
**Status:** Endpoint exists, not fully implemented

**Tasks:**
- Implement GPS coordinate storage
- Add distance calculation (Haversine formula)
- Add location history tracking
- Implement real-time location broadcasting

**Files to Modify:**
- [`services/api/src/drivers/drivers.service.ts`](services/api/src/drivers/drivers.service.ts)

**Estimated Effort:** 4-5 hours

#### 1.5.3 Commission Settlement
**Status:** Calculator exists, payout logic missing

**Tasks:**
- Implement automatic payout scheduling
- Add Stripe Connect payout API integration
- Create payout history tracking
- Add payout failure handling and retry logic

**Files to Modify:**
- [`services/api/src/orders/commission-calculator.ts`](services/api/src/orders/commission-calculator.ts)
- [`services/api/src/stripe/stripe.service.ts`](services/api/src/stripe/stripe.service.ts)

**Estimated Effort:** 6-8 hours

---

## 2. CUSTOMER MOBILE APP - RESIDUAL TASKS

### 2.1 Navigation Setup (CRITICAL)
**Status:** Not implemented

**Current Issue:**
- [`App.js`](apps/customer-mobile/App.js) - Old demo code, not using App.tsx
- No root navigator configured
- No AuthStack or MainStack

**Tasks:**
1. Delete [`App.js`](apps/customer-mobile/App.js)
2. Create [`App.tsx`](apps/customer-mobile/App.tsx) with navigation structure:
   ```typescript
   // Structure:
   NavigationContainer
   ├── AuthStack (when not authenticated)
   │   ├── LoginScreen
   │   └── RegisterScreen
   └── MainStack (when authenticated)
       ├── TabNavigator
       │   ├── HomeScreen
       │   ├── OrdersScreen
       │   └── ProfileScreen
       ├── ChefDetailScreen
       ├── MenuItemScreen
       ├── CartScreen
       ├── CheckoutScreen
       ├── OrderConfirmationScreen
       ├── OrderDetailScreen
       ├── OrderTrackingScreen
       ├── ReviewScreen
       ├── SearchScreen
       └── SettingsScreen
   ```

3. Create navigation directory:
   - `apps/customer-mobile/src/navigation/AuthNavigator.tsx`
   - `apps/customer-mobile/src/navigation/MainNavigator.tsx`
   - `apps/customer-mobile/src/navigation/TabNavigator.tsx`
   - `apps/customer-mobile/src/navigation/index.tsx`

4. Configure deep linking:
   - `ridendine://track?orderId=...`

**Files to Create:**
- `apps/customer-mobile/App.tsx`
- `apps/customer-mobile/src/navigation/AuthNavigator.tsx`
- `apps/customer-mobile/src/navigation/MainNavigator.tsx`
- `apps/customer-mobile/src/navigation/TabNavigator.tsx`
- `apps/customer-mobile/src/navigation/index.tsx`
- `apps/customer-mobile/src/types/navigation.ts`

**Files to Delete:**
- `apps/customer-mobile/App.js`

**Estimated Effort:** 4-5 hours

---

### 2.2 API Integration (CRITICAL)
**Status:** Screens exist, not wired to API

**Tasks:**

#### 2.2.1 HomeScreen
**File:** [`apps/customer-mobile/src/screens/home/HomeScreen.tsx`](apps/customer-mobile/src/screens/home/HomeScreen.tsx)

**Required Changes:**
- Request location permission
- Fetch chefs from API: `api.searchChefs({ lat, lng, radius: 10 })`
- Display ChefCard list
- Add pull-to-refresh
- Handle loading/error states

**Estimated Effort:** 2-3 hours

#### 2.2.2 ChefDetailScreen
**File:** [`apps/customer-mobile/src/screens/chef/ChefDetailScreen.tsx`](apps/customer-mobile/src/screens/chef/ChefDetailScreen.tsx)

**Required Changes:**
- Fetch chef profile: `api.getChef(chefId)`
- Fetch chef menus: `api.getChefMenus(chefId)`
- Display menu items with MenuItemCard
- Add to cart functionality (update cartStore)
- Display chef reviews

**Estimated Effort:** 2-3 hours

#### 2.2.3 CartScreen
**File:** [`apps/customer-mobile/src/screens/order/CartScreen.tsx`](apps/customer-mobile/src/screens/order/CartScreen.tsx)

**Required Changes:**
- Wire to cartStore
- Implement quantity adjustment
- Implement remove item
- Calculate totals
- Add delivery address validation
- Add promo code validation
- Navigate to CheckoutScreen

**Estimated Effort:** 2-3 hours

#### 2.2.4 CheckoutScreen
**File:** [`apps/customer-mobile/src/screens/order/CheckoutScreen.tsx` (if exists)**

**Required Changes:**
- Display order summary
- Collect delivery address
- Collect tip selection
- Validate all inputs
- Call `api.createOrder()` before payment
- Initialize Stripe Payment Sheet

**Estimated Effort:** 3-4 hours

#### 2.2.5 OrdersScreen
**File:** [`apps/customer-mobile/src/screens/orders/OrdersScreen.tsx` (if exists)**

**Required Changes:**
- Fetch user orders: `api.getOrders()`
- Display order list
- Navigate to OrderDetailScreen
- Add pull-to-refresh

**Estimated Effort:** 2-3 hours

#### 2.2.6 OrderDetailScreen
**File:** [`apps/customer-mobile/src/screens/order/OrderDetailScreen.tsx` (if exists)**

**Required Changes:**
- Fetch order details: `api.getOrder(orderId)`
- Display order timeline
- Display order items
- Display delivery info
- Navigate to OrderTrackingScreen

**Estimated Effort:** 2-3 hours

#### 2.2.7 OrderTrackingScreen
**File:** [`apps/customer-mobile/src/screens/order/OrderTrackingScreen.tsx` (if exists)**

**Required Changes:**
- Connect to WebSocket for real-time updates
- Display map with driver location
- Display ETA
- Display order status timeline
- Handle driver location updates

**Estimated Effort:** 4-5 hours

#### 2.2.8 ProfileScreen
**File:** [`apps/customer-mobile/src/screens/profile/ProfileScreen.tsx` (if exists)**

**Required Changes:**
- Fetch user profile: `api.getMe()`
- Display user info
- Navigate to EditProfileScreen
- Navigate to SettingsScreen
- Implement logout

**Estimated Effort:** 2-3 hours

**Total Estimated Effort for API Integration:** 19-27 hours

---

### 2.3 Stripe Payment Integration (CRITICAL)
**Status:** SDK installed, not integrated

**Tasks:**
1. Configure Stripe in [`app.json`](apps/customer-mobile/app.json):
   ```json
   {
     "plugins": [
       [
         "@stripe/stripe-react-native",
         {
           "androidPackage": "com.stripe.android.reactnative.StripeReactNativePackage"
         }
       ]
     ]
   }
   ```

2. Create payment service:
   - `apps/customer-mobile/src/services/payment.ts`

3. Implement CheckoutScreen:
   - Create order via API
   - Initialize Payment Sheet with clientSecret
   - Present Payment Sheet
   - Handle payment success/failure
   - Navigate to OrderConfirmationScreen

4. Handle payment errors:
   - Network errors
   - Payment declined
   - Insufficient funds
   - Card errors

**Files to Create:**
- `apps/customer-mobile/src/services/payment.ts`

**Files to Modify:**
- `apps/customer-mobile/app.json`
- `apps/customer-mobile/src/screens/order/CheckoutScreen.tsx`
- `apps/customer-mobile/src/screens/order/OrderConfirmationScreen.tsx`

**Estimated Effort:** 6-8 hours

---

### 2.4 Location Services (HIGH PRIORITY)
**Status:** SDK installed, not implemented

**Tasks:**
1. Request location permissions in [`app.json`](apps/customer-mobile/app.json):
   ```json
   {
     "expo": {
       "ios": {
         "infoPlist": {
           "NSLocationWhenInUseUsageDescription": "Allow location to find nearby chefs"
         }
       },
       "android": {
         "permissions": [
           "ACCESS_FINE_LOCATION",
           "ACCESS_COARSE_LOCATION"
         ]
       }
     }
   }
   ```

2. Create location hook:
   - `apps/customer-mobile/src/hooks/useLocation.ts`

3. Implement in HomeScreen:
   - Request permission on mount
   - Get current location
   - Pass to chef search

**Files to Create:**
- `apps/customer-mobile/src/hooks/useLocation.ts`

**Files to Modify:**
- `apps/customer-mobile/app.json`
- `apps/customer-mobile/src/screens/home/HomeScreen.tsx`

**Estimated Effort:** 2-3 hours

---

### 2.5 WebSocket Integration (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Create WebSocket service:
   - `apps/customer-mobile/src/services/websocket.ts`

2. Implement connection management:
   - Connect on app start (if authenticated)
   - Disconnect on logout
   - Auto-reconnect on disconnect
   - Handle connection errors

3. Implement event listeners:
   - `order:status_update` - Update order status
   - `driver:location_update` - Update driver location
   - `order:assigned` - New driver assigned
   - `order:delivered` - Order delivered

4. Integrate into screens:
   - OrderTrackingScreen - Subscribe to order updates
   - OrderDetailScreen - Subscribe to order updates
   - OrdersScreen - Subscribe to new orders

**Files to Create:**
- `apps/customer-mobile/src/services/websocket.ts`

**Files to Modify:**
- `apps/customer-mobile/src/screens/order/OrderTrackingScreen.tsx`
- `apps/customer-mobile/src/screens/order/OrderDetailScreen.tsx`
- `apps/customer-mobile/src/screens/orders/OrdersScreen.tsx`

**Estimated Effort:** 4-5 hours

---

### 2.6 Push Notifications (HIGH PRIORITY)
**Status:** Not configured

**Tasks:**
1. Configure Expo Push Notifications:
   - Install expo-notifications
   - Configure in [`app.json`](apps/customer-mobile/app.json)
   - Request notification permissions

2. Register device token:
   - Get Expo push token
   - Send to backend: `POST /devices`

3. Handle incoming notifications:
   - Create notification handler
   - Navigate to relevant screen on tap
   - Display in-app notifications

4. Test notification flow:
   - Order status updates
   - Driver assignment
   - Delivery updates

**Files to Create:**
- `apps/customer-mobile/src/services/notifications.ts`

**Files to Modify:**
- `apps/customer-mobile/app.json`
- `apps/customer-mobile/App.tsx`

**Estimated Effort:** 4-5 hours

---

### 2.7 Error Handling & Loading States (MEDIUM PRIORITY)
**Status:** Basic implementation

**Tasks:**
1. Add error boundaries
2. Implement retry logic for failed API calls
3. Add loading indicators for all async operations
4. Add user-friendly error messages
5. Implement offline detection and handling

**Estimated Effort:** 4-5 hours

---

## 3. CHEF DASHBOARD - RESIDUAL TASKS

### 3.1 API Integration (CRITICAL)
**Status:** Basic structure exists, not wired to API

**Tasks:**

#### 3.1.1 Dashboard Home
**File:** [`apps/chef-dashboard/src/app/dashboard/page.tsx`](apps/chef-dashboard/src/app/dashboard/page.tsx)

**Required Changes:**
- Fetch chef stats from API
- Display active orders
- Display today's earnings
- Display pending orders count

**Estimated Effort:** 2-3 hours

#### 3.1.2 Orders Page
**File:** [`apps/chef-dashboard/src/app/dashboard/orders/page.tsx`](apps/chef-dashboard/src/app/dashboard/orders/page.tsx)

**Required Changes:**
- Fetch chef orders: `api.getChefOrders(chefId)`
- Display order list with status
- Implement accept/reject buttons
- Implement mark ready button
- Add order detail modal
- Add WebSocket for real-time updates

**Estimated Effort:** 4-5 hours

#### 3.1.3 Menu Page
**File:** [`apps/chef-dashboard/src/app/dashboard/menu/page.tsx`](apps/chef-dashboard/src/app/dashboard/menu/page.tsx)

**Required Changes:**
- Fetch chef menus: `api.getChefMenus(chefId)`
- Display menu items
- Implement add/edit/delete menu items
- Implement image upload
- Implement availability toggle

**Estimated Effort:** 6-8 hours

#### 3.1.4 Earnings Page
**File:** [`apps/chef-dashboard/src/app/dashboard/earnings/page.tsx`](apps/chef-dashboard/src/app/dashboard/earnings/page.tsx)

**Required Changes:**
- Fetch chef earnings: `api.getChefEarnings(chefId)`
- Display earnings breakdown
- Display payout history
- Display commission breakdown

**Estimated Effort:** 2-3 hours

#### 3.1.5 Settings Page
**File:** [`apps/chef-dashboard/src/app/dashboard/settings/page.tsx`](apps/chef-dashboard/src/app/dashboard/settings/page.tsx)

**Required Changes:**
- Fetch chef profile: `api.getChef(chefId)`
- Implement profile update form
- Implement operating hours configuration
- Implement delivery radius configuration
- Implement minimum order configuration

**Estimated Effort:** 3-4 hours

#### 3.1.6 Stripe Page
**File:** [`apps/chef-dashboard/src/app/dashboard/stripe/page.tsx`](apps/chef-dashboard/src/app/dashboard/stripe/page.tsx)

**Required Changes:**
- Check Stripe onboarding status: `api.getStripeStatus(chefId)`
- Display onboarding link if not onboarded
- Display dashboard link if onboarded
- Display payout settings

**Estimated Effort:** 2-3 hours

**Total Estimated Effort for API Integration:** 19-26 hours

---

### 3.2 Real-Time Order Notifications (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Create WebSocket client service
2. Connect to `/realtime` namespace
3. Subscribe to chef-specific order events:
   - `order:created` - New order received
   - `order:cancelled` - Order cancelled
4. Display in-app notifications
5. Update order list in real-time
6. Play notification sound

**Files to Create:**
- `apps/chef-dashboard/src/services/websocket.ts`

**Files to Modify:**
- `apps/chef-dashboard/src/app/dashboard/orders/page.tsx`
- `apps/chef-dashboard/src/app/dashboard/page.tsx`

**Estimated Effort:** 3-4 hours

---

### 3.3 Image Upload (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Wait for backend image upload endpoint (Section 1.2)
2. Implement image upload component
3. Integrate with menu item form
4. Handle upload progress
5. Display uploaded images
6. Implement image deletion

**Estimated Effort:** 4-5 hours

---

### 3.4 Authentication & Protected Routes (MEDIUM PRIORITY)
**Status:** Basic structure exists

**Tasks:**
1. Implement login page with API integration
2. Implement registration page with API integration
3. Create protected route middleware
4. Implement logout functionality
5. Handle token refresh

**Files to Modify:**
- `apps/chef-dashboard/src/app/login/page.tsx`
- `apps/chef-dashboard/src/app/register/page.tsx`
- `apps/chef-dashboard/src/lib/api.ts`
- `apps/chef-dashboard/src/store/authStore.ts`

**Estimated Effort:** 3-4 hours

---

## 4. DRIVER MOBILE APP - RESIDUAL TASKS

### 4.1 Navigation Setup (CRITICAL)
**Status:** Basic structure exists

**Tasks:**
1. Create [`App.tsx`](apps/driver-mobile/src/App.tsx) with navigation structure:
   ```typescript
   // Structure:
   NavigationContainer
   ├── AuthStack (when not authenticated)
   │   ├── LoginScreen
   │   └── RegisterScreen
   └── MainStack (when authenticated)
       ├── TabNavigator
       │   ├── HomeScreen
       │   ├── EarningsScreen
       │   └── ProfileScreen
       ├── AvailableOrdersScreen
       ├── ActiveDeliveryScreen
       └── SettingsScreen
   ```

2. Create navigation directory:
   - `apps/driver-mobile/src/navigation/AuthNavigator.tsx`
   - `apps/driver-mobile/src/navigation/MainNavigator.tsx`
   - `apps/driver-mobile/src/navigation/TabNavigator.tsx`

**Files to Create:**
- `apps/driver-mobile/src/navigation/AuthNavigator.tsx`
- `apps/driver-mobile/src/navigation/MainNavigator.tsx`
- `apps/driver-mobile/src/navigation/TabNavigator.tsx`

**Estimated Effort:** 3-4 hours

---

### 4.2 API Integration (CRITICAL)
**Status:** Basic structure exists, not wired to API

**Tasks:**

#### 4.2.1 HomeScreen
**File:** [`apps/driver-mobile/src/screens/home/HomeScreen.tsx`](apps/driver-mobile/src/screens/home/HomeScreen.tsx)

**Required Changes:**
- Implement online/offline toggle
- Display driver status
- Navigate to AvailableOrdersScreen
- Navigate to ActiveDeliveryScreen

**Estimated Effort:** 2-3 hours

#### 4.2.2 AvailableOrdersScreen
**File:** [`apps/driver-mobile/src/screens/orders/AvailableOrdersScreen.tsx`](apps/driver-mobile/src/screens/orders/AvailableOrdersScreen.tsx)

**Required Changes:**
- Fetch available orders: `api.getAvailableOrders()`
- Display order list with pickup/delivery locations
- Implement accept/decline buttons
- Display order details
- Calculate distance to pickup location

**Estimated Effort:** 3-4 hours

#### 4.2.3 ActiveDeliveryScreen
**File:** [`apps/driver-mobile/src/screens/orders/ActiveDeliveryScreen.tsx`](apps/driver-mobile/src/screens/orders/ActiveDeliveryScreen.tsx)

**Required Changes:**
- Fetch active delivery: `api.getActiveDelivery(driverId)`
- Display order details
- Display pickup/delivery addresses
- Implement mark picked up button
- Implement mark in-transit button
- Implement mark delivered button
- Navigate to map for directions

**Estimated Effort:** 4-5 hours

#### 4.2.4 EarningsScreen
**File:** [`apps/driver-mobile/src/screens/earnings/EarningsScreen.tsx`](apps/driver-mobile/src/screens/earnings/EarningsScreen.tsx)

**Required Changes:**
- Fetch driver earnings: `api.getDriverEarnings(driverId)`
- Display earnings breakdown
- Display delivery history
- Display payout history

**Estimated Effort:** 2-3 hours

#### 4.2.5 ProfileScreen
**File:** [`apps/driver-mobile/src/screens/profile/ProfileScreen.tsx`](apps/driver-mobile/src/screens/profile/ProfileScreen.tsx)

**Required Changes:**
- Fetch driver profile: `api.getDriver(driverId)`
- Display driver info
- Implement profile update form
- Implement vehicle info update
- Implement logout

**Estimated Effort:** 2-3 hours

**Total Estimated Effort for API Integration:** 13-18 hours

---

### 4.3 GPS Background Tracking (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Configure background location in [`app.json`](apps/driver-mobile/app.json):
   ```json
   {
     "expo": {
       "ios": {
         "infoPlist": {
           "NSLocationAlwaysAndWhenInUseUsageDescription": "Allow location for delivery tracking"
         }
       },
       "android": {
         "permissions": [
           "ACCESS_FINE_LOCATION",
           "ACCESS_BACKGROUND_LOCATION"
         ]
       }
     }
   }
   ```

2. Create background location service:
   - `apps/driver-mobile/src/services/backgroundLocation.ts`

3. Implement location updates:
   - Start tracking when driver goes online
   - Stop tracking when driver goes offline
   - Send location updates to backend: `POST /drivers/location`
   - Handle location errors

4. Optimize battery usage:
   - Adjust update frequency based on state
   - Use significant location changes when idle

**Files to Create:**
- `apps/driver-mobile/src/services/backgroundLocation.ts`

**Files to Modify:**
- `apps/driver-mobile/app.json`
- `apps/driver-mobile/src/screens/home/HomeScreen.tsx`
- `apps/driver-mobile/src/screens/orders/ActiveDeliveryScreen.tsx`

**Estimated Effort:** 6-8 hours

---

### 4.4 Navigation Integration (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Integrate Google Maps/Apple Maps:
   - Install react-native-maps
   - Configure API keys

2. Implement turn-by-turn navigation:
   - Open Google Maps with directions
   - Open Apple Maps with directions
   - Handle navigation completion

3. Display pickup/delivery locations on map:
   - Show pickup marker
   - Show delivery marker
   - Show route between points

**Files to Create:**
- `apps/driver-mobile/src/services/navigation.ts`

**Files to Modify:**
- `apps/driver-mobile/src/screens/orders/AvailableOrdersScreen.tsx`
- `apps/driver-mobile/src/screens/orders/ActiveDeliveryScreen.tsx`

**Estimated Effort:** 4-5 hours

---

### 4.5 Photo Upload for Proof (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Install expo-camera:
   ```bash
   cd apps/driver-mobile
   npx expo install expo-camera expo-image-picker
   ```

2. Create camera component:
   - `apps/driver-mobile/src/components/CameraCapture.tsx`

3. Implement photo capture:
   - Capture pickup photo
   - Capture delivery photo
   - Upload to backend
   - Display captured photos

4. Integrate into ActiveDeliveryScreen:
   - Add photo capture before mark picked up
   - Add photo capture before mark delivered

**Files to Create:**
- `apps/driver-mobile/src/components/CameraCapture.tsx`

**Files to Modify:**
- `apps/driver-mobile/src/screens/orders/ActiveDeliveryScreen.tsx`

**Estimated Effort:** 4-5 hours

---

### 4.6 WebSocket Integration (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Create WebSocket service:
   - `apps/driver-mobile/src/services/websocket.ts`

2. Implement connection management:
   - Connect when driver goes online
   - Disconnect when driver goes offline
   - Auto-reconnect on disconnect

3. Implement event listeners:
   - `order:assigned` - New order assigned
   - `order:cancelled` - Order cancelled
   - `order:updated` - Order status updated

4. Integrate into screens:
   - AvailableOrdersScreen - Subscribe to new orders
   - ActiveDeliveryScreen - Subscribe to order updates

**Files to Create:**
- `apps/driver-mobile/src/services/websocket.ts`

**Files to Modify:**
- `apps/driver-mobile/src/screens/orders/AvailableOrdersScreen.tsx`
- `apps/driver-mobile/src/screens/orders/ActiveDeliveryScreen.tsx`

**Estimated Effort:** 3-4 hours

---

### 4.7 Push Notifications (HIGH PRIORITY)
**Status:** Not configured

**Tasks:**
1. Configure Expo Push Notifications
2. Register device token
3. Handle incoming notifications:
   - New order assignments
   - Order cancellations
   - Order updates

**Estimated Effort:** 3-4 hours

---

## 5. ADMIN WEB - RESIDUAL TASKS

### 5.1 Bulk Actions (MEDIUM PRIORITY)
**Status:** Partially complete

**Current State:**
- ✅ Chefs page: Bulk approve/reject
- ✅ Disputes page: Bulk status updates
- ❌ Drivers page: Bulk actions pending
- ❌ Users page: Bulk actions pending
- ❌ Orders page: Bulk actions pending

**Tasks:**

#### 5.1.1 Drivers Page
**File:** [`apps/admin-web/src/app/dashboard/drivers/page.tsx`](apps/admin-web/src/app/dashboard/drivers/page.tsx)

**Required Changes:**
- Add checkbox column to table
- Add "Select All" checkbox
- Add bulk approve button
- Add bulk reject button
- Add bulk suspend button
- Implement bulk API calls

**Estimated Effort:** 2-3 hours

#### 5.1.2 Users Page
**File:** [`apps/admin-web/src/app/dashboard/users/page.tsx`](apps/admin-web/src/app/dashboard/users/page.tsx)

**Required Changes:**
- Add checkbox column to table
- Add "Select All" checkbox
- Add bulk suspend button
- Add bulk activate button
- Add bulk delete button
- Implement bulk API calls

**Estimated Effort:** 2-3 hours

#### 5.1.3 Orders Page
**File:** [`apps/admin-web/src/app/dashboard/orders/page.tsx`](apps/admin-web/src/app/dashboard/orders/page.tsx)

**Required Changes:**
- Add checkbox column to table
- Add "Select All" checkbox
- Add bulk cancel button
- Add bulk refund button
- Add bulk status update button
- Implement bulk API calls

**Estimated Effort:** 2-3 hours

**Total Estimated Effort for Bulk Actions:** 6-9 hours

---

### 5.2 Loading States (MEDIUM PRIORITY)
**Status:** Basic implementation

**Tasks:**
1. Add skeleton loaders for all data tables
2. Add skeleton loaders for charts
3. Add skeleton loaders for cards
4. Implement progressive loading for large datasets
5. Add loading spinners for buttons

**Files to Modify:**
- All admin dashboard pages

**Estimated Effort:** 4-5 hours

---

### 5.3 Error Handling (MEDIUM PRIORITY)
**Status:** Basic implementation

**Tasks:**
1. Add user-friendly error messages
2. Implement error boundary components
3. Add retry mechanisms for failed API calls
4. Add error logging
5. Display error toasts

**Files to Modify:**
- All admin dashboard pages
- `apps/admin-web/src/lib/api.ts`

**Estimated Effort:** 4-5 hours

---

### 5.4 Animations & Transitions (LOW PRIORITY)
**Status:** Not started

**Tasks:**
1. Add page transitions
2. Add modal animations
3. Add hover effects
4. Add loading animations
5. Add success/failure animations

**Estimated Effort:** 6-8 hours

---

### 5.5 Empty States (LOW PRIORITY)
**Status:** Basic implementation

**Tasks:**
1. Add illustrations/icons for empty states
2. Add call-to-action buttons
3. Add contextual empty states
4. Add empty states for all tables and lists

**Estimated Effort:** 3-4 hours

---

### 5.6 Accessibility (LOW PRIORITY)
**Status:** Partial implementation

**Tasks:**
1. Add full keyboard navigation
2. Optimize for screen readers
3. Implement focus management
4. Verify color contrast
5. Add ARIA labels

**Estimated Effort:** 6-8 hours

---

### 5.7 Toast Notification System (MEDIUM PRIORITY)
**Status:** Not started

**Tasks:**
1. Install toast library (react-hot-toast or similar)
2. Create toast notification component
3. Implement success notifications
4. Implement error notifications
5. Implement action confirmations
6. Implement notification queue management

**Estimated Effort:** 3-4 hours

---

## 6. DATABASE - RESIDUAL TASKS

### 6.1 Apply Migrations (CRITICAL)
**Status:** Schema defined, not applied

**Tasks:**
1. Run all migrations:
   ```bash
   cd services/api
   npm run db:migrate
   ```

2. Verify all tables created:
   - users
   - chefs
   - menus
   - menu_items
   - orders
   - order_items
   - order_status_history
   - payments
   - chef_ledger
   - driver_ledger
   - drivers
   - driver_locations
   - driver_assignments
   - reviews
   - admin_actions
   - platform_settings

**Estimated Effort:** 1-2 hours

---

### 6.2 Seed Data (MEDIUM PRIORITY)
**Status:** Basic test users only

**Tasks:**
1. Create comprehensive seed data:
   - Test customers (5-10)
   - Test chefs (5-10)
   - Test drivers (5-10)
   - Test menus with items (20-30 items)
   - Test orders (20-30 orders)
   - Test reviews (20-30 reviews)

2. Create seed script:
   - `database/seeds/002_comprehensive_seed.sql`

3. Run seed script:
   ```bash
   npm run db:seed
   ```

**Estimated Effort:** 3-4 hours

---

### 6.3 Indexes & Performance (MEDIUM PRIORITY)
**Status:** Not optimized

**Tasks:**
1. Add indexes for frequently queried columns:
   - users.email
   - chefs.user_id
   - orders.customer_id
   - orders.chef_id
   - orders.status
   - orders.created_at
   - driver_assignments.driver_id
   - driver_assignments.order_id
   - reviews.chef_id
   - reviews.driver_id

2. Analyze query performance
3. Optimize slow queries

**Estimated Effort:** 2-3 hours

---

## 7. TESTING - RESIDUAL TASKS

### 7.1 Unit Tests (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Set up testing framework (Jest)
2. Write unit tests for backend services:
   - AuthService
   - UsersService
   - ChefsService
   - OrdersService
   - DriversService
   - DispatchService
   - StripeService

3. Write unit tests for frontend components:
   - Customer mobile components
   - Chef dashboard components
   - Driver mobile components
   - Admin web components

**Estimated Effort:** 40-60 hours

---

### 7.2 Integration Tests (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Set up integration testing framework
2. Write integration tests for API endpoints:
   - Authentication flow
   - Order creation flow
   - Payment flow
   - Dispatch flow
   - Driver assignment flow

3. Write integration tests for frontend:
   - Customer order flow
   - Chef order management
   - Driver delivery flow

**Estimated Effort:** 30-40 hours

---

### 7.3 E2E Tests (MEDIUM PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Set up E2E testing framework (Cypress or Playwright)
2. Write E2E tests for critical user flows:
   - Customer places order
   - Chef accepts and prepares order
   - Driver delivers order
   - Admin manages platform

**Estimated Effort:** 20-30 hours

---

## 8. DEPLOYMENT & DEVOPS - RESIDUAL TASKS

### 8.1 CI/CD Pipeline (HIGH PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Set up GitHub Actions or similar
2. Configure automated testing on PR
3. Configure automated builds
4. Configure automated deployments
5. Set up staging environment

**Estimated Effort:** 8-12 hours

---

### 8.2 Environment Configuration (HIGH PRIORITY)
**Status:** Basic .env.example exists

**Tasks:**
1. Create environment-specific configs:
   - .env.development
   - .env.staging
   - .env.production

2. Document all environment variables
3. Set up secrets management
4. Configure database connections per environment

**Estimated Effort:** 3-4 hours

---

### 8.3 Docker Configuration (MEDIUM PRIORITY)
**Status:** docker-compose.yml exists

**Tasks:**
1. Create Dockerfile for API service
2. Create Dockerfile for frontend apps
3. Optimize Docker images
4. Set up multi-stage builds
5. Configure Docker Compose for production

**Estimated Effort:** 6-8 hours

---

### 8.4 Monitoring & Logging (MEDIUM PRIORITY)
**Status:** Not implemented

**Tasks:**
1. Set up application logging (Winston or similar)
2. Set up error tracking (Sentry or similar)
3. Set up performance monitoring
4. Set up uptime monitoring
5. Configure alerting

**Estimated Effort:** 8-10 hours

---

## 9. DOCUMENTATION - RESIDUAL TASKS

### 9.1 API Documentation (HIGH PRIORITY)
**Status:** Partially complete

**Tasks:**
1. Set up Swagger/OpenAPI
2. Document all endpoints with examples
3. Document authentication flow
4. Document error responses
5. Document rate limits

**Estimated Effort:** 6-8 hours

---

### 9.2 Developer Documentation (MEDIUM PRIORITY)
**Status:** Partially complete

**Tasks:**
1. Update README with current state
2. Create setup guide for new developers
3. Create deployment guide
4. Create troubleshooting guide
5. Document architecture decisions

**Estimated Effort:** 4-6 hours

---

### 9.3 User Documentation (LOW PRIORITY)
**Status:** Not started

**Tasks:**
1. Create customer app user guide
2. Create chef dashboard user guide
3. Create driver app user guide
4. Create admin panel user guide

**Estimated Effort:** 8-10 hours

---

## SUMMARY OF EFFORT ESTIMATES

### By Category

| Category | Estimated Hours | Priority |
|----------|----------------|----------|
| Backend API | 31-48 | HIGH |
| Customer Mobile | 43-63 | HIGH |
| Chef Dashboard | 29-38 | HIGH |
| Driver Mobile | 38-51 | HIGH |
| Admin Web | 26-38 | MEDIUM |
| Database | 6-9 | HIGH |
| Testing | 90-130 | HIGH |
| Deployment & DevOps | 25-34 | HIGH |
| Documentation | 18-24 | MEDIUM |
| **TOTAL** | **306-435** | - |

### By Priority

| Priority | Estimated Hours | Tasks |
|----------|----------------|-------|
| CRITICAL | 150-210 | Navigation setup, API integration, Payment flows, Real-time features |
| HIGH | 120-170 | Testing, Deployment, WebSocket, Push notifications |
| MEDIUM | 30-45 | Bulk actions, Loading states, Error handling, Documentation |
| LOW | 6-12 | Animations, Empty states, Accessibility, User docs |

---

## CRITICAL PATH TO MVP

### Phase 1: Core Functionality (2-3 weeks)
1. ✅ Backend API (already complete)
2. ⏳ Customer mobile navigation & API integration (20-30 hours)
3. ⏳ Customer mobile payment integration (6-8 hours)
4. ⏳ Chef dashboard API integration (19-26 hours)
5. ⏳ Driver mobile navigation & API integration (16-22 hours)
6. ⏳ Apply database migrations (1-2 hours)

**Total:** 62-88 hours

### Phase 2: Real-Time Features (1-2 weeks)
1. ⏳ Backend real-time integration (2-3 hours)
2. ⏳ Customer mobile WebSocket (4-5 hours)
3. ⏳ Chef dashboard WebSocket (3-4 hours)
4. ⏳ Driver mobile WebSocket (3-4 hours)
5. ⏳ Push notification backend (6-8 hours)
6. ⏳ Push notification frontend (8-10 hours)

**Total:** 26-34 hours

### Phase 3: Driver Features (1 week)
1. ⏳ Driver GPS background tracking (6-8 hours)
2. ⏳ Driver navigation integration (4-5 hours)
3. ⏳ Driver photo upload (4-5 hours)

**Total:** 14-18 hours

### Phase 4: Polish & Testing (1-2 weeks)
1. ⏳ Admin web bulk actions (6-9 hours)
2. ⏳ Error handling improvements (8-10 hours)
3. ⏳ Unit tests (40-60 hours)
4. ⏳ Integration tests (30-40 hours)

**Total:** 84-119 hours

**Total MVP Effort:** 186-259 hours (23-32 days for 1 developer, 8-11 days for 3 developers)

---

## IMMEDIATE NEXT STEPS (Top 10)

1. **Apply database migrations** (1-2 hours) - CRITICAL
2. **Customer mobile navigation setup** (4-5 hours) - CRITICAL
3. **Customer mobile HomeScreen API integration** (2-3 hours) - CRITICAL
4. **Customer mobile ChefDetailScreen API integration** (2-3 hours) - CRITICAL
5. **Customer mobile CartScreen API integration** (2-3 hours) - CRITICAL
6. **Customer mobile Stripe payment integration** (6-8 hours) - CRITICAL
7. **Backend real-time integration** (2-3 hours) - HIGH
8. **Backend image upload endpoint** (4-5 hours) - HIGH
9. **Backend push notification registration** (6-8 hours) - HIGH
10. **Chef dashboard Orders page API integration** (4-5 hours) - HIGH

**Total Immediate Effort:** 33-45 hours

---

## NOTES

### Assumptions
- 1 developer working full-time
- 8 hours per day
- No major blockers or unexpected issues
- All dependencies are available and working

### Risks
- Stripe integration may require additional time for testing
- Real-time features may require debugging and optimization
- Push notifications may require platform-specific adjustments
- GPS tracking may have battery optimization issues
- Image upload may require S3 integration for production

### Dependencies
- Backend API must be running for frontend integration
- Database must be migrated and seeded
- Stripe test account must be configured
- Mapbox/Google Maps API keys required
- Expo project must be properly configured

---

**Last Updated:** 2026-01-31  
**Status:** Ready for development  
**Next Action:** Apply database migrations and start customer mobile navigation setup
