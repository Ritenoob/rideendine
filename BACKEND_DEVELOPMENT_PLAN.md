# Backend Development Plan - Order System, Security, GPS & Essential Features

**Date:** 2026-01-31  
**Status:** Planning Phase  
**Objective:** Complete missing backend features for production-ready order management

---

## Current State Assessment ✅

### Already Implemented (5,461 lines across 11 services)

**1. Orders Module** (1,508 lines) ✅
- Order creation with validation
- State machine (12 states)
- Commission calculator (15% platform fee)
- Payment intent integration
- Order status transitions
- Refund processing
- Order tracking
- Database transactions

**2. Authentication Module** (352 lines) ✅
- User registration with bcrypt password hashing
- JWT token generation
- Email verification flow
- Password reset functionality
- Refresh token support
- Role-based user creation (customer, chef, driver)

**3. Security Guards** ✅
- JWT Authentication Guard
- Roles Guard (RBAC)
- Route protection

**4. Location Services** (Partial) ⚠️
- Driver location tracking exists
- Driver location history
- WebSocket real-time location updates
- **MISSING:** Geocoding, distance calculation, delivery zone validation

**5. Other Complete Modules** ✅
- Chefs Module (487 lines) - Chef profiles, search, verification
- Menus Module (259 lines) - Menu/item CRUD
- Stripe Module (285 lines) - Payments, Connect, webhooks
- Drivers Module (301 lines) - Driver management
- Dispatch Module (252 lines) - Assignment logic
- Admin Module (1,190 lines) - Admin operations, audit logging
- Reviews Module (660 lines) - Reviews and ratings
- Realtime Module (80 lines) - WebSocket gateway
- Users Module (87 lines) - User profiles

---

## What Needs to Be Built 🔨

### Priority 1: GPS & Geocoding Service (Critical)

**Why Critical:** Order creation requires address validation and distance calculation

**Missing Features:**
1. ✅ Address geocoding (convert address → lat/lng)
2. ✅ Reverse geocoding (convert lat/lng → address)
3. ✅ Distance calculation (customer ↔ chef)
4. ✅ Delivery zone validation
5. ✅ ETA calculation
6. ✅ Route optimization

**Implementation:** Create GeocodingService with multiple provider support

---

### Priority 2: Enhanced Security (High)

**Current Gaps:**
1. ❌ Rate limiting (prevent brute force)
2. ❌ Input sanitization (prevent SQL injection)
3. ❌ CORS configuration (production-ready)
4. ❌ Helmet.js security headers
5. ❌ Request validation middleware
6. ⚠️ API key authentication (for mobile apps)

**Implementation:** Security middleware + configuration updates

---

### Priority 3: Order Data Validation (High)

**Current State:** Basic validation exists  
**Enhancements Needed:**
1. ✅ Delivery time slot validation
2. ✅ Order size limits (prevent abuse)
3. ✅ Delivery radius enforcement
4. ✅ Chef capacity limits
5. ✅ Special instructions length limits
6. ✅ Tip amount validation

**Implementation:** Enhanced DTOs + custom validators

---

### Priority 4: Logging & Monitoring (Medium)

**Missing:**
1. ❌ Structured logging (Winston)
2. ❌ Error tracking (Sentry integration)
3. ❌ Performance monitoring
4. ❌ Request/response logging
5. ❌ Database query logging

**Implementation:** Logging service + interceptors

---

### Priority 5: Background Jobs (Medium)

**Use Cases:**
1. ❌ Order timeout handling (auto-reject after 10 min)
2. ❌ Driver auto-assignment retry
3. ❌ Email notifications
4. ❌ SMS notifications
5. ❌ Data cleanup jobs

**Implementation:** Bull queue + Redis integration

---

## Implementation Plan

### Phase 1: GPS & Geocoding Service (2-3 hours)

#### Task 1.1: Create Geocoding Service

**File:** `services/api/src/common/services/geocoding.service.ts`

**Features:**
- Multiple provider support (Google Maps, Mapbox, OpenStreetMap)
- Fallback mechanism
- Caching layer (Redis)
- Rate limit handling

**Methods:**
```typescript
geocode(address: string): Promise<{ lat: number; lng: number }>
reverseGeocode(lat: number, lng: number): Promise<Address>
calculateDistance(point1, point2): Promise<number> // km
validateDeliveryZone(chefLocation, customerLocation, maxRadius): Promise<boolean>
calculateETA(origin, destination, mode): Promise<number> // minutes
```

#### Task 1.2: Integrate with Orders

- Add geocoding to order creation
- Validate delivery address
- Calculate distance from chef
- Store coordinates in database

#### Task 1.3: Add Distance-Based Pricing

- Calculate delivery fee based on distance
- Add surge pricing support
- Update CommissionCalculator

---

### Phase 2: Enhanced Security (1-2 hours)

#### Task 2.1: Rate Limiting

**Install:** `@nestjs/throttler`

**Configuration:**
- Login: 5 requests/minute
- Registration: 3 requests/hour
- Order creation: 10 requests/hour
- API endpoints: 100 requests/minute

#### Task 2.2: Input Sanitization

**Install:** `class-sanitizer`

**Apply to:**
- All DTOs
- User input fields
- Special instructions
- Search queries

#### Task 2.3: Security Headers

**Install:** `helmet`

**Configure:**
- CORS (whitelist domains)
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

#### Task 2.4: Request Validation Pipe

**Global validation:**
- Whitelist unknown properties
- Transform types automatically
- Strip forbidden properties

---

### Phase 3: Enhanced Order Validation (1 hour)

#### Task 3.1: Custom Validators

**Create:**
- `@IsValidDeliveryTime()` - Future time slot
- `@IsWithinDeliveryRadius()` - Distance check
- `@IsReasonableOrderSize()` - Min/max items
- `@IsValidTipAmount()` - 0-100% of subtotal

#### Task 3.2: Business Rules Engine

**File:** `services/api/src/orders/order-validation.service.ts`

**Rules:**
- Chef is open for business
- Chef has capacity
- Delivery address is within radius
- Order meets minimum amount
- Items are in stock

---

### Phase 4: Logging & Monitoring (1-2 hours)

#### Task 4.1: Winston Logger

**Install:** `winston`, `nest-winston`

**Configuration:**
- Console transport (dev)
- File transport (production)
- JSON format
- Log levels: error, warn, info, debug
- Rotation (daily, max 14 days)

#### Task 4.2: Request Logging Interceptor

**Features:**
- Log all requests/responses
- Include user ID
- Log execution time
- Exclude sensitive data (passwords)

#### Task 4.3: Error Tracking

**Install:** `@sentry/node` (optional)

**Setup:**
- Capture all errors
- Include user context
- Track performance
- Set up alerts

---

### Phase 5: Background Jobs (2-3 hours)

#### Task 5.1: Bull Queue Setup

**Install:** `@nestjs/bull`, `bull`

**Queues:**
- `order-processing` - Order lifecycle events
- `notifications` - Email/SMS/push
- `data-cleanup` - Old data removal

#### Task 5.2: Order Timeout Job

**Logic:**
- Check orders in `payment_confirmed` status
- If > 10 minutes old, auto-reject
- Send notification to customer
- Refund payment

#### Task 5.3: Notification Jobs

**Email templates:**
- Order confirmation
- Order accepted
- Order ready
- Order delivered

---

## File Structure

```
services/api/src/
├── common/
│   ├── services/
│   │   ├── geocoding.service.ts           [NEW]
│   │   ├── logging.service.ts             [NEW]
│   │   └── cache.service.ts               [NEW]
│   ├── guards/
│   │   ├── jwt-auth.guard.ts              [EXISTS]
│   │   ├── roles.guard.ts                 [EXISTS]
│   │   ├── throttle.guard.ts              [NEW]
│   │   └── api-key.guard.ts               [NEW]
│   ├── interceptors/
│   │   ├── logging.interceptor.ts         [NEW]
│   │   ├── transform.interceptor.ts       [NEW]
│   │   └── error.interceptor.ts           [NEW]
│   ├── validators/
│   │   ├── delivery-time.validator.ts     [NEW]
│   │   ├── delivery-radius.validator.ts   [NEW]
│   │   └── order-size.validator.ts        [NEW]
│   └── middleware/
│       ├── security.middleware.ts         [NEW]
│       └── sanitize.middleware.ts         [NEW]
├── orders/
│   ├── orders.service.ts                  [ENHANCE]
│   ├── order-validation.service.ts        [NEW]
│   └── order-timeout.processor.ts         [NEW]
└── jobs/
    ├── queues.module.ts                   [NEW]
    ├── notification.processor.ts          [NEW]
    └── cleanup.processor.ts               [NEW]
```

---

## Dependencies to Install

```json
{
  "dependencies": {
    "@nestjs/throttler": "^5.1.1",
    "@nestjs/bull": "^10.0.1",
    "bull": "^4.12.0",
    "helmet": "^7.1.0",
    "winston": "^3.11.0",
    "nest-winston": "^1.9.4",
    "@sentry/node": "^7.99.0",
    "class-sanitizer": "^1.0.1",
    "axios": "^1.6.5",
    "node-cache": "^5.1.2"
  }
}
```

---

## Environment Variables Needed

```bash
# Geocoding
GOOGLE_MAPS_API_KEY=AIza...
MAPBOX_TOKEN=pk.ey...

# Redis (for caching & queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://...@sentry.io/...

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Security
CORS_ORIGINS=http://localhost:3001,http://localhost:8010
API_KEY_HEADER=x-api-key
```

---

## Testing Checklist

### GPS & Geocoding
- [ ] Geocode valid US address
- [ ] Handle invalid address
- [ ] Calculate distance accurately
- [ ] Validate delivery zone (in/out)
- [ ] Calculate ETA
- [ ] Test provider fallback

### Security
- [ ] Rate limiting blocks after limit
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] CORS blocks unauthorized domains
- [ ] JWT validation works
- [ ] Role-based access enforced

### Order Validation
- [ ] Rejects orders outside delivery radius
- [ ] Enforces minimum order amount
- [ ] Validates delivery time slots
- [ ] Limits order size
- [ ] Validates tip amount

### Logging
- [ ] All requests logged
- [ ] Errors logged with stack trace
- [ ] User context included
- [ ] Sensitive data excluded
- [ ] Log rotation works

### Background Jobs
- [ ] Order timeout triggers auto-reject
- [ ] Email notifications send
- [ ] SMS notifications send (if implemented)
- [ ] Jobs retry on failure

---

## Success Criteria

### GPS & Geocoding
- ✅ 99% geocoding accuracy
- ✅ <500ms response time
- ✅ Fallback to secondary provider works
- ✅ Cache hit rate >80%

### Security
- ✅ All OWASP Top 10 addressed
- ✅ No SQL injection vulnerabilities
- ✅ No XSS vulnerabilities
- ✅ Rate limiting effective
- ✅ All secrets in environment variables

### Order Validation
- ✅ 0 orders outside delivery zone
- ✅ 0 orders below minimum
- ✅ All business rules enforced
- ✅ Clear error messages

### Monitoring
- ✅ All errors logged
- ✅ Performance metrics tracked
- ✅ Alerts configured
- ✅ Dashboards set up

---

## Timeline Estimate

| Phase | Tasks | Time |
|-------|-------|------|
| Phase 1: GPS & Geocoding | 3 tasks | 2-3 hours |
| Phase 2: Security | 4 tasks | 1-2 hours |
| Phase 3: Validation | 2 tasks | 1 hour |
| Phase 4: Logging | 3 tasks | 1-2 hours |
| Phase 5: Background Jobs | 3 tasks | 2-3 hours |
| **Total** | **15 tasks** | **7-11 hours** |

---

## Priority Ranking

**Must Have (Production Blocker):**
1. GPS & Geocoding Service
2. Rate Limiting
3. Input Sanitization
4. Order Validation

**Should Have (Launch Week 1):**
5. Logging & Monitoring
6. Background Jobs
7. Security Headers

**Nice to Have (Post-Launch):**
8. Error Tracking (Sentry)
9. Performance Monitoring
10. Advanced Analytics

---

## Next Steps

1. **Review & Approve** this plan
2. **Install dependencies**
3. **Implement Phase 1** (GPS & Geocoding)
4. **Test thoroughly**
5. **Continue with Phases 2-5**

---

**Document Version:** 1.0  
**Created:** 2026-01-31  
**Status:** Awaiting Approval
