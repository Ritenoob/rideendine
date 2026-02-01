# RideNDine Deployment Guide

This guide covers deployment procedures for RideNDine across all environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Overview](#environment-overview)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Required Tools

- **Docker** (v24.0+)
- **Docker Compose** (v2.20+)
- **Node.js** (v20.x)
- **npm** (v10.x)
- **kubectl** (v1.25+) - for Kubernetes deployments
- **Git** (v2.40+)

### Access Requirements

- **Development:** None (local only)
- **Staging:** GitHub Actions, staging cluster access
- **Production:** Production GitHub environment approval, production cluster access

### Secrets Configuration

Ensure all secrets are configured before deployment. See [Secrets Management](../secrets/README.md).

## Environment Overview

| Environment | URL | Purpose | Auto-Deploy |
|-------------|-----|---------|-------------|
| **Development** | localhost:9001 | Local development | No |
| **Staging** | staging-api.ridendine.com | Pre-production testing | Yes (on push to `develop`) |
| **Production** | api.ridendine.com | Live production | Yes (on push to `main`, with approval) |

## Local Development

### Option 1: Docker Compose (Recommended)

**Full stack with all services:**

```bash
# 1. Clone repository
git clone https://github.com/your-org/ridendine.git
cd ridendine

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your secrets

# 4. Start database
npm run db:up
sleep 10  # Wait for database to be ready

# 5. Run migrations
npm run db:migrate

# 6. Seed test data
npm run db:seed

# 7. Build all services
npm run docker:build

# 8. Start all services
npm run docker:up

# 9. Verify services are running
docker-compose ps
curl http://localhost:9001/health
curl http://localhost:9002/health
curl http://localhost:9003/health
curl http://localhost:9004/health

# 10. View logs
npm run docker:logs
```

**Individual service for development:**

```bash
# Start only databases
npm run db:up

# Run API in watch mode
npm run dev:api

# In separate terminals
npm run dev:dispatch
npm run dev:routing
npm run dev:realtime
```

### Option 2: Core Demo (Quick Test)

```bash
# Start the all-in-one demo server
node ridendine_v2_live_routing/server.js

# Open demo UI
xdg-open ridendine_v2_live_routing/index.html
```

## Docker Deployment

### Build Images

```bash
# Build all services from scratch
npm run docker:build:nocache

# Or individual services
docker build -t ridendine-api:latest ./services/api
docker build -t ridendine-dispatch:latest ./services/dispatch
docker build -t ridendine-routing:latest ./services/routing
docker build -t ridendine-realtime:latest ./services/realtime
```

### Tag for Registry

```bash
# Replace with your registry
REGISTRY="gcr.io/your-project"
VERSION="v1.2.3"

docker tag ridendine-api:latest $REGISTRY/ridendine-api:$VERSION
docker tag ridendine-dispatch:latest $REGISTRY/ridendine-dispatch:$VERSION
docker tag ridendine-routing:latest $REGISTRY/ridendine-routing:$VERSION
docker tag ridendine-realtime:latest $REGISTRY/ridendine-realtime:$VERSION

# Tag as latest
docker tag ridendine-api:latest $REGISTRY/ridendine-api:latest
docker tag ridendine-dispatch:latest $REGISTRY/ridendine-dispatch:latest
docker tag ridendine-routing:latest $REGISTRY/ridendine-routing:latest
docker tag ridendine-realtime:latest $REGISTRY/ridendine-realtime:latest
```

### Push to Registry

```bash
# Authenticate with registry
# For GCR:
gcloud auth configure-docker

# For ECR:
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $REGISTRY

# For Docker Hub:
docker login

# Push images
docker push $REGISTRY/ridendine-api:$VERSION
docker push $REGISTRY/ridendine-dispatch:$VERSION
docker push $REGISTRY/ridendine-routing:$VERSION
docker push $REGISTRY/ridendine-realtime:$VERSION

docker push $REGISTRY/ridendine-api:latest
docker push $REGISTRY/ridendine-dispatch:latest
docker push $REGISTRY/ridendine-routing:latest
docker push $REGISTRY/ridendine-realtime:latest
```

## Kubernetes Deployment

See detailed guide: [k8s/README.md](../k8s/README.md)

### Quick Deploy

```bash
# 1. Set kubectl context
kubectl config use-context production-cluster

# 2. Create namespace
kubectl apply -f k8s/base/namespace.yaml

# 3. Create secrets (DO NOT use example file!)
kubectl create secret generic postgres-secret \
  --from-literal=username=ridendine \
  --from-literal=password=$DB_PASSWORD \
  -n ridendine

kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=$JWT_SECRET \
  --from-literal=refresh-token-secret=$REFRESH_SECRET \
  -n ridendine

# 4. Apply configurations
kubectl apply -f k8s/base/configmap.yaml

# 5. Deploy databases
kubectl apply -f k8s/base/postgres-deployment.yaml
kubectl apply -f k8s/base/redis-deployment.yaml

# Wait for databases
kubectl wait --for=condition=ready pod -l app=postgres -n ridendine --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n ridendine --timeout=300s

# 6. Deploy services
kubectl apply -f k8s/base/api-deployment.yaml
kubectl apply -f k8s/base/dispatch-deployment.yaml
kubectl apply -f k8s/base/routing-deployment.yaml
kubectl apply -f k8s/base/realtime-deployment.yaml

# 7. Wait for rollout
kubectl rollout status deployment/api -n ridendine
kubectl rollout status deployment/dispatch -n ridendine
kubectl rollout status deployment/routing -n ridendine
kubectl rollout status deployment/realtime -n ridendine

# 8. Apply ingress
kubectl apply -f k8s/base/ingress.yaml

# 9. Verify
kubectl get pods -n ridendine
kubectl get svc -n ridendine
kubectl get ingress -n ridendine
```

### Update Existing Deployment

```bash
# Update image version
kubectl set image deployment/api \
  api=gcr.io/your-project/ridendine-api:v1.2.3 \
  -n ridendine

# Watch rollout
kubectl rollout status deployment/api -n ridendine

# If issues, rollback
kubectl rollout undo deployment/api -n ridendine
```

## CI/CD Pipeline

### GitHub Actions Workflow

Automated deployments are configured in `.github/workflows/`.

**Staging Deploy** (on push to `develop`):
1. Run tests
2. Build Docker images
3. Push to container registry
4. Deploy to staging cluster
5. Run smoke tests

**Production Deploy** (on push to `main`):
1. Run tests
2. Build Docker images
3. Push to container registry
4. **Require manual approval**
5. Deploy to production cluster
6. Run smoke tests
7. Monitor for 10 minutes
8. Auto-rollback if health checks fail

### Manual Trigger

```bash
# Trigger deployment via GitHub CLI
gh workflow run deploy-production.yml -f environment=production -f version=v1.2.3

# Or via GitHub UI:
# Actions > Deploy to Production > Run workflow
```

## Post-Deployment Verification

### Health Checks

```bash
# API health
curl https://api.ridendine.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T12:00:00.000Z","version":"1.2.3"}

# All services
curl https://api.ridendine.com/health
curl https://api.ridendine.com/dispatch/health
curl https://api.ridendine.com/routing/health
curl https://ws.ridendine.com/health
```

### Smoke Tests

```bash
# Run automated smoke tests
npm run test:smoke -- --env=production

# Manual tests:
# 1. User login
curl -X POST https://api.ridendine.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 2. List chefs
curl https://api.ridendine.com/chefs \
  -H "Authorization: Bearer <token>"

# 3. WebSocket connection
wscat -c wss://ws.ridendine.com/?token=<token>
```

### Database Verification

```bash
# Check migration status
kubectl exec -it deployment/api -n ridendine -- npm run db:status

# Check table count
kubectl exec -it deployment/api -n ridendine -- \
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

### Monitoring Dashboard

- **Grafana:** https://monitoring.ridendine.com/d/ridendine-services
- **Prometheus:** https://prometheus.ridendine.com
- Check for:
  - All services showing "up"
  - Error rate < 1%
  - p95 response time < 500ms
  - No memory leaks (stable memory usage)

### Logs Review

```bash
# Check for errors in last 5 minutes
kubectl logs -l app=api -n ridendine --since=5m | grep -i error

# Check all service logs
kubectl logs -l component=backend -n ridendine --tail=100
```

## Rollback Procedures

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/api -n ridendine

# Rollback to previous version
kubectl rollout undo deployment/api -n ridendine

# Rollback to specific revision
kubectl rollout undo deployment/api --to-revision=5 -n ridendine

# Verify rollback
kubectl rollout status deployment/api -n ridendine
```

### Docker Compose Rollback

```bash
# Stop current version
docker-compose down

# Checkout previous version
git checkout v1.2.2  # or previous tag

# Rebuild and start
docker-compose build
docker-compose up -d

# Verify
curl http://localhost:9001/health
```

### Database Rollback

**WARNING: Database rollbacks are dangerous!**

```bash
# 1. Stop all services to prevent writes
kubectl scale deployment/api --replicas=0 -n ridendine
kubectl scale deployment/dispatch --replicas=0 -n ridendine

# 2. Restore from backup
npm run db:restore -- backups/ridendine_20240115_120000.sql

# 3. Restart services
kubectl scale deployment/api --replicas=3 -n ridendine
kubectl scale deployment/dispatch --replicas=2 -n ridendine
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing in CI
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Secrets updated (if changed)
- [ ] Backup created
- [ ] Change notification sent
- [ ] Rollback plan documented
- [ ] Monitoring dashboard open

### During Deployment

- [ ] Deploy during low-traffic window (if possible)
- [ ] Monitor deployment progress
- [ ] Watch error rates
- [ ] Check application logs
- [ ] Verify health checks

### Post-Deployment

- [ ] All services healthy
- [ ] Smoke tests passed
- [ ] Monitoring shows normal metrics
- [ ] No increase in error rate
- [ ] Database migrations applied
- [ ] Customer verification (if critical change)
- [ ] Update deployment log
- [ ] Notify team of completion

## Troubleshooting

### Deployment Stuck

```bash
# Check pod status
kubectl get pods -n ridendine

# Describe failing pod
kubectl describe pod <pod-name> -n ridendine

# Check logs
kubectl logs <pod-name> -n ridendine

# Common issues:
# - Image pull errors: Check registry authentication
# - CrashLoopBackOff: Check application logs
# - Pending: Check resource quotas
```

### Health Check Failing

```bash
# Test health endpoint from inside cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://api:9001/health

# Check service endpoints
kubectl get endpoints -n ridendine

# If no endpoints: pods not ready
# If endpoints exist: service configuration issue
```

### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it deployment/api -n ridendine -- \
  psql $DATABASE_URL -c "SELECT 1"

# Check database pod
kubectl logs -l app=postgres -n ridendine

# Verify secret
kubectl get secret postgres-secret -n ridendine -o yaml
```

## Emergency Procedures

### Complete Rollback

```bash
# 1. Immediate rollback of all services
kubectl rollout undo deployment/api -n ridendine
kubectl rollout undo deployment/dispatch -n ridendine
kubectl rollout undo deployment/routing -n ridendine
kubectl rollout undo deployment/realtime -n ridendine

# 2. Monitor rollback
watch kubectl get pods -n ridendine

# 3. Verify old version working
curl https://api.ridendine.com/health
```

### Service Degradation

```bash
# Scale up replicas for more capacity
kubectl scale deployment/api --replicas=10 -n ridendine

# Or enable emergency HPA settings
kubectl autoscale deployment/api --min=5 --max=20 --cpu-percent=50 -n ridendine
```

## Support Contacts

- **DevOps Lead:** devops@ridendine.com
- **On-Call Engineer:** Use PagerDuty
- **Emergency Hotline:** +1-XXX-XXX-XXXX

## Additional Resources

- [Kubernetes Deployment Guide](../k8s/README.md)
- [Secrets Management](../secrets/README.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Runbooks](./runbooks/)
