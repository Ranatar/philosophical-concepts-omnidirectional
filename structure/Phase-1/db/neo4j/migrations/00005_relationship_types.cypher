// Neo4j Migration: Relationship Types
// Description: Определение типов связей RELATED_TO и создание примеров
// Date: 2024
// Version: 00005

// ==========================================
// Структура связи RELATED_TO
// ==========================================

// Связь RELATED_TO представляет отношение между категориями
// Свойства:
// - relationship_id: UUID (обязательное, уникальное) - идентификатор связи
// - type: String (обязательное) - тип связи
// - direction: String (обязательное) - направленность связи
// - strength: Float - сила связи (0.0-1.0)
// - certainty: Float - определённость связи (0.0-1.0)
// - innovation_degree: Integer - степень инновационности (1-5)
// - historical_support: Float - историческая поддержка (0.0-1.0)
// - logical_necessity: Float - логическая необходимость (0.0-1.0)
// - context_dependence: Float - зависимость от контекста (0.0-1.0)
// - source: String - источник связи
// - traditions: Array<String> - связанные философские традиции
// - philosophers: Array<String> - философы, обосновавшие связь

// ==========================================
// Перечисление допустимых типов связей
// ==========================================

MERGE (types:RelationshipTypes)
SET types.allowed_types = [
    'hierarchical',         // иерархическая
    'causal',              // причинно-следственная
    'dialectical',         // диалектическая
    'correlational',       // корреляционная
    'disjunctive',         // дизъюнктивная
    'conjunctive',         // конъюнктивная
    'contradiction',       // противоречие
    'complementary',       // дополнительность
    'emergence',           // эмерджентность
    'necessary_condition', // необходимое условие
    'sufficient_condition',// достаточное условие
    'identity',            // тождество
    'analogy',             // аналогия
    'implementation',      // реализация
    'instantiation',       // конкретизация
    'generalization',      // обобщение
    'part_whole',          // часть-целое
    'means_end',           // средство-цель
    'deductive',           // дедуктивная
    'inductive',           // индуктивная
    'abductive',           // абдуктивная
    'temporal',            // временная
    'conceptual',          // концептуальная
    'definitional',        // определяющая
    'manifestation',       // выражение
    'foundational',        // основание
    'recognition',         // понимание
    'reflexion',           // мышление
    'development'          // развитие
],
types.allowed_directions = [
    'unidirectional',      // однонаправленная
    'bidirectional',       // двунаправленная
    'reflexive'            // возвратная
],
types.last_updated = datetime();

// ==========================================
// Создание примеров связей для тестовых категорий
// ==========================================

// Связи для категорий Диалектического материализма

// Связь: Материя -> Диалектика (диалектическая связь)
MATCH (cat1:Category {category_id: 'cat11111-1111-1111-1111-111111111111'})
MATCH (cat2:Category {category_id: 'cat11112-2222-2222-2222-222222222222'})
MERGE (cat1)-[r1:RELATED_TO {relationship_id: 'rel11111-1111-1111-1111-111111111111'}]->(cat2)
SET r1.type = 'dialectical',
    r1.direction = 'bidirectional',
    r1.strength = 0.9,
    r1.certainty = 0.85,
    r1.innovation_degree = 4,
    r1.historical_support = 0.9,
    r1.logical_necessity = 0.85,
    r1.context_dependence = 0.3,
    r1.source = 'Энгельс - Диалектика природы',
    r1.traditions = ['марксизм', 'диалектический материализм'],
    r1.philosophers = ['Энгельс', 'Ленин'];

// Связь: Диалектика -> Практика (реализация)
MATCH (cat2:Category {category_id: 'cat11112-2222-2222-2222-222222222222'})
MATCH (cat3:Category {category_id: 'cat11113-3333-3333-3333-333333333333'})
MERGE (cat2)-[r2:RELATED_TO {relationship_id: 'rel11112-2222-2222-2222-222222222222'}]->(cat3)
SET r2.type = 'implementation',
    r2.direction = 'unidirectional',
    r2.strength = 0.85,
    r2.certainty = 0.9,
    r2.innovation_degree = 3,
    r2.historical_support = 0.85,
    r2.logical_necessity = 0.8,
    r2.context_dependence = 0.4,
    r2.source = 'Маркс - Тезисы о Фейербахе',
    r2.traditions = ['марксизм'],
    r2.philosophers = ['Маркс'];

// Связь: Практика -> Материя (основание)
MATCH (cat3:Category {category_id: 'cat11113-3333-3333-3333-333333333333'})
MATCH (cat1:Category {category_id: 'cat11111-1111-1111-1111-111111111111'})
MERGE (cat3)-[r3:RELATED_TO {relationship_id: 'rel11113-3333-3333-3333-333333333333'}]->(cat1)
SET r3.type = 'foundational',
    r3.direction = 'unidirectional',
    r3.strength = 0.8,
    r3.certainty = 0.85,
    r3.innovation_degree = 3,
    r3.historical_support = 0.8,
    r3.logical_necessity = 0.75,
    r3.context_dependence = 0.5,
    r3.source = 'Ленин - Материализм и эмпириокритицизм',
    r3.traditions = ['марксизм-ленинизм'],
    r3.philosophers = ['Ленин'];

// Связи для категорий Экзистенциализма

// Связь: Существование -> Свобода (необходимое условие)
MATCH (cat4:Category {category_id: 'cat22221-1111-1111-1111-111111111111'})
MATCH (cat5:Category {category_id: 'cat22222-2222-2222-2222-222222222222'})
MERGE (cat4)-[r4:RELATED_TO {relationship_id: 'rel22221-1111-1111-1111-111111111111'}]->(cat5)
SET r4.type = 'necessary_condition',
    r4.direction = 'unidirectional',
    r4.strength = 0.95,
    r4.certainty = 0.8,
    r4.innovation_degree = 5,
    r4.historical_support = 0.7,
    r4.logical_necessity = 0.9,
    r4.context_dependence = 0.6,
    r4.source = 'Сартр - Бытие и ничто',
    r4.traditions = ['экзистенциализм'],
    r4.philosophers = ['Сартр'];

// Связь: Свобода -> Существование (выражение)
MATCH (cat5:Category {category_id: 'cat22222-2222-2222-2222-222222222222'})
MATCH (cat4:Category {category_id: 'cat22221-1111-1111-1111-111111111111'})
MERGE (cat5)-[r5:RELATED_TO {relationship_id: 'rel22222-2222-2222-2222-222222222222'}]->(cat4)
SET r5.type = 'manifestation',
    r5.direction = 'unidirectional',
    r5.strength = 0.85,
    r5.certainty = 0.75,
    r5.innovation_degree = 4,
    r5.historical_support = 0.7,
    r5.logical_necessity = 0.8,
    r5.context_dependence = 0.7,
    r5.source = 'Камю - Миф о Сизифе',
    r5.traditions = ['экзистенциализм', 'абсурдизм'],
    r5.philosophers = ['Камю'];

// ==========================================
// Создание статистики по связям
// ==========================================

MERGE (stats:RelationshipStats)
SET stats.last_updated = datetime()
WITH stats
MATCH ()-[r:RELATED_TO]->()
WITH stats,
     count(r) as total_relationships,
     avg(r.strength) as avg_strength,
     avg(r.certainty) as avg_certainty,
     avg(r.innovation_degree) as avg_innovation
SET stats.total_relationships = total_relationships,
    stats.avg_strength = avg_strength,
    stats.avg_certainty = avg_certainty,
    stats.avg_innovation = avg_innovation;

// ==========================================
// Валидационные запросы
// ==========================================

// Проверка связей с недопустимым типом
// MATCH ()-[r:RELATED_TO]->()
// MATCH (types:RelationshipTypes)
// WHERE NOT r.type IN types.allowed_types
// RETURN r.relationship_id, r.type;

// Проверка связей с недопустимым направлением
// MATCH ()-[r:RELATED_TO]->()
// MATCH (types:RelationshipTypes)
// WHERE NOT r.direction IN types.allowed_directions
// RETURN r.relationship_id, r.direction;

// Проверка связей между категориями разных концепций
// MATCH (cat1:Category)-[r:RELATED_TO]->(cat2:Category)
// WHERE cat1.concept_id <> cat2.concept_id
// RETURN r.relationship_id, cat1.name, cat2.name;

// ==========================================
// Аналитические запросы
// ==========================================

// Поиск наиболее сильных связей
// MATCH ()-[r:RELATED_TO]->()
// WHERE r.strength > 0.8
// RETURN r
// ORDER BY r.strength DESC;

// Поиск диалектических связей
// MATCH (cat1:Category)-[r:RELATED_TO {type: 'dialectical'}]->(cat2:Category)
// RETURN cat1.name, r, cat2.name;

// Граф связей для конкретной концепции
// MATCH (c:Concept {concept_id: 'c1111111-1111-1111-1111-111111111111'})
// MATCH (c)-[:INCLUDES]->(cat:Category)
// OPTIONAL MATCH (cat)-[r:RELATED_TO]-(other:Category)
// WHERE (c)-[:INCLUDES]->(other)
// RETURN cat, r, other;

// ==========================================
// Метаданные миграции
// ==========================================

MERGE (m:Migration {version: '00005'})
SET m.name = 'relationship_types',
    m.description = 'Определение типов связей RELATED_TO и создание примеров',
    m.applied_at = datetime(),
    m.status = 'completed',
    m.sample_relationships_created = 5;

// ==========================================
// Rollback инструкции (сохранить отдельно)
// ==========================================

// Удаление тестовых связей:
// MATCH ()-[r:RELATED_TO]->()
// WHERE r.relationship_id IN [
//   'rel11111-1111-1111-1111-111111111111',
//   'rel11112-2222-2222-2222-222222222222',
//   'rel11113-3333-3333-3333-333333333333',
//   'rel22221-1111-1111-1111-111111111111',
//   'rel22222-2222-2222-2222-222222222222'
// ]
// DELETE r;
//
// MATCH (types:RelationshipTypes) DELETE types;
// MATCH (stats:RelationshipStats) DELETE stats;
// MATCH (m:Migration {version: '00005'}) DELETE m;