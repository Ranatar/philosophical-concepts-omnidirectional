// Neo4j Migration: Create Indexes
// Description: Creates indexes to optimize query performance in the graph database

// Create index for Concept nodes by name (non-unique)
CREATE INDEX concept_name_index IF NOT EXISTS
FOR (c:Concept)
ON (c.name);

// Create composite index for Concept nodes by name and creation_date
CREATE INDEX concept_name_creation_index IF NOT EXISTS
FOR (c:Concept)
ON (c.name, c.creation_date);

// Create index for Category nodes by name (non-unique)
CREATE INDEX category_name_index IF NOT EXISTS
FOR (c:Category)
ON (c.name);

// Create index for Category nodes by concept_id (to find all categories of a concept)
CREATE INDEX category_concept_id_index IF NOT EXISTS
FOR (c:Category)
ON (c.concept_id);

// Create composite index for Category nodes by name and concept_id
CREATE INDEX category_name_concept_id_index IF NOT EXISTS
FOR (c:Category)
ON (c.name, c.concept_id);

// Create index for centrality property in Category nodes
CREATE INDEX category_centrality_index IF NOT EXISTS
FOR (c:Category)
ON (c.centrality);

// Create index for RELATED_TO relationships by type
CREATE INDEX relationship_type_index IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
ON (r.type);

// Create index for RELATED_TO relationships by concept_id
CREATE INDEX relationship_concept_id_index IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
ON (r.concept_id);

// Create composite index for RELATED_TO relationships by type and concept_id
CREATE INDEX relationship_type_concept_id_index IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
ON (r.type, r.concept_id);

// Create index for strength property in RELATED_TO relationships
CREATE INDEX relationship_strength_index IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
ON (r.strength);

// Create index for Philosopher nodes by name (if used in the graph)
CREATE INDEX philosopher_name_index IF NOT EXISTS
FOR (p:Philosopher)
ON (p.name);

// Create index for Tradition nodes by name (if used in the graph)
CREATE INDEX tradition_name_index IF NOT EXISTS
FOR (t:Tradition)
ON (t.name);

// Log migration completion
CALL apoc.log.info("Migration 00002_create_indexes completed successfully");
