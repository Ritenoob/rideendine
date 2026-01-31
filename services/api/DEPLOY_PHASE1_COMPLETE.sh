#!/bin/bash
# Complete Phase 1 Deployment with Database Setup

set -e
cd /home/nygmaee/Desktop/rideendine

echo "🚀 Complete Phase 1 Deployment"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Kill existing processes
echo -e "\n${YELLOW}Step 1: Cleaning up existing processes...${NC}"
pkill -f "nest start" || true
sleep 2

# Step 2: Start Docker
echo -e "\n${YELLOW}Step 2: Starting Docker...${NC}"
sudo systemctl start docker || echo "Docker may already be running"
sleep 2

# Step 3: Reset database (will prompt for confirmation)
echo -e "\n${YELLOW}Step 3: Setting up database...${NC}"
npm run db:reset

# Step 4: Apply Phase 1 migrations
echo -e "\n${YELLOW}Step 4: Applying Phase 1 optimizations...${NC}"

echo "Applying migration 008 (spatial indexes)..."
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -f database/migrations/008_add_spatial_indexes.sql

echo "Applying migration 009 (composite indexes)..."
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -f database/migrations/009_add_composite_indexes.sql

# Step 5: Verify PostGIS
echo -e "\n${YELLOW}Step 5: Verifying PostGIS...${NC}"
PGPASSWORD=ridendine_dev_password psql \
  -h localhost \
  -U ridendine \
  -d ridendine_dev \
  -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';"

# Step 6: Start API service in background
echo -e "\n${YELLOW}Step 6: Starting API service...${NC}"
cd services/api
npm run start:dev > /tmp/ridendine-api.log 2>&1 &
API_PID=$!
cd ../..

echo "API service starting (PID: $API_PID)"
echo "Waiting 10 seconds for startup..."
sleep 10

# Step 7: Check if API is running
if ps -p $API_PID > /dev/null; then
    echo -e "${GREEN}✅ API service is running${NC}"
    echo "Logs: tail -f /tmp/ridendine-api.log"
else
    echo -e "${RED}❌ API service failed to start${NC}"
    echo "Check logs: cat /tmp/ridendine-api.log"
    exit 1
fi

# Step 8: Run benchmarks
echo -e "\n${YELLOW}Step 7: Running performance benchmarks...${NC}"
npx ts-node database/scripts/benchmark_performance.ts

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Phase 1 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Review benchmark results above"
echo "  2. Monitor API logs: tail -f /tmp/ridendine-api.log"
echo "  3. Test endpoints: curl http://localhost:9001/health"
echo ""
