# Phase 1 Setup Guide - Foundation & Auth

## What's Been Completed

### ✅ Week 1: Infrastructure & Database
- [x] Monorepo structure initialized
- [x] ESLint, Prettier, TypeScript configured
- [x] PostgreSQL schema created (comprehensive production-ready schema)
- [x] Database migrations prepared
- [x] Docker Compose configuration (PostgreSQL, Redis, Adminer)
- [x] Environment management (.env setup)

### ✅ Week 2: Core Backend API (Auth & Users)
- [x] JWT token generation/validation
- [x] Refresh token rotation with database storage
- [x] Password hashing with bcrypt (10 rounds)
- [x] Email verification flow (structure ready)
- [x] Password reset flow (structure ready)
- [x] Auth endpoints: register, login, refresh, verify-email, forgot-password, reset-password, logout
- [x] User management endpoints: GET/PATCH/DELETE /users/me
- [x] RBAC middleware (Roles guard + decorator)
- [x] Rate limiting with @nestjs/throttler
- [x] Request validation with class-validator
- [x] NestJS API service fully structured and building

---

## Database Setup

### Option 1: Use System PostgreSQL (Current State)
The system already has PostgreSQL 16 running. Set up the database:

```bash
# Create the database and user
sudo -u postgres psql << 'EOF'
CREATE USER ridendine WITH PASSWORD 'ridendine_dev_password';
CREATE DATABASE ridendine_dev OWNER ridendine;
GRANT ALL PRIVILEGES ON DATABASE ridendine_dev TO ridendine;
ALTER DATABASE ridendine_dev OWNER TO ridendine;
\c ridendine_dev
GRANT ALL ON SCHEMA public TO ridendine;
\q
EOF

# Run migrations
cd /home/nygmaee/Desktop/rideendine
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev -f database/migrations/001_initial_schema.sql

# Seed test data (optional)
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev -f database/seeds/001_test_users.sql
```

### Option 2: Use Docker Compose
```bash
# Start PostgreSQL, Redis, and Adminer in Docker
cd /home/nygmaee/Desktop/rideendine
sudo docker-compose up -d

# Wait for services to be ready
sleep 10

# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

Access Adminer (database UI) at: http://localhost:8080
- Server: postgres
- Username: ridendine
- Password: ridendine_dev_password
- Database: ridendine_dev

---

## Running the API Service

### Install Dependencies
```bash
cd /home/nygmaee/Desktop/rideendine
npm install

cd services/api
npm install
```

### Start Development Server
```bash
cd /home/nygmaee/Desktop/rideendine/services/api
npm run start:dev
```

The API will be available at: **http://localhost:9001**

---

## Testing the API

### Health Check
```bash
curl http://localhost:9001/health
```

### Register a New User
```bash
curl -X POST http://localhost:9001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "role": "customer",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890"
  }'
```

### Login
```bash
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

Response includes `accessToken` and `refreshToken`.

### Get User Profile
```bash
curl http://localhost:9001/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile
```bash
curl -X PATCH http://localhost:9001/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name",
    "phone": "+9876543210"
  }'
```

### Refresh Token
```bash
curl -X POST http://localhost:9001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/logout` - Logout (requires auth)

### Users
- `GET /users/me` - Get current user profile (requires auth)
- `PATCH /users/me` - Update current user profile (requires auth)
- `DELETE /users/me` - Delete account (requires auth)

---

## Environment Variables

Key variables in `.env`:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ridendine
DATABASE_PASSWORD=ridendine_dev_password
DATABASE_NAME=ridendine_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this
REFRESH_TOKEN_EXPIRES_IN=7d

# API
API_PORT=9001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Database Schema Highlights

### Core Tables
- **users** - Unified user table for all roles (customer, chef, driver, admin)
- **user_profiles** - Extended profile information
- **refresh_tokens** - Secure token storage with expiration
- **chefs** - Chef-specific data (business, location, Stripe)
- **customers** - Customer-specific data
- **drivers** - Driver-specific data (vehicle, location)
- **orders** - Complete order lifecycle tracking
- **payments** - Stripe payment integration
- **reviews** - Rating system
- **notifications** - In-app notifications

### Features
- UUID primary keys
- Automatic timestamp triggers
- Comprehensive indexes for performance
- RBAC support (customer/chef/driver/admin)
- Geolocation support (latitude/longitude)
- Order state machine
- Ledger tables for financial tracking

---

## Security Features

✅ **Implemented:**
- Password hashing with bcrypt (10 rounds)
- JWT access tokens (short-lived, 15min default)
- Refresh token rotation (stored in DB)
- Request validation with class-validator
- Rate limiting (100 req/15min default)
- CORS configuration
- Role-based access control

⚠️ **TODO (Production):**
- Email verification sending (SendGrid integration)
- Password reset email sending
- 2FA/MFA support
- Request logging and monitoring
- API key authentication for services
- Helmet.js for security headers

---

## Testing

### Unit Tests (TODO)
```bash
npm run test
```

### E2E Tests (TODO)
```bash
npm run test:e2e
```

### Coverage (TODO)
```bash
npm run test:cov
```

---

## Next Steps (Phase 2)

### Week 3: Home Chef Module
- Chef registration & verification endpoints
- Menu management CRUD
- Stripe Connect onboarding
- Document upload handling

### Week 4: Order Management
- Order creation & lifecycle
- Payment processing with Stripe
- Order status state machine
- Commission calculation

### Week 5: Driver & Dispatch
- Driver management
- Order assignment algorithm
- GPS tracking
- ETA calculation with Mapbox/Google Maps

### Week 6: Real-Time Features
- WebSocket service
- Live order tracking
- Push notifications
- Real-time updates

---

## Troubleshooting

### Cannot connect to database
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check credentials match `.env` file
- Verify database exists: `sudo -u postgres psql -l`

### Port 9001 already in use
- Change `API_PORT` in `.env`
- Or stop the conflicting process

### Build errors
- Delete `node_modules` and `dist`: `rm -rf node_modules dist`
- Reinstall: `npm install`
- Rebuild: `npm run build`

### Permission errors with Docker
- Use `sudo docker-compose` commands
- Or add user to docker group: `sudo usermod -aG docker $USER`

---

## Architecture Notes

This Phase 1 implementation follows the **Backend Split Agent** role from AGENTS.md:
- Clean NestJS architecture
- PostgreSQL with raw SQL (no ORM for performance)
- JWT-based authentication
- Role-based access control
- Ready for horizontal scaling

The API service is the foundation for:
- Chef dashboard (Phase 3)
- Customer mobile app (Phase 3)
- Driver mobile app (Phase 3)
- Admin panel (Phase 4)
- Dispatch service integration
- Realtime service integration

---

## Repository Structure

```
/home/nygmaee/Desktop/rideendine/
├── services/
│   └── api/              # ✅ Core API service (COMPLETE)
│       ├── src/
│       │   ├── auth/     # Authentication module
│       │   ├── users/    # User management
│       │   ├── common/   # Guards, decorators, interfaces
│       │   ├── config/   # Configuration
│       │   └── database/ # Database pool
│       └── package.json
├── database/
│   ├── migrations/       # ✅ SQL migrations
│   └── seeds/            # ✅ Test data
├── docker-compose.yml    # ✅ PostgreSQL + Redis + Adminer
├── .env                  # ✅ Environment variables
├── package.json          # ✅ Root monorepo config
├── tsconfig.json         # ✅ TypeScript config
├── .eslintrc.js          # ✅ ESLint config
└── .prettierrc           # ✅ Prettier config
```

---

**Status: Phase 1 Foundation Complete ✅**
**Next: Begin Phase 2 - Core Features (Chef Module, Orders, Dispatch)**
