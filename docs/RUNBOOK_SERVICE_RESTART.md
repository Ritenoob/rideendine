# Runbook: Service Restart

Procedures for gracefully restarting RideNDine services without dropping requests or causing downtime.

**Last Updated:** 2026-01-31
**Severity:** Medium
**Estimated Time:** 5-15 minutes
**Required Access:** kubectl/docker-compose, monitoring dashboard

---

## Objective

Gracefully restart services (API, database, Redis) without impacting active users or dropping requests.

---

## Prerequisites

- [ ] kubectl/docker access configured
- [ ] Monitoring dashboard open (CloudWatch/Grafana)
- [ ] At least 2 replicas running (for production)
- [ ] Off-peak hours (if possible)
- [ ] Recent backup verified
- [ ] Stakeholders notified (if production)

---

## API Service Restart

### Docker Compose Environment

**Step 1: Check current status**

```bash
docker-compose ps api
# Should show: Up, healthy
```

**Step 2: Check active connections**

```bash
# View recent access logs
docker-compose logs --tail=50 api

# Count active requests (if logging enabled)
docker-compose logs api | grep -c "GET\|POST\|PUT\|PATCH\|DELETE"
```

**Step 3: Graceful restart**

```bash
# Restart API with zero downtime (if multiple replicas)
docker-compose up -d --no-deps --scale api=2 api
sleep 10  # Wait for new instance to be healthy
docker-compose restart api

# Or simple restart (brief downtime)
docker-compose restart api
```

**Step 4: Verify restart**

```bash
# Check health
curl http://localhost:9001/health
# Expected: {"status":"ok","timestamp":"..."}

# Check logs for errors
docker-compose logs --tail=20 api | grep -i error

# Verify database connection
curl http://localhost:9001/health/db

# Verify Redis connection
curl http://localhost:9001/health/redis
```

**Step 5: Monitor for 5 minutes**

```bash
# Watch logs
docker-compose logs -f api

# Monitor response times
for i in {1..10}; do
  curl -w "Response time: %{time_total}s\n" -o /dev/null -s http://localhost:9001/health
  sleep 2
done
```

---

### Kubernetes Environment

**Step 1: Check current status**

```bash
kubectl get pods -n ridendine -l app=api
# Should show all replicas Running (2/2 or 3/3)

kubectl get deployment api -n ridendine
# Should show: READY 3/3, UP-TO-DATE 3, AVAILABLE 3
```

**Step 2: Check service health**

```bash
# Check pod health
kubectl get pods -n ridendine -l app=api -o json | jq '.items[] | {name:.metadata.name, ready:.status.conditions[] | select(.type=="Ready") | .status}'

# Check recent events
kubectl get events -n ridendine --sort-by='.lastTimestamp' | grep api | tail -10
```

**Step 3: Rolling restart**

```bash
# Method 1: Rolling restart (zero downtime)
kubectl rollout restart deployment/api -n ridendine

# Method 2: Update with new image (if deploying new version)
kubectl set image deployment/api api=123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:v1.3.0 -n ridendine

# Watch rollout progress
kubectl rollout status deployment/api -n ridendine
# Expected: deployment "api" successfully rolled out
```

**Step 4: Monitor rollout**

```bash
# Watch pods being replaced
watch -n 2 'kubectl get pods -n ridendine -l app=api'

# Check rollout history
kubectl rollout history deployment/api -n ridendine

# View new pod logs
NEW_POD=$(kubectl get pods -n ridendine -l app=api --sort-by=.metadata.creationTimestamp | tail -1 | awk '{print $1}')
kubectl logs -f $NEW_POD -n ridendine
```

**Step 5: Verify functionality**

```bash
# Get service endpoint
SERVICE_IP=$(kubectl get svc api -n ridendine -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test health endpoint
curl http://$SERVICE_IP:9001/health

# Run smoke tests
npm run test:smoke -- --url=http://$SERVICE_IP:9001

# Check error rates in monitoring dashboard
# CloudWatch Metrics: 4xxErrors, 5xxErrors
# Expected: No spike in errors
```

---

### ECS Environment

**Step 1: Check service status**

```bash
aws ecs describe-services \
  --cluster ridendine-production \
  --services api \
  --query 'services[0].{desired:desiredCount,running:runningCount,pending:pendingCount}'

# Should show: desired=running, pending=0
```

**Step 2: Trigger rolling update**

```bash
# Force new deployment
aws ecs update-service \
  --cluster ridendine-production \
  --service api \
  --force-new-deployment

# Or update to specific task definition
aws ecs update-service \
  --cluster ridendine-production \
  --service api \
  --task-definition ridendine-api:42
```

**Step 3: Monitor deployment**

```bash
# Wait for deployment to stabilize
aws ecs wait services-stable \
  --cluster ridendine-production \
  --services api

# Watch task status
watch -n 5 'aws ecs describe-services --cluster ridendine-production --services api | jq ".services[0].deployments"'

# Expected: 2 deployments initially (old and new)
#           Then: 1 deployment (new only)
```

**Step 4: Verify health**

```bash
# Get load balancer DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names ridendine-prod-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Test endpoint
curl https://$ALB_DNS/health

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name HealthyHostCount \
  --dimensions Name=TargetGroup,Value=ridendine-api-tg \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

---

## Database Restart

**⚠️ WARNING:** Database restarts will drop active connections. Plan for maintenance window.

### Docker Compose

**Step 1: Prepare**

```bash
# Notify all services
echo "Database restart in 5 minutes" | wall

# Gracefully stop API to prevent new connections
docker-compose stop api
```

**Step 2: Backup first**

```bash
# Create backup before restart
docker-compose exec postgres pg_dump -U ridendine ridendine > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup file
ls -lh backup-*.sql
```

**Step 3: Restart PostgreSQL**

```bash
# Restart database
docker-compose restart postgres

# Wait for database to be ready
until docker-compose exec postgres pg_isready -U ridendine; do
  echo "Waiting for database..."
  sleep 2
done

echo "Database is ready"
```

**Step 4: Verify**

```bash
# Test connection
docker-compose exec postgres psql -U ridendine -d ridendine -c "SELECT 1;"

# Check active connections
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
"

# Verify replication (if configured)
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT * FROM pg_stat_replication;
"
```

**Step 5: Restart API**

```bash
docker-compose start api

# Wait for API to be healthy
until curl -f http://localhost:9001/health > /dev/null 2>&1; do
  echo "Waiting for API..."
  sleep 2
done

echo "API is healthy"
```

---

### RDS (AWS)

**Step 1: Create snapshot**

```bash
aws rds create-db-snapshot \
  --db-instance-identifier ridendine-production-db \
  --db-snapshot-identifier ridendine-prod-restart-$(date +%Y%m%d-%H%M%S)

# Wait for snapshot to complete
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier ridendine-prod-restart-$(date +%Y%m%d-%H%M%S)
```

**Step 2: Reboot database**

```bash
# Reboot RDS instance
aws rds reboot-db-instance \
  --db-instance-identifier ridendine-production-db

# Wait for reboot to complete
aws rds wait db-instance-available \
  --db-instance-identifier ridendine-production-db

echo "Database is available"
```

**Step 3: Verify connections**

```bash
# Connect via bastion host
ssh -L 5432:ridendine-prod-db.xxx.rds.amazonaws.com:5432 bastion@bastion.ridendine.com

# In another terminal
psql -h localhost -U ridendine -d ridendine -c "SELECT 1;"

# Check active connections
psql -h localhost -U ridendine -d ridendine -c "
  SELECT count(*) as connections
  FROM pg_stat_activity
  WHERE datname = 'ridendine';
"
```

---

## Redis Restart

### Docker Compose

**Step 1: Check cache impact**

```bash
# Redis is cache layer - restart is safe but will clear cache
echo "⚠️  Cache will be cleared. Performance may be impacted briefly."

# Check current memory usage
docker-compose exec redis redis-cli INFO memory | grep used_memory_human
```

**Step 2: Restart Redis**

```bash
# Restart Redis
docker-compose restart redis

# Wait for Redis to be ready
until docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
  echo "Waiting for Redis..."
  sleep 1
done

echo "Redis is ready"
```

**Step 3: Verify**

```bash
# Test connection
docker-compose exec redis redis-cli ping
# Expected: PONG

# Check info
docker-compose exec redis redis-cli INFO server

# Verify API can connect
curl http://localhost:9001/health/redis
```

---

### ElastiCache (AWS)

**Step 1: Reboot cluster**

```bash
# List cache cluster IDs
aws elasticache describe-cache-clusters \
  --query 'CacheClusters[?starts_with(CacheClusterId, `ridendine`)].CacheClusterId'

# Reboot primary node
aws elasticache reboot-cache-cluster \
  --cache-cluster-id ridendine-production-redis-001

# Wait for reboot
watch -n 10 'aws elasticache describe-cache-clusters --cache-cluster-id ridendine-production-redis-001 | jq ".CacheClusters[0].CacheClusterStatus"'
# Wait until status is "available"
```

**Step 2: Verify failover (if replica exists)**

```bash
# Check replication status
aws elasticache describe-replication-groups \
  --replication-group-id ridendine-production-redis

# Expected: Status = "available", AutomaticFailover = "enabled"
```

---

## Success Criteria

After restart, verify:

- [ ] All pods/containers in Running/healthy state
- [ ] Health endpoints return 200 OK
- [ ] No spike in error rates (< 0.1%)
- [ ] Response times normal (< 500ms)
- [ ] Database connections stable
- [ ] Redis cache operational
- [ ] No alerts triggered
- [ ] Application logs show no errors

---

## Rollback Plan

If issues occur after restart:

**Kubernetes:**

```bash
# Rollback to previous version
kubectl rollout undo deployment/api -n ridendine
kubectl rollout status deployment/api -n ridendine
```

**ECS:**

```bash
# Update to previous task definition
aws ecs update-service \
  --cluster ridendine-production \
  --service api \
  --task-definition ridendine-api:41
```

**Docker Compose:**

```bash
# Stop new version
docker-compose stop api

# Restore from backup (if database issue)
docker-compose exec postgres psql -U ridendine ridendine < backup-20260131-120000.sql

# Restart with old version
docker-compose up -d api
```

---

## Post-Restart Checklist

- [ ] Monitor for 15 minutes
- [ ] Check error logs
- [ ] Verify monitoring dashboards
- [ ] Update change log
- [ ] Notify stakeholders of completion
- [ ] Document any issues encountered

---

## Common Issues

### API won't start after restart

**Cause:** Environment variables not set

**Solution:**

```bash
# Check environment
docker-compose exec api env | grep -E "(DATABASE|REDIS|JWT)"

# Verify secrets (Kubernetes)
kubectl get secret ridendine-secrets -n ridendine -o yaml
```

### Database connections failed

**Cause:** Database not ready

**Solution:**

```bash
# Wait for database
until docker-compose exec postgres pg_isready -U ridendine; do
  sleep 2
done

# Then restart API
docker-compose restart api
```

### High memory after restart

**Cause:** Connection pool not closed properly

**Solution:**

```bash
# Restart API to reset connection pool
docker-compose restart api

# Check connections
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT count(*) FROM pg_stat_activity;
"
```

---

## Contact

- **On-call Engineer:** Slack #ridendine-ops
- **Escalation:** CTO / VP Engineering
- **Urgent Issues:** +1-555-555-5555 (PagerDuty)

---

**Last Updated:** 2026-01-31
**Maintained By:** DevOps Team
**Review Frequency:** Quarterly
