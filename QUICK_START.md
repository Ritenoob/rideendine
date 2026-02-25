# 🚀 RideNDine Quick Start Guide

**Last Updated:** February 9, 2026

Get the RideNDine platform running locally in 5 minutes!

---

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Git

---

## ⚡ Quick Start (Development)

### 1. Clone and Install

```bash
# Clone repository
git clone <repo-url>
cd rideendine

# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set minimum required variables:
# - DEMO_MODE=true (for development)
# - DATABASE_URL=postgresql://...
# - REDIS_URL=redis://localhost:6379
# - JWT_SECRET=your-secret
# - STRIPE_SECRET_KEY=sk_test_...
# - STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Database Setup

```bash
# Start PostgreSQL and Redis (if using Docker)
docker-compose up -d postgres redis

# Run migrations
cd services/api
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 4. Start Backend API

```bash
cd services/api
npm run start:dev

# API running at http://localhost:9001
# Swagger docs at http://localhost:9001/api/docs
```

### 5. Start Frontend Apps

**Customer Web (Public):**

```bash
cd apps/customer-web-nextjs
npm run dev
# → http://localhost:3000
```

**Chef Dashboard (Protected):**

```bash
cd apps/chef-dashboard
npm run dev
# → http://localhost:3001
```

**Admin Panel (Protected):**

```bash
cd apps/admin-web
npm run dev
# → http://localhost:3002
```

---

## 🧪 Test the System

### 1. Login with Demo Mode

With `DEMO_MODE=true`, use any credentials:

**Customer Login:**

```bash
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@test.com", "password": "any"}'
```

**Chef Login:**

```bash
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "chef@test.com", "password": "any"}'
```

**Admin Login:**

```bash
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "any"}'
```

### 2. Test Stripe Checkout

```bash
# Get auth token first
TOKEN="<your-access-token>"

# Create checkout session
curl -X POST http://localhost:9001/payments/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {
        "menuItemId": "item-1",
        "name": "Deluxe Pasta",
        "quantity": 1,
        "price": 1500
      }
    ],
    "chefId": "chef-123",
    "deliveryAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }'

# Response includes sessionUrl - redirect customer there
```

### 3. Test Public Order Tracking

```bash
# No authentication required
curl http://localhost:9001/orders/<orderId>/tracking

# Returns redacted tracking data:
# - status, etaMinutes, driverStatus
# - pickupLabel: "Local chef kitchen"
# - NO chef address, NO driver location
```

---

## 🔑 Key URLs

### API Endpoints

- **Health Check:** http://localhost:9001/health
- **Swagger Docs:** http://localhost:9001/api/docs
- **Auth Login:** http://localhost:9001/auth/login
- **Create Checkout:** http://localhost:9001/payments/create-checkout-session
- **Order Tracking:** http://localhost:9001/orders/:id/tracking
- **Cooco Webhook:** http://localhost:9001/integrations/cooco/orders
- **Integration Logs:** http://localhost:9001/integrations/events (admin)

### Frontend Apps

- **Customer Web:** http://localhost:3000
  - Landing: `/`
  - Browse: `/customer`
  - Chefs: `/chefs`
  - Checkout: `/checkout`
  - Tracking: `/order/:orderId`
- **Chef Dashboard:** http://localhost:3001
  - Login: `/login`
  - Dashboard: `/dashboard`
  - Orders: `/orders`
  - Menu: `/menu`
- **Admin Panel:** http://localhost:3002
  - Login: `/login`
  - Dashboard: `/dashboard`
  - Live Map: `/dashboard/live-map`
  - Integrations: `/dashboard/integrations`

---

## 🛠️ Development Tools

### Stripe Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local API
stripe listen --forward-to localhost:9001/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

### Database Tools

```bash
# Connect to database
psql $DATABASE_URL

# Run specific migration
npm run db:migrate:up 011_stripe_checkout_session

# Rollback migration
npm run db:migrate:down
```

### API Testing

**VS Code REST Client** - Create `test.http`:

```http
### Login
POST http://localhost:9001/auth/login
Content-Type: application/json

{
  "email": "chef@test.com",
  "password": "any"
}

### Get Session
GET http://localhost:9001/auth/session
Authorization: Bearer {{accessToken}}
```

---

## 🐛 Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials in .env
DATABASE_URL=postgresql://ridendine:password@localhost:5432/ridendine_dev
```

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Verify Redis URL in .env
REDIS_URL=redis://localhost:6379
```

### API Won't Start

```bash
# Check for port conflicts
lsof -i :9001

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend Build Errors

```bash
# Clear Next.js cache
rm -rf apps/customer-web-nextjs/.next
rm -rf apps/chef-dashboard/.next
rm -rf apps/admin-web/.next

# Reinstall dependencies
npm run install:all
```

### Stripe Webhook Errors

```bash
# Verify webhook secret matches Stripe CLI output
STRIPE_WEBHOOK_SECRET=whsec_...

# Check webhook signature in logs
# If signature invalid, restart Stripe CLI
```

### Authentication Not Working

```bash
# If DEMO_MODE=true, any credentials work
# If DEMO_MODE=false, need real user accounts

# Check JWT secrets are set
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=different-secret-key
```

---

## 📚 Documentation

- **Complete Overview:** `COMPLETE_RESTRUCTURING_SUMMARY.md`
- **Stripe Guide:** `STRIPE_CHECKOUT_IMPLEMENTATION.md`
- **Frontend Routes:** `NEXTJS_RESTRUCTURE_COMPLETE.md`
- **App Guide:** `NEXTJS_APPS_README.md`

---

## 🚢 Production Deployment

### Before Deploying

1. **Environment Variables:**

   ```bash
   DEMO_MODE=false  # CRITICAL!
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_...  # Use live keys
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   DATABASE_SSL=true
   ```

2. **Database:**

   ```bash
   # Run all migrations
   npm run db:migrate

   # Verify tables created
   psql $DATABASE_URL -c "\dt"
   ```

3. **Stripe:**

   ```bash
   # Register webhook URL in Stripe Dashboard
   # Format: https://api.yourdomain.com/webhooks/stripe
   # Events: checkout.session.completed
   ```

4. **Build Apps:**

   ```bash
   # Customer web
   cd apps/customer-web-nextjs && npm run build

   # Chef dashboard
   cd apps/chef-dashboard && npm run build

   # Admin panel
   cd apps/admin-web && npm run build
   ```

### Deployment Checklist

- [ ] All environment variables set (DEMO_MODE=false!)
- [ ] Database migrations run
- [ ] Stripe webhook URL registered
- [ ] Frontend apps built successfully
- [ ] SSL certificates configured
- [ ] CORS origins whitelisted
- [ ] Rate limits configured
- [ ] Error tracking enabled (Sentry, etc.)
- [ ] Monitoring setup (Datadog, etc.)
- [ ] Backups configured

---

## 📞 Quick Reference

### Common Commands

```bash
# Start everything (development)
npm run dev:all

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build:all

# Database migrations
npm run db:migrate
npm run db:rollback
npm run db:seed
```

### Environment Variables

**Minimum Required:**

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`

**For Production:**

- `DEMO_MODE=false`
- `NODE_ENV=production`
- `STRIPE_WEBHOOK_SECRET`
- `COOCO_WEBHOOK_SECRET`
- `MEALBRIDGE_API_KEY`

---

## ✅ System Status Checks

**All Services Running?**

```bash
# Backend API
curl http://localhost:9001/health

# Customer web
curl http://localhost:3000

# Chef dashboard
curl http://localhost:3001

# Admin panel
curl http://localhost:3002
```

**Database Connected?**

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

**Redis Connected?**

```bash
redis-cli ping
```

**Stripe Configured?**

```bash
# Should return Stripe account details
curl https://api.stripe.com/v1/account \
  -u $STRIPE_SECRET_KEY:
```

---

**Happy Coding! 🎉**

For detailed documentation, see:

- `COMPLETE_RESTRUCTURING_SUMMARY.md` - Full implementation details
- `STRIPE_CHECKOUT_IMPLEMENTATION.md` - Payment flow guide
- `NEXTJS_APPS_README.md` - Frontend development guide
