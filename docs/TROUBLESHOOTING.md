# Troubleshooting Guide

Comprehensive guide for diagnosing and resolving common issues in the RideNDine platform.

**Last Updated:** 2026-01-31
**Status:** Production Ready

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Docker Issues](#docker-issues)
3. [API Service Issues](#api-service-issues)
4. [Database Issues](#database-issues)
5. [Redis Issues](#redis-issues)
6. [Authentication Issues](#authentication-issues)
7. [Performance Issues](#performance-issues)
8. [Real-Time (WebSocket) Issues](#real-time-websocket-issues)
9. [Payment Integration Issues](#payment-integration-issues)
10. [Deployment Issues](#deployment-issues)
11. [Network & Connectivity Issues](#network--connectivity-issues)
12. [Mobile App Issues](#mobile-app-issues)
13. [Logging & Debugging](#logging--debugging)

---

## Quick Diagnostics

### Health Check Dashboard

```bash
#!/bin/bash
# quick-health-check.sh

echo "=== RideNDine Health Check ==="
echo ""

# API Health
echo "1. API Health:"
curl -s http://localhost:9001/health | jq '.' || echo "❌ API not responding"
echo ""

# Database Connection
echo "2. Database Connection:"
curl -s http://localhost:9001/health/db | jq '.' || echo "❌ Database not accessible"
echo ""

# Redis Connection
echo "3. Redis Connection:"
curl -s http://localhost:9001/health/redis | jq '.' || echo "❌ Redis not accessible"
echo ""

# Port Status
echo "4. Port Status:"
for port in 9001 5432 6379 8080; do
  if lsof -i :$port > /dev/null 2>&1; then
    echo "  ✅ Port $port is in use"
  else
    echo "  ❌ Port $port is FREE (should be in use)"
  fi
done
echo ""

# Docker Services
echo "5. Docker Services:"
docker-compose ps 2>/dev/null || echo "❌ Docker Compose not running"
echo ""

# Recent Logs
echo "6. Recent Errors (last 5 minutes):"
docker-compose logs --since 5m api 2>/dev/null | grep -i error | tail -5 || echo "No errors found"
```

**Run diagnostics:**

```bash
chmod +x quick-health-check.sh
./quick-health-check.sh
```

---

## Docker Issues

### Issue: "Cannot connect to Docker daemon"

**Symptoms:**

```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solutions:**

```bash
# 1. Check if Docker is running
sudo systemctl status docker

# 2. Start Docker if not running
sudo systemctl start docker

# 3. Enable Docker to start on boot
sudo systemctl enable docker

# 4. Add your user to docker group (to avoid sudo)
sudo usermod -aG docker $USER
newgrp docker  # Or log out and back in

# 5. Verify Docker is working
docker ps
```

---

### Issue: "Port already in use"

**Symptoms:**

```
Error: Port 5432 is already in use
Error: Port 9001 is already in use
```

**Solutions:**

```bash
# Find process using port 5432
lsof -i :5432

# Kill process on port 5432
kill $(lsof -t -i :5432)

# Or force kill
kill -9 $(lsof -t -i :5432)

# Check all RideNDine ports
for port in 8081 9001 9002 9003 9004 5432 6379 8080; do
  echo "Port $port:"
  lsof -i :$port
done

# Alternative: Change port in docker-compose.yml
# Edit docker-compose.yml:
#   ports:
#     - "5433:5432"  # Use 5433 instead of 5432
```

---

### Issue: "Database migration failed"

**Symptoms:**

```
Error: relation "users" does not exist
Error: Migration 003 failed
```

**Solutions:**

```bash
# 1. Check database is running
docker-compose ps postgres

# 2. Check database logs
docker-compose logs postgres | tail -50

# 3. Connect to database manually
docker-compose exec postgres psql -U ridendine -d ridendine

# 4. Check if migrations table exists
# In psql:
\dt schema_migrations

# 5. Reset database completely
npm run db:reset

# 6. Run migrations manually
npm run db:migrate

# 7. Verify migrations
docker-compose exec postgres psql -U ridendine -d ridendine -c "SELECT version, name FROM schema_migrations ORDER BY version;"

# 8. If migrations are stuck, force re-run:
docker-compose exec postgres psql -U ridendine -d ridendine -c "DELETE FROM schema_migrations WHERE version = 3;"
npm run db:migrate
```

---

### Issue: "Docker container keeps restarting"

**Symptoms:**

```
api_1       | Error: Cannot connect to database
api_1       | Restarting in 10 seconds...
```

**Solutions:**

```bash
# 1. Check container logs
docker-compose logs api

# 2. Check why container is restarting
docker inspect <container_id> | jq '.[0].State'

# 3. Check environment variables
docker-compose exec api env | grep DATABASE

# 4. Verify dependencies are healthy
docker-compose ps

# 5. Remove restart policy temporarily (for debugging)
# Edit docker-compose.yml:
#   restart: "no"  # Change from "unless-stopped"

# 6. Start in interactive mode
docker-compose run --rm api /bin/sh

# 7. Check if database is ready before API starts
# Add healthcheck wait in docker-compose.yml:
depends_on:
  postgres:
    condition: service_healthy
```

---

## API Service Issues

### Issue: "Connection refused" to API

**Symptoms:**

```
curl: (7) Failed to connect to localhost port 9001: Connection refused
```

**Solutions:**

```bash
# 1. Check if API is running
curl http://localhost:9001/health

# 2. Check API logs
docker-compose logs api | tail -50

# 3. Check API process
ps aux | grep node

# 4. Verify port 9001 is in use
lsof -i :9001

# 5. Restart API service
docker-compose restart api

# 6. Check for errors in startup
docker-compose up api

# 7. Verify environment variables
docker-compose exec api env | grep -E "(DATABASE|REDIS|JWT)"

# 8. Test with verbose curl
curl -v http://localhost:9001/health
```

---

### Issue: "401 Unauthorized" on authenticated endpoints

**Symptoms:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Solutions:**

```bash
# 1. Verify token is present in request
# Should be: Authorization: Bearer <token>

# 2. Check token format
echo "YOUR_TOKEN" | cut -d'.' -f2 | base64 -d | jq '.'

# 3. Check token expiration
# The decoded JWT should have "exp" field with Unix timestamp

# 4. Generate new token
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 5. Use refresh token to get new access token
curl -X POST http://localhost:9001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'

# 6. Verify JWT_SECRET is set correctly
docker-compose exec api env | grep JWT_SECRET

# 7. Check API logs for JWT errors
docker-compose logs api | grep -i jwt
```

---

### Issue: "Validation error" on POST requests

**Symptoms:**

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than 8 characters"],
  "error": "Bad Request"
}
```

**Solutions:**

```bash
# 1. Check request body matches DTO schema
# See openapi.yaml or Swagger UI for correct format

# 2. Common validation errors:
# - Email format: must be valid email (user@example.com)
# - Phone: must match pattern ^\+?[1-9]\d{1,14}$
# - Password: minimum 8 characters
# - Required fields: cannot be null or undefined

# 3. Test with valid data
curl -X POST http://localhost:9001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+15555551234",
    "role": "customer"
  }'

# 4. Check Content-Type header
# Must be: Content-Type: application/json

# 5. Verify JSON is valid
echo '{"email":"test"}' | jq '.'
```

---

### Issue: API responds slowly (high latency)

**Symptoms:**

- Requests take > 5 seconds
- Timeout errors

**Solutions:**

```bash
# 1. Check database query performance
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT query, calls, mean_exec_time, max_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# 2. Check for N+1 query problems
# Enable query logging in API
# Set LOG_LEVEL=debug in .env

# 3. Check database connections
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
"

# 4. Check Redis latency
docker-compose exec redis redis-cli --latency

# 5. Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:9001/health

# Create curl-format.txt:
cat > curl-format.txt << EOF
    time_namelookup:  %{time_namelookup}s\n
       time_connect:  %{time_connect}s\n
    time_appconnect:  %{time_appconnect}s\n
   time_pretransfer:  %{time_pretransfer}s\n
      time_redirect:  %{time_redirect}s\n
 time_starttransfer:  %{time_starttransfer}s\n
                    ----------\n
         time_total:  %{time_total}s\n
EOF

# 6. Check for missing indexes
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT schemaname, tablename, indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename;
"

# 7. Analyze slow queries
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 'uuid';
"
```

---

## Database Issues

### Issue: "Table does not exist"

**Symptoms:**

```
Error: relation "users" does not exist
```

**Solutions:**

```bash
# 1. Check if database is initialized
docker-compose exec postgres psql -U ridendine -d ridendine -c "\dt"

# 2. Run migrations
npm run db:migrate

# 3. Check migration status
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT version, name, applied_at
  FROM schema_migrations
  ORDER BY version;
"

# 4. Reset database (WARNING: deletes all data)
npm run db:reset

# 5. Manually create table if needed
docker-compose exec postgres psql -U ridendine -d ridendine -f database/migrations/002_add_users_table.sql
```

---

### Issue: "Unique constraint violation"

**Symptoms:**

```
Error: duplicate key value violates unique constraint "users_email_key"
```

**Solutions:**

```bash
# 1. Check if email already exists
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT email, created_at FROM users WHERE email = 'test@example.com';
"

# 2. Use different email for testing
# Or delete existing user:
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  DELETE FROM users WHERE email = 'test@example.com';
"

# 3. Check for duplicate data in test seeds
cat database/seeds/001_test_users.sql | grep -i "test@example.com"

# 4. For phone number conflicts:
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT phone_number, COUNT(*)
  FROM users
  GROUP BY phone_number
  HAVING COUNT(*) > 1;
"
```

---

### Issue: Database connection pool exhausted

**Symptoms:**

```
Error: Connection pool exhausted
Error: Too many connections
```

**Solutions:**

```bash
# 1. Check active connections
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT count(*) as total,
         count(*) FILTER (WHERE state = 'active') as active,
         count(*) FILTER (WHERE state = 'idle') as idle
  FROM pg_stat_activity
  WHERE usename = 'ridendine';
"

# 2. Increase pool size in API config
# Edit services/api/src/config/database.config.ts:
# max: 20,  // Increase from 10 to 20

# 3. Find long-running queries
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT pid, now() - query_start AS duration, query
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY duration DESC
  LIMIT 10;
"

# 4. Kill long-running query
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT pg_terminate_backend(PID_HERE);
"

# 5. Restart database (WARNING: will drop connections)
docker-compose restart postgres

# 6. Check for connection leaks in code
# Look for queries without proper connection release
```

---

## Redis Issues

### Issue: "Redis connection failed"

**Symptoms:**

```
Error: Redis connection to localhost:6379 failed
```

**Solutions:**

```bash
# 1. Check if Redis is running
docker-compose ps redis

# 2. Test Redis connection
docker-compose exec redis redis-cli ping
# Expected: PONG

# 3. Check Redis logs
docker-compose logs redis | tail -50

# 4. Restart Redis
docker-compose restart redis

# 5. Check Redis configuration
docker-compose exec redis redis-cli CONFIG GET maxmemory

# 6. Verify Redis URL in API
docker-compose exec api env | grep REDIS_URL

# 7. Test connection from API container
docker-compose exec api ping -c 3 redis
```

---

### Issue: Redis memory limit reached

**Symptoms:**

```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solutions:**

```bash
# 1. Check memory usage
docker-compose exec redis redis-cli INFO memory

# 2. Flush all keys (WARNING: clears cache)
docker-compose exec redis redis-cli FLUSHALL

# 3. Increase maxmemory in docker-compose.yml
# redis:
#   command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

# 4. Check largest keys
docker-compose exec redis redis-cli --bigkeys

# 5. Set eviction policy
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Authentication Issues

### Issue: "Invalid credentials"

**Symptoms:**

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

**Solutions:**

```bash
# 1. Verify user exists
docker-compose exec postgres psql -U ridendine -d ridendine -c "
  SELECT id, email, role FROM users WHERE email = 'test@example.com';
"

# 2. Check if password is hashed correctly
# Passwords should be bcrypt hashes starting with $2b$

# 3. Reset password
curl -X POST http://localhost:9001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 4. Create new test user
curl -X POST http://localhost:9001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+15555559999",
    "role": "customer"
  }'

# 5. Check email format
# Must be valid email format (user@domain.com)
```

---

### Issue: Token expired

**Symptoms:**

```json
{
  "statusCode": 401,
  "message": "Token expired",
  "error": "Unauthorized"
}
```

**Solutions:**

```bash
# 1. Use refresh token to get new access token
curl -X POST http://localhost:9001/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_EXPIRED_TOKEN" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'

# 2. Login again
curl -X POST http://localhost:9001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 3. Increase token expiration (for development only)
# Edit .env:
# JWT_EXPIRATION=1h  # Change from 15m to 1h
```

---

## Performance Issues

### Issue: Slow API response times

See [API responds slowly](#issue-api-responds-slowly-high-latency) above.

---

### Issue: High memory usage

**Symptoms:**

- API container using > 1GB RAM
- Out of memory errors

**Solutions:**

```bash
# 1. Check memory usage
docker stats

# 2. Check for memory leaks in API
# Enable heap profiling
node --inspect services/api/dist/main.js

# 3. Limit container memory
# Edit docker-compose.yml:
# services:
#   api:
#     mem_limit: 1g

# 4. Restart API to free memory
docker-compose restart api

# 5. Check for large objects in Redis
docker-compose exec redis redis-cli --bigkeys

# 6. Optimize database queries
# Add EXPLAIN ANALYZE to slow queries
```

---

### Issue: High CPU usage

**Symptoms:**

- API container using > 80% CPU
- Slow response times

**Solutions:**

```bash
# 1. Check CPU usage
docker stats

# 2. Check for infinite loops or heavy computation
docker-compose logs api | grep -i error

# 3. Profile CPU usage
node --prof services/api/dist/main.js

# 4. Scale horizontally (add more replicas)
docker-compose up --scale api=3

# 5. Optimize heavy operations
# - Use caching for expensive queries
# - Move heavy computation to background jobs
# - Add pagination to list endpoints
```

---

## Real-Time (WebSocket) Issues

### Issue: "WebSocket connection fails"

**Symptoms:**

```
WebSocket connection to 'ws://localhost:9001' failed
Error during WebSocket handshake
```

**Solutions:**

```bash
# 1. Verify WebSocket server is running
curl http://localhost:9001/health

# 2. Check if port 9001 allows WebSocket connections
# WebSocket uses same port as HTTP (9001)

# 3. Test WebSocket connection
npm install -g wscat
wscat -c ws://localhost:9001

# 4. Check for auth token
# WebSocket requires token in query param or auth header
wscat -c "ws://localhost:9001?token=YOUR_ACCESS_TOKEN"

# 5. Check CORS configuration
# Edit services/api/src/main.ts:
# app.enableCors({ origin: '*' })  # For testing only

# 6. Check firewall rules
sudo ufw status

# 7. Check nginx/load balancer WebSocket support
# nginx.conf should have:
# proxy_http_version 1.1;
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";
```

---

### Issue: "Order updates not appearing"

**Symptoms:**

- Order status changes but UI doesn't update
- No WebSocket events received

**Solutions:**

```bash
# 1. Verify WebSocket is connected
# Check browser console: socket.connected === true

# 2. Join order room
# Client must emit: socket.emit('join_order', { orderId: 'xxx' })

# 3. Check API logs for WebSocket events
docker-compose logs api | grep -i websocket

# 4. Test event emission manually
# In Redis CLI:
docker-compose exec redis redis-cli
PUBLISH order:status_changed '{"orderId":"xxx","status":"preparing"}'

# 5. Restart real-time service
docker-compose restart api

# 6. Check Redis pub/sub
docker-compose exec redis redis-cli
SUBSCRIBE order:*
```

---

## Payment Integration Issues

### Issue: "Stripe payment intent creation failed"

**Symptoms:**

```
Error: Stripe API error
Error: Invalid API key provided
```

**Solutions:**

```bash
# 1. Verify Stripe API key
docker-compose exec api env | grep STRIPE_SECRET_KEY

# 2. Check Stripe API key format
# Test keys: sk_test_xxxxx
# Live keys: sk_live_xxxxx

# 3. Test Stripe connection
curl https://api.stripe.com/v1/charges \
  -u sk_test_YOUR_KEY:

# 4. Check Stripe webhook secret
docker-compose exec api env | grep STRIPE_WEBHOOK_SECRET

# 5. Verify webhook endpoint is accessible
curl -X POST http://localhost:9001/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"payment_intent.succeeded"}'

# 6. Check Stripe logs
# Visit: https://dashboard.stripe.com/logs

# 7. Test with Stripe CLI
stripe listen --forward-to localhost:9001/webhooks/stripe
```

---

### Issue: "Webhook signature verification failed"

**Symptoms:**

```
Error: No signatures found matching the expected signature for payload
```

**Solutions:**

```bash
# 1. Verify webhook secret matches Stripe dashboard
# Get from: https://dashboard.stripe.com/webhooks

# 2. Check raw body is available
# API must capture raw body for signature verification

# 3. Test webhook locally with Stripe CLI
stripe trigger payment_intent.succeeded

# 4. Check webhook endpoint logs
docker-compose logs api | grep webhook

# 5. Verify Content-Type header
# Stripe sends: Content-Type: application/json

# 6. Check webhook timestamp tolerance
# Webhook must be received within 5 minutes of creation
```

---

## Deployment Issues

### Issue: "ECS task fails to start"

**Symptoms:**

- ECS task status: STOPPED
- Container exits immediately

**Solutions:**

```bash
# 1. Check task logs
aws logs tail /ecs/ridendine-production --follow

# 2. Check task definition
aws ecs describe-task-definition --task-definition ridendine-api:latest

# 3. Verify environment variables
# Check secrets are accessible from Secrets Manager

# 4. Check health check configuration
# Container may be killed if health check fails

# 5. Test Docker image locally
docker run -it --rm -p 9001:9001 \
  -e DATABASE_URL="postgres://..." \
  -e JWT_SECRET="..." \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/ridendine-api:latest

# 6. Check task IAM role permissions
aws iam get-role --role-name ecsTaskExecutionRole
```

---

### Issue: "Kubernetes pod in CrashLoopBackOff"

**Symptoms:**

```
NAME                   READY   STATUS             RESTARTS   AGE
api-7d8f9c8b6-abcde   0/1     CrashLoopBackOff   5          5m
```

**Solutions:**

```bash
# 1. Check pod logs
kubectl logs -f pod/api-7d8f9c8b6-abcde -n ridendine

# 2. Check previous container logs
kubectl logs -f pod/api-7d8f9c8b6-abcde -n ridendine --previous

# 3. Describe pod
kubectl describe pod api-7d8f9c8b6-abcde -n ridendine

# 4. Check events
kubectl get events -n ridendine --sort-by='.lastTimestamp'

# 5. Verify secrets exist
kubectl get secret ridendine-secrets -n ridendine

# 6. Check configmap
kubectl get configmap ridendine-config -n ridendine -o yaml

# 7. Exec into pod (if running)
kubectl exec -it api-7d8f9c8b6-abcde -n ridendine -- /bin/sh

# 8. Check resource limits
kubectl top pod api-7d8f9c8b6-abcde -n ridendine
```

---

## Network & Connectivity Issues

### Issue: "Cannot connect to database from API"

**Symptoms:**

```
Error: Connection refused
Error: Timeout connecting to database
```

**Solutions:**

```bash
# 1. Check database is running
docker-compose ps postgres

# 2. Test connection from API container
docker-compose exec api ping -c 3 postgres

# 3. Test database port
docker-compose exec api nc -zv postgres 5432

# 4. Check DATABASE_URL format
# postgresql://user:password@host:port/database

# 5. Verify network connectivity
docker network ls
docker network inspect ridendine_default

# 6. Check security groups (AWS)
# Database security group must allow inbound from API security group

# 7. Check VPC peering (AWS)
# If database is in different VPC, verify peering connection
```

---

## Mobile App Issues

### Issue: "Cannot connect from Expo app"

**Symptoms:**

```
Network request failed
TypeError: Network request failed
```

**Solutions:**

```bash
# 1. Mobile apps cannot use localhost
# Use LAN IP instead:
hostname -I | awk '{print $1}'

# 2. Update API URL in mobile app
# expo start -> Update API_BASE_URL to http://192.168.1.100:9001

# 3. Check firewall allows incoming connections
sudo ufw allow 9001

# 4. Verify API is listening on all interfaces (0.0.0.0)
# Edit services/api/src/main.ts:
# await app.listen(port, '0.0.0.0');

# 5. Test connection from phone browser
# Open: http://192.168.1.100:9001/health

# 6. Check CORS configuration
# Must allow mobile app origin

# 7. For iOS: Check App Transport Security
# May need to allow HTTP in development
```

---

## Logging & Debugging

### Enable Debug Logging

```bash
# 1. Set log level to debug
# Edit .env:
LOG_LEVEL=debug

# 2. Restart API
docker-compose restart api

# 3. Watch logs
docker-compose logs -f api

# 4. Filter logs by level
docker-compose logs api | grep -i error
docker-compose logs api | grep -i warn

# 5. Export logs to file
docker-compose logs api > api-logs.txt
```

---

### Database Query Logging

```sql
-- Enable query logging
ALTER DATABASE ridendine SET log_statement = 'all';

-- Enable slow query logging (queries > 1 second)
ALTER DATABASE ridendine SET log_min_duration_statement = 1000;

-- View logs
docker-compose logs postgres | grep -i "duration:"

-- Disable logging
ALTER DATABASE ridendine SET log_statement = 'none';
```

---

### Common Log Patterns

```bash
# Find 500 errors
docker-compose logs api | grep "500"

# Find slow requests (>1s)
docker-compose logs api | grep "duration:.*[0-9][0-9][0-9][0-9]ms"

# Find authentication errors
docker-compose logs api | grep -i "unauthorized\|forbidden\|jwt"

# Find database errors
docker-compose logs api | grep -i "postgres\|database\|connection"

# Find Redis errors
docker-compose logs api | grep -i "redis"
```

---

## Emergency Procedures

### Complete System Reset

```bash
#!/bin/bash
# WARNING: This will delete ALL data

echo "⚠️  This will delete all data. Press Ctrl+C to cancel."
sleep 5

# Stop all services
docker-compose down -v

# Remove all containers
docker rm -f $(docker ps -a -q)

# Remove all volumes
docker volume rm $(docker volume ls -q)

# Clean Docker system
docker system prune -a --volumes -f

# Reinstall dependencies
npm ci

# Start fresh
npm run docker:up
npm run db:migrate
npm run db:seed

echo "✅ System reset complete"
```

---

## Getting Help

### Support Channels

- **Documentation Issues:** Create GitHub issue
- **Urgent Production Issues:** Slack #ridendine-ops channel
- **Questions:** support@ridendine.com
- **Security Issues:** security@ridendine.com (do not file public issues)

### Debugging Tips

1. **Always check logs first:** 95% of issues are explained in logs
2. **Use health checks:** Verify each service is healthy before debugging
3. **Test in isolation:** Isolate the problem (API? Database? Network?)
4. **Check recent changes:** What changed before the issue appeared?
5. **Use staging environment:** Reproduce issues in staging first
6. **Document solutions:** Update this guide when you find new solutions

---

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [RUNBOOK_SERVICE_RESTART.md](./RUNBOOK_SERVICE_RESTART.md) - Service restart procedures
- [RUNBOOK_DATABASE_RECOVERY.md](./RUNBOOK_DATABASE_RECOVERY.md) - Database recovery
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Local development setup

---

**Last Updated:** 2026-01-31
**Maintained By:** Engineering Team
**Version:** 1.0.0
