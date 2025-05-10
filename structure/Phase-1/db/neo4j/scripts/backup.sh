#!/bin/bash
# Neo4j database backup script for Philosophy Service
# Creates a full database backup using Neo4j's backup tools

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
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="philosophy_neo4j_backup_$DATE"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Print status
echo "-------------------------------------------------------------"
echo "Neo4j Database Backup"
echo "-------------------------------------------------------------"
echo "Neo4j Home: $NEO4J_HOME"
echo "Host: $NEO4J_HOST:$NEO4J_PORT"
echo "User: $NEO4J_USER"
echo "Backup path: $BACKUP_PATH"
echo "-------------------------------------------------------------"
echo "Starting backup at $(date)"

# Check if neo4j-admin is available
if ! command -v neo4j-admin &> /dev/null; then
  echo "Error: neo4j-admin command not found. Please make sure Neo4j is installed correctly."
  echo "You may need to add the Neo4j bin directory to your PATH."
  exit 1
fi

# Determine backup method based on Neo4j version
NEO4J_VERSION=$(neo4j --version | grep -oP 'Neo4j \K[0-9]+\.[0-9]+\.[0-9]+' || echo "Unknown")
echo "Detected Neo4j version: $NEO4J_VERSION"

# Function to perform backup for Neo4j 4.x
backup_neo4j_4() {
  echo "Using Neo4j 4.x backup method..."
  
  # Use neo4j-admin backup command for Neo4j 4.x
  neo4j-admin backup \
    --backup-dir="$BACKUP_PATH" \
    --name="$BACKUP_NAME" \
    --from="$NEO4J_HOST:6362" \
    --database=neo4j
}

# Function to perform backup for Neo4j 3.x
backup_neo4j_3() {
  echo "Using Neo4j 3.x backup method..."
  
  # Use neo4j-admin backup command for Neo4j 3.x
  neo4j-admin backup \
    --backup-dir="$BACKUP_PATH" \
    --name="$BACKUP_NAME" \
    --from="$NEO4J_HOST:6362"
}

# Function to perform backup using cypher-shell (fallback method)
backup_cypher_dump() {
  echo "Using cypher-shell dump method (fallback)..."
  
  # Create directory for cypher dump
  mkdir -p "$BACKUP_PATH"
  
  # Use cypher-shell to dump the database
  echo "Dumping schema (constraints and indexes)..."
  CYPHER_COMMAND="CALL apoc.export.cypher.schema('$BACKUP_PATH/schema.cypher', {format: 'plain'})"
  echo "$CYPHER_COMMAND" | cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT"
  
  echo "Dumping all data..."
  CYPHER_COMMAND="CALL apoc.export.cypher.all('$BACKUP_PATH/data.cypher', {format: 'plain'})"
  echo "$CYPHER_COMMAND" | cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT"
  
  # Create a manifest file with backup details
  cat > "$BACKUP_PATH/manifest.json" << EOL
{
  "backup_date": "$(date -Iseconds)",
  "neo4j_version": "$NEO4J_VERSION",
  "backup_method": "cypher-dump",
  "files": {
    "schema": "schema.cypher",
    "data": "data.cypher"
  }
}
EOL
}

# Try to perform backup based on version
if [[ "$NEO4J_VERSION" =~ ^4\. ]]; then
  backup_neo4j_4 || backup_cypher_dump
elif [[ "$NEO4J_VERSION" =~ ^3\. ]]; then
  backup_neo4j_3 || backup_cypher_dump
else
  backup_cypher_dump
fi

# Compress the backup
echo "Compressing backup..."
COMPRESSED_BACKUP="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
tar -czf "$COMPRESSED_BACKUP" -C "$BACKUP_DIR" "$BACKUP_NAME"

# Clean up uncompressed backup
if [ -d "$BACKUP_PATH" ]; then
  rm -rf "$BACKUP_PATH"
fi

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

echo "Backup process completed successfully!"
