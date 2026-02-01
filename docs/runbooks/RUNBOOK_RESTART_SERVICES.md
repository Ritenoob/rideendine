# Runbook: Restart Services

**Purpose:** Gracefully restart RideNDine services with minimal downtime

**Severity:** Medium
**Estimated Time:** 5-15 minutes
**Risk Level:** Low (if procedures followed)

## When to Use This Runbook

- Services are unresponsive but infrastructure is healthy
- After configuration changes requiring restart
- Memory leak mitigation (temporary fix)
- Scheduled maintenance
- Performance degradation

## Prerequisites

- [ ] kubectl access to production cluster
- [ ] Monitoring dashboard open
- [ ] Backup recent (last 24 hours)
- [ ] Change window approved (if production)

## Kubernetes Environment

### Individual Service Restart

```bash
# 1. Identify service to restart
SERVICE_NAME="api"  # or dispatch, routing, realtime

# 2. Check current status
kubectl get pods -l app=$SERVICE_NAME -n ridendine

# 3. Perform rolling restart (zero downtime)
kubectl rollout restart deployment/$SERVICE_NAME -n ridendine

# 4. Monitor restart progress
kubectl rollout status deployment/$SERVICE_NAME -n ridendine

# 5. Verify pods are running
kubectl get pods -l app=$SERVICE_NAME -n ridendine

# 6. Check health
POD_NAME=$(kubectl get pods -l app=$SERVICE_NAME -n ridendine -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD_NAME -n ridendine -- curl -s localhost:9001/health

# 7. Watch logs for errors
kubectl logs -f -l app=$SERVICE_NAME -n ridendine --tail=50
```

### Restart All Application Services

```bash
# Restart in dependency order to minimize disruption

# 1. Restart API (most critical)
kubectl rollout restart deployment/api -n ridendine
kubectl rollout status deployment/api -n ridendine

# 2. Restart supporting services
kubectl rollout restart deployment/dispatch -n ridendine &
kubectl rollout restart deployment/routing -n ridendine &
kubectl rollout restart deployment/realtime -n ridendine &

# Wait for all to complete
wait

# 3. Verify all services
kubectl get pods -n ridendine

# 4. Check health of all services
for service in api dispatch routing realtime; do
  echo "Checking $service..."
  kubectl exec deployment/$service -n ridendine -- curl -s localhost:900X/health
done
```

### Database Restart (Use with Caution!)

**WARNING:** This will cause brief downtime!

```bash
# 1. Scale down all application services first
kubectl scale deployment/api --replicas=0 -n ridendine
kubectl scale deployment/dispatch --replicas=0 -n ridendine

# 2. Wait for graceful shutdown (30 seconds)
sleep 30

# 3. Delete PostgreSQL pod (StatefulSet will recreate)
kubectl delete pod postgres-0 -n ridendine

# 4. Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod/postgres-0 -n ridendine --timeout=120s

# 5. Verify database is accessible
kubectl exec postgres-0 -n ridendine -- pg_isready

# 6. Scale application services back up
kubectl scale deployment/api --replicas=3 -n ridendine
kubectl scale deployment/dispatch --replicas=2 -n ridendine

# 7. Verify services are healthy
kubectl get pods -n ridendine
```

### Redis Restart

```bash
# 1. Redis restart (cache data will be lost, but this is acceptable)
kubectl delete pod redis-0 -n ridendine

# 2. Wait for Redis to be ready
kubectl wait --for=condition=ready pod/redis-0 -n ridendine --timeout=60s

# 3. Verify Redis
kubectl exec redis-0 -n ridendine -- redis-cli ping
# Expected: PONG

# 4. Application services will automatically reconnect
```

## Docker Compose Environment

### Restart All Services

```bash
# 1. Graceful restart of all services
cd /path/to/ridendine
docker-compose restart

# 2. Verify all containers running
docker-compose ps

# 3. Check logs
docker-compose logs --tail=50 -f
```

### Restart Individual Service

```bash
# 1. Restart specific service
SERVICE_NAME="api"  # or dispatch, routing, realtime, postgres, redis
docker-compose restart $SERVICE_NAME

# 2. Check status
docker-compose ps $SERVICE_NAME

# 3. View logs
docker-compose logs -f $SERVICE_NAME
```

### Hard Restart (If Graceful Fails)

```bash
# 1. Stop all services
docker-compose down

# 2. Clean up (optional, removes networks)
docker-compose down --remove-orphans

# 3. Start all services
docker-compose up -d

# 4. Verify
docker-compose ps
docker-compose logs --tail=50
```

## Post-Restart Verification

### Health Checks

```bash
# Kubernetes
kubectl get pods -n ridendine
kubectl exec deployment/api -n ridendine -- curl -s localhost:9001/health

# Docker Compose
curl http://localhost:9001/health
curl http://localhost:9002/health
curl http://localhost:9003/health
curl http://localhost:9004/health
```

### Monitoring

Check Grafana dashboard:
- [ ] All services showing "up" status
- [ ] Error rate normal (< 1%)
- [ ] Response times normal (p95 < 500ms)
- [ ] Memory usage stable

### Logs Review

```bash
# Kubernetes - check for errors
kubectl logs -l app=api -n ridendine --since=5m | grep -i error

# Docker - check for errors
docker-compose logs --since 5m | grep -i error
```

### Smoke Tests

```bash
# 1. Test authentication
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 2. Test protected endpoint
curl http://localhost:9001/chefs \
  -H "Authorization: Bearer <token>"

# 3. Test WebSocket
wscat -c ws://localhost:9004/?token=<token>
```

## Rollback Procedures

If restart causes issues:

### Kubernetes

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/api -n ridendine
kubectl rollout status deployment/api -n ridendine
```

### Docker Compose

```bash
# Stop current version
docker-compose down

# Revert to previous code version
git checkout <previous-commit>

# Restart
docker-compose up -d
```

## Common Issues

### Issue: Pods in CrashLoopBackOff

**Symptoms:**
- Pods continuously restarting
- Status shows "CrashLoopBackOff"

**Resolution:**
```bash
# 1. Check logs
kubectl logs <pod-name> -n ridendine --previous

# 2. Describe pod for events
kubectl describe pod <pod-name> -n ridendine

# 3. Common causes:
#    - Database not ready: Wait for postgres-0
#    - Missing secrets: Verify secrets exist
#    - Port already in use: Check for duplicate deployments
```

### Issue: Database Connection Refused

**Symptoms:**
- Services can't connect to database
- "ECONNREFUSED" errors in logs

**Resolution:**
```bash
# 1. Verify PostgreSQL is running
kubectl get pods -l app=postgres -n ridendine

# 2. Test connection
kubectl exec -it deployment/api -n ridendine -- \
  psql postgresql://ridendine:password@postgres:5432/ridendine -c "SELECT 1"

# 3. If fails, restart PostgreSQL (see above)
```

### Issue: High Memory Usage After Restart

**Symptoms:**
- Memory usage continues to climb
- OOMKilled events

**Resolution:**
```bash
# 1. Check memory limits
kubectl describe pod <pod-name> -n ridendine | grep -A 5 "Limits"

# 2. If memory leak suspected, scale down and investigate
kubectl scale deployment/api --replicas=1 -n ridendine

# 3. Monitor memory
kubectl top pod -n ridendine

# 4. If confirmed leak, requires code fix
```

## Decision Tree

```
Service Issues?
├─ Traffic dropping?
│  ├─ Yes → Rolling restart (zero downtime)
│  └─ No → Hard restart acceptable
│
├─ Database issue?
│  ├─ Yes → Check PostgreSQL, restart if needed
│  └─ No → Restart application services
│
└─ After config change?
   └─ Rolling restart all services
```

## Success Criteria

- [ ] All pods/containers in "Running" state
- [ ] Health endpoints returning 200 OK
- [ ] No errors in recent logs
- [ ] Monitoring shows normal metrics
- [ ] Smoke tests passing
- [ ] No customer complaints

## Notification Template

```
Subject: [RideNDine] Services Restarted - [Environment]

Services restarted: [list services]
Reason: [reason for restart]
Duration: [downtime if any]
Status: Completed successfully
Verification: All health checks passing

Any issues? Contact: [on-call engineer]
```

## Escalation

If restart fails after 3 attempts:
1. Check runbook: RUNBOOK_DATABASE_RECOVERY.md
2. Contact: DevOps Lead
3. Consider rollback to previous version
4. Page on-call engineer if production

## Related Runbooks

- [Database Recovery](./RUNBOOK_DATABASE_RECOVERY.md)
- [Scaling Services](./RUNBOOK_SCALING.md)
- [Incident Response](./RUNBOOK_INCIDENT_RESPONSE.md)

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2024-01-15 | DevOps | Initial version |
