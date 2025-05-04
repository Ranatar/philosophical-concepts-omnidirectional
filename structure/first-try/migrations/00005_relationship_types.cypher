// migrations/00005_relationship_types.cypher

// Определение типов отношений и их свойств

// Отношение INCLUDES между Concept и Category
// Пример создания:
// MATCH (c:Concept {concept_id: $concept_id})
// MATCH (cat:Category {category_id: $category_id})
// CREATE (c)-[:INCLUDES]->(cat)

// Отношение RELATED_TO между Categories
// Пример создания с характеристиками:
// MATCH (cat1:Category {category_id: $category1_id})
// MATCH (cat2:Category {category_id: $category2_id})
// CREATE (cat1)-[r:RELATED_TO {
//   relationship_id: $relationship_id,
//   type: $type,
//   direction: $direction,
//   strength: $strength,
//   certainty: $certainty,
//   traditions: $traditions,
//   philosophers: $philosophers,
//   created_at: datetime($created_at),
//   updated_at: datetime($updated_at)
// }]->(cat2)
// RETURN r;

// Типы отношений RELATED_TO:
// - hierarchical (иерархическое)
// - causal (причинно-следственное)
// - dialectical (диалектическое)
// - analogical (аналогическое)
// - oppositional (оппозиционное)
// - complementary (комплементарное)
