# RideNDine Load Testing

This directory contains k6 load tests for establishing performance baselines and stress testing the RideNDine API.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6

# Or download from: https://k6.io/docs/getting-started/installation/
```

## Test Files

### 1. `api-health-check.js`
**Purpose:** Baseline performance test for API health endpoint

**Load Profile:**
- Warm up: 5 users (30s)
- Low load: 10 users (1m)
- Medium load: 50 users (2m)
- High load: 100 users (2m)
- Scale down: 50 users (1m)
- Cool down (30s)

**Thresholds:**
- p95 response time: < 500ms
- p99 response time: < 1000ms
- Error rate: < 1%
- Success rate: > 95%

**Run:**
```bash
k6 run load-tests/api-health-check.js
```

### 2. `api-full-scenario.js`
**Purpose:** Realistic user journey testing

**User Journey:**
1. Login/Authentication
2. Browse chefs
3. View menu items
4. Create order
5. Check order history

**Load Profile:**
- Ramp up: 10 users (1m)
- Sustain: 25 users (3m)
- Ramp down (1m)

**Thresholds:**
- Overall p95: < 1000ms
- Login p95: < 500ms
- Error rate: < 5%
- Success rate: > 90%

**Run:**
```bash
k6 run load-tests/api-full-scenario.js
```

## Running Tests

### Basic Test Run
```bash
# Run with default settings (localhost:9001)
k6 run load-tests/api-health-check.js

# Run against different environment
API_URL=http://localhost:9001 k6 run load-tests/api-health-check.js
```

### Advanced Options
```bash
# Save results to JSON
k6 run --out json=results.json load-tests/api-health-check.js

# Run with specific number of virtual users
k6 run --vus 50 --duration 2m load-tests/api-health-check.js

# Run with summary export
k6 run --summary-export=summary.json load-tests/api-health-check.js
```

### Docker-based Testing
```bash
# Run k6 from Docker (no installation needed)
docker run --rm -i --network=host grafana/k6:latest run - < load-tests/api-health-check.js
```

## Baseline Performance Targets

### Health Endpoint
- **Target p95:** < 200ms
- **Target p99:** < 500ms
- **Max throughput:** > 100 req/s
- **Error rate:** 0%

### Authentication
- **Login p95:** < 300ms
- **Token generation:** < 100ms

### API Endpoints (Authenticated)
- **List operations p95:** < 500ms
- **Create operations p95:** < 800ms
- **Update operations p95:** < 600ms
- **Delete operations p95:** < 400ms

### Database Operations
- **Simple queries:** < 50ms
- **Complex queries:** < 200ms
- **Transactions:** < 300ms

## Interpreting Results

### Key Metrics
- **http_req_duration:** Total request time (including network)
- **http_req_waiting:** Time to first byte (TTFB)
- **http_req_sending:** Time spent sending data
- **http_req_receiving:** Time spent receiving data
- **http_reqs:** Total HTTP requests
- **vus:** Number of virtual users
- **iterations:** Number of complete test iterations

### Sample Output
```
     ✓ health check status is 200
     ✓ health check response time < 500ms

     checks.........................: 100.00% ✓ 1200      ✗ 0
     data_received..................: 240 kB  8.0 kB/s
     data_sent......................: 120 kB  4.0 kB/s
     http_req_duration..............: avg=125ms min=95ms med=120ms max=450ms p(90)=180ms p(95)=220ms
     http_reqs......................: 1200    40/s
     iterations.....................: 1200    40/s
     vus............................: 50      min=0       max=100
```

### Performance Issues Indicators
- ❌ **High p95/p99:** Indicates slow responses under load
- ❌ **Increasing duration over time:** Memory leaks or resource exhaustion
- ❌ **High error rates:** Backend issues or overload
- ❌ **Failed checks:** API contract violations

## CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Run Load Tests
  run: |
    npm run docker:up:detached
    sleep 30  # Wait for services to start
    k6 run load-tests/api-health-check.js
    npm run docker:down
```

## Troubleshooting

### "Connection refused"
- Ensure API is running: `curl http://localhost:9001/health`
- Check Docker containers: `docker-compose ps`
- Verify port mapping in docker-compose.yml

### High failure rates
- Check API logs: `docker-compose logs api`
- Verify database connection
- Ensure sufficient resources (CPU, memory)

### Slow response times
- Check database query performance
- Review N+1 query issues
- Verify network latency
- Check for blocking operations

## Next Steps

1. **Establish Baseline:** Run tests on clean environment
2. **Document Results:** Save baseline metrics for comparison
3. **Continuous Testing:** Add to CI/CD pipeline
4. **Optimization:** Use results to identify bottlenecks
5. **Regression Testing:** Compare against baseline after changes
