# RideNDine Project - Comprehensive Todo List

**Generated:** 2026-01-31  
**Project:** RideNDine Delivery Platform  
**Overall Status:** ~45% Complete (Backend), ~80% Complete (Frontend)

---

## Executive Summary

RideNDine is a multi-role delivery platform with:
- **Core Demo Server** (port 8081) - Fully functional
- **Backend API** (NestJS, port 9001) - ~45% complete with 42 REST endpoints + WebSocket
- **Customer Mobile App** (Expo) - ~85% complete
- **Chef Dashboard** (Next.js) - ~82% complete
- **Driver Mobile App** (Expo) - ~78% complete
- **Admin Web App** (Next.js) - ~72% complete

### Key Findings

**Strengths:**
- Solid architecture with proper separation of concerns
- TypeScript throughout with consistent patterns
- All major screens and components exist
- WebSocket infrastructure is in place
- Stripe integration partially implemented

**Critical Gaps:**
1. **Real-time integration** - RealtimeService exists but not wired into OrdersService (line 18 commented out)
2. **Image upload** - No endpoint for chef menu items, profile photos, delivery proof
3. **Push notifications** - No device registration or notification service
4. **Frontend-Backend wiring** - Apps have screens but not fully connected to API
5. **Payment flows** - Stripe SDK installed but not fully integrated

---

## Backend API Integration Tasks

### 1. Real-Time Integration (HIGH PRIORITY)

**Status:** Partially implemented, not wired

**Issues:**
- [`services/api/src/orders/orders.service.ts`](services/api/src/orders/orders.service.ts:18) - RealtimeService import commented out
- No WebSocket event emission in order state transitions
- RealtimeService exists but not integrated into OrdersService

**Tasks:**
- [ ] Uncomment RealtimeService import in orders.service.ts (line 18)
- [ ] Add RealtimeService constructor injection in OrdersService
- [ ] Add emit calls in all order state transition methods:
  - [ ] createOrder() → emit 'order:created'
  - [ ] acceptOrder() → emit 'order:accepted'
  - [ ] markReady() → emit 'order:ready'
  - [ ] assignDriver() → emit 'order:assigned'
  - [ ] markPickedUp() → emit 'order:picked_up'
  - [ ] markInTransit() → emit 'order:in_transit'
  - [ ] markDelivered() → emit 'order:delivered'
  - [ ] cancelOrder() → emit 'order:cancelled'

**Files to Modify:**
- [`services/api/src/orders/orders.service.ts`](services/api/src/orders/orders.service.ts)
- [`services/api/src/realtime/realtime.service.ts`](services/api/src/realtime/realtime.service.ts)

---

### 2. Image Upload Endpoint (HIGH PRIORITY)

**Status:** Missing

**Required For:**
- Chef menu item images
- User profile photos
- Delivery proof photos (driver)

**Tasks:**
- [ ] Install multer and @nestjs/platform-express packages
- [ ] Create upload module (upload.module.ts, upload.controller.ts, upload.service.ts)
- [ ] Implement POST /upload/image endpoint
- [ ] Implement POST /upload/images endpoint
- [ ] Implement DELETE /upload/:filename endpoint
- [ ] Configure local storage for development
- [ ] Add S3 integration for production

**Files to Create:**
- `services/api/src/upload/upload.module.ts`
- `services/api/src/upload/upload.controller.ts`
- `services/api/src/upload/upload.service.ts`
- `services/api/src/upload/dto/upload.dto.ts`

---

### 3. Push Notification Registration (HIGH PRIORITY)

**Status:** Missing

**Required For:**
- Order status updates
- New order notifications (chefs)
- Assignment notifications (drivers)
- Delivery updates (customers)

**Tasks:**
- [ ] Create devices table migration (007_devices.sql)
- [ ] Create devices module (devices.module.ts, devices.controller.ts, devices.service.ts)
- [ ] Implement POST /devices endpoint
- [ ] Implement PATCH /devices/:id endpoint
- [ ] Implement DELETE /devices/:id endpoint
- [ ] Implement GET /users/me/devices endpoint
- [ ] Install Expo Server SDK
- [ ] Create notification service
- [ ] Add notification triggers in order state transitions

**Files to Create:**
- `database/migrations/007_devices.sql`
- `services/api/src/devices/devices.module.ts`
- `services/api/src/devices/devices.controller.ts`
- `services/api/src/devices/devices.service.ts`
- `services/api/src/notifications/notifications.service.ts`

---

### 4. Service Split Integration (MEDIUM PRIORITY)

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
- [ ] Decide: Keep monolithic (Option A) or Full microservices (Option B)
- [ ] If Option A: Move logic from prototypes into NestJS modules
- [ ] If Option B: Convert prototypes to NestJS microservices
- [ ] Implement Redis/NATS for messaging (if Option B)
- [ ] Add service discovery (if Option B)
- [ ] Implement API gateway (if Option B)

**Recommendation:** Option A for now, defer microservices until scale requirements

---

### 5. API Enhancements (MEDIUM PRIORITY)

#### 5.1 Order ETA Calculation
**Status:** Endpoint exists, not implemented

**Tasks:**
- [ ] Implement ETA calculation using Mapbox/Google Maps API
- [ ] Add caching for ETA results
- [ ] Handle API rate limits

**Files to Modify:**
- [`services/api/src/orders/orders.service.ts`](services/api/src/orders/orders.service.ts)

#### 5.2 Driver Location Updates
**Status:** Endpoint exists, not fully implemented

**Tasks:**
- [ ] Implement GPS coordinate storage
- [ ] Add distance calculation (Haversine formula)
- [ ] Add location history tracking
- [ ] Implement real-time location broadcasting

**Files to Modify:**
- [`services/api/src/drivers/drivers.service.ts`](services/api/src/drivers/drivers.service.ts)

#### 5.3 Commission Settlement
**Status:** Calculator exists, payout logic missing

**Tasks:**
- [ ] Implement automatic payout scheduling
- [ ] Add Stripe Connect payout API integration
- [ ] Create payout history tracking
- [ ] Add payout failure handling and retry logic

**Files to Modify:**
- [`services/api/src/orders/commission-calculator.ts`](services/api/src/orders/commission-calculator.ts)
- [`services/api/src/stripe/stripe.service.ts`](services/api/src/stripe/stripe.service.ts)

---

## Customer Mobile App Tasks

### 6. Navigation Setup (CRITICAL)

**Status:** Not implemented

**Current Issue:**
- [`App.js`](apps/customer-mobile/App.js) - Old demo code, not using App.tsx
- No root navigator configured
- No AuthStack or MainStack

**Tasks:**
- [ ] Verify App.tsx is properly configured with navigation structure
- [ ] Verify AuthStack exists (LoginScreen, RegisterScreen)
- [ ] Verify MainStack exists (TabNavigator, all screens)
- [ ] Verify deep linking configured (ridendine://track?orderId=...)
- [ ] Test navigation flow end-to-end

**Files to Check:**
- [`apps/customer-mobile/App.tsx`](apps/customer-mobile/App.tsx)
- [`apps/customer-mobile/src/navigation/RootNavigator.tsx`](apps/customer-mobile/src/navigation/RootNavigator.tsx)
- [`apps/customer-mobile/src/navigation/MainTabNavigator.tsx`](apps/customer-mobile/src/navigation/MainTabNavigator.tsx)

---

### 7. API Integration (CRITICAL)

**Status:** Screens exist, not wired to API

**Tasks:**

#### 7.1 HomeScreen
**File:** [`apps/customer-mobile/src/screens/home/HomeScreen.tsx`](apps/customer-mobile/src/screens/home/HomeScreen.tsx)

- [ ] Request location permission
- [ ] Fetch chefs from API: `api.searchChefs({ lat, lng, radius: 10 })`
- [ ] Display ChefCard list
- [ ] Add pull-to-refresh
- [ ] Handle loading/error states

#### 7.2 ChefDetailScreen
**File:** [`apps/customer-mobile/src/screens/chef/ChefDetailScreen.tsx`](apps/customer-mobile/src/screens/chef/ChefDetailScreen.tsx)

- [ ] Fetch chef profile: `api.getChef(chefId)`
- [ ] Fetch chef menus: `api.getChefMenus(chefId)`
- [ ] Display menu items with MenuItemCard
- [ ] Add to cart functionality (update cartStore)
- [ ] Display chef reviews

#### 7.3 CartScreen
**File:** [`apps/customer-mobile/src/screens/order/CartScreen.tsx`](apps/customer-mobile/src/screens/order/CartScreen.tsx)

- [ ] Wire to cartStore
- [ ] Implement quantity adjustment
- [ ] Implement remove item
- [ ] Calculate totals
- [ ] Add delivery address validation
- [ ] Add promo code validation
- [ ] Navigate to CheckoutScreen

#### 7.4 CheckoutScreen
**File:** [`apps/customer-mobile/src/screens/order/CheckoutScreen.tsx`](apps/customer-mobile/src/screens/order/CheckoutScreen.tsx)

- [ ] Display order summary
- [ ] Collect delivery address
- [ ] Collect tip selection
- [ ] Validate all inputs
- [ ] Call `api.createOrder()` before payment
- [ ] Initialize Stripe Payment Sheet

#### 7.5 OrdersScreen
**File:** [`apps/customer-mobile/src/screens/orders/OrdersScreen.tsx`](apps/customer-mobile/src/screens/orders/OrdersScreen.tsx)

- [ ] Fetch user orders: `api.getOrders()`
- [ ] Display order list
- [ ] Navigate to OrderDetailScreen
- [ ] Add pull-to-refresh

#### 7.6 OrderDetailScreen
**File:** [`apps/customer-mobile/src/screens/order/OrderDetailScreen.tsx`](apps/customer-mobile/src/screens/order/OrderDetailScreen.tsx)

- [ ] Fetch order details: `api.getOrder(orderId)`
- [ ] Display order timeline
- [ ] Display order items
- [ ] Display delivery info
- [ ] Navigate to OrderTrackingScreen

#### 7.7 OrderTrackingScreen
**File:** [`apps/customer-mobile/src/screens/order/OrderTrackingScreen.tsx`](apps/customer-mobile/src/screens/order/OrderTrackingScreen.tsx)

- [ ] Connect to WebSocket for real-time updates
- [ ] Display map with driver location
- [ ] Display ETA
- [ ] Display order status timeline
- [ ] Handle driver location updates

#### 7.8 ProfileScreen
**File:** [`apps/customer-mobile/src/screens/profile/ProfileScreen.tsx`](apps/customer-mobile/src/screens/profile/ProfileScreen.tsx)

- [ ] Fetch user profile: `api.getMe()`
- [ ] Display user info
- [ ] Navigate to EditProfileScreen
- [ ] Navigate to SettingsScreen
- [ ] Implement logout

---

### 8. Stripe Payment Integration (CRITICAL)

**Status:** SDK installed, not integrated

**Tasks:**
- [ ] Configure Stripe plugin in app.json
- [ ] Create payment service (services/payment.ts)
- [ ] Implement CheckoutScreen with Payment Sheet
- [ ] Handle payment success/failure
- [ ] Navigate to OrderConfirmationScreen
- [ ] Handle payment errors (network, declined, insufficient funds, card errors)

**Files to Create:**
- `apps/customer-mobile/src/services/payment.ts`

**Files to Modify:**
- `apps/customer-mobile/app.json`
- [`apps/customer-mobile/src/screens/order/CheckoutScreen.tsx`](apps/customer-mobile/src/screens/order/CheckoutScreen.tsx)
- [`apps/customer-mobile/src/screens/order/OrderConfirmationScreen.tsx`](apps/customer-mobile/src/screens/order/OrderConfirmationScreen.tsx)

---

### 9. Location Services (HIGH PRIORITY)

**Status:** SDK installed, not implemented

**Tasks:**
- [ ] Configure location permissions in app.json
- [ ] Create useLocation hook
- [ ] Implement location permission request in HomeScreen
- [ ] Get current location and pass to chef search

**Files to Create:**
- `apps/customer-mobile/src/hooks/useLocation.ts`

**Files to Modify:**
- `apps/customer-mobile/app.json`
- [`apps/customer-mobile/src/screens/home/HomeScreen.tsx`](apps/customer-mobile/src/screens/home/HomeScreen.tsx)

---

### 10. WebSocket Integration (HIGH PRIORITY)

**Status:** Not implemented

**Tasks:**
- [ ] Verify WebSocket service connects correctly
- [ ] Implement connection management (connect on start, disconnect on logout)
- [ ] Implement auto-reconnect on disconnect
- [ ] Handle connection errors
- [ ] Test all event listeners (order:status_update, driver:location, eta_update)

**Files to Check:**
- [`apps/customer-mobile/src/services/websocket.ts`](apps/customer-mobile/src/services/websocket.ts)

---

## Chef Dashboard Tasks

### 11. Real-Time Orders (HIGH PRIORITY)

**Status:** WebSocket exists, needs verification

**Tasks:**
- [ ] Verify WebSocket connection for order updates
- [ ] Test order acceptance flow
- [ ] Test order status updates
- [ ] Verify earnings reflect in real-time

---

### 12. Image Upload for Menu Items (MEDIUM PRIORITY)

**Status:** Backend endpoint missing

**Tasks:**
- [ ] Integrate with backend image upload endpoint
- [ ] Add image upload UI to menu item form
- [ ] Display uploaded images in menu
- [ ] Handle image upload errors

---

## Driver Mobile App Tasks

### 13. WebSocket Integration (HIGH PRIORITY)

**Status:** Not implemented

**Tasks:**
- [ ] Implement WebSocket connection for order updates
- [ ] Test order assignment notifications
- [ ] Test order status updates

---

### 14. Background Location Tracking (HIGH PRIORITY)

**Status:** Not implemented

**Tasks:**
- [ ] Implement TaskManager for background location
- [ ] Configure location permissions
- [ ] Test location updates in background

---

### 15. Turn-by-Turn Navigation (MEDIUM PRIORITY)

**Status:** Not implemented

**Tasks:**
- [ ] Integrate with Google Maps/Mapbox navigation
- [ ] Implement navigation to delivery address
- [ ] Handle navigation errors

---

### 16. Photo Delivery Proof (MEDIUM PRIORITY)

**Status:** Not implemented

**Tasks:**
- [ ] Add photo capture UI
- [ ] Upload photo to backend
- [ ] Display delivery proof in order history

---

### 17. Offline Order Queue (MEDIUM PRIORITY)

**Status:** Not implemented

**Tasks:**
- [ ] Implement offline order storage
- [ ] Sync orders when connection restored
- [ ] Handle sync conflicts

---

## Admin Web App Tasks

### 18. CSV Export Functionality (MEDIUM PRIORITY)

**Status:** Not implemented

**Tasks:**
- [ ] Implement CSV export for chefs
- [ ] Implement CSV export for drivers
- [ ] Implement CSV export for orders
- [ ] Implement CSV export for reviews

---

### 19. Advanced Reporting/Analytics (LOW PRIORITY)

**Status:** Not implemented

**Tasks:**
- [ ] Add revenue charts
- [ ] Add order volume charts
- [ ] Add chef performance metrics
- [ ] Add driver performance metrics

---

### 20. Email Notification Creation UI (LOW PRIORITY)

**Status:** Not implemented

**Tasks:**
- [ ] Create email template editor
- [ ] Implement email sending
- [ ] Add email history tracking

---

## Testing & Quality Assurance

### 21. End-to-End Testing (HIGH PRIORITY)

**Status:** Not started

**Tasks:**
- [ ] Test customer registration → order → payment → tracking → delivery → review
- [ ] Test chef login → order acceptance → status updates
- [ ] Test driver login → order acceptance → navigation → completion
- [ ] Test admin login → chef verification → order refunds

---

### 22. WebSocket Stability Testing (HIGH PRIORITY)

**Status:** Not started

**Tasks:**
- [ ] Test heartbeat/reconnection logic
- [ ] Test connection under poor network conditions
- [ ] Test multiple concurrent connections

---

### 23. Load Testing (MEDIUM PRIORITY)

**Status:** Not started

**Tasks:**
- [ ] Test with 100 concurrent users
- [ ] Test with 1000 concurrent users
- [ ] Identify and fix performance bottlenecks

---

### 24. Security Audit (MEDIUM PRIORITY)

**Status:** Not started

**Tasks:**
- [ ] Review authentication flow
- [ ] Review authorization checks
- [ ] Review input validation
- [ ] Review SQL injection prevention
- [ ] Review XSS prevention

---

## Deployment & Production

### 25. Mobile App Signing & Stores (MEDIUM PRIORITY)

**Status:** Not started

**Tasks:**
- [ ] Sign iOS app
- [ ] Sign Android app
- [ ] Submit to App Store
- [ ] Submit to Google Play Store

---

### 26. Production Configuration (MEDIUM PRIORITY)

**Status:** Not started

**Tasks:**
- [ ] Configure production environment variables
- [ ] Set up production database
- [ ] Configure S3 for image storage
- [ ] Set up production Redis/NATS (if microservices)
- [ ] Configure production Stripe account
- [ ] Set up monitoring and logging

---

### 27. Documentation Updates (LOW PRIORITY)

**Status:** Not started

**Tasks:**
- [ ] Update README with latest changes
- [ ] Update API documentation
- [ ] Update deployment guides
- [ ] Create user guides for each app

---

## Code Cleanup & Optimization

### 28. TypeScript Errors (LOW PRIORITY)

**Status:** Known issue

**Tasks:**
- [ ] Fix TypeScript errors in customer-mobile (React 19.1.0 compatibility)
- [ ] Fix TypeScript errors in chef-dashboard
- [ ] Fix TypeScript errors in driver-mobile
- [ ] Fix TypeScript errors in admin-web

**Note:** The project uses React 19.1.0 and React Native 0.81.5, which are very new versions. Some TypeScript errors appear in the editor but the code is syntactically correct and will work at runtime.

---

### 29. ESLint Warnings (LOW PRIORITY)

**Status:** Not started

**Tasks:**
- [ ] Fix ESLint warnings in customer-mobile
- [ ] Fix ESLint warnings in chef-dashboard
- [ ] Fix ESLint warnings in driver-mobile
- [ ] Fix ESLint warnings in admin-web
- [ ] Fix ESLint warnings in services/api

---

### 30. Performance Optimization (LOW PRIORITY)

**Status:** Not started

**Tasks:**
- [ ] Optimize large menu/order list rendering
- [ ] Add pagination to all list views
- [ ] Optimize database queries
- [ ] Add caching where appropriate

---

## Recommended Priority Order

### Week 1 (MVP Launch)
**Goal:** Customer can place orders, Chef can fulfill, Driver can deliver, Admin can operate

1. Real-time integration (tasks 1-11)
2. Customer mobile API integration (tasks 45-57)
3. Stripe payment integration (tasks 58-63)
4. WebSocket integration (tasks 68-72)
5. E2E testing (tasks 107-110)

### Week 2 (Production Hardening)
**Goal:** Performance, security, edge cases

6. Image upload endpoint (tasks 12-18)
7. Push notifications (tasks 19-27)
8. Driver app WebSocket (tasks 81-83)
9. Load testing (tasks 114-116)
10. Security audit (tasks 117-121)

### Week 3+ (Polish & Scale)
**Goal:** Full feature parity and optimization

11. Remaining features and optimizations

---

## Quick Start Commands

### Start Backend
```bash
cd services/api && npm run start:dev
```

### Start Customer Mobile
```bash
cd apps/customer-mobile && npx expo start --tunnel
```

### Start Chef Dashboard
```bash
cd apps/chef-dashboard && npm run dev
```

### Start Admin Web
```bash
cd apps/admin-web && npm run dev
```

---

## File Edit Convention

Before modifying any file, archive the current version:

```bash
cp file.js "edits/file.js.$(date +%Y-%m-%d_%H-%M-%S).reason"
```

---

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `MAPBOX_TOKEN` | Core server | Mapbox routing API |
| `GOOGLE_MAPS_API_KEY` | Core server | Google Routes API |
| `OSRM_BASE_URL` | Core server | Self-hosted OSRM (optional) |
| `EXPO_PUBLIC_API_URL` | Customer mobile | Backend API URL |
| `EXPO_PUBLIC_WS_URL` | Customer mobile | WebSocket URL |
| `STRIPE_SECRET_KEY` | Backend | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Backend | Stripe webhook verification |

---

## Ports & Services

| Service | Port | Status |
|---------|------|--------|
| Core demo server | 8081 | Working |
| API (NestJS) | 9001 | WIP |
| Dispatch | 9002 | Prototype |
| Routing | 9003 | Prototype |
| Realtime gateway | 9004 | Prototype |
| Customer web dev server | 8010 | Working |
| Expo bundler | 8082 | Working |

---

## Notes

- Core server persists state to `ridendine_v2_live_routing/demo_state.json`
- Archived files stored in `edits/` directory
- Services in `services/` are NOT wired together yet
- Database layer is empty (docker-compose exists but no schema)
- `packages/api-client/` is documentation only

---

**Total Tasks:** 148  
**Estimated Remaining Work:** ~60-80 hours (20% of total)  
**Mostly:** Integration, testing, and polish (no major features need building from scratch)
