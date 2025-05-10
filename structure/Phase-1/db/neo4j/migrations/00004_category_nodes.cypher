// Neo4j Migration: Category Nodes
// Description: Creates initial structure for Category nodes

// Create schema for Category nodes with required properties
CREATE CONSTRAINT category_structure IF NOT EXISTS
FOR (c:Category)
REQUIRE c.category_id IS NOT NULL
AND c.name IS NOT NULL
AND c.concept_id IS NOT NULL;

// Create schema lookup for Category properties
CALL apoc.meta.subGraph({
  includeLabels: ["Category"]
}) YIELD nodes, relationships
WITH nodes, relationships
CALL apoc.log.info("Created category schema with properties:
  category_id: UUID,
  concept_id: UUID,
  name: String,
  definition: String,
  centrality: Integer (1-5),
  certainty: Integer (1-5),
  historical_significance: Integer (1-5),
  traditions: List of String,
  philosophers: List of String,
  created_at: DateTime,
  updated_at: DateTime
") RETURN 1 AS success;

// Create Category label constraint
CREATE CONSTRAINT category_label IF NOT EXISTS
FOR (c:Category)
REQUIRE c:Category;

// Create helper procedure for adding Category nodes
CALL apoc.custom.asProcedure(
  "createCategory",
  "CALL apoc.periodic.iterate(
    \"UNWIND $params AS param RETURN param\",
    \"CREATE (c:Category {
      category_id: param.category_id,
      concept_id: param.concept_id,
      name: param.name,
      definition: COALESCE(param.definition, ''),
      centrality: COALESCE(param.centrality, 3),
      certainty: COALESCE(param.certainty, 3),
      historical_significance: COALESCE(param.historical_significance, 3),
      traditions: COALESCE(param.traditions, []),
      philosophers: COALESCE(param.philosophers, []),
      created_at: datetime(COALESCE(param.created_at, datetime())),
      updated_at: datetime(COALESCE(param.updated_at, datetime()))
    }) RETURN c\",
    {batchSize:100, params: {params: $params}}
  )",
  "VOID",
  [["params", "LIST OF MAP"]],
  "Creates category nodes in batches",
  true
);

// Create helper procedure for adding a relationship between two categories
CALL apoc.custom.asProcedure(
  "createCategoryRelationship",
  "MATCH (source:Category {category_id: $sourceId})
   MATCH (target:Category {category_id: $targetId})
   CREATE (source)-[r:RELATED_TO {
     relationship_id: $relationshipId,
     concept_id: $conceptId,
     type: $type,
     direction: $direction,
     strength: COALESCE($strength, 3),
     certainty: COALESCE($certainty, 3),
     description: COALESCE($description, ''),
     traditions: COALESCE($traditions, []),
     philosophers: COALESCE($philosophers, []),
     created_at: datetime(COALESCE($createdAt, datetime())),
     updated_at: datetime(COALESCE($updatedAt, datetime()))
   }]->(target)
   RETURN r",
  "RELATIONSHIP",
  [
    ["sourceId", "STRING"],
    ["targetId", "STRING"],
    ["relationshipId", "STRING"],
    ["conceptId", "STRING"],
    ["type", "STRING"],
    ["direction", "STRING"],
    ["strength", "INTEGER"],
    ["certainty", "INTEGER"],
    ["description", "STRING"],
    ["traditions", "LIST OF STRING"],
    ["philosophers", "LIST OF STRING"],
    ["createdAt", "STRING"],
    ["updatedAt", "STRING"]
  ],
  "Creates a RELATED_TO relationship between two categories",
  true
);

// Create helper procedure for batch creating category relationships
CALL apoc.custom.asProcedure(
  "createCategoryRelationships",
  "CALL apoc.periodic.iterate(
    \"UNWIND $params AS param RETURN param\",
    \"MATCH (source:Category {category_id: param.source_id})
     MATCH (target:Category {category_id: param.target_id})
     CREATE (source)-[r:RELATED_TO {
       relationship_id: param.relationship_id,
       concept_id: param.concept_id,
       type: param.type,
       direction: param.direction,
       strength: COALESCE(param.strength, 3),
       certainty: COALESCE(param.certainty, 3),
       description: COALESCE(param.description, ''),
       traditions: COALESCE(param.traditions, []),
       philosophers: COALESCE(param.philosophers, []),
       created_at: datetime(COALESCE(param.created_at, datetime())),
       updated_at: datetime(COALESCE(param.updated_at, datetime()))
     }]->(target)
     RETURN r\",
    {batchSize:100, params: {params: $params}}
  )",
  "VOID",
  [["params", "LIST OF MAP"]],
  "Creates category relationships in batches",
  true
);

// Create helper procedure for finding all categories for a concept
CALL apoc.custom.asProcedure(
  "getCategoriesForConcept",
  "MATCH (c:Concept {concept_id: $conceptId})-[:INCLUDES]->(cat:Category)
   RETURN cat",
  "NODE",
  [["conceptId", "STRING"]],
  "Returns all categories for a specific concept",
  true
);

// Create helper procedure for finding all relationships for a concept
CALL apoc.custom.asProcedure(
  "getRelationshipsForConcept",
  "MATCH (source:Category)-[r:RELATED_TO {concept_id: $conceptId}]->(target:Category)
   RETURN source, r, target",
  "MAP",
  [["conceptId", "STRING"]],
  "Returns all relationships for a specific concept with their source and target nodes",
  true
);

// Log migration completion
CALL apoc.log.info("Migration 00004_category_nodes completed successfully");
