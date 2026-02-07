#!/bin/bash
# Database migration script for Railway deployment

echo "Running database migrations..."

# Run all migration files in order
for migration in /app/migrations/*.sql; do
    echo "Applying migration: $(basename $migration)"
    psql $DATABASE_URL -f "$migration"
done

echo "Migrations completed!"
