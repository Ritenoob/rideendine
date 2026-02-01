#!/bin/bash
# RideNDine PostgreSQL Restore Script
# This script restores a PostgreSQL backup
# Usage: ./restore.sh <backup_file>

set -e  # Exit on error

# Configuration
CONTAINER_NAME="ridendine_postgres"
DB_USER="ridendine"
DB_NAME="ridendine_dev"
BACKUP_FILE=$1

echo "========================================"
echo "RideNDine Database Restore"
echo "========================================"
echo "Timestamp: $(date)"
echo "Database: ${DB_NAME}"
echo "========================================"

# Validate backup file argument
if [ -z "${BACKUP_FILE}" ]; then
    echo "ERROR: No backup file specified"
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lht /home/nygmaee/Desktop/rideendine/backups/*.sql 2>/dev/null || echo "  No backups found"
    exit 1
fi

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    # Try with .gz extension
    if [ -f "${BACKUP_FILE}.gz" ]; then
        echo "Found compressed backup, decompressing..."
        gunzip -k "${BACKUP_FILE}.gz"
    else
        echo "ERROR: Backup file not found: ${BACKUP_FILE}"
        exit 1
    fi
fi

# Check if container is running
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "ERROR: PostgreSQL container '${CONTAINER_NAME}' is not running"
    echo "Start the container with: npm run db:up"
    exit 1
fi

# Confirm restore (destructive operation)
echo "WARNING: This will DROP and RECREATE the database '${DB_NAME}'"
echo "All current data will be lost!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo ""
echo "Step 1: Terminating active connections..."
docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

echo "Step 2: Dropping existing database..."
docker exec -i "${CONTAINER_NAME}" dropdb -U "${DB_USER}" --if-exists "${DB_NAME}"

echo "Step 3: Creating fresh database..."
docker exec -i "${CONTAINER_NAME}" createdb -U "${DB_USER}" "${DB_NAME}"

echo "Step 4: Restoring from backup..."
cat "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "Step 5: Verifying restore..."
TABLE_COUNT=$(docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "Tables restored: ${TABLE_COUNT}"

if [ "${TABLE_COUNT}" -gt 0 ]; then
    echo ""
    echo "SUCCESS: Database restored successfully"
    echo "Restore source: ${BACKUP_FILE}"
    echo "Tables: ${TABLE_COUNT}"
else
    echo ""
    echo "WARNING: Restore completed but no tables found"
fi

echo "========================================"
echo "Restore completed"
echo "========================================"
