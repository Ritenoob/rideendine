# RideNDine Glossary

Complete glossary of domain terms, technical concepts, and platform-specific terminology used throughout the RideNDine platform.

**Last Updated:** 2026-01-31

---

## Platform Terms

### Chef

A home cook who prepares food from their own kitchen and sells it through the RideNDine platform. Chefs must complete verification (business license, food handler's certificate) and Stripe Connect onboarding before accepting orders.

**Aliases:** Home chef, cook, food provider
**See also:** Stripe Connect, Verification

### Customer

A user who browses chef menus, places orders, and receives food deliveries. Customers can save addresses, payment methods, and view order history.

**Aliases:** Buyer, end user, consumer

### Driver

A delivery person who picks up prepared food from chefs and delivers it to customers. Drivers must pass background checks and vehicle verification before going online.

**Aliases:** Delivery driver, courier, dasher

### Admin

Platform staff with elevated permissions to verify chefs/drivers, resolve disputes, process refunds, and view analytics.

**Aliases:** Administrator, platform admin, staff

---

## Order Lifecycle

### Order

A request from a customer to purchase food from a chef. Contains order items, pricing breakdown, delivery address, and payment information.

**Fields:**

- Order number (e.g., "RND-20260131-0001")
- Status (12 possible states)
- Total amount (in cents)
- Chef/customer/driver IDs
- Timestamps (created, estimated delivery, actual delivery)

**See also:** Order Status, State Machine

### Order Status

The current state of an order in its lifecycle. Total of 12 states from creation to completion.

**States:**

1. `pending` - Order created, awaiting payment
2. `payment_confirmed` - Payment successful, awaiting chef acceptance
3. `accepted` - Chef accepted order
4. `preparing` - Chef is cooking
5. `ready_for_pickup` - Food is ready
6. `assigned_to_driver` - Driver assigned
7. `picked_up` - Driver has food
8. `in_transit` - Driver en route to customer
9. `delivered` - Order completed successfully
10. `cancelled` - Order cancelled (with refund)
11. `refunded` - Order refunded after delivery (dispute)

**See also:** State Machine, Order

### State Machine

A pattern where an order can only transition between specific states in a defined sequence. Prevents invalid state changes (e.g., can't go from `pending` directly to `delivered`).

**Example transitions:**

- ✅ `pending` → `payment_confirmed` (allowed)
- ❌ `pending` → `delivered` (not allowed)

**See also:** Order Status

### Order Number

A unique human-readable identifier for an order, formatted as `RND-YYYYMMDD-NNNN` where:

- `RND` = RideNDine prefix
- `YYYYMMDD` = Date (e.g., 20260131)
- `NNNN` = Sequential number (e.g., 0001)

**Example:** `RND-20260131-0042` (42nd order on January 31, 2026)

---

## Financial Terms

### Commission

The percentage fee the platform charges on each order. Default is **15% of the total order amount**.

**Calculation:**

```
Total = $20.00
Platform Fee (15%) = $3.00
Chef Earning = $17.00
```

**See also:** Platform Fee, Chef Earnings

### Platform Fee

The dollar amount deducted from each order as commission. Calculated as a percentage of the order total.

**Stored in:** `orders.platform_fee_cents` (in database)

**See also:** Commission

### Chef Earnings

The amount a chef receives after platform fees are deducted from the order subtotal.

**Formula:**

```
Chef Earnings = Subtotal - Platform Fee
```

**Example:**

```
Subtotal: $20.00
Platform Fee (15%): $3.00
Chef Earnings: $17.00
```

**Stored in:** `orders.chef_earning_cents`

**See also:** Chef Ledger, Payout

### Driver Earnings

The delivery fee paid to the driver for completing a delivery, plus any customer tip.

**Formula:**

```
Driver Earnings = Delivery Fee + Tip
```

**Example:**

```
Delivery Fee: $5.00
Tip: $3.00
Driver Earnings: $8.00
```

**Stored in:** `orders.driver_earning_cents`

**See also:** Driver Ledger, Delivery Fee

### Delivery Fee

The amount charged to the customer for delivery service, which goes entirely to the driver.

**Calculation:** Typically distance-based

- Base fee: $3.00
- Per km: $0.50
- Example: 5km delivery = $3.00 + ($0.50 × 5) = $5.50

**Stored in:** `orders.delivery_fee_cents`

### Subtotal

The sum of all menu item prices before taxes, fees, or tips.

**Example:**

```
2x Spaghetti Carbonara ($15.99 each) = $31.98
1x Tiramisu ($8.00) = $8.00
Subtotal = $39.98
```

**Stored in:** `orders.subtotal_cents`

### Tax

Sales tax applied to the order, calculated as a percentage of the subtotal (varies by jurisdiction, typically 8-10%).

**Example:**

```
Subtotal: $39.98
Tax (8%): $3.20
```

**Stored in:** `orders.tax_cents`

### Total

The final amount charged to the customer, including subtotal, tax, delivery fee, platform fee, and tip.

**Formula:**

```
Total = Subtotal + Tax + Delivery Fee + Platform Fee + Tip
```

**Stored in:** `orders.total_cents`

### Tip

Optional gratuity added by the customer for the driver. Common amounts: 15%, 18%, 20%, or custom.

**Example:**

```
Subtotal: $40.00
Tip (18%): $7.20
```

**Note:** Tips go 100% to the driver

### Cents

All monetary values in the database are stored as integers representing cents to avoid floating-point precision errors.

**Example:**

```
$15.99 → 1599 cents
$0.50 → 50 cents
```

**Why:** Avoids issues like `0.1 + 0.2 = 0.30000000000000004` in JavaScript

---

## Payment Terms

### Stripe

Third-party payment processor used for handling customer payments and marketplace payouts.

**Website:** https://stripe.com

**See also:** Stripe Connect, Payment Intent

### Stripe Connect

Stripe's platform for marketplace payments, allowing RideNDine to split payments between the platform and chefs automatically.

**Pattern Used:** Express Connect accounts

**Flow:**

1. Chef creates Stripe Express account
2. Customer pays RideNDine
3. Funds automatically split (85% to chef, 15% to platform)
4. Chef receives payout to their bank account

**See also:** Onboarding, Payout

### Payment Intent

A Stripe object representing a customer's intent to pay. Created before collecting payment details.

**Properties:**

- `client_secret` - Used by frontend to complete payment
- `amount` - Total amount in cents
- `status` - pending, processing, succeeded, failed

**API:** `POST /orders/:id/create-payment-intent`

**See also:** Client Secret

### Client Secret

A temporary secret key from Stripe used to complete a payment on the frontend without exposing the full payment intent details.

**Format:** `pi_abc123_secret_def456`

**Usage:** Passed to Stripe.js or mobile SDK to show payment sheet

**Security:** Single-use, expires after payment completion

### Webhook

An HTTP callback from Stripe to the RideNDine API when payment events occur (e.g., payment succeeded, refund processed).

**Endpoint:** `POST /webhooks/stripe`

**Security:** Verified using `stripe_webhook_secret`

**Example events:**

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated`
- `charge.refunded`

**See also:** Stripe

### Payout

Transfer of earnings from the platform to a chef or driver's bank account.

**Schedule:** Automatic (daily for Stripe Connect accounts)

**Stored in:** `payouts` table

**See also:** Chef Ledger, Driver Ledger

### Refund

Return of payment to customer, typically due to order cancellation or dispute resolution.

**API:** `POST /orders/:id/refund`

**Processing:** Handled via Stripe refund API

**Timeline:** 5-10 business days to customer's original payment method

---

## Location Terms

### Geocoding

The process of converting a street address into geographic coordinates (latitude, longitude).

**Example:**

```
Input: "123 Main St, Austin, TX 78701"
Output: { lat: 30.2672, lng: -97.7431 }
```

**Providers:** Google Maps API, Mapbox

**See also:** Reverse Geocoding, Coordinates

### Reverse Geocoding

The opposite of geocoding - converting coordinates into a human-readable address.

**Example:**

```
Input: { lat: 30.2672, lng: -97.7431 }
Output: "123 Main St, Austin, TX 78701"
```

**Use case:** Getting address from GPS coordinates

### Coordinates

A pair of numbers representing a location on Earth: latitude and longitude.

**Format:**

- Latitude: -90 to 90 (North/South)
- Longitude: -180 to 180 (East/West)

**Storage:** `DECIMAL(10, 8)` for latitude, `DECIMAL(11, 8)` for longitude

**See also:** GPS, Geospatial

### GPS

Global Positioning System - satellite-based navigation system providing location and time information.

**Use cases:**

- Customer location for chef search
- Driver location tracking
- Delivery address validation

**Accuracy:** Typically 5-10 meters

### Distance Calculation

Computing the distance between two coordinate pairs using the Haversine formula.

**Function:** `calculate_distance_km(lat1, lon1, lat2, lon2)`

**Returns:** Distance in kilometers

**Use cases:**

- Chef search radius
- Delivery fee calculation
- Driver assignment

**See also:** Haversine Formula

### Haversine Formula

Mathematical formula for calculating great-circle distance between two points on a sphere (Earth).

**Accuracy:** Assumes Earth is a perfect sphere (good enough for <1000km distances)

**Implementation:** PostgreSQL function in database

### Delivery Radius

The maximum distance a chef is willing to deliver, measured in kilometers.

**Default:** 10 km

**Storage:** `chefs.delivery_radius`

**Validation:** Customer must be within chef's delivery radius to place order

### Delivery Zone

The geographic area where a chef offers delivery service, defined by their location and delivery radius.

**Example:** Chef at (30.2672, -97.7431) with 10km radius can deliver to anyone within 10km circle

**Validation:** `validateDeliveryZone(chefLocation, customerLocation, maxRadius)`

---

## Technical Terms

### JWT (JSON Web Token)

A compact, URL-safe token format used for authentication. Contains user ID, role, and expiration time.

**Structure:** `header.payload.signature`

**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkIiwicm9sZSI6ImN1c3RvbWVyIn0.signature`

**Expiry:** 15 minutes (access token), 7 days (refresh token)

**See also:** Access Token, Refresh Token

### Access Token

Short-lived JWT used for authenticating API requests. Must be included in `Authorization: Bearer <token>` header.

**Expiry:** 15 minutes

**Storage:** Memory (not localStorage for security)

**Refresh:** Use refresh token to get new access token

### Refresh Token

Long-lived JWT used to obtain new access tokens without re-entering credentials.

**Expiry:** 7 days

**Storage:** Secure storage (HttpOnly cookie or encrypted storage)

**Security:** Rotated on each use

### API (Application Programming Interface)

Interface for programmatic access to RideNDine functionality. Built with NestJS, documented with OpenAPI.

**Base URL:** `http://localhost:9001` (development)

**Docs:** `http://localhost:9001/api/docs` (Swagger UI)

**See also:** REST, Endpoint

### REST (Representational State Transfer)

Architectural style for APIs using standard HTTP methods (GET, POST, PATCH, DELETE).

**Principles:**

- Stateless (no session state on server)
- Resource-based URLs (`/orders/:id`)
- Standard HTTP status codes (200, 400, 401, etc.)

### Endpoint

A specific URL + HTTP method combination that performs an action.

**Examples:**

- `POST /auth/login` - Authenticate user
- `GET /chefs/search` - Find chefs
- `PATCH /orders/:id/accept` - Chef accepts order

**Total:** 42 REST endpoints + 1 WebSocket gateway

### WebSocket

Persistent bidirectional communication channel between client and server, used for real-time updates.

**Protocol:** Socket.IO over WebSocket

**Namespace:** `/realtime`

**Use cases:**

- Order status updates
- Driver location updates
- ETA recalculations

**See also:** Socket.IO, Real-Time

### Socket.IO

JavaScript library providing real-time, event-based communication via WebSocket with fallbacks.

**Events:**

- Client → Server: `subscribe:order`, `driver:location`
- Server → Client: `order:status_update`, `driver:location_update`

**See also:** WebSocket

### Real-Time

Immediate data updates without page refresh or polling. Implemented via WebSocket connections.

**Examples:**

- Live driver location on map
- Order status changes
- ETA countdown

### ETA (Estimated Time of Arrival)

Predicted time when order will be delivered to customer.

**Calculation:**

```
ETA = Prep Time + Pickup Time + Transit Time
```

**Updates:** Recalculated when driver location changes

**Stored in:** `orders.estimated_delivery_time`

---

## Database Terms

### PostgreSQL

Open-source relational database used for storing all RideNDine data.

**Version:** 16

**Extensions:** uuid-ossp (UUID generation), postgis (geospatial queries)

**See also:** Database, SQL

### PostGIS

PostgreSQL extension adding support for geographic objects and spatial queries.

**Features:**

- Distance calculations
- Radius searches
- Spatial indexes (GiST)

**See also:** Geospatial, Spatial Index

### Migration

SQL script that modifies database schema (create/alter/drop tables, indexes, etc.).

**Location:** `database/migrations/`

**Naming:** `001_description.sql`, `002_description.sql`, etc.

**Execution:** Sequential, idempotent

**See also:** Schema

### Schema

The structure of the database - table definitions, columns, data types, constraints, and relationships.

**Total tables:** 25+

**See also:** Database, Table

### Index

Database structure that speeds up query performance by creating a sorted lookup table.

**Types:**

- B-tree (standard, for =, <, >, BETWEEN)
- GiST (geospatial, for location queries)
- Partial (filtered subset)

**Example:** `CREATE INDEX idx_orders_status ON orders(status);`

### Spatial Index

Geospatial index (GiST) optimizing location-based queries like "find chefs within 10km".

**Syntax:** `CREATE INDEX idx_chefs_location ON chefs USING GIST (ll_to_earth(latitude, longitude));`

**Performance:** O(log n) instead of O(n) for radius searches

---

## Role Terms

### RBAC (Role-Based Access Control)

Security model where permissions are assigned based on user role.

**Roles:** customer, chef, driver, admin

**Implementation:** `@Roles('chef')` decorator on endpoints

**Example:** Only chefs can accept orders

### Permission

Specific action a role can perform (e.g., "create order", "verify chef", "update menu").

**Enforcement:** Guards check user role before allowing action

**See also:** RBAC, Guard

### Guard

NestJS middleware that checks if a request should be allowed based on authentication and authorization.

**Types:**

- `JwtAuthGuard` - Verifies access token
- `RolesGuard` - Checks user role

**See also:** RBAC, Middleware

---

## Verification Terms

### Verification

The process of confirming a chef or driver meets platform requirements before allowing them to operate.

**Chef verification:**

- Business license
- Food handler's certificate
- Insurance
- Admin review

**Driver verification:**

- Driver's license
- Vehicle registration
- Insurance
- Background check

**Status:** `pending`, `approved`, `rejected`

### Onboarding

The process a new chef completes to set up their Stripe Connect account for receiving payments.

**Steps:**

1. Click "Setup Payments"
2. Redirected to Stripe
3. Enter business details
4. Link bank account
5. Submit tax information
6. Return to app (webhook updates status)

**See also:** Stripe Connect

---

## Glossary Conventions

- **Aliases:** Alternative names for the same concept
- **See also:** Related terms to explore
- **Formula:** Mathematical or logical calculation
- **Example:** Concrete illustration of the concept
- **Storage:** Where the data is persisted (table.column)
- **API:** Relevant API endpoint

---

**Total Terms:** 75+
**Document Status:** ✅ Complete
**Last Updated:** 2026-01-31
