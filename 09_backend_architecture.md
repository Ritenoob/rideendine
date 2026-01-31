# Backend Architecture

> **Status:** ✅ IMPLEMENTED — NestJS API operational. Service split prototyped but not integrated.

**Last Updated:** 2026-01-31  
**Current Mode:** Monolithic API (NestJS)  
**Future Mode:** Microservices (planned for scale)

---

## Current Architecture (Phase 2)

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                       │
│  (Customer Mobile, Chef Dashboard, Driver Mobile, Admin)    │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTPS
                    ↓
            ┌───────────────┐
            │  Load Balancer │
            │   (Future)     │
            └───────┬────────┘
                    │
    ┌───────────────┴───────────────┐
    │                               │
    ↓                               ↓
┌─────────────────────┐   ┌─────────────────────┐
│   REST API (9001)   │   │  WebSocket (9001)  │
│   NestJS Service    │←──│  /realtime Gateway  │
└──────────┬──────────┘   └─────────────────────┘
           │
           ↓
    ┌──────────────┐
    │  PostgreSQL  │
    │   (5432)     │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │    Redis     │
    │   (6379)     │
    └──────────────┘
           │
           ↓
    ┌──────────────┐
    │Stripe Connect│
    │   External   │
    └──────────────┘
```

---

## Monolithic API Service (Current)

### Technology Stack
- **Framework:** NestJS 10
- **Language:** TypeScript 5 (strict mode)
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Real-time:** Socket.IO (WebSocket)
- **Payments:** Stripe Node SDK
- **Auth:** JWT (jsonwebtoken)

### Modules

```
services/api/src/
├── auth/           # Authentication (JWT, refresh tokens)
├── users/          # User management (CRUD)
├── chefs/          # Chef profiles, menus, Stripe Connect
├── orders/         # Order lifecycle, state machine
├── stripe/         # Stripe integration + webhooks
├── drivers/        # Driver profiles, location tracking
├── dispatch/       # Driver assignment algorithm
├── realtime/       # WebSocket gateway (Socket.IO)
├── admin/          # Admin operations, verification
├── common/         # Shared guards, decorators, filters
├── config/         # Environment configuration
└── database/       # Database connection service
```

**Total:** 42 REST endpoints + 1 WebSocket gateway

---

## Database Schema

**Migrations:** `database/migrations/` (5 migrations applied)

### Core Tables (25+)

- `users` - All users (customer/chef/driver/admin)
- `chefs` - Chef business info, Stripe accounts
- `menus`, `menu_items` - Menu management
- `orders`, `order_items` - Order tracking
- `order_status_history` - State machine audit trail
- `payments` - Stripe payment tracking
- `chef_ledger`, `driver_ledger` - Earnings tracking
- `drivers`, `driver_locations` - Driver management + GPS
- `driver_assignments` - Order-to-driver assignments
- `admin_actions` - Audit log for admin operations

---

## Authentication & Authorization

### JWT Flow

```
1. User registers/logs in
2. API returns accessToken (15min) + refreshToken (7 days)
3. Client stores tokens securely
4. Client sends: Authorization: Bearer <accessToken>
5. JwtAuthGuard validates token
6. RolesGuard checks user role
7. Request proceeds or 401/403
```

### Security Features

- ✅ bcrypt password hashing (10 rounds)
- ✅ JWT access + refresh tokens
- ✅ Rate limiting (100 req/15min per IP)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation (class-validator)

---

## Real-Time Communication

### WebSocket Gateway (Socket.IO)

**Namespace:** `/realtime`  
**Port:** Same as API (9001)

**Events:**
```typescript
// Client → Server
socket.emit('subscribe:order', { orderId });
socket.emit('driver:location', { lat, lng, orderId });

// Server → Client
socket.on('order:status_update', (data) => { ... });
socket.on('driver:location_update', (data) => { ... });
```

---

## State Machines

### Order State Machine (12 States)

```
pending → payment_confirmed → accepted → preparing → ready_for_pickup
            ↓                                            ↓
        cancelled                              assigned_to_driver
                                                        ↓
                                                   picked_up
                                                        ↓
                                                   in_transit
                                                        ↓
                                                    delivered
```

---

## External Integrations

### Stripe Connect

**Architecture:** Express Connect accounts for chefs

**Flow:**
1. Chef applies → Create Express account
2. Generate AccountLink → Chef completes onboarding
3. Webhook `account.updated` → Update verification
4. Order payment → Destination charge to chef account
5. Platform fee (15%) auto-collected

**Endpoints:**
- `POST /chefs/:id/stripe/onboard`
- `GET /chefs/:id/stripe/status`
- `POST /webhooks/stripe`

---

## Future Microservices Architecture (Phase 5-6)

```
                    API Gateway (Kong/Nginx)
                              │
        ┌──────────┬──────────┼──────────┬──────────┐
        ↓          ↓          ↓          ↓          ↓
   Auth Svc   Chefs Svc  Orders Svc  Drivers Svc  Dispatch Svc
    (9001)     (9002)      (9003)      (9004)      (9005)
        │          │          │          │          │
        └──────────┴──────────┴──────────┴──────────┘
                              │
                    Message Queue (RabbitMQ)
                              │
                    ┌─────────┴─────────┐
                    ↓                   ↓
              PostgreSQL            Redis
```

### Service Responsibilities

| Service | Port | Responsibilities |
|---------|------|------------------|
| **Auth** | 9001 | User management, JWT issuance |
| **Chefs** | 9002 | Chef profiles, menus, Stripe |
| **Orders** | 9003 | Order lifecycle, payments |
| **Drivers** | 9004 | Driver profiles, location |
| **Dispatch** | 9005 | Assignment algorithm |
| **Realtime** | 9006 | WebSocket connections |

---

## Scalability Considerations

### Current Bottlenecks

1. **Database:** Single PostgreSQL instance
   - *Solution:* Read replicas, connection pooling
   
2. **WebSocket:** Single instance limits connections
   - *Solution:* Socket.IO adapter with Redis
   
3. **Order Processing:** Sequential processing
   - *Solution:* Queue-based async processing

### Scaling Strategy

**Horizontal Scaling:**
- Deploy multiple API instances behind load balancer
- Use Redis for session sharing
- Socket.IO with Redis adapter

---

## Monitoring & Observability

### Planned Metrics

- Request latency (p50, p95, p99)
- Throughput (req/sec)
- Error rate
- Active connections
- Database query time

### Alerting

- API downtime
- High error rate (>5%)
- Slow queries (>1s)
- Payment failures

---

**Current Status:** ✅ Monolithic API operational  
**Next Phase:** Scale horizontally before splitting services  
**Decision Point:** Split when >10,000 orders/day or team >10 engineers
