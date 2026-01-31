# Repository Structure (Proposed)

**Status:** Draft (proposed structure for review)  
**Owner:** TBD  
**Last updated:** 2026-01-30  
**Operational sources:** [README.md](../README.md), [AGENTS.md](../AGENTS.md)

## Purpose
Document the proposed top-level layout, rationale, and operational considerations. This is a planning document and must be reviewed before adopting as the main structure.

## Proposed Top-Level Layout (Target)
```
ridendine/
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Local dev environment
├── turbo.json                  # Monorepo config
├── package.json                # Root package.json
├── services/
│   ├── api/                    # API service (auth, users, orders, payments)
│   ├── dispatch/               # Dispatch service
│   ├── realtime/               # WebSocket gateway
│   └── shared/                 # Shared types/utils
├── apps/
│   ├── customer-mobile/        # React Native
│   ├── chef-dashboard/         # Next.js
│   ├── driver-mobile/          # React Native
│   └── admin-panel/            # Next.js
├── packages/
│   ├── database/               # DB schema + migrations
│   ├── tsconfig/               # Shared TS configs
│   └── eslint-config/          # Shared ESLint
└── scripts/
    ├── setup-dev.sh            # One-command setup
    └── seed-db.ts              # Database seeding
```

## Rationale
- **Monorepo:** Shared tooling, unified CI, and consistent dependency management.
- **services/api:** Central API surface; separated to allow independent scaling and security hardening.
- **services/dispatch & services/realtime:** Isolated for performance and reliability under load.
- **apps/*:** Role-based clients remain separate for release cadence and platform-specific concerns.
- **packages/*:** Shared configs and data access encourage consistency and reduce drift.
- **scripts/*:** Repeatable setup and seeding reduce onboarding friction and drift between environments.

## Security Considerations
- Centralized secrets management for services and CI (no plaintext in repo).
- Service-to-service auth with scoped tokens; enforce least privilege.
- Rate limiting and DDoS protections at edge and API gateway.
- Mandatory SAST/DAST and dependency scanning in CI.

## Scalability Considerations
- Scale services independently (API, dispatch, realtime).
- Caching strategy for hot paths (orders, tracking, menus).
- Idempotent request handling for retries and webhook processing.

## Monitoring & Operations
- Structured logging with request IDs and trace correlation.
- Metrics for latency, throughput, error rates, and queue depth.
- Dashboards for dispatch performance, realtime connections, and payment flows.
- Incident response runbooks and rollback procedures.

## Change & Review Checklist
- Confirm alignment with current repo state and roadmap.
- Validate dependencies and build tooling changes.
- Security and compliance review completed.
- Performance impact assessed.
- Update README and AGENTS if the structure changes.

## Team Review Required
This structure is proposed and must be reviewed. Reference this document in the PR description so the team can validate feasibility, security, and operational alignment before adoption.
