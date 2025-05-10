#!/bin/bash
# PostgreSQL database migration script for Philosophy Service
# Applies migrations to the database in sequence

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables if .env file exists
if [ -f .env ]; then
  source .env
fi

# Configuration
DB_NAME=${POSTGRES_DB:-philosophy}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-./db/postgres/migrations}
SCHEMA_VERSION_TABLE="schema_version"

# Print header
echo "-------------------------------------------------------------"
echo "PostgreSQL Database Migration"
echo "-------------------------------------------------------------"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Migrations directory: $MIGRATIONS_DIR"
echo "-------------------------------------------------------------"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Error: Migrations directory does not exist."
  exit 1
fi

# Use PGPASSWORD to avoid password prompt
export PGPASSWORD="$DB_PASSWORD"

# Check if database exists
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ -z "$DB_EXISTS" ]; then
  echo "Creating database $DB_NAME..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
  echo "Database created."
fi

# Connect to the database
echo "Connecting to database..."

# Check if schema_version table exists
SCHEMA_TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT to_regclass('public.$SCHEMA_VERSION_TABLE')")

if [ -z "$SCHEMA_TABLE_EXISTS" ]; then
  echo "Creating schema version table..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    CREATE TABLE $SCHEMA_VERSION_TABLE (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      description TEXT
    );
  "
  echo "Schema version table created."
fi

# Get applied migrations
echo "Checking applied migrations..."
APPLIED_MIGRATIONS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT version FROM $SCHEMA_VERSION_TABLE ORDER BY id")
APPLIED_COUNT=$(echo "$APPLIED_MIGRATIONS" | grep -v '^$' | wc -l)

echo "Found $APPLIED_COUNT applied migrations."

# Get available migration files
AVAILABLE_MIGRATIONS=$(ls -1 "$MIGRATIONS_DIR"/*.sql | sort)
AVAILABLE_COUNT=$(echo "$AVAILABLE_MIGRATIONS" | grep -v '^$' | wc -l)

echo "Found $AVAILABLE_COUNT available migrations."
echo "-------------------------------------------------------------"

# Apply migrations
APPLIED_COUNT=0

for MIGRATION_FILE in $AVAILABLE_MIGRATIONS; do
  FILENAME=$(basename "$MIGRATION_FILE")
  VERSION="${FILENAME%%_*}"
  DESCRIPTION=$(grep -m 1 "Description:" "$MIGRATION_FILE" | sed 's/.*Description: //')
  
  # Check if migration has been applied
  if echo "$APPLIED_MIGRATIONS" | grep -q "^$VERSION\$"; then
    echo "Migration $VERSION already applied: $DESCRIPTION"
  else
    echo "Applying migration $VERSION: $DESCRIPTION"
    
    # Execute migration
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"
    
    # Record migration
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
      INSERT INTO $SCHEMA_VERSION_TABLE (version, description)
      VALUES ('$VERSION', '$DESCRIPTION');
    "
    
    echo "Migration $VERSION applied successfully."
    ((APPLIED_COUNT++))
  fi
done

# Cleanup
unset PGPASSWORD

# Print summary
echo "-------------------------------------------------------------"
echo "Migration summary:"
echo "$APPLIED_COUNT migrations applied."
echo "Database is up to date."
echo "-------------------------------------------------------------"

if [ $APPLIED_COUNT -eq 0 ]; then
  echo "No new migrations to apply."
else
  echo "Migration process completed successfully!"
fi
