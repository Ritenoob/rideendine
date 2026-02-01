#!/bin/bash
# RideNDine PostgreSQL Backup Script
# This script creates a timestamped backup of the PostgreSQL database
# Usage: ./backup.sh [backup_name]

set -e  # Exit on error

# Configuration
BACKUP_DIR="/home/nygmaee/Desktop/rideendine/backups"
CONTAINER_NAME="ridendine_postgres"
DB_USER="ridendine"
DB_NAME="ridendine_dev"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=${1:-"ridendine_${TIMESTAMP}"}
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "========================================"
echo "RideNDine Database Backup"
echo "========================================"
echo "Timestamp: $(date)"
echo "Database: ${DB_NAME}"
echo "Backup file: ${BACKUP_FILE}"
echo "========================================"

# Check if container is running
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "ERROR: PostgreSQL container '${CONTAINER_NAME}' is not running"
    echo "Start the container with: npm run db:up"
    exit 1
fi

# Create backup
echo "Creating backup..."
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" > "${BACKUP_FILE}"

# Check if backup was successful
if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "SUCCESS: Backup created successfully"
    echo "Size: ${BACKUP_SIZE}"
    echo "Location: ${BACKUP_FILE}"

    # Create a compressed version
    echo "Creating compressed backup..."
    gzip -k "${BACKUP_FILE}"
    COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "Compressed: ${BACKUP_FILE}.gz (${COMPRESSED_SIZE})"

    # List recent backups
    echo ""
    echo "Recent backups:"
    ls -lht "${BACKUP_DIR}" | head -n 6
else
    echo "ERROR: Backup failed or file is empty"
    exit 1
fi

echo "========================================"
echo "Backup completed successfully"
echo "========================================"
