# Developer Task Roadmap (Sprint Plan)

> **Status:** ✅ COMPLETE (Phase 2) — Backend API fully implemented. Frontend in progress (Phase 3 Week 7).

**Last Updated:** 2026-01-31  
**Current Sprint:** Phase 3 Week 7 (Customer Mobile App)

---

## Sprint Overview

This document tracks the RideNDine development roadmap across 6 phases over 16 weeks. Aligned with [DEVELOPMENTPLAN.md](DEVELOPMENTPLAN.md).

---

## Sprint 1 — MVP Ordering + Single Chef ✅ COMPLETE

**Duration:** Weeks 3-4 (Phase 2)  
**Status:** ✅ Implemented

### Completed Features
- ✅ Customer ordering flow (POST /orders)
- ✅ Stripe payment collection (PaymentIntent API)
- ✅ Order status tracking (12-state machine)
- ✅ Payment webhooks (payment_intent.succeeded)
- ✅ Order state transitions (pending → delivered)
- ✅ Commission calculation (15% platform fee)
- ✅ Ledger entries (chef_ledger, driver_ledger)

### Deliverables
- **Endpoints:** 9 order endpoints
- **Tables:** orders, order_items, order_status_history, payments
- **State Machine:** 12 states with validation
- **Commission:** 15% platform fee, 8% tax, $5 delivery fee

### Key Files
- `services/api/src/orders/orders.service.ts` (500+ lines)
- `services/api/src/stripe/stripe.service.ts` (200+ lines)
- `database/migrations/004_orders_enhancements.sql`

---

## Sprint 2 — Marketplace Onboarding ✅ COMPLETE

**Duration:** Week 3 (Phase 2)  
**Status:** ✅ Implemented

### Completed Features
- ✅ Chef registration and profiles
- ✅ Stripe Connect Express onboarding
- ✅ Multi-chef search and discovery
- ✅ Chef verification workflow
- ✅ Menu and menu item CRUD
- ✅ Operating hours configuration
- ✅ Delivery radius settings

### Deliverables
- **Endpoints:** 21 chef-related endpoints
- **Tables:** chefs, menus, menu_items, chef_documents
- **Stripe:** Connect account creation + onboarding
- **Search:** Haversine distance-based chef discovery

### Key Files
- `services/api/src/chefs/chefs.service.ts` (600+ lines)
- `database/migrations/002_chef_enhancements.sql`

---

## Sprint 3 — Automated Revenue Splitting ✅ COMPLETE

**Duration:** Week 4 (Phase 2)  
**Status:** ✅ Implemented

### Completed Features
- ✅ Commission calculation engine
- ✅ Platform fee (15%) + tax (8%)
- ✅ Chef earnings tracking (chef_ledger)
- ✅ Driver earnings tracking (driver_ledger)
- ✅ Stripe Connect destination charges
- ✅ Automatic ledger entries on payment confirmation

### Deliverables
- **Commission Calculator:** Separate utility class
- **Ledger System:** Automatic entries on order completion
- **Stripe Integration:** Application fee on PaymentIntents
- **Tables:** chef_ledger, driver_ledger

### Formula
```typescript
platformFee = subtotal * 0.15 (15%)
tax = subtotal * 0.08 (8%)
deliveryFee = $5.00 (fixed)
chefEarnings = subtotal - platformFee (85%)
total = subtotal + tax + deliveryFee
```

### Key Files
- `services/api/src/orders/commission-calculator.ts`
- `services/api/src/orders/orders.service.ts` (ledger logic)

---

## Sprint 4 — Driver & Dispatch ✅ COMPLETE

**Duration:** Week 5 (Phase 2)  
**Status:** ✅ Implemented

### Completed Features
- ✅ Driver registration and profiles
- ✅ GPS location tracking
- ✅ Driver availability management
- ✅ Order assignment algorithm
- ✅ Assignment accept/decline flow
- ✅ Driver earnings calculation
- ✅ Distance-based driver search
- ✅ Performance metrics tracking

### Deliverables
- **Endpoints:** 11 driver/dispatch endpoints
- **Tables:** drivers, driver_locations, driver_assignments
- **Algorithm:** Haversine distance + rating scoring
- **Database Functions:** calculate_distance_km(), find_available_drivers_near()

### Assignment Logic
1. Find approved, available drivers within radius
2. Calculate distance to chef location
3. Sort by distance (primary), rating (tie-breaker)
4. Assign to best match
5. Estimated pickup: distanceKm * 3 minutes

### Key Files
- `services/api/src/drivers/drivers.service.ts` (287 lines)
- `services/api/src/dispatch/dispatch.service.ts` (252 lines)
- `database/migrations/005_drivers.sql` (268 lines)

---

## Sprint 5 — Real-Time Features 🔄 IN PROGRESS

**Duration:** Week 6 (Phase 2)  
**Status:** 🔄 Core foundation complete, integration pending

### Completed Features
- ✅ WebSocket gateway (Socket.IO)
- ✅ JWT authentication for WebSocket
- ✅ Room-based subscriptions
- ✅ Order tracking endpoint
- ✅ Event emitters defined
- ✅ Connection management

### Pending Integration
- ⏳ Wire realtime events into OrdersService
- ⏳ Wire realtime events into DispatchService
- ⏳ ETA calculation with routing providers
- ⏳ Rate limiting on location updates
- ⏳ Connection health monitoring

### Deliverables
- **WebSocket Events:** 8+ defined events
- **Tracking Endpoint:** GET /orders/:id/tracking
- **Rooms:** user:{id}, role:{role}, order:{orderId}

### Events Implemented
- `connected` - Connection confirmation
- `order:status_update` - Order state changes
- `driver:location_update` - GPS position broadcast
- `order:new` - New order to chef
- `driver:new_assignment` - Assignment notification
- `order:eta_update` - ETA recalculation

### Key Files
- `services/api/src/realtime/realtime.gateway.ts` (196 lines)
- `services/api/src/realtime/realtime.service.ts` (80 lines)
- `services/api/src/orders/dto/order-tracking.dto.ts`

---

## Sprint 6 — Frontend Apps 🔄 IN PROGRESS

**Duration:** Weeks 7-10 (Phase 3)  
**Status:** 🔄 Week 7 Day 1 complete

### Week 7: Customer Discovery (35% Complete)
**Goal:** Customer can browse chefs and view menus

#### Completed (Day 1)
- ✅ Navigation structure (RootNavigator, MainTabNavigator)
- ✅ Location permissions configured
- ✅ API service connected to core server (8081)
- ✅ HomeScreen with chef discovery logic
- ✅ Environment variables setup (.env)

#### In Progress (Days 2-3)
- 🔄 Test on device/simulator
- 🔄 Chef discovery UI enhancements
- 🔄 ChefDetailScreen API integration
- 🔄 Menu browsing functionality

### Week 8: Ordering & Payment (Not Started)
**Goal:** Customer can complete purchase

#### Planned Features
- Cart management
- Checkout flow
- Stripe Payment Sheet integration
- Order confirmation
- Order history

### Week 9: Chef Dashboard (Not Started)
**Goal:** Chef can manage operations via web

#### Planned Features
- Next.js 14 project
- Order management interface
- Menu CRUD with image upload
- Real-time WebSocket notifications
- Earnings dashboard

### Week 10: Driver App (Not Started)
**Goal:** Complete order fulfillment cycle

#### Planned Features
- Driver mobile app (React Native)
- GPS background tracking
- Assignment accept/decline flow
- Turn-by-turn navigation
- Photo upload (delivery proof)

### Key Progress Files
- `PHASE3_WEEK7_DAY1_COMPLETE.md` - Day 1 summary
- `PHASE3_STATUS.md` - Overall Phase 3 status
- `PHASE3_PLAN.md` - Detailed week-by-week plan

---

## Sprint 7 — Scaling + Compliance ⏳ NOT STARTED

**Duration:** Weeks 11-14 (Phases 4-5)  
**Status:** ⏳ Planned

### Phase 4: Admin & Reviews (Weeks 11-12)
- Admin dashboard
- User management
- Chef verification interface
- Review system
- Analytics dashboard

### Phase 5: Testing & Security (Weeks 13-14)
- Comprehensive test suite
- Security audit
- Performance optimization
- Load testing
- Penetration testing

### Compliance Features
- Refund/dispute workflows
- Accounting exports (CSV, JSON)
- Audit logging (admin_actions table)
- GDPR compliance
- PCI-DSS compliance (Stripe handles cards)

---

## Current Status Summary

### ✅ Completed (Phases 1-2)
- Foundation: Database, Auth, Infrastructure
- Backend API: 42 REST endpoints operational
- WebSocket: Real-time gateway running
- Full order lifecycle: pending → delivered
- Stripe: Payment processing + Connect onboarding
- Driver dispatch: GPS tracking + assignment

### 🔄 In Progress (Phase 3)
- Customer Mobile: Week 7 Day 1 complete
- Navigation + location permissions configured
- API integration in progress

### ⏳ Upcoming (Phases 4-6)
- Complete frontend apps (3 more weeks)
- Admin panel + review system
- Testing + security hardening
- Launch preparation

---

## Key Metrics

**Backend Progress:**
- 42 REST endpoints ✅
- 1 WebSocket gateway ✅
- 5 database migrations ✅
- 25+ database tables ✅
- 12-state order machine ✅

**Frontend Progress:**
- Customer Mobile: 35% complete
- Chef Dashboard: 0% (starts Week 9)
- Driver Mobile: 0% (starts Week 10)

**Overall Project:**
- **37.5% complete** (6/16 weeks)
- Phase 1-2: 100% ✅
- Phase 3: 35% 🔄
- Phases 4-6: 0% ⏳

---

**Next Sprint:** Phase 3 Week 7 Days 2-3 (Customer app testing + chef detail screen)  
**Blockers:** None  
**On Track:** Yes
