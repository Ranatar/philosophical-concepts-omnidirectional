// Neo4j Migration: Relationship Types
// Description: Defines relationship types and structures between categories

// Create metadata about relationship types
CREATE (:RelationshipTypeMetadata {
  type: 'HIERARCHICAL',
  description: 'Indicates a hierarchical relationship where one category is superordinate to another',
  examples: ['is a type of', 'contains', 'categorizes'],
  symmetric: false
});

CREATE (:RelationshipTypeMetadata {
  type: 'CAUSAL',
  description: 'Indicates a causal relationship where one category causes or leads to another',
  examples: ['causes', 'leads to', 'results in'],
  symmetric: false
});

CREATE (:RelationshipTypeMetadata {
  type: 'DIALECTICAL',
  description: 'Indicates a dialectical relationship where categories are in tension or synthesis',
  examples: ['contradicts', 'resolves', 'synthesizes with'],
  symmetric: true
});

CREATE (:RelationshipTypeMetadata {
  type: 'CORRELATIVE',
  description: 'Indicates a correlative relationship where categories vary together',
  examples: ['correlates with', 'varies with', 'co-occurs with'],
  symmetric: true
});

CREATE (:RelationshipTypeMetadata {
  type: 'ANALOGICAL',
  description: 'Indicates an analogical relationship where categories are similar in structure',
  examples: ['is analogous to', 'parallels', 'mirrors'],
  symmetric: true
});

CREATE (:RelationshipTypeMetadata {
  type: 'OPPOSITIONAL',
  description: 'Indicates an oppositional relationship where categories are opposed',
  examples: ['opposes', 'contradicts', 'negates'],
  symmetric: true
});

CREATE (:RelationshipTypeMetadata {
  type: 'METAPHORICAL',
  description: 'Indicates a metaphorical relationship where one category is understood through another',
  examples: ['is metaphor for', 'symbolizes', 'represents'],
  symmetric: false
});

CREATE (:RelationshipTypeMetadata {
  type: 'FUNCTIONAL',
  description: 'Indicates a functional relationship where categories have a functional relationship',
  examples: ['functions as', 'serves as', 'operates as'],
  symmetric: false
});

// Create metadata about relationship directions
CREATE (:RelationshipDirectionMetadata {
  type: 'UNIDIRECTIONAL',
  description: 'Relationship applies in one direction only'
});

CREATE (:RelationshipDirectionMetadata {
  type: 'BIDIRECTIONAL',
  description: 'Relationship applies in both directions'
});

// Create metadata about relationship properties
CREATE (:RelationshipPropertyMetadata {
  property: 'strength',
  description: 'Strength of the relationship on a scale of 1-5',
  min_value: 1,
  max_value: 5,
  default_value: 3
});

CREATE (:RelationshipPropertyMetadata {
  property: 'certainty',
  description: 'Certainty of the relationship on a scale of 1-5',
  min_value: 1,
  max_value: 5,
  default_value: 3
});

// Create helper procedure for getting relationship type metadata
CALL apoc.custom.asProcedure(
  "getRelationshipTypeMetadata",
  "MATCH (m:RelationshipTypeMetadata)
   RETURN m.type AS type, m.description AS description, 
          m.examples AS examples, m.symmetric AS symmetric",
  "MAP",
  [],
  "Returns metadata about all relationship types",
  true
);

// Create helper function for validating relationship type
CALL apoc.custom.asFunction(
  "isValidRelationshipType",
  "MATCH (m:RelationshipTypeMetadata {type: $type})
   RETURN count(m) > 0",
  "BOOLEAN",
  [["type", "STRING"]],
  "Checks if the given relationship type is valid",
  true
);

// Create helper function for validating relationship direction
CALL apoc.custom.asFunction(
  "isValidRelationshipDirection",
  "MATCH (m:RelationshipDirectionMetadata {type: $direction})
   RETURN count(m) > 0",
  "BOOLEAN",
  [["direction", "STRING"]],
  "Checks if the given relationship direction is valid",
  true
);

// Create helper function for checking if relationship is symmetric
CALL apoc.custom.asFunction(
  "isSymmetricRelationship",
  "MATCH (m:RelationshipTypeMetadata {type: $type})
   RETURN m.symmetric",
  "BOOLEAN",
  [["type", "STRING"]],
  "Checks if the given relationship type is symmetric",
  true
);

// Create helper procedure for creating a bidirectional relationship
CALL apoc.custom.asProcedure(
  "createBidirectionalRelationship",
  "MATCH (source:Category {category_id: $sourceId})
   MATCH (target:Category {category_id: $targetId})
   
   // Create forward relationship
   CREATE (source)-[r1:RELATED_TO {
     relationship_id: $relationshipId + '-forward',
     concept_id: $conceptId,
     type: $type,
     direction: 'BIDIRECTIONAL',
     strength: COALESCE($strength, 3),
     certainty: COALESCE($certainty, 3),
     description: COALESCE($description, ''),
     traditions: COALESCE($traditions, []),
     philosophers: COALESCE($philosophers, []),
     created_at: datetime(COALESCE($createdAt, datetime())),
     updated_at: datetime(COALESCE($updatedAt, datetime()))
   }]->(target)
   
   // Create backward relationship with same properties
   CREATE (target)-[r2:RELATED_TO {
     relationship_id: $relationshipId + '-backward',
     concept_id: $conceptId,
     type: $type,
     direction: 'BIDIRECTIONAL',
     strength: COALESCE($strength, 3),
     certainty: COALESCE($certainty, 3),
     description: COALESCE($description, ''),
     traditions: COALESCE($traditions, []),
     philosophers: COALESCE($philosophers, []),
     created_at: datetime(COALESCE($createdAt, datetime())),
     updated_at: datetime(COALESCE($updatedAt, datetime()))
   }]->(source)
   
   RETURN r1, r2",
  "MAP",
  [
    ["sourceId", "STRING"],
    ["targetId", "STRING"],
    ["relationshipId", "STRING"],
    ["conceptId", "STRING"],
    ["type", "STRING"],
    ["strength", "INTEGER"],
    ["certainty", "INTEGER"],
    ["description", "STRING"],
    ["traditions", "LIST OF STRING"],
    ["philosophers", "LIST OF STRING"],
    ["createdAt", "STRING"],
    ["updatedAt", "STRING"]
  ],
  "Creates bidirectional RELATED_TO relationships between two categories",
  true
);

// Log migration completion
CALL apoc.log.info("Migration 00005_relationship_types completed successfully");
