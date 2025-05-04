// migrations/00001_create_constraints.cypher

// Ограничения уникальности для Concept
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS
FOR (c:Concept) REQUIRE c.concept_id IS UNIQUE;

// Ограничения уникальности для Category
CREATE CONSTRAINT category_id_unique IF NOT EXISTS
FOR (cat:Category) REQUIRE cat.category_id IS UNIQUE;

// Ограничение на обязательность имени концепции
CREATE CONSTRAINT concept_name_required IF NOT EXISTS
FOR (c:Concept) REQUIRE c.name IS NOT NULL;

// Ограничение на обязательность имени категории
CREATE CONSTRAINT category_name_required IF NOT EXISTS
FOR (cat:Category) REQUIRE cat.name IS NOT NULL;
