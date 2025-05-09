#!/bin/bash
# Initialize Neo4j database with constraints and indexes for development
# This script is executed when the container is first created

set -e

# Wait for Neo4j to be available
until cypher-shell -u neo4j -p password "RETURN 1;"; do
    echo "Waiting for Neo4j to be available..."
    sleep 1
done

echo "Neo4j is now available. Initializing..."

# Create uniqueness constraints
cypher-shell -u neo4j -p password "CREATE CONSTRAINT ON (c:Concept) ASSERT c.concept_id IS UNIQUE;"
cypher-shell -u neo4j -p password "CREATE CONSTRAINT ON (c:Category) ASSERT c.category_id IS UNIQUE;"

# Create indexes for better performance
cypher-shell -u neo4j -p password "CREATE INDEX ON :Concept(name);"
cypher-shell -u neo4j -p password "CREATE INDEX ON :Category(name);"
cypher-shell -u neo4j -p password "CREATE INDEX ON :Category(centrality);"

echo "Neo4j initialization completed successfully"
