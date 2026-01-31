# Project Setup Plan (Draft)

**Status:** Draft (requires team review)  
**Owner:** TBD  
**Last updated:** 2026-01-30  
**Operational sources:** [README.md](../README.md), [AGENTS.md](../AGENTS.md)

## Purpose
Provide a realistic, secure, and reviewable plan for establishing the RideNDine production-ready foundation. This replaces informal, sales-like planning notes and sets clear expectations for scope, risk, and quality gates.

## Non-goals
- No implied delivery guarantees or “instant” timelines.
- No automated, unreviewed changes to production systems.
- No assumption that AI output is production-ready without human validation.

## Assumptions
- Existing demo services and apps remain the starting point.
- Security, privacy, and compliance are first-class requirements.
- Every change is reviewed by a senior engineer and tested before merge.

## AI-Assisted Workflow (Human-in-the-Loop)
AI tools assist with drafts and scaffolding, but do not replace engineering review or security practices.

- **Drafting support (Claude/Copilot):** Generates initial outlines, boilerplate, and sample code for review.
- **Review support (CodeRabbit):** Flags issues and suggests improvements; does not replace manual security review or architectural approval.
- **Human verification (required):**
  - Threat modeling and security architecture review
  - Manual code review by senior engineers
  - SAST/DAST and dependency scanning
  - GDPR/PCI-DSS/privacy compliance checks
  - QA sign-off after unit/integration/e2e coverage and load testing

## MVP Timeline (4–8 Weeks)
Keep the original module sequence (AUTH, USER, CHEF, MENU, ORDER, PAYMENT, DRIVER, DISPATCH, REALTIME) but deliver via phased sprints with explicit security, testing, and compliance checkpoints.

### Phase 0 — Foundations (Week 1)
- Repository baselines and environment management
- CI/CD skeleton, linting, formatting, and pre-commit checks
- Security architecture outline + threat model kickoff
- Observability plan: logs, metrics, tracing, and alerting
- API documentation framework setup

**Checkpoint:** Security architecture review + initial threat model sign-off

### Phase 1 — Identity & Core Data (Weeks 2–3)
- AUTH + USER modules (JWT, refresh tokens, RBAC, password policies)
- CHEF + MENU modules (CRUD + validation)
- Error handling and resilience patterns (timeouts, retries, circuit breakers)
- Unit and integration test coverage for all new modules

**Checkpoint:** SAST/DAST baseline + senior code review

### Phase 2 — Ordering & Payments (Weeks 3–5)
- ORDER + PAYMENT modules with state machine validations
- PCI-DSS and privacy review checkpoints
- Rate limiting and abuse protection on critical endpoints
- Database indexing and query optimization for order workflows
- Integration tests and API docs for payments and orders

**Checkpoint:** Compliance review + payment flow security sign-off

### Phase 3 — Logistics & Realtime (Weeks 5–6)
- DRIVER + DISPATCH modules with routing and assignment logic
- REALTIME service (WebSocket, auth, rate limits)
- Load/performance testing for realtime and dispatch
- Monitoring dashboards and alerting for critical flows

**Checkpoint:** Performance and resilience review

### Phase 4 — Hardening & Release Readiness (Weeks 6–8)
- E2E test suite and QA gates
- Incident response runbook + rollback plan
- Privacy impact assessment and data retention policy
- Final security review and risk acceptance

**Checkpoint:** Release readiness sign-off

## Quality Gates (Required Before Merge)
- Senior engineer code review
- Unit + integration + e2e tests passing
- SAST/DAST results reviewed
- Performance and load tests for critical paths
- Compliance checks (GDPR/PCI-DSS) documented

## Ownership & Review
- All structural changes and security-sensitive code require explicit review.
- Proposed architecture changes must be referenced in the PR description and validated by the team.
