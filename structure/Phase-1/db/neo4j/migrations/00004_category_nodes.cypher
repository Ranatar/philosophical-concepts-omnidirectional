// Neo4j Migration: Category Nodes Structure
// Description: Определение структуры узлов Category и создание примеров
// Date: 2024
// Version: 00004

// ==========================================
// Структура узла Category
// ==========================================

// Узел Category представляет философскую категорию внутри концепции
// Свойства:
// - category_id: UUID (обязательное, уникальное) - идентификатор категории
// - concept_id: UUID (обязательное) - идентификатор родительской концепции
// - name: String (обязательное) - название категории
// - type: String (обязательное) - тип категории
// - definition: String - краткое определение категории
// - centrality: Float - центральность категории (0.0-1.0)
// - certainty: Float - определённость категории (0.0-1.0)
// - historical_significance: Float - историческая значимость (0.0-1.0)
// - innovation_degree: Integer - степень инновационности (1-5)
// - clarity: Float - ясность категории (0.0-1.0)
// - breadth: Float - широта категории (0.0-1.0)
// - depth: Float - глубина категории (0.0-1.0)
// - applicability: Float - применимость категории (0.0-1.0)
// - traditions: Array<String> - связанные философские традиции
// - philosophers: Array<String> - связанные философы

// ==========================================
// Перечисление допустимых типов категорий
// ==========================================

// Создаем узел с метаданными о типах категорий
MERGE (types:CategoryTypes)
SET types.allowed_types = [
    'ontological',          // онтологическая
    'epistemological',      // эпистемологическая
    'axiological',          // аксиологическая
    'ethical',              // этическая
    'aesthetic',            // эстетическая
    'metaphysical',         // метафизическая
    'logical',              // логическая
    'practical',            // практическая
    'political',            // политическая
    'theological',          // теологическая
    'anthropological',      // антропологическая
    'social',               // социальная
    'linguistic',           // лингвистическая
    'phenomenological',     // феноменологическая
    'existential',          // экзистенциальная
    'analytical',           // аналитическая
    'hermeneutical',        // герменевтическая
    'cross_disciplinary'    // междисциплинарная
],
types.last_updated = datetime();

// ==========================================
// Создание примеров категорий для тестовых концепций
// ==========================================

// Категории для Диалектического материализма
MATCH (c:Concept {concept_id: 'c1111111-1111-1111-1111-111111111111'})
// Категория 1: Материя
MERGE (cat1:Category {category_id: 'cat11111-1111-1111-1111-111111111111'})
SET cat1.concept_id = c.concept_id,
    cat1.name = 'Материя',
    cat1.type = 'ontological',
    cat1.definition = 'Объективная реальность, существующая независимо от сознания',
    cat1.centrality = 0.95,
    cat1.certainty = 0.9,
    cat1.historical_significance = 0.95,
    cat1.innovation_degree = 3,
    cat1.clarity = 0.85,
    cat1.breadth = 0.9,
    cat1.depth = 0.85,
    cat1.applicability = 0.8,
    cat1.traditions = ['марксизм', 'материализм'],
    cat1.philosophers = ['Маркс', 'Энгельс', 'Ленин']
MERGE (c)-[:INCLUDES]->(cat1)

// Категория 2: Диалектика
WITH c
MERGE (cat2:Category {category_id: 'cat11112-2222-2222-2222-222222222222'})
SET cat2.concept_id = c.concept_id,
    cat2.name = 'Диалектика',
    cat2.type = 'logical',
    cat2.definition = 'Учение о развитии через противоречия',
    cat2.centrality = 0.95,
    cat2.certainty = 0.85,
    cat2.historical_significance = 0.9,
    cat2.innovation_degree = 4,
    cat2.clarity = 0.75,
    cat2.breadth = 0.85,
    cat2.depth = 0.9,
    cat2.applicability = 0.85,
    cat2.traditions = ['гегельянство', 'марксизм'],
    cat2.philosophers = ['Гегель', 'Маркс', 'Энгельс']
MERGE (c)-[:INCLUDES]->(cat2)

// Категория 3: Практика
WITH c
MERGE (cat3:Category {category_id: 'cat11113-3333-3333-3333-333333333333'})
SET cat3.concept_id = c.concept_id,
    cat3.name = 'Практика',
    cat3.type = 'practical',
    cat3.definition = 'Целенаправленная деятельность по преобразованию мира',
    cat3.centrality = 0.85,
    cat3.certainty = 0.9,
    cat3.historical_significance = 0.85,
    cat3.innovation_degree = 3,
    cat3.clarity = 0.9,
    cat3.breadth = 0.8,
    cat3.depth = 0.75,
    cat3.applicability = 0.95,
    cat3.traditions = ['марксизм', 'прагматизм'],
    cat3.philosophers = ['Маркс', 'Ленин']
MERGE (c)-[:INCLUDES]->(cat3);

// Категории для Экзистенциализма
MATCH (c:Concept {concept_id: 'c2222222-2222-2222-2222-222222222222'})
// Категория 1: Существование
MERGE (cat4:Category {category_id: 'cat22221-1111-1111-1111-111111111111'})
SET cat4.concept_id = c.concept_id,
    cat4.name = 'Существование',
    cat4.type = 'existential',
    cat4.definition = 'Бытие, предшествующее сущности',
    cat4.centrality = 0.95,
    cat4.certainty = 0.75,
    cat4.historical_significance = 0.9,
    cat4.innovation_degree = 5,
    cat4.clarity = 0.7,
    cat4.breadth = 0.85,
    cat4.depth = 0.95,
    cat4.applicability = 0.8,
    cat4.traditions = ['экзистенциализм', 'феноменология'],
    cat4.philosophers = ['Сартр', 'Хайдеггер', 'Кьеркегор']
MERGE (c)-[:INCLUDES]->(cat4)

// Категория 2: Свобода
WITH c
MERGE (cat5:Category {category_id: 'cat22222-2222-2222-2222-222222222222'})
SET cat5.concept_id = c.concept_id,
    cat5.name = 'Свобода',
    cat5.type = 'ethical',
    cat5.definition = 'Фундаментальная характеристика человеческого бытия',
    cat5.centrality = 0.9,
    cat5.certainty = 0.7,
    cat5.historical_significance = 0.85,
    cat5.innovation_degree = 4,
    cat5.clarity = 0.75,
    cat5.breadth = 0.8,
    cat5.depth = 0.9,
    cat5.applicability = 0.85,
    cat5.traditions = ['экзистенциализм', 'либерализм'],
    cat5.philosophers = ['Сартр', 'Камю', 'де Бовуар']
MERGE (c)-[:INCLUDES]->(cat5);

// ==========================================
// Создание статистики по категориям
// ==========================================

MERGE (stats:CategoryStats)
SET stats.last_updated = datetime()
WITH stats
MATCH (cat:Category)
WITH stats, 
     count(cat) as total_categories,
     avg(cat.centrality) as avg_centrality,
     avg(cat.certainty) as avg_certainty,
     avg(cat.innovation_degree) as avg_innovation
SET stats.total_categories = total_categories,
    stats.avg_centrality = avg_centrality,
    stats.avg_certainty = avg_certainty,
    stats.avg_innovation = avg_innovation;

// ==========================================
// Валидационные запросы
// ==========================================

// Проверка категорий без связи с концепцией
// MATCH (cat:Category)
// WHERE NOT EXISTS((cat)<-[:INCLUDES]-(:Concept))
// RETURN cat.category_id, cat.name;

// Проверка категорий с недопустимым типом
// MATCH (cat:Category)
// MATCH (types:CategoryTypes)
// WHERE NOT cat.type IN types.allowed_types
// RETURN cat.category_id, cat.name, cat.type;

// Проверка категорий с невалидными числовыми значениями
// MATCH (cat:Category)
// WHERE cat.centrality < 0 OR cat.centrality > 1
//    OR cat.certainty < 0 OR cat.certainty > 1
//    OR cat.innovation_degree < 1 OR cat.innovation_degree > 5
// RETURN cat.category_id, cat.name;

// ==========================================
// Метаданные миграции
// ==========================================

MERGE (m:Migration {version: '00004'})
SET m.name = 'category_nodes',
    m.description = 'Определение структуры узлов Category и создание примеров',
    m.applied_at = datetime(),
    m.status = 'completed',
    m.sample_categories_created = 5;

// ==========================================
// Rollback инструкции (сохранить отдельно)
// ==========================================

// Удаление тестовых категорий:
// MATCH (cat:Category)
// WHERE cat.category_id IN [
//   'cat11111-1111-1111-1111-111111111111',
//   'cat11112-2222-2222-2222-222222222222',
//   'cat11113-3333-3333-3333-333333333333',
//   'cat22221-1111-1111-1111-111111111111',
//   'cat22222-2222-2222-2222-222222222222'
// ]
// DETACH DELETE cat;
//
// MATCH (types:CategoryTypes) DELETE types;
// MATCH (stats:CategoryStats) DELETE stats;
// MATCH (m:Migration {version: '00004'}) DELETE m;