#!/bin/bash
# Neo4j database initialization script for Philosophy Service
# Sets up a Neo4j instance and applies migrations

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables if .env file exists
if [ -f .env ]; then
  source .env
fi

# Configuration
NEO4J_HOST=${NEO4J_HOST:-localhost}
NEO4J_PORT=${NEO4J_PORT:-7687}
NEO4J_USER=${NEO4J_USER:-neo4j}
NEO4J_PASSWORD=${NEO4J_PASSWORD:-password}
NEO4J_BROWSER_PORT=${NEO4J_BROWSER_PORT:-7474}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-./db/neo4j/migrations}
SEED_DIR=${SEED_DIR:-./db/neo4j/seeds}
SCHEMA_VERSION_KEY="neo4j.schema.version"

# Print header
echo "-------------------------------------------------------------"
echo "Neo4j Database Initialization"
echo "-------------------------------------------------------------"
echo "Host: $NEO4J_HOST:$NEO4J_PORT"
echo "User: $NEO4J_USER"
echo "Browser port: $NEO4J_BROWSER_PORT"
echo "Migrations directory: $MIGRATIONS_DIR"
echo "Seed directory: $SEED_DIR"
echo "-------------------------------------------------------------"

# Check if cypher-shell is available
if ! command -v cypher-shell &> /dev/null; then
  echo "Error: cypher-shell command not found. Please make sure Neo4j is installed correctly."
  echo "You may need to add the Neo4j bin directory to your PATH."
  exit 1
fi

# Function to check Neo4j connection
check_connection() {
  echo "Checking connection to Neo4j..."
  if cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT" \
    -c "RETURN 'Connection successful' AS message" > /dev/null; then
    echo "Connection to Neo4j established."
    return 0
  else
    echo "Failed to connect to Neo4j."
    return 1
  fi
}

# Try connecting to Neo4j, retry a few times if it fails
RETRY_COUNT=0
RETRY_LIMIT=5
RETRY_INTERVAL=10

until check_connection; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $RETRY_LIMIT ]; then
    echo "Failed to connect to Neo4j after $RETRY_LIMIT attempts. Exiting."
    exit 1
  fi
  echo "Retrying in $RETRY_INTERVAL seconds... (Attempt $RETRY_COUNT/$RETRY_LIMIT)"
  sleep $RETRY_INTERVAL
done

# Check if APOC plugin is installed
echo "Checking if APOC plugin is installed..."
APOC_INSTALLED=$(cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT" \
  -c "CALL dbms.procedures() YIELD name WHERE name STARTS WITH 'apoc' RETURN count(*) AS count" \
  | grep -o '[0-9]\+')

if [ "$APOC_INSTALLED" -eq "0" ]; then
  echo "Error: APOC plugin is not installed. It is required for migrations."
  echo "Please install APOC plugin and restart Neo4j."
  exit 1
else
  echo "APOC plugin is installed."
fi

# Create schema_version if it doesn't exist
echo "Setting up schema versioning..."
cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT" \
  -c "MERGE (sv:SchemaVersion {key: '$SCHEMA_VERSION_KEY'})
      ON CREATE SET sv.version = 0, sv.last_updated = datetime()
      RETURN sv.version"

# Get current schema version
CURRENT_VERSION=$(cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT" \
  -c "MATCH (sv:SchemaVersion {key: '$SCHEMA_VERSION_KEY'}) RETURN sv.version" \
  | grep -o '[0-9]\+')

echo "Current schema version: $CURRENT_VERSION"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Error: Migrations directory does not exist."
  exit 1
fi

# Get available migration files
AVAILABLE_MIGRATIONS=$(ls -1 "$MIGRATIONS_DIR"/*.cypher | sort)
AVAILABLE_COUNT=$(echo "$AVAILABLE_MIGRATIONS" | grep -v '^$' | wc -l)

echo "Found $AVAILABLE_COUNT available migrations."
echo "-------------------------------------------------------------"

# Apply migrations
APPLIED_COUNT=0

for MIGRATION_FILE in $AVAILABLE_MIGRATIONS; do
  FILENAME=$(basename "$MIGRATION_FILE")
  VERSION="${FILENAME%%_*}"
  VERSION_INT=$(echo "$VERSION" | sed 's/^0*//')
  
  # Check if migration needs to be applied
  if [ "$VERSION_INT" -gt "$CURRENT_VERSION" ]; then
    DESCRIPTION=$(grep -m 1 "Description:" "$MIGRATION_FILE" | sed 's/.*Description: //' || echo "No description found")
    
    echo "Applying migration $VERSION: $DESCRIPTION"
    
    # Execute migration
    cat "$MIGRATION_FILE" | cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT"
    
    # Update schema version
    cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT" \
      -c "MATCH (sv:SchemaVersion {key: '$SCHEMA_VERSION_KEY'})
          SET sv.version = $VERSION_INT, sv.last_updated = datetime()
          RETURN sv.version"
    
    echo "Migration $VERSION applied successfully."
    ((APPLIED_COUNT++))
  else
    echo "Migration $VERSION already applied."
  fi
done

# Apply seed data if no data exists yet
if [ -d "$SEED_DIR" ]; then
  echo "-------------------------------------------------------------"
  echo "Checking if seed data needs to be applied..."
  
  # Check if database is empty (no nodes except SchemaVersion)
  NODE_COUNT=$(cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT" \
    -c "MATCH (n) WHERE NOT n:SchemaVersion RETURN count(n) AS count" \
    | grep -o '[0-9]\+')
  
  if [ "$NODE_COUNT" -eq "0" ]; then
    echo "Database is empty. Applying seed data..."
    
    SEED_FILES=$(ls -1 "$SEED_DIR"/*.cypher | sort)
    
    for SEED_FILE in $SEED_FILES; do
      SEED_FILENAME=$(basename "$SEED_FILE")
      echo "Applying seed file: $SEED_FILENAME"
      
      # Execute seed file
      cat "$SEED_FILE" | cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT"
      
      echo "Seed file $SEED_FILENAME applied successfully."
    done
    
    echo "Seed data applied successfully."
  else
    echo "Database already contains data. Skipping seed data."
  fi
fi

# Print summary
echo "-------------------------------------------------------------"
echo "Initialization summary:"
echo "$APPLIED_COUNT migrations applied."
echo "Current schema version: $(cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "bolt://$NEO4J_HOST:$NEO4J_PORT" \
  -c "MATCH (sv:SchemaVersion {key: '$SCHEMA_VERSION_KEY'}) RETURN sv.version" \
  | grep -o '[0-9]\+')"
echo "Database is now ready for use."

# Show connection information
echo "-------------------------------------------------------------"
echo "Neo4j is available at:"
echo "Browser UI: http://$NEO4J_HOST:$NEO4J_BROWSER_PORT"
echo "Bolt URL: bolt://$NEO4J_HOST:$NEO4J_PORT"
echo "-------------------------------------------------------------"
echo "Initialization process completed successfully!"
