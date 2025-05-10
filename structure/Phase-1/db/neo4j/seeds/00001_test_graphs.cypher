// Neo4j Seed Data: Test Graphs
// Description: Creates test graph data for development and testing

// Create the test concept (matches the concept created in PostgreSQL seeds)
CREATE (c:Concept {
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Диалектический материализм',
  creation_date: datetime('2024-01-01T00:00:00'),
  last_modified: datetime('2024-01-01T00:00:00')
});

// Create categories for the concept
CREATE (cat1:Category {
  category_id: '650e8400-e29b-41d4-a716-446655440001',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Материя',
  definition: 'Объективная реальность, существующая независимо от человеческого сознания',
  centrality: 5,
  certainty: 5,
  historical_significance: 5,
  traditions: ['marxism', 'materialism'],
  philosophers: ['Marx', 'Engels', 'Lenin'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
});

CREATE (cat2:Category {
  category_id: '650e8400-e29b-41d4-a716-446655440002',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Сознание',
  definition: 'Высшая форма отражения объективной реальности',
  centrality: 4,
  certainty: 4,
  historical_significance: 5,
  traditions: ['marxism', 'materialism'],
  philosophers: ['Marx', 'Engels', 'Lenin'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
});

CREATE (cat3:Category {
  category_id: '650e8400-e29b-41d4-a716-446655440003',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Диалектика',
  definition: 'Учение о всеобщей связи и развитии',
  centrality: 5,
  certainty: 5,
  historical_significance: 5,
  traditions: ['marxism', 'dialectics', 'hegelianism'],
  philosophers: ['Hegel', 'Marx', 'Engels'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
});

CREATE (cat4:Category {
  category_id: '650e8400-e29b-41d4-a716-446655440004',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Практика',
  definition: 'Целенаправленная материальная деятельность людей по преобразованию природы и общества',
  centrality: 4,
  certainty: 5,
  historical_significance: 4,
  traditions: ['marxism', 'pragmatism'],
  philosophers: ['Marx', 'Engels', 'Lenin'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
});

CREATE (cat5:Category {
  category_id: '650e8400-e29b-41d4-a716-446655440005',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Противоречие',
  definition: 'Взаимодействие противоположных, взаимоисключающих сторон и тенденций',
  centrality: 4,
  certainty: 4,
  historical_significance: 4,
  traditions: ['marxism', 'dialectics'],
  philosophers: ['Hegel', 'Marx', 'Engels'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
});

// Create INCLUDES relationships from concept to categories
MATCH (c:Concept {concept_id: '550e8400-e29b-41d4-a716-446655440000'})
MATCH (cat1:Category {category_id: '650e8400-e29b-41d4-a716-446655440001'})
MATCH (cat2:Category {category_id: '650e8400-e29b-41d4-a716-446655440002'})
MATCH (cat3:Category {category_id: '650e8400-e29b-41d4-a716-446655440003'})
MATCH (cat4:Category {category_id: '650e8400-e29b-41d4-a716-446655440004'})
MATCH (cat5:Category {category_id: '650e8400-e29b-41d4-a716-446655440005'})
CREATE (c)-[:INCLUDES]->(cat1)
CREATE (c)-[:INCLUDES]->(cat2)
CREATE (c)-[:INCLUDES]->(cat3)
CREATE (c)-[:INCLUDES]->(cat4)
CREATE (c)-[:INCLUDES]->(cat5);

// Create RELATED_TO relationships between categories

// Материя и Сознание - диалектическая связь
MATCH (cat1:Category {category_id: '650e8400-e29b-41d4-a716-446655440001'})
MATCH (cat2:Category {category_id: '650e8400-e29b-41d4-a716-446655440002'})
CREATE (cat1)-[r1:RELATED_TO {
  relationship_id: '750e8400-e29b-41d4-a716-446655440001',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'dialectical',
  direction: 'bidirectional',
  strength: 5,
  certainty: 5,
  description: 'Материя первична, сознание вторично, но они находятся в диалектическом единстве',
  traditions: ['marxism'],
  philosophers: ['Marx', 'Engels', 'Lenin'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
}]->(cat2)
CREATE (cat2)-[r2:RELATED_TO {
  relationship_id: '750e8400-e29b-41d4-a716-446655440002',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'dialectical',
  direction: 'bidirectional',
  strength: 5,
  certainty: 5,
  description: 'Сознание отражает материю, но также активно воздействует на нее',
  traditions: ['marxism'],
  philosophers: ['Marx', 'Engels', 'Lenin'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
}]->(cat1);

// Диалектика связана со всеми категориями
MATCH (cat3:Category {category_id: '650e8400-e29b-41d4-a716-446655440003'})
MATCH (cat1:Category {category_id: '650e8400-e29b-41d4-a716-446655440001'})
CREATE (cat3)-[r3:RELATED_TO {
  relationship_id: '750e8400-e29b-41d4-a716-446655440003',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'functional',
  direction: 'unidirectional',
  strength: 5,
  certainty: 5,
  description: 'Диалектика раскрывает законы развития материи',
  traditions: ['marxism', 'dialectics'],
  philosophers: ['Marx', 'Engels'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
}]->(cat1);

MATCH (cat3:Category {category_id: '650e8400-e29b-41d4-a716-446655440003'})
MATCH (cat2:Category {category_id: '650e8400-e29b-41d4-a716-446655440002'})
CREATE (cat3)-[r4:RELATED_TO {
  relationship_id: '750e8400-e29b-41d4-a716-446655440004',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'functional',
  direction: 'unidirectional',
  strength: 4,
  certainty: 4,
  description: 'Диалектика объясняет развитие сознания',
  traditions: ['marxism', 'dialectics'],
  philosophers: ['Marx', 'Engels'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
}]->(cat2);

// Практика и Материя
MATCH (cat4:Category {category_id: '650e8400-e29b-41d4-a716-446655440004'})
MATCH (cat1:Category {category_id: '650e8400-e29b-41d4-a716-446655440001'})
CREATE (cat4)-[r5:RELATED_TO {
  relationship_id: '750e8400-e29b-41d4-a716-446655440005',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'causal',
  direction: 'unidirectional',
  strength: 5,
  certainty: 5,
  description: 'Практика есть способ воздействия на материальный мир',
  traditions: ['marxism'],
  philosophers: ['Marx', 'Engels'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
}]->(cat1);

// Практика и Сознание
MATCH (cat4:Category {category_id: '650e8400-e29b-41d4-a716-446655440004'})
MATCH (cat2:Category {category_id: '650e8400-e29b-41d4-a716-446655440002'})
CREATE (cat4)-[r6:RELATED_TO {
  relationship_id: '750e8400-e29b-41d4-a716-446655440006',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'dialectical',
  direction: 'bidirectional',
  strength: 5,
  certainty: 5,
  description: 'Практика - критерий истины и основа познания',
  traditions: ['marxism'],
  philosophers: ['Marx', 'Lenin'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
}]->(cat2)
CREATE (cat2)-[r7:RELATED_TO {
  relationship_id: '750e8400-e29b-41d4-a716-446655440007',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'dialectical',
  direction: 'bidirectional',
  strength: 5,
  certainty: 5,
  description: 'Сознание направляет и планирует практическую деятельность',
  traditions: ['marxism'],
  philosophers: ['Marx', 'Lenin'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
}]->(cat4);

// Противоречие и Диалектика
MATCH (cat5:Category {category_id: '650e8400-e29b-41d4-a716-446655440005'})
MATCH (cat3:Category {category_id: '650e8400-e29b-41d4-a716-446655440003'})
CREATE (cat5)-[r8:RELATED_TO {
  relationship_id: '750e8400-e29b-41d4-a716-446655440008',
  concept_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'hierarchical',
  direction: 'unidirectional',
  strength: 5,
  certainty: 5,
  description: 'Противоречие - ядро диалектики',
  traditions: ['marxism', 'dialectics'],
  philosophers: ['Hegel', 'Marx', 'Engels'],
  created_at: datetime('2024-01-01T00:00:00'),
  updated_at: datetime('2024-01-01T00:00:00')
}]->(cat3);

// Log seed completion
CALL apoc.log.info("Test graph seed data created successfully for concept: Диалектический материализм");
