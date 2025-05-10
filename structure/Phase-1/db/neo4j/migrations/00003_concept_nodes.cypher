// Neo4j Migration: Concept Nodes
// Description: Creates initial structure for Concept nodes

// Create schema for Concept nodes with required properties
// This is mostly documentational as Neo4j is schema-less but helps enforce consistency
CREATE CONSTRAINT concept_structure IF NOT EXISTS
FOR (c:Concept)
REQUIRE c.concept_id IS NOT NULL
AND c.name IS NOT NULL
AND c.creation_date IS NOT NULL;

// Create schema lookup for Concept properties (to help application code)
CALL apoc.meta.subGraph({
  includeLabels: ["Concept"]
}) YIELD nodes, relationships
WITH nodes, relationships
CALL apoc.log.info("Created concept schema with properties:
  concept_id: UUID,
  name: String,
  description: String,
  is_synthesis: Boolean,
  parent_concepts: List,
  focus: String,
  creator_id: UUID,
  creation_date: DateTime,
  last_modified: DateTime,
  status: String,
  metadata: Map
") RETURN 1 AS success;

// Create Concept label constraint (already defined in 00001, but reinforced here)
CREATE CONSTRAINT concept_label IF NOT EXISTS
FOR (c:Concept)
REQUIRE c:Concept;

// Create relationship between Concept and Category (to be used later)
CALL apoc.log.info("Defined INCLUDES relationship pattern:
  (c:Concept)-[:INCLUDES]->(cat:Category)
  Properties:
    None (relationship is structural only)
") RETURN 1 AS success;

// Create helper procedure for adding Concept nodes
// This could be used by application code or other migrations
CALL apoc.custom.asProcedure(
  "createConcept",
  "CALL apoc.periodic.iterate(
    \"UNWIND $params AS param RETURN param\",
    \"CREATE (c:Concept {
      concept_id: param.concept_id,
      name: param.name,
      description: COALESCE(param.description, ''),
      is_synthesis: COALESCE(param.is_synthesis, false),
      parent_concepts: COALESCE(param.parent_concepts, []),
      focus: param.focus,
      creator_id: param.creator_id,
      creation_date: datetime(COALESCE(param.creation_date, datetime())),
      last_modified: datetime(COALESCE(param.last_modified, datetime())),
      status: param.status,
      metadata: COALESCE(param.metadata, {})
    }) RETURN c\",
    {batchSize:100, params: {params: $params}}
  )",
  "VOID",
  [["params", "LIST OF MAP"]],
  "Creates concept nodes in batches",
  true
);

// Create procedure for connecting concepts to categories
CALL apoc.custom.asProcedure(
  "connectConceptToCategories",
  "CALL apoc.periodic.iterate(
    \"UNWIND $pairs AS pair RETURN pair\",
    \"MATCH (c:Concept {concept_id: pair.concept_id})
     MATCH (cat:Category {category_id: pair.category_id})
     MERGE (c)-[:INCLUDES]->(cat)\",
    {batchSize:1000, params: {pairs: $pairs}}
  )",
  "VOID",
  [["pairs", "LIST OF MAP"]],
  "Connects concepts to categories with INCLUDES relationships",
  true
);

// Log migration completion
CALL apoc.log.info("Migration 00003_concept_nodes completed successfully");
