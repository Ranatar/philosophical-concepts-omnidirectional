#!/bin/bash
# Neo4j database restore script for Philosophy Service
# Restores database from a backup file

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables if .env file exists
if [ -f .env ]; then
  source .env
fi

# Configuration
NEO4J_HOME=${NEO4J_HOME:-/var/lib/neo4j}
NEO4J_HOST=${NEO4J_HOST:-localhost}
NEO4J_PORT=${NEO4J_PORT:-7687}
NEO4J_USER=${NEO4J_USER:-neo4j}
NEO4J_PASSWORD=${NEO4J_PASSWORD:-password}
BACKUP_DIR=${BACKUP_DIR:-./backups/neo4j}
TEMP_DIR=${TEMP_DIR:-/tmp/neo4j_restore}

# Print header
echo "-------------------------------------------------------------"
echo "Neo4j Database Restore"
echo "-------------------------------------------------------------"
echo "Neo4j Home: $NEO4J_HOME"
echo "Host: $NEO4J_HOST:$NEO4J_PORT"
echo "User: $NEO4J_USER"
echo "Backup directory: $BACKUP_DIR"
echo "-------------------------------------------------------------"

# Check if neo4j-admin is available
if ! command -v neo4j-admin &> /dev/null; then
  echo "Error: neo4j-admin command not found. Please make sure Neo4j is installed correctly."
  echo "You may need to add the Neo4j bin directory to your PATH."
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

# Determine restore method based on backup contents
if [ -f "$TEMP_DIR/$BACKUP_NAME/manifest.json" ]; then
  echo "Found manifest file, determining restore method..."
  
  # Check for backup method in manifest
  BACKUP_METHOD=$(grep -o '"backup_method": "[^"]*"' "$TEMP_DIR/$BACKUP_NAME/manifest.json" | cut -d '"' -f 4)
  
  if [ "$BACKUP_METHOD" == "cypher-dump" ]; then
    echo "Using cypher-dump restore method..."
    
    # Stop Neo4j service
    echo "Stopping Neo4j service..."
    sudo systemctl stop neo4j || echo "Warning: Could not stop Neo4j service. Please stop it manually."
    
    # Clearing existing database (optional based on confirmation)
    echo "Clearing existing database..."
    CLEAR_DB_DIR="$NEO4J_HOME/data/databases/neo4j"
    
    if [ -d "$CLEAR_DB_DIR" ]; then
      read -p "WARNING: This will delete all data in $CLEAR_DB_DIR. Continue? (y/n): " CONFIRM_CLEAR
      
      if [[ "$CONFIRM_CLEAR" == [yY] ]]; then
        sudo rm -rf "$CLEAR_DB_DIR"/*
      fi
    fi
    
    # Start Neo4j service
    echo "Starting Neo4j service..."
    sudo systemctl start neo4j || echo "Warning: Could not start Neo4j service. Please start it manually."
    sleep 10  # Wait for Neo4j to start
    
    # Run schema script
    echo "Restoring schema..."
    cat "$TEMP_DIR/$BACKUP_NAME/schema.cypher" | cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT"
    
    # Run data script
    echo "Restoring data..."
    cat "$TEMP_DIR/$BACKUP_NAME/data.cypher" | cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT"
  else
    # Use neo4j-admin restore for standard backups
    echo "Using neo4j-admin restore method..."
    
    # Stop Neo4j service
    echo "Stopping Neo4j service..."
    sudo systemctl stop neo4j || echo "Warning: Could not stop Neo4j service. Please stop it manually."
    
    # Restore using neo4j-admin
    sudo neo4j-admin restore \
      --from="$TEMP_DIR/$BACKUP_NAME" \
      --database=neo4j \
      --force
    
    # Start Neo4j service
    echo "Starting Neo4j service..."
    sudo systemctl start neo4j || echo "Warning: Could not start Neo4j service. Please start it manually."
  fi
else
  echo "No manifest file found, assuming standard backup format..."
  
  # Stop Neo4j service
  echo "Stopping Neo4j service..."
  sudo systemctl stop neo4j || echo "Warning: Could not stop Neo4j service. Please stop it manually."
  
  # Restore using neo4j-admin
  sudo neo4j-admin restore \
    --from="$TEMP_DIR/$BACKUP_NAME" \
    --database=neo4j \
    --force
  
  # Start Neo4j service
  echo "Starting Neo4j service..."
  sudo systemctl start neo4j || echo "Warning: Could not start Neo4j service. Please start it manually."
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "Restore completed at $(date)"
echo "Database restored from $BACKUP_FILENAME"
echo "-------------------------------------------------------------"
echo "Restore process completed successfully!"
