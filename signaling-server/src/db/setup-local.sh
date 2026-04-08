#!/bin/bash
# Run this once to set up local development database

echo "Setting up RDA local database..."

# Start Docker container if not running
docker start rda-postgres 2>/dev/null || \
docker run --name rda-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=rda \
  -e POSTGRES_USER=rda_app \
  -p 5432:5432 \
  -d postgres:16

echo "Waiting for PostgreSQL to be ready..."
sleep 3

# Run schema
PGPASSWORD=localdevpassword psql \
  -h localhost \
  -U rda_app \
  -d rda \
  -f "$(dirname "$0")/schema.sql"

echo "Database setup complete!"