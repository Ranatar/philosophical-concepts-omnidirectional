# Реализация структуры баз данных

Система использует полиглотную персистентность с тремя типами баз данных, каждая из которых оптимизирована для конкретного сценария использования.

## 1. Реляционная база данных (PostgreSQL)

Используется для хранения структурированных данных, метаданных и отношений между сущностями.

### Реализация схемы:

```sql
-- Пользователи
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    user_settings JSONB DEFAULT '{}'::JSONB
);

-- Философские концепции
CREATE TABLE concepts (
    concept_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(user_id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_synthesis BOOLEAN DEFAULT FALSE,
    parent_concepts JSONB DEFAULT '[]'::JSONB,
    synthesis_method VARCHAR(100),
    focus VARCHAR(100),
    innovation_degree INTEGER,
    historical_context VARCHAR(255)
);

-- Философы
CREATE TABLE philosophers (
    philosopher_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    birth_year INTEGER,
    death_year INTEGER,
    description TEXT,
    traditions JSONB DEFAULT '[]'::JSONB
);

-- Философские традиции
CREATE TABLE traditions (
    tradition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    time_period VARCHAR(255),
    description TEXT,
    key_figures JSONB DEFAULT '[]'::JSONB
);

-- Связь концепций с философами
CREATE TABLE concept_philosophers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    philosopher_id UUID NOT NULL REFERENCES philosophers(philosopher_id) ON DELETE CASCADE,
    relationship_type VARCHAR(100),
    UNIQUE(concept_id, philosopher_id)
);

-- Связь концепций с традициями
CREATE TABLE concept_traditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    tradition_id UUID NOT NULL REFERENCES traditions(tradition_id) ON DELETE CASCADE,
    relationship_strength FLOAT CHECK (relationship_strength BETWEEN 0 AND 1),
    UNIQUE(concept_id, tradition_id)
);

-- Активность пользователей
CREATE TABLE user_activity (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    target_id UUID,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB DEFAULT '{}'::JSONB
);

-- Взаимодействия с Claude
CREATE TABLE claude_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    concept_id UUID REFERENCES concepts(concept_id) ON DELETE SET NULL,
    query_type VARCHAR(100) NOT NULL,
    query_content TEXT NOT NULL,
    response_content TEXT,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_time FLOAT,
    status VARCHAR(50) DEFAULT 'in_progress',
    error_message TEXT
);

-- Названия концепций
CREATE TABLE concept_names (
    name_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    analysis TEXT,
    alternative_names JSONB DEFAULT '[]'::JSONB,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interaction_id UUID REFERENCES claude_interactions(interaction_id)
);

-- Происхождение концепций
CREATE TABLE concept_origins (
    origin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    parent_concepts JSONB DEFAULT '[]'::JSONB,
    influence_weights JSONB DEFAULT '[]'::JSONB,
    analysis TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interaction_id UUID REFERENCES claude_interactions(interaction_id)
);

-- Трансформации (между графами и тезисами)
CREATE TABLE transformations (
    transformation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    target_id UUID NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interaction_id UUID REFERENCES claude_interactions(interaction_id),
    transformation_details TEXT
);

-- Эволюция концепций
CREATE TABLE concept_evolutions (
    evolution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    target_concept_id UUID REFERENCES concepts(concept_id) ON DELETE SET NULL,
    evolution_context TEXT,
    suggested_changes JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interaction_id UUID REFERENCES claude_interactions(interaction_id)
);

-- Исторический контекст
CREATE TABLE historical_contexts (
    context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    time_period VARCHAR(255),
    historical_analysis TEXT,
    influences JSONB DEFAULT '[]'::JSONB,
    contemporaries JSONB DEFAULT '[]'::JSONB,
    subsequent_influence JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interaction_id UUID REFERENCES claude_interactions(interaction_id)
);

-- Практическое применение
CREATE TABLE practical_applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    domains JSONB DEFAULT '[]'::JSONB,
    application_analysis TEXT,
    implementation_methods JSONB DEFAULT '[]'::JSONB,
    relevance_mappings JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interaction_id UUID REFERENCES claude_interactions(interaction_id)
);

-- Диалогическая интерпретация
CREATE TABLE dialogue_interpretations (
    dialogue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    philosophical_question VARCHAR(255) NOT NULL,
    dialogue_content TEXT,
    discussion_points JSONB DEFAULT '[]'::JSONB,
    arguments JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interaction_id UUID REFERENCES claude_interactions(interaction_id)
);

-- Участники диалогов
CREATE TABLE dialogue_participants (
    participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dialogue_id UUID NOT NULL REFERENCES dialogue_interpretations(dialogue_id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    role VARCHAR(100),
    key_theses JSONB DEFAULT '[]'::JSONB,
    UNIQUE(dialogue_id, concept_id)
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX idx_concepts_creator ON concepts(creator_id);
CREATE INDEX idx_concepts_synthesis ON concepts(is_synthesis);
CREATE INDEX idx_claude_interactions_concept ON claude_interactions(concept_id);
CREATE INDEX idx_claude_interactions_user ON claude_interactions(user_id);
CREATE INDEX idx_user_activity_user ON user_activity(user_id);
CREATE INDEX idx_concept_names_concept ON concept_names(concept_id);
CREATE INDEX idx_concept_origins_concept ON concept_origins(concept_id);
```

### Реализация триггеров для обновления временных меток:

```sql
-- Триггер для обновления last_modified при изменении концепции
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER concepts_update_timestamp
BEFORE UPDATE ON concepts
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();
```

## 2. Графовая база данных (Neo4j)

Используется для эффективного хранения и обработки графов философских концепций.

### Реализация схемы:

```cypher
// Создание индексов для оптимизации запросов
CREATE INDEX concept_id_index FOR (c:Concept) ON (c.concept_id);
CREATE INDEX category_id_index FOR (c:Category) ON (c.category_id);
CREATE INDEX category_concept_index FOR (c:Category) ON (c.concept_id);

// Constraints для обеспечения уникальности
CREATE CONSTRAINT concept_id_unique FOR (c:Concept) REQUIRE c.concept_id IS UNIQUE;
CREATE CONSTRAINT category_id_unique FOR (c:Category) REQUIRE c.category_id IS UNIQUE;

// Пример создания концепции
CREATE (c:Concept {
    concept_id: "uuid-concept-1", 
    name: "Субъективный идеализм"
});

// Пример создания категорий
CREATE (c1:Category {
    category_id: "uuid-category-1",
    concept_id: "uuid-concept-1",
    name: "Субъективная реальность",
    definition: "Реальность, воспринимаемая субъектом познания",
    centrality: 0.9,
    certainty: 0.7,
    historical_significance: 0.8
});

CREATE (c2:Category {
    category_id: "uuid-category-2",
    concept_id: "uuid-concept-1", 
    name: "Интерсубъективность",
    definition: "Общность опыта между субъектами",
    centrality: 0.7,
    certainty: 0.6,
    historical_significance: 0.5
});

// Создание связи от концепции к категориям
MATCH (concept:Concept {concept_id: "uuid-concept-1"})
MATCH (category:Category {category_id: "uuid-category-1"})
CREATE (concept)-[:INCLUDES]->(category);

MATCH (concept:Concept {concept_id: "uuid-concept-1"})
MATCH (category:Category {category_id: "uuid-category-2"})
CREATE (concept)-[:INCLUDES]->(category);

// Создание связи между категориями
MATCH (c1:Category {category_id: "uuid-category-1"})
MATCH (c2:Category {category_id: "uuid-category-2"})
CREATE (c1)-[:RELATED_TO {
    relationship_id: "uuid-relationship-1",
    type: "диалектическая",
    direction: "bidirectional",
    strength: 0.8,
    certainty: 0.6,
    traditions: ["феноменология", "экзистенциализм"],
    philosophers: ["Гуссерль", "Сартр"]
}]->(c2);
```

### Функции обработки графов:

```cypher
// Процедура для получения полного графа концепции
CALL apoc.custom.declareFunction("getConceptGraph", 
  "MATCH (c:Concept {concept_id: $concept_id})-[:INCLUDES]->(cat:Category)
   WITH cat
   OPTIONAL MATCH (cat)-[r:RELATED_TO]->(cat2:Category)
   WHERE cat2.concept_id = $concept_id
   RETURN cat, r, cat2",
  "READ", [["concept_id", "String"]], "Map");

// Процедура для вычисления центральности категорий
CALL apoc.custom.declareFunction("calculateCategoryCentrality",
  "MATCH (c:Category {concept_id: $concept_id})
   CALL apoc.algo.pageRank(c, 0.85, 20) YIELD node, score
   SET node.centrality = score
   RETURN node.category_id as category_id, score as centrality",
  "WRITE", [["concept_id", "String"]], "Map");
```

## 3. Документная база данных (MongoDB)

Используется для хранения текстовых данных, тезисов и результатов взаимодействия с Claude.

### Реализация схемы:

```javascript
// Создание коллекций и валидаторов схем

// Тезисы
db.createCollection("Theses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["thesis_id", "concept_id", "type", "content"],
      properties: {
        thesis_id: { bsonType: "objectId" },
        concept_id: { bsonType: "string" },
        type: { bsonType: "string" },
        content: { bsonType: "string" },
        related_categories: { 
          bsonType: "array", 
          items: { bsonType: "string" }
        },
        style: { bsonType: "string" },
        generation_parameters: {
          bsonType: "object",
          properties: {
            level_detail: { bsonType: "number" },
            focus: { bsonType: "string" },
            quantity: { bsonType: "number" }
          }
        },
        created_at: { bsonType: "date" },
        parent_theses: { 
          bsonType: "array", 
          items: { bsonType: "objectId" }
        }
      }
    }
  }
});

// Описания категорий
db.createCollection("CategoryDescriptions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["description_id", "category_id", "detailed_description"],
      properties: {
        description_id: { bsonType: "objectId" },
        category_id: { bsonType: "string" },
        detailed_description: { bsonType: "string" },
        alternative_interpretations: { 
          bsonType: "array", 
          items: { bsonType: "string" }
        },
        historical_analogues: { 
          bsonType: "array", 
          items: { 
            bsonType: "object",
            properties: {
              analogue_name: { bsonType: "string" },
              philosopher: { bsonType: "string" },
              tradition: { bsonType: "string" },
              description: { bsonType: "string" }
            }
          }
        },
        related_concepts: { 
          bsonType: "array", 
          items: { 
            bsonType: "object",
            properties: {
              concept_id: { bsonType: "string" },
              relationship_type: { bsonType: "string" },
              description: { bsonType: "string" }
            }
          }
        },
        claude_generation_id: { bsonType: "string" },
        created_at: { bsonType: "date" },
        last_modified: { bsonType: "date" }
      }
    }
  }
});

// Описания связей
db.createCollection("RelationshipDescriptions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["description_id", "relationship_id", "philosophical_foundation"],
      properties: {
        description_id: { bsonType: "objectId" },
        relationship_id: { bsonType: "string" },
        philosophical_foundation: { bsonType: "string" },
        counterarguments: { 
          bsonType: "array", 
          items: { bsonType: "string" }
        },
        analogues: { 
          bsonType: "array", 
          items: { 
            bsonType: "object",
            properties: {
              tradition: { bsonType: "string" },
              philosopher: { bsonType: "string" },
              description: { bsonType: "string" }
            }
          }
        },
        claude_generation_id: { bsonType: "string" },
        created_at: { bsonType: "date" },
        last_modified: { bsonType: "date" }
      }
    }
  }
});

// Создаем индексы для оптимизации запросов
db.Theses.createIndex({ "concept_id": 1 });
db.Theses.createIndex({ "type": 1 });
db.Theses.createIndex({ "created_at": -1 });

db.CategoryDescriptions.createIndex({ "category_id": 1 });
db.CategoryDescriptions.createIndex({ "created_at": -1 });

db.RelationshipDescriptions.createIndex({ "relationship_id": 1 });
db.RelationshipDescriptions.createIndex({ "created_at": -1 });

// Остальные коллекции (ConceptAnalyses, Dialogues, HistoricalContexts, 
// PracticalApplications, ConceptEvolutions) создаются аналогично
// в соответствии с предоставленной в документации схемой

// Пример вставки тезиса
db.Theses.insertOne({
  thesis_id: new ObjectId(),
  concept_id: "uuid-concept-1",
  type: "онтологический",
  content: "Реальность существует только в восприятии субъекта познания.",
  related_categories: ["uuid-category-1", "uuid-category-2"],
  style: "академический",
  generation_parameters: {
    level_detail: 0.8,
    focus: "онтология",
    quantity: 5
  },
  created_at: new Date(),
  parent_theses: []
});
```

### Реализация JavaScript функций для работы с документной БД:

```javascript
// Пример функции для получения тезисов концепции
async function getConceptTheses(conceptId, type = null, limit = 100, skip = 0) {
  const query = { concept_id: conceptId };
  
  if (type) {
    query.type = type;
  }
  
  return await db.collection('Theses')
    .find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

// Функция для обогащения категории
async function saveCategoryEnrichment(categoryId, enrichmentData, claudeInteractionId) {
  const now = new Date();
  
  const enrichment = {
    description_id: new ObjectId(),
    category_id: categoryId,
    detailed_description: enrichmentData.detailedDescription,
    alternative_interpretations: enrichmentData.alternativeInterpretations || [],
    historical_analogues: enrichmentData.historicalAnalogues || [],
    related_concepts: enrichmentData.relatedConcepts || [],
    claude_generation_id: claudeInteractionId,
    created_at: now,
    last_modified: now
  };
  
  return await db.collection('CategoryDescriptions').insertOne(enrichment);
}

// Функция для получения исторического контекста концепции
async function getHistoricalContext(conceptId) {
  return await db.collection('HistoricalContexts')
    .findOne({ concept_id: conceptId }, { sort: { created_at: -1 } });
}
```

## 4. Связь между базами данных

Одна из главных особенностей архитектуры — использование разных типов баз данных, которые должны работать согласованно. Связи между ними обеспечиваются через общие идентификаторы:

```javascript
// Пример сервиса, связывающего реляционную и графовую БД
class ConceptGraphService {
  // Создание категории с записью в Neo4j и связью с концепцией в PostgreSQL
  async createCategory(conceptId, categoryData) {
    // 1. Проверка существования концепции в PostgreSQL
    const conceptExists = await this.pgClient.query(
      'SELECT EXISTS(SELECT 1 FROM concepts WHERE concept_id = $1)',
      [conceptId]
    );
    
    if (!conceptExists.rows[0].exists) {
      throw new Error('Concept not found');
    }
    
    // 2. Генерация UUID для категории
    const categoryId = uuidv4();
    
    // 3. Создание категории в Neo4j
    const session = this.driver.session();
    try {
      await session.run(
        `CREATE (c:Category {
          category_id: $categoryId,
          concept_id: $conceptId,
          name: $name,
          definition: $definition,
          centrality: $centrality,
          certainty: $certainty,
          historical_significance: $historicalSignificance
        })`,
        {
          categoryId,
          conceptId,
          name: categoryData.name,
          definition: categoryData.definition,
          centrality: categoryData.centrality || 0.5,
          certainty: categoryData.certainty || 0.5,
          historical_significance: categoryData.historicalSignificance || 0.5
        }
      );
      
      // 4. Создание связи между концепцией и категорией
      await session.run(
        `MATCH (concept:Concept {concept_id: $conceptId})
         MATCH (category:Category {category_id: $categoryId})
         CREATE (concept)-[:INCLUDES]->(category)`,
        { conceptId, categoryId }
      );
      
      return { categoryId, ...categoryData };
    } finally {
      session.close();
    }
  }
  
  // Получение полного графа концепции с обогащением данными из MongoDB
  async getEnrichedConceptGraph(conceptId) {
    // 1. Получение графа из Neo4j
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (c:Concept {concept_id: $conceptId})-[:INCLUDES]->(cat:Category)
         WITH cat
         OPTIONAL MATCH (cat)-[r:RELATED_TO]->(cat2:Category)
         WHERE cat2.concept_id = $conceptId
         RETURN cat, r, cat2`,
        { conceptId }
      );
      
      const nodes = [];
      const edges = [];
      const processedNodes = new Set();
      
      // Преобразование результатов в структурированный граф
      result.records.forEach(record => {
        const cat1 = record.get('cat').properties;
        
        if (!processedNodes.has(cat1.category_id)) {
          nodes.push({
            id: cat1.category_id,
            name: cat1.name,
            definition: cat1.definition,
            centrality: parseFloat(cat1.centrality),
            certainty: parseFloat(cat1.certainty),
            historicalSignificance: parseFloat(cat1.historical_significance)
          });
          processedNodes.add(cat1.category_id);
        }
        
        const relationship = record.get('r');
        const cat2 = record.get('cat2');
        
        if (relationship && cat2) {
          const cat2Props = cat2.properties;
          
          if (!processedNodes.has(cat2Props.category_id)) {
            nodes.push({
              id: cat2Props.category_id,
              name: cat2Props.name,
              definition: cat2Props.definition,
              centrality: parseFloat(cat2Props.centrality),
              certainty: parseFloat(cat2Props.certainty),
              historicalSignificance: parseFloat(cat2Props.historical_significance)
            });
            processedNodes.add(cat2Props.category_id);
          }
          
          const relProps = relationship.properties;
          edges.push({
            id: relProps.relationship_id,
            source: cat1.category_id,
            target: cat2Props.category_id,
            type: relProps.type,
            direction: relProps.direction,
            strength: parseFloat(relProps.strength),
            certainty: parseFloat(relProps.certainty),
            traditions: relProps.traditions,
            philosophers: relProps.philosophers
          });
        }
      });
      
      // 2. Обогащение данными из MongoDB (если есть)
      const enrichedNodes = await Promise.all(nodes.map(async node => {
        const enrichment = await this.mongoClient
          .collection('CategoryDescriptions')
          .findOne({ category_id: node.id }, { sort: { created_at: -1 } });
        
        if (enrichment) {
          return {
            ...node,
            detailedDescription: enrichment.detailed_description,
            alternativeInterpretations: enrichment.alternative_interpretations,
            historicalAnalogues: enrichment.historical_analogues
          };
        }
        return node;
      }));
      
      const enrichedEdges = await Promise.all(edges.map(async edge => {
        const enrichment = await this.mongoClient
          .collection('RelationshipDescriptions')
          .findOne({ relationship_id: edge.id }, { sort: { created_at: -1 } });
        
        if (enrichment) {
          return {
            ...edge,
            philosophicalFoundation: enrichment.philosophical_foundation,
            counterarguments: enrichment.counterarguments,
            analogues: enrichment.analogues
          };
        }
        return edge;
      }));
      
      return { nodes: enrichedNodes, edges: enrichedEdges };
    } finally {
      session.close();
    }
  }
}
```

## 5. Управление транзакциями между базами данных

Поскольку используются различные базы данных, важно обеспечить согласованность между ними.

```javascript
// Пример сервиса для управления транзакциями между базами
class TransactionalService {
  constructor(pgPool, neo4jDriver, mongoClient) {
    this.pgPool = pgPool;
    this.neo4jDriver = neo4jDriver;
    this.mongoClient = mongoClient;
  }
  
  // Метод для операций, требующих согласованности между базами данных
  async executeWithConsistency(operations) {
    // Начинаем транзакцию в PostgreSQL
    const pgClient = await this.pgPool.connect();
    // Создаем сессию в Neo4j
    const neo4jSession = this.neo4jDriver.session();
    // Получаем сессию MongoDB
    const mongoSession = this.mongoClient.startSession();
    
    try {
      // Начинаем транзакции
      await pgClient.query('BEGIN');
      const neo4jTx = neo4jSession.beginTransaction();
      mongoSession.startTransaction();
      
      // Выполняем операции
      for (const operation of operations) {
        await operation({ pgClient, neo4jTx, mongoSession });
      }
      
      // Завершаем транзакции
      await pgClient.query('COMMIT');
      await neo4jTx.commit();
      await mongoSession.commitTransaction();
      
      return { success: true };
    } catch (error) {
      // Откатываем транзакции в случае ошибки
      await pgClient.query('ROLLBACK');
      await neo4jSession.close();
      await mongoSession.abortTransaction();
      
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      // Освобождаем ресурсы
      pgClient.release();
      neo4jSession.close();
      mongoSession.endSession();
    }
  }
  
  // Пример использования для создания концепции и её структуры
  async createConceptWithStructure(userData, conceptData, categories, relationships) {
    return this.executeWithConsistency([
      // 1. Создание концепции в PostgreSQL
      async ({ pgClient }) => {
        const result = await pgClient.query(
          `INSERT INTO concepts 
           (creator_id, name, description, is_synthesis, parent_concepts, synthesis_method, focus, innovation_degree)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING concept_id`,
          [
            userData.userId,
            conceptData.name,
            conceptData.description,
            conceptData.isSynthesis || false,
            JSON.stringify(conceptData.parentConcepts || []),
            conceptData.synthesisMethod,
            conceptData.focus,
            conceptData.innovationDegree
          ]
        );
        return { conceptId: result.rows[0].concept_id };
      },
      
      // 2. Создание концепции в Neo4j
      async ({ neo4jTx, conceptId }) => {
        await neo4jTx.run(
          `CREATE (c:Concept {concept_id: $conceptId, name: $name})`,
          { conceptId, name: conceptData.name }
        );
      },
      
      // 3. Создание категорий в Neo4j
      async ({ neo4jTx, conceptId }) => {
        for (const category of categories) {
          const categoryId = uuidv4();
          await neo4jTx.run(
            `CREATE (c:Category {
              category_id: $categoryId,
              concept_id: $conceptId,
              name: $name,
              definition: $definition,
              centrality: $centrality,
              certainty: $certainty,
              historical_significance: $historicalSignificance
            })`,
            {
              categoryId,
              conceptId,
              name: category.name,
              definition: category.definition,
              centrality: category.centrality || 0.5,
              certainty: category.certainty || 0.5,
              historical_significance: category.historicalSignificance || 0.5
            }
          );
          
          // Создание связи концепция-категория
          await neo4jTx.run(
            `MATCH (concept:Concept {concept_id: $conceptId})
             MATCH (category:Category {category_id: $categoryId})
             CREATE (concept)-[:INCLUDES]->(category)`,
            { conceptId, categoryId }
          );
          
          // Сохраняем ID категории для создания связей
          category.id = categoryId;
        }
      },
      
      // 4. Создание связей между категориями
      async ({ neo4jTx }) => {
        for (const rel of relationships) {
          const relationshipId = uuidv4();
          const sourceCategory = categories.find(c => c.name === rel.source);
          const targetCategory = categories.find(c => c.name === rel.target);
          
          if (sourceCategory && targetCategory) {
            await neo4jTx.run(
              `MATCH (source:Category {category_id: $sourceId})
               MATCH (target:Category {category_id: $targetId})
               CREATE (source)-[:RELATED_TO {
                 relationship_id: $relationshipId,
                 type: $type,
                 direction: $direction,
                 strength: $strength,
                 certainty: $certainty,
                 traditions: $traditions,
                 philosophers: $philosophers
               }]->(target)`,
              {
                sourceId: sourceCategory.id,
                targetId: targetCategory.id,
                relationshipId,
                type: rel.type,
                direction: rel.direction || 'directed',
                strength: rel.strength || 0.5,
                certainty: rel.certainty || 0.5,
                traditions: rel.traditions || [],
                philosophers: rel.philosophers || []
              }
            );
          }
        }
      },
      
      // 5. Создание записи о действии пользователя
      async ({ pgClient, conceptId }) => {
        await pgClient.query(
          `INSERT INTO user_activity 
           (user_id, activity_type, target_id, details)
           VALUES ($1, $2, $3, $4)`,
          [
            userData.userId,
            'create_concept',
            conceptId,
            JSON.stringify({ name: conceptData.name })
          ]
        );
      }
    ]);
  }
}
```

## 6. Миграции и управление схемой баз данных

Для управления схемами баз данных используются инструменты миграции:

```javascript
// Пример миграции для PostgreSQL с использованием node-pg-migrate
// migrations/20240430123456_create_initial_schema.js
exports.up = pgm => {
  // Создание таблиц
  pgm.createTable('users', {
    user_id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    username: { type: 'varchar(100)', notNull: true, unique: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    last_login: { type: 'timestamp with time zone' },
    user_settings: { type: 'jsonb', notNull: true, default: '{}' }
  });
  
  pgm.createTable('concepts', {
    // ... (схема из раздела 1)
  });
  
  // ... другие таблицы
  
  // Создание индексов
  pgm.createIndex('concepts', 'creator_id');
  // ... другие индексы
  
  // Создание триггеров
  pgm.createFunction(
    'update_modified_timestamp',
    [],
    { returns: 'trigger', language: 'plpgsql' },
    `
    BEGIN
        NEW.last_modified = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    `
  );
  
  pgm.createTrigger('concepts', 'concepts_update_timestamp', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'update_modified_timestamp'
  });
};

exports.down = pgm => {
  // Откат изменений в обратном порядке
  pgm.dropTrigger('concepts', 'concepts_update_timestamp');
  pgm.dropFunction('update_modified_timestamp', []);
  pgm.dropTable('concepts');
  pgm.dropTable('users');
  // ... другие таблицы
};
```

```javascript
// Пример миграции для MongoDB с использованием mongodb-migrate
// migrations/20240430123457_create_mongodb_collections.js
module.exports = {
  async up(db) {
    await db.createCollection("Theses", {
      validator: {
        $jsonSchema: {
          // ... (схема из раздела 3)
        }
      }
    });
    
    // ... другие коллекции
    
    await db.collection('Theses').createIndex({ "concept_id": 1 });
    await db.collection('Theses').createIndex({ "type": 1 });
    await db.collection('Theses').createIndex({ "created_at": -1 });
    
    // ... другие индексы
  },
  
  async down(db) {
    await db.collection('Theses').drop();
    // ... другие коллекции
  }
};
```

```javascript
// Пример миграции для Neo4j с использованием neo4j-migrate
// migrations/20240430123458_create_neo4j_schema.js
exports.up = async function(next) {
  const session = driver.session();
  try {
    // Создание индексов
    await session.run(`CREATE INDEX concept_id_index FOR (c:Concept) ON (c.concept_id)`);
    await session.run(`CREATE INDEX category_id_index FOR (c:Category) ON (c.category_id)`);
    await session.run(`CREATE INDEX category_concept_index FOR (c:Category) ON (c.concept_id)`);
    
    // Constraints
    await session.run(`CREATE CONSTRAINT concept_id_unique FOR (c:Concept) REQUIRE c.concept_id IS UNIQUE`);
    await session.run(`CREATE CONSTRAINT category_id_unique FOR (c:Category) REQUIRE c.category_id IS UNIQUE`);
    
    next();
  } catch (error) {
    next(error);
  } finally {
    session.close();
  }
};

exports.down = async function(next) {
  const session = driver.session();
  try {
    // Удаление constraints
    await session.run(`DROP CONSTRAINT concept_id_unique IF EXISTS`);
    await session.run(`DROP CONSTRAINT category_id_unique IF EXISTS`);
    
    // Удаление индексов
    await session.run(`DROP INDEX concept_id_index IF EXISTS`);
    await session.run(`DROP INDEX category_id_index IF EXISTS`);
    await session.run(`DROP INDEX category_concept_index IF EXISTS`);
    
    next();
  } catch (error) {
    next(error);
  } finally {
    session.close();
  }
};
```

## 7. Модели данных и объектно-реляционное отображение

Для удобства работы с данными создаются объектные модели:

```javascript
// Пример реализации модели для концепции
class Concept {
  constructor(data) {
    this.id = data.concept_id;
    this.creatorId = data.creator_id;
    this.name = data.name;
    this.description = data.description;
    this.creationDate = data.creation_date;
    this.lastModified = data.last_modified;
    this.isSynthesis = data.is_synthesis;
    this.parentConcepts = data.parent_concepts;
    this.synthesisMethod = data.synthesis_method;
    this.focus = data.focus;
    this.innovationDegree = data.innovation_degree;
    this.historicalContext = data.historical_context;
    
    // Свойства для работы с другими базами
    this.graph = null; // Для графа из Neo4j
    this.theses = []; // Для тезисов из MongoDB
  }
  
  // Метод для загрузки графа концепции из Neo4j
  async loadGraph(neo4jService) {
    this.graph = await neo4jService.getConceptGraph(this.id);
    return this.graph;
  }
  
  // Метод для загрузки тезисов из MongoDB
  async loadTheses(thesisService) {
    this.theses = await thesisService.getConceptTheses(this.id);
    return this.theses;
  }
  
  // Метод для сохранения изменений в PostgreSQL
  async save(pgClient) {
    const result = await pgClient.query(
      `UPDATE concepts SET 
       name = $1,
       description = $2,
       is_synthesis = $3,
       parent_concepts = $4,
       synthesis_method = $5,
       focus = $6,
       innovation_degree = $7,
       historical_context = $8
       WHERE concept_id = $9
       RETURNING last_modified`,
      [
        this.name,
        this.description,
        this.isSynthesis,
        JSON.stringify(this.parentConcepts),
        this.synthesisMethod,
        this.focus,
        this.innovationDegree,
        this.historicalContext,
        this.id
      ]
    );
    
    if (result.rowCount > 0) {
      this.lastModified = result.rows[0].last_modified;
      return true;
    }
    return false;
  }
  
  // Метод для создания новой концепции
  static async create(pgClient, data) {
    const result = await pgClient.query(
      `INSERT INTO concepts
       (creator_id, name, description, is_synthesis, parent_concepts, synthesis_method, focus, innovation_degree, historical_context)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.creatorId,
        data.name,
        data.description,
        data.isSynthesis || false,
        JSON.stringify(data.parentConcepts || []),
        data.synthesisMethod,
        data.focus,
        data.innovationDegree,
        data.historicalContext
      ]
    );
    
    if (result.rowCount > 0) {
      return new Concept(result.rows[0]);
    }
    return null;
  }
  
  // Метод для получения концепции по ID
  static async findById(pgClient, id) {
    const result = await pgClient.query(
      'SELECT * FROM concepts WHERE concept_id = $1',
      [id]
    );
    
    if (result.rowCount > 0) {
      return new Concept(result.rows[0]);
    }
    return null;
  }
}
```

```javascript
// Пример реализации модели для категории
class Category {
  constructor(data) {
    this.id = data.category_id;
    this.conceptId = data.concept_id;
    this.name = data.name;
    this.definition = data.definition;
    this.centrality = parseFloat(data.centrality);
    this.certainty = parseFloat(data.certainty);
    this.historicalSignificance = parseFloat(data.historical_significance);
    
    // Свойства из MongoDB, если есть
    this.detailedDescription = data.detailed_description;
    this.alternativeInterpretations = data.alternative_interpretations || [];
    this.historicalAnalogues = data.historical_analogues || [];
    this.relatedConcepts = data.related_concepts || [];
  }
  
  // Метод для сохранения категории в Neo4j
  async save(neo4jDriver) {
    const session = neo4jDriver.session();
    try {
      await session.run(
        `MATCH (c:Category {category_id: $id})
         SET c.name = $name,
             c.definition = $definition,
             c.centrality = $centrality,
             c.certainty = $certainty,
             c.historical_significance = $historicalSignificance`,
        {
          id: this.id,
          name: this.name,
          definition: this.definition,
          centrality: this.centrality,
          certainty: this.certainty,
          historicalSignificance: this.historicalSignificance
        }
      );
      return true;
    } catch (error) {
      console.error('Error saving category:', error);
      return false;
    } finally {
      session.close();
    }
  }
  
  // Метод для загрузки обогащенного описания из MongoDB
  async loadEnrichment(mongoClient) {
    const enrichment = await mongoClient
      .collection('CategoryDescriptions')
      .findOne({ category_id: this.id }, { sort: { created_at: -1 } });
    
    if (enrichment) {
      this.detailedDescription = enrichment.detailed_description;
      this.alternativeInterpretations = enrichment.alternative_interpretations;
      this.historicalAnalogues = enrichment.historical_analogues;
      this.relatedConcepts = enrichment.related_concepts;
      return true;
    }
    return false;
  }
  
  // Метод для сохранения обогащенного описания в MongoDB
  async saveEnrichment(mongoClient, claudeInteractionId) {
    const now = new Date();
    
    const enrichment = {
      description_id: new ObjectId(),
      category_id: this.id,
      detailed_description: this.detailedDescription,
      alternative_interpretations: this.alternativeInterpretations,
      historical_analogues: this.historicalAnalogues,
      related_concepts: this.relatedConcepts,
      claude_generation_id: claudeInteractionId,
      created_at: now,
      last_modified: now
    };
    
    const result = await mongoClient
      .collection('CategoryDescriptions')
      .insertOne(enrichment);
    
    return result.acknowledged;
  }
  
  // Метод для получения категории по ID
  static async findById(neo4jDriver, id) {
    const session = neo4jDriver.session();
    try {
      const result = await session.run(
        'MATCH (c:Category {category_id: $id}) RETURN c',
        { id }
      );
      
      if (result.records.length > 0) {
        return new Category(result.records[0].get('c').properties);
      }
      return null;
    } finally {
      session.close();
    }
  }
}
```

```javascript
// Пример реализации модели для тезиса
class Thesis {
  constructor(data) {
    this.id = data.thesis_id;
    this.conceptId = data.concept_id;
    this.type = data.type;
    this.content = data.content;
    this.relatedCategories = data.related_categories || [];
    this.style = data.style;
    this.generationParameters = data.generation_parameters || {};
    this.createdAt = data.created_at;
    this.parentTheses = data.parent_theses || [];
  }
  
  // Метод для сохранения тезиса в MongoDB
  async save(mongoClient) {
    const collection = mongoClient.collection('Theses');
    
    if (this.id) {
      // Обновление существующего тезиса
      const result = await collection.updateOne(
        { thesis_id: this.id },
        {
          $set: {
            concept_id: this.conceptId,
            type: this.type,
            content: this.content,
            related_categories: this.relatedCategories,
            style: this.style,
            generation_parameters: this.generationParameters,
            parent_theses: this.parentTheses
          }
        }
      );
      return result.modifiedCount > 0;
    } else {
      // Создание нового тезиса
      this.id = new ObjectId();
      this.createdAt = new Date();
      
      const result = await collection.insertOne({
        thesis_id: this.id,
        concept_id: this.conceptId,
        type: this.type,
        content: this.content,
        related_categories: this.relatedCategories,
        style: this.style,
        generation_parameters: this.generationParameters,
        created_at: this.createdAt,
        parent_theses: this.parentTheses
      });
      
      return result.acknowledged;
    }
  }
  
  // Метод для получения тезиса по ID
  static async findById(mongoClient, id) {
    const thesis = await mongoClient
      .collection('Theses')
      .findOne({ thesis_id: id });
    
    return thesis ? new Thesis(thesis) : null;
  }
  
  // Метод для получения тезисов концепции
  static async findByConceptId(mongoClient, conceptId, options = {}) {
    const query = { concept_id: conceptId };
    
    if (options.type) {
      query.type = options.type;
    }
    
    const theses = await mongoClient
      .collection('Theses')
      .find(query)
      .sort({ created_at: options.sort === 'asc' ? 1 : -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 100)
      .toArray();
    
    return theses.map(thesis => new Thesis(thesis));
  }
}
```

## 8. Инициализация соединений с базами данных

```javascript
// Пример инициализации соединений
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const neo4j = require('neo4j-driver');

// Конфигурация из переменных окружения или файла конфигурации
const config = {
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'philos_concepts',
    user: process.env.PG_USER || 'philos',
    password: process.env.PG_PASSWORD || 'password'
  },
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password'
  },
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/philos_concepts',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  }
};

// Инициализация соединений
class DatabaseConnections {
  constructor() {
    this.pgPool = null;
    this.neo4jDriver = null;
    this.mongoClient = null;
  }
  
  async initialize() {
    // Подключение к PostgreSQL
    this.pgPool = new Pool(config.postgres);
    
    // Проверка соединения с PostgreSQL
    try {
      const client = await this.pgPool.connect();
      console.log('PostgreSQL connection successful');
      client.release();
    } catch (err) {
      console.error('PostgreSQL connection error:', err);
      throw err;
    }
    
    // Подключение к Neo4j
    this.neo4jDriver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
    );
    
    // Проверка соединения с Neo4j
    try {
      const session = this.neo4jDriver.session();
      await session.run('RETURN 1');
      console.log('Neo4j connection successful');
      session.close();
    } catch (err) {
      console.error('Neo4j connection error:', err);
      throw err;
    }
    
    // Подключение к MongoDB
    try {
      this.mongoClient = new MongoClient(config.mongodb.uri, config.mongodb.options);
      await this.mongoClient.connect();
      console.log('MongoDB connection successful');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err;
    }
    
    return this;
  }
  
  async close() {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    
    if (this.neo4jDriver) {
      await this.neo4jDriver.close();
    }
    
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
    
    console.log('All database connections closed');
  }
}

module.exports = new DatabaseConnections();
```

## 9. Контроль доступа и безопасность

Для обеспечения безопасности доступа к базам данных:

```javascript
// Пример создания и использования ролей в PostgreSQL
/* 
CREATE ROLE philos_read WITH LOGIN PASSWORD 'read_password';
CREATE ROLE philos_write WITH LOGIN PASSWORD 'write_password';

GRANT SELECT ON ALL TABLES IN SCHEMA public TO philos_read;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO philos_write;
*/

// Пример управления доступом в Neo4j
/*
CREATE ROLE philos_read
CREATE ROLE philos_write

GRANT MATCH {*} ON GRAPH * NODES * TO philos_read
GRANT MATCH {*}, WRITE ON GRAPH * NODES *, RELATIONSHIPS * TO philos_write
*/

// Пример управления доступом в MongoDB
/* 
db.createUser({
  user: "philos_read",
  pwd: "read_password",
  roles: [{ role: "read", db: "philos_concepts" }]
})

db.createUser({
  user: "philos_write",
  pwd: "write_password",
  roles: [{ role: "readWrite", db: "philos_concepts" }]
})
*/

// Пример использования разных соединений в зависимости от операции
class SecureDbConnections {
  constructor() {
    // Соединения для чтения
    this.pgPoolRead = new Pool({
      ...config.postgres,
      user: 'philos_read',
      password: 'read_password'
    });
    
    this.neo4jDriverRead = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic('philos_read', 'read_password')
    );
    
    this.mongoClientRead = new MongoClient(
      config.mongodb.uri.replace('://philos:', '://philos_read:').replace('password', 'read_password'),
      config.mongodb.options
    );
    
    // Соединения для записи
    this.pgPoolWrite = new Pool({
      ...config.postgres,
      user: 'philos_write',
      password: 'write_password'
    });
    
    this.neo4jDriverWrite = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic('philos_write', 'write_password')
    );
    
    this.mongoClientWrite = new MongoClient(
      config.mongodb.uri.replace('://philos:', '://philos_write:').replace('password', 'write_password'),
      config.mongodb.options
    );
  }
  
  // Получение соединения в зависимости от типа операции
  getConnections(operation = 'read') {
    if (operation === 'write') {
      return {
        pgPool: this.pgPoolWrite,
        neo4jDriver: this.neo4jDriverWrite,
        mongoClient: this.mongoClientWrite.db()
      };
    }
    
    return {
      pgPool: this.pgPoolRead,
      neo4jDriver: this.neo4jDriverRead,
      mongoClient: this.mongoClientRead.db()
    };
  }
}
```

## 10. Заключение

Структура баз данных в данном проекте представляет собой продуманную полиглотную систему, которая использует преимущества разных типов баз данных:

- **PostgreSQL** для хранения структурированных данных пользователей, концепций и их метаданных
- **Neo4j** для эффективной работы с графовыми представлениями философских концепций
- **MongoDB** для хранения неструктурированных данных, тезисов и результатов анализа

Для обеспечения согласованности между базами данных используются транзакционные механизмы, а для удобства работы с данными - объектно-реляционное отображение. Безопасность доступа обеспечивается ролевой моделью с разделением прав на чтение и запись.

Данная архитектура баз данных позволяет эффективно хранить и обрабатывать сложные философские концепции, их графовые представления, тезисы и результаты интеллектуального анализа с использованием Claude.
