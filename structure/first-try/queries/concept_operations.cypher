// queries/concept_operations.cypher

// Создание концепции с категориями
// Параметры: $conceptData, $categories
UNWIND $categories AS category
CREATE (c:Concept {
  concept_id: $conceptData.concept_id,
  name: $conceptData.name,
  description: $conceptData.description,
  creation_date: datetime($conceptData.creation_date),
  is_synthesis: $conceptData.is_synthesis
})
CREATE (cat:Category {
  category_id: category.category_id,
  concept_id: $conceptData.concept_id,
  name: category.name,
  definition: category.definition,
  centrality: category.centrality,
  certainty: category.certainty
})
CREATE (c)-[:INCLUDES]->(cat)
RETURN c, collect(cat) as categories;

// Получение полного графа концепции
// Параметры: $concept_id
MATCH (c:Concept {concept_id: $concept_id})
OPTIONAL MATCH (c)-[:INCLUDES]->(cat:Category)
OPTIONAL MATCH (cat)-[r:RELATED_TO]-(related:Category)
WHERE related.concept_id = $concept_id
RETURN c, collect(DISTINCT cat) as categories, 
       collect(DISTINCT r) as relationships, 
       collect(DISTINCT related) as relatedCategories;

// Обновление характеристик категории
// Параметры: $category_id, $updates
MATCH (cat:Category {category_id: $category_id})
SET cat += $updates
SET cat.updated_at = datetime()
RETURN cat;

// Создание связи между категориями
// Параметры: $source_id, $target_id, $relationshipData
MATCH (source:Category {category_id: $source_id})
MATCH (target:Category {category_id: $target_id})
CREATE (source)-[r:RELATED_TO {
  relationship_id: $relationshipData.relationship_id,
  type: $relationshipData.type,
  direction: $relationshipData.direction,
  strength: $relationshipData.strength,
  certainty: $relationshipData.certainty,
  created_at: datetime()
}]->(target)
RETURN r;

// Удаление категории и её связей
// Параметры: $category_id
MATCH (cat:Category {category_id: $category_id})
DETACH DELETE cat;

// Валидация структуры графа
// Параметры: $concept_id
MATCH (c:Concept {concept_id: $concept_id})-[:INCLUDES]->(cat:Category)
OPTIONAL MATCH (cat)-[r:RELATED_TO]-(related:Category)
WHERE related.concept_id = $concept_id
WITH c, count(DISTINCT cat) as categoryCount, count(r) as relationshipCount
RETURN c.concept_id as conceptId,
       categoryCount,
       relationshipCount,
       CASE 
         WHEN categoryCount < 3 THEN 'Too few categories'
         WHEN relationshipCount < categoryCount - 1 THEN 'Graph might be disconnected'
         ELSE 'Valid structure'
       END as validationResult;

// Анализ центральности категорий
// Параметры: $concept_id
MATCH (c:Concept {concept_id: $concept_id})-[:INCLUDES]->(cat:Category)
OPTIONAL MATCH (cat)-[r:RELATED_TO]-(related:Category)
WHERE related.concept_id = $concept_id
WITH cat, count(r) as connectionCount
ORDER BY connectionCount DESC
RETURN cat.category_id as categoryId,
       cat.name as name,
       connectionCount,
       toFloat(connectionCount) / toFloat((SELECT count(*) FROM Category WHERE concept_id = $concept_id) - 1) as relativeCentrality;

// Поиск путей между категориями
// Параметры: $start_category_id, $end_category_id
MATCH path = shortestPath(
  (start:Category {category_id: $start_category_id})-[:RELATED_TO*]-(end:Category {category_id: $end_category_id})
)
WHERE all(cat IN nodes(path) WHERE cat.concept_id = start.concept_id)
RETURN path;

// Экспорт графа для визуализации
// Параметры: $concept_id
MATCH (c:Concept {concept_id: $concept_id})-[:INCLUDES]->(cat:Category)
OPTIONAL MATCH (cat)-[r:RELATED_TO]-(related:Category)
WHERE related.concept_id = $concept_id
WITH collect(DISTINCT cat) as nodes, collect(DISTINCT r) as edges
RETURN 
  [node IN nodes | {
    id: node.category_id,
    label: node.name,
    centrality: node.centrality,
    certainty: node.certainty
  }] as nodes,
  [edge IN edges | {
    id: edge.relationship_id,
    source: startNode(edge).category_id,
    target: endNode(edge).category_id,
    type: edge.type,
    strength: edge.strength
  }] as edges;

// Обнаружение циклов в графе
// Параметры: $concept_id
MATCH (c:Concept {concept_id: $concept_id})-[:INCLUDES]->(cat:Category)
MATCH path = (cat)-[:RELATED_TO*3..]-(cat)
WHERE all(node IN nodes(path) WHERE node.concept_id = $concept_id)
RETURN path
LIMIT 10;
