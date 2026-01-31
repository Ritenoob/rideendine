# Deployment Guide

Complete guide for deploying RideNDine to staging, production, and local environments.

**Last Updated:** 2026-01-31
**Platform Version:** 1.0.0
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Deployment](#local-development-deployment)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Database Migrations](#database-migrations)
7. [Secrets Management](#secrets-management)
8. [Environment Configuration](#environment-configuration)
9. [Docker Deployment](#docker-deployment)
10. [Kubernetes Deployment](#kubernetes-deployment)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Health Checks & Monitoring](#health-checks--monitoring)
13. [Rollback Procedures](#rollback-procedures)
14. [Scaling & Performance](#scaling--performance)
15. [Security Considerations](#security-considerations)
16. [Disaster Recovery](#disaster-recovery)

---

## Overview

RideNDine supports three deployment environments:

| Environment     | Purpose                | URL                           | Auto-Deploy                |
| --------------- | ---------------------- | ----------------------------- | -------------------------- |
| **Development** | Local development      | http://localhost:9001         | No                         |
| **Staging**     | Pre-production testing | https://staging.ridendine.com | Yes (on push to `develop`) |
| **Production**  | Live platform          | https://api.ridendine.com     | Yes (on push to `main`)    |

### Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│            Load Balancer (HTTPS)                │
│         (AWS ALB / Nginx / Cloudflare)          │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼───────┐
│  API Service   │    │  API Service   │
│   (Replica 1)  │    │   (Replica 2)  │
│   Port 9001    │    │   Port 9001    │
└───────┬────────┘    └────────┬───────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │   PostgreSQL 16       │
        │   (Primary + Replica) │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │      Redis 7.x        │
        │   (Session + Cache)   │
        └───────────────────────┘
```

---

## Prerequisites

### Required Software

- **Docker:** 20.10+ and Docker Compose 2.0+
- **Node.js:** 18+ (for local builds)
- **npm:** 9+ (for dependency management)
- **Git:** 2.30+
- **kubectl:** 1.27+ (for Kubernetes deployments)
- **PostgreSQL Client:** 16+ (for migrations)

### Cloud Provider Accounts

- **AWS Account** (or GCP/Azure alternative)
- **Container Registry** (ECR, Docker Hub, or GCR)
- **Domain & SSL Certificate** (Let's Encrypt or AWS Certificate Manager)

### External Services

- **Stripe Account** (for payments)
  - Test API keys for staging
  - Production API keys for production
- **Google Maps API Key** (for geocoding)
- **Mapbox Token** (alternative geocoding provider)

### Access & Credentials

- SSH access to deployment servers
- Container registry credentials
- Database master credentials
- Kubernetes cluster access (if using K8s)

---

## Local Development Deployment

### Quick Start

```bash
# Clone repository
git clone https://github.com/ridendine/ridendine.git
cd ridendine

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your local configuration
nano .env

# Start database and Redis
npm run db:up

# Apply migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start API service
npm run dev:api

# Verify deployment
curl http://localhost:9001/health
```

### Docker Compose (Recommended)

```bash
# Start all services with Docker
npm run docker:up

# Check service status
docker-compose ps

# View logs
docker-compose logs -f api

# Stop services
npm run docker:down
```

### Verify Local Deployment

```bash
# Health check
curl http://localhost:9001/health
# Expected: {"status":"ok","timestamp":"2026-01-31T..."}

# Database connection
curl http://localhost:9001/health/db
# Expected: {"status":"healthy","connections":5}

# Redis connection
curl http://localhost:9001/health/redis
# Expected: {"status":"connected"}

# API documentation
open http://localhost:9001/api/docs

# Database UI (Adminer)
open http://localhost:8080
```

---

## Staging Deployment

Staging environment mirrors production for final testing before release.

### Infrastructure Setup (AWS Example)

```bash
# 1. Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=ridendine-staging-vpc}]'

# 2. Create subnets (public and private)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# 3. Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier ridendine-staging-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username ridendine \
  --master-user-password "SECURE_PASSWORD" \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name ridendine-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --publicly-accessible false

# 4. Create ElastiCache Redis cluster
aws elasticache create-replication-group \
  --replication-group-id ridendine-staging-redis \
  --replication-group-description "RideNDine Staging Redis" \
  --engine redis \
  --cache-node-type cache.t3.small \
  --num-cache-clusters 2 \
  --automatic-failover-enabled

# 5. Create ECS cluster
aws ecs create-cluster --cluster-name ridendine-staging
```

### Build & Push Docker Images

```bash
# 1. Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. Build Docker image
docker build -t ridendine-api:staging -f services/api/Dockerfile .

# 3. Tag image
docker tag ridendine-api:staging 123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:staging

# 4. Push to registry
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:staging
```

### Deploy to ECS

```bash
# Create task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-staging.json

# Create or update service
aws ecs create-service \
  --cluster ridendine-staging \
  --service-name api \
  --task-definition ridendine-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=api,containerPort=9001"

# Verify deployment
aws ecs describe-services --cluster ridendine-staging --services api
```

### ECS Task Definition Example

```json
{
  "family": "ridendine-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:staging",
      "portMappings": [
        {
          "containerPort": 9001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "staging" },
        { "name": "API_PORT", "value": "9001" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ridendine/staging/db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ridendine/staging/jwt-secret"
        },
        {
          "name": "STRIPE_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ridendine/staging/stripe-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ridendine-staging",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:9001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Apply Database Migrations (Staging)

```bash
# Connect to staging database via bastion host
ssh -L 5432:ridendine-staging-db.xxx.us-east-1.rds.amazonaws.com:5432 bastion-user@bastion.staging.ridendine.com

# In another terminal, run migrations
DATABASE_URL="postgresql://ridendine:PASSWORD@localhost:5432/ridendine" npm run db:migrate

# Verify migrations
DATABASE_URL="postgresql://ridendine:PASSWORD@localhost:5432/ridendine" psql -c "SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

### Smoke Tests (Staging)

```bash
# Run automated smoke tests
npm run test:smoke -- --url=https://staging.ridendine.com

# Manual verification
curl https://staging.ridendine.com/health
curl -X POST https://staging.ridendine.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'
```

---

## Production Deployment

Production deployment uses a blue-green strategy to minimize downtime.

### Pre-Deployment Checklist

- [ ] All tests passing in CI/CD
- [ ] Code review approved
- [ ] Staging deployment successful
- [ ] Database migration plan reviewed
- [ ] Rollback plan documented
- [ ] Monitoring dashboards ready
- [ ] On-call engineer identified
- [ ] Stakeholders notified

### Blue-Green Deployment Strategy

```
┌──────────────────────────────────────────────┐
│         Load Balancer (Switch Traffic)       │
└──────────┬────────────────────┬──────────────┘
           │                    │
    ┌──────▼─────┐       ┌─────▼──────┐
    │   Blue     │       │   Green    │
    │ (Current)  │       │   (New)    │
    │ v1.2.0     │       │  v1.3.0    │
    └────────────┘       └────────────┘

Step 1: Deploy to Green (new version)
Step 2: Run health checks on Green
Step 3: Switch load balancer to Green
Step 4: Monitor for issues
Step 5: If OK, keep Blue as rollback; if issues, switch back to Blue
```

### Production Deployment Steps

```bash
# 1. Build production Docker image
docker build -t ridendine-api:v1.3.0 -f services/api/Dockerfile .

# 2. Tag with version and latest
docker tag ridendine-api:v1.3.0 123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:v1.3.0
docker tag ridendine-api:v1.3.0 123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:latest

# 3. Push to production registry
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:v1.3.0
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:latest

# 4. Update ECS service (blue-green)
aws ecs update-service \
  --cluster ridendine-production \
  --service api-green \
  --task-definition ridendine-api:v1.3.0 \
  --desired-count 4 \
  --force-new-deployment

# 5. Wait for new tasks to be healthy
aws ecs wait services-stable --cluster ridendine-production --services api-green

# 6. Run production smoke tests
npm run test:smoke -- --url=https://api-green.internal.ridendine.com

# 7. Switch load balancer to Green
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/ridendine-prod-alb/xxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/ridendine-api-green/yyy

# 8. Monitor for 15 minutes
# Watch CloudWatch dashboards, error rates, response times

# 9. If successful, scale down Blue
aws ecs update-service \
  --cluster ridendine-production \
  --service api-blue \
  --desired-count 1

# Keep Blue running at 1 replica for quick rollback if needed
```

### Zero-Downtime Deployment Verification

```bash
# Monitor deployment in real-time
watch -n 2 'aws ecs describe-services --cluster ridendine-production --services api-green | jq ".services[0].deployments"'

# Check error rates
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name 5xxErrors \
  --dimensions Name=ServiceName,Value=api-green \
  --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Test production endpoint
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://api.ridendine.com/health
done | sort | uniq -c
# Expected: 100 responses with 200
```

---

## Database Migrations

### Migration Best Practices

1. **Always test migrations in staging first**
2. **Create backward-compatible migrations**
3. **Use transactions for data migrations**
4. **Have a rollback plan**
5. **Run during low-traffic periods**
6. **Monitor query performance**

### Migration Files Structure

```
database/migrations/
├── 001_initial_schema.sql
├── 002_add_users_table.sql
├── 003_add_chefs_table.sql
├── 004_add_orders_table.sql
├── 005_add_drivers_table.sql
├── 006_add_indexes.sql
├── 007_add_reviews_table.sql
├── 008_add_payments_table.sql
├── 009_add_audit_logging.sql
└── 010_add_geospatial_indexes.sql
```

### Running Migrations in Production

```bash
# 1. Backup database first
aws rds create-db-snapshot \
  --db-instance-identifier ridendine-production-db \
  --db-snapshot-identifier ridendine-prod-$(date +%Y%m%d-%H%M%S)

# 2. Connect to production database (via bastion)
ssh -L 5432:ridendine-prod-db.xxx.us-east-1.rds.amazonaws.com:5432 bastion-user@bastion.ridendine.com

# 3. Test migration on staging copy first
# (Always test on a production snapshot restored to staging)

# 4. Run migration with connection pooling disabled temporarily
DATABASE_URL="postgresql://ridendine:PASSWORD@localhost:5432/ridendine" \
MAX_POOL_SIZE=1 \
npm run db:migrate

# 5. Verify migration
psql "postgresql://ridendine:PASSWORD@localhost:5432/ridendine" <<EOF
SELECT version, name, applied_at
FROM schema_migrations
ORDER BY version DESC
LIMIT 5;
EOF

# 6. Run validation queries
psql "postgresql://ridendine:PASSWORD@localhost:5432/ridendine" <<EOF
-- Check row counts
SELECT 'users' as table, COUNT(*) FROM users
UNION ALL
SELECT 'chefs', COUNT(*) FROM chefs
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;

-- Check indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
EOF
```

### Backward-Compatible Migration Example

```sql
-- Migration 011: Add email_verified column to users table
-- This is backward-compatible: new column with default value

BEGIN;

-- Add column with default (safe to run with app still running)
ALTER TABLE users
ADD COLUMN email_verified BOOLEAN DEFAULT false NOT NULL;

-- Backfill existing users (in small batches to avoid long locks)
DO $$
DECLARE
  batch_size INT := 1000;
  total_rows INT;
  processed INT := 0;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM users WHERE email_verified IS NULL;
  RAISE NOTICE 'Backfilling % rows', total_rows;

  WHILE processed < total_rows LOOP
    UPDATE users
    SET email_verified = true
    WHERE id IN (
      SELECT id FROM users
      WHERE email_verified IS NULL
      LIMIT batch_size
    );

    processed := processed + batch_size;
    RAISE NOTICE 'Processed % / % rows', processed, total_rows;

    -- Sleep 1 second between batches to reduce load
    PERFORM pg_sleep(1);
  END LOOP;
END $$;

-- Add index
CREATE INDEX CONCURRENTLY idx_users_email_verified
ON users(email_verified)
WHERE email_verified = false;

-- Record migration
INSERT INTO schema_migrations (version, name, applied_at)
VALUES (11, 'add_email_verified_to_users', NOW());

COMMIT;
```

### Rollback Migration Example

```sql
-- Rollback 011: Remove email_verified column
BEGIN;

-- Drop index
DROP INDEX IF EXISTS idx_users_email_verified;

-- Remove column
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

-- Remove migration record
DELETE FROM schema_migrations WHERE version = 11;

COMMIT;
```

---

## Secrets Management

### AWS Secrets Manager

```bash
# Create secret for database URL
aws secretsmanager create-secret \
  --name ridendine/production/database-url \
  --secret-string "postgresql://ridendine:SECURE_PASSWORD@ridendine-prod-db.xxx.rds.amazonaws.com:5432/ridendine"

# Create secret for JWT
aws secretsmanager create-secret \
  --name ridendine/production/jwt-secret \
  --secret-string "$(openssl rand -base64 64)"

# Create secret for Stripe
aws secretsmanager create-secret \
  --name ridendine/production/stripe-secret-key \
  --secret-string "sk_live_xxxxxxxxxxxxxxxx"

# Create secret for refresh token
aws secretsmanager create-secret \
  --name ridendine/production/refresh-token-secret \
  --secret-string "$(openssl rand -base64 64)"

# Retrieve secret (for local testing)
aws secretsmanager get-secret-value \
  --secret-id ridendine/production/database-url \
  --query SecretString \
  --output text
```

### Kubernetes Secrets

```bash
# Create namespace
kubectl create namespace ridendine

# Create secrets from literals
kubectl create secret generic ridendine-secrets \
  --from-literal=jwt-secret="$(openssl rand -base64 64)" \
  --from-literal=refresh-token-secret="$(openssl rand -base64 64)" \
  --from-literal=stripe-secret-key="sk_live_xxxxxxxx" \
  --from-literal=database-url="postgresql://..." \
  --namespace=ridendine

# Create secrets from files
kubectl create secret generic ridendine-config \
  --from-file=.env=.env.production \
  --namespace=ridendine

# View secrets (base64 encoded)
kubectl get secret ridendine-secrets -o yaml -n ridendine

# Decode secret value
kubectl get secret ridendine-secrets -o jsonpath='{.data.jwt-secret}' -n ridendine | base64 -d
```

### Environment Variables in ECS

```json
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ridendine/production/database-url"
    },
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ridendine/production/jwt-secret"
    },
    {
      "name": "STRIPE_SECRET_KEY",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ridendine/production/stripe-secret-key"
    }
  ]
}
```

---

## Environment Configuration

### .env.production Example

```bash
# Application
NODE_ENV=production
API_PORT=9001
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://ridendine:PASSWORD@prod-db.xxx.rds.amazonaws.com:5432/ridendine
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# Redis
REDIS_URL=redis://prod-redis.xxx.cache.amazonaws.com:6379
REDIS_TLS=true

# JWT
JWT_SECRET=<from-secrets-manager>
JWT_EXPIRATION=15m
REFRESH_TOKEN_SECRET=<from-secrets-manager>
REFRESH_TOKEN_EXPIRATION=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
STRIPE_CONNECT_CLIENT_ID=ca_xxxxxxxx

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxx

# Mapbox
MAPBOX_TOKEN=pk.eyxxxxxxxxxxxxxxxx

# CORS
CUSTOMER_WEB_URL=https://ridendine.com
CHEF_DASHBOARD_URL=https://chef.ridendine.com
ADMIN_PANEL_URL=https://admin.ridendine.com

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
DATADOG_API_KEY=xxxxxxxxxxxxxxxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Environment Variable Validation

```typescript
// src/config/env.validation.ts
import { plainToClass } from 'class-transformer';
import { IsString, IsNumber, IsUrl, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  NODE_ENV: string;

  @IsNumber()
  API_PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  STRIPE_SECRET_KEY: string;

  @IsUrl()
  CUSTOMER_WEB_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
```

---

## Docker Deployment

### Multi-Stage Dockerfile (Optimized)

```dockerfile
# services/api/Dockerfile
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/api/package*.json ./services/api/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY services/api ./services/api
COPY tsconfig.json ./

# Build TypeScript
RUN cd services/api && npm run build

# Production stage
FROM node:18-alpine

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/services/api/package.json ./

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 9001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
```

### Docker Compose Production

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  api:
    image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:latest
    ports:
      - '9001:9001'
    environment:
      - NODE_ENV=production
      - API_PORT=9001
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9001/health']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 1024M
        reservations:
          cpus: '0.5'
          memory: 512M

  postgres:
    image: postgis/postgis:16-3.4
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=ridendine
      - POSTGRES_USER=ridendine
      - POSTGRES_PASSWORD=${DATABASE_PASSWORD}
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ridendine']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

---

## Kubernetes Deployment

### Namespace & ResourceQuota

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ridendine
  labels:
    name: ridendine
    environment: production

---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ridendine-quota
  namespace: ridendine
spec:
  hard:
    requests.cpu: '10'
    requests.memory: 20Gi
    limits.cpu: '20'
    limits.memory: 40Gi
    persistentvolumeclaims: '10'
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ridendine-config
  namespace: ridendine
data:
  NODE_ENV: 'production'
  API_PORT: '9001'
  LOG_LEVEL: 'info'
  CUSTOMER_WEB_URL: 'https://ridendine.com'
  CHEF_DASHBOARD_URL: 'https://chef.ridendine.com'
  ADMIN_PANEL_URL: 'https://admin.ridendine.com'
```

### API Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: ridendine
  labels:
    app: api
    version: v1.3.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
        version: v1.3.0
    spec:
      containers:
        - name: api
          image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:v1.3.0
          imagePullPolicy: Always
          ports:
            - containerPort: 9001
              name: http
              protocol: TCP
          envFrom:
            - configMapRef:
                name: ridendine-config
            - secretRef:
                name: ridendine-secrets
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi
          livenessProbe:
            httpGet:
              path: /health
              port: 9001
            initialDelaySeconds: 60
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: 9001
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          lifecycle:
            preStop:
              exec:
                command: ['/bin/sh', '-c', 'sleep 15']
      terminationGracePeriodSeconds: 30
```

### Service & Ingress

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: ridendine
  labels:
    app: api
spec:
  type: ClusterIP
  ports:
    - port: 9001
      targetPort: 9001
      protocol: TCP
      name: http
  selector:
    app: api

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ridendine
  namespace: ridendine
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/rate-limit: '100'
spec:
  tls:
    - hosts:
        - api.ridendine.com
      secretName: ridendine-tls
  rules:
    - host: api.ridendine.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 9001
```

### Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml  # Created from template
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployment
kubectl get pods -n ridendine
kubectl get svc -n ridendine
kubectl get ingress -n ridendine

# Check rollout status
kubectl rollout status deployment/api -n ridendine

# View logs
kubectl logs -f deployment/api -n ridendine
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: ridendine-api
  ECS_CLUSTER: ridendine-production
  ECS_SERVICE: api

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Run E2E tests
        run: npm run test:e2e

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.build-image.outputs.image }}
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -f services/api/Dockerfile .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service ${{ env.ECS_SERVICE }} \
            --force-new-deployment

      - name: Wait for deployment to stabilize
        run: |
          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE }}

  smoke-test:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run smoke tests
        run: |
          npm ci
          npm run test:smoke -- --url=https://api.ridendine.com

      - name: Notify deployment success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "✅ Production deployment successful! Version: ${{ github.sha }}"
            }

      - name: Notify deployment failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "❌ Production deployment failed! Version: ${{ github.sha }}"
            }
```

---

## Health Checks & Monitoring

### Health Check Endpoints

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  RedisHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }

  @Get('liveness')
  liveness() {
    // Simple liveness check (is process running?)
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    // Readiness check (can handle traffic?)
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1000 }),
      () => this.redis.pingCheck('redis', { timeout: 1000 }),
    ]);
  }
}
```

### CloudWatch Alarms

```bash
# Create alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name ridendine-api-high-error-rate \
  --alarm-description "Alert when API error rate exceeds 5%" \
  --metric-name 5xxErrors \
  --namespace AWS/ECS \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=api \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:ridendine-alerts

# Create alarm for high CPU usage
aws cloudwatch put-metric-alarm \
  --alarm-name ridendine-api-high-cpu \
  --alarm-description "Alert when CPU utilization exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=api \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:ridendine-alerts
```

---

## Rollback Procedures

### ECS Rollback

```bash
# List recent task definitions
aws ecs list-task-definitions --family-prefix ridendine-api | jq '.taskDefinitionArns[-5:]'

# Rollback to previous version
aws ecs update-service \
  --cluster ridendine-production \
  --service api \
  --task-definition ridendine-api:42 \
  --force-new-deployment

# Monitor rollback
aws ecs wait services-stable --cluster ridendine-production --services api
```

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/api -n ridendine

# Rollback to previous version
kubectl rollout undo deployment/api -n ridendine

# Rollback to specific revision
kubectl rollout undo deployment/api --to-revision=3 -n ridendine

# Check rollback status
kubectl rollout status deployment/api -n ridendine
```

### Database Rollback

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ridendine-prod-restored \
  --db-snapshot-identifier ridendine-prod-20260131-120000

# Point application to restored instance
# Update DATABASE_URL in secrets manager
```

---

## Scaling & Performance

### Horizontal Pod Autoscaling (Kubernetes)

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: ridendine
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
```

### Database Connection Pooling

```typescript
// src/config/database.config.ts
export const databaseConfig = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  // Connection pooling
  extra: {
    max: 20, // Maximum connections
    min: 5, // Minimum connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Connection timeout
  },

  // Performance optimizations
  logging: process.env.NODE_ENV === 'development',
  synchronize: false,
  migrationsRun: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
```

---

## Security Considerations

### Security Checklist

- [ ] HTTPS enforced (TLS 1.2+)
- [ ] Secrets stored in AWS Secrets Manager / K8s Secrets
- [ ] Database connections use SSL
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Helmet security headers applied
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection enabled
- [ ] Input validation on all endpoints
- [ ] JWT tokens with expiration
- [ ] Regular security updates applied
- [ ] Audit logging enabled
- [ ] DDoS protection (CloudFlare / AWS Shield)

### Network Security

```bash
# Security group for API (AWS)
aws ec2 create-security-group \
  --group-name ridendine-api-sg \
  --description "Security group for RideNDine API" \
  --vpc-id vpc-xxx

# Allow HTTPS from ALB only
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 9001 \
  --source-group sg-alb-xxx

# Security group for database
aws ec2 authorize-security-group-ingress \
  --group-id sg-db-xxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-api-xxx
```

---

## Disaster Recovery

### Backup Strategy

```bash
# Automated daily database backups
aws rds modify-db-instance \
  --db-instance-identifier ridendine-production-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"

# Manual snapshot before major changes
aws rds create-db-snapshot \
  --db-instance-identifier ridendine-production-db \
  --db-snapshot-identifier ridendine-prod-manual-$(date +%Y%m%d-%H%M%S)

# Copy snapshots to another region
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-east-1:123456789012:snapshot:ridendine-prod-20260131 \
  --target-db-snapshot-identifier ridendine-prod-20260131-copy \
  --region us-west-2
```

### Recovery Time Objective (RTO) & Recovery Point Objective (RPO)

| Service       | RTO          | RPO         | Strategy                                    |
| ------------- | ------------ | ----------- | ------------------------------------------- |
| API Service   | < 5 minutes  | N/A         | Blue-green deployment with instant rollback |
| Database      | < 30 minutes | < 5 minutes | Automated backups + point-in-time restore   |
| Redis         | < 1 minute   | < 5 minutes | AOF persistence + replica failover          |
| Static Assets | < 1 minute   | N/A         | CloudFront CDN with multi-region origin     |

---

## Support & Troubleshooting

### Deployment Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common deployment issues and solutions.

### Useful Commands

```bash
# Check service health
curl https://api.ridendine.com/health

# View recent logs (AWS)
aws logs tail /ecs/ridendine-production --follow

# View recent logs (Kubernetes)
kubectl logs -f deployment/api -n ridendine --tail=100

# Connect to database (via bastion)
ssh -L 5432:prod-db.xxx.rds.amazonaws.com:5432 bastion@bastion.ridendine.com
psql -h localhost -U ridendine -d ridendine

# Check deployment status (ECS)
aws ecs describe-services --cluster ridendine-production --services api

# Check deployment status (Kubernetes)
kubectl get pods -n ridendine -w
```

---

## Next Steps

- Review [RUNBOOK_SERVICE_RESTART.md](./RUNBOOK_SERVICE_RESTART.md) for graceful restarts
- Review [RUNBOOK_DATABASE_RECOVERY.md](./RUNBOOK_DATABASE_RECOVERY.md) for disaster recovery
- Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Set up monitoring dashboards (CloudWatch, Datadog, Grafana)
- Configure alerts and on-call rotation

---

**Last Updated:** 2026-01-31
**Maintained By:** DevOps Team
**Version:** 1.0.0
