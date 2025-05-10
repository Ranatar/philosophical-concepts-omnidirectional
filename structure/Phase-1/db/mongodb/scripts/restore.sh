#!/bin/bash
# MongoDB database restore script for Philosophy Service
# Restores a database from a backup file

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables if .env file exists
if [ -f .env ]; then
  source .env
fi

# Configuration
MONGO_HOST=${MONGO_HOST:-localhost}
MONGO_PORT=${MONGO_PORT:-27017}
MONGO_USER=${MONGO_USER:-mongo}
MONGO_PASSWORD=${MONGO_PASSWORD:-mongo}
MONGO_DB=${MONGO_DB:-philosophy}
MONGO_AUTH_DB=${MONGO_AUTH_DB:-admin}
BACKUP_DIR=${BACKUP_DIR:-./backups/mongodb}
TEMP_DIR=${TEMP_DIR:-/tmp/mongodb_restore}

# Print header
echo "-------------------------------------------------------------"
echo "MongoDB Database Restore"
echo "-------------------------------------------------------------"
echo "Database: $MONGO_DB"
echo "Host: $MONGO_HOST:$MONGO_PORT"
echo "User: $MONGO_USER"
echo "Backup directory: $BACKUP_DIR"
echo "-------------------------------------------------------------"

# Check if mongorestore is available
if ! command -v mongorestore &> /dev/null; then
  echo "Error: mongorestore command not found. Please make sure MongoDB tools are installed correctly."
  exit 1
fi

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Backup directory does not exist."
  exit 1
fi

# List available backups
echo "Available backups:"
BACKUPS=($(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null))
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
BACKUP_NAME="${BACKUP_FILENAME%.tar.gz}"

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
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Extract the backup
echo "Extracting backup file..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Check if backup was extracted successfully
if [ ! -d "$TEMP_DIR/$BACKUP_NAME/$MONGO_DB" ]; then
  echo "Error: Backup extraction failed or backup is corrupt."
  exit 1
fi

# Drop the existing database (optional)
echo "Dropping existing database..."
mongo -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase "$MONGO_AUTH_DB" --host "$MONGO_HOST" --port "$MONGO_PORT" --eval "db.getSiblingDB('$MONGO_DB').dropDatabase()"

# Restore the database
echo "Restoring database from backup..."
mongorestore \
  --host "$MONGO_HOST" \
  --port "$MONGO_PORT" \
  --username "$MONGO_USER" \
  --password "$MONGO_PASSWORD" \
  --authenticationDatabase "$MONGO_AUTH_DB" \
  --db "$MONGO_DB" \
  --drop \
  "$TEMP_DIR/$BACKUP_NAME/$MONGO_DB"

# Check if restore was successful
if [ $? -ne 0 ]; then
  echo "Error: Restore failed."
  exit 1
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "Restore completed at $(date)"
echo "Database restored from $BACKUP_FILENAME"
echo "-------------------------------------------------------------"

# Verify restore
echo "Verifying restored database..."
COLLECTIONS_COUNT=$(mongo -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase "$MONGO_AUTH_DB" --host "$MONGO_HOST" --port "$MONGO_PORT" --quiet --eval "db.getSiblingDB('$MONGO_DB').getCollectionNames().length")

echo "Found $COLLECTIONS_COUNT collections in the restored database."

# List collections
echo "Collections in the restored database:"
mongo -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase "$MONGO_AUTH_DB" --host "$MONGO_HOST" --port "$MONGO_PORT" --quiet --eval "db.getSiblingDB('$MONGO_DB').getCollectionNames()"

echo "-------------------------------------------------------------"
echo "Restore process completed successfully!"
