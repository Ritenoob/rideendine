# Phase 1 Deployment Instructions

**Status:** Ready to deploy
**Expected Time:** 2-3 minutes
**Expected Improvement:** 10x faster database queries

---

## Quick Deploy (3 Commands)

```bash
# 1. Initialize database with Phase 1 optimizations (requires sudo password)
./INIT_DATABASE_PHASE1.sh

# 2. Start API service (in new terminal or background)
cd services/api && npm run start:dev

# 3. Run benchmarks to validate improvements
npx ts-node database/scripts/benchmark_performance.ts
```

---

## What This Does

The deployment script will:

1. **Create Database User & Database**
   - User: `ridendine`
   - Database: `ridendine_dev`
   - Enables PostGIS extension

2. **Apply Baseline Migrations** (001-007)
   - Users, chefs, drivers, orders tables
   - Core schema structure

3. **Apply Phase 1 Optimizations**
   - **Migration 008**: PostGIS spatial indexes
     - 10x faster driver dispatch queries
     - Spatial indexing for chef/driver locations
   - **Migration 009**: Composite indexes
     - 3-5x faster order queries
     - 20+ optimized indexes for common patterns

4. **Seed Test Data**
   - 10 test chefs with locations
   - 20 test drivers with locations
   - Sample menu items and orders

5. **Verify Setup**
   - Confirms PostGIS version
   - Lists all spatial indexes
   - Counts total indexes

---

## Expected Results

### Database Setup

```
✅ Database and user created successfully
✅ Baseline migrations completed (001-007)
✅ Migration 008 applied successfully (spatial indexes)
✅ Migration 009 applied successfully (composite indexes)
✅ Test data seeded
```

### PostGIS Verification

```
 extname | extversion
---------+------------
 postgis | 3.4.0
```

### Spatial Indexes Created

```
idx_chefs_location                    -- Chef locations (GIST)
idx_drivers_current_location          -- Driver locations (GIST)
idx_drivers_available_location        -- Available drivers (GIST + WHERE)
```

### Composite Indexes Created (20+)

```
idx_orders_customer_status            -- Customer order history
idx_orders_chef_status                -- Chef order queue
idx_orders_driver_status              -- Driver assignments
idx_drivers_available_rating          -- Driver dispatch
... and 16 more
```

### Benchmark Results (Target)

```
📊 Benchmark Results:
  ✅ Driver Dispatch: <20ms (target: 20ms) - 10x improvement
  ✅ Chef Search: <30ms (target: 30ms) - 3-5x improvement
  ✅ Order Creation: <75ms (target: 75ms) - 2x improvement
  ✅ Order Listing: <20ms (target: 20ms) - 5x improvement
```

---

## Troubleshooting

### Issue: "sudo: a password is required"

**Solution:** The script needs sudo to create the database. Enter your password when prompted.

```bash
./INIT_DATABASE_PHASE1.sh
# Enter password when prompted
```

### Issue: "role 'ridendine' already exists"

**Solution:** Database already initialized. Skip to starting API service.

```bash
cd services/api && npm run start:dev
```

### Issue: "relation already exists"

**Solution:** Migrations already applied. Skip to benchmarks.

```bash
npx ts-node database/scripts/benchmark_performance.ts
```

### Issue: API won't start - "Cannot find module dist/main"

**Solution:** Compile TypeScript first.

```bash
cd services/api
npx tsc --project tsconfig.build.json
npm run start:dev
```

### Issue: API starts but health check fails

**Solution:** Check API logs for database connection errors.

```bash
# Check if API is running
ps aux | grep nest

# View logs
tail -f /tmp/ridendine-api.log

# Test database connection
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev -c "SELECT version();"
```

---

## Verification Steps

### 1. Check Database Connection

```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev -c "SELECT version();"
```

**Expected:** PostgreSQL version info

### 2. Check PostGIS

```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';"
```

**Expected:** `postgis | 3.x.x`

### 3. Check Spatial Indexes

```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT indexname FROM pg_indexes WHERE indexname LIKE '%location%';"
```

**Expected:** 3 indexes (chefs, drivers current, drivers available)

### 4. Check Test Data

```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "SELECT COUNT(*) as chefs FROM chefs; SELECT COUNT(*) as drivers FROM drivers;"
```

**Expected:** 10 chefs, 20 drivers

### 5. Test API Health

```bash
curl http://localhost:9001/health
```

**Expected:** `{"status":"ok"}`

### 6. Test Spatial Query

```bash
PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev \
  -c "EXPLAIN SELECT id FROM drivers WHERE is_available = TRUE AND ST_DWithin(current_location, ST_SetSRID(ST_MakePoint(-79.8711, 43.2557), 4326), 10000) LIMIT 5;"
```

**Expected:** Should show `Index Scan using idx_drivers_available_location`

---

## Performance Validation

After deployment, run benchmarks:

```bash
npx ts-node database/scripts/benchmark_performance.ts
```

### Target Performance Metrics

| Query           | Before      | Target      | Expected           |
| --------------- | ----------- | ----------- | ------------------ |
| Driver Dispatch | 100-200ms   | <20ms       | ✅ 10x faster      |
| Chef Search     | 80-120ms    | <30ms       | ✅ 3-5x faster     |
| Order Creation  | 50-150ms    | <75ms       | ✅ 2x faster       |
| Order Listing   | 100-200ms   | <20ms       | ✅ 5x faster       |
| Connection Pool | 10% timeout | <1% timeout | ✅ 90% improvement |

---

## Files Modified

### Database Migrations

- `database/migrations/008_add_spatial_indexes.sql` (NEW)
- `database/migrations/009_add_composite_indexes.sql` (NEW)

### API Service

- `services/api/src/database/database.module.ts` - Connection pool optimization
- `services/api/src/dispatch/dispatch.service.ts` - Spatial query implementation
- `services/api/src/orders/orders.service.ts` - Batch insert optimization

### Configuration

- `services/api/nest-cli.json` (NEW) - NestJS build config

### Documentation

- `INIT_DATABASE_PHASE1.sh` (NEW) - Automated deployment script
- `PHASE1_DEPLOYMENT_INSTRUCTIONS.md` (NEW) - This file

---

## What's Next After Phase 1?

Once Phase 1 is validated and stable:

1. **Monitor for 24 hours**
   - Check slow query logs
   - Monitor connection pool usage
   - Verify no errors in application logs

2. **Plan Phase 2: Redis Caching**
   - Design cache invalidation strategy
   - Identify high-read endpoints
   - Implement cache warming

3. **Plan Phase 3: Query Optimization**
   - Add EXPLAIN ANALYZE to slow queries
   - Optimize N+1 query patterns
   - Implement query result caching

---

## Rollback (If Needed)

If Phase 1 causes issues:

```bash
# 1. Stop API service
pkill -f "nest start"

# 2. Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE ridendine_dev;"
sudo -u postgres psql -c "CREATE DATABASE ridendine_dev OWNER ridendine;"

# 3. Run baseline migrations only (skip 008 and 009)
# Edit run-migrations.sh to exclude 008 and 009
bash database/scripts/run-migrations.sh

# 4. Restore old code
git checkout HEAD -- services/api/src/database/database.module.ts
git checkout HEAD -- services/api/src/dispatch/dispatch.service.ts
git checkout HEAD -- services/api/src/orders/orders.service.ts

# 5. Restart API
cd services/api && npm run start:dev
```

---

## Support

- **Full Implementation Guide:** `database/PHASE1_IMPLEMENTATION_GUIDE.md`
- **System Overview:** `RND_OPTIMIZATION_SYSTEM.md`
- **Architecture:** `AGENTS.md`

---

**Ready to deploy?** Run `./INIT_DATABASE_PHASE1.sh` to start!
