#!/bin/bash
# MongoDB database backup script for Philosophy Service
# Creates a full database backup and stores it with timestamp

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
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="philosophy_mongodb_backup_$DATE"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Print status
echo "-------------------------------------------------------------"
echo "MongoDB Database Backup"
echo "-------------------------------------------------------------"
echo "Database: $MONGO_DB"
echo "Host: $MONGO_HOST:$MONGO_PORT"
echo "User: $MONGO_USER"
echo "Backup path: $BACKUP_PATH"
echo "-------------------------------------------------------------"
echo "Starting backup at $(date)"

# Check if mongodump is available
if ! command -v mongodump &> /dev/null; then
  echo "Error: mongodump command not found. Please make sure MongoDB tools are installed correctly."
  exit 1
fi

# Create backup
mongodump \
  --host "$MONGO_HOST" \
  --port "$MONGO_PORT" \
  --username "$MONGO_USER" \
  --password "$MONGO_PASSWORD" \
  --authenticationDatabase "$MONGO_AUTH_DB" \
  --db "$MONGO_DB" \
  --out "$BACKUP_PATH"

# Check if backup was successful
if [ $? -ne 0 ]; then
  echo "Error: Backup failed."
  exit 1
fi

# Compress the backup
COMPRESSED_BACKUP="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
tar -czf "$COMPRESSED_BACKUP" -C "$BACKUP_DIR" "$BACKUP_NAME"

# Remove uncompressed backup
rm -rf "$BACKUP_PATH"

# Calculate backup size
BACKUP_SIZE=$(du -h "$COMPRESSED_BACKUP" | cut -f1)

# Print status
echo "Backup completed at $(date)"
echo "Backup size: $BACKUP_SIZE"
echo "Backup location: $COMPRESSED_BACKUP"
echo "-------------------------------------------------------------"

# List all backups
echo "Available backups:"
ls -lh "$BACKUP_DIR" | grep ".tar.gz"
echo "-------------------------------------------------------------"

# Optional: Keep only the last X backups
MAX_BACKUPS=${MAX_BACKUPS:-10}
NUM_BACKUPS=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)

if [ "$NUM_BACKUPS" -gt "$MAX_BACKUPS" ]; then
  echo "Removing old backups (keeping the last $MAX_BACKUPS)..."
  ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +$((MAX_BACKUPS+1)) | xargs rm -f
  echo "Old backups removed."
fi

# Create backup metadata file
METADATA_FILE="$BACKUP_DIR/backup_metadata.json"

# Check if the metadata file exists, create it if not
if [ ! -f "$METADATA_FILE" ]; then
  echo '[]' > "$METADATA_FILE"
fi

# Add backup metadata to the file
TMP_FILE=$(mktemp)
jq --arg name "$BACKUP_NAME.tar.gz" \
   --arg date "$(date -Iseconds)" \
   --arg size "$BACKUP_SIZE" \
   --arg path "$COMPRESSED_BACKUP" \
   '. + [{"name": $name, "date": $date, "size": $size, "path": $path}]' \
   "$METADATA_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$METADATA_FILE"

echo "Backup process completed successfully!"
