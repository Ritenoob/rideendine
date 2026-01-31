# RideNDine - GitHub Copilot Instructions

Home kitchen food delivery platform connecting customers with local home chefs through live dispatch and tracking.

---

## Build, Test, and Lint

### Root-level Commands

```bash
# Build all workspaces
npm run build

# Run tests across all workspaces
npm run test

# Lint all TypeScript and JavaScript
npm run lint

# Format code
npm run format
npm run format:check  # Check without modifying

# Database management
npm run db:up          # Start PostgreSQL + Redis containers
npm run db:down        # Stop containers
npm run db:migrate     # Run all migrations from database/migrations/
npm run db:seed        # Seed test users
npm run db:reset       # Full reset: down → up → migrate → seed

# Create admin user
npm run create-admin
```

### API Service (NestJS)

```bash
cd services/api

# Development
npm run start:dev      # Watch mode with hot reload
npm run start:debug    # Debug mode with watch

# Production
npm run build
npm run start:prod

# Testing
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:cov       # With coverage
npm run test:e2e       # End-to-end tests

# Code quality
npm run lint           # ESLint with auto-fix
npm run format         # Prettier
```

### Core Demo Server

```bash
# Start single-server demo (all features in one process)
node ridendine_v2_live_routing/server.js

# Background with logging
nohup node ridendine_v2_live_routing/server.js >/tmp/ridendine_core.log 2>&1 &

# Open demo UI
open ridendine_v2_live_routing/index.html  # Port 8081
```

---

## Architecture

### Two Deployment Modes

**1. Single-Core Demo (Working)**
- All features in one Node.js server: `ridendine_v2_live_routing/server.js` (1050 lines)
- Auth, GPS ingestion, routing proxy, dispatch, batching, pricing, reliability scoring, WebSocket
- In-memory state persisted to `demo_state.json`
- Default port: **8081**
- UI: `ridendine_v2_live_routing/index.html` (1062 lines)

**2. Service Split (In Progress)**
- `services/api/` - NestJS REST API (auth, chefs, orders, users) on port **9001**
- `services/dispatch/` - Assignment + batching logic on port **9002** (prototype)
- `services/routing/` - Provider abstraction (OSRM/Mapbox/Google) on port **9003** (prototype)
- `services/realtime/` - WebSocket gateway on port **9004** (prototype)

**Current Status:** API service is actively developed (Week 4 of Phase 2). Other services are scaffolds with logic but not integrated.

### Database Layer

**Migrations:** Located in `database/migrations/`, run sequentially:
- `001_initial_schema.sql` - Core tables (users, chefs, menus, orders, payments)
- `002_chef_enhancements.sql` - Minimum order, delivery radius, operating hours, promo codes, tips
- `003_admin_actions.sql` - Admin audit log table

**Connection String:** `postgresql://ridendine:ridendine_dev_password@localhost:5432/ridendine_dev`

**Key Tables:**
- `users` - Unified user table with role enum (customer/chef/driver/admin)
- `chefs` - Business info, Stripe account, verification status, geolocation
- `menus` / `menu_items` - Menu management with availability schedules
- `orders` - Main order table with state machine (12 states)
- `order_items` - Line items for each order
- `payments` - Stripe payment intents and statuses
- `chef_ledger` / `driver_ledger` - Earnings tracking for payouts
- `admin_actions` - Audit log for all admin operations

### Module Structure (NestJS API)

```
services/api/src/
├── auth/               # JWT authentication, role guards
├── users/              # User CRUD
├── chefs/              # Chef application, profiles, search
├── menus/              # Menu and item management
├── orders/             # Order creation, state machine, queries
├── stripe/             # Stripe Connect integration + webhooks
├── admin/              # Admin verification, audit logs
├── common/             # Shared guards, decorators, filters
├── config/             # Environment configuration
└── database/           # Database service wrapper
```

**Module Dependencies:**
- All modules use `DatabaseModule` for PostgreSQL connection
- `StripeModule` is global (used by chefs and orders)
- `AuthModule` provides guards used across all protected routes
- `ConfigModule` is global, loads from `.env`

---

## Key Conventions

### File Backup Protocol

**CRITICAL:** All file edits must create a timestamped backup:

```bash
# Before editing any file
cp file.ts "file.ts.bak.$(date +%Y-%m-%d_%H-%M-%S).reason"
```

Backup location: Same directory as original file (`.bak` files are gitignored).

### Order State Machine

Orders follow a strict state machine with 12 states defined in `services/api/src/orders/order-state-machine.ts`:

**Primary Flow:**
```
pending → payment_confirmed → accepted → preparing → ready_for_pickup →
assigned_to_driver → picked_up → in_transit → delivered
```

**Cancellation Paths:**
```
pending → cancelled (no refund needed)
payment_confirmed+ → rejected → refunded (requires Stripe refund)
```

**Terminal States:** `delivered`, `refunded` (no further transitions allowed)

**Usage:**
- Always validate transitions with `OrderStateMachine.canTransition(from, to)`
- Use `requiresRefund(state)` to determine if cancellation needs Stripe refund
- State history tracked in `order_status_history` table

### Commission Calculation

Defined in `services/api/src/orders/commission-calculator.ts`:

- **Platform fee:** 15% of subtotal (rounded to cents)
- **Tax:** 8% of subtotal (rounded to cents)
- **Delivery fee:** $5.00 fixed (Week 5 will add dynamic distance-based pricing)
- **Chef earnings:** subtotal - platform_fee (85% of subtotal)
- **Total:** subtotal + tax + delivery_fee

Example calculation for $30 order:
```typescript
const result = CommissionCalculator.calculate(3000); // cents
// result.platformFeeCents = 450 (15%)
// result.taxCents = 240 (8%)
// result.deliveryFeeCents = 500 ($5)
// result.totalCents = 3740 ($37.40)
// result.chefEarningsCents = 2550 (85%)
```

### Stripe Connect Integration

**Architecture:** Express Connect accounts for chefs with destination charges.

**Onboarding Flow:**
1. `POST /chefs/:id/stripe/onboard` - Creates Connect account + AccountLink
2. Chef completes Stripe onboarding (redirected to Stripe)
3. Webhook `account.updated` triggers `handleStripeAccountUpdate()`
4. `GET /chefs/:id/stripe/status` - Check onboarding completion

**Payment Flow (Week 4 in progress):**
1. Create PaymentIntent with `application_fee_amount` (platform commission)
2. Destination charge to chef's Connect account
3. Webhook `payment_intent.succeeded` updates order status

**Important:** Webhook endpoint requires raw body for signature verification. Main.ts configured with route-specific middleware:
```typescript
app.use('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }));
app.use(bodyParser.json());
```

### Authorization Patterns

**Role-based access control (RBAC):**
- `@UseGuards(JwtAuthGuard, RolesGuard)` on protected routes
- `@Roles('customer', 'chef', 'driver', 'admin')` decorator for role restrictions

**Resource ownership checks:**
- Orders: customers can view their own, chefs can view orders for their restaurant, drivers can view assigned orders, admins see all
- Menus: chefs can only edit their own menus
- Implementation: `userOwnsChef(userId, chefId)` helper method

### Order Number Format

Generated in `OrdersService.generateOrderNumber()`:
```
RND-YYYYMMDD-####
```
Example: `RND-20260130-0001`

Sequence resets daily. Current implementation queries count of today's orders (not database sequence).

### Geolocation Search

Haversine formula implemented in `ChefsService.searchChefs()`:
```typescript
// Calculate distance between two lat/lng points
const distance = haversineDistance(
  userLat, userLng,
  chefLat, chefLng
);
```

Filters chefs within specified radius, ordered by distance ascending.

### TypeScript Conventions

From `.eslintrc.js`:
- **Unused parameters:** Prefix with underscore (`_req`) to suppress warnings
- **Any type:** Warning only (not error)
- **Non-null assertion:** Use `!` when property is guaranteed by class-validator decorators

### Operating Hours Format

Stored as JSON in `operating_hours` column:
```json
{
  "monday": { "open": "09:00", "close": "21:00" },
  "tuesday": { "open": "09:00", "close": "21:00" },
  "wednesday": null,
  "thursday": { "open": "09:00", "close": "21:00" }
}
```

Null means closed that day.

### Admin Audit Logging

All admin actions logged to `admin_actions` table:
```typescript
await this.db.query(
  `INSERT INTO admin_actions 
   (admin_id, action_type, target_type, target_id, details)
   VALUES ($1, $2, $3, $4, $5)`,
  [adminId, 'chef_verification', 'chef', chefId, 
   JSON.stringify({ previousStatus, newStatus })]
);
```

Includes: who, what, when, target, and JSONB details for context.

---

## Development Phases

From `DEVELOPMENTPLAN.md` (16-week roadmap):

| Phase | Weeks | Status |
|-------|-------|--------|
| **Phase 1:** Foundation | 1-2 | Complete (DB, Auth) |
| **Phase 2:** Core Features | 3-6 | **Week 4 in progress** |
|   Week 3: Chef Module | 3 | ✅ Complete (21 endpoints) |
|   Week 4: Orders Module | 4 | 🔄 23% complete (2/9 endpoints) |
|   Week 5: Driver & Dispatch | 5 | Not started |
|   Week 6: Real-Time Features | 6 | Not started |
| **Phase 3:** Frontend Apps | 7-10 | Prototypes exist |
| **Phase 4:** Admin & Reviews | 11-12 | Not started |
| **Phase 5:** Testing & Security | 13-14 | Not started |
| **Phase 6:** Launch Prep | 15-16 | Not started |

**Current Focus:** Week 4 - Order Management
- ✅ Order creation with validation
- ✅ State machine (12 states)
- ✅ Commission calculator
- 🔄 Payment intent creation (in progress)
- 🔄 Order state transitions (in progress)
- 🔄 Refund processing (in progress)

---

## Environment Variables

Required in `services/api/.env`:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ridendine
DATABASE_PASSWORD=ridendine_dev_password
DATABASE_NAME=ridendine_dev

# JWT Auth
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Stripe Connect
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_ONBOARDING_REDIRECT=http://localhost:9001/api/stripe/connect/return
STRIPE_CONNECT_REFRESH_URL=http://localhost:9001/api/stripe/connect/refresh

# File Upload
UPLOAD_MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_ALLOWED_MIMETYPES=image/jpeg,image/png,application/pdf

# Core Demo (optional, for backward compatibility)
MAPBOX_TOKEN=pk.ey...
GOOGLE_MAPS_API_KEY=AIza...
OSRM_BASE_URL=http://router.project-osrm.org
```

---

## Port Reference

| Port | Service | Status |
|------|---------|--------|
| 5432 | PostgreSQL | Running via docker-compose |
| 6379 | Redis | Running via docker-compose |
| 8010 | Customer web (React) | Prototype (python http.server) |
| 8081 | Core demo server | Working (all-in-one) |
| 8082 | Expo bundler | Working (customer mobile) |
| 9001 | API service (NestJS) | Active development |
| 9002 | Dispatch service | Scaffold (not integrated) |
| 9003 | Routing service | Scaffold (not integrated) |
| 9004 | Realtime gateway | Scaffold (not integrated) |

---

## Important Files

### Critical Implementation Files

**Order Processing:**
- `services/api/src/orders/orders.service.ts` - Core business logic (300+ lines)
- `services/api/src/orders/order-state-machine.ts` - State validation
- `services/api/src/orders/commission-calculator.ts` - Fee calculations
- `services/api/src/orders/dto/order.dto.ts` - All order DTOs

**Stripe Integration:**
- `services/api/src/stripe/stripe.service.ts` - SDK wrapper (4.2KB)
- `services/api/src/stripe/stripe-webhook.controller.ts` - Event handling
- `services/api/src/chefs/chefs.service.ts` - Lines 344-475: Stripe methods

**Admin Operations:**
- `services/api/src/admin/admin.service.ts` - Verification + audit logging
- `scripts/create-admin.ts` - CLI tool for creating admin users

**Core Demo:**
- `ridendine_v2_live_routing/server.js` - Complete working demo (1050 lines)
- `ridendine_v2_live_routing/index.html` - Dispatch UI (1062 lines)

### Planning Documents

**Sources of Truth (aligned with code):**
- `README.md` - Operational guide
- `AGENTS.md` - Agent roles and skills
- `PHASE2_WEEK3_PROGRESS_FINAL.md` - Week 3 completion summary

**Aspirational (planning only):**
- `DEVELOPMENTPLAN.md` - 16-week roadmap
- `09_backend_architecture.md` - Service split design
- `02_database_schema.md` - Schema reference (implemented in migrations)
- `05_api_endpoint_specs.md` - API baseline (partial match)

---

## Testing Strategy

### API Service Tests

```bash
cd services/api

# Run specific test file
npm test -- auth.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create order"

# Watch mode for specific file
npm test -- --watch chefs.service.spec.ts

# Coverage for single file
npm test -- --coverage --collectCoverageFrom="src/orders/**/*.ts"
```

### Manual API Testing

**Health Check:**
```bash
curl http://localhost:9001/health
```

**Create Order (requires auth token):**
```bash
TOKEN=$(curl -s -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"Password123!"}' \
  | jq -r '.access_token')

curl -X POST http://localhost:9001/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @order-payload.json
```

### Database Verification

```bash
# Connect to database
psql postgresql://ridendine:ridendine_dev_password@localhost:5432/ridendine_dev

# Check recent orders
SELECT order_number, status, total_cents FROM orders ORDER BY created_at DESC LIMIT 5;

# Verify state transitions
SELECT * FROM order_status_history WHERE order_id = '<uuid>' ORDER BY created_at;

# Check admin audit log
SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT 10;
```

---

## Common Troubleshooting

### Port Conflicts

```bash
# Find process on port
lsof -i :9001

# Kill process by PID
kill <PID>

# Check all RideNDine ports
lsof -i :5432 -i :6379 -i :8081 -i :9001 -i :9002 -i :9003 -i :9004
```

### Database Connection Issues

```bash
# Verify containers are running
docker-compose ps

# Restart database
npm run db:down && npm run db:up

# Check logs
docker-compose logs postgres

# Test connection
psql postgresql://ridendine:ridendine_dev_password@localhost:5432/ridendine_dev -c "\dt"
```

### Stripe Webhook Signature Failures

- Ensure `STRIPE_WEBHOOK_SECRET` matches your Stripe CLI or dashboard webhook secret
- Verify raw body parsing is enabled for `/webhooks/stripe` route (check `main.ts`)
- Test with Stripe CLI: `stripe listen --forward-to localhost:9001/webhooks/stripe`

### Build Failures

```bash
# Clean rebuild
cd services/api
rm -rf dist node_modules
npm install
npm run build

# Check TypeScript errors without building
npx tsc --noEmit
```

### Expo Mobile App Can't Connect

```bash
# Get LAN IP
hostname -I | awk '{print $1}'

# Update server URL in apps/customer-mobile/App.js to http://<LAN_IP>:8081
# Allow port through firewall
sudo ufw allow 8081

# Verify core server is reachable from device
curl http://<LAN_IP>:8081/health
```

---

## Documentation Standards

- Mark aspirational content clearly with status badges
- Update `AGENTS.md` when adding new services or changing ports
- Keep port references in sync across README, AGENTS.md, and this file
- Document all major architecture decisions in relevant numbered docs (01_-10_)
- Update progress files (e.g., `PHASE2_WEEK4_PROGRESS.md`) at completion of each week
