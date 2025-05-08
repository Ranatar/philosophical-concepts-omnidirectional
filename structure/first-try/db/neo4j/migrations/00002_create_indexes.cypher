// migrations/00002_create_indexes.cypher

// Индексы для Concept
CREATE INDEX concept_name_index IF NOT EXISTS
FOR (c:Concept) ON (c.name);

CREATE INDEX concept_creation_date_index IF NOT EXISTS
FOR (c:Concept) ON (c.creation_date);

// Индексы для Category
CREATE INDEX category_name_index IF NOT EXISTS
FOR (cat:Category) ON (cat.name);

CREATE INDEX category_concept_id_index IF NOT EXISTS
FOR (cat:Category) ON (cat.concept_id);

// Полнотекстовый поиск
CALL db.index.fulltext.createNodeIndex(
  "conceptSearch", 
  ["Concept"], 
  ["name", "description"]
) IF NOT EXISTS;

CALL db.index.fulltext.createNodeIndex(
  "categorySearch", 
  ["Category"], 
  ["name", "definition"]
) IF NOT EXISTS;
