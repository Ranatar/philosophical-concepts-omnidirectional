#!/bin/bash
# MongoDB database initialization script for Philosophy Service
# Sets up a MongoDB instance and applies migrations

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
MIGRATIONS_DIR=${MIGRATIONS_DIR:-./db/mongodb/migrations}
SEED_DIR=${SEED_DIR:-./db/mongodb/seeds}

# Print header
echo "-------------------------------------------------------------"
echo "MongoDB Database Initialization"
echo "-------------------------------------------------------------"
echo "Database: $MONGO_DB"
echo "Host: $MONGO_HOST:$MONGO_PORT"
echo "User: $MONGO_USER"
echo "Migrations directory: $MIGRATIONS_DIR"
echo "Seed directory: $SEED_DIR"
echo "-------------------------------------------------------------"

# Check if mongo shell is available
if ! command -v mongo &> /dev/null; then
  echo "Error: mongo shell not found. Please make sure MongoDB is installed correctly."
  echo "You may need to add the MongoDB bin directory to your PATH."
  exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
  echo "Error: node not found. Please make sure Node.js is installed correctly."
  exit 1
fi

# Function to check MongoDB connection
check_connection() {
  echo "Checking connection to MongoDB..."
  if mongo --quiet \
    --host "$MONGO_HOST" \
    --port "$MONGO_PORT" \
    --username "$MONGO_USER" \
    --password "$MONGO_PASSWORD" \
    --authenticationDatabase "$MONGO_AUTH_DB" \
    --eval "db.getSiblingDB('$MONGO_DB').runCommand({ping: 1})" \
    > /dev/null; then
    echo "Connection to MongoDB established."
    return 0
  else
    echo "Failed to connect to MongoDB."
    return 1
  fi
}

# Try connecting to MongoDB, retry a few times if it fails
RETRY_COUNT=0
RETRY_LIMIT=5
RETRY_INTERVAL=10

until check_connection; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $RETRY_LIMIT ]; then
    echo "Failed to connect to MongoDB after $RETRY_LIMIT attempts. Exiting."
    exit 1
  fi
  echo "Retrying in $RETRY_INTERVAL seconds... (Attempt $RETRY_COUNT/$RETRY_LIMIT)"
  sleep $RETRY_INTERVAL
done

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Error: Migrations directory does not exist."
  exit 1
fi

# Create temporary migration runner
TEMP_DIR=$(mktemp -d)
MIGRATION_RUNNER="$TEMP_DIR/migration-runner.js"

cat > "$MIGRATION_RUNNER" << EOF
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  // Connection URL
  const url = 'mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_AUTH_DB}';
  const client = new MongoClient(url);
  
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected to MongoDB server');
    
    // Get the database
    const db = client.db('${MONGO_DB}');
    
    // Check if migrations collection exists, create it if not
    const collections = await db.listCollections({ name: 'migrations' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('migrations');
      console.log('Created migrations collection');
    }
    
    // Get applied migrations
    const appliedMigrations = await db.collection('migrations').find().toArray();
    const appliedMigrationNames = appliedMigrations.map(m => m.name);
    console.log('Applied migrations:', appliedMigrationNames.length ? appliedMigrationNames.join(', ') : 'None');
    
    // Get available migration files
    const migrationsDir = '${MIGRATIONS_DIR}';
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    console.log('Available migrations:', migrationFiles.join(', '));
    
    // Apply migrations
    let appliedCount = 0;
    
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.js');
      
      // Skip if already applied
      if (appliedMigrationNames.includes(migrationName)) {
        console.log(\`Migration \${migrationName} already applied\`);
        continue;
      }
      
      // Load migration module
      const migrationPath = path.join(migrationsDir, file);
      const migration = require(migrationPath);
      
      // Run migration
      console.log(\`Applying migration \${migrationName}...\`);
      const result = await migration.up(db);
      
      if (result.success) {
        // Record applied migration
        await db.collection('migrations').insertOne({
          name: migrationName,
          applied_at: new Date()
        });
        
        console.log(\`Migration \${migrationName} applied successfully\`);
        appliedCount++;
      } else {
        console.error(\`Migration \${migrationName} failed: \${result.error}\`);
        process.exit(1);
      }
    }
    
    console.log(\`\${appliedCount} migrations applied\`);
    
    // Apply seed data if specified and no data exists
    if (process.argv.includes('--seed') && fs.existsSync('${SEED_DIR}')) {
      const seedFiles = fs.readdirSync('${SEED_DIR}')
        .filter(file => file.endsWith('.js'))
        .sort();
      
      const shouldSeed = await shouldApplySeeds(db);
      
      if (shouldSeed) {
        console.log('Database is empty. Applying seed data...');
        
        for (const file of seedFiles) {
          const seedName = path.basename(file, '.js');
          const seedPath = path.join('${SEED_DIR}', file);
          
          console.log(\`Applying seed \${seedName}...\`);
          const seed = require(seedPath);
          
          const result = await seed.run(db);
          
          if (result.success) {
            console.log(\`Seed \${seedName} applied successfully\`);
          } else {
            console.error(\`Seed \${seedName} failed: \${result.error}\`);
            process.exit(1);
          }
        }
        
        console.log('Seed data applied successfully');
      } else {
        console.log('Database already contains data. Skipping seed data.');
      }
    }
    
    console.log('Database is now ready for use');
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function shouldApplySeeds(db) {
  // Check if collections have data
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name).filter(name => name !== 'migrations');
  
  if (collectionNames.length === 0) {
    return true;
  }
  
  // Check if collections are empty
  for (const name of collectionNames) {
    const count = await db.collection(name).countDocuments();
    if (count > 0) {
      return false;
    }
  }
  
  return true;
}

runMigrations().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
EOF

# Run migrations
echo "Running migrations..."
node "$MIGRATION_RUNNER" --seed

# Cleanup
rm -rf "$TEMP_DIR"

echo "-------------------------------------------------------------"
echo "MongoDB initialization completed successfully!"
