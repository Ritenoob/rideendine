# RideNDine Development Guide

Complete guide for setting up and developing the RideNDine platform locally.

**Last Updated:** 2026-01-31
**Target Audience:** New developers joining the project

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Running Services](#running-services)
5. [Frontend Applications](#frontend-applications)
6. [Database Management](#database-management)
7. [Testing](#testing)
8. [Development Workflow](#development-workflow)
9. [Troubleshooting](#troubleshooting)
10. [Common Tasks](#common-tasks)

---

## Prerequisites

### Required Software

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Redis** 7.x or higher ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

### Recommended Software

- **Docker** & **Docker Compose** (for easier database setup)
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript
  - PostgreSQL
- **Postman** or **Insomnia** (for API testing)
- **TablePlus** or **pgAdmin** (database GUI)

### Accounts Required

- **Stripe** account ([Sign up](https://dashboard.stripe.com/register))
- **Mapbox** account (for geocoding, optional)
- **Google Maps** account (for geocoding, optional)

### System Requirements

- **OS:** macOS, Linux, or Windows (WSL2 recommended)
- **RAM:** 8GB minimum, 16GB recommended
- **Disk:** 5GB free space

---

## Quick Start

**Get up and running in 5 minutes:**

```bash
# 1. Clone repository
git clone https://github.com/ridendine/ridendine.git
cd ridendine

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 5. Run database migrations
npm run db:migrate

# 6. Seed test data (optional)
npm run db:seed

# 7. Start API server
npm run dev:api

# 8. Test API
curl http://localhost:9001/health
# Should return: {"status":"ok"}
```

The API is now running at `http://localhost:9001`.

**Next steps:**

- Access API docs: `http://localhost:9001/api/docs` (Swagger UI)
- Start mobile app: `cd apps/customer-mobile && npx expo start`
- View database: Adminer at `http://localhost:8080`

---

## Detailed Setup

### 1. Clone Repository

```bash
git clone https://github.com/ridendine/ridendine.git
cd ridendine
```

### 2. Install Dependencies

This is an npm workspaces monorepo. Install all dependencies at once:

```bash
npm install
```

This installs dependencies for:

- Root workspace
- `services/api` (NestJS API)
- `services/dispatch` (Dispatch service)
- `services/routing` (Routing service)
- `services/realtime` (WebSocket gateway)
- `apps/customer-mobile` (React Native app)
- `apps/customer-web-react` (React web app)
- `apps/chef-dashboard` (Chef dashboard)
- `apps/driver-mobile` (Driver mobile app)
- `apps/admin-web` (Admin dashboard)

### 3. Environment Configuration

Create environment file from template:

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```bash
# Database
DATABASE_URL=postgresql://ridendine:ridendine@localhost:5432/ridendine

# Redis
REDIS_URL=redis://localhost:6379

# API Server
API_PORT=9001
NODE_ENV=development

# JWT Secrets (generate secure random strings in production)
JWT_SECRET=dev-jwt-secret-change-in-production
REFRESH_TOKEN_SECRET=dev-refresh-secret-change-in-production

# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Geocoding (optional, pick one)
GOOGLE_MAPS_API_KEY=AIza...
MAPBOX_TOKEN=pk.ey...

# Email (optional, for notifications)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-username
SMTP_PASS=your-password

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:3000
CUSTOMER_WEB_URL=http://localhost:8010
```

**Important:** Never commit `.env` to version control. It's already in `.gitignore`.

### 4. Database Setup

#### Option A: Using Docker (Recommended)

Start PostgreSQL + Redis + Adminer:

```bash
docker compose up -d
```

This starts:

- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Adminer** (DB GUI) on port 8080

Verify containers are running:

```bash
docker compose ps
```

#### Option B: Manual Installation

**PostgreSQL:**

```bash
# macOS (Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt install postgresql-14
sudo systemctl start postgresql

# Create database
createdb ridendine
```

**Redis:**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
```

### 5. Run Migrations

Apply database schema:

```bash
npm run db:migrate
```

This runs all SQL files in `database/migrations/`:

- `001_initial_schema.sql` - Core tables
- `002_chef_enhancements.sql` - Chef features
- `003_admin_actions.sql` - Admin audit log
- `004_orders_enhancements.sql` - Order improvements
- `005_drivers.sql` - Driver management
- `006_phase4_admin_reviews.sql` - Reviews system
- `006_platform_settings.sql` - Platform config
- `008_add_spatial_indexes.sql` - Location indexes
- `009_add_composite_indexes.sql` - Performance indexes
- `010_mobile_app_tables.sql` - Mobile app tables

### 6. Seed Test Data (Optional)

Populate database with test users, chefs, and menu items:

```bash
npm run db:seed
```

This creates:

- 3 test customers
- 5 test chefs with menus
- 2 test drivers
- 1 admin user
- Sample menu items

**Test accounts created:**

- Customer: `customer@test.com` / `password123`
- Chef: `chef@test.com` / `password123`
- Driver: `driver@test.com` / `password123`
- Admin: `admin@test.com` / `password123`

---

## Docker-Based Development (Recommended)

### Full Stack with Docker Compose

The recommended way to run RideNDine is using Docker Compose, which handles all services, databases, and networking:

```bash
# Build all Docker images
npm run docker:build

# Start all services (API, Dispatch, Routing, Realtime, PostgreSQL, Redis, Adminer)
npm run docker:up

# Start in background (detached mode)
npm run docker:up:detached

# View logs from all services
npm run docker:logs

# View logs from specific service
docker-compose logs -f api

# Check service health status
npm run docker:ps

# Stop all services
npm run docker:down

# Restart specific service
docker-compose restart api

# Clean up (remove volumes and images)
npm run docker:clean
```

**What gets started:**

| Service    | Port | Container Name     | Description              |
| ---------- | ---- | ------------------ | ------------------------ |
| API        | 9001 | ridendine_api      | Main NestJS API          |
| Dispatch   | 9002 | ridendine_dispatch | Order assignment service |
| Routing    | 9003 | ridendine_routing  | Route calculation        |
| Realtime   | 9004 | ridendine_realtime | WebSocket gateway        |
| PostgreSQL | 5432 | ridendine_postgres | Database                 |
| Redis      | 6379 | ridendine_redis    | Cache & pub/sub          |
| Adminer    | 8080 | ridendine_adminer  | Database UI              |

**Health Checks:**

All services include health checks. Verify they're healthy:

```bash
# Check all containers
docker-compose ps

# Test API health endpoint
curl http://localhost:9001/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "2026-01-31T...",
#   "database": "connected",
#   "redis": "connected"
# }
```

**Database Migrations:**

Migrations run automatically when PostgreSQL container starts. To manually run migrations:

```bash
# Run migrations in Docker
npm run db:migrate:docker

# Or run migration script locally
npm run db:migrate
```

**Rebuild After Code Changes:**

When you modify service code:

```bash
# Stop services
npm run docker:down

# Rebuild images (with changes)
npm run docker:build

# Start fresh
npm run docker:up
```

For faster iteration during development, see "Hybrid Development" below.

### Docker Image Build Details

Each service uses optimized multi-stage Dockerfiles:

- **API Service**: Multi-stage build (builder + runtime)
  - Build stage: Compiles TypeScript, installs dependencies
  - Runtime stage: Minimal Alpine image with only production deps
  - Non-root user for security
  - Health check included

- **Other Services**: Lightweight Node.js Alpine images
  - Minimal dependencies
  - Health checks for monitoring
  - Non-root execution

**Image sizes:**

```bash
# Check image sizes
docker images | grep ridendine

# Expected sizes:
# ridendine-api:latest        ~300MB
# ridendine-dispatch:latest   ~150MB
# ridendine-routing:latest    ~150MB
# ridendine-realtime:latest   ~150MB
```

**Building without cache (clean build):**

```bash
npm run docker:build:nocache
```

### Hybrid Development (Faster Iteration)

For active development, run databases in Docker but services locally for hot-reload:

```bash
# Terminal 1: Start only databases
npm run db:up

# Terminal 2: Run API with hot reload
npm run dev:api

# Terminal 3: Run Dispatch service
npm run dev:dispatch

# Terminal 4: Run Routing service
npm run dev:routing

# Terminal 5: Run Realtime gateway
npm run dev:realtime
```

This gives you instant code reload without rebuilding Docker images.

**Stop databases when done:**

```bash
npm run db:down
```

## Running Services

### API Service (NestJS)

The main API service runs on port **9001**:

```bash
# Development mode (watch)
npm run dev:api

# Alternative: from service directory
cd services/api
npm run start:dev

# Debug mode
npm run start:debug

# Production mode
npm run build
npm run start:prod
```

**Endpoints:**

- API: `http://localhost:9001`
- Health check: `http://localhost:9001/health`
- Swagger docs: `http://localhost:9001/api/docs`
- WebSocket: `ws://localhost:9001/realtime`

### Other Services (Scaffolded)

These services are scaffolded but not yet integrated:

```bash
# Dispatch service (port 9002)
npm run dev:dispatch

# Routing service (port 9003)
npm run dev:routing

# Realtime gateway (port 9004)
npm run dev:realtime
```

### Run All Services Concurrently

```bash
npm run dev
```

This uses `concurrently` to run all services in parallel.

---

## Frontend Applications

### Customer Mobile App (React Native + Expo)

```bash
cd apps/customer-mobile

# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on iOS simulator (macOS only)
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on physical device
# Scan QR code with Expo Go app
```

**Environment variables:**

Create `apps/customer-mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:8081
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:8081
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Note:** Replace `192.168.1.100` with your LAN IP:

```bash
# macOS/Linux
hostname -I | awk '{print $1}'

# Windows (WSL2)
ip addr show eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1
```

### Customer Web App (React)

```bash
cd apps/customer-web-react
npm install
npm start

# Opens at http://localhost:8010
```

### Chef Dashboard (Next.js)

```bash
cd apps/chef-dashboard
npm install
npm run dev

# Opens at http://localhost:3001
```

### Driver Mobile App (React Native + Expo)

```bash
cd apps/driver-mobile
npm install
npx expo start
```

### Admin Dashboard (Next.js)

```bash
cd apps/admin-web
npm install
npm run dev

# Opens at http://localhost:3002
```

---

## Database Management

### Adminer (Web UI)

If using Docker, access Adminer at `http://localhost:8080`:

- **System:** PostgreSQL
- **Server:** postgres
- **Username:** ridendine
- **Password:** ridendine
- **Database:** ridendine

### Command Line

```bash
# Connect to PostgreSQL
psql postgresql://ridendine:ridendine@localhost:5432/ridendine

# Common commands
\dt              # List tables
\d users         # Describe users table
SELECT * FROM users LIMIT 5;

# Reset database
npm run db:reset  # Drops, recreates, migrates, seeds
```

### Migrations

```bash
# Run migrations
npm run db:migrate

# Create new migration
# Create file: database/migrations/011_your_migration.sql
# Then run: npm run db:migrate
```

### Backup & Restore

```bash
# Backup
pg_dump -U ridendine ridendine > backup.sql

# Restore
psql -U ridendine ridendine < backup.sql
```

---

## Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Test specific service
cd services/api
npm run test

# Test specific file
npm run test -- users.service.spec.ts
```

### E2E Tests

```bash
# Run end-to-end tests
cd services/api
npm run test:e2e
```

### API Testing

#### Using cURL

```bash
# Register user
curl -X POST http://localhost:9001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+15555551234",
    "role": "customer"
  }'

# Login
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Use token for authenticated requests
TOKEN="your-access-token"
curl http://localhost:9001/users/me \
  -H "Authorization: Bearer $TOKEN"
```

#### Using Swagger UI

1. Open `http://localhost:9001/api/docs`
2. Click "Authorize" button
3. Enter access token from login response
4. Test endpoints interactively

---

## Development Workflow

### Code Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Lint TypeScript
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Pre-commit Hooks

Husky runs pre-commit hooks automatically:

- ESLint
- Prettier
- TypeScript compilation check

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature

# Create pull request on GitHub
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 9001
lsof -i :9001

# Kill process
kill $(lsof -t -i :9001)

# Or use different port
API_PORT=9002 npm run dev:api

# Kill all RideNDine services
lsof -i :9001 -i :9002 -i :9003 -i :9004 | awk 'NR>1 {print $2}' | xargs kill
```

### Docker Container Not Starting

```bash
# View container logs
docker-compose logs api

# Check health status
docker inspect ridendine_api | grep -A 10 Health

# Rebuild specific service
docker-compose build api
docker-compose up api

# Complete rebuild
npm run docker:down
npm run docker:build:nocache
npm run docker:up
```

### Container Shows "Unhealthy" Status

```bash
# Check health check details
docker inspect ridendine_api

# View recent logs
docker-compose logs --tail=100 api

# Test health endpoint manually
curl http://localhost:9001/health

# Common causes:
# - Database not ready yet (wait 30s for health checks)
# - Missing environment variables
# - Port conflict
```

### Docker Out of Memory

```bash
# Check Docker resource usage
docker stats

# Increase Docker memory (Docker Desktop → Preferences → Resources)
# Recommended: 4GB minimum, 8GB for full stack

# Clean up unused resources
docker system prune -a --volumes
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker compose ps
# or
brew services list

# Check connection string in .env
DATABASE_URL=postgresql://ridendine:ridendine@localhost:5432/ridendine

# Test connection
psql postgresql://ridendine:ridendine@localhost:5432/ridendine
```

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Restart Redis
docker compose restart redis
# or
brew services restart redis
```

### Migration Errors

```bash
# Check migration status
psql -U ridendine -d ridendine -c "\dt"

# Drop all tables and re-run
npm run db:reset
```

### Expo / React Native Issues

```bash
# Clear cache
npx expo start --clear

# Reset Metro bundler
npx expo start -c

# Delete and reinstall
rm -rf node_modules
npm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build

# Check types
npx tsc --noEmit

# Restart TS server (VS Code)
# CMD+Shift+P > TypeScript: Restart TS Server
```

### Module Not Found

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify workspace links
npm run postinstall
```

---

## Common Tasks

### Create New User Account

```bash
# Using seed script
npm run db:seed

# Or via API
curl -X POST http://localhost:9001/auth/register \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Reset Admin Password

```bash
psql postgresql://ridendine:ridendine@localhost:5432/ridendine

UPDATE users
SET password_hash = '$2b$10$YourHashHere'
WHERE email = 'admin@ridendine.com';
```

### Test Stripe Webhooks

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:9001/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

### Monitor Logs

```bash
# API logs (in watch mode)
npm run dev:api

# Database logs (Docker)
docker compose logs -f postgres

# Redis logs (Docker)
docker compose logs -f redis

# All logs
docker compose logs -f
```

### Generate API Documentation

```bash
# Swagger is auto-generated from decorators
# Access at: http://localhost:9001/api/docs

# Export OpenAPI spec
curl http://localhost:9001/api-json > openapi.json
```

---

## Environment-Specific Setup

### macOS

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node postgresql@14 redis
brew services start postgresql@14
brew services start redis
```

### Ubuntu/Debian

```bash
# Update package list
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql-14

# Install Redis
sudo apt install redis-server
```

### Windows (WSL2)

```bash
# Install WSL2 and Ubuntu
wsl --install

# Inside WSL, follow Ubuntu instructions above

# Use Windows-based tools:
# - VS Code with Remote-WSL extension
# - Docker Desktop for Windows
```

---

## Additional Resources

### Documentation

- **API Reference:** [OpenAPI Spec](./openapi.yaml)
- **Architecture:** [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Database Schema:** [docs/DATABASE.md](./docs/DATABASE.md)
- **User Journeys:** [docs/USER_JOURNEYS.md](./docs/USER_JOURNEYS.md)

### External Docs

- **NestJS:** https://docs.nestjs.com/
- **React Native:** https://reactnative.dev/docs/getting-started
- **Expo:** https://docs.expo.dev/
- **Stripe:** https://stripe.com/docs/api
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Redis:** https://redis.io/documentation

### Support

- **GitHub Issues:** https://github.com/ridendine/ridendine/issues
- **Slack:** #ridendine-dev (internal)

---

## Next Steps

After completing this setup:

1. **Explore the API:** Use Swagger UI to test endpoints
2. **Run the mobile app:** Follow customer mobile setup
3. **Create test data:** Run seed script or create manually
4. **Read architecture docs:** Understand system design
5. **Join the team:** Ask questions in Slack

**Happy coding!** 🚀
