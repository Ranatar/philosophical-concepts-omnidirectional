// Neo4j Migration: Create Constraints
// Description: Creates constraints for graph database to ensure uniqueness and indexing

// Create constraint for Concept nodes (uniqueness of concept_id)
CREATE CONSTRAINT unique_concept_id IF NOT EXISTS
FOR (c:Concept)
REQUIRE c.concept_id IS UNIQUE;

// Create constraint for Category nodes (uniqueness of category_id)
CREATE CONSTRAINT unique_category_id IF NOT EXISTS
FOR (c:Category)
REQUIRE c.category_id IS UNIQUE;

// Add existence constraint on required Category properties
CREATE CONSTRAINT category_name_exists IF NOT EXISTS
FOR (c:Category)
REQUIRE c.name IS NOT NULL;

CREATE CONSTRAINT category_concept_id_exists IF NOT EXISTS
FOR (c:Category)
REQUIRE c.concept_id IS NOT NULL;

// Create constraint for relationship ID property (used in RELATED_TO relationships)
CREATE CONSTRAINT unique_relationship_id IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
REQUIRE r.relationship_id IS UNIQUE;

// Add existence constraint on required relationship properties
CREATE CONSTRAINT relationship_type_exists IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
REQUIRE r.type IS NOT NULL;

CREATE CONSTRAINT relationship_concept_id_exists IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
REQUIRE r.concept_id IS NOT NULL;

// Create constraint for Philosopher nodes (if used in the graph)
CREATE CONSTRAINT unique_philosopher_id IF NOT EXISTS
FOR (p:Philosopher)
REQUIRE p.philosopher_id IS UNIQUE;

// Create constraint for Tradition nodes (if used in the graph)
CREATE CONSTRAINT unique_tradition_id IF NOT EXISTS
FOR (t:Tradition)
REQUIRE t.tradition_id IS UNIQUE;

// Log migration completion
CALL apoc.log.info("Migration 00001_create_constraints completed successfully");
