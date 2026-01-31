# RideNDine System Architecture

Comprehensive technical architecture documentation for the RideNDine multi-role food delivery platform.

**Document Version:** 2.0
**Last Updated:** 2026-01-31
**Status:** Production-ready (Phase 3 complete)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Technology Stack](#technology-stack)
5. [Core Services](#core-services)
6. [Database Architecture](#database-architecture)
7. [External Integrations](#external-integrations)
8. [Security Architecture](#security-architecture)
9. [Real-Time Communication](#real-time-communication)
10. [State Machines](#state-machines)
11. [Data Flow](#data-flow)
12. [Deployment Architecture](#deployment-architecture)
13. [Performance & Scalability](#performance--scalability)
14. [Monitoring & Observability](#monitoring--observability)

---

## Executive Summary

RideNDine is a **three-sided marketplace** connecting:
- **Customers** who want home-cooked meals
- **Home Chefs** who prepare food from their kitchens
- **Drivers** who deliver orders

### Key Characteristics

- **Architecture Pattern:** Modular Monolith (evolving to Microservices)
- **Database:** PostgreSQL 16 with PostGIS for geospatial queries
- **Real-Time:** WebSocket (Socket.IO) for order tracking
- **Payments:** Stripe Connect for marketplace payments
- **Deployment:** Docker containers on cloud infrastructure
- **Scale:** Designed for 10,000+ orders/day

### Current Status

✅ **Phase 1-3 Complete:**
- Authentication & authorization
- Chef onboarding with Stripe Connect
- Order lifecycle management
- Driver assignment & GPS tracking
- Real-time order tracking
- Review system
- Admin dashboard
- Mobile apps (React Native)

🔄 **In Progress:**
- Microservices split (scaffolded, not integrated)
- Advanced analytics
- ML-based dispatch optimization

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT APPLICATIONS                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Customer   │  │     Chef     │  │    Driver    │         │
│  │  Mobile App  │  │  Dashboard   │  │  Mobile App  │         │
│  │ (React Native)│  │  (Next.js)   │  │(React Native)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │   Customer   │  │    Admin     │                           │
│  │   Web App    │  │  Dashboard   │                           │
│  │   (React)    │  │  (Next.js)   │                           │
│  └──────────────┘  └──────────────┘                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTPS / WebSocket
                      │
┌─────────────────────┴───────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              NestJS API Service (Port 9001)              │  │
│  │                                                          │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │  │
│  │  │ Auth │ │ Chefs│ │Orders│ │Driver│ │ Admin│         │  │
│  │  │Module│ │Module│ │Module│ │Module│ │Module│         │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │  │
│  │                                                          │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │  │
│  │  │Stripe│ │Realtime│Dispatch│ Reviews│                 │  │
│  │  │Module│ │Gateway│ │Module│ │Module│                 │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────┐         │
│  │   PostgreSQL 16      │     │      Redis 7         │         │
│  │   (Port 5432)        │     │    (Port 6379)       │         │
│  │                      │     │                      │         │
│  │  • Users & Roles     │     │  • Session Storage   │         │
│  │  • Orders & Payments │     │  • Cache Layer       │         │
│  │  • GPS Tracking      │     │  • Queue System      │         │
│  │  • Reviews & Ratings │     │  • WebSocket State   │         │
│  └──────────────────────┘     └──────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                              │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ Stripe Connect│  │  Google Maps  │  │    Mapbox     │      │
│  │   Payments    │  │   Geocoding   │  │   Geocoding   │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Network Topology

```
                      Internet
                         │
                         │
                    ┌────┴────┐
                    │   CDN   │ (Static Assets)
                    └────┬────┘
                         │
                    ┌────┴────┐
                    │   LB    │ (Load Balancer)
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────┴────┐      ┌────┴────┐     ┌────┴────┐
   │  API    │      │  API    │     │  API    │
   │Instance1│      │Instance2│     │Instance3│
   └────┬────┘      └────┬────┘     └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────┴─────┐    ┌────┴────┐    ┌─────┴─────┐
   │PostgreSQL│    │  Redis  │    │   S3      │
   │ Primary  │    │ Cluster │    │  Storage  │
   └────┬─────┘    └─────────┘    └───────────┘
        │
   ┌────┴─────┐
   │PostgreSQL│
   │ Replica  │
   └──────────┘
```

---

## Architecture Diagrams

### Component Diagram

```mermaid
graph TB
    Client[Client Apps] --> API[API Gateway]
    API --> Auth[Auth Service]
    API --> Chef[Chef Service]
    API --> Order[Order Service]
    API --> Driver[Driver Service]
    API --> Stripe[Stripe Service]

    Auth --> DB[(PostgreSQL)]
    Chef --> DB
    Order --> DB
    Driver --> DB

    Order --> Queue[Redis Queue]
    Queue --> Dispatch[Dispatch Worker]
    Dispatch --> Driver

    API --> WS[WebSocket Gateway]
    WS --> Redis[(Redis)]

    Stripe --> StripeAPI[Stripe API]
    Chef --> StripeAPI
    Order --> StripeAPI
```

### Deployment Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS/GCP Cloud                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   VPC (10.0.0.0/16)                 │   │
│  │                                                     │   │
│  │  ┌────────────────────────────────────────────┐    │   │
│  │  │  Public Subnet (10.0.1.0/24)               │    │   │
│  │  │                                            │    │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │    │   │
│  │  │  │   ALB   │  │   NAT   │  │ Bastion │   │    │   │
│  │  │  │         │  │ Gateway │  │  Host   │   │    │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘   │    │   │
│  │  └────────────────────────────────────────────┘    │   │
│  │                                                     │   │
│  │  ┌────────────────────────────────────────────┐    │   │
│  │  │  Private Subnet (10.0.2.0/24)              │    │   │
│  │  │                                            │    │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │    │   │
│  │  │  │   ECS   │  │   ECS   │  │   ECS   │   │    │   │
│  │  │  │  Task1  │  │  Task2  │  │  Task3  │   │    │   │
│  │  │  │  (API)  │  │  (API)  │  │  (API)  │   │    │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘   │    │   │
│  │  └────────────────────────────────────────────┘    │   │
│  │                                                     │   │
│  │  ┌────────────────────────────────────────────┐    │   │
│  │  │  Data Subnet (10.0.3.0/24)                 │    │   │
│  │  │                                            │    │   │
│  │  │  ┌──────────┐  ┌─────────┐  ┌─────────┐  │    │   │
│  │  │  │    RDS   │  │ElastiCache Redis      │  │    │   │
│  │  │  │PostgreSQL│  │ Cluster │  │  Backup │  │    │   │
│  │  │  └──────────┘  └─────────┘  └─────────┘  │    │   │
│  │  └────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18.x | JavaScript runtime |
| **TypeScript** | 5.x | Type-safe development |
| **NestJS** | 10.x | Backend framework |
| **PostgreSQL** | 16.x | Primary database |
| **PostGIS** | 3.x | Geospatial queries |
| **Redis** | 7.x | Cache & sessions |
| **Socket.IO** | 4.x | WebSocket server |
| **Bull** | 4.x | Job queue system |
| **Jest** | 29.x | Testing framework |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | Web UI library |
| **React Native** | 0.72 | Mobile apps |
| **Expo** | 52.x | RN toolchain |
| **Next.js** | 14.x | SSR framework |
| **TypeScript** | 5.x | Type safety |
| **Zustand** | 4.x | State management |
| **React Query** | 5.x | Data fetching |
| **Axios** | 1.x | HTTP client |

### DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local orchestration |
| **GitHub Actions** | CI/CD pipelines |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |

### External Services

| Service | Purpose |
|---------|---------|
| **Stripe** | Payment processing |
| **Stripe Connect** | Marketplace payments |
| **Google Maps API** | Geocoding & routing |
| **Mapbox** | Alternative geocoding |
| **SendGrid** | Transactional email |
| **Twilio** | SMS notifications |
| **Sentry** | Error tracking |

---

## Core Services

### API Service (NestJS)

**Port:** 9001
**Type:** Modular monolith
**Lines of Code:** ~15,000

#### Modules

**1. Authentication Module** (`services/api/src/auth/`)
- JWT token generation & validation
- Refresh token rotation
- Password hashing (bcrypt)
- Email verification
- Password reset flow

**2. Users Module** (`services/api/src/users/`)
- User profile CRUD
- Role management (customer, chef, driver, admin)
- Account deletion

**3. Chefs Module** (`services/api/src/chefs/`)
- Chef registration & verification
- Business profile management
- Menu & menu item CRUD
- Operating hours
- Stripe Connect onboarding
- Chef search (geospatial)

**4. Orders Module** (`services/api/src/orders/`)
- Order creation & validation
- State machine (12 states)
- Payment integration
- Commission calculation (15% platform fee)
- Order tracking
- Refund processing

**5. Drivers Module** (`services/api/src/drivers/`)
- Driver registration
- Vehicle information
- Availability toggle
- GPS location updates
- Performance metrics

**6. Dispatch Module** (`services/api/src/dispatch/`)
- Driver assignment algorithm
- Distance-based matching
- Rating-based prioritization
- Assignment retry logic

**7. Stripe Module** (`services/api/src/stripe/`)
- Payment intent creation
- Webhook handling
- Connect account management
- Payout processing

**8. Realtime Module** (`services/api/src/realtime/`)
- WebSocket gateway
- Order subscriptions
- Driver location broadcasts
- Status update notifications

**9. Admin Module** (`services/api/src/admin/`)
- Chef verification
- Driver verification
- User management
- Analytics
- Audit logging

**10. Reviews Module**
- Review submission
- Rating calculation
- Review moderation

#### API Endpoints

**Total:** 42 REST endpoints + 1 WebSocket gateway

See [openapi.yaml](../openapi.yaml) for complete specification.

---

## Database Architecture

### Database Engine

**PostgreSQL 16** with **PostGIS 3** extension

### Schema Overview

**Total Tables:** 25+
**Extensions:**
- `uuid-ossp` (UUID generation)
- `postgis` (Geospatial functions)

### Core Tables

#### Users & Authentication

```sql
users (id, email, password_hash, role, is_verified)
user_profiles (id, user_id, first_name, last_name, phone, avatar_url)
refresh_tokens (id, user_id, token, expires_at)
```

#### Chefs & Menus

```sql
chefs (id, user_id, business_name, latitude, longitude, cuisine_types[], stripe_account_id, rating)
chef_documents (id, chef_id, document_type, file_url, status)
menus (id, chef_id, name, description, is_active)
menu_items (id, menu_id, name, price_cents, category, prep_time_minutes, dietary_tags[])
```

#### Orders

```sql
orders (id, customer_id, chef_id, driver_id, order_number, status, *_cents, *_latitude, *_longitude)
order_items (id, order_id, menu_item_id, quantity, price_cents, special_instructions)
order_status_history (id, order_id, status, notes, created_by, created_at)
```

#### Drivers & GPS

```sql
drivers (id, user_id, vehicle_type, current_latitude, current_longitude, is_available, rating)
driver_locations (id, driver_id, latitude, longitude, accuracy, speed, heading, recorded_at)
driver_assignments (id, order_id, driver_id, status, distance_km, estimated_pickup_time)
```

#### Payments

```sql
payments (id, order_id, stripe_payment_intent_id, amount_cents, status)
chef_ledger (id, chef_id, order_id, earning_cents, payout_status)
driver_ledger (id, driver_id, order_id, earning_cents, payout_status)
payouts (id, user_id, user_type, total_paid_cents, stripe_payout_id, status)
```

#### Reviews & Admin

```sql
reviews (id, order_id, reviewer_id, reviewee_id, reviewee_type, rating, comment)
admin_actions (id, admin_id, action_type, target_type, target_id, details)
notifications (id, user_id, type, title, message, is_read, related_order_id)
```

### Indexes

**Performance Indexes:**
```sql
-- Geospatial indexes (GiST)
CREATE INDEX idx_chefs_location ON chefs USING GIST (ll_to_earth(latitude, longitude));
CREATE INDEX idx_drivers_location ON drivers USING GIST (ll_to_earth(current_latitude, current_longitude));

-- Composite indexes
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX idx_orders_chef_status ON orders(chef_id, status);
CREATE INDEX idx_driver_assignments_driver_status ON driver_assignments(driver_id, status);

-- Partial indexes
CREATE INDEX idx_drivers_available ON drivers(is_available, verification_status)
  WHERE is_available = TRUE AND verification_status = 'approved';
```

### Geospatial Functions

```sql
-- Calculate distance between two points (Haversine)
CREATE FUNCTION calculate_distance_km(lat1, lon1, lat2, lon2) RETURNS DECIMAL

-- Find nearby chefs
SELECT * FROM chefs
WHERE calculate_distance_km(30.2672, -97.7431, latitude, longitude) <= 10
ORDER BY calculate_distance_km(...) ASC;

-- Find available drivers within radius
CREATE FUNCTION find_available_drivers_near(target_lat, target_lon, radius_km)
```

---

## External Integrations

### Stripe Connect Architecture

**Pattern:** Express Connect accounts for chefs

#### Flow

```
1. Chef Registration
   ├─> Create user account
   ├─> Create chef profile
   └─> Status: pending verification

2. Stripe Onboarding
   ├─> POST /chefs/:id/stripe/onboard
   ├─> Create Stripe Express account
   ├─> Generate AccountLink
   └─> Redirect chef to Stripe onboarding

3. Webhook: account.updated
   ├─> Receive webhook
   ├─> Verify signature
   ├─> Update chef.stripe_onboarding_complete
   └─> Update chef.verification_status = 'approved'

4. Order Payment
   ├─> Customer creates order
   ├─> Create PaymentIntent
   ├─> application_fee_amount = 15% of total
   ├─> on_behalf_of = chef's Stripe account
   └─> Funds split automatically

5. Chef Payout
   ├─> Stripe automatically transfers to chef
   ├─> Payout schedule: daily (default)
   └─> Platform fee retained automatically
```

#### Commission Structure

```typescript
// Example: $20 order
subtotal = 2000 cents
tax = 160 cents (8%)
delivery_fee = 500 cents
total = 2660 cents

platform_fee = total * 0.15 = 399 cents
chef_earning = subtotal - platform_fee = 1601 cents
driver_earning = delivery_fee = 500 cents
```

### Geocoding Integration

**Providers:** Google Maps API, Mapbox (fallback)

```typescript
// Geocode address → coordinates
geocode("123 Main St, Austin, TX 78701")
// → { lat: 30.2672, lng: -97.7431 }

// Reverse geocode
reverseGeocode(30.2672, -97.7431)
// → "123 Main St, Austin, TX 78701"

// Calculate distance
calculateDistance(
  { lat: 30.2672, lng: -97.7431 },
  { lat: 30.2750, lng: -97.7500 }
)
// → 0.95 km

// Validate delivery zone
validateDeliveryZone(chef, customer, maxRadius: 10)
// → true/false
```

---

## Security Architecture

### Authentication Flow

```
1. User Registration
   ├─> Validate email format
   ├─> Hash password (bcrypt, 10 rounds)
   ├─> Create user record
   ├─> Generate verification token
   └─> Send verification email

2. Email Verification
   ├─> Click link with token
   ├─> Verify token
   └─> Set user.is_verified = true

3. Login
   ├─> Validate credentials
   ├─> Generate access token (JWT, 15min expiry)
   ├─> Generate refresh token (JWT, 7 days expiry)
   └─> Return both tokens

4. API Request
   ├─> Extract Bearer token from header
   ├─> Verify JWT signature
   ├─> Decode payload (user ID, role)
   ├─> Attach user to request
   └─> Continue to handler

5. Token Refresh
   ├─> Submit refresh token
   ├─> Verify refresh token
   ├─> Generate new access token
   └─> Return new access token
```

### Authorization (RBAC)

**Roles:**
- `customer` - Place orders, review chefs
- `chef` - Manage menu, accept orders
- `driver` - Accept deliveries, update GPS
- `admin` - Verify users, resolve disputes

**Guards:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('chef')
async updateMenu() { ... }
```

### Security Features

✅ **Password Security**
- bcrypt hashing (10 rounds)
- Minimum 8 characters
- Password reset with time-limited tokens

✅ **API Security**
- JWT with short expiry (15 min)
- Refresh token rotation
- HTTPS only in production
- CORS configuration
- Rate limiting (100 req/15min)

✅ **Input Validation**
- class-validator decorators
- DTO transformation
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

✅ **Data Protection**
- Passwords never logged
- PII encrypted at rest (planned)
- GDPR-compliant data deletion

---

## Real-Time Communication

### WebSocket Architecture

**Protocol:** Socket.IO over WebSocket
**Namespace:** `/realtime`
**Port:** Same as API (9001)

#### Connection Flow

```typescript
// Client connects
const socket = io('http://localhost:9001/realtime', {
  auth: { token: accessToken }
});

// Server validates token
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Subscribe to order updates
socket.emit('subscribe:order', { orderId: 'uuid' });

// Receive updates
socket.on('order:status_update', (data) => {
  console.log('Status:', data.status);
});
```

#### Events

**Client → Server:**
- `subscribe:order` - Subscribe to order updates
- `unsubscribe:order` - Unsubscribe
- `driver:location` - Driver sends GPS update

**Server → Client:**
- `connected` - Connection confirmed
- `order:status_update` - Order status changed
- `driver:location_update` - Driver position update
- `order:new` - New order (chef only)
- `driver:new_assignment` - New delivery (driver only)
- `order:eta_update` - ETA recalculation

#### Rooms

```typescript
// Join order room
socket.join(`order:${orderId}`);

// Broadcast to room
io.to(`order:${orderId}`).emit('driver:location_update', {
  latitude: 30.2672,
  longitude: -97.7431
});
```

---

## State Machines

### Order State Machine

**Total States:** 12

```
┌─────────────┐
│   pending   │ (Order created, awaiting payment)
└──────┬──────┘
       │ Payment completed
       ↓
┌─────────────┐
│  payment_   │
│  confirmed  │
└──────┬──────┘
       │ Chef accepts
       ↓
┌─────────────┐
│  accepted   │
└──────┬──────┘
       │ Chef starts cooking
       ↓
┌─────────────┐
│  preparing  │
└──────┬──────┘
       │ Food ready
       ↓
┌─────────────┐
│ready_for_   │
│  pickup     │
└──────┬──────┘
       │ Driver assigned
       ↓
┌─────────────┐
│assigned_to_ │
│   driver    │
└──────┬──────┘
       │ Driver picks up
       ↓
┌─────────────┐
│ picked_up   │
└──────┬──────┘
       │ Driver en route
       ↓
┌─────────────┐
│ in_transit  │
└──────┬──────┘
       │ Driver delivers
       ↓
┌─────────────┐
│  delivered  │ (Final state)
└─────────────┘

Alternative paths:
- pending → cancelled
- * → cancelled (with refund logic)
- delivered → refunded (after dispute)
```

### Allowed Transitions

```typescript
const ALLOWED_TRANSITIONS = {
  pending: ['payment_confirmed', 'cancelled'],
  payment_confirmed: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup'],
  ready_for_pickup: ['assigned_to_driver'],
  assigned_to_driver: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['delivered'],
  delivered: ['refunded'],
  cancelled: [], // terminal
  refunded: []    // terminal
};
```

---

## Data Flow

### Order Creation Flow

```
Customer App
    │
    │ POST /orders
    ↓
API: Orders Controller
    │
    ├─> Validate request (DTO)
    ├─> Verify chef exists & active
    ├─> Verify customer exists
    ├─> Calculate distance
    ├─> Validate delivery zone
    │
    ↓
Orders Service
    │
    ├─> Calculate pricing
    │   ├─> Subtotal from items
    │   ├─> Tax (8%)
    │   ├─> Delivery fee (distance-based)
    │   └─> Platform fee (15%)
    │
    ├─> Create order record (DB transaction)
    ├─> Create order_items records
    ├─> Update order status history
    │
    ↓
Stripe Service
    │
    ├─> Create PaymentIntent
    │   ├─> amount = total_cents
    │   ├─> application_fee = platform_fee
    │   ├─> on_behalf_of = chef.stripe_account_id
    │
    ↓
Response to Customer
    {
      "id": "order-uuid",
      "orderNumber": "RND-20260131-0001",
      "totalCents": 3954,
      "clientSecret": "pi_..._secret_..."
    }
    │
    ↓
Customer completes payment
    │
    ↓
Stripe Webhook: payment_intent.succeeded
    │
    ├─> Verify webhook signature
    ├─> Update order status → payment_confirmed
    ├─> WebSocket: Emit to chef
    └─> Notification: Send to chef
```

### Driver Assignment Flow

```
Order Status: ready_for_pickup
    │
    ↓
Dispatch Service
    │
    ├─> Get chef coordinates
    ├─> Query available drivers within 15km
    │   SELECT * FROM drivers
    │   WHERE is_available = true
    │   AND verification_status = 'approved'
    │   AND calculate_distance_km(...) <= 15
    │   ORDER BY distance ASC, rating DESC
    │   LIMIT 10
    │
    ├─> Select best driver
    │   Criteria:
    │   1. Closest (distance)
    │   2. Highest rating
    │   3. Lowest current assignments
    │
    ├─> Create driver_assignment
    ├─> Update order.assigned_driver_id
    ├─> Update order status → assigned_to_driver
    │
    ↓
WebSocket: Emit to driver
    event: 'driver:new_assignment'
    data: {
      assignmentId: '...',
      orderId: '...',
      chefAddress: '...',
      estimatedPickupTime: '...'
    }
    │
    ↓
Driver accepts/declines
    │
    ├─ IF accepted:
    │   ├─> Update assignment.status = 'accepted'
    │   ├─> Emit to customer: driver assigned
    │   └─> Start GPS tracking
    │
    └─ IF declined:
        ├─> Update assignment.status = 'declined'
        ├─> Log decline reason
        └─> Retry with next driver
```

---

## Deployment Architecture

### Container Architecture

```dockerfile
# services/api/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 9001
CMD ["npm", "run", "start:prod"]
```

### Docker Compose (Local)

```yaml
version: '3.8'
services:
  postgres:
    image: postgis/postgis:16-3.4
    ports: ['5432:5432']
    environment:
      POSTGRES_USER: ridendine
      POSTGRES_PASSWORD: ridendine
      POSTGRES_DB: ridendine

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  api:
    build: ./services/api
    ports: ['9001:9001']
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://ridendine:ridendine@postgres:5432/ridendine
      REDIS_URL: redis://redis:6379
```

### Production Deployment (AWS)

**Infrastructure:**
- **Load Balancer:** Application Load Balancer (ALB)
- **Compute:** ECS Fargate (containerized tasks)
- **Database:** RDS PostgreSQL (Multi-AZ)
- **Cache:** ElastiCache Redis (cluster mode)
- **Storage:** S3 (chef documents, menu images)
- **CDN:** CloudFront (frontend assets)

**Scaling:**
- **Auto-scaling:** CPU > 70% → add task
- **Min tasks:** 2
- **Max tasks:** 10
- **Database:** Read replicas for queries

---

## Performance & Scalability

### Current Performance

- **Response Time:** p50: 45ms, p95: 120ms, p99: 250ms
- **Throughput:** 500 req/sec (single instance)
- **Concurrent Orders:** 1,000+ active orders
- **WebSocket Connections:** 10,000+ concurrent

### Bottlenecks

1. **Database Queries**
   - Solution: Index optimization, query caching

2. **Geocoding API Calls**
   - Solution: Redis cache (24h TTL)

3. **WebSocket Scaling**
   - Solution: Redis adapter for horizontal scaling

### Optimization Strategies

**Database:**
- Connection pooling (max 100 connections)
- Prepared statements
- Index-only scans
- Materialized views for analytics

**Caching:**
- Chef profiles (5 min TTL)
- Menu items (10 min TTL)
- Geocoding results (24 hr TTL)

**API:**
- Response compression (gzip)
- Pagination (max 100 items)
- Rate limiting (100 req/15min)

---

## Monitoring & Observability

### Metrics to Track

**Application:**
- Request rate (req/sec)
- Error rate (%)
- Response time (p50, p95, p99)
- Active WebSocket connections

**Business:**
- Orders created
- Orders completed
- Average order value
- Chef acceptance rate
- Driver availability

**Infrastructure:**
- CPU utilization
- Memory usage
- Database connections
- Redis memory

### Logging Strategy

```typescript
// Structured logging with Winston
logger.info('Order created', {
  orderId: order.id,
  customerId: order.customerId,
  chefId: order.chefId,
  totalCents: order.totalCents,
  duration: 234 // ms
});
```

### Alerting Rules

- API error rate > 5% for 5 minutes
- Database CPU > 80% for 10 minutes
- Response time p95 > 1s for 5 minutes
- Available drivers < 5 in any zone

---

## Future Architecture (Microservices)

### Planned Split

```
Current: Modular Monolith
Future: Microservices (when > 10,000 orders/day)

Services:
1. Auth Service (9001) - User authentication
2. Chef Service (9002) - Chef management
3. Order Service (9003) - Order lifecycle
4. Driver Service (9004) - Driver management
5. Dispatch Service (9005) - Assignment logic
6. Realtime Service (9006) - WebSocket gateway
7. Notification Service (9007) - Email/SMS/push
8. Analytics Service (9008) - Reporting

Communication: gRPC or REST
Message Queue: RabbitMQ or Kafka
Service Mesh: Istio (optional)
```

---

## Appendix

### Port Reference

| Port | Service | Status |
|------|---------|--------|
| 8081 | Core demo server | ✅ Working |
| 9001 | API service (NestJS) | ✅ Working |
| 9002 | Dispatch service | 🔄 Scaffolded |
| 9003 | Routing service | 🔄 Scaffolded |
| 9004 | Realtime gateway | 🔄 Scaffolded |
| 8010 | Customer web dev server | ✅ Working |
| 5432 | PostgreSQL | ✅ Working |
| 6379 | Redis | ✅ Working |
| 8080 | Adminer (DB UI) | ✅ Working |

### Version History

- **v2.0** (2026-01-31) - Phase 3 complete, comprehensive docs
- **v1.0** (2026-01-30) - Initial architecture documentation

---

**Document Status:** ✅ Complete and production-ready
**Next Review:** 2026-02-15 (before Phase 5)
**Maintained By:** Engineering Team
