#!/bin/bash

# RideNDine Database Migration Runner
# This script waits for PostgreSQL and runs all migrations in sequence

set -e

# Configuration
POSTGRES_HOST="${DATABASE_HOST:-localhost}"
POSTGRES_PORT="${DATABASE_PORT:-5432}"
POSTGRES_USER="${DATABASE_USER:-ridendine}"
POSTGRES_PASSWORD="${DATABASE_PASSWORD:-ridendine_dev_password}"
POSTGRES_DB="${DATABASE_NAME:-ridendine_dev}"
MAX_RETRIES=30
RETRY_INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    log_info "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."

    local retries=0
    until PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c '\q' 2>/dev/null; do
        retries=$((retries + 1))

        if [ $retries -ge $MAX_RETRIES ]; then
            log_error "PostgreSQL did not become ready in time"
            exit 1
        fi

        log_warn "PostgreSQL is unavailable - sleeping ${RETRY_INTERVAL}s (attempt ${retries}/${MAX_RETRIES})"
        sleep $RETRY_INTERVAL
    done

    log_info "PostgreSQL is ready!"
}

# Run a single migration file
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")

    log_info "Running migration: ${migration_name}"

    if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -f "$migration_file" > /tmp/migration_${migration_name}.log 2>&1; then
        log_info "✓ Migration completed: ${migration_name}"
        return 0
    else
        log_error "✗ Migration failed: ${migration_name}"
        log_error "Error details:"
        cat /tmp/migration_${migration_name}.log
        return 1
    fi
}

# Main execution
main() {
    log_info "=== RideNDine Database Migration Runner ==="
    log_info "Target: ${POSTGRES_USER}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

    # Wait for database
    wait_for_postgres

    # Find all migration files
    MIGRATION_DIR="$(dirname "$0")/../migrations"

    if [ ! -d "$MIGRATION_DIR" ]; then
        log_error "Migration directory not found: $MIGRATION_DIR"
        exit 1
    fi

    # Get sorted list of migration files
    migration_files=$(find "$MIGRATION_DIR" -name "*.sql" -type f | sort)

    if [ -z "$migration_files" ]; then
        log_warn "No migration files found in $MIGRATION_DIR"
        exit 0
    fi

    # Count migrations
    migration_count=$(echo "$migration_files" | wc -l)
    log_info "Found ${migration_count} migration file(s)"

    # Run each migration
    failed_migrations=0
    completed_migrations=0

    for migration_file in $migration_files; do
        if run_migration "$migration_file"; then
            completed_migrations=$((completed_migrations + 1))
        else
            failed_migrations=$((failed_migrations + 1))
        fi
    done

    # Summary
    log_info "=== Migration Summary ==="
    log_info "Completed: ${completed_migrations}/${migration_count}"

    if [ $failed_migrations -gt 0 ]; then
        log_error "Failed: ${failed_migrations}"
        exit 1
    else
        log_info "All migrations completed successfully!"
        exit 0
    fi
}

# Run main function
main "$@"
