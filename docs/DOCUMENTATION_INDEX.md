# RideNDine Documentation Index

Complete index of all documentation for the RideNDine multi-role delivery platform.

**Last Updated:** 2026-01-31
**Status:** Phase 3 Complete - Production Ready

---

## Quick Navigation

### For New Developers

1. Start here: [DEVELOPMENT.md](../DEVELOPMENT.md)
2. Understand the system: [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Explore the API: [openapi.yaml](../openapi.yaml) or [Swagger UI](http://localhost:9001/api/docs)
4. Learn the domain: [GLOSSARY.md](./GLOSSARY.md)

### For Frontend Developers

1. [API Client Guide](./api-client.md) - Integration examples
2. [User Journeys](./USER_JOURNEYS.md) - User flow documentation
3. [OpenAPI Spec](../openapi.yaml) - Complete API reference

### For Backend Developers

1. [Architecture](./ARCHITECTURE.md) - System design
2. [Database Schema](./DATABASE.md) - Database documentation
3. [DEVELOPMENT.md](../DEVELOPMENT.md) - Local setup

### For Product/Business

1. [User Journeys](./USER_JOURNEYS.md) - User experience flows
2. [Glossary](./GLOSSARY.md) - Platform terminology
3. [Architecture Overview](./ARCHITECTURE.md#executive-summary)

---

## Core Documentation

### Getting Started

| Document                            | Description                                                                                             | Audience       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------- |
| [DEVELOPMENT.md](../DEVELOPMENT.md) | Complete developer setup guide with prerequisites, Docker setup, local development, and troubleshooting | All developers |
| [QUICKSTART.md](../QUICKSTART.md)   | Get up and running in 5 minutes                                                                         | New developers |
| [README.md](../README.md)           | Project overview, features, and quick links                                                             | Everyone       |

### API Documentation

| Document                                                | Description                                                                                                                                 | Audience                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [openapi.yaml](../openapi.yaml)                         | OpenAPI 3.1 specification with 42 REST endpoints                                                                                            | API consumers, frontend developers     |
| [Swagger UI](http://localhost:9001/api/docs)            | Interactive API documentation (live when API running)                                                                                       | Developers testing APIs                |
| [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)  | **NEW** Comprehensive API integration guide with 25+ code examples covering authentication, orders, payments, real-time, and error handling | Frontend/mobile/integration developers |
| [api-client.md](./api-client.md)                        | API client library documentation and integration examples                                                                                   | Frontend/mobile developers             |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)              | **NEW** Quick reference for common endpoints, errors, commands, and troubleshooting                                                         | All developers                         |
| [05_api_endpoint_specs.md](../05_api_endpoint_specs.md) | Detailed endpoint specifications with examples                                                                                              | Backend developers                     |

### Architecture & Design

| Document                                                    | Description                                                                                     | Audience                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                        | System architecture, technology stack, service descriptions, data flow, deployment architecture | All technical team members |
| [DATABASE.md](./DATABASE.md)                                | Database schema, tables, indexes, migrations, geospatial functions                              | Backend developers, DBAs   |
| [09_backend_architecture.md](../09_backend_architecture.md) | Backend architecture overview                                                                   | Backend developers         |

### User Experience

| Document                                              | Description                                                                          | Audience                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------- |
| [USER_JOURNEYS.md](./USER_JOURNEYS.md)                | Complete user flows for customers, chefs, drivers, and admins with sequence diagrams | Product, UX, frontend developers |
| [10_customer_app_plan.md](../10_customer_app_plan.md) | Customer mobile app development plan                                                 | Mobile developers                |

### Operational Documentation

| Document                                                                   | Description                                                                                                                                                                      | Audience                               |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [DEPLOYMENT.md](./DEPLOYMENT.md)                                           | **NEW** Complete deployment guide for local, staging, and production environments with Docker, Kubernetes, ECS, database migrations, secrets management, and rollback procedures | DevOps, Backend developers             |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)                                 | **NEW** Comprehensive troubleshooting guide with 30+ common issues and solutions for Docker, API, database, performance, and real-time systems                                   | All developers, Operations             |
| [RUNBOOK_SERVICE_RESTART.md](./RUNBOOK_SERVICE_RESTART.md)                 | **NEW** Step-by-step procedures for gracefully restarting services (API, database, Redis) without downtime                                                                       | Operations, On-call engineers          |
| [RUNBOOK_DATABASE_RECOVERY.md](./RUNBOOK_DATABASE_RECOVERY.md)             | **NEW** Database disaster recovery procedures including snapshots, point-in-time recovery, and complete DR scenarios                                                             | DBAs, Operations                       |
| [RUNBOOK_PERFORMANCE_DEGRADATION.md](./RUNBOOK_PERFORMANCE_DEGRADATION.md) | **NEW** Procedures for diagnosing and resolving performance issues, slow queries, and resource exhaustion                                                                        | Operations, Backend developers         |
| [RUNBOOK_SCALING.md](./RUNBOOK_SCALING.md)                                 | **NEW** Horizontal and vertical scaling procedures for all services including auto-scaling configuration                                                                         | DevOps, Operations                     |
| [RUNBOOK_EMERGENCY_PROCEDURES.md](./RUNBOOK_EMERGENCY_PROCEDURES.md)       | **NEW** Critical incident response procedures for outages, security breaches, and disaster scenarios                                                                             | On-call engineers, Incident commanders |

### Reference

| Document                                   | Description                                                                                 | Audience          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------------- |
| [GLOSSARY.md](./GLOSSARY.md)               | Complete glossary of domain terms, technical concepts, and platform terminology (75+ terms) | Everyone          |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | **NEW** Quick reference for API endpoints, errors, commands, and troubleshooting            | All developers    |
| [AGENTS.md](../AGENTS.md)                  | Agent roles and implementation status                                                       | Team coordination |
| [CLAUDE.md](../CLAUDE.md)                  | Project conventions, build commands, file edit conventions                                  | Developers        |

---

## Planning & Roadmap

| Document                                                            | Description                                    | Status       |
| ------------------------------------------------------------------- | ---------------------------------------------- | ------------ |
| [DEVELOPMENTPLAN.md](../DEVELOPMENTPLAN.md)                         | Full 16-week production roadmap                | Aspirational |
| [BACKEND_DEVELOPMENT_PLAN.md](../BACKEND_DEVELOPMENT_PLAN.md)       | Backend features, GPS, security implementation | Aspirational |
| [04_developer_sprint_roadmap.md](../04_developer_sprint_roadmap.md) | Sprint-based development plan                  | Aspirational |

---

## Specialized Documentation

### Payment & Commerce

| Document                                                                        | Description                             |
| ------------------------------------------------------------------------------- | --------------------------------------- |
| [01_stripe_connect_architecture.md](../01_stripe_connect_architecture.md)       | Stripe Connect integration architecture |
| [03_commission_settlement_contract.md](../03_commission_settlement_contract.md) | Commission calculation and settlement   |
| [STRIPE_TESTING_GUIDE.md](../STRIPE_TESTING_GUIDE.md)                           | Testing Stripe integration              |

### Webhooks & Integrations

| Document                                                          | Description                       |
| ----------------------------------------------------------------- | --------------------------------- |
| [08_webhook_architecture.md](../08_webhook_architecture.md)       | Webhook handling and architecture |
| [06_cooco_partner_interface.md](../06_cooco_partner_interface.md) | Partner integration interface     |

### Mobile Development

| Document                                                                          | Description                           |
| --------------------------------------------------------------------------------- | ------------------------------------- |
| [MOBILE_API_IMPLEMENTATION_COMPLETE.md](../MOBILE_API_IMPLEMENTATION_COMPLETE.md) | Mobile API implementation details     |
| [MOBILE_API_QUICK_REFERENCE.md](../MOBILE_API_QUICK_REFERENCE.md)                 | Quick reference for mobile developers |

### Security & GPS

| Document                                                            | Description                          |
| ------------------------------------------------------------------- | ------------------------------------ |
| [GPS_SECURITY_IMPLEMENTATION.md](../GPS_SECURITY_IMPLEMENTATION.md) | GPS tracking security implementation |

### Testing

| Document                          | Description                 |
| --------------------------------- | --------------------------- |
| [TEST_GUIDE.md](../TEST_GUIDE.md) | Comprehensive testing guide |

---

## Implementation Status

### Phase 1-3: Complete ✅

**Authentication & Authorization:**

- JWT access + refresh tokens
- Role-based access control (customer, chef, driver, admin)
- Email verification
- Password reset flow

**Chefs:**

- Chef registration & verification
- Stripe Connect onboarding
- Menu & menu item management
- Chef search (geospatial)
- Operating hours
- Reviews & ratings

**Orders:**

- Order creation & validation
- State machine (12 states)
- Payment integration (Stripe)
- Commission calculation (15%)
- Order tracking
- Refund processing

**Drivers:**

- Driver registration & verification
- GPS location tracking
- Availability toggle
- Driver assignment (distance + rating based)
- Earnings tracking

**Real-Time:**

- WebSocket gateway (Socket.IO)
- Order status updates
- Driver location broadcasts
- ETA calculations

**Admin:**

- Chef/driver verification
- User management
- Audit logging
- Analytics dashboard

**Mobile Apps:**

- Customer mobile (React Native/Expo)
- Driver mobile (React Native/Expo)
- Navigation, state management, API integration

**Dashboards:**

- Chef dashboard (Next.js)
- Admin dashboard (Next.js)

### Phase 4-5: Planned

- Microservices split (scaffolded, not integrated)
- Advanced analytics
- ML-based dispatch optimization
- Customer web app (React)
- Push notifications
- Chat system

---

## API Endpoints Summary

**Total:** 42 REST endpoints + 1 WebSocket gateway

**Breakdown by module:**

- Authentication: 7 endpoints
- Users: 3 endpoints
- Chefs: 21 endpoints
- Orders: 12 endpoints
- Drivers: 7 endpoints
- Dispatch: 4 endpoints
- Admin: 2 endpoints

**See:** [openapi.yaml](../openapi.yaml) for complete specification

---

## Database Summary

**Database:** PostgreSQL 16 with PostGIS 3.4

**Statistics:**

- Total tables: 25+
- Total indexes: 40+
- Migrations applied: 10 (001-010)
- Extensions: uuid-ossp, postgis

**Key tables:**

- `users` - Unified authentication
- `chefs` - Chef profiles with geospatial data
- `orders` - Order lifecycle with 12 states
- `drivers` - Driver profiles with GPS tracking
- `driver_locations` - GPS tracking history
- `payments` - Stripe payment tracking
- `reviews` - Chef and driver reviews

**See:** [DATABASE.md](./DATABASE.md) for complete schema

---

## Technology Stack

### Backend

- Node.js 18.x
- TypeScript 5.x
- NestJS 10.x
- PostgreSQL 16 with PostGIS 3
- Redis 7.x
- Socket.IO 4.x

### Frontend

- React 18.x
- React Native 0.72
- Expo 52.x
- Next.js 14.x
- TypeScript 5.x

### DevOps

- Docker & Docker Compose
- GitHub Actions
- ESLint, Prettier, Husky

### External Services

- Stripe (payments)
- Stripe Connect (marketplace)
- Google Maps API (geocoding)
- Mapbox (alternative geocoding)

---

## Port Reference

| Port | Service                 | Status        |
| ---- | ----------------------- | ------------- |
| 8081 | Core demo server        | ✅ Working    |
| 9001 | API service (NestJS)    | ✅ Working    |
| 9002 | Dispatch service        | 🔄 Scaffolded |
| 9003 | Routing service         | 🔄 Scaffolded |
| 9004 | Realtime gateway        | 🔄 Scaffolded |
| 8010 | Customer web dev server | ✅ Working    |
| 5432 | PostgreSQL              | ✅ Working    |
| 6379 | Redis                   | ✅ Working    |
| 8080 | Adminer (DB UI)         | ✅ Working    |

---

## Quick Commands

### Database

```bash
npm run db:up        # Start PostgreSQL + Redis
npm run db:migrate   # Apply migrations
npm run db:seed      # Load test data
npm run db:reset     # Full reset
```

### Services

```bash
npm run dev:api      # Start API service
npm run dev          # Start all services concurrently
npm run docker:up    # Start all services with Docker
```

### Testing

```bash
npm run test         # Run all tests
npm run test:cov     # Generate coverage report
npm run lint         # Lint code
npm run format       # Format code
```

---

## Documentation Conventions

### File Naming

- `UPPERCASE.md` - Root-level important docs (README, DEVELOPMENT)
- `lowercase.md` - Subdirectory docs (api-client.md)
- `NN_description.md` - Numbered planning docs (01_stripe_connect)

### Document Structure

- **Front matter:** Title, status, last updated
- **Table of contents:** For docs >500 lines
- **Code examples:** With syntax highlighting
- **Links:** Relative paths from current file
- **Status indicators:** ✅ Complete, 🔄 In Progress, ⏳ Not Started, ❌ Blocked

### Markdown Style

- **Headers:** Title case
- **Code blocks:** Language specified for syntax highlighting
- **Lists:** Consistent indentation
- **Tables:** For structured data
- **Diagrams:** ASCII art or Mermaid syntax

---

## Contributing to Documentation

### Before You Edit

Archive the current version:

```bash
cp file.md "edits/file.md.$(date +%Y-%m-%d_%H-%M-%S).before-your-change"
```

### Documentation Checklist

- [ ] Update "Last Updated" date
- [ ] Add to table of contents (if applicable)
- [ ] Include code examples
- [ ] Link to related documents
- [ ] Run spell check
- [ ] Test all code examples
- [ ] Update this index if adding new docs

### Documentation Standards

- **Accuracy:** All examples must be tested and working
- **Completeness:** Cover happy path + error cases
- **Clarity:** Write for your audience (beginner, intermediate, advanced)
- **Consistency:** Follow existing format and style
- **Maintenance:** Update docs when code changes

---

## Getting Help

### Documentation Issues

- Check this index for the right document
- Use Ctrl+F to search within documents
- Check the glossary for unfamiliar terms

### Code Issues

- See [DEVELOPMENT.md](../DEVELOPMENT.md) troubleshooting section
- Check [GitHub Issues](https://github.com/ridendine/ridendine/issues)
- Review error messages in logs

### Questions

- Technical: GitHub Issues
- Documentation: Create PR with questions as comments
- Architecture: Review [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Document Maintenance

### Quarterly Review Schedule

- **Q1 2026:** Architecture, API specs
- **Q2 2026:** User journeys, database schema
- **Q3 2026:** Development guides, testing docs
- **Q4 2026:** All documentation audit

### Ownership

- **Architecture & Database:** Backend team
- **API Documentation:** API team
- **User Journeys:** Product team
- **Development Guides:** DevOps team
- **Glossary:** All team members

---

**Total Documents:** 40+
**Documentation Coverage:** ✅ Complete for Phase 1-3
**Next Review:** 2026-02-15 (before Phase 4)
**Maintained By:** Engineering Team

---

**Quick Links:**

- [Main README](../README.md)
- [Developer Setup](../DEVELOPMENT.md)
- [API Reference](../openapi.yaml)
- [Architecture](./ARCHITECTURE.md)
- [Database Schema](./DATABASE.md)
- [User Journeys](./USER_JOURNEYS.md)
- [Glossary](./GLOSSARY.md)
