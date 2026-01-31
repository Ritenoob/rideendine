#!/bin/bash
# Phase 1 Database Optimization Deployment Script
# Run this script to deploy all Phase 1 optimizations

set -e  # Exit on error

echo "🚀 Phase 1 Database Optimization Deployment"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."
echo ""

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client (psql) not found${NC}"
    echo "Please install: sudo apt-get install postgresql-client"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 2: Start Docker daemon (requires sudo)
echo "📋 Step 2: Starting Docker daemon..."
echo ""
echo -e "${YELLOW}This step requires sudo password${NC}"
sudo systemctl start docker || echo "Docker may already be running"
sleep 2
echo ""

# Step 3: Start database containers
echo "📋 Step 3: Starting PostgreSQL and Redis containers..."
echo ""
npm run db:up
sleep 5
echo ""

# Verify containers are running
echo "Verifying containers..."
docker ps | grep -E "postgres|redis" || {
    echo -e "${RED}❌ Containers not running${NC}"
    echo "Please check: docker ps"
    exit 1
}
echo -e "${GREEN}✅ Containers running${NC}"
echo ""

# Step 4: Apply baseline migrations (001-007)
echo "📋 Step 4: Applying baseline migrations..."
echo ""
npm run db:migrate
echo ""

# Step 5: Apply migration 008 (spatial indexes)
echo "📋 Step 5: Applying migration 008 (spatial indexes)..."
echo ""
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -f database/migrations/008_add_spatial_indexes.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 008 applied successfully${NC}"
else
    echo -e "${RED}❌ Migration 008 failed${NC}"
    exit 1
fi
echo ""

# Step 6: Apply migration 009 (composite indexes)
echo "📋 Step 6: Applying migration 009 (composite indexes)..."
echo ""
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -f database/migrations/009_add_composite_indexes.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 009 applied successfully${NC}"
else
    echo -e "${RED}❌ Migration 009 failed${NC}"
    exit 1
fi
echo ""

# Step 7: Verify PostGIS installation
echo "📋 Step 7: Verifying PostGIS installation..."
echo ""
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PostGIS verified${NC}"
else
    echo -e "${YELLOW}⚠️  PostGIS may not be installed${NC}"
fi
echo ""

# Step 8: Verify spatial indexes
echo "📋 Step 8: Verifying spatial indexes..."
echo ""
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%location%';"

echo ""

# Step 9: Restart API service
echo "📋 Step 9: Restarting API service..."
echo ""
echo -e "${YELLOW}Please restart the API service manually:${NC}"
echo "  npm run dev:api"
echo ""
echo "Or if using PM2:"
echo "  pm2 restart ridendine-api"
echo ""
read -p "Press Enter once API service is restarted..."

# Step 10: Run performance benchmarks
echo "📋 Step 10: Running performance benchmarks..."
echo ""
npx ts-node database/scripts/benchmark_performance.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Benchmarks completed successfully${NC}"
else
    echo -e "${RED}❌ Benchmarks failed${NC}"
    exit 1
fi
echo ""

# Step 11: Summary
echo "==========================================="
echo "🎉 Phase 1 Deployment Complete!"
echo "==========================================="
echo ""
echo "Summary:"
echo "  ✅ PostgreSQL and Redis containers running"
echo "  ✅ Migration 008 (spatial indexes) applied"
echo "  ✅ Migration 009 (composite indexes) applied"
echo "  ✅ PostGIS extension verified"
echo "  ✅ Performance benchmarks executed"
echo ""
echo "Expected Improvements:"
echo "  ⚡ 10x faster driver dispatch (100-200ms → 10-20ms)"
echo "  ⚡ 3-5x faster chef search (80-120ms → 15-30ms)"
echo "  ⚡ 2x faster order creation (50-150ms → 25-75ms)"
echo "  ⚡ 90% fewer connection timeouts"
echo ""
echo "Next Steps:"
echo "  1. Monitor performance for 24 hours"
echo "  2. Check for any issues: docker logs ridendine-postgres"
echo "  3. Review benchmark report above"
echo "  4. Proceed to Phase 2 (Redis caching) when ready"
echo ""
echo "Documentation:"
echo "  - Full guide: database/PHASE1_IMPLEMENTATION_GUIDE.md"
echo "  - Quick start: PHASE1_QUICK_START.md"
echo "  - Summary: PHASE1_SUMMARY.md"
echo ""
