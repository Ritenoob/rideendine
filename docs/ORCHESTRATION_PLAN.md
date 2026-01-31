# RideNDine Orchestration Plan

**Document Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-01-30  
**Purpose:** Master coordination plan for multi-agent system development

---

## Executive Summary

This orchestration plan provides a structured approach to building the remaining RideNDine delivery platform components. The plan breaks down the system into 6 phases, each with clear deliverables, dependencies, and success criteria. It specifies which AI mode should handle each task, identifies open-source tool integration points, and defines the automation pipelines needed for continuous delivery.

### Current System State

| Component | Status | Lines of Code | Integration Status |
|-----------|--------|---------------|-------------------|
| Core Demo Server | Working | ~1,050 | N/A (monolith) |
| Demo UI | Working | ~1,062 | N/A (monolith) |
| Customer Web (React) | Prototype | 131 | Partial API |
| Customer Mobile (Expo) | Prototype | 264 | Partial API |
| Dispatch Service | Prototype | 113 | Not integrated |
| Routing Service | Prototype | 223 | Not integrated |
| Realtime Service | Prototype | 84 | Not integrated |
| API Service | WIP NestJS | ~500+ | Partial auth |
| Database Schema | Defined | N/A | Not applied |
| API Client SDK | Docs only | N/A | Not implemented |

### Target System State

After completing all 6 phases, the system will consist of:
- **5 client applications** (Customer Web, Customer Mobile, Driver App, Chef Dashboard, Admin Panel)
- **6 backend services** (API Gateway, Auth, Orders, Dispatch, Routing, Realtime)
- **2 data stores** (PostgreSQL, Redis)
- **Full CI/CD pipeline** with automated testing and deployment
- **AI-powered features** (predictive ETAs, demand forecasting, smart dispatch)

### Estimated Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | 2 weeks | Foundation & Database |
| Phase 2 | 3 weeks | Backend Services Integration |
| Phase 3 | 3 weeks | Driver App & GPS |
| Phase 4 | 3 weeks | Chef Dashboard & Menu |
| Phase 5 | 2 weeks | Native Apps (iOS/Android) |
| Phase 6 | 3 weeks | AI Features & Polish |
| **Total** | **16 weeks** | |

---

## Phase Structure

### Phase 1: Foundation & Database

**Duration:** 2 weeks  
**Primary Mode:** `architect` + `code`  
**Objective:** Establish the production database, apply migrations, and set up the infrastructure backbone.

#### Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| Database Schema Applied | Run all migrations against PostgreSQL | All 4 migration files executed successfully |
| Redis Instance | Cache and pub/sub layer | `redis-cli ping` returns PONG |
| Environment Configuration | `.env.production` template | All required vars documented |
| Database Seeding | Test data for all user types | 10+ chefs, 20+ drivers, 50+ customers |
| Backup Strategy | Automated daily backups | Cron job configured, test restore works |

#### Task Breakdown

| Task | AI Mode | Hours | Dependencies |
|------|---------|-------|--------------|
| Apply migrations | `code` | 4 | None |
| Create seed data | `code` | 8 | Schema applied |
| Configure Redis | `code` | 2 | Docker running |
| Document env vars | `docs` | 2 | All services reviewed |
| Test backup/restore | `code` | 4 | Backup cron active |

#### OSS Tool Integration

| Tool | Purpose | Integration Point |
|------|---------|-------------------|
| PostgreSQL 15 | Primary database | `docker-compose up -d postgres` |
| Redis 7 | Cache + pub/sub | `docker-compose up -d redis` |
| pgAdmin (optional) | Database GUI | `http://localhost:5050` |
| Redis Commander | Redis GUI | `http://localhost:8081` |

#### Success Criteria

- [ ] `docker-compose up` starts all services without errors
- [ ] `npm run db:migrate` executes without failures
- [ ] `npm run db:seed` populates test data
- [ ] `npm run db:backup` creates a valid backup
- [ ] All environment variables documented in `.env.example`

---

### Phase 2: Backend Services Integration

**Duration:** 3 weeks  
**Primary Mode:** `code` + `architect`  
**Objective:** Wire together the service prototypes into a cohesive backend architecture.

#### Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| API Gateway | Nginx or Traefik reverse proxy | All service ports accessible via 80/443 |
| Auth Service | JWT-based authentication | Login, register, refresh, logout work |
| Orders Service | CRUD + lifecycle management | Full order flow functional |
| Service Communication | Redis pub/sub between services | Events propagate correctly |
| Health Endpoints | `/health` on all services | All return 200 OK |

#### Task Breakdown

| Task | AI Mode | Hours | Dependencies |
|------|---------|-------|--------------|
| Design service contracts | `architect` | 16 | Phase 1 complete |
| Implement Auth Service | `code` | 40 | Contracts defined |
| Implement Orders Service | `code` | 60 | Auth Service |
| Wire services via Redis | `code` | 24 | All services running |
| Create API Gateway config | `code` | 16 | Services ready |
| Health check system | `code` | 8 | All services |

#### Service Architecture

```
                    ┌─────────────────────────────────┐
                    │         API Gateway             │
                    │      (nginx / Traefik)          │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   Auth Svc    │         │  Orders Svc   │         │  Realtime Svc │
│   (NestJS)    │         │   (NestJS)    │         │  (Node.js)    │
│   Port 9001   │         │   Port 9005   │         │   Port 9004   │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                           │
        └─────────────────────────┼───────────────────────────┘
                                  │
                                  ▼
                        ┌───────────────┐
                        │  Redis Pub/Sub │
                        │   (Channels)   │
                        └───────┬───────┘
                                  │
                                  ▼
                        ┌───────────────┐         ┌───────────────┐
                        │  Dispatch Svc  │         │  Routing Svc  │
                        │   (Node.js)    │         │   (Node.js)   │
                        │   Port 9002    │         │   Port 9003   │
                        └───────────────┘         └───────────────┘
```

#### OSS Tool Integration

| Tool | Purpose | Integration Point |
|------|---------|-------------------|
| Nginx | API Gateway | `/etc/nginx/sites-available/ridendine` |
| JWT (jsonwebtoken) | Token management | `services/auth/src/tokens/` |
| Zod | Request validation | All service DTOs |
| Redis | Event bus | `services/shared/events/` |
| Nats (optional) | Service messaging | `services/shared/nats/` |

#### AI Integration Points

| Feature | Service | Implementation |
|---------|---------|----------------|
| Fraud detection | Auth Service | Check for suspicious registration patterns |
| Anomaly detection | Orders Service | Flag unusual order amounts |

#### Success Criteria

- [ ] All services respond to health checks
- [ ] User can register, login, and access protected routes
- [ ] Order creation flow works end-to-end
- [ ] WebSocket connection established for real-time updates
- [ ] Services communicate via Redis events
- [ ] Unit test coverage > 75% for all services

---

### Phase 3: Driver App & GPS Integration

**Duration:** 3 weeks  
**Primary Mode:** `code`  
**Objective:** Build the React Native driver application with GPS tracking and order management.

#### Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| Driver App (Expo) | React Native app | Runs on iOS/Android simulators |
| Order Acceptance | View and accept orders | Accept button updates order status |
| GPS Tracking | Background location updates | Location sent to Routing Service |
| Navigation | Turn-by-turn directions | Opens external map app |
| Earnings Dashboard | Session earnings view | Accurate calculations |

#### Task Breakdown

| Task | AI Mode | Hours | Dependencies |
|------|---------|-------|--------------|
| Driver app scaffold | `code` | 8 | Phase 1-2 complete |
| Auth screens | `code` | 16 | Auth Service |
| Order list screen | `code` | 24 | Orders Service |
| Order detail screen | `code` | 16 | Orders Service |
| GPS tracking | `code` | 32 | Routing Service |
| Navigation integration | `code` | 16 | External maps |
| Earnings view | `code` | 8 | Orders Service |

#### App Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DRIVER APP (Expo)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth      │  │   Home      │  │  Order Details      │  │
│  │   Screen    │  │   Screen    │  │  Screen             │  │
│  │             │  │             │  │                     │  │
│  │ - Login     │  │ - Order     │  │  - Accept/Decline   │  │
│  │ - Register  │  │   Queue     │  │  - Pickup/Deliver   │  │
│  └─────────────┘  │ - Earnings  │  │  - Navigation       │  │
│                   └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              GPS Tracking Service                     │   │
│  │  - Background location updates                        │   │
│  │  - Location batching for battery efficiency           │   │
│  │  - Offline queue when no connectivity                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│              ┌─────────────────────────────┐                 │
│              │   WebSocket Connection      │                 │
│              │   (Realtime Service)        │                 │
│              └─────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

#### OSS Tool Integration

| Tool | Purpose | Integration Point |
|------|---------|-------------------|
| Expo | Mobile framework | `apps/driver-app/` |
| React Native Maps | Map display | `components/MapView.tsx` |
| expo-location | GPS access | `services/LocationService.ts` |
| expo-linking | External navigation | `utils/navigation.ts` |
| Socket.IO Client | Real-time updates | `services/SocketService.ts` |

#### GPS Integration Details

| Feature | Implementation | Data Flow |
|---------|---------------|-----------|
| Foreground tracking | `watchPositionAsync()` | 5-second intervals |
| Background tracking | `TaskManager` | 30-second intervals |
| Geofencing | `Geofencing API` | Chef location + customer |
| Battery optimization | Location batching | Queue + batch send |

#### Success Criteria

- [ ] Driver can register and login
- [ ] Driver sees available orders with distance/earnings
- [ ] Driver can accept/decline orders
- [ ] GPS location updates appear on admin dashboard
- [ ] Navigation opens external map app
- [ ] Order status updates reflect in real-time

---

### Phase 4: Chef Dashboard & Menu Management

**Duration:** 3 weeks  
**Primary Mode:** `code`  
**Objective:** Build the web-based chef dashboard with menu CRUD and order management.

#### Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| Chef Dashboard (Next.js) | Web application | Deployable to Vercel |
| Menu Management | CRUD for items/categories | Full admin interface |
| Order Management | Accept/ready/complete orders | Workflow functional |
| Earnings View | Revenue tracking | Accurate calculations |
| Schedule Management | Operating hours | Availability updates |

#### Task Breakdown

| Task | AI Mode | Hours | Dependencies |
|------|---------|-------|--------------|
| Next.js scaffold | `code` | 8 | Phase 1-2 complete |
| Dashboard layout | `code` | 16 | None |
| Menu CRUD screens | `code` | 40 | Orders Service |
| Order queue screen | `code` | 32 | Orders Service |
| Earnings charts | `code` | 16 | Orders Service |
| Schedule interface | `code` | 16 | Orders Service |

#### Dashboard Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CHEF DASHBOARD (Next.js)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Sidebar Navigation                                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │  │
│  │  │ Dashboard│ │ Orders  │ │  Menu   │ │  Earnings       │   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Today's Orders    │  │          Menu Manager               │  │
│  │                     │  │                                     │  │
│  │  [Order #1234]      │  │  ┌─────────┬─────────┬─────────┐   │  │
│  │  Status: PREPARING  │  │  │  Category│ Items   │ Actions │   │  │
│  │  Time: 12 min       │  │  │  [+]     │ 15      │ Edit    │   │  │
│  │  [✓ Ready]          │  │  │  [+]     │ 8       │ Edit    │   │  │
│  │                     │  │  │  [+]     │ 22      │ Edit    │   │  │
│  │  [Order #1235]      │  │  └─────────┴─────────┴─────────┘   │  │
│  │  Status: NEW        │  │                                     │  │
│  │  Time: 2 min        │  │  [+ Add Item] [+ Add Category]      │  │
│  │  [✓ Accept] [✗]     │  │                                     │  │
│  └─────────────────────┘  └─────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

#### OSS Tool Integration

| Tool | Purpose | Integration Point |
|------|---------|-------------------|
| Next.js 14 | React framework | `apps/chef-dashboard/` |
| Tailwind CSS | Styling | `tailwind.config.js` |
| Recharts | Charts | `components/Charts.tsx` |
| React Query | Data fetching | `hooks/useOrders.ts` |
| Socket.IO Client | Real-time updates | `hooks/useSocket.ts` |

#### Success Criteria

- [ ] Chef can login and view dashboard
- [ ] Chef can add/edit/delete menu items and categories
- [ ] New orders appear in real-time
- [ ] Chef can accept, reject, and mark orders ready
- [ ] Earnings display correctly over time periods
- [ ] Schedule management updates availability

---

### Phase 5: Native iOS & Android Apps

**Duration:** 2 weeks  
**Primary Mode:** `code`  
**Objective:** Convert Expo prototypes to native apps with enhanced features.

#### Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| iOS App | Native iOS build | Runs on iOS simulator, TestFlight ready |
| Android App | Native Android build | Runs on Android emulator, Play Store ready |
| Push Notifications | FCM + APNs | Notifications received |
| Deep Linking | URL scheme handling | `ridendine://` works |

#### Task Breakdown

| Task | AI Mode | Hours | Dependencies |
|------|---------|-------|--------------|
| EAS Build config | `code` | 8 | Phase 1-2 complete |
| iOS native modules | `code` | 24 | Expo modules |
| Android native modules | `code` | 24 | Expo modules |
| Push notification setup | `code` | 16 | Firebase/APNs |
| Deep linking | `code` | 12 | Universal links |
| App icons/splash | `design` | 8 | Assets ready |

#### Native App Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              CUSTOMER MOBILE (React Native + Native)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Native Bridges                            │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │  │
│  │  │  PushNotifs   │ │  DeepLinks    │ │  BiometricAuth    │  │  │
│  │  │  (FCM/APNs)   │ │  (iOS/Android)│ │  (FaceID/Touch)   │  │  │
│  │  └───────────────┘ └───────────────┘ └───────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Shared Logic                              │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │  │
│  │  │  API Client   │ │  WebSocket    │ │  State Management │  │  │
│  │  │  (Axios)      │ │  (Socket.IO)  │ │  (Zustand)        │  │  │
│  │  └───────────────┘ └───────────────┘ └───────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Screens                                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │  │
│  │  │  Home   │ │  Menu   │ │  Cart   │ │  Order Tracking │   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

#### OSS Tool Integration

| Tool | Purpose | Integration Point |
|------|---------|-------------------|
| EAS Build | Native builds | `eas.json` |
| Firebase Cloud Messaging | Android push | `android/app/google-services.json` |
| Apple Push Notifications | iOS push | `ios/ridendine.entitlements` |
| react-native-deep-linking | URL handling | `App.tsx` |

#### Success Criteria

- [ ] iOS app builds successfully
- [ ] Android app builds successfully
- [ ] Push notifications received on both platforms
- [ ] Deep links open correct screen
- [ ] App Store/Play Store submission ready

---

### Phase 6: AI Features & System Polish

**Duration:** 3 weeks  
**Primary Mode:** `code` + `architect`  
**Objective:** Implement AI-powered features and finalize the system for production.

#### Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| Predictive ETAs | ML-based time estimation | Within 5 min accuracy |
| Demand Forecasting | Order volume prediction | 80% accuracy at 1-hour horizon |
| Dynamic Pricing | Surge pricing model | Rates adjust correctly |
| Smart Dispatch | AI driver assignment | 20%+ efficiency improvement |
| Monitoring Dashboard | Grafana + Prometheus | All metrics visualized |

#### Task Breakdown

| Task | AI Mode | Hours | Dependencies |
|------|---------|-------|--------------|
| ETA prediction model | `code` | 40 | Historical data |
| Demand forecasting | `code` | 32 | ETA model ready |
| Dynamic pricing engine | `code` | 24 | Demand model ready |
| Smart dispatch algorithm | `code` | 40 | All models ready |
| Prometheus metrics | `code` | 16 | All services |
| Grafana dashboards | `code` | 16 | Metrics ready |

#### AI Feature Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI SERVICES LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   ML Model Serving                           │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │  │
│  │  │   ETA Model   │ │   Demand      │ │   Dispatch        │  │  │
│  │  │   (TensorFlow │ │   Forecasting │ │   Optimizer       │  │  │
│  │  │   .js/Python) │ │   (Prophet)   │ │   (OR-Tools)      │  │  │
│  │  └───────────────┘ └───────────────┘ └───────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Prediction Service                        │  │
│  │                                                             │  │
│  │  POST /predict/eta         → { eta: 12.5, confidence: 0.87 }│  │
│  │  POST /predict/demand      → { orders: 45, confidence: 0.82 }│  │
│  │  POST /optimize/dispatch   → { assignments: [...] }          │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   Business Logic                             │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │  │
│  │  │   Dynamic     │ │   Smart       │ │   Alert           │  │  │
│  │  │   Pricing     │ │   Dispatch    │ │   Generation      │  │  │
│  │  │   Engine      │ │   Service     │ │                   │  │  │
│  │  └───────────────┘ └───────────────┘ └───────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

#### OSS Tool Integration

| Tool | Purpose | Integration Point |
|------|---------|-------------------|
| TensorFlow.js | In-browser ML | `packages/ml/eta-predictor/` |
| TensorFlow Serving | Model serving (optional) | Docker container |
| Prophet | Demand forecasting | `packages/ml/demand-forecasting/` |
| OR-Tools | Optimization | `services/dispatch/optimizer.ts` |
| Prometheus | Metrics collection | `services/*/metrics.ts` |
| Grafana | Dashboards | `monitoring/grafana/` |

#### AI Integration Points

| Feature | Data Sources | Output |
|---------|--------------|--------|
| ETA Prediction | Distance, traffic, time of day, chef speed | Minutes + confidence |
| Demand Forecast | Historical orders, weather, events | Orders per hour |
| Dynamic Pricing | Demand multiplier, supply ratio, surge zones | Price multiplier |
| Smart Dispatch | Driver location, ratings, order clustering | Optimal assignments |

#### Monitoring & Observability

| Component | Tool | Metrics |
|-----------|------|---------|
| API Latency | Prometheus | `http_request_duration_seconds` |
| Error Rate | Prometheus | `http_requests_total{status=5xx}` |
| Order Throughput | Prometheus | `orders_completed_total` |
| Driver Availability | Prometheus | `drivers_online_total` |
| System Health | Grafana | Dashboard per service |

#### Success Criteria

- [ ] ETA predictions within 5 minutes of actual
- [ ] Demand forecast 80% accurate at 1-hour horizon
- [ ] Dynamic pricing activates during high demand
- [ ] Smart dispatch reduces average delivery time
- [ ] All services expose Prometheus metrics
- [ ] Grafana dashboards show real-time system health

---

## Task Delegation Matrix

### AI Mode Responsibilities

| Mode | Phase | Responsibilities |
|------|-------|-----------------|
| `architect` | All phases | System design, service contracts, data flow, security architecture |
| `code` | 1-6 | Implementation of all services, apps, and integrations |
| `debug` | 2-6 | Service integration issues, WebSocket problems, performance tuning |
| `review` | 2-6 | Code review for all changes before merge |
| `ask` | All phases | Documentation, architecture explanations, best practices |

### Task Assignment by Phase

| Phase | Primary Mode | Supporting Modes |
|-------|--------------|-----------------|
| Phase 1 | `architect` + `code` | `ask` (tool selection) |
| Phase 2 | `code` | `architect` (contracts), `debug` (integration) |
| Phase 3 | `code` | `debug` (GPS issues) |
| Phase 4 | `code` | `ask` (UI patterns) |
| Phase 5 | `code` | `debug` (native build issues) |
| Phase 6 | `architect` + `code` | `debug` (performance) |

---

## Dependency Graph

```
Phase 1: Foundation
    │
    ├──► Phase 2: Backend Services
    │           │
    │           ├──► Phase 3: Driver App
    │           │
    │           ├──► Phase 4: Chef Dashboard
    │           │
    │           └──► Phase 5: Native Apps
    │
    └──► Phase 6: AI Features
            │
            └─────────────► (Requires Phase 2-5 complete)
```

### Critical Path

1. **Database** → **Auth Service** → **All Features**
2. **Orders Service** → **Driver App** → **GPS Tracking**
3. **Orders Service** → **Chef Dashboard** → **Menu Management**
4. **Realtime Service** → **All Apps** → **Real-time Updates**

---

## Automation Pipelines

### CI/CD Pipeline (GitHub Actions)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Phase 1: Code Quality
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit

  # Phase 2: Database Migrations
  database:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - run: npm run db:migrate
      - run: npm run db:seed
      - run: npm run test:integration

  # Phase 3: Service Build & Test
  services:
    needs: [quality, database]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, orders, dispatch, routing, realtime]
    steps:
      - uses: actions/checkout@v4
      - run: cd services/${{ matrix.service }} && npm ci
      - run: cd services/${{ matrix.service }} && npm run build
      - run: cd services/${{ matrix.service }} && npm run test

  # Phase 4: App Build
  apps:
    needs: [quality, database]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Customer Web
        run: npm run build --workspace=customer-web-react
      - name: Build Driver App
        run: npm run build --workspace=driver-app
      - name: Build Chef Dashboard
        run: npm run build --workspace=chef-dashboard

  # Phase 5: Deployment (Main Branch Only)
  deploy:
    needs: [services, apps]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Staging
        run: ./scripts/deploy.sh staging
      - name: Run E2E Tests
        run: npm run test:e2e
      - name: Deploy to Production
        run: ./scripts/deploy.sh production
        if: success()
```

### Automated Testing Pipeline

| Test Type | Tool | Frequency | Pass Required |
|-----------|------|-----------|---------------|
| Unit Tests | Jest/Vitest | Every PR | 80% coverage |
| Integration Tests | Supertest | Every PR | 100% pass |
| E2E Tests | Playwright | Nightly | 95% pass |
| Load Tests | k6 | Weekly | <500ms p95 |
| Security Scan | OWASP ZAP | Weekly | No critical |

### Database Migration Pipeline

```yaml
migrations:
  script: |
    # 1. Create backup
    pg_dump $DATABASE_URL > backups/pre-migration_$(date +%Y%m%d_%H%M%S).sql
    
    # 2. Run migrations in transaction
    psql $DATABASE_URL -f migrations/001_initial_schema.sql
    psql $DATABASE_URL -f migrations/002_chef_enhancements.sql
    psql $DATABASE_URL -f migrations/003_admin_actions.sql
    psql $DATABASE_URL -f migrations/004_orders_enhancements.sql
    
    # 3. Verify schema
    psql $DATABASE_URL -c "SELECT version FROM schema_migrations"
    
    # 4. Rollback plan ready if failed
    if [ $? -ne 0 ]; then
      psql $DATABASE_URL -f migrations/rollback.sql
      exit 1
    fi
```

---

## Resource Estimates

### Development Hours by Phase

| Phase | Backend | Frontend | DevOps | Total |
|-------|---------|----------|--------|-------|
| Phase 1 | 8 | 0 | 16 | 24 |
| Phase 2 | 160 | 0 | 8 | 168 |
| Phase 3 | 8 | 104 | 0 | 112 |
| Phase 4 | 8 | 120 | 0 | 128 |
| Phase 5 | 0 | 92 | 8 | 100 |
| Phase 6 | 136 | 0 | 32 | 168 |
| **Total** | **320** | **316** | **64** | **700** |

### Infrastructure Costs (Monthly)

| Resource | OSS Option | Paid Option | Estimated Cost |
|----------|-----------|-------------|----------------|
| Compute | Self-hosted VPS | AWS/DigitalOcean | $50-200/month |
| Database | PostgreSQL (self) | Cloud DB | $0-50/month |
| Cache | Redis (self) | ElastiCache | $0-30/month |
| Maps | OSRM (self-hosted) | Mapbox | $0-10/month |
| Monitoring | Prometheus+Grafana | Cloud monitoring | $0-20/month |
| CI/CD | GitHub Actions | Jenkins (self) | $0/month |
| **Total** | | | **$50-330/month** |

### Team Scaling Recommendations

| Team Size | Phases Parallel | Focus Areas |
|-----------|----------------|-------------|
| 1 developer | Sequential | All phases (16 weeks) |
| 2 developers | Phase 2-5 parallel | Backend + Frontend |
| 3 developers | All phases parallel | Split by component type |
| 5 developers | All phases parallel | Full parallel execution |

---

## Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Service integration failures | High | High | Contract testing, integration tests |
| GPS accuracy issues | Medium | Medium | Fallback to network location |
| Push notification delays | Medium | Low | WebSocket fallback |
| Database performance at scale | Low | High | Index optimization, read replicas |
| AI model accuracy | Medium | Medium | A/B testing, human oversight |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss | Low | Critical | Daily backups, point-in-time recovery |
| Service downtime | Medium | High | Health checks, auto-restart |
| Security breach | Low | Critical | Regular audits, dependency scanning |
| Cost overrun | Medium | Medium | Budget monitoring, auto-scaling limits |

### AI Agent Coordination Risks

| Risk | Mitigation |
|------|------------|
| Conflicting changes | File ownership by mode, PR reviews |
| Duplicate work | Shared task board, communication |
| Integration issues | Phased integration testing |

---

## Timeline Recommendations

### Milestone Schedule

| Milestone | Target Date | Phase | Key Deliverable |
|-----------|-------------|-------|-----------------|
| M1: Database Ready | Week 2 | Phase 1 | Schema applied, seeded |
| M2: Backend Connected | Week 5 | Phase 2 | All services wired |
| M3: Driver App Live | Week 8 | Phase 3 | GPS tracking functional |
| M4: Chef Dashboard Live | Week 11 | Phase 4 | Full order workflow |
| M5: Native Apps Submitted | Week 13 | Phase 5 | App Store ready |
| M6: AI Features Live | Week 16 | Phase 6 | Predictive features |

### Parallel Execution Suggestions

1. **Weeks 1-2:** Phase 1 (Foundation)
2. **Weeks 3-5:** Phase 2 (Backend) in parallel with Phase 3 (Driver App) start
3. **Weeks 6-8:** Phase 3 (Driver App) + Phase 4 (Chef Dashboard) parallel
4. **Weeks 9-11:** Phase 4 (Chef) + Phase 5 (Native Apps) parallel
5. **Weeks 12-14:** Phase 5 (Native) + Phase 6 (AI) start
6. **Weeks 15-16:** Phase 6 (AI) completion + polish

---

## Success Criteria Summary

### Phase Completion Checklist

Each phase is complete when:

| Phase | Criteria |
|-------|----------|
| Phase 1 | Database operational, Redis working, backups configured |
| Phase 2 | All services responding, auth functional, orders flowing |
| Phase 3 | Driver app installs, GPS tracking, order acceptance works |
| Phase 4 | Chef dashboard loads, menu CRUD, order workflow complete |
| Phase 5 | iOS/Android builds succeed, push notifications work |
| Phase 6 | ETA predictions accurate, dashboards live, monitoring active |

### Overall Project Success

| Metric | Target |
|--------|--------|
| Order completion rate | >95% |
| Average delivery time | <30 minutes |
| Customer satisfaction | >4.5/5.0 |
| Driver acceptance rate | >80% |
| System uptime | >99.9% |

---

## Document Maintenance

### Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-30 | AI Orchestrator | Initial creation |

### Review Schedule

- **Weekly:** Task completion tracking
- **Monthly:** Phase milestone review
- **Quarterly:** Full plan refresh

### Ownership

- **Document Owner:** Project Architect
- **AI Mode:** `architect` for updates
- **Approval:** Human project lead for major changes

---

*This document serves as the master orchestration plan for coordinating multiple AI agents in building the RideNDine platform. All agents should reference this document when planning work.*
