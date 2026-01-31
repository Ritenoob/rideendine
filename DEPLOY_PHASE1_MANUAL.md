# Phase 1 Manual Deployment Guide

**Time Required:** 5-10 minutes
**Expected Improvement:** 10x faster database queries

---

## Quick Deploy (Copy-Paste Commands)

```bash
# 1. Start Docker (enter your password when prompted)
sudo systemctl start docker

# 2. Start database containers
cd /home/nygmaee/Desktop/rideendine
npm run db:up

# 3. Wait for containers to be ready
sleep 5

# 4. Verify containers are running
docker ps

# 5. Apply baseline migrations (001-007)
npm run db:migrate

# 6. Apply migration 008 (spatial indexes)
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -f database/migrations/008_add_spatial_indexes.sql

# 7. Apply migration 009 (composite indexes)
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -f database/migrations/009_add_composite_indexes.sql

# 8. Verify PostGIS
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';"

# 9. Restart API service
npm run dev:api

# 10. Run benchmarks (in a new terminal)
npx ts-node database/scripts/benchmark_performance.ts
```

---

## OR Use Automated Script

```bash
# Run the automated deployment script
./PHASE1_DEPLOY_NOW.sh
```

---

## Expected Output

### Migration 008 Success:
```
CREATE EXTENSION
ALTER TABLE
UPDATE 10
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE TRIGGER
CREATE TRIGGER
CREATE FUNCTION
ANALYZE
NOTICE:  Chefs: 10 total, 10 with location
NOTICE:  Drivers: 20 total, 20 with location
```

### Migration 009 Success:
```
CREATE INDEX
CREATE INDEX
CREATE INDEX
... (20+ indexes)
ANALYZE
NOTICE:  Index sizes:
  idx_drivers_current_location on drivers - 16 kB
  idx_chefs_location on chefs - 8 kB
  ...
```

### Benchmark Success:
```
🚀 Starting Phase 1 Database Performance Benchmarks

================================================================================

📊 Checking PostGIS Extension...
✅ PostGIS 3.4.0 installed

📊 Checking Spatial Indexes...
Found 23 optimization indexes:
  ✓ chefs.idx_chefs_location
  ✓ drivers.idx_drivers_current_location
  ...

📊 Benchmark 1: Driver Dispatch Query
--------------------------------------------------------------------------------
  Iterations: 50
  Average:    12.34ms  ← Should be < 20ms
  P95:        15.23ms

📊 Benchmark 2: Chef Search Query
--------------------------------------------------------------------------------
  Average:    18.56ms  ← Should be < 30ms

📊 Benchmark 3: Order Creation (with batch inserts)
--------------------------------------------------------------------------------
  Average:    32.45ms  ← Should be < 75ms

🎯 Performance Targets:
--------------------------------------------------------------------------------
✅ Driver Dispatch: 12.34ms (target: 20ms, 7ms under)
✅ Chef Search: 18.56ms (target: 30ms, 11ms under)
✅ Order Creation: 32.45ms (target: 75ms, 42ms under)
✅ Order Listing: 14.23ms (target: 20ms, 5ms under)

✨ Benchmark complete!
```

---

## Troubleshooting

### Issue: Docker permission denied

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker

# Try again
docker ps
```

### Issue: PostgreSQL connection refused

```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check logs
docker logs ridendine-postgres

# Restart containers
npm run db:down
npm run db:up
```

### Issue: PostGIS not found

```bash
# Install PostGIS in container
docker exec -it ridendine-postgres bash
apt-get update
apt-get install -y postgresql-postgis

# Or use system PostgreSQL
sudo apt-get install postgresql-postgis-3
```

### Issue: Migration fails with "relation already exists"

```bash
# Check what migrations have been applied
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -c "\dt"

# If migrations are already applied, skip to benchmarks
npx ts-node database/scripts/benchmark_performance.ts
```

---

## Verification Steps

### 1. Check PostGIS is installed
```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';"
```
**Expected:** `postgis | 3.x.x`

### 2. Check spatial indexes exist
```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT indexname FROM pg_indexes WHERE indexname LIKE '%location%';"
```
**Expected:** 3 indexes (chefs, drivers current, drivers available)

### 3. Check composite indexes exist
```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_orders%' OR indexname LIKE 'idx_drivers%';"
```
**Expected:** 10+ indexes

### 4. Test spatial query
```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "EXPLAIN SELECT id FROM drivers WHERE is_available = TRUE AND ST_DWithin(current_location, ST_SetSRID(ST_MakePoint(-79.8711, 43.2557), 4326), 10000) LIMIT 5;"
```
**Expected:** Should use `Index Scan using idx_drivers_available_location`

---

## Success Criteria

- [  ] PostgreSQL container running
- [  ] Redis container running
- [  ] PostGIS extension installed
- [  ] Migration 008 applied successfully
- [  ] Migration 009 applied successfully
- [  ] API service restarted
- [  ] Benchmarks show all targets met (✅ green checkmarks)

---

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Check slow query logs
   - Monitor connection pool usage
   - Verify no errors in application logs

2. **Validate improvements**
   - Run benchmarks multiple times
   - Compare with baseline metrics
   - Check actual API response times

3. **Document results**
   - Update PHASE1_SUMMARY.md with actual metrics
   - Share results with team
   - Create deployment report

4. **Plan Phase 2**
   - Review Redis caching strategy
   - Identify high-read endpoints
   - Design cache invalidation logic

---

## Quick Reference

**View deployment script:**
```bash
cat PHASE1_DEPLOY_NOW.sh
```

**Run automated deployment:**
```bash
./PHASE1_DEPLOY_NOW.sh
```

**Check deployment status:**
```bash
docker ps
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev -c "\dt"
```

**Rollback if needed:**
```bash
npm run db:down
git checkout HEAD -- services/api/src/database/database.module.ts
git checkout HEAD -- services/api/src/dispatch/dispatch.service.ts
git checkout HEAD -- services/api/src/orders/orders.service.ts
```

---

**Need Help?**
- Full guide: `database/PHASE1_IMPLEMENTATION_GUIDE.md`
- Quick start: `PHASE1_QUICK_START.md`
- System overview: `RND_OPTIMIZATION_SYSTEM.md`
