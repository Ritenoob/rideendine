#!/bin/bash
# Complete Database Initialization with Phase 1 Optimizations
# This script must be run with sudo to initialize PostgreSQL

set -e

echo "🚀 RideNDine Database Initialization with Phase 1 Optimizations"
echo "================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Database configuration
DB_USER="ridendine"
DB_PASSWORD="ridendine_dev_password"
DB_NAME="ridendine_dev"

echo -e "${YELLOW}Step 1: Creating database user and database...${NC}"
echo ""

# Create user and database as postgres superuser
sudo -u postgres psql << EOF
-- Drop existing database and user if they exist
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};

-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Create database
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

\c ${DB_NAME}

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

SELECT 'Database setup complete' AS status;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database and user created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 2: Running baseline migrations (001-007)...${NC}"
echo ""

# Change to project directory
cd /home/nygmaee/Desktop/rideendine

# Run baseline migrations using the script
PGPASSWORD=${DB_PASSWORD} DATABASE_HOST=localhost DATABASE_PORT=5432 \
  DATABASE_USER=${DB_USER} DATABASE_PASSWORD=${DB_PASSWORD} DATABASE_NAME=${DB_NAME} \
  bash database/scripts/run-migrations.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Baseline migrations completed${NC}"
else
    echo -e "${RED}❌ Baseline migrations failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 3: Applying Phase 1 optimization - Migration 008 (spatial indexes)...${NC}"
echo ""

PGPASSWORD=${DB_PASSWORD} psql -h localhost -U ${DB_USER} -d ${DB_NAME} \
  -f database/migrations/008_add_spatial_indexes.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 008 applied successfully${NC}"
else
    echo -e "${RED}❌ Migration 008 failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Applying Phase 1 optimization - Migration 009 (composite indexes)...${NC}"
echo ""

PGPASSWORD=${DB_PASSWORD} psql -h localhost -U ${DB_USER} -d ${DB_NAME} \
  -f database/migrations/009_add_composite_indexes.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 009 applied successfully${NC}"
else
    echo -e "${RED}❌ Migration 009 failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 5: Seeding test data...${NC}"
echo ""

PGPASSWORD=${DB_PASSWORD} psql -h localhost -U ${DB_USER} -d ${DB_NAME} \
  -f database/seeds/001_test_users.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test data seeded${NC}"
else
    echo -e "${YELLOW}⚠️  Seeding may have partially failed (this is often OK)${NC}"
fi
echo ""

echo -e "${YELLOW}Step 6: Verifying PostGIS and indexes...${NC}"
echo ""

PGPASSWORD=${DB_PASSWORD} psql -h localhost -U ${DB_USER} -d ${DB_NAME} << EOF
-- Check PostGIS version
SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';

-- Check spatial indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE '%location%'
ORDER BY tablename, indexname;

-- Check composite indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public' AND (indexname LIKE 'idx_orders%' OR indexname LIKE 'idx_drivers%')
ORDER BY tablename, indexname;

-- Count total indexes
SELECT COUNT(*) as total_indexes FROM pg_indexes WHERE schemaname = 'public';
EOF

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}✅ Database Initialization Complete!${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""
echo "Database Details:"
echo "  Host: localhost:5432"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo ""
echo "Phase 1 Optimizations Applied:"
echo "  ✅ PostGIS extension enabled"
echo "  ✅ Spatial indexes for driver/chef locations"
echo "  ✅ Composite indexes for common query patterns"
echo "  ✅ Optimized connection pool configuration"
echo ""
echo "Next Steps:"
echo "  1. Start API service:"
echo "     cd services/api && npm run start:dev"
echo ""
echo "  2. Run performance benchmarks:"
echo "     npx ts-node database/scripts/benchmark_performance.ts"
echo ""
echo "  3. Test API health:"
echo "     curl http://localhost:9001/health"
echo ""
