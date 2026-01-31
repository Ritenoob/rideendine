#!/bin/bash

# This script runs automatically when PostgreSQL container starts
# It executes all migration files in order

set -e

echo "Running database migrations..."

# Navigate to migrations directory
MIGRATIONS_DIR="/docker-entrypoint-initdb.d/migrations"

if [ -d "$MIGRATIONS_DIR" ]; then
    # Execute migrations in alphabetical order
    for migration in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$migration" ]; then
            echo "Applying migration: $(basename "$migration")"
            psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$migration"
        fi
    done
    echo "All migrations applied successfully!"
else
    echo "No migrations directory found at $MIGRATIONS_DIR"
fi
