#!/bin/bash
# PostgreSQL database restore script for Philosophy Service
# Restores a database from a backup file

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
BACKUP_DIR=${BACKUP_DIR:-./backups/postgres}

# Print header
echo "-------------------------------------------------------------"
echo "PostgreSQL Database Restore"
echo "-------------------------------------------------------------"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Backup directory: $BACKUP_DIR"
echo "-------------------------------------------------------------"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Backup directory does not exist."
  exit 1
fi

# List available backups
echo "Available backups:"
BACKUPS=($(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null))
NUM_BACKUPS=${#BACKUPS[@]}

if [ "$NUM_BACKUPS" -eq 0 ]; then
  echo "No backups found in $BACKUP_DIR"
  exit 1
fi

# Display available backups
for i in "${!BACKUPS[@]}"; do
  FILENAME=$(basename "${BACKUPS[$i]}")
  FILESIZE=$(du -h "${BACKUPS[$i]}" | cut -f1)
  echo "[$i] $FILENAME ($FILESIZE)"
done

# Ask user to select a backup
echo "-------------------------------------------------------------"
if [ -z "$1" ]; then
  read -p "Enter backup number to restore [0-$((NUM_BACKUPS-1))]: " BACKUP_INDEX
else
  BACKUP_INDEX="$1"
  echo "Using backup index: $BACKUP_INDEX"
fi

# Validate user input
if ! [[ "$BACKUP_INDEX" =~ ^[0-9]+$ ]] || [ "$BACKUP_INDEX" -ge "$NUM_BACKUPS" ]; then
  echo "Error: Invalid backup selection."
  exit 1
fi

BACKUP_FILE="${BACKUPS[$BACKUP_INDEX]}"
BACKUP_FILENAME=$(basename "$BACKUP_FILE")

echo "Selected backup: $BACKUP_FILENAME"
echo "-------------------------------------------------------------"

# Confirm restore operation
if [ -z "$2" ]; then
  read -p "WARNING: This will overwrite the current database! Continue? (y/n): " CONFIRM
  if [[ "$CONFIRM" != [yY] ]]; then
    echo "Restore operation cancelled."
    exit 0
  fi
else
  echo "Auto-confirming restore operation."
fi

echo "Starting restore at $(date)"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
TEMP_SQL="$TEMP_DIR/backup.sql"

echo "Decompressing backup file..."
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

# Use PGPASSWORD to avoid password prompt
export PGPASSWORD="$DB_PASSWORD"

# Drop and recreate database
echo "Dropping existing database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';" postgres
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" postgres
echo "Creating new database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" postgres

# Restore from backup
echo "Restoring from backup..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$TEMP_SQL"

# Cleanup
unset PGPASSWORD
rm -rf "$TEMP_DIR"

echo "Restore completed at $(date)"
echo "Database restored from $BACKUP_FILENAME"
echo "-------------------------------------------------------------"
echo "Restore process completed successfully!"
