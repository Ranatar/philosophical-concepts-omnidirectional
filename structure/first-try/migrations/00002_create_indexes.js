// migrations/00002_create_indexes.js

// Индексы для коллекции theses
db.theses.createIndex({ concept_id: 1 }, { name: "idx_theses_concept_id" });
db.theses.createIndex({ type: 1 }, { name: "idx_theses_type" });
db.theses.createIndex({ created_at: -1 }, { name: "idx_theses_created_at" });
db.theses.createIndex({ tags: 1 }, { name: "idx_theses_tags" });
db.theses.createIndex({ parent_theses: 1 }, { name: "idx_theses_parent_theses" });

// Составной индекс для частых запросов
db.theses.createIndex(
  { concept_id: 1, type: 1 },
  { name: "idx_theses_concept_type" }
);

// Текстовый индекс для поиска по содержанию
db.theses.createIndex(
  { content: "text", tags: "text" },
  { 
    name: "idx_theses_text_search",
    weights: { content: 10, tags: 5 },
    default_language: "russian"
  }
);

// Индексы для коллекции categoryDescriptions
db.categoryDescriptions.createIndex({ category_id: 1 }, { name: "idx_category_desc_category_id" });
db.categoryDescriptions.createIndex({ claude_generation_id: 1 }, { name: "idx_category_desc_claude_id" });
db.categoryDescriptions.createIndex({ created_at: -1 }, { name: "idx_category_desc_created_at" });

// Текстовый индекс для поиска по описаниям категорий
db.categoryDescriptions.createIndex(
  { detailed_description: "text" },
  { 
    name: "idx_category_desc_text_search",
    default_language: "russian"
  }
);

// Индексы для коллекции relationshipDescriptions
db.relationshipDescriptions.createIndex({ relationship_id: 1 }, { name: "idx_rel_desc_relationship_id" });
db.relationshipDescriptions.createIndex({ claude_generation_id: 1 }, { name: "idx_rel_desc_claude_id" });

// Индексы для коллекции conceptAnalyses
db.conceptAnalyses.createIndex({ concept_id: 1 }, { name: "idx_concept_analyses_concept_id" });
db.conceptAnalyses.createIndex({ analysis_type: 1 }, { name: "idx_concept_analyses_type" });
db.conceptAnalyses.createIndex({ created_at: -1 }, { name: "idx_concept_analyses_created_at" });

// Составной индекс для частых запросов
db.conceptAnalyses.createIndex(
  { concept_id: 1, analysis_type: 1 },
  { name: "idx_concept_analyses_concept_type" }
);

// Индексы для коллекции dialogues
db.dialogues.createIndex({ concept_ids: 1 }, { name: "idx_dialogues_concept_ids" });
db.dialogues.createIndex({ topic: 1 }, { name: "idx_dialogues_topic" });
db.dialogues.createIndex({ generated_at: -1 }, { name: "idx_dialogues_generated_at" });

// Текстовый индекс для поиска по диалогам
db.dialogues.createIndex(
  { topic: "text", content: "text" },
  { 
    name: "idx_dialogues_text_search",
    weights: { topic: 10, content: 5 },
    default_language: "russian"
  }
);

// Индексы для коллекции historicalContexts
db.historicalContexts.createIndex({ concept_id: 1 }, { name: "idx_historical_concept_id" });
db.historicalContexts.createIndex({ time_period: 1 }, { name: "idx_historical_time_period" });
db.historicalContexts.createIndex({ created_at: -1 }, { name: "idx_historical_created_at" });

// Индексы для коллекции practicalApplications
db.practicalApplications.createIndex({ concept_id: 1 }, { name: "idx_practical_concept_id" });
db.practicalApplications.createIndex({ "domains.domain_name": 1 }, { name: "idx_practical_domains" });
db.practicalApplications.createIndex({ created_at: -1 }, { name: "idx_practical_created_at" });

// Составной индекс для поиска по доменам и релевантности
db.practicalApplications.createIndex(
  { "domains.domain_name": 1, "domains.relevance_score": -1 },
  { name: "idx_practical_domain_relevance" }
);

// Индексы для коллекции conceptEvolutions
db.conceptEvolutions.createIndex({ concept_id: 1 }, { name: "idx_evolution_concept_id" });
db.conceptEvolutions.createIndex({ created_at: -1 }, { name: "idx_evolution_created_at" });

// TTL индекс для автоматического удаления старых версий эволюции
db.conceptEvolutions.createIndex(
  { created_at: 1 },
  { 
    name: "idx_evolution_ttl",
    expireAfterSeconds: 31536000 // 1 год
  }
);

// Создание представлений (views) для часто используемых запросов
db.createView(
  "recentTheses",
  "theses",
  [
    { $sort: { created_at: -1 } },
    { $limit: 100 },
    { $project: { 
      concept_id: 1, 
      type: 1, 
      content: 1, 
      created_at: 1 
    }}
  ]
);

db.createView(
  "conceptsWithDialogues",
  "dialogues",
  [
    { $unwind: "$concept_ids" },
    { $group: {
      _id: "$concept_ids",
      dialogue_count: { $sum: 1 },
      topics: { $addToSet: "$topic" }
    }},
    { $sort: { dialogue_count: -1 } }
  ]
);

// Комментарии к индексам
/*
Индексы спроектированы с учетом следующих паттернов использования:

1. Частые запросы по concept_id - основной способ связи с PostgreSQL
2. Фильтрация по типам (type, analysis_type) - для категоризации контента
3. Сортировка по датам (created_at) - для отображения последних изменений
4. Текстовый поиск - для поиска по содержанию тезисов и диалогов
5. Составные индексы - для оптимизации частых комбинаций фильтров

Рекомендации:
- Использовать explain() для анализа планов выполнения запросов
- Мониторить использование индексов через db.collection.stats()
- Периодически пересматривать индексы на основе реальных паттернов использования
*/
