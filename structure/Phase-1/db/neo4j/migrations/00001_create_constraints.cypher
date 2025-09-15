// Neo4j Migration: Create Constraints
// Description: Создание ограничений уникальности и существования для узлов и связей
// Date: 2024
// Version: 00001

// ==========================================
// Ограничения для узла Concept
// ==========================================

// Уникальность concept_id для Concept
CREATE CONSTRAINT constraint_concept_id_unique IF NOT EXISTS
FOR (c:Concept)
REQUIRE c.concept_id IS UNIQUE;

// Обязательность concept_id для Concept
CREATE CONSTRAINT constraint_concept_id_exists IF NOT EXISTS
FOR (c:Concept)
REQUIRE c.concept_id IS NOT NULL;

// Обязательность name для Concept
CREATE CONSTRAINT constraint_concept_name_exists IF NOT EXISTS
FOR (c:Concept)
REQUIRE c.name IS NOT NULL;

// ==========================================
// Ограничения для узла Category
// ==========================================

// Уникальность category_id для Category
CREATE CONSTRAINT constraint_category_id_unique IF NOT EXISTS
FOR (cat:Category)
REQUIRE cat.category_id IS UNIQUE;

// Обязательность category_id для Category
CREATE CONSTRAINT constraint_category_id_exists IF NOT EXISTS
FOR (cat:Category)
REQUIRE cat.category_id IS NOT NULL;

// Обязательность concept_id для Category
CREATE CONSTRAINT constraint_category_concept_id_exists IF NOT EXISTS
FOR (cat:Category)
REQUIRE cat.concept_id IS NOT NULL;

// Обязательность name для Category
CREATE CONSTRAINT constraint_category_name_exists IF NOT EXISTS
FOR (cat:Category)
REQUIRE cat.name IS NOT NULL;

// Обязательность type для Category
CREATE CONSTRAINT constraint_category_type_exists IF NOT EXISTS
FOR (cat:Category)
REQUIRE cat.type IS NOT NULL;

// ==========================================
// Ограничения для связи RELATED_TO
// ==========================================

// Уникальность relationship_id для RELATED_TO
// Neo4j 5.x поддерживает ограничения на свойства отношений
CREATE CONSTRAINT constraint_related_to_id_unique IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
REQUIRE r.relationship_id IS UNIQUE;

// Обязательность relationship_id для RELATED_TO
CREATE CONSTRAINT constraint_related_to_id_exists IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
REQUIRE r.relationship_id IS NOT NULL;

// Обязательность type для RELATED_TO
CREATE CONSTRAINT constraint_related_to_type_exists IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
REQUIRE r.type IS NOT NULL;

// Обязательность direction для RELATED_TO
CREATE CONSTRAINT constraint_related_to_direction_exists IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
REQUIRE r.direction IS NOT NULL;

// ==========================================
// Дополнительные ограничения для валидации данных
// ==========================================

// Ограничение на допустимые значения innovation_degree для Category
// (Neo4j не поддерживает CHECK constraints напрямую, но можно использовать триггеры)
// Это будет обрабатываться на уровне приложения

// Ограничение на допустимые значения innovation_degree для RELATED_TO
// Это будет обрабатываться на уровне приложения

// ==========================================
// Метаданные миграции
// ==========================================

// Создаем узел для отслеживания миграций
MERGE (m:Migration {version: '00001'})
SET m.name = 'create_constraints',
    m.description = 'Создание ограничений уникальности и существования',
    m.applied_at = datetime(),
    m.status = 'completed';

// ==========================================
// Проверка созданных ограничений
// ==========================================

// Команда для просмотра всех ограничений (выполнить отдельно):
// SHOW CONSTRAINTS;

// ==========================================
// Rollback инструкции (сохранить отдельно)
// ==========================================

// DROP CONSTRAINT constraint_concept_id_unique IF EXISTS;
// DROP CONSTRAINT constraint_concept_id_exists IF EXISTS;
// DROP CONSTRAINT constraint_concept_name_exists IF EXISTS;
// DROP CONSTRAINT constraint_category_id_unique IF EXISTS;
// DROP CONSTRAINT constraint_category_id_exists IF EXISTS;
// DROP CONSTRAINT constraint_category_concept_id_exists IF EXISTS;
// DROP CONSTRAINT constraint_category_name_exists IF EXISTS;
// DROP CONSTRAINT constraint_category_type_exists IF EXISTS;
// DROP CONSTRAINT constraint_related_to_id_unique IF EXISTS;
// DROP CONSTRAINT constraint_related_to_id_exists IF EXISTS;
// DROP CONSTRAINT constraint_related_to_type_exists IF EXISTS;
// DROP CONSTRAINT constraint_related_to_direction_exists IF EXISTS;
// MATCH (m:Migration {version: '00001'}) DELETE m;