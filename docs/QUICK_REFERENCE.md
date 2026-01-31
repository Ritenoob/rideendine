# Quick Reference Guide

Fast reference for the most common operations, API endpoints, errors, and commands.

**Last Updated:** 2026-01-31
**Status:** Production Ready

---

## Quick Links

- **API Documentation:** http://localhost:9001/api/docs (Swagger UI)
- **OpenAPI Spec:** [openapi.yaml](../openapi.yaml)
- **Full API Guide:** [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Common API Endpoints

### Authentication

```bash
# Register
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+15555551234",
  "role": "customer"
}

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Refresh Token
POST /auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Chefs

```bash
# Search nearby chefs
GET /chefs/search?lat=30.2672&lng=-97.7431&radius=10

# Get chef profile
GET /chefs/{id}

# Get chef menus
GET /chefs/{id}/menus

# Get menu details
GET /chefs/{chefId}/menus/{menuId}
```

### Orders

```bash
# Create order
POST /orders
{
  "chefId": "chef-uuid",
  "deliveryAddress": "123 Main St",
  "deliveryLatitude": 30.2850,
  "deliveryLongitude": -97.7500,
  "items": [
    { "menuItemId": "item-uuid", "quantity": 2 }
  ]
}

# Get order details
GET /orders/{id}

# Track order (public, no auth required)
GET /orders/{id}/tracking

# List orders (with filters)
GET /orders?status=preparing&page=1&limit=10
```

### Drivers

```bash
# Update GPS location
POST /drivers/location
{
  "latitude": 30.2750,
  "longitude": -97.7450
}

# Toggle availability
PATCH /drivers/availability
{
  "isAvailable": true
}

# Get driver stats
GET /drivers/stats
```

---

## HTTP Status Codes

| Code    | Meaning               | Common Causes                              |
| ------- | --------------------- | ------------------------------------------ |
| **200** | OK                    | Request succeeded                          |
| **201** | Created               | Resource created successfully              |
| **400** | Bad Request           | Validation failed, missing required fields |
| **401** | Unauthorized          | Missing or invalid access token            |
| **403** | Forbidden             | Insufficient permissions                   |
| **404** | Not Found             | Resource does not exist                    |
| **409** | Conflict              | Email already exists, unique constraint    |
| **422** | Unprocessable Entity  | Business logic validation failed           |
| **429** | Too Many Requests     | Rate limit exceeded                        |
| **500** | Internal Server Error | Server error (contact support)             |
| **503** | Service Unavailable   | Service temporarily down                   |

---

## Common Error Messages

### Validation Errors (400)

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than 8 characters"],
  "error": "Bad Request"
}
```

**Fix:** Check request body matches required format

### Authentication Errors (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Fix:** Add `Authorization: Bearer <token>` header

### Token Expired (401)

```json
{
  "statusCode": 401,
  "message": "Token expired",
  "error": "Unauthorized"
}
```

**Fix:** Use refresh token to get new access token

### Rate Limit (429)

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too Many Requests"
}
```

**Fix:** Wait and retry. Check `X-RateLimit-Reset` header

---

## Useful Commands

### Docker & Docker Compose

```bash
# Start all services
npm run docker:up
# or
docker-compose up -d

# Stop all services
npm run docker:down
# or
docker-compose down

# View logs
docker-compose logs -f api

# Restart service
docker-compose restart api

# Check status
docker-compose ps

# View resource usage
docker stats
```

### Database

```bash
# Start database
npm run db:up

# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Full reset (WARNING: deletes all data)
npm run db:reset

# Connect to database
docker-compose exec postgres psql -U ridendine -d ridendine

# Database UI (Adminer)
open http://localhost:8080
```

### Kubernetes

```bash
# Get all pods
kubectl get pods -n ridendine

# View logs
kubectl logs -f deployment/api -n ridendine

# Restart deployment
kubectl rollout restart deployment/api -n ridendine

# Scale deployment
kubectl scale deployment/api --replicas=5 -n ridendine

# Check pod resources
kubectl top pods -n ridendine

# Describe pod (for troubleshooting)
kubectl describe pod <pod-name> -n ridendine
```

### Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run smoke tests
npm run test:smoke -- --url=http://localhost:9001

# Run specific test file
npm run test -- src/auth/auth.service.spec.ts
```

### Git

```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit with proper message
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push -u origin feature/my-feature

# Sync with main
git checkout main
git pull
git checkout feature/my-feature
git merge main
```

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://ridendine:password@localhost:5432/ridendine

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=15m
REFRESH_TOKEN_SECRET=your-refresh-secret-here
REFRESH_TOKEN_EXPIRATION=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# API
API_PORT=9001
NODE_ENV=development
```

### Optional Variables

```bash
# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyxxxxx

# Mapbox
MAPBOX_TOKEN=pk.eyxxxxx

# Logging
LOG_LEVEL=debug  # debug, info, warn, error
```

---

## Rate Limits

| Endpoint Pattern       | Limit        | Window     |
| ---------------------- | ------------ | ---------- |
| Global (all endpoints) | 100 requests | 15 minutes |
| POST /auth/login       | 5 requests   | 1 minute   |
| POST /auth/register    | 3 requests   | 1 hour     |
| POST /drivers/location | 120 requests | 1 minute   |

**Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706698800
```

---

## Quick Troubleshooting

### API Not Starting

```bash
# Check logs
docker-compose logs api

# Common issues:
# 1. Database not ready
docker-compose ps postgres
docker-compose restart api

# 2. Port in use
lsof -i :9001
kill $(lsof -t -i :9001)

# 3. Environment variables missing
docker-compose exec api env | grep DATABASE
```

### Database Connection Failed

```bash
# Check database is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres pg_isready -U ridendine

# Restart database
docker-compose restart postgres

# Reset database
npm run db:reset
```

### 401 Unauthorized

```bash
# Generate new token
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Use token in request
curl -H "Authorization: Bearer <token>" \
  http://localhost:9001/users/me
```

### Slow Performance

```bash
# Check container resources
docker stats

# Check database queries
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT query, calls, mean_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Restart to clear memory
docker-compose restart api

# Scale up
docker-compose up -d --scale api=3
```

---

## Ports Reference

| Port | Service              | URL                   |
| ---- | -------------------- | --------------------- |
| 8081 | Core demo server     | http://localhost:8081 |
| 9001 | API service (NestJS) | http://localhost:9001 |
| 9002 | Dispatch service     | http://localhost:9002 |
| 9003 | Routing service      | http://localhost:9003 |
| 9004 | Realtime gateway     | http://localhost:9004 |
| 8010 | Customer web         | http://localhost:8010 |
| 5432 | PostgreSQL           | localhost:5432        |
| 6379 | Redis                | localhost:6379        |
| 8080 | Adminer (DB UI)      | http://localhost:8080 |

---

## Health Check Endpoints

```bash
# API Health
curl http://localhost:9001/health
# {"status":"ok","timestamp":"2026-01-31T..."}

# Database Health
curl http://localhost:9001/health/db

# Redis Health
curl http://localhost:9001/health/redis

# Detailed Health
curl http://localhost:9001/health/readiness
```

---

## cURL Examples

### Register User

```bash
curl -X POST http://localhost:9001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+15555551234",
    "role": "customer"
  }'
```

### Login

```bash
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Get User Profile (Authenticated)

```bash
TOKEN="your-access-token-here"

curl -X GET http://localhost:9001/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Search Chefs

```bash
curl -X GET "http://localhost:9001/chefs/search?lat=30.2672&lng=-97.7431&radius=10"
```

### Create Order

```bash
curl -X POST http://localhost:9001/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chefId": "chef-uuid",
    "deliveryAddress": "123 Main St, Austin, TX",
    "deliveryLatitude": 30.2850,
    "deliveryLongitude": -97.7500,
    "items": [
      { "menuItemId": "item-uuid", "quantity": 2 }
    ]
  }'
```

---

## Order Status Flow

```
pending
  ↓
payment_confirmed
  ↓
accepted (chef accepts)
  ↓
preparing (chef cooking)
  ↓
ready_for_pickup
  ↓
assigned_to_driver
  ↓
picked_up (driver picks up)
  ↓
in_transit
  ↓
delivered

(or cancelled/refunded at any point)
```

---

## Database Quick Queries

```sql
-- User count
SELECT COUNT(*) FROM users;

-- Orders by status
SELECT status, COUNT(*) FROM orders GROUP BY status;

-- Recent orders
SELECT order_number, status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Database size
SELECT pg_size_pretty(pg_database_size('ridendine'));

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## WebSocket Events

```javascript
// Connect
const socket = io('http://localhost:9001', {
  auth: { token: 'your-access-token' },
});

// Join order room
socket.emit('join_order', { orderId: 'order-uuid' });

// Listen for order updates
socket.on('order:status_changed', (order) => {
  console.log('Order status:', order.status);
});

// Listen for driver location
socket.on('driver:location_updated', (location) => {
  console.log('Driver at:', location.latitude, location.longitude);
});

// Listen for notifications
socket.on('notification:new', (notification) => {
  console.log('Notification:', notification.message);
});
```

---

## Emergency Contacts

| Role             | Contact                | Phone       |
| ---------------- | ---------------------- | ----------- |
| On-Call Engineer | ops@ridendine.com      | +1-555-0001 |
| CTO              | john@ridendine.com     | +1-555-0100 |
| Security Lead    | security@ridendine.com | +1-555-0102 |
| DBA              | dba@ridendine.com      | +1-555-0103 |

**Slack Channels:**

- #ridendine-incidents - Active incidents
- #ridendine-ops - Operations
- #ridendine-engineering - Engineering

---

## Useful Links

### Documentation

- [Architecture](./ARCHITECTURE.md)
- [Database Schema](./DATABASE.md)
- [API Integration Guide](./API_INTEGRATION_GUIDE.md)
- [User Journeys](./USER_JOURNEYS.md)
- [Glossary](./GLOSSARY.md)

### Operational

- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Service Restart Runbook](./RUNBOOK_SERVICE_RESTART.md)
- [Database Recovery](./RUNBOOK_DATABASE_RECOVERY.md)
- [Performance Degradation](./RUNBOOK_PERFORMANCE_DEGRADATION.md)
- [Scaling](./RUNBOOK_SCALING.md)
- [Emergency Procedures](./RUNBOOK_EMERGENCY_PROCEDURES.md)

### Development

- [Development Setup](../DEVELOPMENT.md)
- [Quickstart Guide](../QUICKSTART.md)
- [Test Guide](../TEST_GUIDE.md)
- [Claude Instructions](../CLAUDE.md)

---

**Last Updated:** 2026-01-31
**Maintained By:** Engineering Team
