// Neo4j Migration: Create Indexes
// Description: Создание индексов для оптимизации запросов
// Date: 2024
// Version: 00002

// ==========================================
// Индексы для узла Concept
// ==========================================

// Индекс по name для Concept (для поиска концепций по имени)
CREATE INDEX idx_concept_name IF NOT EXISTS
FOR (c:Concept)
ON (c.name);

// ==========================================
// Индексы для узла Category
// ==========================================

// Составной индекс по concept_id для Category (для поиска категорий концепции)
CREATE INDEX idx_category_concept_id IF NOT EXISTS
FOR (cat:Category)
ON (cat.concept_id);

// Индекс по name для Category (для поиска категорий по имени)
CREATE INDEX idx_category_name IF NOT EXISTS
FOR (cat:Category)
ON (cat.name);

// Индекс по type для Category (для фильтрации по типу категории)
CREATE INDEX idx_category_type IF NOT EXISTS
FOR (cat:Category)
ON (cat.type);

// Индекс по innovation_degree для Category (для поиска по степени инновационности)
CREATE INDEX idx_category_innovation_degree IF NOT EXISTS
FOR (cat:Category)
ON (cat.innovation_degree);

// Составной индекс по type и innovation_degree для Category
CREATE INDEX idx_category_type_innovation IF NOT EXISTS
FOR (cat:Category)
ON (cat.type, cat.innovation_degree);

// Индекс по centrality для Category (для сортировки по центральности)
CREATE INDEX idx_category_centrality IF NOT EXISTS
FOR (cat:Category)
ON (cat.centrality);

// Индекс по historical_significance для Category
CREATE INDEX idx_category_historical_significance IF NOT EXISTS
FOR (cat:Category)
ON (cat.historical_significance);

// ==========================================
// Индексы для отношений RELATED_TO
// ==========================================

// Индекс по type для RELATED_TO (для фильтрации по типу связи)
CREATE INDEX idx_related_to_type IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
ON (r.type);

// Индекс по innovation_degree для RELATED_TO
CREATE INDEX idx_related_to_innovation_degree IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
ON (r.innovation_degree);

// Индекс по strength для RELATED_TO (для фильтрации по силе связи)
CREATE INDEX idx_related_to_strength IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
ON (r.strength);

// Индекс по certainty для RELATED_TO
CREATE INDEX idx_related_to_certainty IF NOT EXISTS
FOR ()-[r:RELATED_TO]-()
ON (r.certainty);

// ==========================================
// Полнотекстовые индексы
// ==========================================

// Полнотекстовый индекс для поиска по названиям и определениям категорий
CREATE FULLTEXT INDEX idx_category_fulltext IF NOT EXISTS
FOR (cat:Category)
ON EACH [cat.name, cat.definition];

// Полнотекстовый индекс для поиска по названиям концепций
CREATE FULLTEXT INDEX idx_concept_fulltext IF NOT EXISTS
FOR (c:Concept)
ON EACH [c.name];

// ==========================================
// Векторные индексы (для Neo4j 5.x с поддержкой векторного поиска)
// ==========================================

// Если в будущем будут добавлены эмбеддинги для семантического поиска
// CREATE VECTOR INDEX idx_category_embedding IF NOT EXISTS
// FOR (cat:Category)
// ON (cat.embedding)
// OPTIONS {indexConfig: {
//   `vector.dimensions`: 384,
//   `vector.similarity_function`: 'cosine'
// }};

// ==========================================
// Специализированные индексы для аналитических запросов
// ==========================================

// Индекс для поиска категорий с определенными философами
CREATE INDEX idx_category_philosophers IF NOT EXISTS
FOR (cat:Category)
ON (cat.philosophers);

// Индекс для поиска категорий с определенными традициями
CREATE INDEX idx_category_traditions IF NOT EXISTS
FOR (cat:Category)
ON (cat.traditions);

// ==========================================
// Индексы для узла Migration (служебный)
// ==========================================

// Индекс по version для Migration
CREATE INDEX idx_migration_version IF NOT EXISTS
FOR (m:Migration)
ON (m.version);

// Индекс по status для Migration
CREATE INDEX idx_migration_status IF NOT EXISTS
FOR (m:Migration)
ON (m.status);

// ==========================================
// Метаданные миграции
// ==========================================

// Обновляем информацию о миграции
MERGE (m:Migration {version: '00002'})
SET m.name = 'create_indexes',
    m.description = 'Создание индексов для оптимизации запросов',
    m.applied_at = datetime(),
    m.status = 'completed',
    m.indexes_created = [
        'idx_concept_name',
        'idx_category_concept_id',
        'idx_category_name',
        'idx_category_type',
        'idx_category_innovation_degree',
        'idx_category_type_innovation',
        'idx_category_centrality',
        'idx_category_historical_significance',
        'idx_related_to_type',
        'idx_related_to_innovation_degree',
        'idx_related_to_strength',
        'idx_related_to_certainty',
        'idx_category_fulltext',
        'idx_concept_fulltext',
        'idx_category_philosophers',
        'idx_category_traditions',
        'idx_migration_version',
        'idx_migration_status'
    ];

// ==========================================
// Анализ и оптимизация
// ==========================================

// После создания индексов рекомендуется выполнить:
// CALL db.indexes(); -- Просмотр всех индексов
// CALL db.indexDetails('idx_category_concept_id'); -- Детали конкретного индекса

// ==========================================
// Rollback инструкции (сохранить отдельно)
// ==========================================

// DROP INDEX idx_concept_name IF EXISTS;
// DROP INDEX idx_category_concept_id IF EXISTS;
// DROP INDEX idx_category_name IF EXISTS;
// DROP INDEX idx_category_type IF EXISTS;
// DROP INDEX idx_category_innovation_degree IF EXISTS;
// DROP INDEX idx_category_type_innovation IF EXISTS;
// DROP INDEX idx_category_centrality IF EXISTS;
// DROP INDEX idx_category_historical_significance IF EXISTS;
// DROP INDEX idx_related_to_type IF EXISTS;
// DROP INDEX idx_related_to_innovation_degree IF EXISTS;
// DROP INDEX idx_related_to_strength IF EXISTS;
// DROP INDEX idx_related_to_certainty IF EXISTS;
// DROP INDEX idx_category_fulltext IF EXISTS;
// DROP INDEX idx_concept_fulltext IF EXISTS;
// DROP INDEX idx_category_philosophers IF EXISTS;
// DROP INDEX idx_category_traditions IF EXISTS;
// DROP INDEX idx_migration_version IF EXISTS;
// DROP INDEX idx_migration_status IF EXISTS;
// MATCH (m:Migration {version: '00002'}) DELETE m;