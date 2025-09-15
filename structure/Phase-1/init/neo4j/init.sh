#!/bin/bash
# Neo4j initialization script
# This script runs when the Neo4j container is first created

set -e

echo "Starting Neo4j initialization..."

# Wait for Neo4j to be ready
until cypher-shell -u neo4j -p neo4j123 "RETURN 1" >/dev/null 2>&1; do
    echo "Waiting for Neo4j to be ready..."
    sleep 2
done

echo "Neo4j is ready. Running initialization queries..."

# Create constraints and indexes
cypher-shell -u neo4j -p neo4j123 <<'EOF'
// Create constraints for unique identifiers
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (c:Concept) REQUIRE c.concept_id IS UNIQUE;
CREATE CONSTRAINT category_id_unique IF NOT EXISTS FOR (cat:Category) REQUIRE cat.category_id IS UNIQUE;

// Create indexes for better query performance
CREATE INDEX concept_name_index IF NOT EXISTS FOR (c:Concept) ON (c.name);
CREATE INDEX category_name_index IF NOT EXISTS FOR (cat:Category) ON (cat.name);
CREATE INDEX category_concept_index IF NOT EXISTS FOR (cat:Category) ON (cat.concept_id);
CREATE INDEX category_type_index IF NOT EXISTS FOR (cat:Category) ON (cat.type);
CREATE INDEX category_innovation_index IF NOT EXISTS FOR (cat:Category) ON (cat.innovation_degree);

// Create composite indexes
CREATE INDEX category_concept_name_index IF NOT EXISTS FOR (cat:Category) ON (cat.concept_id, cat.name);

// Create full-text search indexes
CALL db.index.fulltext.createNodeIndex("categorySearch", ["Category"], ["name", "definition"]) 
    IF NOT EXISTS;

// Set up APOC procedures if available
CALL apoc.help("apoc") YIELD name RETURN count(*) > 0 as apocInstalled;

// Log successful initialization
RETURN "Neo4j initialization completed successfully at " + datetime() as message;
EOF

# Create backup directory
mkdir -p /var/lib/neo4j/backups

# Set proper permissions
chown -R neo4j:neo4j /var/lib/neo4j/backups

echo "Neo4j initialization completed successfully!"