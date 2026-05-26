#!/bin/bash
echo "Setting up RDA local database..."

# Start PostgreSQL if not running
sudo service postgresql start
sleep 2

# Create user and DB if they don't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='rda_app'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER rda_app WITH PASSWORD 'localdevpassword';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='rda'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE rda OWNER rda_app;"

sudo -u postgres psql -d rda -c "GRANT ALL ON SCHEMA public TO rda_app;"

echo "Applying schema..."
PGPASSWORD=RDApassword psql \
  -h localhost \
  -U rda_app \
  -d rda \
  -f "$(dirname "$0")/schema.sql"

echo "Database setup complete!"
