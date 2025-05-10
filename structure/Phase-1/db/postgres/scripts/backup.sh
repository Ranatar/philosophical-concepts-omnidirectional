#!/bin/bash
# PostgreSQL database backup script for Philosophy Service
# Creates a full database backup and stores it with timestamp

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
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/philosophy_backup_$DATE.sql"
COMPRESSED_BACKUP="$BACKUP_FILE.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Print status
echo "-------------------------------------------------------------"
echo "PostgreSQL Database Backup"
echo "-------------------------------------------------------------"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Backup file: $COMPRESSED_BACKUP"
echo "-------------------------------------------------------------"
echo "Starting backup at $(date)"

# Use PGPASSWORD to avoid password prompt
export PGPASSWORD="$DB_PASSWORD"

# Create backup
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

# Unset password
unset PGPASSWORD

# Calculate backup size
BACKUP_SIZE=$(du -h "$COMPRESSED_BACKUP" | cut -f1)

# Print status
echo "Backup completed at $(date)"
echo "Backup size: $BACKUP_SIZE"
echo "Backup location: $COMPRESSED_BACKUP"
echo "-------------------------------------------------------------"

# List all backups
echo "Available backups:"
ls -lh "$BACKUP_DIR" | grep ".sql.gz"
echo "-------------------------------------------------------------"

# Optional: Keep only the last X backups
MAX_BACKUPS=${MAX_BACKUPS:-10}
NUM_BACKUPS=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)

if [ "$NUM_BACKUPS" -gt "$MAX_BACKUPS" ]; then
  echo "Removing old backups (keeping the last $MAX_BACKUPS)..."
  ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +$((MAX_BACKUPS+1)) | xargs rm -f
  echo "Old backups removed."
fi

echo "Backup process completed successfully!"
