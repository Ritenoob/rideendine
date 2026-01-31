# Runbook: Performance Degradation

Procedures for diagnosing and resolving API performance issues, slow queries, and high resource usage.

**Last Updated:** 2026-01-31
**Severity:** High
**Estimated Time:** 15-60 minutes
**Required Access:** kubectl/docker, database, monitoring dashboards

---

## Objective

Identify and resolve performance bottlenecks causing slow API response times, high latency, or resource exhaustion.

---

## Detection

### Performance Indicators

| Metric              | Normal  | Warning   | Critical |
| ------------------- | ------- | --------- | -------- |
| API Response Time   | < 200ms | 200-500ms | > 500ms  |
| Database Query Time | < 50ms  | 50-200ms  | > 200ms  |
| CPU Usage           | < 50%   | 50-80%    | > 80%    |
| Memory Usage        | < 60%   | 60-85%    | > 85%    |
| Error Rate          | < 0.1%  | 0.1-1%    | > 1%     |
| Active Connections  | < 50    | 50-100    | > 100    |

### Quick Check

```bash
#!/bin/bash
# performance-check.sh

echo "=== Performance Health Check ==="

# API Response Time
echo "1. API Response Time:"
for i in {1..5}; do
  curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:9001/health
done

# Database Connections
echo -e "\n2. Database Connections:"
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT count(*) as total,
         count(*) FILTER (WHERE state = 'active') as active,
         count(*) FILTER (WHERE state = 'idle') as idle
  FROM pg_stat_activity;
"

# Resource Usage
echo -e "\n3. Container Resources:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Slow Queries
echo -e "\n4. Slow Queries (last hour):"
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT substring(query, 1, 60) as query,
         calls,
         round(mean_exec_time::numeric, 2) as avg_ms
  FROM pg_stat_statements
  WHERE mean_exec_time > 100
  ORDER BY mean_exec_time DESC
  LIMIT 5;
"
```

---

## Diagnosis

### Step 1: Identify the Bottleneck

**Check API logs for slow endpoints:**

```bash
# Find slow requests (> 1 second)
docker-compose logs api | grep "duration:" | awk '{if ($NF > 1000) print}' | tail -20

# Most hit endpoints
docker-compose logs api | grep -E "GET|POST|PUT|PATCH|DELETE" | awk '{print $5}' | sort | uniq -c | sort -rn | head -10
```

**Check database query performance:**

```bash
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT substring(query, 1, 80) as query,
         calls,
         round(total_exec_time::numeric, 2) as total_time_ms,
         round(mean_exec_time::numeric, 2) as avg_time_ms,
         round(max_exec_time::numeric, 2) as max_time_ms
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"
```

**Check resource usage:**

```bash
# CPU usage by process
docker-compose exec api top -bn1 | head -20

# Memory usage
docker-compose exec api free -m

# Disk I/O
docker-compose exec postgres iostat -x 2 5
```

---

### Step 2: Common Bottlenecks

#### Bottleneck A: Slow Database Queries

**Symptoms:**

- API response time high
- Database CPU high
- Long-running queries in `pg_stat_activity`

**Diagnosis:**

```bash
# Find slow queries currently running
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT pid,
         now() - query_start AS duration,
         substring(query, 1, 100) as query
  FROM pg_stat_activity
  WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
  ORDER BY duration DESC
  LIMIT 10;
"

# Explain slow query
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  EXPLAIN ANALYZE
  SELECT * FROM orders WHERE customer_id = 'uuid' ORDER BY created_at DESC LIMIT 10;
"
```

**Solutions:**

```bash
# Add missing index
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  CREATE INDEX CONCURRENTLY idx_orders_customer_created
  ON orders(customer_id, created_at DESC);
"

# Update table statistics
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  ANALYZE orders;
"

# Vacuum to clean up dead tuples
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  VACUUM ANALYZE orders;
"
```

---

#### Bottleneck B: N+1 Query Problem

**Symptoms:**

- Many small queries instead of few large ones
- API response time increases with result count

**Diagnosis:**

```bash
# Enable query logging
# Set LOG_LEVEL=debug in .env and restart API

# Count queries per request
docker-compose logs api | grep "Query:" | wc -l

# Look for pattern of repeated queries
docker-compose logs api | grep "Query:" | sort | uniq -c | sort -rn | head -10
```

**Solutions:**

```typescript
// Bad: N+1 queries
const orders = await orderRepository.find();
for (const order of orders) {
  const chef = await chefRepository.findOne(order.chefId); // N queries
  order.chef = chef;
}

// Good: Join or eager load
const orders = await orderRepository.find({
  relations: ['chef', 'customer', 'driver'], // 1 query with joins
});
```

---

#### Bottleneck C: High Memory Usage

**Symptoms:**

- API container using > 1GB RAM
- Out of memory errors
- Container restarts

**Diagnosis:**

```bash
# Check memory usage
docker stats --no-stream

# Identify large objects
docker-compose exec api node -e "console.log(process.memoryUsage())"

# Check for memory leaks
docker-compose exec api node --expose-gc --inspect=0.0.0.0:9229 dist/main.js
# Then use Chrome DevTools: chrome://inspect
```

**Solutions:**

```bash
# Limit container memory
# Edit docker-compose.yml:
services:
  api:
    mem_limit: 1g
    mem_reservation: 512m

# Restart API to clear memory
docker-compose restart api

# Increase Node.js heap size (if needed)
# Add to docker-compose.yml:
environment:
  - NODE_OPTIONS=--max-old-space-size=2048

# Review code for memory leaks
# - Ensure event listeners are removed
# - Close database connections
# - Clear large arrays/objects
```

---

#### Bottleneck D: Connection Pool Exhausted

**Symptoms:**

- "Connection pool exhausted" errors
- API hangs on database queries
- High number of idle connections

**Diagnosis:**

```bash
# Check connection pool
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle,
    count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
    count(*) as total
  FROM pg_stat_activity
  WHERE usename = 'ridendine';
"

# Find long idle transactions
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT pid, state, now() - state_change as duration
  FROM pg_stat_activity
  WHERE state = 'idle in transaction'
  AND now() - state_change > interval '5 minutes';
"
```

**Solutions:**

```typescript
// Increase pool size in database config
// services/api/src/config/database.config.ts
extra: {
  max: 20,  // Increase from 10 to 20
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}

// Kill idle transactions
// docker-compose exec postgres psql -U ridendine -d ridendine -c "
//   SELECT pg_terminate_backend(pid)
//   FROM pg_stat_activity
//   WHERE state = 'idle in transaction'
//   AND now() - state_change > interval '5 minutes';
// "
```

---

#### Bottleneck E: High CPU Usage

**Symptoms:**

- API CPU > 80%
- Slow response times
- High CPU steal time (in cloud environments)

**Diagnosis:**

```bash
# Identify CPU-intensive processes
docker-compose exec api top -bn1

# Profile CPU usage
docker-compose exec api node --prof dist/main.js

# Generate CPU flame graph
# npm install -g 0x
# 0x services/api/dist/main.js
```

**Solutions:**

```bash
# Scale horizontally
docker-compose up --scale api=3

# Kubernetes autoscaling
kubectl autoscale deployment api --cpu-percent=70 --min=3 --max=10 -n ridendine

# Optimize expensive operations
# - Add caching for expensive queries
# - Move heavy computation to background jobs
# - Add pagination to reduce result sets

# Limit CPU (if noisy neighbor)
# Edit docker-compose.yml:
services:
  api:
    cpus: 1.0
```

---

## Resolution Steps

### Quick Fixes

```bash
# 1. Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# 2. Restart API
docker-compose restart api

# 3. Vacuum database
docker-compose exec postgres psql -U ridendine -d ridendine -c "VACUUM ANALYZE;"

# 4. Restart database connections
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE pid <> pg_backend_pid()
  AND usename = 'ridendine';
"

# 5. Scale up (Kubernetes)
kubectl scale deployment/api --replicas=5 -n ridendine
```

---

### Long-term Optimizations

**1. Add Missing Indexes**

```sql
-- Identify missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY n_distinct DESC;

-- Common indexes to add
CREATE INDEX CONCURRENTLY idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_orders_chef_status ON orders(chef_id, status);
CREATE INDEX CONCURRENTLY idx_orders_driver_status ON orders(driver_id, status);
CREATE INDEX CONCURRENTLY idx_driver_locations_driver_created ON driver_locations(driver_id, created_at DESC);
```

**2. Enable Query Caching**

```typescript
// Cache expensive queries in Redis
async findChefById(id: string) {
  const cacheKey = `chef:${id}`;
  const cached = await this.redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const chef = await this.chefRepository.findOne(id);
  await this.redis.set(cacheKey, JSON.stringify(chef), 'EX', 300); // 5 min TTL

  return chef;
}
```

**3. Implement Rate Limiting**

```typescript
// Prevent abuse of expensive endpoints
@UseGuards(ThrottlerGuard)
@Throttle(10, 60)  // 10 requests per minute
@Get('search')
async searchChefs() { ... }
```

**4. Add Pagination**

```typescript
// Always paginate list endpoints
@Get('orders')
async listOrders(
  @Query('page', ParseIntPipe) page: number = 1,
  @Query('limit', ParseIntPipe) limit: number = 20,
) {
  return this.orderService.findAll({ page, limit });
}
```

---

## Monitoring & Prevention

### Set Up Alerts

```bash
# CloudWatch alarm for high latency
aws cloudwatch put-metric-alarm \
  --alarm-name ridendine-api-high-latency \
  --alarm-description "Alert when P95 latency exceeds 500ms" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 0.5 \
  --comparison-operator GreaterThanThreshold

# Database CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ridendine-db-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Regular Maintenance

```bash
# Weekly vacuum (add to cron)
0 2 * * 0 docker-compose exec postgres psql -U ridendine -d ridendine -c "VACUUM ANALYZE;"

# Weekly index maintenance
0 3 * * 0 docker-compose exec postgres psql -U ridendine -d ridendine -c "REINDEX DATABASE ridendine;"

# Monthly statistics update
0 4 1 * * docker-compose exec postgres psql -U ridendine -d ridendine -c "ANALYZE;"
```

---

## Success Criteria

- [ ] API P95 latency < 500ms
- [ ] Database query avg time < 100ms
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] Error rate < 0.1%
- [ ] No timeouts or connection errors
- [ ] Monitoring dashboards show improvement

---

## Rollback Plan

If optimization causes issues:

```bash
# Revert code changes
git revert <commit-sha>
kubectl rollout undo deployment/api -n ridendine

# Drop new indexes (if causing issues)
DROP INDEX CONCURRENTLY idx_orders_customer_created;

# Restore original configuration
kubectl apply -f k8s/api-deployment-original.yaml
```

---

## Contact

- **Performance Engineering:** perf@ridendine.com
- **On-call:** Slack #ridendine-ops
- **Database Team:** dba@ridendine.com

---

**Last Updated:** 2026-01-31
**Maintained By:** Performance Team
